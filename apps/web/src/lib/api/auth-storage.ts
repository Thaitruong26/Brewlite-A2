import type { AuthStoreState, User } from "./types";

const STORAGE_KEY = "brewlite.auth";

// Chức năng: Hàm readAuth. Cách hoạt động: Thực thi logic xử lý nghiệp vụ của module và trả về kết quả cho nơi gọi.
export function readAuth(): AuthStoreState {
  if (typeof window === "undefined") return { accessToken: null, user: null };

  try {
    const sessionSaved = window.sessionStorage.getItem(STORAGE_KEY);
    if (sessionSaved) {
      const value = JSON.parse(sessionSaved) as Partial<AuthStoreState>;
      if (value.accessToken) {
        return { accessToken: value.accessToken ?? null, user: value.user ?? null };
      }
    }

    const sessionToken =
      window.sessionStorage.getItem("brewlite_access_token") ||
      window.sessionStorage.getItem("accessToken") ||
      window.sessionStorage.getItem("token");

    if (sessionToken) {
      let sessionUser: User | null = null;
      const userStr = window.sessionStorage.getItem("brewlite_user");
      if (userStr) sessionUser = JSON.parse(userStr);
      return { accessToken: sessionToken, user: sessionUser };
    }
  } catch {
    // ignore
  }

  try {
    const localSaved = window.localStorage.getItem(STORAGE_KEY);
    if (localSaved) {
      const value = JSON.parse(localSaved) as Partial<AuthStoreState>;
      if (value.accessToken) {
        try {
          window.sessionStorage.setItem(STORAGE_KEY, localSaved);
          if (value.accessToken) window.sessionStorage.setItem("brewlite_access_token", value.accessToken);
          if (value.user) window.sessionStorage.setItem("brewlite_user", JSON.stringify(value.user));
        } catch {}
        return { accessToken: value.accessToken ?? null, user: value.user ?? null };
      }
    }

    const token =
      window.localStorage.getItem("brewlite_access_token") ||
      window.localStorage.getItem("accessToken") ||
      window.localStorage.getItem("token");

    let user: User | null = null;
    const userStr = window.localStorage.getItem("brewlite_user");
    if (userStr) {
      user = JSON.parse(userStr);
    } else {
      const authStorage = window.localStorage.getItem("auth-storage");
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        user = parsed?.state?.user ?? null;
      }
    }

    if (token) {
      try {
        window.sessionStorage.setItem("brewlite_access_token", token);
        if (user) window.sessionStorage.setItem("brewlite_user", JSON.stringify(user));
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ accessToken: token, user }));
      } catch {}
      return { accessToken: token, user };
    }
  } catch {
    // ignore
  }

  return { accessToken: null, user: null };
}

// Chức năng: Cập nhật dữ liệu (saveAuth). Cách hoạt động: Xác thực dữ liệu thay đổi và cập nhật trạng thái vào hệ thống/state.
export function saveAuth(accessToken: string, user: User) {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify({ accessToken, user });

  try {
    window.sessionStorage.setItem(STORAGE_KEY, payload);
    window.sessionStorage.setItem("brewlite_access_token", accessToken);
    window.sessionStorage.setItem("accessToken", accessToken);
    window.sessionStorage.setItem("brewlite_user", JSON.stringify(user));
  } catch {}

  try {
    window.localStorage.setItem(STORAGE_KEY, payload);
    window.localStorage.setItem("brewlite_access_token", accessToken);
    window.localStorage.setItem("accessToken", accessToken);
    window.localStorage.setItem("brewlite_user", JSON.stringify(user));
    window.localStorage.setItem(
      "auth-storage",
      JSON.stringify({ state: { token: accessToken, user, isAuthenticated: true } }),
    );
  } catch {}

  window.dispatchEvent(new Event("brewlite:auth-change"));
}

// Chức năng: Xóa hoặc dọn dẹp dữ liệu (clearAuth). Cách hoạt động: Loại bỏ dữ liệu khỏi bộ nhớ trình duyệt.
export function clearAuth() {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
    window.sessionStorage.removeItem("brewlite_access_token");
    window.sessionStorage.removeItem("accessToken");
    window.sessionStorage.removeItem("token");
    window.sessionStorage.removeItem("brewlite_user");
  } catch {}

  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem("brewlite_access_token");
    window.localStorage.removeItem("accessToken");
    window.localStorage.removeItem("token");
    window.localStorage.removeItem("brewlite_user");
    window.localStorage.removeItem("auth-storage");
  } catch {}

  window.dispatchEvent(new Event("brewlite:auth-change"));
}

// Chức năng: Lấy dữ liệu AccessToken. Cách hoạt động: Truy vấn dữ liệu và trả về kết quả đã định dạng.
export function getAccessToken() {
  return readAuth().accessToken;
}
