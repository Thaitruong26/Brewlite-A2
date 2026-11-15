import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { createHmac } from 'node:crypto';
import { AppModule } from '../src/app.module.js';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter.js';
import { OrderStatus, Role } from '../src/generated/prisma/client.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('VNPay & VietQR Refund End-to-End Tests (E2E)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let customerToken: string;
  let baristaToken: string;

  const TEST_TMN = 'BREWTMN01';
  const TEST_SECRET = 'TESTSECRETKEYVNPAYBREWLITE1234567890';

  // In-memory mock database state for E2E tests
  let orders: Map<number, any>;
  let payments: Map<number, any>;

  function signVnpayParams(params: Record<string, string>, secret: string = TEST_SECRET): Record<string, string> {
    const sortedKeys = Object.keys(params).sort();
    const signData = sortedKeys
      .filter((k) => params[k] !== undefined && params[k] !== '')
      .map((k) => `${k}=${encodeURIComponent(params[k]).replace(/%20/g, '+')}`)
      .join('&');

    const secureHash = createHmac('sha512', secret).update(Buffer.from(signData, 'utf-8')).digest('hex');
    return { ...params, vnp_SecureHash: secureHash };
  }

  const mockPrisma = {
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
    user: {
      findUnique: vi.fn().mockImplementation(({ where }) => {
        if (where.id === 1) return { id: 1, email: 'customer@brewlite.vn', role: Role.CUSTOMER, loyaltyPoints: 100 };
        if (where.id === 2) return { id: 2, email: 'barista@brewlite.vn', role: Role.BARISTA };
        return null;
      }),
      update: vi.fn().mockResolvedValue({ id: 1 }),
    },
    order: {
      findUnique: vi.fn().mockImplementation(({ where }) => {
        const o = orders.get(where.id);
        if (!o) return null;
        return {
          ...o,
          items: o.items || [],
          payments: Array.from(payments.values()).filter((p) => p.orderId === o.id),
        };
      }),
      findMany: vi.fn().mockImplementation(() => Array.from(orders.values())),
      update: vi.fn().mockImplementation(({ where, data }) => {
        const existing = orders.get(where.id);
        if (!existing) return null;
        const updated = { ...existing, ...data, updatedAt: new Date() };
        orders.set(where.id, updated);
        return updated;
      }),
    },
    payment: {
      findUnique: vi.fn().mockImplementation(({ where }) => {
        return payments.get(where.id) || null;
      }),
      create: vi.fn().mockImplementation(({ data }) => {
        const id = payments.size + 1;
        const record = { id, ...data, createdAt: new Date() };
        payments.set(id, record);
        return record;
      }),
      update: vi.fn().mockImplementation(({ where, data }) => {
        const existing = payments.get(where.id);
        if (!existing) return null;
        const updated = { ...existing, ...data };
        payments.set(where.id, updated);
        return updated;
      }),
    },
    ingredient: {
      update: vi.fn().mockResolvedValue({}),
      findUnique: vi.fn().mockResolvedValue({ id: 1, stock: 100, version: 1 }),
    },
    stockMovement: {
      create: vi.fn().mockResolvedValue({ id: 1 }),
    },
    promoCode: {
      update: vi.fn().mockResolvedValue({}),
    },
    loyaltyTransaction: {
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      create: vi.fn().mockResolvedValue({ id: 1 }),
    },
    $transaction: vi.fn().mockImplementation(async (callback) => {
      return callback(mockPrisma);
    }),
  };

  beforeAll(async () => {
    process.env.VNPAY_TMN_CODE = TEST_TMN;
    process.env.VNPAY_HASH_SECRET = TEST_SECRET;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    jwtService = app.get(JwtService);
    customerToken = jwtService.sign({ sub: 1, email: 'customer@brewlite.vn', role: Role.CUSTOMER });
    baristaToken = jwtService.sign({ sub: 2, email: 'barista@brewlite.vn', role: Role.BARISTA });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    orders = new Map();
    payments = new Map();

    // Khởi tạo đơn mẫu #10: PENDING, giá trị 50.000đ
    orders.set(10, {
      id: 10,
      userId: 1,
      status: OrderStatus.PENDING,
      subtotal: 50000,
      discountAmount: 0,
      total: 50000,
      promoCode: null,
      pointsEarned: 0,
      pointsUsed: 0,
      items: [
        {
          id: 1,
          orderId: 10,
          productId: 1,
          productName: 'Cà phê đen',
          size: 'M',
          unitPrice: 50000,
          qty: 1,
          lineTotal: 50000,
          consumption: [{ ingredientId: 1, quantity: 20 }],
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  describe('1. VNPay Payment Gateway & Return URL Verification', () => {
    it('POST /api/payments/vnpay/create-url tạo URL thanh toán VNPay có ký HMAC', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/payments/vnpay/create-url')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ orderId: 10 });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('paymentUrl');
      expect(res.body).toHaveProperty('simulatorUrl');
      expect(res.body.paymentUrl).toContain('vnp_TmnCode=BREWTMN01');
      expect(res.body.paymentUrl).toContain('vnp_Amount=5000000');
      expect(res.body.paymentUrl).toContain('vnp_SecureHash=');
    });

    it('GET /api/payments/vnpay/verify xác thực callback hợp lệ và chuyển đơn sang PAID', async () => {
      const params = signVnpayParams({
        vnp_TmnCode: TEST_TMN,
        vnp_TxnRef: '10_1700000000',
        vnp_Amount: '5000000', // 50,000 VND
        vnp_ResponseCode: '00',
        vnp_TransactionNo: 'VNPAY_TXN_001',
      });

      const res = await request(app.getHttpServer())
        .get('/api/payments/vnpay/verify')
        .query(params);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        isSuccess: true,
        orderId: 10,
        responseCode: '00',
      });

      // Kiểm tra trạng thái đơn trong mock DB đã sang PAID
      expect(orders.get(10)?.status).toBe(OrderStatus.PAID);
      // Kiểm tra bản ghi payment đã được tạo
      expect(payments.size).toBe(1);
      const createdPayment = Array.from(payments.values())[0];
      expect(createdPayment.orderId).toBe(10);
      expect(createdPayment.amount).toBe(50000);
      expect(createdPayment.status).toBe('SUCCESS');
    });

    it('GET /api/payments/vnpay/verify từ chối khi phát hiện giả mạo số tiền (P0.2 Amount Tampering)', async () => {
      const params = signVnpayParams({
        vnp_TmnCode: TEST_TMN,
        vnp_TxnRef: '10_1700000000',
        vnp_Amount: '1000000', // Kẻ gian cố tình sửa số tiền thành 10.000đ
        vnp_ResponseCode: '00',
      });

      const res = await request(app.getHttpServer())
        .get('/api/payments/vnpay/verify')
        .query(params);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        isSuccess: false,
        responseCode: '04',
      });
      // Đơn hàng vẫn giữ nguyên trạng thái PENDING
      expect(orders.get(10)?.status).toBe(OrderStatus.PENDING);
    });

    it('GET /api/payments/vnpay/verify từ chối khi chữ ký HMAC không khớp (P0.1 Invalid Checksum)', async () => {
      const params = signVnpayParams(
        {
          vnp_TmnCode: TEST_TMN,
          vnp_TxnRef: '10_1700000000',
          vnp_Amount: '5000000',
          vnp_ResponseCode: '00',
        },
        'FORGED_SECRET_KEY',
      );

      const res = await request(app.getHttpServer())
        .get('/api/payments/vnpay/verify')
        .query(params);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        isSuccess: false,
        responseCode: '97',
      });
    });
  });

  describe('2. Order Cancellation & VietQR Refund Workflow (FR-24 to FR-28)', () => {
    beforeEach(() => {
      // Thiết lập đơn hàng #20 đã thanh toán PAID thành công
      orders.set(20, {
        id: 20,
        userId: 1,
        status: OrderStatus.PAID,
        subtotal: 75000,
        discountAmount: 0,
        total: 75000,
        promoCode: null,
        pointsEarned: 75,
        pointsUsed: 0,
        items: [
          {
            id: 2,
            orderId: 20,
            productId: 1,
            consumption: [{ ingredientId: 1, quantity: 30 }],
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      payments.set(100, {
        id: 100,
        orderId: 20,
        amount: 75000,
        status: 'SUCCESS',
        method: 'CARD',
        refundedAmount: 0,
        refundRef: null,
        createdAt: new Date(),
      });
    });

    it('POST /api/orders/:id/cancel: Khách hủy đơn PAID kèm STK ngân hàng -> CANCELLED & lưu VietQR Ref (FR-24)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/orders/20/cancel')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          refundBank: 'MB',
          refundAccount: '0987654321',
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: 20,
        status: OrderStatus.CANCELLED,
      });

      // Đơn hàng chuyển sang CANCELLED
      expect(orders.get(20)?.status).toBe(OrderStatus.CANCELLED);
      // Payment được cập nhật thông tin hoàn tiền VietQR
      const payment = payments.get(100);
      expect(payment?.refundedAmount).toBe(75000);
      expect(payment?.refundRef).toBe('VIETQR:MB:0987654321');
    });

    it('POST /api/orders/:id/cancel: Chặn hủy đơn khi đã ở trạng thái PREPARING (HTTP 409 Conflict)', async () => {
      // Đơn hàng đang được barista pha chế
      orders.set(21, {
        id: 21,
        userId: 1,
        status: OrderStatus.PREPARING,
        total: 50000,
        items: [],
      });

      const res = await request(app.getHttpServer())
        .post('/api/orders/21/cancel')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ refundBank: 'MB', refundAccount: '123' });

      expect(res.status).toBe(409);
    });

    it('PATCH /api/orders/:id/confirm-refund: Chặn người dùng thường xác nhận hoàn tiền (HTTP 403 Forbidden)', async () => {
      // Đơn đã hủy
      orders.get(20)!.status = OrderStatus.CANCELLED;

      const res = await request(app.getHttpServer())
        .patch('/api/orders/20/confirm-refund')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({});

      expect(res.status).toBe(403);
    });

    it('PATCH /api/orders/:id/confirm-refund: Barista xác nhận đã chuyển khoản VietQR thành công (FR-26)', async () => {
      // Đơn đã hủy trước đó
      orders.get(20)!.status = OrderStatus.CANCELLED;
      payments.get(100)!.refundRef = 'VIETQR:MB:0987654321';

      const res = await request(app.getHttpServer())
        .patch('/api/orders/20/confirm-refund')
        .set('Authorization', `Bearer ${baristaToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        orderId: 20,
        refundedAmount: 75000,
      });
      expect(res.body.refundRef).toContain('CONFIRMED');

      // Payment trong DB được ghi nhận thời điểm hoàn tiền
      const p = payments.get(100);
      expect(p?.refundedAt).toBeInstanceOf(Date);
      expect(p?.refundRef).toBe('VIETQR:MB:0987654321:CONFIRMED');
    });

    it('PATCH /api/orders/:id/confirm-refund: Từ chối nếu đơn chưa bị hủy (HTTP 400)', async () => {
      // Đơn vẫn đang PAID
      orders.get(20)!.status = OrderStatus.PAID;

      const res = await request(app.getHttpServer())
        .patch('/api/orders/20/confirm-refund')
        .set('Authorization', `Bearer ${baristaToken}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });
});

