export const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Failed to decode JWT", error);
    return null;
  }
};

export const isTokenValid = (token: string): boolean => {
  const decodedClaims = decodeJWT(token);
  if (!decodedClaims || !decodedClaims.exp) return false;
  const currentTime = Date.now() / 1000;
  return decodedClaims.exp > currentTime;
};

export const normalizeRoles = (roles: any): string[] => {
  const rolesArray = Array.isArray(roles) ? roles : typeof roles === "string" ? [roles] : [];
  return rolesArray.map((r: string) => r.toUpperCase());
};

export const getDashboardPath = (roles: any): string => {
  const upperRoles = normalizeRoles(roles);
  if (upperRoles.includes("ADMIN")) {
    return "/admin"; // PATH.ADMIN.DASHBOARD
  }
  if (upperRoles.includes("MANAGER") || upperRoles.includes("OPERATOR")) {
    return "/manager"; // PATH.MANAGER.DASHBOARD
  }
  if (upperRoles.includes("STAFF")) {
    return "/staff"; // PATH.STAFF.SCHEDULES
  }
  return "/"; // PATH.PUBLIC.HOME
};
