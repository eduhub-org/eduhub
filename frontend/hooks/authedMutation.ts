import {
  QueryResult,
  useMutation
} from "@apollo/client";
import { useSession } from "next-auth/react";
import { useCallback } from "react";
import { DocumentNode } from "graphql";

export const useRoleMutation: typeof useMutation = (
  mutation,
  passedOptions
) => {
  const { data } = useSession();
  const accessToken = data?.accessToken;

  // @ts-ignore
  const passedRole = passedOptions?.context?.role;

  if (passedRole == null) {
    throw new Error(
      "You neeed to set a context.role in the passed options of your mutation if you want to use useRoleMutation!"
    );
  }

  const options = accessToken
    ? {
        ...passedOptions,
        context: {
          ...passedOptions?.context,
          headers: {
            "x-hasura-role": `${passedRole}`,
            Authorization: "Bearer " + accessToken,
          },
        },
      }
    : passedOptions;

  // @ts-ignore
  return useMutation(mutation, options);
};

export const useInstructorMutation: typeof useMutation = (
  mutation,
  passedOptions
) => {
  const { data } = useSession();
  const accessToken = data?.accessToken;

  const options = accessToken
    ? {
        ...passedOptions,
        context: {
          ...passedOptions?.context,
          headers: {
            // @ts-ignore
            ...passedOptions?.context?.headers,
            "x-hasura-role": "instructor",
            Authorization: "Bearer " + accessToken,
          },
        },
      }
    : passedOptions;

  // @ts-ignore
  return useMutation(mutation, options);
};

export const useAdminMutation: typeof useMutation = (
  mutation,
  passedOptions
) => {
  const { data } = useSession();
  const accessToken = data?.accessToken;

  const options = accessToken
    ? {
        ...passedOptions,
        context: {
          ...passedOptions?.context,
          headers: {
            // @ts-ignore
            ...passedOptions?.context?.headers,
            "x-hasura-role": "admin",
            Authorization: "Bearer " + accessToken,
          },
        },
      }
    : passedOptions;

  // @ts-ignore
  return useMutation(mutation, options);
};

export const useAuthedMutation: typeof useMutation = (
  mutation,
  passedOptions
) => {
  const { data } = useSession();
  const accessToken = data?.accessToken;

  const options = accessToken
    ? {
        ...passedOptions,
        context: {
          ...passedOptions?.context,
          headers: {
            // @ts-ignore
            ...passedOptions?.context?.headers,
            Authorization: "Bearer " + accessToken,
          },
        },
      }
    : passedOptions;

  // @ts-ignore
  return useMutation(mutation, options);
};

export const identityEventMapper = (x: any) => x;
export const eventTargetValueMapper = (x: any) => x.target.value;
export const eventTargetNumberMapper = (x: any) => Number(x.target.value);
export const pickIdPkMapper = (x: any) => x.id;

// use to reduce boilerplate involving all the use*Mutation, then useCallback with that mutation
// to update a single field
export const useUpdateCallback = <QueryType, QueryVariables>(
  query: DocumentNode,
  role: "admin" | "instructor",
  pkField: keyof QueryVariables,
  updateField: keyof QueryVariables,
  updatePK: any,
  eventMapper: (event: any) => any,
  mainQueryResult: QueryResult<any, any>
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
  role: "admin" | "instructor",
  pkField: keyof QueryVariables,
  updateField: keyof QueryVariables,
  pkMapper: (pKSource: any) => any,
  eventMapper: (event: any, pkSource: any) => any,
  mainQueryResult: QueryResult<any, any>
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

export const useDeleteCallback = <QueryType, QueryVariables>(
  query: DocumentNode,
  role: "admin" | "instructor",
  pkField: keyof QueryVariables,
  pkMapper: (event: any) => any,
  mainQueryResult: QueryResult<any, any>
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
