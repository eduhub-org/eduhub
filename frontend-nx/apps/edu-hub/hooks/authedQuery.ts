import { ApolloError, useQuery, useLazyQuery } from '@apollo/client';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef } from 'react';

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

const isGraphQLSchemaError = (error: unknown): boolean => {
  const message = getErrorMessage(error) ?? '';
  if (
    message.includes('not found in type') ||
    message.includes('Cannot query field') ||
    message.includes('validation-failed')
  ) {
    return true;
  }

  if (typeof error === 'object' && error !== null && 'graphQLErrors' in error) {
    const graphQLErrors = (error as { graphQLErrors?: Array<{ extensions?: { code?: string } }> })
      .graphQLErrors;
    return (
      graphQLErrors?.some(
        (graphQLError) =>
          graphQLError.extensions?.code === 'validation-failed' ||
          graphQLError.extensions?.code === 'access-denied'
      ) ?? false
    );
  }

  return false;
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
    } else if (isGraphQLSchemaError(error)) {
      // Role-scoped schema / permission mismatches are query errors, not auth failures.
      console.error('GraphQL query error in query hook:', error);
    } else {
      console.error('Authentication error in query hook:', error);
      // Show a generic user-facing auth dialog; internal details stay in logs only.
      showAuthError(t('common.authed_query.authentication_error'), false);
    }
  }, [showAuthError, t]);
};

/**
 * Apollo Client 3.14+ deprecates useQuery/useLazyQuery `onError`/`onCompleted`
 * (removed in v4). Bridge them via the returned `error`/`data` values instead.
 * Callbacks only fire for the terminal result of an execution (`loading` is
 * false), so partial cache emissions during an in-flight network request do
 * not report premature completion.
 */
const useQueryLifecycleSideEffects = (
  error: ApolloError | undefined,
  data: unknown,
  loading: boolean,
  callerOnError?: ((error: ApolloError) => void) | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callerOnCompleted?: ((data: any) => void) | undefined
) => {
  const errorHandler = useErrorHandler();
  const errorHandlerRef = useRef(errorHandler);
  errorHandlerRef.current = errorHandler;
  const callerOnErrorRef = useRef(callerOnError);
  callerOnErrorRef.current = callerOnError;
  const callerOnCompletedRef = useRef(callerOnCompleted);
  callerOnCompletedRef.current = callerOnCompleted;
  const lastHandledErrorRef = useRef<ApolloError | null>(null);
  const lastCompletedDataRef = useRef<unknown>(undefined);

  useEffect(() => {
    if (loading) {
      // An execution is in flight; wait for its terminal result.
      return;
    }

    if (error) {
      // Dedupe by instance, not message: a rerender re-delivers the same
      // ApolloError object, while each new failure — including a retry that
      // fails with an identical message — yields a fresh instance and must
      // fire the callbacks again.
      if (lastHandledErrorRef.current === error) {
        return;
      }
      lastHandledErrorRef.current = error;

      errorHandlerRef.current(error);
      callerOnErrorRef.current?.(error);
      return;
    }

    lastHandledErrorRef.current = null;
    if (data === undefined || data === lastCompletedDataRef.current) {
      return;
    }
    lastCompletedDataRef.current = data;
    callerOnCompletedRef.current?.(data);
  }, [loading, error, data]);
};

/** Strip deprecated lifecycle callbacks so Apollo 3.14+ does not warn. */
const withoutDeprecatedCallbacks = <T extends Record<string, unknown> | undefined>(
  passedOptions: T
) => {
  if (!passedOptions) {
    return undefined;
  }

  const rest = { ...(passedOptions as Record<string, unknown>) };
  delete rest.onError;
  delete rest.onCompleted;
  return rest;
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

  const options = useMemo(
    () => ({
      ...withoutDeprecatedCallbacks(passedOptions as Record<string, unknown> | undefined),
      context: mergedContext,
      fetchPolicy: passedOptions?.fetchPolicy ?? 'cache-first',
      ...(passedOptions?.nextFetchPolicy !== undefined
        ? { nextFetchPolicy: passedOptions.nextFetchPolicy }
        : {}),
    }),
    [passedOptions, mergedContext]
  );

  const result = useQuery(query, options);
  useQueryLifecycleSideEffects(
    result.error,
    result.data,
    result.loading,
    passedOptions?.onError,
    passedOptions?.onCompleted
  );
  return result;
};

export const useLazyRoleQuery: typeof useLazyQuery = (query, passedOptions) => {
  const currentRole = useCurrentRole();
  const contextRole = useManagementRoleContext();
  const passedRole = passedOptions?.context?.role as AuthRoles | undefined;
  const mergedContext = useMemo(
    () => ({
      ...(passedOptions?.context ?? {}),
      role: passedRole ?? contextRole ?? currentRole,
    }),
    [passedOptions?.context, passedRole, contextRole, currentRole]
  );

  const options = useMemo(
    () =>
      passedOptions
        ? {
            ...withoutDeprecatedCallbacks(passedOptions as Record<string, unknown>),
            context: mergedContext,
          }
        : {
            context: mergedContext,
          },
    [passedOptions, mergedContext]
  );

  const result = useLazyQuery(query, options);
  useQueryLifecycleSideEffects(
    result[1].error,
    result[1].data,
    result[1].loading,
    passedOptions?.onError,
    passedOptions?.onCompleted
  );
  return result;
};

export const useAdminQuery: typeof useQuery = (query, passedOptions) => {
  const mergedContext = useMemo(
    () => ({
      ...passedOptions?.context,
      role: AuthRoles.admin,
    }),
    [passedOptions?.context]
  );

  const options = useMemo(
    () => ({
      ...withoutDeprecatedCallbacks(passedOptions as Record<string, unknown> | undefined),
      context: mergedContext,
    }),
    [passedOptions, mergedContext]
  );

  const result = useQuery(query, options);
  useQueryLifecycleSideEffects(
    result.error,
    result.data,
    result.loading,
    passedOptions?.onError,
    passedOptions?.onCompleted
  );
  return result;
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

  const options = useMemo(
    () => ({
      ...withoutDeprecatedCallbacks(passedOptions as Record<string, unknown> | undefined),
      context: mergedContext,
    }),
    [passedOptions, mergedContext]
  );

  const result = useQuery(query, options);
  useQueryLifecycleSideEffects(
    result.error,
    result.data,
    result.loading,
    passedOptions?.onError,
    passedOptions?.onCompleted
  );
  return result;
};

export const useAdminLazyQuery: typeof useLazyQuery = (query, passedOptions) => {
  const mergedContext = useMemo(
    () => ({
      ...passedOptions?.context,
      role: AuthRoles.admin,
    }),
    [passedOptions?.context]
  );

  const options = useMemo(
    () => ({
      ...withoutDeprecatedCallbacks(passedOptions as Record<string, unknown> | undefined),
      context: mergedContext,
    }),
    [passedOptions, mergedContext]
  );

  const result = useLazyQuery(query, options);
  useQueryLifecycleSideEffects(
    result[1].error,
    result[1].data,
    result[1].loading,
    passedOptions?.onError,
    passedOptions?.onCompleted
  );
  return result;
};

export const useInstructorQuery: typeof useQuery = (query, passedOptions) => {
  const mergedContext = useMemo(
    () => ({
      ...passedOptions?.context,
      role: AuthRoles.instructor,
    }),
    [passedOptions?.context]
  );

  const options = useMemo(
    () => ({
      ...withoutDeprecatedCallbacks(passedOptions as Record<string, unknown> | undefined),
      context: mergedContext,
    }),
    [passedOptions, mergedContext]
  );

  const result = useQuery(query, options);
  useQueryLifecycleSideEffects(
    result.error,
    result.data,
    result.loading,
    passedOptions?.onError,
    passedOptions?.onCompleted
  );
  return result;
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

  const options = useMemo(
    () => ({
      ...withoutDeprecatedCallbacks(passedOptions as Record<string, unknown> | undefined),
      context: mergedContext,
    }),
    [passedOptions, mergedContext]
  );

  const result = useQuery(query, options);
  useQueryLifecycleSideEffects(
    result.error,
    result.data,
    result.loading,
    passedOptions?.onError,
    passedOptions?.onCompleted
  );
  return result;
};

/**
 * @deprecated Use useRoleQuery instead.
 * This alias exists for backward compatibility and no longer forces role=user.
 */
export const useAuthedQuery: typeof useQuery = (query, passedOptions) => {
  return useRoleQuery(query, passedOptions);
};
