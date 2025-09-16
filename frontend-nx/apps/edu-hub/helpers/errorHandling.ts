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
 * Parses database errors and returns user-friendly messages
 */
export const handleDatabaseError = (error: ApolloError, t: (key: string, options?: any) => string): string => {
  // Extract the actual database error message from the GraphQL error structure
  let errorMessage = error.message;
  
  // Check if the error has nested database error information
  if (error.graphQLErrors && error.graphQLErrors.length > 0) {
    const graphQLError = error.graphQLErrors[0];
    if (graphQLError.extensions?.internal?.error?.message) {
      errorMessage = graphQLError.extensions.internal.error.message;
    }
  }
  
  // Handle uniqueness constraint violations
  if (errorMessage.includes('duplicate key value violates unique constraint')) {
    // Handle CourseAddress_pkey constraint specifically
    if (errorMessage.includes('CourseAddress_pkey')) {
      return t('course-page:errors.uniqueness_violation_course_address_pkey');
    }
    
    // Generic uniqueness violation message
    return t('error_handling.uniqueness_violation');
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
 * Translates error messages, handling both direct translation keys and database errors
 */
export const translateErrorMessage = (error: ApolloError, t: (key: string, options?: any) => string): string => {
  // First try to handle as a database error
  const databaseErrorMessage = handleDatabaseError(error, t);
  if (databaseErrorMessage !== t('error_handling.generic_error')) {
    return databaseErrorMessage;
  }
  
  // If not a recognized database error, try to translate the message directly
  try {
    return t(error.message);
  } catch {
    // If translation fails, return the original message
    return error.message;
  }
};

/**
 * Legacy function name for backward compatibility
 * @deprecated Use handleDatabaseError instead
 */
export const handleForeignKeyError = handleDatabaseError;
