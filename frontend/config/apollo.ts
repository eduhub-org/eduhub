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
          ApplicationEnd: {
            merge: (_, ApplicationEnd) => {
              return new Date(ApplicationEnd);
            },
          },
          TimeStart: {
            merge: (_, TimeStart) => {
              return new Date(TimeStart);
            },
          },
          TimeEnd: {
            merge: (_, TimeEnd) => {
              return new Date(TimeEnd);
            },
          },
        },
      },
      Enrollment: {
        keyFields: ["Id"],
        fields: {
          ExpirationDate: {
            merge: (_, ExpirationDate) => {
              return new Date(ExpirationDate);
            },
          },
        },
      },
      Semester: {
        keyFields: ["Id"],
        fields: {
          ApplicationStart: {
            merge: (_, Start) => {
              return new Date(Start);
            },
          },
          ApplicationEnd: {
            merge: (_, Start) => {
              return new Date(Start);
            },
          },
          Start: {
            merge: (_, Start) => {
              return new Date(Start);
            },
          },
          End: {
            merge: (_, Start) => {
              return new Date(Start);
            },
          },
        },
      },
      Session: {
        keyFields: ["Id"],
        fields: {
          startDateTime: {
            merge: (_, startDateTime) => {
              return new Date(startDateTime);
            },
          },
          endDateTime: {
            merge: (_, endDateTime) => {
              return new Date(endDateTime);
            },
          },
        },
      },
    },
  }),
});
