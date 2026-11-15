import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class LoyaltyService {
  /**
   * Cộng điểm thưởng cho khách hàng khi đơn hàng chuyển sang PAID
   * Cứ 1.000đ = 1 điểm. Mỗi đơn chỉ cộng 1 lần.
   */
  async award(tx: any, order: { id: number; userId: number; total: number }) {
// Quy đổi điểm thưởng theo tỷ lệ 1.000đ = 1 điểm.
// Đơn hàng không đủ 1.000đ sẽ không được cộng điểm.

    const points = Math.floor(order.total / 1000);
    if (points <= 0) return;
// Kiểm tra lịch sử giao dịch để tránh cộng điểm nhiều lần cho cùng một đơn hàng.
    const existingTransaction = await tx.loyaltyTransaction.findUnique({
      where: { orderId: order.id },
    });

    if (existingTransaction) {
      throw new BadRequestException('Đơn hàng này đã được cộng điểm thưởng rồi!');
    }

    await tx.loyaltyTransaction.create({
      data: {
        userId: order.userId,
        orderId: order.id,
        points: points,
      },
    });

    await tx.user.update({
      where: { id: order.userId },
      data: {
        loyaltyPoints: { increment: points },
      },
    });

    await tx.order.update({
      where: { id: order.id },
      data: { pointsEarned: points },
    });

    return {
      success: true,
      points,
      message: `Đã cộng thành công ${points} điểm cho khách hàng!`,
    };
  }
}
