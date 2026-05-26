import React from "react";
import { Type, AlignLeft, Tag } from "lucide-react";
import { DynamicForm, type FormField } from "../../../components/dashboard/DynamicForm";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useUpdateCategory } from "../hooks/useUpdateCategory";
import { getImg } from "../../../config/api/api";

export const UpdateCategory: React.FC = () => {
  const { id, category, isFetching, fetchError, isSubmitting, serverErrors, handleSubmit, handleCancel } = useUpdateCategory();

  if (isFetching) return <div className="flex justify-center p-10 text-slate-500">Loading category details...</div>;
  if (fetchError) return <div className="flex justify-center p-10 text-rose-500">{fetchError}</div>;
  if (!category) return <div className="flex justify-center p-10 text-slate-500">Category not found.</div>;

  const categoryFields: FormField[] = [
    {
      name: "name",
      label: "Category Name",
      type: "text",
      icon: <Type className="h-4 w-4" />,
      colSpan: 1,
      required: true,
    },
    {
      name: "slug",
      label: "Slug",
      type: "text",
      icon: <Type className="h-4 w-4" />,
      colSpan: 1,
      required: true,
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
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
    { name: "iconFile", label: "Category Icon (Leave empty to keep current)", type: "file", colSpan: 2 },
  ];

  return (
    <>
      <DynamicForm
        title="Update Category"
        description={`Edit details for category #${id}`}
        fields={categoryFields}
        initialValues={{ 
          ...category, 
          isActive: category.isActive ? "Active" : "Inactive", 
          iconFile: category.iconUrl ? getImg(category.iconUrl) : undefined 
        }}
        onSubmit={handleSubmit} serverErrors={serverErrors} onCancel={handleCancel} />
      <LoadingOverlay isOpen={isSubmitting} message="Updating category..." />
    </>
  );
};