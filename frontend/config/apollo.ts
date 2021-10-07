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
        fields: {
          applicationEnd: {
            merge: (_, ApplicationEnd) => {
              return new Date(ApplicationEnd);
            },
          },
          startTime: {
            merge: (_, TimeStart) => {
              return new Date(TimeStart);
            },
          },
          endTime: {
            merge: (_, TimeEnd) => {
              return new Date(TimeEnd);
            },
          },
        },
      },
      Enrollment: {
        fields: {
          ExpirationDate: {
            merge: (_, ExpirationDate) => {
              return new Date(ExpirationDate);
            },
          },
        },
      },
      Program: {
        fields: {
          applicationStart: {
            merge: (_, Start) => {
              return new Date(Start);
            },
          },
          applicationEnd: {
            merge: (_, Start) => {
              return new Date(Start);
            },
          },
          lectureStart: {
            merge: (_, lectureStart) => {
              return new Date(lectureStart);
            },
          },
          lectureEnd: {
            merge: (_, lectureEnd) => {
              return new Date(lectureEnd);
            },
          },
        },
      },
      Session: {
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
