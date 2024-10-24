import { QueryResult, useMutation, DocumentNode, MutationFunctionOptions } from '@apollo/client';
import { useSession } from 'next-auth/react';
import { useCallback } from 'react';

import { useCurrentRole } from './authentication';
import { AuthRoles } from '../types/enums';

type CustomContext = {
  headers?: Record<string, string>;
  role?: AuthRoles;
};

type CustomMutationOptions<TData, TVariables> = MutationFunctionOptions<TData, TVariables> & {
  context?: CustomContext;
};

export const useRoleMutation = <TData = any, TVariables = any>(
  mutation: DocumentNode,
  passedOptions?: CustomMutationOptions<TData, TVariables>
) => {
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

  return useMutation<TData, TVariables>(mutation, options);
};

// Corrected useInstructorMutation hook
export const useInstructorMutation = <TData = any, TVariables = any>(
  mutation: DocumentNode,
  passedOptions?: CustomMutationOptions<TData, TVariables>
) => {
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
            Authorization: 'Bearer ' + accessToken,
          },
        },
      }
    : passedOptions;

  return useMutation<TData, TVariables>(mutation, options);
};

// Corrected useAdminMutation hook
export const useAdminMutation = <TData = any, TVariables = any>(
  mutation: DocumentNode,
  passedOptions?: CustomMutationOptions<TData, TVariables>
) => {
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
            Authorization: 'Bearer ' + accessToken,
          },
        },
      }
    : passedOptions;

  return useMutation<TData, TVariables>(mutation, options);
};

// Corrected useAuthedMutation hook
export const useAuthedMutation = <TData = any, TVariables = any>(
  mutation: DocumentNode,
  passedOptions?: CustomMutationOptions<TData, TVariables>
) => {
  const { data } = useSession();
  const accessToken = data?.accessToken;

  const options = accessToken
    ? {
        ...passedOptions,
        context: {
          ...passedOptions?.context,
          headers: {
            ...passedOptions?.context?.headers,
            Authorization: 'Bearer ' + accessToken,
          },
        },
      }
    : passedOptions;

  return useMutation<TData, TVariables>(mutation, options);
};

// Helper functions for event mappers
export const identityEventMapper = (x: any) => x;
export const eventTargetValueMapper = (x: any) => x.target.value;
export const eventTargetNumberMapper = (x: any) => Number(x.target.value);
export const pickIdPkMapper = (x: any) => x.id;

// use to reduce boilerplate involving all the use*Mutation, then useCallback with that mutation
// to update a single field
export const useUpdateCallback = <QueryType, QueryVariables>(
  query: DocumentNode,
  pkField: keyof QueryVariables,
  updateField: keyof QueryVariables,
  updatePK: any,
  eventMapper: (event: any) => any,
  mainQueryResult: QueryResult<any, any>,
  role?: AuthRoles.admin | AuthRoles.instructor
) => {
  const [mutation] = useRoleMutation<QueryType, QueryVariables>(query, {
    context: {
      role,
    },
  });
  const callback = useCallback(
    async (event: any) => {
      const updatedValue = eventMapper(event);
      if (updatePK != null) {
        await mutation({
          variables: {
            [pkField]: updatePK,
            [updateField]: updatedValue,
          } as any,
        });
        mainQueryResult.refetch();
      }
    },
    [mutation, eventMapper, mainQueryResult, pkField, updateField, updatePK]
  );
  return callback;
};

// different version of useUpdateCallback, which expects the produces callback handler to have two parameters,
// one for the primary key and one for the updated value
export const useUpdateCallback2 = <QueryType, QueryVariables>(
  query: DocumentNode,
  pkField: keyof QueryVariables,
  updateField: keyof QueryVariables,
  pkMapper: (pKSource: any) => any,
  eventMapper: (event: any, pkSource: any) => any,
  mainQueryResult: QueryResult<any, any>,
  role?: AuthRoles.admin | AuthRoles.instructor
) => {
  const [mutation] = useRoleMutation<QueryType, QueryVariables>(query, {
    context: {
      role,
    },
  });
  const callback = useCallback(
    async (pk: any, event: any) => {
      const pkValue = pkMapper(pk);
      const updatedValue = eventMapper(event, pk);
      await mutation({
        variables: {
          [pkField]: pkValue,
          [updateField]: updatedValue,
        } as any,
      });
      mainQueryResult.refetch();
    },
    [mutation, eventMapper, mainQueryResult, pkField, updateField, pkMapper]
  );
  return callback;
};

// Callback for delete mutation
export const useDeleteCallback = <QueryType, QueryVariables>(
  query: DocumentNode,
  pkField: keyof QueryVariables,
  pkMapper: (event: any) => any,
  mainQueryResult: QueryResult<any, any>,
  role?: AuthRoles.admin | AuthRoles.instructor
) => {
  const [mutation] = useRoleMutation<QueryType, QueryVariables>(query, {
    context: {
      role,
    },
  });
  const callback = useCallback(
    async (pk: any) => {
      const pkValue = pkMapper(pk);
      await mutation({
        variables: {
          [pkField]: pkValue,
        } as any,
      });
      mainQueryResult.refetch();
    },
    [mutation, mainQueryResult, pkField, pkMapper]
  );
  return callback;
};
