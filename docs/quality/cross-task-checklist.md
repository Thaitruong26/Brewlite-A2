# Quality gate — cross-task alignment checklist

**Status:** Task 1–3 design assets have been rebuilt; runtime implementation and actual production remain pending. This is a documentation-quality gate, **not** an execution/test pass.

| Task | Artifact | Nội dung chính | Kết quả kiểm tra tài liệu | Chưa chốt |
|---|---|---|---|---|
| 1.1 | `requirements/context-and-scope.md` | 6 stakeholder, in/out scope, giả định, ràng buộc, risk | Có | O-01..06 |
| 1.2 | `requirements/software-requirements-specification.md` | 32 FR, 16 NFR, MoSCoW, AC, UC overall | Có | O-01 và NFR thresholds |
| 1.3 | `requirements/use-case-checkout-specification.md` | Actor/trigger/pre/post, main/alt/error, FR links | Có | O-01/O-04 |
| 2.1 | `diagrams/activity-checkout.puml` | Start/end, actions, swimlanes, decisions, no-login/out-of-stock/failure | Có, cần compile PlantUML | Render fidelity |
| 2.2 | `diagrams/sequence-checkout.puml`, `sequence-cancel-refund.puml` | JWT, transaction, IPN, QueryDr, refund, idempotency | Có, cần compile PlantUML | Render fidelity |
| 2.3 | `diagrams/class-domain.puml`, `class-inventory.puml` | Domain entities, multiplicity, enums, adapter | Có, cần compile PlantUML | Schema khi code |
| 3.1 | `architecture/architecture.md` + 8 ADR | Next/Nest/Postgres, Mock+VNPay, logging/health/config, tradeoffs | Có | O-01/O-04 |
| 3.2 | `deployment.md` + deployment UML | Local/CI/production, HTTPS/secret/registry/private DB | **Proposed** | **O-02 và production thực tế** |

## Must-maintain invariants

- `FR-13/14/15/16/17 ↔ UC-07/08 ↔ SEQ-01 ↔ CLASS-01 ↔ ADR-004`: VNPay **bắt buộc**, return không xác nhận thành công, IPN signature/amount/txnRef được kiểm.
- `FR-22..28 ↔ UC-09/10 ↔ ACT-01/SEQ-02/CLASS-01 ↔ ADR-006`: hủy chỉ trước PREPARING; FAILED refund có point credit; UNKNOWN chờ reconcile.
- `FR-08/09/19 ↔ UC-05 ↔ ACT-01/SEQ-01/CLASS-02 ↔ ADR-003`: kho/promo atomic và release một lần.
- `FR-20/21/26/27 ↔ UC-14/10 ↔ CLASS-01 ↔ ADR-008`: append-only loyalty và unique compensation.
- `NFR-08/09/14 ↔ ARC-01/DEP-01 ↔ ADR-007`: local Compose/production secret/health, chưa có production actual.

### Định nghĩa hoàn thành trước Task 4

1. Chốt O-01 (R và rounding), O-02 (nền tảng), O-03/04 (đối soát/expiry), cập nhật ADR tương ứng.
2. Review và compile trực tiếp 9 `.puml` bằng PlantUML CLI, so sánh ảnh `.svg` và thay hình khi có khác biệt.
3. Tạo commit/PR cho Task 1, Task 2, Task 3 đúng thứ tự; file `docs/traceability-matrix.md` được cập nhật cùng PR.
4. Khi source A2 tồn tại, thay các đường dẫn **dự kiến** thành đường dẫn code thật và map test ID sang test đã chạy.

---

## Ghi chú rà soát & xác nhận chất lượng (Task 4.2 – Lê Khánh Linh)

- **Đối chiếu nguồn sơ đồ (`.puml` & `.svg`):** Đã kiểm tra tính đồng bộ giữa các tệp nguồn PlantUML và hình ảnh xuất ra cho toàn bộ nhóm sơ đồ Use-case, Activity (kèm swimlanes), Sequence (Checkout & Cancel/Refund), Class Domain và Deployment.
- **Tính nhất quán nghiệp vụ A2:**
  - Xác nhận luồng thanh toán bắt buộc qua **VNPay Sandbox** (redirect + IPN + QueryDr) khớp giữa SRS (`FR`), Use-case Checkout, Sequence Diagram và cấu hình `PaymentProvider`.
  - Xác nhận quy tắc hủy đơn chỉ áp dụng tại `PENDING`, `PAYMENT_FAILED`, `PAID`; luồng hoàn tiền (`refund`) và cơ chế cộng điểm bù khi refund thất bại có khóa `idempotency` đã được phản ánh xuyên suốt từ Đặc tả yêu cầu đến Sơ đồ tuần tự và Mô hình lớp.
- **Liên kết nội bộ:** Các đường dẫn tham chiếu chéo từ `docs/README.md` và `docs/traceability-matrix.md` tới từng tài liệu thành phần đã được chuẩn hóa theo cấu trúc thư mục của repository `Brewlite-A2`.
