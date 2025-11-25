/**
 * Recursively merges sort direction into a nested object structure, replacing null values
 * @param obj - The nested object structure from sortColumnMapper
 * @param direction - The sort direction ('asc' or 'desc')
 * @returns The object with direction filled in
 */
export function mergeSortDirection(obj: Record<string, any>, direction: string): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value === null) {
      // Replace null with direction
      result[key] = direction;
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      // Recursively process nested objects
      result[key] = mergeSortDirection(value, direction);
    } else {
      // Keep other values as-is
      result[key] = value;
    }
  }
  
  return result;
}
