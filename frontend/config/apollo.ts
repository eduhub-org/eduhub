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
            merge: (_, applicationEnd) => {
              return new Date(applicationEnd);
            },
          },
          startTime: {
            merge: (_, startTime) => {
              return new Date(startTime);
            },
          },
          endTime: {
            merge: (_, endTime) => {
              return new Date(endTime);
            },
          },
        },
      },
      CourseEnrollment: {
        fields: {
          invitationExpirationDate: {
            merge: (_, invitationExpirationDate) => {
              return new Date(invitationExpirationDate);
            },
          },
        },
      },
      Program: {
        fields: {
          applicationStart: {
            merge: (_, applicationStart) => {
              return new Date(applicationStart);
            },
          },
          applicationEnd: {
            merge: (_, applicationEnd) => {
              return new Date(applicationEnd);
            },
          },
          defaultApplicationEnd: {
            merge: (_, defaultApplicationEnd) => {
              return new Date(defaultApplicationEnd);
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
          projectRecordUploadDeadline: {
            merge: (_, projectRecordUploadDeadline) => {
              return new Date(projectRecordUploadDeadline);
            }
          }
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
