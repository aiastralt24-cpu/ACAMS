export const SUPER_ADMIN_LOGIN_ID = "SuperAdmin";
export const SUPER_ADMIN_EMAIL = "superadmin@astral.in";
export const SUPER_ADMIN_DEMO_PASSWORD = "SuperAdmin@2026";
export const SUPER_ADMIN_DEMO_USER_ID = "user-super-admin";

export function resolveLoginEmail(identifier: string) {
  const value = identifier.trim();

  if (value.toLowerCase() === SUPER_ADMIN_LOGIN_ID.toLowerCase()) {
    return SUPER_ADMIN_EMAIL;
  }

  return value;
}

export function isValidDemoLogin(identifier: string, password: string) {
  return (
    identifier.trim().toLowerCase() === SUPER_ADMIN_LOGIN_ID.toLowerCase() &&
    password === SUPER_ADMIN_DEMO_PASSWORD
  );
}
