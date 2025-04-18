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
  // Add other relationships as needed
];

/**
 * Parses a foreign key constraint error and returns a user-friendly message
 */
export const handleForeignKeyError = (error: ApolloError, t: (key: string, options?: any) => string): string => {
  const errorMessage = error.message;
  
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
