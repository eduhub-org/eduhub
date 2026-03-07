import { ApolloError, useQuery, useLazyQuery } from '@apollo/client';
import { useSession, signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useRef } from 'react';

import { useCurrentRole } from './authentication';
import { useAuthError } from '../contexts/AuthErrorContext';

import { AuthRoles } from '../types/enums';

const useErrorHandler = () => {
  const t = useTranslations();
  const { showAuthError } = useAuthError();

  return useCallback((error: { message?: string }) => {
    console.log('error handler error: ', error);
    if (error?.message?.includes('JWTExpired') || error?.message?.includes('JWSInvalidSignature')) {
      // For expired sessions, redirect immediately to login without showing a blocking dialog
      console.info('Session expired, redirecting to login...');
      signOut({ 
        callbackUrl: '/?sessionExpired=true',
        redirect: true 
      });
    } else {
      // Show error dialog for other authentication errors (without signing out)
      showAuthError(t("common.authed_query.authentication_error") + ": " + (error?.message ?? ''), false);
    }
  }, [showAuthError, t]);
};

export const useRoleQuery: typeof useQuery = (query, passedOptions) => {
  const { data } = useSession();
  const accessToken = data?.accessToken;
  const currentRole = useCurrentRole();

  // Keep a ref to passedOptions so the auth-context memo below doesn't need it
  // as a dependency. Callers that pass inline option objects (new reference every
  // render) would otherwise invalidate the memo on every render and send new
  // options objects to Apollo, triggering unnecessary setOptions calls.
  const passedOptionsRef = useRef(passedOptions);
  passedOptionsRef.current = passedOptions;

  // Auth context: only rebuilt when the token or role actually changes.
  const authContext = useMemo(() => {
    const opts = passedOptionsRef.current;
    const passedRole = opts?.context?.role as AuthRoles | undefined;
    if (!accessToken || currentRole === AuthRoles.anonymous) {
      return opts?.context;
    }
    return {
      ...opts?.context,
      headers: {
        'x-hasura-role': passedRole ?? currentRole,
        Authorization: `Bearer ${accessToken}`,
      },
    };
  }, [accessToken, currentRole]); // passedOptions intentionally NOT here

  // onError: stable via refs so it never causes Apollo to see new options.
  const errorHandler = useErrorHandler();
  const errorHandlerRef = useRef(errorHandler);
  errorHandlerRef.current = errorHandler;
  const callerOnErrorRef = useRef(passedOptions?.onError);
  callerOnErrorRef.current = passedOptions?.onError;

  const onError = useCallback((error: ApolloError) => {
    errorHandlerRef.current(error);
    callerOnErrorRef.current?.(error);
  }, []);

  // Merge stable auth context into passedOptions without making passedOptions a
  // memo dependency — Apollo's own deep-equality check handles variable changes.
  const queryOptions = useMemo(
    () => ({
      ...passedOptionsRef.current,
      context: authContext,
      onError,
    }),
    [authContext, onError]
  );

  return useQuery(query, queryOptions);
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
