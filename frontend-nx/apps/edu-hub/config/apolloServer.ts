import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

/**
 * A minimal Apollo client for `getServerSideProps`.
 *
 * It carries no credentials, so Hasura applies HASURA_GRAPHQL_UNAUTHORIZED_ROLE
 * (`anonymous`) and an unpublished course simply comes back empty — exactly what
 * a crawler should see.
 *
 * `NEXT_PUBLIC_API_URL` is the browser-facing endpoint. In production that is a
 * public HTTPS URL the server can reach too, but in local Docker it points at
 * localhost:8080, which does not resolve from inside the frontend container —
 * hence the GRAPHQL_SSR_API_URL override set in docker-compose.yml.
 */
const serverGraphqlUri = () => process.env.GRAPHQL_SSR_API_URL ?? process.env.NEXT_PUBLIC_API_URL;

export const createServerApolloClient = () =>
  new ApolloClient({
    ssrMode: true,
    link: createHttpLink({ uri: serverGraphqlUri() }),
    cache: new InMemoryCache(),
  });
