import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Building, CreditCard, User, AlignLeft, Hash } from "lucide-react";
import { DynamicForm, type FormField } from "../../../components/dashboard/DynamicForm";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useCreateCancellation } from "../hooks/useCreateCancellation";
import { useToast } from "../../../contexts/ToastContext";
import type { CreateCancellationRequestDTO } from "../types/cancellation";
import { CUSTOMER_ROUTES } from "../../../config/routes/customer.routes";

export const CreateCancellationRequestPage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // Lấy Order ID từ URL (/my-bookings/:id/request-refund)
  const navigate = useNavigate();
  const { mutateAsync: createRequest, isPending } = useCreateCancellation();
  const { success, error } = useToast();

  const cancellationFields: FormField[] = [
    {
      name: "bankName",
      label: "Bank Name",
      type: "text",
      placeholder: "e.g. Vietcombank",
      icon: <Building className="h-4 w-4" />,
      colSpan: 1,
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