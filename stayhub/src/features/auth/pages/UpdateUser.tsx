import React from "react";
import { User as UserIcon, Phone, Users, Calendar, Tag, Shield, MapPin, Image as ImageIcon } from "lucide-react";
import { DynamicForm, type FormField } from "../../../components/dashboard/DynamicForm";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useUpdateUser } from "../hooks/useUpdateUser";
import { useRoles } from "../hooks/useRoles";

export const UpdateUser: React.FC = () => {
  const { id, user, isFetching, fetchError, isSubmitting, serverErrors, handleSubmit, handleCancel } = useUpdateUser();
  const { data: rolesList, isLoading: isRolesLoading } = useRoles();

  // Bắt buộc phải chờ cả 2 API load xong để form không bị reset giữa chừng
  if (isFetching || isRolesLoading) return <div className="flex justify-center p-10 text-slate-500">Loading user details...</div>;
  if (fetchError) return <div className="flex justify-center p-10 text-rose-500">{fetchError}</div>;
  if (!user) return <div className="flex justify-center p-10 text-slate-500">User not found.</div>;

  const roleOptions = Array.isArray(rolesList) ? rolesList.map((role: any) => ({
    label: role.name || role.Name || "Unknown",
    // Dùng !== undefined để tránh trường hợp ID = 0 bị loại bỏ sai
    value: role.id !== undefined ? role.id : role.Id,
  })) : [];

  const currentRoleIds = user?.roles?.map(roleName => {
    const found = Array.isArray(rolesList) ? rolesList.find((r: any) => r.name === roleName || r.Name === roleName) : null;
    return found ? (found.id !== undefined ? found.id : found.Id) : null;
  }).filter(Boolean);

  const userFields: FormField[] = [
    {
      name: "fullName",
      label: "Full Name",
      type: "text",
      icon: <UserIcon className="h-4 w-4" />,
      required: true,
    },
    {
      name: "avatarFile",
      label: "Avatar",
      type: "file",
      icon: <UserIcon className="h-4 w-4" />,
      colSpan: 2,
    },
    {
      name: "phoneNumber",
      label: "Phone Number",
      type: "text",
      icon: <Phone className="h-4 w-4" />,
    },
    {
      name: "gender",
      label: "Gender",
      type: "select",
      icon: <Users className="h-4 w-4" />,
      options: [
        { label: "Male", value: "Male" },
        { label: "Female", value: "Female" },
        { label: "Other", value: "Other" },
      ],
    },
    {
      name: "dateOfBirth",
      label: "Date of Birth",
      type: "date",
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      icon: <Tag className="h-4 w-4" />,
      options: [
        { label: "Active", value: "Active" },
        { label: "Blocked", value: "Blocked" },
      ],
    },
    {
      name: "locPrivacy",
      label: "Location Privacy",
      type: "select",
      icon: <MapPin className="h-4 w-4" />,
      options: [
        { label: "Keep Current", value: "" },
        { label: "Public", value: "false" },
        { label: "Private (Friends Only)", value: "true" },
      ],
    },
    {
      name: "momentPrivacy",
      label: "Moment Privacy",
      type: "select",
      icon: <ImageIcon className="h-4 w-4" />,
      options: [
        { label: "Keep Current", value: "" },
        { label: "Public", value: "false" },
        { label: "Private (Friends Only)", value: "true" },
      ],
    },
    {
      name: "roleIds",
      label: "Roles",
      type: "multiselect",
      icon: <Shield className="h-4 w-4" />,
      options: roleOptions,
      colSpan: 2,
    },
  ];

  return (
    <>
      <DynamicForm 
        title="Update User" 
        description={`Edit profile for user #${id}`} 
        fields={userFields} 
        initialValues={{ 
          ...user, 
          status: user.status || "Active", 
          roleIds: currentRoleIds,
          locPrivacy: (user as any).locPrivacy !== undefined ? String((user as any).locPrivacy) : "",
          momentPrivacy: (user as any).momentPrivacy !== undefined ? String((user as any).momentPrivacy) : ""
        }} 
        onSubmit={handleSubmit} 
        serverErrors={serverErrors} 
        onCancel={handleCancel} 
      />
      <LoadingOverlay isOpen={isSubmitting} message="Updating user..." />
    </>
  );
};

export default UpdateUser;