import { useQuery, useLazyQuery } from '@apollo/client';
import { useSession } from 'next-auth/react';
import useTranslation from 'next-translate/useTranslation';

import { useCurrentRole } from './authentication';
import { useAuthError } from '../contexts/AuthErrorContext';

import { AuthRoles } from '../types/enums';

const useErrorHandler = () => {
  const { t } = useTranslation();
  const { showAuthError } = useAuthError();

  return (error) => {
    console.log('error handler error: ', error);
    if (error.message.includes('JWTExpired') || error.message.includes('JWSInvalidSignature')) {
      // Show error and automatically sign out after user acknowledges
      showAuthError(t("authed_query.session_expired_or_invalid"), true);
    } else {
      // Show error without signing out
      showAuthError(t("authed_query.authentication_error") + ": " + error.message, false);
    }
  };
};

export const useRoleQuery: typeof useQuery = (query, passedOptions) => {
  const { data } = useSession();
  const accessToken = data?.accessToken;
  const currentRole = useCurrentRole();

  const passedRole: AuthRoles = passedOptions?.context?.role;

  const options = accessToken
    ? {
        ...passedOptions,
        context: {
          ...passedOptions?.context,
          headers: {
            ...(currentRole !== AuthRoles.anonymous && {
              'x-hasura-role': passedRole ? passedRole : currentRole,
            }),
            ...(currentRole !== AuthRoles.anonymous && {
              Authorization: `Bearer ${accessToken}`,
            }),
          },
        },
      }
    : passedOptions;

  const errorHandler = useErrorHandler();
      
  return useQuery(query, { ...options, onError: errorHandler });
};

export const useLazyRoleQuery: typeof useLazyQuery = (query, passedOptions) => {
  const { data } = useSession();
  const accessToken = data?.accessToken;
  const currentRole = useCurrentRole();

  const passedRole: AuthRoles = passedOptions?.context?.role;

  const options = accessToken
    ? {
        ...passedOptions,
        context: {
          ...passedOptions?.context,
          headers: {
            ...(currentRole !== AuthRoles.anonymous && {
              'x-hasura-role': passedRole ? passedRole : currentRole,
            }),
            ...(currentRole !== AuthRoles.anonymous && {
              Authorization: `Bearer ${accessToken}`,
            }),
          },
        },
      }
    : passedOptions;

  const errorHandler = useErrorHandler();

  return useLazyQuery(query, { ...options, onError: errorHandler });
};

export const useAdminQuery: typeof useQuery = (query, passedOptions) => {
  const { data } = useSession();
  const accessToken = data?.accessToken;

  const options = accessToken
    ? {
        ...passedOptions,
        context: {
          ...passedOptions?.context,
          headers: {
            ...passedOptions?.context?.headers,
            'x-hasura-role': AuthRoles.admin,
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    : passedOptions;

  const errorHandler = useErrorHandler();

  return useQuery(query, { ...options, onError: errorHandler });
};

export const useInstructorQuery: typeof useQuery = (query, passedOptions) => {
  const { data } = useSession();
  const accessToken = data?.accessToken;

  const options = accessToken
    ? {
        ...passedOptions,
        context: {
          ...passedOptions?.context,
          headers: {
            ...passedOptions?.context?.headers,
            'x-hasura-role': AuthRoles.instructor,
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    : passedOptions;

  const errorHandler = useErrorHandler();

  return useQuery(query, { ...options, onError: errorHandler });
};

export const useAuthedQuery: typeof useQuery = (query, passedOptions) => {
  const { data } = useSession();
  const accessToken = data?.accessToken;

  const options = accessToken
    ? {
        ...passedOptions,
        context: {
          ...passedOptions?.context,
          headers: {
            ...passedOptions?.context?.headers,
            'x-hasura-role': AuthRoles.user,
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    : passedOptions;

  const errorHandler = useErrorHandler();

  return useQuery(query, { ...options, onError: errorHandler });
};
