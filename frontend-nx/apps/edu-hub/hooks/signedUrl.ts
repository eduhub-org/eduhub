import { useLazyRoleQuery } from "./authedQuery";
import { GetSignedUrl, GetSignedUrlVariables } from "../graphql/__generated__/GetSignedUrl";
import { GET_SIGNED_URL } from "../graphql/queries/actions";
import { useCallback, useState } from 'react';
import { getPublicUrl } from "../helpers/filehandling";

export const useSignedUrl = (filePath: string): { getSignedUrl: () => Promise<{ url: string | null }>; loading: boolean; error: any; } => {
  const [getFileSignedUrl, { data, loading }] = useLazyRoleQuery<GetSignedUrl, GetSignedUrlVariables>(GET_SIGNED_URL, {
    variables: { path: filePath },
  });
  const [error, setError] = useState(null);

  // Sets publicUrl to null if file is not public
  const publicUrl = getPublicUrl(filePath)

  const getSignedUrl = useCallback(async () => {
    // If the file is public, directly return the public URL
    if (publicUrl) {
      return { url: publicUrl };
    }
    try {
      await getFileSignedUrl();
      if (data?.getSignedUrl?.link) {
        console.log(`Returning signed file URL: ${data.getSignedUrl.link}`); // Debugging log
        return { url: data.getSignedUrl.link };
      } else {
        throw new Error('Signed URL not found in the response');
      }
    } catch (err) {
      console.error(`Error in getSignedUrl: ${err.message}`, err); // Error logging
      setError(err);
      return { url: null };
    }
  }, [getFileSignedUrl, data, publicUrl]);

  return { getSignedUrl, loading, error };
};