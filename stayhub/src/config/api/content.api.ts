import { FULL_API } from './api';

export const CONTENT_API = {
  CATEGORIES: {
    GET_ALL: `${FULL_API}/Categories`,
    SEARCH: `${FULL_API}/Categories/search`,
    GET_ACTIVE: `${FULL_API}/Categories/active`,
    GET_BY_ID: (id: string | number) => `${FULL_API}/Categories/${id}`,
    CREATE: `${FULL_API}/Categories`,
    UPDATE: (id: string | number) => `${FULL_API}/Categories/${id}`,
    DELETE: (id: string | number) => `${FULL_API}/Categories/${id}`,
    ACTIVATE: (id: string | number) => `${FULL_API}/Categories/${id}/activate`,
    DEACTIVATE: (id: string | number) => `${FULL_API}/Categories/${id}/deactivate`,
  },
  
  BANNERS: {
    GET_ALL: `${FULL_API}/Banners`,
    SEARCH: `${FULL_API}/Banners/search`,
    GET_ACTIVE: `${FULL_API}/Banners/active`,
    GET_BY_ID: (id: string | number) => `${FULL_API}/Banners/${id}`,
    CREATE: `${FULL_API}/Banners`,
    UPDATE: (id: string | number) => `${FULL_API}/Banners/${id}`,
    DELETE: (id: string | number) => `${FULL_API}/Banners/${id}`,
    ACTIVATE: (id: string | number) => `${FULL_API}/Banners/${id}/activate`,
    DEACTIVATE: (id: string | number) => `${FULL_API}/Banners/${id}/deactivate`,
  },

  TICKET_TYPES: {
    GET_ALL: `${FULL_API}/TicketTypes`,
    GET_ACTIVE: `${FULL_API}/TicketTypes/active`,
    GET_BY_ID: (id: string | number) => `${FULL_API}/TicketTypes/${id}`,
    CREATE: `${FULL_API}/TicketTypes`,
    UPDATE: (id: string | number) => `${FULL_API}/TicketTypes/${id}`,
    CHANGE_STATUS: (id: string | number) => `${FULL_API}/TicketTypes/${id}/change-status`,
  },

  TOURISM_INFORMATION: {
    GET_ALL: `${FULL_API}/TourismInformation`,
    GET_ACTIVE: `${FULL_API}/TourismInformation/active`,
    GET_BY_ID: (id: string | number) => `${FULL_API}/TourismInformation/${id}`,
    CREATE: `${FULL_API}/TourismInformation`,
    UPDATE: (id: string | number) => `${FULL_API}/TourismInformation/${id}`,
    ACTIVATE: (id: string | number) => `${FULL_API}/TourismInformation/${id}/activate`,
    DEACTIVATE: (id: string | number) => `${FULL_API}/TourismInformation/${id}/deactivate`,
  },
};
