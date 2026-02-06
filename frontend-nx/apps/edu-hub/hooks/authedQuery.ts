import { useQuery, useLazyQuery } from '@apollo/client';
import { useSession, signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';

import { useCurrentRole } from './authentication';
import { useAuthError } from '../contexts/AuthErrorContext';

import { AuthRoles } from '../types/enums';

const useErrorHandler = () => {
  const t = useTranslations();
  const { showAuthError } = useAuthError();

  return (error) => {
    console.log('error handler error: ', error);
    if (error.message.includes('JWTExpired') || error.message.includes('JWSInvalidSignature')) {
      // For expired sessions, redirect immediately to login without showing a blocking dialog
      console.info('Session expired, redirecting to login...');
      signOut({ 
        callbackUrl: '/?sessionExpired=true',
        redirect: true 
      });
    } else {
      // Show error dialog for other authentication errors (without signing out)
      showAuthError(t("common.authed_query.authentication_error") + ": " + error.message, false);
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
  const callerOnError = passedOptions?.onError;
      
  return useQuery(query, { 
    ...options, 
    onError: (error) => {
      errorHandler(error);
      callerOnError?.(error);
    }
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
