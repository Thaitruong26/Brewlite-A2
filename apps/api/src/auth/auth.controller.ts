import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { CurrentUser } from './decorators/current-user.decorator.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Chức năng: Đăng ký tài khoản khách hàng mới. Cách hoạt động: Nhận RegisterDto từ body và gọi AuthService.register() để kiểm tra trùng email, băm mật khẩu bcrypt rồi lưu vào DB.
  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản mới (role: CUSTOMER)' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // Chức năng: Đăng nhập hệ thống. Cách hoạt động: Nhận LoginDto (email, password) và gọi AuthService.login() để xác thực và cấp phát JWT access_token.
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập, trả về JWT access_token' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // Chức năng: Lấy thông tin người dùng đang đăng nhập. Cách hoạt động: Dùng JwtAuthGuard giải mã token từ header Authorization và trả về thông tin user hiện tại.
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin người dùng hiện tại' })
  me(@CurrentUser() user: unknown) {
    return user;
  }
}
