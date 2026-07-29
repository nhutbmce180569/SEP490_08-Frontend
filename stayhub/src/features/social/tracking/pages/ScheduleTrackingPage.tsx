import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { StaffMomentsFeed } from "../components/StaffMomentsFeed";

export const ScheduleTrackingPage: React.FC = () => {
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const scheduleIdNumber = Number(scheduleId);
  const navigate = useNavigate();
  const isManager = window.location.pathname.startsWith("/manager");

  return (
    <div className="relative h-[calc(100vh-130px)] min-h-[500px] w-full overflow-hidden rounded-2xl bg-slate-100">
      <div className="w-full h-full">
        <StaffMomentsFeed initialScheduleId={scheduleIdNumber} hideAdvancedFeatures={true} />
      </div>

      {/* Back Button */}
      <div className="absolute top-6 left-6 z-[100] flex items-center gap-2 pointer-events-auto">
        <button
          onClick={() => navigate(isManager ? "/manager/locations" : "/staff/locations")}
          className="group flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-slate-700 shadow-md backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-white focus:outline-none"
        >
          <ArrowLeft className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1" />
        </button>
      </div>
    </div>
  );
};
