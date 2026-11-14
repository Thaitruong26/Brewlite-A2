# ADR-008 — Promotion quota và Loyalty ledger

- **Trạng thái:** Proposed
- **Ngày:** 2026-11-14
- **Liên quan:** FR-19..21,23,26/27; NFR-06

## Bối cảnh
Khuyến mãi, điểm được tái dùng từ nghiệp vụ A1 nhưng triển khai mới.

## Quyết định
Reservation/confirmed/released cho promotion; append-only loyalty transactions, EARN once; spending/refund/compensation unique.

## Hệ quả tích cực
Kiểm toán, bù điểm không gây duplicate.

## Hạn chế/trade-off
Decimal/currency conversion chưa quyết định O-01; concurrency quota.

## Truy vết
[ADR-008 trong Architecture](../architecture.md), [SRS](../../requirements/software-requirements-specification.md), [ma trận](../../traceability-matrix.md).
