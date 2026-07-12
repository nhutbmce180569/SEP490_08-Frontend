import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import { PATH } from "../config/routes/route";

const GuestRoute: React.FC = () => {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent"></div>
            </div>
        );
    }

    if (user) {
        return <Navigate to={PATH.PUBLIC.HOME} replace />;
    }

    return <Outlet />;
};

export default GuestRoute;
