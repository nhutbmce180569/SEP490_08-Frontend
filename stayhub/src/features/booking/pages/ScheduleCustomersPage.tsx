import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Eye, Phone, Users, User, Hash } from 'lucide-react';
import { ActionButton } from '../../../components/dashboard/ActionButton';
import { useToast } from '../../../contexts/ToastContext';
import { getApiErrorMessage } from '../../content/utils/apiError';
import { getScheduleCustomersByScheduleId } from '../services/booking.service';
import { tourScheduleService } from '../../tour/services/tourSchedule.service';
import type { AssignedTourSchedule } from '../../tour/types/tourSchedule';
import type { ReadScheduleCustomerDTO } from '../types/booking';
import { PATH } from '../../../config/routes/route';

export const ScheduleCustomersPage: React.FC = () => {
  const { scheduleId } = useParams<{ scheduleId?: string }>();
  const navigate = useNavigate();
  const { error: showError } = useToast();
  const [searchValue, setSearchValue] = React.useState(scheduleId ?? '');
  const [scheduleCustomers, setScheduleCustomers] = React.useState<ReadScheduleCustomerDTO[]>([]);
  const [assignedSchedules, setAssignedSchedules] = React.useState<AssignedTourSchedule[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isScheduleLoading, setIsScheduleLoading] = React.useState(false);
  const [currentScheduleId, setCurrentScheduleId] = React.useState<number | null>(
    scheduleId && Number.isFinite(Number(scheduleId)) ? Number(scheduleId) : null,
  );

  const loadCustomers = React.useCallback(
    async (id: number) => {
      setIsLoading(true);
      try {
        const data = await getScheduleCustomersByScheduleId(id);
        setScheduleCustomers(Array.isArray(data) ? data : []);
        setCurrentScheduleId(id);
      } catch (err: unknown) {
        setScheduleCustomers([]);
        showError(getApiErrorMessage(err, 'Unable to load schedule customers.'));
      } finally {
        setIsLoading(false);
      }
    },
    [showError],
  );

  React.useEffect(() => {
    const fetchSchedules = async () => {
      setIsScheduleLoading(true);
      try {
        const data = await tourScheduleService.getAssignedSchedules();
        setAssignedSchedules(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        showError(getApiErrorMessage(err, 'Unable to load assigned schedules.'));
      } finally {
        setIsScheduleLoading(false);
      }
    };

    void fetchSchedules();
  }, [showError]);

  React.useEffect(() => {
    if (scheduleId && Number.isFinite(Number(scheduleId))) {
      void loadCustomers(Number(scheduleId));
    }
  }, [scheduleId, loadCustomers]);

  const handleSearch = async () => {
    const id = Number(searchValue);
    if (!id || Number.isNaN(id) || id <= 0) {
      showError('Please enter a valid schedule ID.');
      return;
    }

    navigate(PATH.STAFF.SCHEDULE_CUSTOMERS(id));
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            <Users className="h-4 w-4" />
            Tour Customers
          </div>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Schedule Customer Center</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Chọn lịch trình để hiển thị danh sách khách hàng của schedule đó.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="number"
            min="1"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Enter Schedule ID"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-64"
          />
          <ActionButton variant="primary" onClick={handleSearch} className="gap-2 px-4 py-3 text-sm">
            <SearchIcon />
            Load Customers
          </ActionButton>
        </div>
      </div>

      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Assigned Schedules</h2>
            <p className="text-sm text-slate-500">Chọn một lịch để xem khách hàng đã đặt.</p>
          </div>
          {isScheduleLoading ? (
            <span className="text-sm text-slate-500">Loading schedules...</span>
          ) : null}
        </div>

        {assignedSchedules.length === 0 && !isScheduleLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            Không có lịch trình được phân công hoặc không thể tải dữ liệu.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="border-b border-slate-200 px-4 py-3 font-semibold">Schedule</th>
                  <th className="border-b border-slate-200 px-4 py-3 font-semibold">Dates</th>
                  <th className="border-b border-slate-200 px-4 py-3 font-semibold">Role</th>
                  <th className="border-b border-slate-200 px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {assignedSchedules.map((schedule) => (
                  <tr key={schedule.scheduleId} className="odd:bg-slate-50">
                    <td className="border-b border-slate-200 px-4 py-4">
                      <div className="font-semibold text-slate-900">{schedule.tourName || `Schedule #${schedule.scheduleId}`}</div>
                      <div className="text-xs text-slate-500">ID: {schedule.scheduleId}</div>
                    </td>
                    <td className="border-b border-slate-200 px-4 py-4 text-slate-600">
                      {new Date(schedule.departureDate).toLocaleDateString('vi-VN')} — {new Date(schedule.returnDate).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="border-b border-slate-200 px-4 py-4 text-slate-600">
                      {schedule.assignedRole || 'Staff'}
                    </td>
                    <td className="border-b border-slate-200 px-4 py-4">
                      <ActionButton
                        variant="primary"
                        onClick={() => navigate(PATH.STAFF.SCHEDULE_CUSTOMERS(schedule.scheduleId))}
                        className="h-9 w-full"
                      >
                        <Eye className="h-4 w-4" />
                        View Customers
                      </ActionButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {currentScheduleId ? (
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                <Hash className="h-4 w-4 text-slate-400" />
                Schedule #{currentScheduleId}
              </div>
              <div className="text-sm text-slate-600">Total passengers: {scheduleCustomers.length}</div>
            </div>
            <ActionButton
              variant="secondary"
              onClick={() => navigate(PATH.STAFF.SCHEDULE_DETAIL(currentScheduleId))}
              className="gap-2 px-4 py-3 text-sm"
            >
              <User className="h-4 w-4" />
              View Schedule
            </ActionButton>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="border-b border-slate-200 px-4 py-4 font-semibold">Name</th>
                <th className="border-b border-slate-200 px-4 py-4 font-semibold">Gender</th>
                <th className="border-b border-slate-200 px-4 py-4 font-semibold">Date of Birth</th>
                <th className="border-b border-slate-200 px-4 py-4 font-semibold">Phone</th>
                <th className="border-b border-slate-200 px-4 py-4 font-semibold">Ticket</th>
                <th className="border-b border-slate-200 px-4 py-4 font-semibold">Order</th>
              </tr>
            </thead>
            <tbody>
              {!isLoading && scheduleCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                    No customers were found for this schedule.
                  </td>
                </tr>
              ) : null}

              {scheduleCustomers.map((customer) => (
                <tr key={`${customer.ticketId}-${customer.orderId}`} className="odd:bg-slate-50">
                  <td className="border-b border-slate-200 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-100">
                        {customer.avatarUrl ? (
                          <img src={customer.avatarUrl} alt={customer.attendeeName} className="h-full w-full object-cover" />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-slate-400">{customer.attendeeName?.[0] ?? 'U'}</div>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{customer.attendeeName}</div>
                        <div className="text-xs text-slate-500">{customer.idCard || 'No ID card'}</div>
                      </div>
                    </div>
                  </td>

                  <td className="border-b border-slate-200 px-4 py-4">{customer.gender ?? '-'}</td>
                  <td className="border-b border-slate-200 px-4 py-4">
                    {customer.dateOfBirth ? new Date(customer.dateOfBirth).toLocaleDateString('vi-VN') : '-'}
                  </td>
                  <td className="border-b border-slate-200 px-4 py-4">
                    {customer.phoneNumber ? (
                      <a href={`tel:${customer.phoneNumber}`} className="inline-flex items-center gap-2 text-blue-600 hover:underline">
                        <Phone className="h-4 w-4" />
                        {customer.phoneNumber}
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="border-b border-slate-200 px-4 py-4">{customer.ticketId}</td>
                  <td className="border-b border-slate-200 px-4 py-4">{customer.orderId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isLoading ? (
          <div className="border-t border-slate-200 px-4 py-4 text-sm text-slate-500">Loading customers...</div>
        ) : null}
      </div>
    </div>
  );
};

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M8.5 15a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Zm7.5 3-3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
