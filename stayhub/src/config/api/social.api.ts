import { FULL_API } from './api';

export const SOCIAL_API = {
  // Users
  SEARCH_USERS: `${FULL_API}/users/search`,
  
  // Friends
  SEND_FRIEND_REQUEST: `${FULL_API}/friends/requests`,
  GET_FRIEND_REQUESTS: `${FULL_API}/friends/requests`,
  RESPOND_FRIEND_REQUEST: (id: string | number) => `${FULL_API}/friends/requests/${id}`,
  GET_FRIENDS: `${FULL_API}/friends`,
  UNFRIEND: (id: string | number) => `${FULL_API}/friends/${id}`,
  
  // Chat
  SEND_MESSAGE: `${FULL_API}/chat/messages`,
  
  // Tracking & SOS
  SEND_SOS: `${FULL_API}/tracking/sos`,
  GET_TRACKING_HISTORY: `${FULL_API}/tracking/history`,
  SHARE_TRACKING: `${FULL_API}/tracking/share`,
  
  // Reports
  CREATE_REPORT: `${FULL_API}/reports`,
  
  // Moments
  CREATE_MOMENT: `${FULL_API}/moments`,
  GET_MOMENTS: `${FULL_API}/moments`,
  REACT_MOMENT: (id: string | number) => `${FULL_API}/moments/${id}/reactions`,
  COMMENT_MOMENT: (id: string | number) => `${FULL_API}/moments/${id}/comments`,
  MANAGE_COMMENT: (cId: string | number) => `${FULL_API}/moments/comments/${cId}`,
  DELETE_MOMENT: (id: string | number) => `${FULL_API}/moments/${id}`,
};