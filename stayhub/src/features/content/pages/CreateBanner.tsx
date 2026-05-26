import React from "react";
import { Type, Link as LinkIcon, Hash, Tag } from "lucide-react";
import { DynamicForm, type FormField } from "../../../components/dashboard/DynamicForm";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useCreateBanner } from "../hooks/useCreateBanner";

export const CreateBanner: React.FC = () => {
  const { handleSubmit, handleCancel, isSubmitting, serverErrors } = useCreateBanner();

  const bannerFields: FormField[] = [
    {
      name: "title",
      label: "Banner Title",
      type: "text",
      placeholder: "e.g. Summer Sale 2026",
      icon: <Type className="h-4 w-4" />,
      colSpan: 2,
      required: true,
    },
    {
      name: "targetUrl",
      label: "Target URL",
      type: "text",
      placeholder: "e.g. /tours/summer-sale",
      icon: <LinkIcon className="h-4 w-4" />,
      colSpan: 2,
    },
    {
      name: "priority",
      label: "Priority (Higher = Top)",
      type: "number",
      placeholder: "e.g. 1",
      icon: <Hash className="h-4 w-4" />,
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
    },
    { name: "imageFile", label: "Banner Image", type: "file", colSpan: 2, required: true },
  ];

  return (
    <>
      <DynamicForm
        title="Create New Banner"
        description="Upload a new banner to display on the home page."
        fields={bannerFields}
        initialValues={{ isActive: "Active", priority: 0 }}
        onSubmit={handleSubmit}
        serverErrors={serverErrors}
        onCancel={handleCancel}
      />
      <LoadingOverlay isOpen={isSubmitting} message="Creating banner..." />
    </>
  );
};