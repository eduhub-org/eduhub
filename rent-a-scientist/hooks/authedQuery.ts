import { useQuery } from "@apollo/client";
import { useKeycloak } from "@react-keycloak/ssr";
import { KeycloakInstance } from "keycloak-js";

export const useUserQuery: typeof useQuery = (query, passedOptions) => {
  const { keycloak } = useKeycloak<KeycloakInstance>();

  const token = keycloak?.token;

  const options = token
    ? {
      ...passedOptions,
      context: {
        ...passedOptions?.context,
        headers: {
          ...passedOptions?.context?.headers,
          "x-hasura-role": "user",
          Authorization: "Bearer " + token,
        },
      },
    }
    : passedOptions;

  return useQuery(query, options);
};

export const useAdminQuery: typeof useQuery = (query, passedOptions) => {
  const { keycloak } = useKeycloak<KeycloakInstance>();

  const token = keycloak?.token;

  const options = token
    ? {
      ...passedOptions,
      context: {
        ...passedOptions?.context,
        headers: {
          ...passedOptions?.context?.headers,
          "x-hasura-role": "admin",
          Authorization: "Bearer " + token,
        },
      },
    }
    : passedOptions;

  return useQuery(query, options);
};

export const useInstructorQuery: typeof useQuery = (query, passedOptions) => {
  const { keycloak } = useKeycloak<KeycloakInstance>();

  const token = keycloak?.token;

  const options = token
    ? {
      ...passedOptions,
      context: {
        ...passedOptions?.context,
        headers: {
          ...passedOptions?.context?.headers,
          "x-hasura-role": "instructor",
          Authorization: "Bearer " + token,
        },
      },
    }
    : passedOptions;

  return useQuery(query, options);
};

export const useAuthedQuery: typeof useQuery = (query, passedOptions) => {
  const { keycloak } = useKeycloak<KeycloakInstance>();

  const token = keycloak?.token;

  const options = token
    ? {
      ...passedOptions,
      context: {
        ...passedOptions?.context,
        headers: {
          ...passedOptions?.context?.headers,
          "x-hasura-role": "admin",
          Authorization: "Bearer " + token,
        },
      },
    }
    : passedOptions;

  return useQuery(query, options);
};
