'use client';

import { useQuery, useLazyQuery } from '@apollo/client';
import { useSession, signOut } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';

import { useCurrentRole } from './authentication';

import { AuthRoles } from '../types/enums';

const useErrorHandler = () => {
  const t = useTranslations('common');

  return (error) => {
    console.log('error handler error: ', error);
    if (error.message.includes('JWTExpired') || error.message.includes('JWSInvalidSignature')) {
      alert(t("authed_query.session_expired_or_invalid"));
      signOut();
    } else {
      alert(t("authed_query.authentication_error") + ": " + error);
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
