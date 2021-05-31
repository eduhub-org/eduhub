import { ApolloClient, InMemoryCache } from "@apollo/client";

export const client = new ApolloClient({
  uri: process.env.GRAPHQL_URI ?? "http://localhost:8080/v1/graphql",
  cache: new InMemoryCache({
    typePolicies: {
      Session: {
        fields: {
          Start: {
            merge: (_, Start) => {
              return new Date(Start);
            },
          },
        },
      },
    },
  }),
});
