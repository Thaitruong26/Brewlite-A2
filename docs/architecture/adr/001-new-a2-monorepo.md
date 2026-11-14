# ADR-001 — Viết A2 mới trong monorepo

- **Trạng thái:** Accepted / D-01
- **Ngày:** 2026-11-14
- **Liên quan:** FR-01..32; NFR-08/15

## Bối cảnh
Tài liệu A1 chỉ để tham khảo domain; nhóm muốn triển khai Sprint 1–2 có traceability.

## Quyết định
Dùng repository A2 độc lập gồm `apps/web`, `apps/api`, `docs`, `tests` và workflow. Không copy code A1.

## Hệ quả tích cực
Dễ review một PR xuyên frontend/backend/docs; build/tất cả chung CI.

## Hạn chế/trade-off
Dễ coupling, CI chậm khi repository lớn; tách module bằng contracts.

## Truy vết
[ADR-001 trong Architecture](../architecture.md), [SRS](../../requirements/software-requirements-specification.md), [ma trận](../../traceability-matrix.md).
