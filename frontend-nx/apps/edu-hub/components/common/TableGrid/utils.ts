// Re-export createMultiWordSearchCondition from helpers for backward compatibility
export { createMultiWordSearchCondition } from '../../../helpers/searchUtils';

/** Leaf of a sort mapping that sorts NULLs last in both directions (e.g. `desc_nulls_last`). */
export const NULLS_LAST = 'nulls_last';

/**
 * Recursively merges a sort direction into a nested object structure.
 * Replaces null values with the direction (NULLS_LAST with `{direction}_nulls_last`), and
 * recursively processes nested objects.
 * 
 * @param obj - The object structure to merge the direction into
 * @param direction - The sort direction ('asc' or 'desc')
 * @returns A new object with the direction merged in
 * 
 * @example
 * mergeSortDirection({ User: { firstName: null } }, 'asc')
 * // Returns: { User: { firstName: 'asc' } }
 */
export function mergeSortDirection(obj: Record<string, any>, direction: string): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value === null) {
      result[key] = direction;
    } else if (value === NULLS_LAST) {
      result[key] = `${direction}_nulls_last`;
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      result[key] = mergeSortDirection(value, direction);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

