import { FULL_API } from "./api";

export const PROMOTIONS_API = {
  GET_ALL: `${FULL_API}/promotions`,
  GET_DETAIL: (id: string | number) => `${FULL_API}/promotions/${id}`,
  CREATE: `${FULL_API}/promotions`,
  UPDATE: (id: string | number) => `${FULL_API}/promotions/${id}`,
  CHANGE_STATUS: (id: string | number) => `${FULL_API}/promotions/${id}/status`,
};
