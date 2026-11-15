ĐẶC TẢ USE CASE – CHECKOUT VÀ THANH TOÁN VNPAY

1. Tổng quan

Tài liệu mô tả quy trình thanh toán (Checkout), tạo đơn hàng, thanh toán qua VNPay và xử lý hủy đơn tại hệ thống BrewLite.

Khách hàng có thể kiểm tra giỏ hàng, tạo đơn và thanh toán thông qua VNPay Sandbox hoặc Mock Payment Provider.

Hệ thống phải quản lý nhất quán trạng thái đơn hàng, trạng thái thanh toán, tránh xử lý giao dịch trùng lặp và xử lý trường hợp hoàn tiền thất bại bằng điểm Loyalty.

2. Các tác nhân (Actors)

Tác nhân	Mô tả
Khách hàng (Customer)	Xem giỏ hàng, đặt hàng, thanh toán và hủy đơn.
VNPay	Cổng thanh toán bên ngoài, xử lý giao dịch và gửi kết quả thanh toán.
Mock Payment Provider	Mô phỏng kết quả thanh toán trong quá trình phát triển và kiểm thử.
Hệ thống (System)	Kiểm tra đơn hàng, quản lý kho, thanh toán và cập nhật trạng thái.
Nhân viên pha chế (Barista)	Tiếp nhận và quản lý đơn hàng theo quyền được cấp.

3. Tiền điều kiện (Preconditions)

* Khách hàng đã đăng ký và đăng nhập.
* Khách hàng có JWT hợp lệ.
* Giỏ hàng có ít nhất một sản phẩm hợp lệ.
* Sản phẩm và các tùy chọn được chọn còn khả dụng.
* Hệ thống có thể truy cập cơ sở dữ liệu.
* Nhà cung cấp thanh toán đã được cấu hình.

4. Hậu điều kiện (Postconditions)

4.1. Thanh toán thành công

* Đơn hàng được tạo và lưu vào hệ thống.
* Tồn kho được giữ cho đơn hàng.
* Giao dịch thanh toán được ghi nhận thành công.
* Trạng thái đơn hàng chuyển thành PAID.
* Điểm Loyalty được cộng nếu khách hàng đủ điều kiện.

4.2. Thanh toán thất bại

* Giao dịch được ghi nhận thất bại.
* Trạng thái đơn hàng chuyển thành PAYMENT_FAILED.
* Tồn kho được xử lý theo quy tắc hủy đơn và hết hạn thanh toán.

4.3. Hủy đơn hàng

* Trạng thái đơn hàng chuyển thành CANCELLED.
* Tồn kho đã giữ được hoàn lại.
* Mã khuyến mãi và điểm Loyalty đã sử dụng được hoàn nguyên khi phù hợp.
* Nếu đơn hàng đã thanh toán, hệ thống thực hiện hoàn tiền hoặc bồi hoàn bằng điểm Loyalty.

5. Đặc tả các Use Case

UC-01: Thanh toán và tạo đơn hàng (Checkout and Create Order)

Tác nhân chính: Khách hàng

Sự kiện kích hoạt: Khách hàng xác nhận đặt hàng.

Luồng chính:

1. Khách hàng truy cập trang thanh toán.
2. Hệ thống lấy thông tin giỏ hàng của khách hàng.
3. Hệ thống kiểm tra sản phẩm, số lượng và các tùy chọn.
4. Hệ thống tính tổng tiền, giảm giá và số tiền cuối cùng.
5. Khách hàng xác nhận đặt hàng.
6. Hệ thống giữ số lượng tồn kho tương ứng.
7. Hệ thống tạo đơn hàng với trạng thái PENDING.
8. Hệ thống lưu thông tin sản phẩm và giá tại thời điểm đặt hàng.
9. Hệ thống trả về thông tin đơn hàng.
10. Khách hàng chuyển sang bước thanh toán.

Luồng thay thế:

* A1: Mã khuyến mãi không hợp lệ. Hệ thống từ chối mã và thông báo cho khách hàng.
* A2: Khách hàng sử dụng điểm Loyalty. Hệ thống kiểm tra số điểm khả dụng và áp dụng số điểm hợp lệ.
* A3: Tồn kho thay đổi trong lúc đặt hàng. Hệ thống thử giữ hàng lại hoặc từ chối nếu không đủ số lượng.

Luồng ngoại lệ:

* E1: Giỏ hàng trống. Hệ thống từ chối tạo đơn.
* E2: Sản phẩm không còn khả dụng. Hệ thống thông báo cho khách hàng.
* E3: Giao dịch cơ sở dữ liệu thất bại. Hệ thống hoàn tác giao dịch.
* E4: Không thể giữ tồn kho. Hệ thống từ chối tạo đơn hàng.

UC-02: Thanh toán qua VNPay

Tác nhân chính: Khách hàng

Tác nhân phụ: VNPay

Sự kiện kích hoạt: Khách hàng chọn VNPay và yêu cầu thanh toán.

Luồng chính:

1. Khách hàng chọn phương thức thanh toán VNPay.
2. Hệ thống kiểm tra đơn hàng và quyền sở hữu đơn hàng.
3. Hệ thống kiểm tra trạng thái đơn hàng có cho phép thanh toán hay không.
4. Hệ thống kiểm tra Idempotency Key.
5. Hệ thống tạo bản ghi thanh toán với trạng thái PROCESSING.
6. Hệ thống tạo yêu cầu thanh toán và URL thanh toán VNPay.
7. Khách hàng được chuyển hướng đến VNPay.
8. Khách hàng thực hiện thanh toán.
9. VNPay chuyển khách hàng về Return URL của hệ thống.
10. Hệ thống xác thực dữ liệu trả về.
11. Hệ thống cập nhật kết quả thanh toán.
12. Nếu thanh toán thành công, trạng thái đơn hàng chuyển thành PAID.
13. Hệ thống cộng điểm Loyalty nếu đủ điều kiện.
14. Hệ thống hiển thị kết quả thanh toán.

Luồng thay thế:

* A1: Khách hàng hủy giao dịch trên VNPay. Hệ thống ghi nhận kết quả hủy hoặc thất bại theo phản hồi từ VNPay.
* A2: Khách hàng thanh toán lại sau khi thất bại. Hệ thống cho phép tạo lần thanh toán mới nếu đơn hàng vẫn hợp lệ.
* A3: Khách hàng gửi lại cùng Idempotency Key và cùng dữ liệu. Hệ thống trả về kết quả đã xử lý trước đó.
* A4: Khách hàng sử dụng cùng Idempotency Key nhưng dữ liệu khác. Hệ thống từ chối yêu cầu.

Luồng ngoại lệ:

* E1: VNPay không khả dụng. Hệ thống thông báo không thể khởi tạo thanh toán.
* E2: Chữ ký thanh toán không hợp lệ. Hệ thống từ chối phản hồi.
* E3: Số tiền hoặc mã giao dịch không khớp. Hệ thống không cập nhật đơn hàng thành PAID.
* E4: Yêu cầu thanh toán hết hạn. Hệ thống từ chối giao dịch.

UC-03: Nhận IPN và đối soát giao dịch VNPay

Tác nhân chính: VNPay

Sự kiện kích hoạt: VNPay gửi thông báo IPN đến hệ thống.

Luồng chính:

1. VNPay gửi yêu cầu IPN đến hệ thống.
2. Hệ thống xác thực chữ ký VNPay.
3. Hệ thống xác định giao dịch thanh toán và đơn hàng tương ứng.
4. Hệ thống kiểm tra mã giao dịch và số tiền.
5. Hệ thống kiểm tra thông báo đã được xử lý trước đó hay chưa.
6. Nếu hợp lệ, hệ thống cập nhật kết quả thanh toán.
7. Hệ thống cập nhật trạng thái đơn hàng tương ứng.
8. Hệ thống lưu thông tin IPN để phục vụ kiểm tra.
9. Hệ thống trả về phản hồi xác nhận cho VNPay.

Luồng thay thế:

* A1: Thông báo đã được xử lý. Hệ thống phản hồi xác nhận nhưng không thực hiện lại giao dịch.
* A2: Kết quả IPN khác với kết quả Return URL. Hệ thống sử dụng dữ liệu đã xác thực từ nhà cung cấp và quy tắc đối soát để xác định trạng thái cuối cùng.

Luồng ngoại lệ:

* E1: Chữ ký không hợp lệ. Hệ thống từ chối thông báo.
* E2: Không tìm thấy mã giao dịch. Hệ thống ghi nhận lỗi và không cập nhật nhầm đơn hàng.
* E3: Số tiền không khớp. Hệ thống từ chối cập nhật thanh toán.
* E4: Xử lý tạm thời thất bại. Hệ thống cho phép VNPay gửi lại thông báo.

Quy trình đối soát:

Hệ thống sử dụng API QueryDr của VNPay để truy vấn trạng thái giao dịch khi không nhận được IPN hoặc kết quả thanh toán chưa xác định. Quá trình đối soát phải hỗ trợ xử lý lặp an toàn (Idempotency).

UC-04: Hủy đơn hàng (Cancel Order)

Tác nhân chính: Khách hàng

Sự kiện kích hoạt: Khách hàng gửi yêu cầu hủy đơn hàng.

Tiền điều kiện: Khách hàng là chủ sở hữu đơn hàng.

Quy tắc nghiệp vụ:

* Chỉ cho phép hủy đơn ở các trạng thái PENDING, PAYMENT_FAILED và PAID.
* Không cho phép hủy đơn ở các trạng thái khác.
* Không xử lý hủy đơn khi giao dịch thanh toán vẫn đang ở trạng thái PROCESSING, cho đến khi xác định được kết quả thanh toán.

Luồng chính:

1. Khách hàng gửi yêu cầu hủy đơn.
2. Hệ thống truy xuất thông tin đơn hàng.
3. Hệ thống xác thực quyền sở hữu và trạng thái đơn hàng.
4. Hệ thống kiểm tra điều kiện cho phép hủy.
5. Hệ thống kiểm tra trạng thái thanh toán.
6. Hệ thống hoàn lại số lượng tồn kho đã giữ.
7. Hệ thống hoàn nguyên lượt sử dụng khuyến mãi và điểm Loyalty phù hợp.
8. Nếu đơn hàng ở trạng thái PAID, hệ thống khởi tạo quy trình hoàn tiền.
9. Hệ thống cập nhật trạng thái đơn hàng thành CANCELLED.
10. Hệ thống lưu thông tin hủy đơn.

Luồng thay thế:

* A1: Đơn hàng ở trạng thái PENDING. Hệ thống hủy đơn và hoàn lại tồn kho.
* A2: Đơn hàng ở trạng thái PAYMENT_FAILED. Hệ thống hủy đơn và hoàn nguyên các khoản đã áp dụng.
* A3: Đơn hàng ở trạng thái PAID. Hệ thống thực hiện quy trình hoàn tiền.

Luồng ngoại lệ:

* E1: Không tìm thấy đơn hàng. Hệ thống trả về lỗi.
* E2: Khách hàng không sở hữu đơn hàng. Hệ thống từ chối yêu cầu.
* E3: Trạng thái đơn hàng không cho phép hủy. Hệ thống từ chối yêu cầu.
* E4: Thanh toán đang PROCESSING. Hệ thống từ chối hoặc trì hoãn hủy đơn cho đến khi có kết quả thanh toán.

UC-05: Hoàn tiền và bồi hoàn bằng điểm Loyalty

Tác nhân chính: Hệ thống

Sự kiện kích hoạt: Đơn hàng đã thanh toán được hủy.

Luồng chính:

1. Hệ thống xác định giao dịch thanh toán thành công của đơn hàng.
2. Hệ thống tạo yêu cầu hoàn tiền.
3. Hệ thống gửi yêu cầu đến nhà cung cấp thanh toán.
4. Hệ thống kiểm tra kết quả hoàn tiền.
5. Nếu hoàn tiền thành công, hệ thống lưu mã tham chiếu, số tiền và thời gian hoàn tiền.
6. Nếu hoàn tiền thất bại, hệ thống tính số điểm Loyalty tương đương giá trị cần hoàn.
7. Hệ thống cộng điểm bồi hoàn cho khách hàng.
8. Hệ thống lưu giao dịch cộng điểm.
9. Hệ thống hoàn tất trạng thái hủy đơn.
10. Hệ thống ngăn chặn việc hoàn tiền hoặc cộng điểm trùng lặp.

Luồng thay thế:

* A1: Hoàn tiền thành công. Khách hàng nhận tiền qua phương thức thanh toán ban đầu.
* A2: Hoàn tiền thất bại. Khách hàng nhận điểm Loyalty tương đương giá trị được hoàn.
* A3: Kết quả hoàn tiền chưa xác định. Hệ thống đối soát giao dịch trước khi cộng điểm bồi hoàn.

Luồng ngoại lệ:

* E1: Nhà cung cấp hoàn tiền không khả dụng. Hệ thống ghi nhận lỗi và thực hiện thử lại hoặc chuyển sang bồi hoàn theo chính sách.
* E2: Thao tác cộng điểm thất bại. Hệ thống ghi nhận lỗi để xử lý lại.
* E3: Yêu cầu hoàn tiền bị gửi trùng. Hệ thống trả về kết quả đã có.
* E4: Yêu cầu bồi hoàn bị gửi trùng. Hệ thống không cộng điểm nhiều lần.

Quy tắc tính điểm bồi hoàn:

Tỷ lệ quy đổi từ tiền sang điểm Loyalty phải được xác định theo quy tắc nghiệp vụ của nhóm. Hệ thống lưu giá trị tiền, tỷ lệ quy đổi và số điểm đã cộng để phục vụ đối soát.

6. Mô hình trạng thái đơn hàng

Trạng thái hiện tại	Trạng thái tiếp theo được phép
PENDING	PAID, PAYMENT_FAILED, CANCELLED
PAYMENT_FAILED	PENDING, CANCELLED
PAID	PREPARING, CANCELLED
PREPARING	READY
READY	COMPLETED
COMPLETED	Không có
CANCELLED	Không có

Hệ thống phải từ chối mọi chuyển đổi trạng thái không nằm trong danh sách được phép.

7. Yêu cầu chức năng (Functional Requirements)

Mã	Nội dung yêu cầu
FR-01	Hệ thống xác thực khách hàng bằng JWT.
FR-02	Hệ thống kiểm tra sản phẩm và tồn kho trước khi tạo đơn.
FR-03	Hệ thống tính tổng tiền và các khoản giảm giá.
FR-04	Hệ thống giữ tồn kho khi tạo đơn hàng.
FR-05	Đơn hàng mới được tạo với trạng thái PENDING.
FR-06	Hệ thống hỗ trợ VNPay Sandbox và Mock Payment Provider.
FR-07	Hệ thống tạo và xác thực yêu cầu thanh toán VNPay.
FR-08	Hệ thống xử lý kết quả trả về từ VNPay Return URL.
FR-09	Hệ thống xử lý thông báo VNPay IPN.
FR-10	Hệ thống hỗ trợ đối soát giao dịch bằng QueryDr.
FR-11	Hệ thống kiểm soát tính Idempotency của giao dịch thanh toán.
FR-12	Hệ thống chỉ cho phép hủy đơn ở trạng thái PENDING, PAYMENT_FAILED, PAID.
FR-13	Hệ thống hoàn lại tồn kho khi hủy đơn.
FR-14	Hệ thống hoàn tiền cho đơn hàng đã thanh toán nhưng bị hủy.
FR-15	Nếu hoàn tiền thất bại, hệ thống cộng điểm Loyalty tương đương giá trị cần hoàn theo chính sách quy đổi.
FR-16	Hệ thống ngăn chặn hoàn tiền và bồi hoàn trùng lặp.
FR-17	Hệ thống lưu lịch sử đơn hàng và giao dịch thanh toán.

8. Yêu cầu phi chức năng (Non-Functional Requirements)

Mã	Nội dung yêu cầu
NFR-01	Bảo mật: Yêu cầu thanh toán và callback phải được xác thực bằng chữ ký VNPay.
NFR-02	Bảo mật: Thông tin cấu hình thanh toán phải được lưu trong biến môi trường.
NFR-03	Độ tin cậy: Quy trình thanh toán phải hỗ trợ xử lý Idempotency.
NFR-04	Tính nhất quán: Các thao tác cập nhật đơn hàng, thanh toán, tồn kho, khuyến mãi và Loyalty phải duy trì tính nhất quán dữ liệu.
NFR-05	Hiệu năng: Checkout và khởi tạo thanh toán phải phản hồi trong thời gian phù hợp với hệ thống.
NFR-06	Khả năng kiểm tra: Các thao tác thanh toán, hoàn tiền, hủy đơn và bồi hoàn phải được ghi nhận.
NFR-07	Khả năng bảo trì: Các nhà cung cấp thanh toán phải tuân theo cùng một cấu trúc Payment Provider.
NFR-08	Khả năng kiểm thử: Quy trình thanh toán phải hỗ trợ Mock Payment Provider và kiểm thử tích hợp VNPay Sandbox.

9. Bảng truy vết yêu cầu và kiểm thử (Test Case Traceability)

Mã kiểm thử	Yêu cầu liên quan	Kịch bản kiểm thử	Kết quả mong đợi
TC-01	FR-01	Khách hàng đăng nhập bằng thông tin hợp lệ	Hệ thống trả về JWT
TC-02	FR-02, FR-03	Khách hàng Checkout với giỏ hàng hợp lệ	Tổng tiền được tính chính xác
TC-03	FR-04, FR-05	Khách hàng tạo đơn hàng	Tồn kho được giữ, đơn có trạng thái PENDING
TC-04	FR-02	Khách hàng đặt sản phẩm hết hàng	Hệ thống từ chối Checkout
TC-05	FR-06, FR-07	Khách hàng khởi tạo thanh toán VNPay	Hệ thống tạo URL thanh toán
TC-06	FR-08	VNPay Return URL trả về kết quả thành công	Hệ thống xác thực và xử lý kết quả
TC-07	FR-09	VNPay gửi IPN hợp lệ	Thanh toán và đơn hàng được cập nhật
TC-08	FR-10	Hệ thống đối soát giao dịch chưa rõ kết quả	Trạng thái giao dịch được truy vấn
TC-09	FR-11	Gửi hai lần cùng Idempotency Key	Không xử lý giao dịch trùng
TC-10	FR-12	Hủy đơn PENDING	Đơn chuyển thành CANCELLED
TC-11	FR-12	Hủy đơn PAYMENT_FAILED	Đơn chuyển thành CANCELLED
TC-12	FR-12	Hủy đơn PAID	Quy trình hoàn tiền được khởi tạo
TC-13	FR-12	Hủy đơn PREPARING	Hệ thống từ chối hủy
TC-14	FR-13	Hủy đơn đủ điều kiện	Tồn kho được hoàn lại
TC-15	FR-14	Hoàn tiền thành công	Kết quả hoàn tiền được lưu
TC-16	FR-15	Hoàn tiền thất bại	Điểm Loyalty tương đương được cộng
TC-17	FR-16	Gửi lại yêu cầu bồi hoàn	Điểm không bị cộng trùng
TC-18	FR-17	Khách hàng xem lịch sử đơn hàng	Chỉ trả về dữ liệu được phép truy cập

10. Các quy tắc nghiệp vụ cần xác nhận

Những nội dung sau cần được nhóm thống nhất trước khi triển khai:

* Tỷ lệ quy đổi tiền sang điểm Loyalty khi bồi hoàn.
* Có thực hiện thử lại hoàn tiền trước khi bồi hoàn bằng điểm hay không.
* Quy tắc ánh xạ trạng thái giao dịch VNPay.
* API hoàn tiền và cơ chế Idempotency cho hoàn tiền.
* Thời hạn thanh toán và lịch đối soát.
* Quy định hủy đơn đã thanh toán trước hoặc sau khi chuyển sang trạng thái chuẩn bị.

Các quy tắc này phải thống nhất giữa Backend, Frontend và kiểm thử.

11. Phạm vi tài liệu

Tài liệu tập trung vào quy trình Checkout, tạo đơn hàng, khởi tạo thanh toán, xử lý VNPay Return URL, IPN, đối soát giao dịch, hủy đơn, hoàn tiền và bồi hoàn điểm Loyalty.

Tài liệu không mô tả chi tiết cách triển khai nội bộ của chức năng quản lý sản phẩm, hạ tầng xác thực hoặc toàn bộ chương trình Loyalty.

## Ma trận xử lý Checkout và thanh toán

| Tình huống | Trạng thái đơn hàng | Xử lý hệ thống |
|---|---|---|
| Tạo đơn hàng thành công | PENDING | Lưu đơn hàng và chờ thanh toán |
| Thanh toán VNPay thành công | PAID | Cập nhật trạng thái đơn hàng và ghi nhận giao dịch |
| Thanh toán thất bại | PAYMENT_FAILED | Ghi nhận lỗi và cho phép người dùng thử lại |
| Người dùng hủy đơn trước thanh toán | CANCELLED | Hủy đơn và giải phóng tồn kho |
| Thanh toán thành công nhưng người dùng hủy đơn | CANCELLED | Thực hiện quy trình hoàn tiền |
| Nhận callback trùng lặp | Không đổi | Kiểm tra giao dịch đã xử lý để tránh ghi nhận nhiều lần |
| Callback không hợp lệ | Không đổi | Từ chối xử lý và ghi nhận thông tin đối soát |

*Nguyên tắc xử lý:*
- Chỉ ghi nhận thanh toán thành công sau khi xác minh dữ liệu phản hồi từ VNPay.
- Một giao dịch chỉ được xử lý thành công một lần.
- Không tự động chuyển trạng thái đơn hàng nếu callback không hợp lệ.
- Ghi nhận lịch sử giao dịch để phục vụ đối soát và xử lý khiếu nại.
