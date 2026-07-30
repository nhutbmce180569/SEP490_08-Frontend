import { FULL_API } from './api';

export const TICKETS_API = {
  // Tickets
  CHECK_IN: `${FULL_API}/tickets/check-in`,
  MY_TICKETS: `${FULL_API}/tickets/my-tickets`,
  GET_BY_SCHEDULE: (scheduleId: string | number) => `${FULL_API}/tickets/schedule/${scheduleId}`,
};