import React from "react";
import { Mail, Lock, User as UserIcon, Phone, Users, Calendar, Tag, Shield } from "lucide-react";
import { DynamicForm, type FormField } from "../../../components/dashboard/DynamicForm";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useCreateUser } from "../hooks/useCreateUser";
import { useRoles } from "../hooks/useRoles";
import { useTranslation } from "../../../contexts/LocaleContext";

export const CreateUser: React.FC = () => {
  const { t } = useTranslation();
  const { handleSubmit, handleCancel, isSubmitting, serverErrors } = useCreateUser();
  const { data: roles, isLoading: isRolesLoading } = useRoles();

  if (isRolesLoading) return <div className="flex justify-center p-10 text-slate-500">{t("auth.loadingFormDetails")}</div>;

  const roleOptions = Array.isArray(roles) ? roles.map((role: any) => ({
    label: role.name || role.Name || t("auth.unknown"),
    value: role.id !== undefined ? role.id : role.Id,
  })) : [];

  const userFields: FormField[] = [
    {
      name: "email",
      label: t("errors.emailAddress"),
      type: "text",
      placeholder: t("errors.emailPlaceholder"),
      icon: <Mail className="h-4 w-4" />,
      required: true,
    },
    {
      name: "fullName",
      label: t("auth.fullName"),
      type: "text",
      placeholder: t("errors.fullNamePlaceholder"),
      icon: <UserIcon className="h-4 w-4" />,
      required: true,
    },
    {
      name: "avatarFile",
      label: t("auth.avatar"),
      type: "file",
      icon: <UserIcon className="h-4 w-4" />,
      colSpan: 2,
    },
    {
      name: "password",
      label: t("auth.password"),
      type: "password",
      placeholder: t("auth.minimumPassword"),
      icon: <Lock className="h-4 w-4" />,
      required: true,
    },
    {
      name: "confirmPassword",
      label: t("errors.confirmPasswordLabel"),
      type: "password",
      placeholder: t("errors.confirmPasswordPlaceholder"),
      icon: <Lock className="h-4 w-4" />,
      required: true,
    },
    {
      name: "phoneNumber",
      label: t("auth.phoneNumber"),
      type: "text",
      placeholder: t("errors.phonePlaceholder"),
      icon: <Phone className="h-4 w-4" />,
    },
    {
      name: "gender",
      label: t("common.gender"),
      type: "select",
      icon: <Users className="h-4 w-4" />,
      options: [
        { label: t("common.male"), value: "Male" },
        { label: t("common.female"), value: "Female" },
        { label: t("common.other"), value: "Other" },
      ],
    },
    {
      name: "dateOfBirth",
      label: t("common.dateOfBirth"),
      type: "date",
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      name: "status",
      label: t("common.status"),
      type: "select",
      icon: <Tag className="h-4 w-4" />,
      options: [
        { label: t("common.active"), value: "Active" },
        { label: t("auth.blocked"), value: "Blocked" },
      ],
    },
    {
      name: "roleIds",
      label: t("auth.rolesLabel"),
      type: "multiselect",
      icon: <Shield className="h-4 w-4" />,
      options: roleOptions,
      colSpan: 2,
    },
  ];

  return (
    <>
      <DynamicForm title={t("auth.createNewUser")} description={t("auth.createNewUserDesc")} fields={userFields} initialValues={{ status: "Active" }} onSubmit={handleSubmit} serverErrors={serverErrors} onCancel={handleCancel} />
      <LoadingOverlay isOpen={isSubmitting} message={t("auth.creatingUser")} />
    </>
  );
};

export default CreateUser;
