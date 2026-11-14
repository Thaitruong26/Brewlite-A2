import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { PaymentsService } from './payments.service.js';
import { VnpayService } from './vnpay.service.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly vnpayService: VnpayService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Thanh toán đơn hàng (hỗ trợ Idempotency)' })
  @ApiHeader({
    name: 'idempotency-key',
    description: 'UUID v4 do client sinh để chống trừ tiền 2 lần',
    required: true,
  })
  createPayment(
    @Body() dto: CreatePaymentDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res?: Response,
  ) {
    return this.paymentsService.createPayment(dto, idempotencyKey, user, res);
  }

  @Post('vnpay/create-url')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Tạo URL thanh toán VNPay Sandbox (ADR-004)' })
  async createVnpayUrl(
    @Body('orderId') orderId: number,
    @Req() req: Request,
  ) {
    const ipAddr =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      '127.0.0.1';
    let origin = (req.headers['origin'] as string) || undefined;
    if (!origin && req.headers['referer']) {
      try {
        origin = new URL(req.headers['referer'] as string).origin;
      } catch {}
    }
    const paymentUrl = await this.vnpayService.createPaymentUrl(orderId, ipAddr, origin);
    const simulatorUrl = await this.vnpayService.createSimulatorUrl(orderId);
    return { paymentUrl, simulatorUrl };
  }

  @Post('vnpay/simulate-complete')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Tạo query callback ký HMAC-SHA512 từ Simulator' })
  simulateComplete(
    @Body('orderId') orderId: number,
    @Body('txnRef') txnRef: string,
    @Body('amount') amount: number,
    @Body('responseCode') responseCode: string = '00',
  ) {
    const query = this.vnpayService.generateSignedCallback(
      orderId,
      txnRef,
      amount,
      responseCode,
    );
    return { query };
  }

  @Get('vnpay/verify')
  @ApiOperation({ summary: 'Xác thực kết quả thanh toán từ VNPay (Return URL / IPN)' })
  async verifyVnpay(@Query() query: Record<string, string>) {
    return this.vnpayService.verifyReturnUrl(query);
  }
}
