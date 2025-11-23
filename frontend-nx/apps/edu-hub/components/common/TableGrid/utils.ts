/**
 * Converts a dot-notation field path (e.g., 'User.firstName') into a nested object structure
 * @param fieldPath - Field path in dot notation (e.g., 'User.firstName' or 'firstName')
 * @param value - The value to assign to the final field
 * @returns Nested object structure (e.g., { User: { firstName: value } } or { firstName: value })
 */
function createNestedFieldCondition(fieldPath: string, value: any): Record<string, any> {
  const parts = fieldPath.split('.');
  const result: Record<string, any> = {};
  let current = result;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (i === parts.length - 1) {
      // Last part gets the value
      current[part] = value;
    } else {
      // Intermediate parts create nested objects
      current[part] = {};
      current = current[part];
    }
  }

  return result;
}

/**
 * Utility function to create multi-word search conditions for GraphQL queries.
 * Splits search terms by whitespace and ensures each word matches individually.
 * 
 * @param searchTerm - The search string (may contain multiple words separated by spaces)
 * @param fields - Array of field paths to search in (e.g., ['firstName', 'lastName', 'email'] or ['User.firstName', 'User.lastName'])
 * @param options - Optional configuration
 * @param options.arrayFields - Array of field paths that should use `_contains` instead of `_ilike` (e.g., ['aliases'])
 * @returns GraphQL filter condition object, or empty object if searchTerm is empty
 * 
 * @example
 * // Single field search
 * createMultiWordSearchCondition('hello world', ['title'])
 * // Returns: { _and: [{ title: { _ilike: '%hello%' } }, { title: { _ilike: '%world%' } }] }
 * 
 * @example
 * // Multi-field search
 * createMultiWordSearchCondition('john doe', ['firstName', 'lastName', 'email'])
 * // Returns: { _and: [{ _or: [{ firstName: { _ilike: '%john%' } }, { lastName: { _ilike: '%john%' } }, { email: { _ilike: '%john%' } }] }, { _or: [{ firstName: { _ilike: '%doe%' } }, { lastName: { _ilike: '%doe%' } }, { email: { _ilike: '%doe%' } }] }] }
 * 
 * @example
 * // Nested field search
 * createMultiWordSearchCondition('john doe', ['User.firstName', 'User.lastName'])
 * // Returns: { _and: [{ _or: [{ User: { firstName: { _ilike: '%john%' } } }, { User: { lastName: { _ilike: '%john%' } } }] }, { _or: [{ User: { firstName: { _ilike: '%doe%' } } }, { User: { lastName: { _ilike: '%doe%' } } }] }] }
 * 
 * @example
 * // Array field with _contains
 * createMultiWordSearchCondition('alias1 alias2', ['name', 'description'], { arrayFields: ['aliases'] })
 * // Returns: { _and: [{ _or: [{ name: { _ilike: '%alias1%' } }, { description: { _ilike: '%alias1%' } }, { aliases: { _contains: 'alias1' } }] }, { _or: [{ name: { _ilike: '%alias2%' } }, { description: { _ilike: '%alias2%' } }, { aliases: { _contains: 'alias2' } }] }] }
 */
export function createMultiWordSearchCondition(
  searchTerm: string,
  fields: string[],
  options?: { arrayFields?: string[] }
): Record<string, any> {
  // Return empty object if search term is empty or only whitespace
  if (!searchTerm || !searchTerm.trim()) {
    return {};
  }

  // Split by whitespace, trim each word, and filter out empty strings
  const words = searchTerm
    .trim()
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 0);

  // If no valid words after processing, return empty object
  if (words.length === 0) {
    return {};
  }

  const arrayFields = options?.arrayFields || [];

  // Helper function to create condition for a single field and word
  const createFieldCondition = (fieldPath: string, word: string) => {
    const isArrayField = arrayFields.includes(fieldPath);
    const condition = isArrayField 
      ? { _contains: word }  // For array fields, use _contains (exact match)
      : { _ilike: `%${word}%` };  // For regular fields, use _ilike (case-insensitive pattern match)

    // Handle nested fields (dot notation)
    if (fieldPath.includes('.')) {
      return createNestedFieldCondition(fieldPath, condition);
    } else {
      return { [fieldPath]: condition };
    }
  };

  // If only one field, create simple _and conditions for that field
  if (fields.length === 1) {
    const field = fields[0];
    return {
      _and: words.map((word) => createFieldCondition(field, word)),
    };
  }

  // Multiple fields: each word must match in at least one field
  // Create _and array where each element is an _or of all fields matching that word
  return {
    _and: words.map((word) => ({
      _or: fields.map((field) => createFieldCondition(field, word)),
    })),
  };
}

