export interface LogoutPayload {
  refreshToken: string;
}

export const logout = async (_payload: LogoutPayload) => {
  return { success: true };
};
