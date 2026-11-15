import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CancelOrderDto {
  @ApiPropertyOptional({
    description: 'Mã ngân hàng nhận hoàn tiền (VietQR)',
    example: 'MB',
  })
  @IsOptional()
  @IsString()
  refundBank?: string;

  @ApiPropertyOptional({
    description: 'Số tài khoản ngân hàng nhận hoàn tiền',
    example: '0987654321',
  })
  @IsOptional()
  @IsString()
  refundAccount?: string;

  @ApiPropertyOptional({
    description: 'Lý do hủy đơn hàng',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ConfirmRefundDto {
  @ApiPropertyOptional({
    description: 'Mã tham chiếu hoặc ghi chú chuyển khoản VietQR từ Barista',
    example: 'VIETQR-MB-0987654321',
  })
  @IsOptional()
  @IsString()
  refundRef?: string;
}

