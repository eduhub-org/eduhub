import { ApolloClient, ApolloLink, InMemoryCache, createHttpLink } from '@apollo/client';
import { AuthRoles } from '../types/enums';
import { getAuthState } from './authStore';

const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_API_URL,
  credentials: 'include',
});

const authLink = new ApolloLink((operation, forward) => {
  const { accessToken, role } = getAuthState();
  const roleOverride = operation.getContext().role as AuthRoles | undefined;
  const effectiveRole = roleOverride ?? role;
  const willAddAuth = !!(accessToken && effectiveRole !== AuthRoles.anonymous);

  if (willAddAuth) {
    operation.setContext((prev: Record<string, unknown>) => {
      const existingHeaders =
        prev.headers && typeof prev.headers === 'object'
          ? (prev.headers as Record<string, string>)
          : {};
      return {
        ...prev,
        headers: {
          ...existingHeaders,
          'x-hasura-role': effectiveRole,
          Authorization: `Bearer ${accessToken}`,
        },
      };
    });
  }

  return forward(operation);
});

export const client = new ApolloClient({
  // The transport URI is supplied by `httpLink` (createHttpLink) in the link
  // chain below; a top-level `uri` alongside `link` is redundant and Apollo
  // Client 3.14 warns against it.
  link: ApolloLink.from([authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // ManagedCourse, participation counts, etc. can each refetch Course_by_pk; replace
          // with the latest payload to avoid Apollo cache merge warnings on nested arrays.
          Course_by_pk: {
            merge(_existing: unknown, incoming: unknown) {
              return incoming;
            },
          },
          Course: {
            merge: (_, incoming) => incoming,
          },
          AchievementOption: {
            merge: (_, incoming) => incoming,
          },
          AchievementOptionCourse: {
            merge: (_, incoming) => incoming,
          },
          User_by_pk: {
            merge: (_, incoming) => incoming,
          },
        },
      },
      Course: {
        fields: {
          applicationEnd: {
            merge: (_, applicationEnd) => {
              return new Date(applicationEnd);
            },
          },
          CourseInstructors: {
            merge: (_, incoming) => incoming,
          },
          CourseEnrollments: {
            merge: (_, incoming) => incoming,
          },
          // Prevent refetch loop: MANAGED_COURSE and COURSE_PARTICIPATIONS both write
          // Course.Sessions and AchievementOptionCourses. Returning existing when refs
          // match avoids cache broadcast that triggers refetch.
          AchievementOptionCourses: {
            merge(existing: unknown[] | undefined, incoming: unknown[] | undefined) {
              if (incoming == null) return existing ?? incoming;
              if (!existing?.length) return incoming;
              const existingRefs = (existing as { __ref?: string }[]).map((e) => e?.__ref).join(',');
              const incomingRefs = (incoming as { __ref?: string }[]).map((i) => i?.__ref).join(',');
              if (existingRefs === incomingRefs) return existing;
              return incoming;
            },
          },
          Sessions: {
            merge(existing: unknown[] | undefined, incoming: unknown[] | undefined) {
              if (incoming == null) return existing ?? incoming;
              if (!existing?.length) return incoming;
              const existingRefs = (existing as { __ref?: string }[]).map((e) => e?.__ref).join(',');
              const incomingRefs = (incoming as { __ref?: string }[]).map((i) => i?.__ref).join(',');
              if (existingRefs === incomingRefs) return existing;
              return incoming;
            },
          },
        },
      },
      AchievementOption: {
        fields: {
          AchievementOptionCourses: {
            merge: (_, incoming) => incoming,
          },
          AchievementOptionMentors: {
            merge: (_, incoming) => incoming,
          },
        },
      },

      CourseEnrollment: {
        fields: {
          invitationExpirationDate: {
            merge: (_, invitationExpirationDate) => {
              return invitationExpirationDate != null
                ? new Date(invitationExpirationDate)
                : null;
            },
          },
        },
      },
      Program: {
        fields: {
          applicationStart: {
            merge: (_, applicationStart) => {
              return applicationStart != null ? new Date(applicationStart) : null;
            },
          },
          applicationEnd: {
            merge: (_, applicationEnd) => {
              return applicationEnd != null ? new Date(applicationEnd) : null;
            },
          },
          defaultApplicationEnd: {
            merge: (_, defaultApplicationEnd) => {
              return defaultApplicationEnd != null
                ? new Date(defaultApplicationEnd)
                : null;
            },
          },
          lectureStart: {
            merge: (_, lectureStart) => {
              return lectureStart != null ? new Date(lectureStart) : null;
            },
          },
          lectureEnd: {
            merge: (_, lectureEnd) => {
              return lectureEnd != null ? new Date(lectureEnd) : null;
            },
          },
          achievementRecordUploadDeadline: {
            merge: (_, achievementRecordUploadDeadline) => {
              return achievementRecordUploadDeadline != null
                ? new Date(achievementRecordUploadDeadline)
                : null;
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
