import React, { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { Navigate } from "react-router-dom";

interface Props {
    children: React.ReactNode;
    role: "ADMIN" | "CUSTOMER";
}

const ProtectedRoute = ({ children, role }: Props) => {
    const { accessToken, user, loadCurrentUser } = useAuthStore();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const init = async () => {
            try {
                if (accessToken && !user) {
                    await loadCurrentUser();
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        init();

        return () => {
            cancelled = true;
        };
    }, [accessToken, user, loadCurrentUser]);

    // Chờ lấy thông tin user
    if (loading) {
        return <div>Đang kiểm tra quyền truy cập...</div>;
    }

    // Không có token hoặc chưa lấy được user
    if (!accessToken || !user) {
        return <Navigate to="/login" replace />;
    }

    // Chỉ cho phép đúng role được yêu cầu
    if (user.role && user.role !== role) {
        console.log(user);
        if (user.role === "ADMIN") {
            return <Navigate to="/admin" replace />;
        } else if (user.role === "CUSTOMER") {
            return <Navigate to="/" replace />;
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;
