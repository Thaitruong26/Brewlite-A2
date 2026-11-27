import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service.js';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Chức năng: Endpoint gốc kiểm tra server đang hoạt động. Cách hoạt động: Trả về chuỗi chào mừng từ AppService.
  @Get()
  @ApiOperation({ summary: 'Kiểm tra dịch vụ gốc (Root API)' })
  @ApiResponse({ status: 200, description: 'Chào mừng đến với BrewLite API' })
  getHello(): string {
    return this.appService.getHello();
  }
}
