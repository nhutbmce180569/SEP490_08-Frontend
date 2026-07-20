import React from "react";
import { User as UserIcon, Phone, Users, Calendar, Tag, Shield, MapPin, Image as ImageIcon } from "lucide-react";
import { DynamicForm, type FormField } from "../../../components/dashboard/DynamicForm";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useUpdateUser } from "../hooks/useUpdateUser";
import { useRoles } from "../hooks/useRoles";
import { useTranslation } from "../../../contexts/LocaleContext";
import { getRoleDisplay } from "./UserList";

export const UpdateUser: React.FC = () => {
  const { t } = useTranslation();
  const { id, user, isFetching, fetchError, isSubmitting, serverErrors, handleSubmit, handleCancel } = useUpdateUser();
  const { data: rolesList, isLoading: isRolesLoading } = useRoles();

  if (isFetching || isRolesLoading) return <div className="flex justify-center p-10 text-slate-500">{t("auth.loadingUserDetails")}</div>;
  if (fetchError) return <div className="flex justify-center p-10 text-rose-500">{fetchError}</div>;
  if (!user) return <div className="flex justify-center p-10 text-slate-500">{t("auth.userNotFound")}</div>;

  const roleOptions = Array.isArray(rolesList) ? rolesList.map((role) => ({
    label: getRoleDisplay(role.name || "", t) || t("auth.unknown"),
    value: role.id,
  })) : [];

  const currentRoleIds = user?.roles?.map(roleName => {
    const found = Array.isArray(rolesList) ? rolesList.find((r) => r.name === roleName) : null;
    return found ? found.id : null;
  }).filter((roleId): roleId is number => roleId !== null);

  const userFields: FormField[] = [
    {
      name: "fullName",
      label: t("auth.fullName"),
      type: "text",
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
      name: "locPrivacy",
      label: t("auth.locationPrivacy"),
      type: "select",
      icon: <MapPin className="h-4 w-4" />,
      options: [
        { label: t("auth.keepCurrent"), value: "" },
        { label: t("auth.publicPrivacy"), value: "false" },
        { label: t("auth.privateFriendsOnly"), value: "true" },
      ],
    },
    {
      name: "momentPrivacy",
      label: t("auth.momentPrivacy"),
      type: "select",
      icon: <ImageIcon className="h-4 w-4" />,
      options: [
        { label: t("auth.keepCurrent"), value: "" },
        { label: t("auth.publicPrivacy"), value: "false" },
        { label: t("auth.privateFriendsOnly"), value: "true" },
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
      <DynamicForm 
        title={t("auth.updateUser")} 
        description={t("auth.updateUserDesc", { id: id ?? "" })}
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
      <LoadingOverlay isOpen={isSubmitting} message={t("auth.updatingUser")} />
    </>
  );
};

export default UpdateUser;
