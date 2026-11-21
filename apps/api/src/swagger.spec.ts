import { describe, it, expect } from 'vitest';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { AppModule } from './app.module.js';
import { PrismaService } from './prisma/prisma.service.js';

describe('Swagger Documentation & Postman Export', () => {
  it('should generate swagger openapi json and export postman collection', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $connect: async () => {},
        $disconnect: async () => {},
        $queryRaw: async () => [{ 1: 1 }],
      })
      .compile();

    const app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');

    const config = new DocumentBuilder()
      .setTitle('BrewLite API')
      .setDescription(
        'Tài liệu OpenAPI / Swagger cho hệ thống bán cà phê BrewLite (Assignment 2). Hỗ trợ xác thực JWT Bearer, quản lý sản phẩm, tồn kho định lượng nguyên liệu, đặt hàng, xử lý thanh toán VNPay & hoàn tiền.',
      )
      .setVersion('1.0')
      .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Nhập access_token nhận được từ /api/auth/login',
      })
      .addTag('Auth', 'Đăng ký, đăng nhập và xác thực người dùng')
      .addTag('Products', 'Quản lý danh mục thực đơn và công thức pha chế sản phẩm')
      .addTag('Toppings', 'Quản lý danh sách và định lượng nguyên liệu topping')
      .addTag('Ingredients', 'Quản lý kho nguyên vật liệu, cảnh báo tồn kho và lịch sử biến động')
      .addTag('Orders', 'Đặt hàng, xem danh sách, cập nhật trạng thái đơn và xử lý hoàn tiền')
      .addTag('Payments', 'Thanh toán trực tiếp, cổng thanh toán điện tử VNPay và hoàn tất giả lập')
      .addTag('Promotions', 'Kiểm tra và áp dụng mã voucher giảm giá')
      .addTag('Health', 'Kiểm tra trạng thái máy chủ và kết nối cơ sở dữ liệu')
      .addTag('App', 'Kiểm tra hoạt động dịch vụ gốc')
      .build();

    const document = SwaggerModule.createDocument(app, config);

    expect(document).toBeDefined();
    expect(document.paths).toBeDefined();

    // Verify paths count
    const paths = Object.keys(document.paths);
    expect(paths.length).toBeGreaterThan(15);

    // Save swagger openapi file
    const rootDocsDir = path.resolve(process.cwd(), '../../docs');
    if (!fs.existsSync(rootDocsDir)) {
      fs.mkdirSync(rootDocsDir, { recursive: true });
    }

    const swaggerPath = path.join(rootDocsDir, 'brewlite-api.swagger.json');
    fs.writeFileSync(swaggerPath, JSON.stringify(document, null, 2), 'utf-8');
    console.log(`Saved OpenAPI JSON to: ${swaggerPath}`);

    // Generate Postman Collection v2.1
    const postmanCollection = generatePostmanCollection(document);
    const postmanPath = path.join(rootDocsDir, 'BrewLite_API.postman_collection.json');
    fs.writeFileSync(postmanPath, JSON.stringify(postmanCollection, null, 2), 'utf-8');
    console.log(`Saved Postman Collection to: ${postmanPath}`);

    await app.close();
  });
});

function generatePostmanCollection(openapi: any) {
  const collection: any = {
    info: {
      name: 'BrewLite API - Postman Collection',
      description:
        'Bộ sưu tập đầy đủ 34 API cho dự án BrewLite A2. Hỗ trợ biến môi trường baseUrl, tự động lưu JWT token khi đăng nhập và tự sinh idempotency-key.',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    variable: [
      {
        key: 'baseUrl',
        value: 'http://localhost:4000/api',
        type: 'string',
      },
      {
        key: 'accessToken',
        value: '',
        type: 'string',
      },
    ],
    item: [],
  };

  const tagGroups: Record<string, any[]> = {};

  for (const [routePath, methods] of Object.entries<any>(openapi.paths)) {
    for (const [httpMethod, op] of Object.entries<any>(methods)) {
      const tag = op.tags?.[0] || 'Default';
      if (!tagGroups[tag]) {
        tagGroups[tag] = [];
      }

      // Convert path `/api/products/:id` or `/products/{id}` to Postman `{{baseUrl}}/products/:id`
      let cleanPath = routePath.replace(/^\/api\//, '').replace(/^\//, '');
      const pathSegments = cleanPath.split('/').map((seg) => {
        if (seg.startsWith('{') && seg.endsWith('}')) {
          return ':' + seg.slice(1, -1);
        }
        return seg;
      });

      const urlObj: any = {
        raw: `{{baseUrl}}/${cleanPath.replace(/\{([^}]+)\}/g, ':$1')}`,
        host: ['{{baseUrl}}'],
        path: pathSegments,
        variable: [],
      };

      // Path variables
      const pathParams = op.parameters?.filter((p: any) => p.in === 'path') || [];
      for (const p of pathParams) {
        urlObj.variable.push({
          key: p.name,
          value: p.example ? String(p.example) : '1',
          description: p.description || '',
        });
      }

      // Query params
      const queryParams = op.parameters?.filter((p: any) => p.in === 'query') || [];
      if (queryParams.length > 0) {
        urlObj.query = queryParams.map((q: any) => ({
          key: q.name,
          value: q.example ? String(q.example) : '',
          description: q.description || '',
          disabled: !q.required,
        }));
      }

      // Headers
      const headers: any[] = [
        {
          key: 'Content-Type',
          value: 'application/json',
          type: 'text',
        },
      ];

      // Security (Bearer Token)
      const hasBearer = op.security && op.security.some((s: any) => 'bearer' in s);
      if (hasBearer) {
        headers.push({
          key: 'Authorization',
          value: 'Bearer {{accessToken}}',
          type: 'text',
          description: 'Access token tự động cập nhật sau khi gọi Auth Login',
        });
      }

      // Idempotency-key header if required
      if (routePath.includes('payments') || routePath.includes('orders')) {
        headers.push({
          key: 'idempotency-key',
          value: '{{$guid}}',
          type: 'text',
          description: 'Tự động tạo UUID ngẫu nhiên chống trừ tiền / tạo trùng đơn',
          disabled: httpMethod.toLowerCase() === 'get',
        });
      }

      // Request Body
      let body: any = undefined;
      if (['post', 'put', 'patch'].includes(httpMethod.toLowerCase())) {
        let sampleBody: any = {};

        // Custom samples for key endpoints
        if (routePath.includes('auth/login')) {
          sampleBody = {
            username: 'customer1',
            password: 'Password123!',
          };
        } else if (routePath.includes('auth/register')) {
          sampleBody = {
            username: 'newcustomer',
            password: 'Password123!',
            fullName: 'Nguyen Van A',
            phone: '0901234567',
          };
        } else if (routePath.includes('orders') && httpMethod.toLowerCase() === 'post') {
          sampleBody = {
            orderType: 'DINE_IN',
            tableNumber: 'B01',
            items: [
              {
                productId: 1,
                sizeId: 1,
                quantity: 1,
                toppingIds: [1],
              },
            ],
            notes: 'Ít đường, nhiều đá',
          };
        } else if (routePath.includes('payments/vnpay/create-url')) {
          sampleBody = { orderId: 1 };
        } else if (routePath.includes('payments/vnpay/simulate-complete')) {
          sampleBody = { orderId: 1 };
        } else if (routePath.includes('promotions/validate')) {
          sampleBody = { code: 'CHAOBANMOI', orderTotal: 50000 };
        } else if (routePath.includes('ingredients') && httpMethod.toLowerCase() === 'post') {
          sampleBody = {
            name: 'Cà phê Robusta Đắk Lắk',
            unit: 'gram',
            currentStock: 1000,
            safetyStock: 200,
          };
        } else if (routePath.includes('stock')) {
          sampleBody = { quantity: 500, reason: 'Nhập kho đầu ca' };
        } else if (routePath.includes('adjust')) {
          sampleBody = { newStock: 1200, reason: 'Kiểm kê định kỳ' };
        } else if (routePath.includes('cancel')) {
          sampleBody = {
            reason: 'Đổi ý',
            bankCode: '970436',
            accountNumber: '123456789',
            accountHolder: 'NGUYEN VAN A',
          };
        } else if (routePath.includes('confirm-refund')) {
          sampleBody = { transactionCode: 'BANK_TX_987654' };
        } else if (routePath.includes('fail-refund')) {
          sampleBody = { reason: 'Sai số tài khoản hoặc ngân hàng bảo trì' };
        } else if (routePath.includes('hold-refund')) {
          sampleBody = { reason: 'Giao dịch đang xử lý / Nghi vấn đối soát' };
        } else if (routePath.includes('retry-refund')) {
          sampleBody = { reason: 'Đã xác minh lại STK hợp lệ' };
        }

        body = {
          mode: 'raw',
          raw: JSON.stringify(sampleBody, null, 2),
          options: {
            raw: {
              language: 'json',
            },
          },
        };
      }

      // Test Script for Auto-save JWT Token
      const events: any[] = [];
      if (routePath.includes('auth/login')) {
        events.push({
          listen: 'test',
          script: {
            type: 'text/javascript',
            exec: [
              'const response = pm.response.json();',
              'if (response.access_token) {',
              '    pm.collectionVariables.set("accessToken", response.access_token);',
              '    pm.environment.set("accessToken", response.access_token);',
              '    console.log("Đã tự động lưu access_token vào Postman Variable!");',
              '}',
            ],
          },
        });
      }

      const requestItem: any = {
        name: `${httpMethod.toUpperCase()} ${op.summary || cleanPath}`,
        request: {
          method: httpMethod.toUpperCase(),
          header: headers,
          url: urlObj,
          description: op.description || op.summary || '',
        },
        response: [],
      };

      if (body) {
        requestItem.request.body = body;
      }
      if (events.length > 0) {
        requestItem.event = events;
      }

      tagGroups[tag].push(requestItem);
    }
  }

  // Convert tag groups into Postman folders
  for (const [tag, items] of Object.entries(tagGroups)) {
    collection.item.push({
      name: `${tag} Module`,
      item: items,
    });
  }

  return collection;
}
