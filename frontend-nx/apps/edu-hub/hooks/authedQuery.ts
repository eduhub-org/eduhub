import { ApolloError, useQuery, useLazyQuery } from '@apollo/client';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useRef } from 'react';

import { useCurrentRole } from './authentication';
import { useAuthError } from '../contexts/AuthErrorContext';

import { AuthRoles } from '../types/enums';

const getErrorMessage = (error: unknown): string | undefined => {
  if (!error) {
    return undefined;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === 'string' ? message : undefined;
  }

  return undefined;
};

const useErrorHandler = () => {
  const t = useTranslations();
  const { showAuthError } = useAuthError();

  return useCallback((error: unknown) => {
    const message = getErrorMessage(error);

    if (message?.includes('JWTExpired') || message?.includes('JWSInvalidSignature')) {
      // For expired sessions, redirect immediately to login without showing a blocking dialog
      console.info('Session expired, redirecting to login...');
      signOut({
        callbackUrl: '/?sessionExpired=true',
        redirect: true,
      });
    } else if (message?.includes('NetworkError') || message?.includes('Failed to fetch')) {
      // NetworkError (e.g. aborted on page refresh, offline) — don't show auth dialog; log only
      console.warn('GraphQL network error (may be transient):', error);
    } else {
      console.error('Authentication error in query hook:', error);
      // Show a generic user-facing auth dialog; internal details stay in logs only.
      showAuthError(t('common.authed_query.authentication_error'), false);
    }
  }, [showAuthError, t]);
};

export const useRoleQuery: typeof useQuery = (query, passedOptions) => {
  // Auth headers are added by the Apollo auth link (reads from authStore).
  // We do NOT pass context with auth here — context changes trigger refetches
  // (Apollo issue #11835). Only pass role override when caller needs it.
  const roleOverride = passedOptions?.context?.role as AuthRoles | undefined;
  const mergedContext = useMemo(() => {
    const currentContext = passedOptions?.context;
    if (!currentContext) {
      return undefined;
    }

    if (!roleOverride) {
      return currentContext;
    }

    return {
      ...currentContext,
      role: roleOverride,
    };
  }, [passedOptions?.context, roleOverride]);

  const errorHandler = useErrorHandler();
  const errorHandlerRef = useRef(errorHandler);
  errorHandlerRef.current = errorHandler;
  const callerOnErrorRef = useRef(passedOptions?.onError);
  callerOnErrorRef.current = passedOptions?.onError;

  const onError = useCallback((error: ApolloError) => {
    errorHandlerRef.current(error);
    callerOnErrorRef.current?.(error);
  }, []);

  const options = useMemo(
    () => ({
      ...passedOptions,
      context: mergedContext,
      onError,
      fetchPolicy: passedOptions?.fetchPolicy ?? 'cache-first',
      nextFetchPolicy: passedOptions?.nextFetchPolicy ?? 'cache-first',
    }),
    [passedOptions, mergedContext, onError]
  );

  return useQuery(query, options);
};

export const useLazyRoleQuery: typeof useLazyQuery = (query, passedOptions) => {
  const currentRole = useCurrentRole();
  const passedRole = passedOptions?.context?.role as AuthRoles | undefined;
  const mergedContext = useMemo(() => {
    if (!passedOptions?.context) {
      return passedOptions?.context;
    }

    return {
      ...passedOptions.context,
      role: passedRole ?? currentRole,
    };
  }, [passedOptions?.context, passedRole, currentRole]);

  const errorHandler = useErrorHandler();
  const errorHandlerRef = useRef(errorHandler);
  errorHandlerRef.current = errorHandler;
  const callerOnErrorRef = useRef(passedOptions?.onError);
  callerOnErrorRef.current = passedOptions?.onError;

  const onError = useCallback((error: ApolloError) => {
    errorHandlerRef.current(error);
    callerOnErrorRef.current?.(error);
  }, []);

  const options = useMemo(
    () =>
      passedOptions
        ? {
            ...passedOptions,
            context: mergedContext,
            onError,
          }
        : passedOptions,
    [passedOptions, mergedContext, onError]
  );

  return useLazyQuery(query, options);
};

export const useAdminQuery: typeof useQuery = (query, passedOptions) => {
  const mergedContext = useMemo(
    () => ({
      ...passedOptions?.context,
      role: AuthRoles.admin,
    }),
    [passedOptions?.context]
  );

  const errorHandler = useErrorHandler();
  const errorHandlerRef = useRef(errorHandler);
  errorHandlerRef.current = errorHandler;
  const callerOnErrorRef = useRef(passedOptions?.onError);
  callerOnErrorRef.current = passedOptions?.onError;

  const onError = useCallback((error: ApolloError) => {
    errorHandlerRef.current(error);
    callerOnErrorRef.current?.(error);
  }, []);

  const options = useMemo(
    () => ({
      ...passedOptions,
      context: mergedContext,
      onError,
    }),
    [passedOptions, mergedContext, onError]
  );

  return useQuery(query, options);
};

export const useAdminLazyQuery: typeof useLazyQuery = (query, passedOptions) => {
  const mergedContext = useMemo(
    () => ({
      ...passedOptions?.context,
      role: AuthRoles.admin,
    }),
    [passedOptions?.context]
  );

  const errorHandler = useErrorHandler();
  const errorHandlerRef = useRef(errorHandler);
  errorHandlerRef.current = errorHandler;
  const callerOnErrorRef = useRef(passedOptions?.onError);
  callerOnErrorRef.current = passedOptions?.onError;

  const onError = useCallback((error: ApolloError) => {
    errorHandlerRef.current(error);
    callerOnErrorRef.current?.(error);
  }, []);

  const options = useMemo(
    () => ({
      ...passedOptions,
      context: mergedContext,
      onError,
    }),
    [passedOptions, mergedContext, onError]
  );

  return useLazyQuery(query, options);
};

export const useInstructorQuery: typeof useQuery = (query, passedOptions) => {
  const mergedContext = useMemo(
    () => ({
      ...passedOptions?.context,
      role: AuthRoles.instructor,
    }),
    [passedOptions?.context]
  );

  const errorHandler = useErrorHandler();
  const errorHandlerRef = useRef(errorHandler);
  errorHandlerRef.current = errorHandler;
  const callerOnErrorRef = useRef(passedOptions?.onError);
  callerOnErrorRef.current = passedOptions?.onError;

  const onError = useCallback((error: ApolloError) => {
    errorHandlerRef.current(error);
    callerOnErrorRef.current?.(error);
  }, []);

  const options = useMemo(
    () => ({
      ...passedOptions,
      context: mergedContext,
      onError,
    }),
    [passedOptions, mergedContext, onError]
  );

  return useQuery(query, options);
};

/**
 * @deprecated Use useRoleQuery instead.
 * This alias exists for backward compatibility and no longer forces role=user.
 */
export const useAuthedQuery: typeof useQuery = (query, passedOptions) => {
  return useRoleQuery(query, passedOptions);
};
