import React from "react";
import { AlignLeft, Tag, Type } from "lucide-react";
import { DynamicForm, type FormField } from "../../../components/dashboard/DynamicForm";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useCreateTicketType } from "../hooks/useCreateTicketType";

const ticketTypeFields: FormField[] = [
  {
    name: "name",
    label: "Ticket Type Name",
    type: "text",
    placeholder: "e.g. Adult",
    icon: <Type className="h-4 w-4" />,
    colSpan: 1,
    required: true,
    validate: (value) =>
      String(value || "").trim().length > 100
        ? "Ticket type name cannot exceed 100 characters."
        : undefined,
  },
  {
    name: "isActive",
    label: "Status",
    type: "select",
    icon: <Tag className="h-4 w-4" />,
    options: [
      { label: "Active", value: "Active" },
      { label: "Inactive", value: "Inactive" },
    ],
    required: true,
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    placeholder: "Brief description of this ticket type...",
    icon: <AlignLeft className="h-4 w-4" />,
    colSpan: 2,
  },
];

export const CreateTicketType: React.FC = () => {
  const { handleSubmit, handleCancel, isSubmitting, serverErrors } = useCreateTicketType();

  return (
    <>
      <DynamicForm
        title="Create New Ticket Type"
        description="Add a ticket type that can be used by tours and bookings."
        fields={ticketTypeFields}
        initialValues={{ isActive: "Active" }}
        onSubmit={handleSubmit}
        serverErrors={serverErrors}
        onCancel={handleCancel}
      />
      <LoadingOverlay isOpen={isSubmitting} message="Creating ticket type..." />
    </>
  );
};
