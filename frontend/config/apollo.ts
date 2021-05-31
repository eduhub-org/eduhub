import { ApolloClient, InMemoryCache } from "@apollo/client";

export const client = new ApolloClient({
  uri: process.env.GRAPHQL_URI ?? "http://localhost:8080/v1/graphql",
  cache: new InMemoryCache({
    typePolicies: {
      Course: {
        fields: {
          BookingDeadline: {
            merge: (_, BookingDeadline) => {
              return new Date(BookingDeadline);
            },
          },
          TimeOfStart: {
            merge: (_, TimeOfStart) => {
              return new Date(TimeOfStart);
            },
          },
        },
      },
      Session: {
        fields: {
          Start: {
            merge: (_, Start) => {
              return new Date(Start);
            },
          },
          Finish: {
            merge: (_, Start) => {
              return new Date(Start);
            },
          },
        },
      },
    },
  }),
});
