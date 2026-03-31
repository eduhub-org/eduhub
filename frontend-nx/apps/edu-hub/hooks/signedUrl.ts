import { useLazyRoleQuery } from "./authedQuery";
import { GetSignedUrl, GetSignedUrlVariables } from "../queries/__generated__/GetSignedUrl";
import { GET_SIGNED_URL, GET_SIGNED_URL_QUERY_OPTIONS } from "../queries/actions";
import { useCallback, useState } from 'react';
import { getPublicUrl } from "../helpers/filehandling";

export const useSignedUrl = (filePath: string): { getSignedUrl: () => Promise<{ url: string | null }>; loading: boolean; error: any; } => {
  const [getFileSignedUrl, { loading }] = useLazyRoleQuery<GetSignedUrl, GetSignedUrlVariables>(GET_SIGNED_URL, {
    variables: { path: filePath },
    ...GET_SIGNED_URL_QUERY_OPTIONS,
  });
  const [error, setError] = useState<unknown>(null);

  // Sets publicUrl to null if file is not public
  const publicUrl = getPublicUrl(filePath)

  const getSignedUrl = useCallback(async () => {
    // If the file is public, directly return the public URL
    if (publicUrl) {
      return { url: publicUrl };
    }
    try {
      const result = await getFileSignedUrl({
        variables: { path: filePath },
        ...GET_SIGNED_URL_QUERY_OPTIONS,
      });
      const link = result.data?.getSignedUrl?.link;
      if (link) {
        return { url: link };
      }
      throw new Error('Signed URL not found in the response');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error in getSignedUrl: ${message}`, err);
      setError(err);
      return { url: null };
    }
  }, [getFileSignedUrl, filePath, publicUrl]);

  return { getSignedUrl, loading, error };
};