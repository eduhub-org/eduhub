import { useMutation } from "@apollo/client";
import { useKeycloak } from "@react-keycloak/ssr";
import { KeycloakInstance } from "keycloak-js";

export const useAuthedMutation: typeof useMutation = (
  mutation,
  passedOptions
) => {
  const { keycloak } = useKeycloak<KeycloakInstance>();

  const token = keycloak?.token;

  const options = token
    ? {
        ...passedOptions,
        context: {
          ...passedOptions?.context,
          headers: {
            ...passedOptions?.context?.headers,
            Authorization: "Bearer " + token,
          },
        },
      }
    : passedOptions;

  return useMutation(mutation, options);
};
