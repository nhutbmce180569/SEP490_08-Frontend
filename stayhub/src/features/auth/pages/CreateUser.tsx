import React from "react";
import { Mail, User as UserIcon, Phone, Users, Calendar, Tag, Shield, Copy, CheckCircle2 } from "lucide-react";
import { DynamicForm, type FormField } from "../../../components/dashboard/DynamicForm";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useCreateUser } from "../hooks/useCreateUser";
import { useRoles } from "../hooks/useRoles";
import { useTranslation } from "../../../contexts/LocaleContext";

export const CreateUser: React.FC = () => {
  const { t } = useTranslation();
  const { handleSubmit, handleCancel, isSubmitting, serverErrors, createdAccount } = useCreateUser();
  const { data: roles, isLoading: isRolesLoading } = useRoles();

  if (isRolesLoading) return <div className="flex justify-center p-10 text-slate-500">{t("auth.loadingFormDetails")}</div>;

  if (createdAccount) {
    const copyPassword = () =>
      navigator.clipboard.writeText(createdAccount.temporaryPassword);

    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-emerald-200 bg-white p-8 shadow-sm">
        <CheckCircle2 className="h-12 w-12 text-emerald-500" />
        <h2 className="mt-4 text-2xl font-bold text-slate-900">
          {t("auth.accountCreated")}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {t("auth.temporaryPasswordWarning")}
        </p>
        <div className="mt-6 space-y-4 rounded-xl bg-slate-50 p-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("auth.email")}
            </div>
            <div className="mt-1 font-medium text-slate-900">
              {createdAccount.user.email}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("auth.temporaryPassword")}
            </div>
            <div className="mt-1 flex items-center gap-3">
              <code className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-3 text-lg font-bold text-slate-900">
                {createdAccount.temporaryPassword}
              </code>
              <button
                type="button"
                onClick={copyPassword}
                className="rounded-lg bg-brand p-3 text-white transition-colors hover:bg-brand-hover"
                aria-label={t("auth.copyTemporaryPassword")}
              >
                <Copy className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleCancel}
          className="mt-6 rounded-lg bg-brand px-5 py-3 font-semibold text-white transition-colors hover:bg-brand-hover"
        >
          {t("auth.backToUserManagement")}
        </button>
      </div>
    );
  }

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
