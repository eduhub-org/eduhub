/**
 * Utility functions for normalizing and filtering aliases during merge operations
 */

/**
 * Normalizes an alias value to a string, handling both string and object formats
 */
export function normalizeAlias(alias: any): string | null {
  if (alias == null) {
    return null;
  }
  if (typeof alias === 'string') {
    return alias;
  }
  if (typeof alias === 'object' && alias !== null && 'name' in alias) {
    return alias.name;
  }
  return null;
}

/**
 * Extracts and normalizes all aliases from an entity's aliases array
 */
export function extractAliases(aliases: any[] | null | undefined): string[] {
  if (!Array.isArray(aliases)) {
    return [];
  }

  const normalized: string[] = [];
  for (const alias of aliases) {
    const normalizedAlias = normalizeAlias(alias);
    if (normalizedAlias != null) {
      normalized.push(normalizedAlias);
    }
  }
  return normalized;
}

/**
 * Builds a set of existing aliases from entities that are NOT being merged
 * This is used to detect conflicts before merging
 */
export function buildExistingAliasesSet<T extends { id: number; aliases?: any[] | null }>(
  allEntities: T[],
  entityIdsBeingMerged: Set<number>
): Set<string> {
  const existingAliases = new Set<string>();

  for (const entity of allEntities) {
    if (!entityIdsBeingMerged.has(entity.id) && Array.isArray(entity.aliases)) {
      const aliases = extractAliases(entity.aliases);
      for (const alias of aliases) {
        existingAliases.add(alias);
      }
    }
  }

  return existingAliases;
}

/**
 * Normalizes and filters aliases from an entity, excluding conflicts with existing aliases
 */
export function normalizeAndFilterAliases<T extends { aliases?: any[] | null }>(
  entity: T,
  existingAliases: Set<string>,
  additionalAliases: string[] = []
): string[] {
  const normalized: string[] = [];

  // Extract and filter entity aliases
  const entityAliases = extractAliases(entity.aliases);
  for (const alias of entityAliases) {
    if (!existingAliases.has(alias)) {
      normalized.push(alias);
    }
  }

  // Add additional aliases (e.g., organization name, address shortLabel) if they don't conflict
  for (const alias of additionalAliases) {
    if (alias && !existingAliases.has(alias)) {
      normalized.push(alias);
    }
  }

  return normalized;
}

/**
 * Combines aliases from multiple sources, normalizing and filtering conflicts
 */
export function combineAliases(
  targetAliases: string[],
  sourceAliases: string[],
  existingAliases: Set<string>
): string[] {
  // Filter both sets against existing aliases
  const filteredTarget = targetAliases.filter((alias) => !existingAliases.has(alias));
  const filteredSource = sourceAliases.filter((alias) => !existingAliases.has(alias));

  // Combine and remove duplicates
  return Array.from(new Set([...filteredTarget, ...filteredSource]));
}

