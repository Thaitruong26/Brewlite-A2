import { apiRequest } from "./client";
import type { LoginResponse, RegisterRequest, User } from "./types";

// Chức năng: Hàm login(email, password). Cách hoạt động: Thực thi logic xử lý nghiệp vụ của module và trả về kết quả cho nơi gọi.
export function login(email: string, password: string) {
  return apiRequest<LoginResponse>("/auth/login", { method: "POST", body: { email, password } });
}

// Chức năng: Hàm register(payload). Cách hoạt động: Thực thi logic xử lý nghiệp vụ của module và trả về kết quả cho nơi gọi.
export function register(payload: RegisterRequest) {
  return apiRequest<User>("/auth/register", { method: "POST", body: payload });
}
