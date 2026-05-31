import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { tourScheduleService } from "../services/tourSchedule.service";
import type { TourSchedule } from "../types/tourSchedule";

export const ScheduleDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState<TourSchedule | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await tourScheduleService.getScheduleById(id);
        setSchedule(data);
      } catch (err) {
        // ignore here, parent may handle
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!schedule) return <div className="text-rose-600">Schedule not found.</div>;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 max-w-2xl">
      <h2 className="text-lg font-bold mb-4">Schedule Detail</h2>
      <div className="space-y-2">
        <div>
          <strong>Tour:</strong> {schedule.tour?.name ?? `#${schedule.tourId}`}
        </div>
        <div>
          <strong>Departure:</strong> {new Date(schedule.departureDate).toLocaleDateString("vi-VN")}
        </div>
        <div>
          <strong>Return:</strong> {new Date(schedule.returnDate).toLocaleDateString("vi-VN")}
        </div>
        {schedule.note && (
          <div>
            <strong>Note:</strong> {schedule.note}
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <button className="btn" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>
    </div>
  );
};

export default ScheduleDetail;
