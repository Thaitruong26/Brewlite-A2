# ADR-006 — State machine cancel + refund + điểm bù

- **Trạng thái:** Accepted / D-05/D-06; detailed design proposed
- **Ngày:** 2026-11-14
- **Liên quan:** FR-20..30; NFR-06/10

## Bối cảnh
Không để khách mất quyền lợi và không tạo hai khoản bồi hoàn.

## Quyết định
Cancel PENDING/PAYMENT_FAILED release; PAID refund trước; confirmed FAILED -> CANCELLED+one compensation ledger; UNKNOWN chờ reconcile, khóa Barista; PREPARING+ 409.

## Hệ quả tích cực
Dễ truy vết tài chính và idempotency.

## Hạn chế/trade-off
Phức tạp do refund bất đồng bộ, late success, tỷ giá O-01 cần chốt.

## Truy vết
[ADR-006 trong Architecture](../architecture.md), [SRS](../../requirements/software-requirements-specification.md), [ma trận](../../traceability-matrix.md).
