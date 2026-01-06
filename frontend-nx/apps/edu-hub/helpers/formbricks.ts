/**
 * Extracts the survey ID from a Formbricks survey URL.
 * 
 * URL format: https://formbricks.example.com/s/{surveyId}
 * 
 * @param url - The Formbricks survey URL
 * @returns The survey ID if found, null otherwise
 */
export function extractFormbricksSurveyId(url: string | null | undefined): string | null {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const sIndex = pathParts.indexOf('s');
    if (sIndex !== -1 && pathParts[sIndex + 1]) {
      return pathParts[sIndex + 1].split('?')[0];
    }
    return null;
  } catch {
    return null;
  }
}

