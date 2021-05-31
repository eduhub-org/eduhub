import { ApolloClient, InMemoryCache } from "@apollo/client";

export const client = new ApolloClient({
  uri: "/data/v1/graphql",
  cache: new InMemoryCache(),
});
