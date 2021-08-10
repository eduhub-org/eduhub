import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_API_URL,
});

const authLink = setContext((_, { headers }) => {
  if (typeof window === "undefined") {
    return { headers };
  }

  // get the authentication token from local storage if it exists
  const token = window.localStorage.getItem("token");
  // return the headers to the context so httpLink can read them
  if (token) {
    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : "",
      },
    };
  } else {
    return { headers };
  }
});

export const client = new ApolloClient({
  uri: process.env.NEXT_PUBLIC_API_URL,
  link: httpLink,
  cache: new InMemoryCache({
    typePolicies: {
      Course: {
        keyFields: ["Id"],
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
      Enrollment: {
        keyFields: ["Id"],
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
