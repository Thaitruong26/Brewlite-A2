# ADR-003 — PostgreSQL + Prisma, transaction và inventory ledger

- **Trạng thái:** Proposed
- **Ngày:** 2026-11-14
- **Liên quan:** FR-04,08..10,19,23,31; NFR-05

## Bối cảnh
Tránh âm kho, double-use promo, đảm bảo snapshot bất biến.

## Quyết định
Giao dịch tạo Order/Snapshot/Reservation/promo atomic; lock/optimistic version, unique constraints; giữ kho trước khi thanh toán.

## Hệ quả tích cực
ACID và dữ liệu nhất quán.

## Hạn chế/trade-off
Tốn khóa và rủi ro deadlock; kiểm thử concurrent/retry.

## Truy vết
[ADR-003 trong Architecture](../architecture.md), [SRS](../../requirements/software-requirements-specification.md), [ma trận](../../traceability-matrix.md).
