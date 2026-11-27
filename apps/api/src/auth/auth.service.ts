import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import type { JwtPayload } from './strategies/jwt.strategy.js';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  // Chức năng: Xử lý nghiệp vụ đăng ký tài khoản. Cách hoạt động: Kiểm tra email đã tồn tại chưa (ném 409 nếu trùng), hash mật khẩu bằng bcrypt, tạo User với role CUSTOMER và trả về thông tin user (ẩn passwordHash).
  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email đã được sử dụng');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: { email: dto.email, passwordHash, fullName: dto.fullName },
      select: { id: true, email: true, fullName: true, role: true, createdAt: true, loyaltyPoints: true },
    });

    const token = this.signToken(user.id, user.email, user.role);
    return {
      user,
      accessToken: token,
      access_token: token,
      tokenType: 'Bearer',
      expiresIn: 86400,
    };
  }

  // Chức năng: Xử lý nghiệp vụ đăng nhập. Cách hoạt động: Tìm user theo email, so sánh mật khẩu với passwordHash bằng bcrypt.compare(), nếu khớp thì ký JWT payload (sub, email, role) và trả về access_token cùng thông tin user.
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Email hoặc mật khẩu không đúng');

    const match = await bcrypt.compare(dto.password, user.passwordHash);
    if (!match) throw new UnauthorizedException('Email hoặc mật khẩu không đúng');

    const { passwordHash: _pw, ...safeUser } = user;
    const token = this.signToken(user.id, user.email, user.role);
    return {
      user: safeUser,
      accessToken: token,
      access_token: token,
      tokenType: 'Bearer',
      expiresIn: 86400,
    };
  }

  // Chức năng: Hàm signToken(sub, email, role). Cách hoạt động: Thực thi logic xử lý nghiệp vụ của module và trả về kết quả cho nơi gọi.
  private signToken(sub: number, email: string, role: string): string {
    const payload: JwtPayload = { sub, email, role };
    return this.jwtService.sign(payload, {
      expiresIn: (this.config.get<string>('JWT_EXPIRES_IN') ?? '1d') as any,
    });
  }
}
