"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/store/auth-store";
import { readAuth } from "@/lib/api/auth-storage";
import { LoadingState } from "@/components/ui/loading-state";

// Chức năng: Component giao diện RequireAuth. Cách hoạt động: Quản lý trạng thái hiển thị bằng React hooks và render cấu trúc JSX tương ứng.
export function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuthStore((state) => state.accessToken);
  const hydrate = useAuthStore((state) => state.hydrate);
  useEffect(() => {
    hydrate();
    if (!readAuth().accessToken) {
      const query = window.location.search.slice(1);
      const next = `${pathname}${query ? `?${query}` : ""}`;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [hydrate, pathname, router]);
  if (!token) return <LoadingState label="Kiểm tra phiên đăng nhập..." />;
  return children;
}
