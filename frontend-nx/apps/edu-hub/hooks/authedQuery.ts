import { ApolloError, useQuery, useLazyQuery } from '@apollo/client';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useRef } from 'react';

import { useCurrentRole, useManageRole } from './authentication';
import { useManagementRoleContext } from './managementRole';
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
  // On the /manage screens a management-role context is present and is used when the caller did not
  // pass an explicit role, so nested read widgets query under the org admin's role.
  const contextRole = useManagementRoleContext();
  const roleOverride = (passedOptions?.context?.role as AuthRoles | undefined) ?? contextRole;
  const mergedContext = useMemo(() => {
    const currentContext = passedOptions?.context;
    if (!roleOverride) {
      return currentContext;
    }

    return {
      ...(currentContext ?? {}),
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
      ...(passedOptions?.nextFetchPolicy !== undefined
        ? { nextFetchPolicy: passedOptions.nextFetchPolicy }
        : {}),
    }),
    [passedOptions, mergedContext, onError]
  );

  return useQuery(query, options);
};

export const useLazyRoleQuery: typeof useLazyQuery = (query, passedOptions) => {
  const currentRole = useCurrentRole();
  const contextRole = useManagementRoleContext();
  const passedRole = passedOptions?.context?.role as AuthRoles | undefined;
  const mergedContext = useMemo(() => {
    if (!passedOptions?.context) {
      return passedOptions?.context;
    }

    return {
      ...passedOptions.context,
      role: passedRole ?? contextRole ?? currentRole,
    };
  }, [passedOptions?.context, passedRole, contextRole, currentRole]);

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
        : {
            context: mergedContext,
            onError,
          },
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

// Like useAdminQuery, but pins the management role: `admin` for super-admins, `org_admin` for org
// admins. Drop-in replacement for useAdminQuery on the organization-management screens so the same
// component works for both. For super-admins the behaviour is identical to useAdminQuery.
export const useManageQuery: typeof useQuery = (query, passedOptions) => {
  const role = useManageRole();
  const mergedContext = useMemo(
    () => ({
      ...passedOptions?.context,
      role,
    }),
    [passedOptions?.context, role]
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

// Pins the org_admin role on the request. The caller must actually hold the role (useIsOrgAdmin).
// Use on organization-management screens so the request matches the org_admin Hasura permissions.
export const useOrgAdminQuery: typeof useQuery = (query, passedOptions) => {
  const mergedContext = useMemo(
    () => ({
      ...passedOptions?.context,
      role: AuthRoles.org_admin,
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
