import React from "react";
import { Type, AlignLeft, Tag } from "lucide-react";
import { DynamicForm, type FormField } from "../../../components/dashboard/DynamicForm";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useCreateCategory } from "../hooks/useCreateCategory";

export const CreateCategory: React.FC = () => {
  const { handleSubmit, handleCancel, isSubmitting, serverErrors } = useCreateCategory();

  const categoryFields: FormField[] = [
    {
      name: "name",
      label: "Category Name",
      type: "text",
      placeholder: "e.g. Adventure Tours",
      icon: <Type className="h-4 w-4" />,
      colSpan: 1,
      required: true,
    },
    {
      name: "slug",
      label: "Slug",
      type: "text",
      placeholder: "e.g. adventure-tours",
      icon: <Type className="h-4 w-4" />,
      colSpan: 1,
      required: true,
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      placeholder: "Brief description of the category...",
      icon: <AlignLeft className="h-4 w-4" />,
      colSpan: 2,
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
    { name: "iconFile", label: "Category Icon", type: "file", colSpan: 2 },
  ];

  return (
    <>
      <DynamicForm
        title="Create New Category"
        description="Add a new tour category to the system."
        fields={categoryFields}
        initialValues={{ isActive: "Active" }}
        onSubmit={handleSubmit}
        serverErrors={serverErrors}
        onCancel={handleCancel}
      />
      <LoadingOverlay isOpen={isSubmitting} message="Creating category..." />
    </>
  );
};