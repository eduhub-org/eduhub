import { useQuery } from '@apollo/client';
import { useSession } from 'next-auth/react';

export const useUserQuery: typeof useQuery = (query, passedOptions) => {
  const { data } = useSession();
  const accessToken = data?.accessToken;

  const options = accessToken
    ? {
        ...passedOptions,
        context: {
          ...passedOptions?.context,
          headers: {
            ...passedOptions?.context?.headers,
            'x-hasura-role': 'user',
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    : passedOptions;

  return useQuery(query, options);
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
            'x-hasura-role': 'admin',
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    : passedOptions;

  return useQuery(query, options);
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
            'x-hasura-role': 'instructor',
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    : passedOptions;

  return useQuery(query, options);
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
            'x-hasura-role': 'user',
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    : passedOptions;

  return useQuery(query, options);
};
