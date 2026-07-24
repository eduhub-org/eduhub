import { ApolloError } from '@apollo/client';

interface TableRelationship {
  parentTable: string;
  childTable: string;
  constraintName: string;
  userFriendlyNameKey?: string;
}

// Map of known relationships in your database
const knownRelationships: TableRelationship[] = [
  {
    parentTable: 'Course',
    childTable: 'CourseEnrollment',
    constraintName: 'CourseEnrollment_courseId_fkey',
    userFriendlyNameKey: 'error_handling.entities.course_enrollments'
  },
  {
    parentTable: 'Course',
    childTable: 'CourseGroup',
    constraintName: 'CourseGroup_courseId_fkey',
    userFriendlyNameKey: 'error_handling.entities.course_groups'
  },
  {
    parentTable: 'Course',
    childTable: 'CourseDegree',
    constraintName: 'CourseDegree_courseId_fkey',
    userFriendlyNameKey: 'error_handling.entities.course_degrees'
  },
  {
    parentTable: 'Course',
    childTable: 'AchievementOptionCourse',
    constraintName: 'AchievementOptionCourse_courseId_fkey',
    userFriendlyNameKey: 'error_handling.entities.achievement_options'
  },
  {
    parentTable: 'Program',
    childTable: 'Course',
    constraintName: 'Course_programId_fkey',
    userFriendlyNameKey: 'error_handling.entities.courses'
  },
  {
    parentTable: 'Organization',
    childTable: 'User',
    constraintName: 'User_organizationId_fkey',
    userFriendlyNameKey: 'error_handling.entities.users'
  },
  {
    parentTable: 'LocationAddress',
    childTable: 'SessionAddress',
    constraintName: 'SessionAddress_locationAddressId_fkey',
    userFriendlyNameKey: 'error_handling.entities.session_addresses'
  },
  // Add other relationships as needed
];

/**
 * Parses a foreign key constraint error and returns a user-friendly message
 */
export const handleForeignKeyError = (error: ApolloError, t: (key: string, options?: any) => string): string => {
  // Extract the actual database error message from the GraphQL error structure
  let errorMessage = error.message;
  
  // Check if the error has nested database error information
  if (error.graphQLErrors && error.graphQLErrors.length > 0) {
    const graphQLError = error.graphQLErrors[0];
    if (graphQLError.extensions?.internal?.error?.message) {
      errorMessage = graphQLError.extensions.internal.error.message;
    }
  }
  
  // Custom trigger guard: an organization must always keep at least one settings admin. The DB
  // raises "Cannot remove the last settings admin of organization <id>" (see the OrganizationAdmin
  // trigger migration). Map it to a friendly message rather than the generic fallback.
  if (errorMessage.includes('last settings admin')) {
    return t('error_handling.last_settings_admin');
  }

  // Check for specific database constraint error messages
  if (errorMessage.includes('Cannot delete') && errorMessage.includes('because it is referenced by')) {
    // Handle specific constraint error messages like:
    // "Cannot delete LocationAddress (ID: 15) because it is referenced by 1 SessionAddress record(s)."
    const locationAddressMatch = errorMessage.match(/Cannot delete LocationAddress.*because it is referenced by (\d+) SessionAddress record\(s\)/);
    if (locationAddressMatch) {
      return t('error_handling.delete_restricted_by_relationship', {
        parent: t('error_handling.entities.locationaddress'),
        child: t('error_handling.entities.session_addresses')
      });
    }
  }
  
  // Check if it's a foreign key violation
  if (errorMessage.includes('Foreign key violation') || errorMessage.includes('violates foreign key constraint')) {
    // Extract constraint name using regex
    const constraintMatch = errorMessage.match(/constraint "([^"]+)"/);
    const tableMatch = errorMessage.match(/table "([^"]+)"/);
    
    if (constraintMatch && tableMatch) {
      const constraintName = constraintMatch[1];
      const tableName = tableMatch[1];
      
      // Find the matching relationship
      const relationship = knownRelationships.find(r => 
        r.constraintName === constraintName || 
        (r.parentTable === tableName && errorMessage.includes(r.childTable))
      );
      
      if (relationship) {
        return t('error_handling.delete_restricted_by_relationship', {
          parent: t(`error_handling.entities.${relationship.parentTable.toLowerCase()}`),
          child: relationship.userFriendlyNameKey ? t(relationship.userFriendlyNameKey) : 
                 t(`error_handling.entities.${relationship.childTable.toLowerCase()}`)
        });
      }
      
      // Generic message if relationship details unknown but it's a constraint error
      return t('error_handling.delete_restricted_by_relationships', {
        table: t(`error_handling.entities.${tableName.toLowerCase()}`)
      });
    }
  }
  
  // Return a generic error message for other error types
  return t('error_handling.generic_error');
};

/**
 * Normalizes an error message key by replacing dots with underscores
 * This is needed because next-intl doesn't allow dots in translation keys
 */
export const normalizeErrorKey = (errorMessage: string): string => {
  return errorMessage.replace(/\./g, '_');
};

/**
 * Translates an error message, normalizing the key first if needed
 * This handles error messages that may contain dots which are not allowed in translation keys
 */
export const translateErrorMessage = (errorMessage: string, t: (key: string, options?: any) => string): string => {
  const normalizedKey = normalizeErrorKey(errorMessage);
  // Try the normalized key first, fall back to the original message if not found
  const translated = t(normalizedKey);
  // If translation returns the key itself (meaning it wasn't found), try the original message
  if (translated === normalizedKey && normalizedKey !== errorMessage) {
    return t(errorMessage) || errorMessage;
  }
  return translated;
};
