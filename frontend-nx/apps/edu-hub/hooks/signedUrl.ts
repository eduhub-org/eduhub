import { useLazyRoleQuery } from "./authedQuery";
import { GetSignedUrl, GetSignedUrlVariables } from "../queries/__generated__/GetSignedUrl";
import { GET_SIGNED_URL } from "../queries/actions";
import { useCallback, useState } from 'react';
import { getPublicUrl } from "../helpers/filehandling";

export const useSignedUrl = (filePath: string): { getSignedUrl: () => Promise<{ url: string | null }>; loading: boolean; error: any; } => {
  const [getFileSignedUrl, { loading }] = useLazyRoleQuery<GetSignedUrl, GetSignedUrlVariables>(GET_SIGNED_URL, {
    variables: { path: filePath },
    fetchPolicy: 'network-only',
  });
  const [error, setError] = useState<unknown>(null);

  const publicUrl = getPublicUrl(filePath)

  const getSignedUrl = useCallback(async () => {
    if (publicUrl) {
      return { url: publicUrl };
    }
    try {
      const result = await getFileSignedUrl();
      const link = result.data?.getSignedUrl?.link;
      if (link) {
        return { url: link };
      } else {
        throw new Error('Signed URL not found in the response');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error in getSignedUrl: ${message}`, err);
      setError(err);
      return { url: null };
    }
  }, [getFileSignedUrl, publicUrl]);

  return { getSignedUrl, loading, error };
};