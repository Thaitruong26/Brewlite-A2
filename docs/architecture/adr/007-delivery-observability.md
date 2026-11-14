# ADR-007 — Docker, CI/CD, health, secrets và deployment

- **Trạng thái:** Proposed; Render NOT approved
- **Ngày:** 2026-11-14
- **Liên quan:** FR-32; NFR-02/08/09/10/12/14

## Bối cảnh
Đề yêu cầu local, production và minh chứng.

## Quyết định
Docker Compose local; GitHub Actions install/lint/test/build rồi image SHA → GHCR → target deploy; HTTPS, DB private, secret store, /health, log.

## Hệ quả tích cực
Reproducible, observable, rollback theo image tag.

## Hạn chế/trade-off
Cần chọn platform thật (O-02), provision/secrets và chi phí vận hành.

## Truy vết
[ADR-007 trong Architecture](../architecture.md), [SRS](../../requirements/software-requirements-specification.md), [ma trận](../../traceability-matrix.md).
