import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Building, CreditCard, User, AlignLeft } from "lucide-react";
import { DynamicForm, type FormField } from "../../../components/dashboard/DynamicForm";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useCreateCancellation } from "../hooks/useCreateCancellation";
import { useToast } from "../../../contexts/ToastContext";
import type { CreateCancellationRequestDTO } from "../types/cancellation";
import { CUSTOMER_ROUTES } from "../../../config/routes/customer.routes";

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
  const { id } = useParams<{ id: string }>(); // Lấy Order ID từ URL (/my-bookings/:id/request-refund)
  const navigate = useNavigate();
  const { mutateAsync: createRequest, isPending } = useCreateCancellation();
  const { success, error } = useToast();
  const [banks, setBanks] = useState<VietQrBank[]>([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(true);
  const [bankLoadError, setBankLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadBanks = async () => {
      try {
        setIsLoadingBanks(true);
        setBankLoadError("");

        const response = await fetch("https://api.vietqr.io/v2/banks");
        if (!response.ok) {
          throw new Error("Unable to load bank list.");
        }

        const payload = await response.json();
        const bankData = Array.isArray(payload?.data) ? payload.data : [];

        if (isMounted) {
          setBanks(bankData);
        }
      } catch {
        if (isMounted) {
          setBankLoadError("Unable to load live bank list. Showing common banks instead.");
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
  }, []);

  const bankOptions = useMemo(() => {
    if (banks.length === 0) return FALLBACK_BANK_OPTIONS;

    return banks
      .slice()
      .sort((a, b) => (a.shortName || a.name).localeCompare(b.shortName || b.name))
      .map((bank) => ({
        label: `${bank.shortName || bank.code || "Bank"} - ${bank.name}`,
        value: bank.name,
      }));
  }, [banks]);

  const cancellationFields: FormField[] = [
    {
      name: "bankName",
      label: "Bank Name",
      type: "select",
      placeholder: isLoadingBanks ? "Loading banks..." : "Select bank",
      icon: <Building className="h-4 w-4" />,
      options: isLoadingBanks ? [{ label: "Loading banks...", value: "" }] : bankOptions,
      colSpan: 2,
      required: true,
    },
    {
      name: "accountNumber",
      label: "Account Number",
      type: "text",
      icon: <CreditCard className="h-4 w-4" />,
      colSpan: 1,
      required: true,
    },
    {
      name: "accountHolderName",
      label: "Account Holder Name",
      type: "text",
      icon: <User className="h-4 w-4" />,
      colSpan: 1,
      required: true,
    },
    {
      name: "reason",
      label: "Reason for Cancellation",
      type: "textarea",
      icon: <AlignLeft className="h-4 w-4" />,
      colSpan: 2,
      required: true,
    },
  ];

  const handleSubmit = async (formData: Record<string, any>) => {
    try {
      const payload = {
        ...formData,
        orderId: Number(id), // Tự động lấy Order ID từ URL truyền vào API
      };
      await createRequest(payload as CreateCancellationRequestDTO);
      success("Cancellation request submitted successfully. Please wait for admin approval.");
      navigate(CUSTOMER_ROUTES.MY_BOOKINGS); // Về trang quản lý My Bookings sau khi thành công
    } catch (err: any) {
      error(err?.response?.data?.message || "Failed to submit cancellation request.");
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
        title="Request Tour Cancellation"
        description={`Please provide your bank details to receive the refund for Order #${id}.`}
        fields={cancellationFields}
        onSubmit={handleSubmit}
        submitText="Submit Request"
        onCancel={() => navigate(-1)}
      />
      <LoadingOverlay isOpen={isPending} message="Submitting your request..." />
    </div>
  );
};
