import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ToppingsService {
  constructor(private readonly prisma: PrismaService) {}

  // Chức năng: Lấy dữ liệu All. Cách hoạt động: Truy vấn dữ liệu từ PostgreSQL qua Prisma và trả về kết quả đã định dạng.
  async findAll() {
    return this.prisma.topping.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        price: true,
      },
      orderBy: { id: 'asc' },
    });
  }
}
