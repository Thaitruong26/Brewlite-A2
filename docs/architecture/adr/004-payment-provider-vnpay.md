# ADR-004 — PaymentProvider với VNPay Sandbox bắt buộc

- **Trạng thái:** Accepted / D-04
- **Ngày:** 2026-11-14
- **Liên quan:** FR-12..18,24,28; NFR-04/06/16

## Bối cảnh
VNPay Sandbox khác Mock; xử lý redirect/asynchronous callbacks.

## Quyết định
VNPaySandboxAdapter là Must; MockAdapter chỉ test/demo; signed IPN/QueryDr; ReturnUrl display; idempotency.

## Hệ quả tích cực
Đổi adapter không đổi Orders, test deterministic.

## Hạn chế/trade-off
VNPay sandbox phụ thuộc internet/credential/contract; cần reconciliation.

## Truy vết
[ADR-004 trong Architecture](../architecture.md), [SRS](../../requirements/software-requirements-specification.md), [ma trận](../../traceability-matrix.md).
