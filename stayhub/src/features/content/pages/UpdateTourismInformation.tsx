import React from "react";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { getImg } from "../../../config/api/api";
import { TourismInformationForm } from "../components/TourismInformationForm";
import { useUpdateTourismInformation } from "../hooks/useUpdateTourismInformation";
import { TOURISM_DEFAULT_COUNTRY } from "../types/tourismInformation";

export const UpdateTourismInformation: React.FC = () => {
  const {
    id,
    tourismInfo,
    isFetching,
    fetchError,
    isSubmitting,
    serverErrors,
    handleSubmit,
    handleCancel,
  } = useUpdateTourismInformation();

  if (isFetching) {
    return <div className="flex justify-center p-10 text-slate-500">Loading tourism information...</div>;
  }

  if (fetchError) {
    return <div className="flex justify-center p-10 text-rose-500">{fetchError}</div>;
  }

  if (!tourismInfo) {
    return <div className="flex justify-center p-10 text-slate-500">Tourism information not found.</div>;
  }

  return (
    <div className="min-w-0 pb-2">
      <TourismInformationForm
        title="Update Tourism Information"
        description={`Edit details for tourism place #${id}`}
        initialValues={{
          ...tourismInfo,
          country: tourismInfo.country || TOURISM_DEFAULT_COUNTRY,
          imageFile: tourismInfo.imageUrl ? getImg(tourismInfo.imageUrl) : undefined,
        }}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitText="Save Changes"
        serverErrors={serverErrors}
      />
      <LoadingOverlay isOpen={isSubmitting} message="Updating tourism information..." />
    </div>
  );
};
