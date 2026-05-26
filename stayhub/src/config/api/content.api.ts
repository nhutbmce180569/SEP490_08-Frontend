import { FULL_API } from './api';

export const CONTENT_API = {
  CATEGORIES: {
    GET_ALL: `${FULL_API}/Categories`,
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
    GET_ACTIVE: `${FULL_API}/Banners/active`,
    GET_BY_ID: (id: string | number) => `${FULL_API}/Banners/${id}`,
    CREATE: `${FULL_API}/Banners`,
    UPDATE: (id: string | number) => `${FULL_API}/Banners/${id}`,
    DELETE: (id: string | number) => `${FULL_API}/Banners/${id}`,
    ACTIVATE: (id: string | number) => `${FULL_API}/Banners/${id}/activate`,
    DEACTIVATE: (id: string | number) => `${FULL_API}/Banners/${id}/deactivate`,
  }
};