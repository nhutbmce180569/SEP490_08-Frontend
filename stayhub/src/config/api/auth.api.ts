import { FULL_API } from './api';

export const AUTH_API = {
  // Auth
  REGISTER: `${FULL_API}/auth/register`,
  LOGIN: `${FULL_API}/auth/login`,
  GOOGLE_LOGIN: `${FULL_API}/auth/google-login`,
  FACEBOOK_LOGIN: `${FULL_API}/auth/facebook-login`,
  EXTERNAL_LOGIN: `${FULL_API}/auth/external-login`,
  LOGOUT: `${FULL_API}/auth/logout`,
  REFRESH_TOKEN: `${FULL_API}/auth/refresh-token`,
  CHANGE_PASSWORD: `${FULL_API}/auth/change-password`,
  FORGOT_PASSWORD: `${FULL_API}/auth/forgot-password`,
  RESET_PASSWORD: `${FULL_API}/auth/reset-password`,
  PROFILE: `${FULL_API}/auth/profile`,
    
  // Admin - Users Management
  GET_ALL_USERS: `${FULL_API}/users`,
  GET_USER_BY_ID: (id: string | number) => `${FULL_API}/users/${id}`,
  GET_USER_BY_EMAIL: (email: string) => `${FULL_API}/users/email/${email}`,
  CREATE_USER: `${FULL_API}/users`,
  UPDATE_USER: (id: string | number) => `${FULL_API}/users/${id}`,
  CHANGE_USER_STATUS: (id: string | number) => `${FULL_API}/users/${id}/status`,
  DELETE_USER: (id: string | number) => `${FULL_API}/users/${id}`,

  // Admin - Roles Management
  GET_ALL_ROLES: `${FULL_API}/roles`,
  GET_ROLE_BY_ID: (id: string | number) => `${FULL_API}/roles/${id}`,
  GET_ROLE_BY_NAME: (name: string) => `${FULL_API}/roles/name/${name}`,

  // Operator Approval
  OPERATOR_APPROVAL_STATUS: `${FULL_API}/operator/approval-status`,

  // Tour Operator
  UPGRADE_TO_TOUR_OPERATOR: `${FULL_API}/tour-operators/upgrade`,
  MY_TOUR_OPERATOR_PROFILE: `${FULL_API}/tour-operators/profile`,
  UPDATE_TOUR_OPERATOR: `${FULL_API}/tour-operators/update`,
};