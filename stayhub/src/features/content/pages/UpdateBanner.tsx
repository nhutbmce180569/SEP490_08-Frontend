import React from "react";
import { Type, Link as LinkIcon, Hash, Tag } from "lucide-react";
import { DynamicForm, type FormField } from "../../../components/dashboard/DynamicForm";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useUpdateBanner } from "../hooks/useUpdateBanner";
import { getImg } from "../../../config/api/api";

export const UpdateBanner: React.FC = () => {
  const { id, banner, isFetching, fetchError, isSubmitting, serverErrors, handleSubmit, handleCancel } = useUpdateBanner();

  if (isFetching) return <div className="flex justify-center p-10 text-slate-500">Loading banner details...</div>;
  if (fetchError) return <div className="flex justify-center p-10 text-rose-500">{fetchError}</div>;
  if (!banner) return <div className="flex justify-center p-10 text-slate-500">Banner not found.</div>;

  const bannerFields: FormField[] = [
    {
      name: "title",
      label: "Banner Title",
      type: "text",
      icon: <Type className="h-4 w-4" />,
      colSpan: 2,
      required: true,
    },
    {
      name: "targetUrl",
      label: "Target URL",
      type: "text",
      icon: <LinkIcon className="h-4 w-4" />,
      colSpan: 2,
    },
    {
      name: "priority",
      label: "Priority (Higher = Top)",
      type: "number",
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
    { name: "imageFile", label: "Banner Image (Leave empty to keep current)", type: "file", colSpan: 2 },
  ];

  return (
    <>
      <DynamicForm
        title="Update Banner"
        description={`Edit details for banner #${id}`}
        fields={bannerFields}
        initialValues={{ 
          ...banner, 
          isActive: banner.isActive ? "Active" : "Inactive", 
          imageFile: banner.imageUrl ? getImg(banner.imageUrl) : undefined 
        }}
        onSubmit={handleSubmit} serverErrors={serverErrors} onCancel={handleCancel} />
      <LoadingOverlay isOpen={isSubmitting} message="Updating banner..." />
    </>
  );
};