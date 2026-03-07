import { ApolloError, useQuery, useLazyQuery } from '@apollo/client';
import { useSession, signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useCallback, useRef } from 'react';

import { useCurrentRole } from './authentication';
import { useAuthError } from '../contexts/AuthErrorContext';

import { AuthRoles } from '../types/enums';

const useErrorHandler = () => {
  const t = useTranslations();
  const { showAuthError } = useAuthError();

  return useCallback((error: { message?: string }) => {
    if (error?.message?.includes('JWTExpired') || error?.message?.includes('JWSInvalidSignature')) {
      // For expired sessions, redirect immediately to login without showing a blocking dialog
      console.info('Session expired, redirecting to login...');
      signOut({ 
        callbackUrl: '/?sessionExpired=true',
        redirect: true 
      });
    } else if (error?.message?.includes('NetworkError') || error?.message?.includes('Failed to fetch')) {
      // NetworkError (e.g. aborted on page refresh, offline) — don't show auth dialog; log only
      console.warn('GraphQL network error (may be transient):', error?.message);
    } else {
      // Show error dialog for other authentication errors (without signing out)
      showAuthError(t("common.authed_query.authentication_error") + ": " + (error?.message ?? ''), false);
    }
  }, [showAuthError, t]);
};

export const useRoleQuery: typeof useQuery = (query, passedOptions) => {
  // Auth headers are added by the Apollo auth link (reads from authStore).
  // We do NOT pass context with auth here — context changes trigger refetches
  // (Apollo issue #11835). Only pass role override when caller needs it.
  const roleOverride = passedOptions?.context?.role as AuthRoles | undefined;

  const errorHandler = useErrorHandler();
  const errorHandlerRef = useRef(errorHandler);
  errorHandlerRef.current = errorHandler;
  const callerOnErrorRef = useRef(passedOptions?.onError);
  callerOnErrorRef.current = passedOptions?.onError;

  const onError = useCallback((error: ApolloError) => {
    errorHandlerRef.current(error);
    callerOnErrorRef.current?.(error);
  }, []);

  return useQuery(query, {
    ...passedOptions,
    context: roleOverride ? { role: roleOverride } : undefined,
    onError,
    fetchPolicy: passedOptions?.fetchPolicy ?? 'cache-first',
    nextFetchPolicy: passedOptions?.nextFetchPolicy ?? 'cache-first',
  });
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
              'x-hasura-role': passedRole ?? currentRole,
            }),
            ...(currentRole !== AuthRoles.anonymous && {
              Authorization: `Bearer ${accessToken}`,
            }),
          },
        },
      }
    : passedOptions;

  const errorHandler = useErrorHandler();
  const callerOnError = passedOptions?.onError;

  return useLazyQuery(query, { 
    ...options, 
    onError: (error) => {
      errorHandler(error);
      callerOnError?.(error);
    }
  });
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
  const callerOnError = passedOptions?.onError;

  return useQuery(query, { 
    ...options, 
    onError: (error) => {
      errorHandler(error);
      callerOnError?.(error);
    }
  });
};

export const useAdminLazyQuery: typeof useLazyQuery = (query, passedOptions) => {
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
  const callerOnError = passedOptions?.onError;

  return useLazyQuery(query, { 
    ...options, 
    onError: (error) => {
      errorHandler(error);
      callerOnError?.(error);
    }
  });
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
  const callerOnError = passedOptions?.onError;

  return useQuery(query, { 
    ...options, 
    onError: (error) => {
      errorHandler(error);
      callerOnError?.(error);
    }
  });
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
  const callerOnError = passedOptions?.onError;

  return useQuery(query, { 
    ...options, 
    onError: (error) => {
      errorHandler(error);
      callerOnError?.(error);
    }
  });
};
