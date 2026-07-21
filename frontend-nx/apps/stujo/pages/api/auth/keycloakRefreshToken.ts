// The shared NextAuth config posts to `${NEXTAUTH_URL}/api/auth/keycloakRefreshToken`
// to refresh Keycloak tokens — without this route the request lands in the
// NextAuth catch-all and every session dies with RefreshAccessTokenError
// once the access token expires.
export { default } from '@eduhub/pages/api/auth/keycloakRefreshToken';
