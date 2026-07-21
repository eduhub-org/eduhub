// Same Keycloak-backed NextAuth configuration as the edu-hub app: employers
// are regular EduHub users whose job rights come from
// OrganizationAdmin.canManageJobs, not from a separate realm or role.
export { default } from '@eduhub/pages/api/auth/[...nextauth]';
