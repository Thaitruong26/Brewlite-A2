import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  HttpException,
  UnprocessableEntityException,
  Optional,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { LoyaltyService } from '../loyalty/loyalty.service.js';
import {
  CreatePaymentDto,
  MockPaymentResult,
} from './dto/create-payment.dto.js';
import { assertTransition } from '../orders/order-state.js';
import {
  OrdersService,
  ORDER_PAYMENT_TIMEOUT_MS,
} from '../orders/orders.service.js';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loyaltyService: LoyaltyService,
    @Optional() private readonly ordersService?: OrdersService,
  ) {}

  async createPayment(
    dto: CreatePaymentDto,
    idempotencyKey: string,
    user?: { id: number; role?: string },
    res?: any,
  ) {
    // 1. Validate idempotency key
    if (!idempotencyKey?.trim()) {
      throw new BadRequestException('Idempotency-Key is required');
    }

    const normalizedKey = idempotencyKey.trim();

    // 2. Create request hash
    const normalizedRequest = {
      orderId: dto.orderId,
      method: dto.method,
      mockResult: dto.mockResult ?? null,
    };

    const requestHash = createHash('sha256')
      .update(JSON.stringify(normalizedRequest))
      .digest('hex');

    // 3. Check idempotent request
    const existing = await this.prisma.payment.findUnique({
      where: { idempotencyKey: normalizedKey },
    });

    if (existing) {
      if (existing.requestHash !== requestHash) {
        throw new UnprocessableEntityException({
          code: 'IDEMPOTENCY_KEY_REUSED',
          message: 'Idempotency-Key was used with a different request',
        });
      }

      if (res && typeof res.setHeader === 'function') {
        res.setHeader('Idempotent-Replayed', 'true');
      }

      if (existing.status === 'FAILED') {
        const snapshot = existing.responseSnapshot;

        throw new HttpException(
          snapshot && typeof snapshot === 'object' && !Array.isArray(snapshot)
            ? snapshot
            : { message: 'Payment failed' },
          402,
        );
      }

      return existing.responseSnapshot ?? existing;
    }

    // 4. Find order
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // 5. Check ownership
    if (user && order.userId !== user.id && user.role !== 'BARISTA') {
      throw new ForbiddenException(
        'Bạn không có quyền thanh toán đơn hàng này',
      );
    }

    // 6. Check order status
    if (
      order.status !== 'PENDING' &&
      order.status !== 'PAYMENT_FAILED'
    ) {
      throw new BadRequestException({
        code: 'ORDER_NOT_AVAILABLE_FOR_PAYMENT',
        message: 'Order is not available for payment',
      });
    }

    // 7. Check payment timeout
    if (order.createdAt) {
      const isExpired =
        Date.now() - new Date(order.createdAt).getTime() >
        ORDER_PAYMENT_TIMEOUT_MS;

      if (isExpired) {
        if (this.ordersService) {
          await this.ordersService.cancelOrderInternal(order.id);
        }

        throw new BadRequestException({
          code: 'ORDER_EXPIRED',
          message: 'Đơn hàng đã hết hạn thanh toán (quá 15 phút)',
        });
      }
    }

    // 8. Check existing active payment
    const activePayment = await this.prisma.payment.findFirst({
      where: {
        orderId: order.id,
        status: { in: ['PROCESSING', 'SUCCESS'] },
      },
    });

    if (activePayment) {
      if (activePayment.status === 'SUCCESS') {
        throw new ConflictException(
          'Đơn hàng này đã được thanh toán thành công',
        );
      }

      throw new ConflictException(
        'Đơn hàng đang có một giao dịch thanh toán khác đang xử lý',
      );
    }

    // 9. Create payment
    let payment;

    try {
      payment = await this.prisma.payment.create({
        data: {
          orderId: order.id,
          amount: order.total,
          method: dto.method,
          status: 'PROCESSING',
          idempotencyKey: normalizedKey,
          requestHash,
        },
      });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException(
          'Giao dịch thanh toán đã tồn tại hoặc đang được xử lý',
        );
      }

      throw err;
    }

    // 10. Process mock payment
    const success = dto.mockResult !== MockPaymentResult.FAILED;

    const response = {
      paymentId: payment.id,
      orderId: order.id,
      amount: order.total,
      method: dto.method,
      status: success ? 'SUCCESS' : 'FAILED',
      payment: {
        id: payment.id,
        orderId: order.id,
        amount: order.total,
        method: dto.method,
        status: success ? 'SUCCESS' : 'FAILED',
        providerRef: null,
      },
      order: {
        id: order.id,
        code: '#' + order.id,
        status: success ? 'PAID' : 'PAYMENT_FAILED',
        total: order.total,
        pointsEarned: Math.floor(order.total / 1000),
      },
    };

    // 11. Update payment and order in transaction
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const updatedPayment = await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: success ? 'SUCCESS' : 'FAILED',
            responseSnapshot: response,
            failureReason: success ? null : 'Mock payment failure',
          },
        });

        // Retry payment: PAYMENT_FAILED -> PENDING
        if (order.status === 'PAYMENT_FAILED') {
          assertTransition(
            'PAYMENT_FAILED' as any,
            'PENDING' as any,
          );

          await tx.order.update({
            where: { id: order.id },
            data: { status: 'PENDING' },
          });
        }

        // Update order status
        const targetStatus = success ? 'PAID' : 'PAYMENT_FAILED';

        assertTransition('PENDING' as any, targetStatus as any);

        await tx.order.update({
          where: { id: order.id },
          data: { status: targetStatus },
        });

        // Award loyalty points only on successful payment
        if (success) {
          await this.loyaltyService.award(tx, order);
        }

        return updatedPayment.responseSnapshot ?? response;
      });

      if (!success) {
        throw new HttpException(response, 402);
      }

      return result;
    } catch (err) {
      // Do not leave payment stuck in PROCESSING
      if (
        !(err instanceof HttpException && err.getStatus() === 402)
      ) {
        try {
          await this.prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'FAILED',
              failureReason: 'Payment processing error',
              responseSnapshot: {
                paymentId: payment.id,
                orderId: order.id,
                status: 'FAILED',
                message: 'Payment processing error',
              },
            },
          });
        } catch {
          // Preserve the original error
        }
      }

      throw err;
    }
  }
}