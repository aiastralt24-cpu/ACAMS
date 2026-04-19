export const SUPER_ADMIN_LOGIN_ID = "SuperAdmin";
export const SUPER_ADMIN_EMAIL = "superadmin@astral.in";
export const SUPER_ADMIN_DEMO_PASSWORD = "SuperAdmin@2026";
export const SUPER_ADMIN_DEMO_USER_ID = "user-super-admin";

const LOGIN_EMAILS: Record<string, string> = {
  [SUPER_ADMIN_LOGIN_ID.toLowerCase()]: SUPER_ADMIN_EMAIL,
  astraladhesive: "astraladhesive@astral.in",
  astralbathware: "astralbathware@astral.in",
  astralpipes: "astralpipes@astral.in",
  astralpaints: "astralpaints@astral.in",
};

export function resolveLoginEmail(identifier: string) {
  const value = identifier.trim();
  const mappedEmail = LOGIN_EMAILS[value.toLowerCase()];

  if (mappedEmail) {
    return mappedEmail;
  }

  return value;
}

export function isValidDemoLogin(identifier: string, password: string) {
  return (
    identifier.trim().toLowerCase() === SUPER_ADMIN_LOGIN_ID.toLowerCase() &&
    password === SUPER_ADMIN_DEMO_PASSWORD
  );
}
