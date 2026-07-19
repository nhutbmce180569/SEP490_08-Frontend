import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { PATH } from '../config/routes/route';
import { getDashboardPath } from '../utils/jwt';
import { useTranslation } from '../contexts/LocaleContext';

const Unauthorized = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleGoBack = () => {
    const localUserStr = localStorage.getItem("user");
    if (localUserStr) {
      try {
        const currentUser = JSON.parse(localUserStr);
        return navigate(getDashboardPath(currentUser.roles));
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
      }
    }
    navigate(PATH.PUBLIC.HOME);
  };


  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-rose-100">
          <ShieldAlert className="h-12 w-12 text-rose-600" />
        </div>
        <h1 className="travel-heading mb-2 text-3xl">{t("errors.accessDenied")}</h1>
        <p className="mb-8 text-slate-600">
          {t("errors.accessDeniedDesc")}
        </p>
        <button
          type="button"
          onClick={handleGoBack}
          className="flex items-center gap-2 rounded-xl bg-navy px-6 py-3 font-semibold text-white transition-colors hover:bg-navy/90"
        >
          <ArrowLeft className="h-5 w-5" />
          {t("common.goBack")}
        </button>
      </div>
    </div>
  );
};

export default Unauthorized;
