import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useApolloClient, DocumentNode } from '@apollo/client';
import { useSession } from 'next-auth/react';
import { AuthRoles } from '../types/enums';

/**
 * Generic hook for fetching multiple GraphQL queries in parallel
 * 
 * This hook is useful when you need to fetch data for multiple entities (e.g., courses, users)
 * where each entity requires a separate query. Instead of using multiple useQuery hooks
 * (which can cause performance issues with many entities), this hook batches all queries
 * and executes them in parallel using Promise.all.
 * 
 * @param query The GraphQL query document
 * @param ids Array of IDs to fetch data for
 * @param getVariables Function to generate variables for each ID
 * @param extractData Function to extract the desired data from each query result
 * @param role Optional Hasura role (defaults to admin)
 * @returns Map of ID -> extracted data
 * 
 * @example
 * // Fetch template counts for multiple courses
 * const courseTemplateCounts = useParallelQueries(
 *   GET_COURSE_TEMPLATES_COUNT,
 *   courseIds,
 *   (courseId) => ({ courseId }),
 *   (result) => result.data?.MailTemplate_aggregate?.aggregate?.count || 0
 * );
 * 
 * @example
 * // Fetch user details for multiple user IDs
 * const userDetails = useParallelQueries(
 *   GET_USER_DETAILS,
 *   userIds,
 *   (userId) => ({ id: userId }),
 *   (result) => result.data?.User_by_pk,
 *   AuthRoles.user
 * );
 */
export const useParallelQueries = <TId, TData>(
  query: DocumentNode,
  ids: TId[],
  getVariables: (id: TId) => Record<string, any>,
  extractData: (result: any) => TData,
  role: AuthRoles = AuthRoles.admin
): Map<TId, TData> => {
  const client = useApolloClient();
  const { data: sessionData } = useSession();
  const accessToken = sessionData?.accessToken;
  const [dataMap, setDataMap] = useState<Map<TId, TData>>(new Map());

  // Memoize getVariables and extractData to avoid unnecessary refetches
  const memoizedGetVariables = useCallback(getVariables, [getVariables]);
  const memoizedExtractData = useCallback(extractData, [extractData]);

  // Create a stable string representation of IDs for comparison
  // This prevents infinite loops when the array reference changes but values are the same
  const idsKey = useMemo(() => {
    if (ids.length === 0) return '';
    // Sort and stringify to create a stable key (order doesn't matter for fetching)
    return JSON.stringify([...ids].sort());
  }, [ids]);

  // Store current ids in a ref so we can access the latest value in the effect
  // without including it in the dependency array
  const idsRef = useRef<TId[]>(ids);
  idsRef.current = ids;

  useEffect(() => {
    const currentIds = idsRef.current;

    if (currentIds.length === 0) {
      setDataMap(new Map());
      return;
    }

    const fetchData = async () => {
      try {
        const context = accessToken
          ? {
              headers: {
                'x-hasura-role': role,
                Authorization: `Bearer ${accessToken}`,
              },
            }
          : undefined;

        // Fetch all queries in parallel
        const promises = currentIds.map((id) =>
          client.query({
            query,
            variables: memoizedGetVariables(id),
            context,
            fetchPolicy: 'cache-first', // Use cache if available for better performance
          })
        );

        const results = await Promise.all(promises);

        // Build map from results
        const map = new Map<TId, TData>();
        results.forEach((result, index) => {
          const id = currentIds[index];
          const data = memoizedExtractData(result);
          map.set(id, data);
        });

        setDataMap(map);
      } catch (error) {
        console.error('Error fetching parallel queries:', error);
        // On error, set empty map to avoid showing incorrect data
        setDataMap(new Map());
      }
    };

    fetchData();
    // Only depend on idsKey (stable string representation) and other stable dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, client, accessToken, query, memoizedGetVariables, memoizedExtractData, role]);

  return dataMap;
};

