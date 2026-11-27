import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
// Chức năng: Hàm bootstrap. Cách hoạt động: Thực thi logic xử lý nghiệp vụ của module và trả về kết quả cho nơi gọi.
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  app.setGlobalPrefix('api');
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.enableShutdownHooks();

  const config = new DocumentBuilder()
    .setTitle('BrewLite API')
    .setDescription('Tài liệu OpenAPI / Swagger cho hệ thống bán cà phê BrewLite (Assignment 2). Hỗ trợ xác thực JWT Bearer, quản lý sản phẩm, tồn kho định lượng nguyên liệu, đặt hàng, xử lý thanh toán VNPay & hoàn tiền.')
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
  SwaggerModule.setup('api/docs', app, document);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 4000);
}
await bootstrap();