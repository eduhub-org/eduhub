import { useQuery, useLazyQuery } from '@apollo/client';
import { useSession } from 'next-auth/react';

import { useCurrentRole } from './authentication';

import { AuthRoles } from '../types/enums';

const errorHandler = (error) => {
  console.log('error handler error: ', error);
  if (error === 'Error: Could not verify JWT: JWTExpired') {
    // const firstError = error.response.errors[0];
    // const errorCode = firstError.extensions.code;
    // console.log("first error, error code:", errorCode)
    // Do something with the error code...
    console.log('redirect login erreicht');
    // router.push('/login'); // Redirect to login page
  } else {
    // Handle other types of errors...
  }
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

  // const errorHandler = (error) => {
  //   console.log("error code: ", error?.response?.errors?.[0]?.extensions?.code)
  //   if (error?.response?.errors?.[0]?.extensions?.code === 'invalid-jwt') {
  //     console.log("redirect login erreicht")
  //     router.push('/login'); // Redirect to login page
  //   }
  // };

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

  // const errorHandler = (error) => {
  //   console.log("error code: ", error?.response?.errors?.[0]?.extensions?.code)
  //   if (error?.response?.errors?.[0]?.extensions?.code === 'invalid-jwt') {
  //     console.log("redirect login erreicht")
  //     router.push('/login'); // Redirect to login page
  //   }
  // };

  return useQuery(query, { ...options, onError: errorHandler });
};
