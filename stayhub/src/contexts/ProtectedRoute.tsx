import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import { PATH } from "../config/routes/route";
import { normalizeRoles } from "../utils/jwt";

interface ProtectedRouteProps {
    allowedRoles?: string[]; // Kiểm tra theo list Role từ JWT Claims (ví dụ: ["ADMIN", "STAFF"])
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) return null; // hoặc <LoadingSpinner />

    if (!user) {
        return <Navigate to={PATH.PUBLIC.LOGIN} replace />;
    }

    // Nếu truyền mảng roles vào (Hệ thống mới)
    if (allowedRoles && allowedRoles.length > 0) {
        const upperUserRoles = normalizeRoles(user.roles);
        const hasAccess = allowedRoles.some(role => upperUserRoles.includes(role.toUpperCase()));

        if (!hasAccess) {
            return <Navigate to={PATH.PUBLIC.UNAUTHORIZED} replace />; // Đăng nhập rồi nhưng không có Role tương ứng -> Đẩy về trang báo lỗi
        }
    } 

    return <Outlet />;
};

export default ProtectedRoute;