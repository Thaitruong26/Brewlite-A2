# ADR-002 — Next.js mobile-first, PWA install tùy chọn

- **Trạng thái:** Accepted / D-02
- **Ngày:** 2026-11-14
- **Liên quan:** FR-01..04,11,32; NFR-07/13

## Bối cảnh
Yêu cầu demo trên khung điện thoại, không native app.

## Quyết định
Next.js web một cột, bottom navigation, chiều rộng mobile; PWA install/offline là Could.

## Hệ quả tích cực
Một codebase, dễ kiểm thử UI trên 360–430px.

## Hạn chế/trade-off
Web SSR cần hosting Node; offline chưa cam kết.

## Truy vết
[ADR-002 trong Architecture](../architecture.md), [SRS](../../requirements/software-requirements-specification.md), [ma trận](../../traceability-matrix.md).
