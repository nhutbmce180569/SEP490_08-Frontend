import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Search, Users, ShieldCheck, Phone, UserCheck } from "lucide-react";
import { Table, type Column } from "../../../components/dashboard/Table";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { useToast } from "../../../contexts/ToastContext";
import { useTranslation } from "../../../contexts/LocaleContext";
import { getApiErrorMessage } from "../../content/utils/apiError";
import { getScheduleCustomersByScheduleId } from "../services/booking.service";
import { tourScheduleService } from "../../tour/services/tourSchedule.service";
import type { AssignedTourSchedule } from "../../tour/types/tourSchedule";
import type { ReadScheduleCustomerDTO } from "../types/booking";
import { PATH } from "../../../config/routes/route";

export const ScheduleCustomersPage: React.FC = () => {
  const { t } = useTranslation();
  const { scheduleId } = useParams<{ scheduleId?: string }>();
  const navigate = useNavigate();
  const { error: showError } = useToast();

  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(
    scheduleId && Number.isFinite(Number(scheduleId)) ? Number(scheduleId) : null,
  );
  const [search, setSearch] = useState("");
  const [scheduleSearch, setScheduleSearch] = useState("");

  const [assignedSchedules, setAssignedSchedules] = useState<AssignedTourSchedule[]>([]);
  const [scheduleCustomers, setScheduleCustomers] = useState<ReadScheduleCustomerDTO[]>([]);
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);
  const [isCustomersLoading, setIsCustomersLoading] = useState(false);

  // 1. Fetch danh sách Schedules
  const fetchSchedules = React.useCallback(async () => {
    setIsScheduleLoading(true);
    try {
      const data = await tourScheduleService.getAssignedSchedules();
      const schedules = Array.isArray(data) ? data : [];
      setAssignedSchedules(schedules);

      if (!selectedScheduleId && schedules.length > 0) {
        setSelectedScheduleId(schedules[0].scheduleId);
      }
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, t("booking.unableLoadAssignedSchedules")));
    } finally {
      setIsScheduleLoading(false);
    }
  }, [selectedScheduleId, showError, t]);

  useEffect(() => {
    void fetchSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Fetch Customers khi selectedScheduleId thay đổi
  const fetchCustomers = React.useCallback(async (id: number) => {
    setIsCustomersLoading(true);
    try {
      const data = await getScheduleCustomersByScheduleId(id);
      setScheduleCustomers(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setScheduleCustomers([]);
      showError(getApiErrorMessage(err, t("booking.unableLoadCustomers")));
    } finally {
      setIsCustomersLoading(false);
    }
  }, [showError, t]);

  useEffect(() => {
    if (selectedScheduleId) {
      void fetchCustomers(selectedScheduleId);
      // Cập nhật URL để sync nếu cần
      navigate(PATH.STAFF.SCHEDULE_CUSTOMERS(selectedScheduleId), { replace: true });
    }
  }, [selectedScheduleId, fetchCustomers, navigate]);

  const selectedSchedule = useMemo(
    () => assignedSchedules.find((item) => item.scheduleId === selectedScheduleId) ?? null,
    [assignedSchedules, selectedScheduleId],
  );

  // Lọc Schedule
  const filteredSchedules = useMemo(() => {
    if (!scheduleSearch.trim()) return assignedSchedules;
    const keyword = scheduleSearch.trim().toLowerCase();
    return assignedSchedules.filter((schedule) => {
      return (
        schedule.tourName?.toLowerCase().includes(keyword) ||
        schedule.scheduleId.toString().includes(keyword)
      );
    });
  }, [assignedSchedules, scheduleSearch]);

  // Lọc Customers
  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return scheduleCustomers;
    const keyword = search.trim().toLowerCase();
    return scheduleCustomers.filter((customer) => {
      return (
        customer.attendeeName?.toLowerCase().includes(keyword) ||
        customer.idCard?.toLowerCase().includes(keyword) ||
        customer.ticketId?.toString().includes(keyword) ||
        customer.orderId?.toString().includes(keyword)
      );
    });
  }, [scheduleCustomers, search]);

  // Định nghĩa cột cho Table (Đã chỉnh sửa theo yêu cầu)
  const columns: Column<ReadScheduleCustomerDTO>[] = useMemo(
    () => [
      {
        header: t("common.nameLabel"),
        render: (customer) => (
          <div className="flex items-center gap-3 min-w-[200px]">
            <div className="font-semibold text-slate-900">{customer.attendeeName}</div>
          </div>
        ),
      },
      {
        header: t("booking.idCardLabel") || "ID/Passport",
        render: (customer) => (
          <span className="text-sm font-medium text-slate-600">
            {customer.idCard || "-"}
          </span>
        ),
        className: "w-[150px]",
      },
      {
        header: t("booking.genderLabel"),
        render: (customer) => (
          <span className="text-sm capitalize text-slate-600">{customer.gender ?? "-"}</span>
        ),
        className: "w-[100px]",
      },
      {
        header: t("common.dateOfBirth"),
        render: (customer) => (
          <span className="text-sm text-slate-600">
            {customer.dateOfBirth ? new Date(customer.dateOfBirth).toLocaleDateString("vi-VN") : "-"}
          </span>
        ),
        className: "w-[120px]",
      },
    ],
    [t],
  );

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white">
      {/* HEADER */}
      <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <Users className="text-[#0068E0]" size={24} />
          <div>
            <h2 className="text-[15px] font-bold leading-tight text-slate-900">
              {t("booking.scheduleCustomerCenter")}
            </h2>
            <p className="text-sm text-slate-500">{t("booking.scheduleCustomerDesc")}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-slate-400 focus-within:bg-white transition-colors sm:w-72">
            <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("booking.searchCustomerPlaceholder")}
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>
          <ActionButton
            variant="primary"
            onClick={() => {
              if (selectedScheduleId) fetchCustomers(selectedScheduleId);
            }}
            className="gap-2 px-4 py-2 text-sm"
          >
            {t("common.refresh")}
          </ActionButton>
        </div>
      </div>

      {/* BODY GRID */}
      <div className="p-6 space-y-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)]">
          {/* LEFT COLUMN: SCHEDULE LIST */}
          <div className="space-y-4 min-w-0 rounded-3xl border border-slate-100 bg-slate-50 p-5">
            <div className="rounded-3xl bg-white p-4 shadow-sm flex flex-col h-full">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                {t("booking.selectSchedule")}
              </h2>

              {/* Thanh tìm kiếm Schedule */}
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-brand focus-within:bg-white transition-colors">
                <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <input
                  value={scheduleSearch}
                  onChange={(e) => setScheduleSearch(e.target.value)}
                  placeholder={t("booking.searchSchedulePlaceholder")}
                  className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>

              {/* Danh sách Schedule có thể scroll */}
              <div className="mt-4 space-y-3 max-h-[500px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
                {isScheduleLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, index) => (
                      <div key={index} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
                    ))}
                  </div>
                ) : filteredSchedules.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-slate-500 text-sm text-center">
                    {scheduleSearch.trim() ? t("booking.noSchedulesFound") : t("booking.noAssignedSchedules")}
                  </div>
                ) : (
                  filteredSchedules.map((schedule) => (
                    <button
                      key={schedule.scheduleId}
                      type="button"
                      onClick={() => setSelectedScheduleId(schedule.scheduleId)}
                      className={`w-full rounded-2xl border px-4 py-3.5 text-left transition ${
                        selectedScheduleId === schedule.scheduleId
                          ? "border-[#0068E0] bg-blue-50/30 shadow-sm"
                          : "border-slate-100 bg-slate-50 hover:border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-slate-900 truncate">
                            {schedule.tourName || `Schedule #${schedule.scheduleId}`}
                          </div>
                          <p className="mt-1 text-xs font-medium text-slate-500">
                            {new Date(schedule.departureDate).toLocaleDateString("vi-VN")} -{" "}
                            {new Date(schedule.returnDate).toLocaleDateString("vi-VN")}
                          </p>
                        </div>
                        <span className="shrink-0 inline-flex rounded-full bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-600 shadow-sm">
                          #{schedule.scheduleId}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: CUSTOMER TABLE */}
          <div className="space-y-4 min-w-0">
            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm min-w-0">
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{t("booking.tourCustomers")}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {selectedSchedule
                      ? t("booking.showingTicketsFor", { id: selectedSchedule.scheduleId })
                      : t("booking.selectScheduleToView")}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                  <UserCheck className="h-3.5 w-3.5 text-blue-500" />
                  {t("booking.totalPassengers", {
                    count: scheduleCustomers.length,
                  })}
                </div>
              </div>
              <div className="overflow-x-auto min-w-0">
                <Table
                  data={filteredCustomers}
                  columns={columns}
                  isLoading={isCustomersLoading}
                  emptyMessage={
                    selectedSchedule
                      ? t("booking.noCustomersForSchedule")
                      : t("booking.chooseScheduleToView")
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};