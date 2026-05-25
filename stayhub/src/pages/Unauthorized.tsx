import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { PATH } from '../config/routes/route'; 

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    const localUserStr = localStorage.getItem("user");
    if (localUserStr) {
      try {
        const currentUser = JSON.parse(localUserStr);
        const userRoles = Array.isArray(currentUser.roles)
          ? currentUser.roles
          : typeof currentUser.roles === "string"
          ? [currentUser.roles]
          : [];

        const upperRoles = userRoles.map((r: string) => r.toUpperCase());

        // Chuyển hướng về Dashboard mặc định dựa trên Role
        if (upperRoles.includes("ADMIN")) {
          return navigate(PATH.ADMIN.DASHBOARD);
        } else if (upperRoles.includes("MANAGER")) {
          return navigate(PATH.MANAGER.DASHBOARD);
        }
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
      }
    }
    // Mặc định đối với Customer hoặc khi không có thông tin thì đưa về trang chủ
    navigate(PATH.PUBLIC.HOME);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-rose-100">
          <ShieldAlert className="h-12 w-12 text-rose-600" />
        </div>
        <h1 className="mb-2 text-3xl font-bold text-slate-900">Access Denied</h1>
        <p className="mb-8 text-slate-600">
          Bạn không có quyền truy cập vào trang này. Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là một sự nhầm lẫn.
        </p>
        <button
          onClick={handleGoBack}
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white transition-colors hover:bg-slate-800"
        >
          <ArrowLeft className="h-5 w-5" />
          Quay lại
        </button>
      </div>
    </div>
  );
};

export default Unauthorized;