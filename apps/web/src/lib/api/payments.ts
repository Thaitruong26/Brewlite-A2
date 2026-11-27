import { apiRequest } from "./client";

export type PaymentMethod = "WALLET" | "CARD";

export interface CreatePaymentRequest {
  orderId: number;
  method: PaymentMethod;
  mockResult?: "SUCCESS" | "FAILED";
}

export interface PaymentResponse {
  id?: number;
  orderId?: number;
  amount?: number;
  method?: PaymentMethod;
  status: string;
  message?: string;
}

// Chức năng: Tạo mới hoặc thêm dữ liệu (createPayment). Cách hoạt động: Kiểm tra đầu vào (payload, idempotencyKey), thực hiện lưu trữ và trả về bản ghi vừa tạo.
export function createPayment(
  payload: CreatePaymentRequest,
  idempotencyKey: string
) {
  return apiRequest<PaymentResponse>("/payments", {
    method: "POST",
    authenticated: true,
    headers: {
      "Idempotency-Key": idempotencyKey,
    },
    body: payload,
  });
}
