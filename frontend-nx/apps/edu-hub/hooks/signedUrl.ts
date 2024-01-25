import { useLazyRoleQuery } from "./authedQuery";
import { GetSignedUrl, GetSignedUrlVariables } from "../queries/__generated__/GetSignedUrl";
import { GET_SIGNED_URL } from "../queries/actions";
import { useCallback, useState } from 'react';
import { getPublicUrl } from "../helpers/filehandling";

export const useSignedUrl = (filePath) => {
  const [getFileSignedUrl, { data, loading }] = useLazyRoleQuery<GetSignedUrl, GetSignedUrlVariables>(GET_SIGNED_URL, {
    variables: { path: filePath },
  });
  const [error, setError] = useState(null);

  // If the file is public, directly return the public URL
  const pucblicUrl = getPublicUrl(filePath)
  if (pucblicUrl) {
    return { getSignedUrl: () => pucblicUrl, loading: false, error: null };
  }

  const getSignedUrl = useCallback(async () => {
    try {
        await getFileSignedUrl();
        if (data?.getSignedUrl?.link) {
          console.log(`Returning signed file URL: ${data.getSignedUrl.link}`); // Debugging log
          return data.getSignedUrl.link;
        } else {
          throw new Error('Signed URL not found in the response');
        }
    } catch (err) {
      console.error(`Error in getSignedUrl: ${err.message}`, err); // Error logging
      setError(err);
      return null;
    }
  }, [filePath, getFileSignedUrl, data]);

  return { getSignedUrl, loading, error };
};
