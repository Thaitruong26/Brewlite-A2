# UML index and generation

Task 1: `use-case-overview`, `use-case-checkout`. Task 2: `activity-checkout`, `sequence-checkout`, `sequence-cancel-refund`, `class-domain`, `class-inventory`. Task 3: `architecture-logical`, `deployment-production`. Mỗi sơ đồ có **`.puml` (source UML editable)** và **`.svg` (hình xem/nộp)**. Các file `.dot` là nguồn kết xuất Graphviz cho bản SVG trong bộ này.

> **Chú ý nguồn ảnh:** Môi trường dựng bộ tài liệu không có PlantUML CLI; SVG được dựng từ **Graphviz DOT song song** cùng thiết kế, **không phải** biên dịch `.puml`. Khi nhóm review, hãy chạy `java -jar plantuml.jar -tsvg *.puml` và thay thế SVG để bảo đảm fidelity đúng với PlantUML. Trước khi merge cần kiểm tra và cập nhật hình để tránh sơ đồ nguồn/ảnh lệch nhau.

Bảng file và ID chính thức xem tại [traceability-matrix.md](../traceability-matrix.md). Traceability spans `UC → ACT/SEQ/CLASS → ARC/ADR → DEP`.

Activity ACT-01 có thêm [swimlane review SVG](activity-checkout-swimlanes.svg) song song với [activity decision-flow SVG](activity-checkout.svg), cả hai dựa trên cùng [PlantUML](activity-checkout.puml).
