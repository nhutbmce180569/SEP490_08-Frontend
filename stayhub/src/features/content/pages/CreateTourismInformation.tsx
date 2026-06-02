import React from "react";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useCreateTourismInformation } from "../hooks/useCreateTourismInformation";
import { TourismInformationForm } from "../components/TourismInformationForm";

export const CreateTourismInformation: React.FC = () => {
  const { handleSubmit, handleCancel, isSubmitting, serverErrors } = useCreateTourismInformation();

  return (
    <div className="min-w-0 pb-2">
      <TourismInformationForm
        title="Create Tourism Information"
        description="Add a new tourism place for tour itineraries and customer discovery."
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitText="Create"
        serverErrors={serverErrors}
        requireImage
      />
      <LoadingOverlay isOpen={isSubmitting} message="Creating tourism information..." />
    </div>
  );
};
