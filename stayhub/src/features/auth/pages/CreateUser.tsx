import React from "react";
import { Mail, Lock, User as UserIcon, Phone, Users, Calendar, Tag, Shield } from "lucide-react";
import { DynamicForm, type FormField } from "../../../components/dashboard/DynamicForm";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useCreateUser } from "../hooks/useCreateUser";
import { useRoles } from "../hooks/useRoles";

export const CreateUser: React.FC = () => {
  const { handleSubmit, handleCancel, isSubmitting, serverErrors } = useCreateUser();
  const { data: roles, isLoading: isRolesLoading } = useRoles();

  // Bắt buộc chờ API tải xong danh sách Role mới hiển thị form
  if (isRolesLoading) return <div className="flex justify-center p-10 text-slate-500">Loading form details...</div>;

  const roleOptions = Array.isArray(roles) ? roles.map((role: any) => ({
    label: role.name || role.Name || "Unknown",
    value: role.id !== undefined ? role.id : role.Id,
  })) : [];

  const userFields: FormField[] = [
    {
      name: "email",
      label: "Email Address",
      type: "text",
      placeholder: "e.g. user@example.com",
      icon: <Mail className="h-4 w-4" />,
      required: true,
    },
    {
      name: "fullName",
      label: "Full Name",
      type: "text",
      placeholder: "e.g. John Doe",
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
      name: "password",
      label: "Password",
      type: "password",
      placeholder: "Minimum 6 characters",
      icon: <Lock className="h-4 w-4" />,
      required: true,
    },
    {
      name: "confirmPassword",
      label: "Confirm Password",
      type: "password",
      placeholder: "Repeat your password",
      icon: <Lock className="h-4 w-4" />,
      required: true,
    },
    {
      name: "phoneNumber",
      label: "Phone Number",
      type: "text",
      placeholder: "e.g. 0912345678",
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
      name: "roleIds",
      label: "Roles",
      type: "multiselect", // Đảm bảo DynamicForm của bạn có hỗ trợ type="multiselect"
      icon: <Shield className="h-4 w-4" />,
      options: roleOptions,
      colSpan: 2,
    },
  ];

  return (
    <>
      <DynamicForm title="Create New User" description="Add a new user to the system." fields={userFields} initialValues={{ status: "Active" }} onSubmit={handleSubmit} serverErrors={serverErrors} onCancel={handleCancel} />
      <LoadingOverlay isOpen={isSubmitting} message="Creating user..." />
    </>
  );
};

export default CreateUser;