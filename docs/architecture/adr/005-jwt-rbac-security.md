# ADR-005 — JWT + Role-based authorization

- **Trạng thái:** Proposed
- **Ngày:** 2026-11-14
- **Liên quan:** FR-05..07,14,29,31; NFR-03/04

## Bối cảnh
Các endpoint cancel/payment/status tác động tiền/kho.

## Quyết định
Customer owner checks, BARISTA/MANAGER RBAC, DTO validation, signed callback verification.

## Hệ quả tích cực
Giảm over-permission, kiểm thử 401/403.

## Hạn chế/trade-off
Role có thể chưa đủ granular; audit quyền.

## Truy vết
[ADR-005 trong Architecture](../architecture.md), [SRS](../../requirements/software-requirements-specification.md), [ma trận](../../traceability-matrix.md).
