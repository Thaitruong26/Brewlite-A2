import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module'; 
describe('Brewlite API - Task 5.2 Integration Test (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });


  it('/auth/login (POST) - Đăng nhập thành công', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@brewlite.com', password: 'password123' })
      .expect(200);

    
    jwtToken = response.body.access_token;
    expect(jwtToken).toBeDefined();
  });

  
  it('/orders (POST) - Tạo đơn hàng hợp lệ', () => {
    return request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${jwtToken}`) 
      .send({
        orderItems: [{ productId: 1, quantity: 2 }],
        promoCode: 'GIAM20K'
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.status).toEqual('PENDING');
      });
  });

  afterAll(async () => {
    await app.close();
  });
});