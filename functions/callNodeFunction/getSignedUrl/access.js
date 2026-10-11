// Instructor invoices contain confidential payment data: only their owner (and admins) may load
// them, even though the instructor role may otherwise read any file.
const OWNER_ONLY_FILE_SUFFIXES = ["/instructor_invoice.pdf"];

const isOwnPath = (path, userUUID) =>
  Boolean(userUUID) &&
  (path.includes("/user-" + userUUID + "/") ||
    path.startsWith(userUUID + "/") || // included for legacy names
    path.startsWith("/user-" + userUUID + "/")); // included for legacy names

/**
 * Decides whether a caller may get a signed URL for a storage path.
 */
export const canAccessPath = (path, userRole, userUUID) => {
  if (userRole === "admin") return true;
  if (OWNER_ONLY_FILE_SUFFIXES.some((suffix) => path.endsWith(suffix))) {
    return path.startsWith(userUUID + "/") && Boolean(userUUID);
  }
  return userRole === "instructor" || isOwnPath(path, userUUID);
};
