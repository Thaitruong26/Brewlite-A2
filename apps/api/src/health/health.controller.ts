import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service.js';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  // Chức năng: Kiểm tra sức khỏe hệ thống (Health Check). Cách hoạt động: Chạy câu lệnh SELECT 1 kiểm tra kết nối PostgreSQL qua Prisma và trả về { status: 'ok', db: 'up' }.
  @Get()
  @ApiOperation({ summary: 'Kiểm tra trạng thái máy chủ và kết nối CSDL (Health Check)' })
  @ApiResponse({ status: 200, description: 'Hệ thống hoạt động bình thường' })
  async check() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', db: 'up' };
  }
}