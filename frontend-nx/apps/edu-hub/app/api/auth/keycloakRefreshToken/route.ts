import { NextRequest, NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';

interface IKeycloakRefreshTokenParams {
  refreshToken: string;
}

interface IKeycloakRefreshTokenApiResponse {
  id_token: string;
  token_type: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  scope: string;
  'not-before-policy': number;
}

export async function POST(request: NextRequest) {
  try {
    const body: IKeycloakRefreshTokenParams = await request.json();
    
    const keycloakUrlToRefreshToken = `${process.env.NEXT_PUBLIC_AUTH_URL}/realms/edu-hub/protocol/openid-connect/token`;
    const keycloakParamsToRefreshToken = new URLSearchParams();

    keycloakParamsToRefreshToken.append('client_id', 'hasura');
    keycloakParamsToRefreshToken.append(
      'client_secret',
      process.env.KEYCLOAK_HASURA_CLIENT_SECRET ||
        process.env.CLIENT_SECRET ||
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        process.env.NEXT_AUTH_CLIENT_SECRET!
    );
    keycloakParamsToRefreshToken.append('grant_type', 'refresh_token');
    keycloakParamsToRefreshToken.append('refresh_token', body.refreshToken);

    const keycloakRefreshTokenResponse = await axios.post<IKeycloakRefreshTokenApiResponse>(
      keycloakUrlToRefreshToken,
      keycloakParamsToRefreshToken
    );

    return NextResponse.json(keycloakRefreshTokenResponse.data);
  } catch (error) {
    if (error instanceof AxiosError) {
      return NextResponse.json(
        error.response?.data || {},
        { status: error.response?.status || 401 }
      );
    }

    return new NextResponse('', { status: 401 });
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Method not allowed, only POST method is available.' },
    { status: 405 }
  );
}
