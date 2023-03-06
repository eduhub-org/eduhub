import { useQuery } from '@apollo/client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';


export const useAdminQuery: typeof useQuery = (query, passedOptions) => {
  const { data } = useSession();
  const accessToken = data?.accessToken;
  const router = useRouter();

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

  const errorHandler = (error) => {
    console.log("error: ", error)
    if (error?.response?.errors?.[0]?.extensions?.code === 'invalid-jwt') {
      console.log("error code: ", error?.response?.errors?.[0]?.extensions?.code)
      router.push('/login'); // Redirect to login page
    }
  };

  return useQuery(query, { ...options, onError: errorHandler });
};


export const useInstructorQuery: typeof useQuery = (query, passedOptions) => {
  const { data } = useSession();
  const accessToken = data?.accessToken;
  const router = useRouter();

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

    const errorHandler = (error) => {
      console.log("error: ", error)
      if (error?.response?.errors?.[0]?.extensions?.code === 'invalid-jwt') {
        console.log("error code: ", error?.response?.errors?.[0]?.extensions?.code)
        router.push('/login'); // Redirect to login page
      }
    };
  
    return useQuery(query, { ...options, onError: errorHandler });
  };

export const useAuthedQuery: typeof useQuery = (query, passedOptions) => {
  const { data } = useSession();
  const accessToken = data?.accessToken;
  const router = useRouter();

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

    const errorHandler = (error) => {
      console.log("error: ", error)
      if (error?.response?.errors?.[0]?.extensions?.code === 'invalid-jwt') {
        console.log("error code: ", error?.response?.errors?.[0]?.extensions?.code)
        router.push('/login'); // Redirect to login page
      }
    };
  
    return useQuery(query, { ...options, onError: errorHandler });
  };
