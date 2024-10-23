export interface IKeycloakRefreshTokenParams {
  body: {
    refreshToken: string;
  };
}

export interface IKeycloakRefreshTokenApiResponse {
  id_token: string;
  token_type: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  session_state: string;
  scope: string;
  'not-before-policy': number;
}
