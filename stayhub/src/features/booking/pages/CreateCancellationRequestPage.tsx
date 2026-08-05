import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Building, CreditCard, User, AlignLeft } from "lucide-react";
import { DynamicForm, type FormField } from "../../../components/dashboard/DynamicForm";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useCreateCancellation } from "../hooks/useCreateCancellation";
import { useToast } from "../../../contexts/ToastContext";
import type { CreateCancellationRequestDTO } from "../types/cancellation";
import { CUSTOMER_ROUTES } from "../../../config/routes/customer.routes";
import { useTranslation } from "../../../contexts/LocaleContext";

type VietQrBank = {
  id: number;
  name: string;
  code?: string;
  shortName?: string;
};

const FALLBACK_BANK_OPTIONS = [
  { label: "Vietcombank - Ngan hang TMCP Ngoai thuong Viet Nam", value: "Ngan hang TMCP Ngoai thuong Viet Nam" },
  { label: "BIDV - Ngan hang TMCP Dau tu va Phat trien Viet Nam", value: "Ngan hang TMCP Dau tu va Phat trien Viet Nam" },
  { label: "VietinBank - Ngan hang TMCP Cong thuong Viet Nam", value: "Ngan hang TMCP Cong thuong Viet Nam" },
  { label: "Techcombank - Ngan hang TMCP Ky thuong Viet Nam", value: "Ngan hang TMCP Ky thuong Viet Nam" },
  { label: "MB Bank - Ngan hang TMCP Quan doi", value: "Ngan hang TMCP Quan doi" },
  { label: "ACB - Ngan hang TMCP A Chau", value: "Ngan hang TMCP A Chau" },
];

export const CreateCancellationRequestPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { mutateAsync: createRequest, isPending } = useCreateCancellation();
  const { success, error } = useToast();
  const [banks, setBanks] = useState<VietQrBank[]>([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(true);
  const [bankLoadError, setBankLoadError] = useState("");
  const [bankSearch, setBankSearch] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadBanks = async () => {
      try {
        setIsLoadingBanks(true);
        setBankLoadError("");

        const response = await fetch("https://api.vietqr.io/v2/banks");
        if (!response.ok) {
          throw new Error(t("tour.unableLoadBankList"));
        }

        const payload = await response.json();
        const bankData = Array.isArray(payload?.data) ? payload.data : [];

        if (isMounted) {
          setBanks(bankData);
        }
      } catch {
        if (isMounted) {
          setBankLoadError(t("booking.bankLoadFallback"));
        }
      } finally {
        if (isMounted) {
          setIsLoadingBanks(false);
        }
      }
    };

    loadBanks();

    return () => {
      isMounted = false;
    };
  }, [t]);

  const bankOptions = useMemo(() => {
    const source = banks.length > 0 ? banks.map(bank => ({
      label: `${bank.shortName || bank.code || t("tour.bankFallbackLabel")} - ${bank.name}`,
      value: bank.name,
    })) : FALLBACK_BANK_OPTIONS;

    const sorted = source.sort((a, b) => a.label.localeCompare(b.label));

    if (!bankSearch.trim()) {
      return sorted;
    }

    const searchTerm = bankSearch.trim().toLowerCase();
    return sorted.filter(option =>
      option.label.toLowerCase().includes(searchTerm)
    );
  }, [banks, t, bankSearch]);

  const cancellationFields: FormField[] = useMemo(
    () => [
      {
        name: "bankName",
        label: t("booking.bankName"),
        type: "select",
        searchable: true,
        searchPlaceholder: t("booking.searchBankPlaceholder") || "Tìm kiếm ngân hàng...",
        searchValue: bankSearch,
        onSearchChange: setBankSearch,
        placeholder: isLoadingBanks ? t("booking.loadingBanks") : t("booking.selectBank"),
        icon: <Building className="h-4 w-4" />,
        options: isLoadingBanks ? [{ label: t("booking.loadingBanks"), value: "" }] : bankOptions,
        colSpan: 2,
        required: true,
      },
      {
        name: "accountNumber",
        label: t("booking.accountNumber"),
        type: "text",
        icon: <CreditCard className="h-4 w-4" />,
        colSpan: 1,
        required: true,
      },
      {
        name: "accountHolderName",
        label: t("booking.accountHolderName"),
        type: "text",
        icon: <User className="h-4 w-4" />,
        colSpan: 1,
        required: true,
      },
      {
        name: "reason",
        label: t("booking.reasonForCancellation"),
        type: "textarea",
        icon: <AlignLeft className="h-4 w-4" />,
        colSpan: 2,
        required: true,
      },
    ],
    [t, isLoadingBanks, bankOptions, bankSearch],
  );

  const handleSubmit = async (formData: Record<string, unknown>) => {
    try {
      const payload = {
        ...formData,
        orderId: Number(id),
      };
      await createRequest(payload as CreateCancellationRequestDTO);
      success(t("booking.cancellationSubmitted"));
      navigate(CUSTOMER_ROUTES.MY_BOOKINGS);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
          
      if (message === "PendingCancellationExists") {
        message = t("booking.PendingCancellationExists");
      }
      error(message || t("booking.cancellationSubmitFailed"));
    }
  };

  return (
    <div className="mx-auto max-w-3xl py-8 px-4">
      {bankLoadError && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
          {bankLoadError}
        </div>
      )}
      <DynamicForm
        title={t("booking.requestTourCancellation")}
        description={t("booking.cancellationBankDesc", { id: id ?? "" })} 
        fields={cancellationFields}
        onSubmit={handleSubmit}
        submitText={t("booking.submitRequest")}
        onCancel={() => navigate(-1)}
      /> 
      <LoadingOverlay isOpen={isPending} message={t("booking.submittingRequest")} />
    </div>
  );
};
