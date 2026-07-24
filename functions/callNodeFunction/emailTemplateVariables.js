/**
 * Centralized Email Template Variables System
 * 
 * This module provides a single source of truth for all email template variables
 * and consistent replacement logic across all email functions.
 */

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export function escapeHtml(text) {
  if (!text || typeof text !== 'string') {
    return text || '';
  }
  
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Registry of all available email template variables
 * Organized by category for better maintainability
 */
export const EMAIL_VARIABLES = {
  // User-related variables
  USER: {
    '[User:FirstName]': {
      description: 'User\'s first name',
      example: 'John',
      categories: ['enrollment', 'session', 'general']
    },
    '[User:LastName]': {
      description: 'User\'s last name', 
      example: 'Doe',
      categories: ['enrollment', 'session', 'general']
    }
  },

  // Course-related variables
  COURSE: {
    '[Enrollment:CourseId--Course:Name]': {
      description: 'Course title',
      example: 'Introduction to Data Science',
      categories: ['enrollment', 'session']
    },
    '[Course:StartTime]': {
      description: 'Course start date (formatted)',
      example: '15. Januar 2024',
      categories: ['enrollment']
    },
    '[Course:EndTime]': {
      description: 'Course end date (formatted)',
      example: '20. März 2024',
      categories: ['enrollment']
    },
    '[Course:BasePrice]': {
      description: 'Base course price formatted as currency (e.g., "49,00")',
      example: '49,00',
      categories: ['enrollment']
    }
  },

  // Enrollment-related variables
  ENROLLMENT: {
    '[Enrollment:CreatedAt]': {
      description: 'Application/enrollment date (formatted)',
      example: '10. Januar 2024',
      categories: ['enrollment']
    },
    '[Enrollment:ExpirationDate]': {
      description: 'Invitation expiration date (formatted) or "TBD"',
      example: '25. Januar 2024',
      categories: ['enrollment']
    },
    '[Enrollment:CourseLink]': {
      description: 'Link to course page',
      example: 'https://edu.opencampus.sh/course/123',
      categories: ['enrollment', 'session']
    },
    '[Enrollment:CertificateLink]': {
      description: 'Link to the issued certificate (achievement or attendance) or the course page as fallback',
      example: 'https://edu.opencampus.sh/course/123',
      categories: ['enrollment']
    },
    '[Enrollment:Addons]': {
      description: 'HTML list of booked add-ons with prices (empty if no add-ons)',
      example: '<strong>Add-ons:</strong>\n– Networking Dinner: 15,00 € inkl. MwSt.\n– Workshop-Materialien: 10,00 € inkl. MwSt.',
      categories: ['enrollment']
    },
    '[Enrollment:TotalCost]': {
      description: 'Total cost formatted as currency including base price and add-ons (e.g., "74,00")',
      example: '74,00',
      categories: ['enrollment']
    }
  },

  // Session-related variables (for reminders)
  SESSION: {
    '[Session:Title]': {
      description: 'Session title',
      example: 'Introduction to Machine Learning',
      categories: ['session']
    },
    '[Session:StartDateTime]': {
      description: 'Session start date and time (localized)',
      example: '15.1.2024, 14:00:00',
      categories: ['session']
    },
    '[Session:Duration]': {
      description: 'Session duration (calculated)',
      example: '2 hours',
      categories: ['session']
    },
    '[Session:ReminderText]': {
      description: 'Dynamic reminder text based on timing',
      example: 'starts tomorrow',
      categories: ['session']
    },
    '[Session:ReminderTime]': {
      description: 'Dynamic time text based on timing',
      example: 'tomorrow',
      categories: ['session']
    }
  },

  // Project-related variables
  PROJECT: {
    '[Project:Title]': {
      description: 'Project title',
      example: 'Solar-powered water purifier',
      categories: ['project']
    },
    '[Project:Link]': {
      description: 'Link to the project page',
      example: 'https://edu.opencampus.sh/project/123',
      categories: ['project']
    },
    '[Project:ApplicantName]': {
      description: 'Name of the user who requested to join the project (join-request emails only)',
      example: 'Jane Doe',
      categories: ['project']
    }
  },

  // System-related variables
  SYSTEM: {
    '[System:PasswordResetLink]': {
      description: 'Password reset link for user account creation',
      example: 'https://keycloak.example.com/realms/edu-hub/login-actions/reset-credentials?client_id=hasura',
      categories: ['general']
    },
    '[System:PortalUrl]': {
      description: 'Portal URL for user login',
      example: 'https://edu.opencampus.sh',
      categories: ['general']
    }
  }
};

/**
 * Get all available variables for a specific category
 * @param {string} category - Category to filter by ('enrollment', 'session', 'general')
 * @returns {Object} Object with variable keys and their metadata
 */
export function getVariablesByCategory(category) {
  const result = {};
  
  Object.values(EMAIL_VARIABLES).forEach(categoryObj => {
    Object.entries(categoryObj).forEach(([key, metadata]) => {
      if (metadata.categories.includes(category)) {
        result[key] = metadata;
      }
    });
  });
  
  return result;
}

/**
 * Get all variable keys as a flat array
 * @returns {string[]} Array of all variable keys
 */
export function getAllVariableKeys() {
  const keys = [];
  
  Object.values(EMAIL_VARIABLES).forEach(categoryObj => {
    keys.push(...Object.keys(categoryObj));
  });
  
  return keys;
}

/**
 * Validate that a template only uses known variables
 * @param {string} template - Template content to validate
 * @returns {Object} { valid: boolean, unknownVariables: string[] }
 */
export function validateTemplate(template) {
  const knownVariables = getAllVariableKeys();
  const usedVariables = template.match(/\[[\w:-]+\]/g) || [];
  const unknownVariables = usedVariables.filter(variable => 
    !knownVariables.includes(variable)
  );
  
  return {
    valid: unknownVariables.length === 0,
    unknownVariables
  };
}

/**
 * Creates a variable replacement function with standardized date formatting
 * @param {Object} data - Data object containing the values for replacement
 * @param {Function} formatDate - Date formatting function
 * @returns {Function} Function that performs variable replacement
 */
export function createVariableReplacer(data, formatDate) {
  return function replaceVariables(text) {
    if (!text) return text;
    
    let result = text;
    
    // User variables - always attempt replacement
    // Escape user-supplied personal data to prevent XSS
    const firstName = escapeHtml(data.user?.firstName || '');
    const lastName = escapeHtml(data.user?.lastName || '');
    result = result
      .replaceAll('[User:FirstName]', firstName)
      .replaceAll('[User:LastName]', lastName);
    
    // Course variables - always attempt replacement  
    result = result
      .replaceAll('[Enrollment:CourseId--Course:Name]', data.course?.title || '')
      .replaceAll('[Course:StartTime]', data.course?.startTime ? formatDate(data.course.startTime) : 'TBD')
      .replaceAll('[Course:EndTime]', data.course?.endTime ? formatDate(data.course.endTime) : 'TBD');
    
    // Format base price (convert cents to euros with 2 decimal places)
    const basePrice = data.course?.basePrice || 0;
    const formattedBasePrice = (basePrice / 100).toFixed(2).replace('.', ',');
    result = result.replaceAll('[Course:BasePrice]', formattedBasePrice);
    
    // Enrollment variables - always attempt replacement
    result = result
      .replaceAll('[Enrollment:CreatedAt]', data.enrollment?.created_at ? formatDate(data.enrollment.created_at) : '')
      .replaceAll('[Enrollment:ExpirationDate]', 
        data.enrollment?.invitationExpirationDate ? 
          formatDate(data.enrollment.invitationExpirationDate) : 'TBD'
      )
      .replaceAll('[Enrollment:CourseLink]',
        data.courseLink || `${process.env.FRONTEND_URL || 'https://edu.opencampus.sh'}/course/${data.course?.id || ''}`
      )
      .replaceAll('[Enrollment:CertificateLink]',
        data.certificateLink || data.courseLink || `${process.env.FRONTEND_URL || 'https://edu.opencampus.sh'}/course/${data.course?.id || ''}`
      );
    
    // Build addons HTML list (escape user-controlled strings to prevent XSS)
    let addonsHtml = '';
    if (data.enrollmentAddons && Array.isArray(data.enrollmentAddons) && data.enrollmentAddons.length > 0) {
      const currencySymbolMap = { EUR: '€', USD: '$', GBP: '£', CHF: 'CHF' };
      const addonLines = data.enrollmentAddons.map(addon => {
        const description = escapeHtml(addon.CourseAddonMapping?.description || addon.name || 'Zusatzleistung / Add-on');
        const price = addon.priceAtPurchase ?? 0;
        const currencyCode = addon.currency || 'EUR';
        const currencySymbol = currencySymbolMap[currencyCode] || currencyCode;
        const formattedPrice = (price / 100).toFixed(2).replace('.', ',');
        return `– ${description}: ${formattedPrice} ${currencySymbol} inkl. MwSt.`;
      });
      addonsHtml = '<strong>Add-ons:</strong>\n' + addonLines.join('\n');
    }
    result = result.replaceAll('[Enrollment:Addons]', addonsHtml);
    
    // Calculate and format total cost (base price + all addon prices)
    // Reuse basePrice declared above
    const addonsTotal = data.enrollmentAddons && Array.isArray(data.enrollmentAddons)
      ? data.enrollmentAddons.reduce((sum, addon) => sum + (addon.priceAtPurchase || 0), 0)
      : 0;
    const totalCost = basePrice + addonsTotal;
    const formattedTotalCost = (totalCost / 100).toFixed(2).replace('.', ',');
    result = result.replaceAll('[Enrollment:TotalCost]', formattedTotalCost);
    
    // Project variables - always attempt replacement (escape user-controlled strings)
    result = result
      .replaceAll('[Project:Title]', escapeHtml(data.project?.title || ''))
      .replaceAll('[Project:Link]',
        data.projectLink || `${process.env.FRONTEND_URL || 'https://edu.opencampus.sh'}/project/${data.project?.id || ''}`
      )
      .replaceAll('[Project:ApplicantName]', escapeHtml(data.applicantName || ''));

    // Session variables (for reminders) - always attempt replacement
    result = result
      .replaceAll('[Session:Title]', data.session?.title || '')
      .replaceAll('[Session:StartDateTime]', data.session?.startDateTime || '')
      .replaceAll('[Session:Duration]', data.session?.duration || '')
      .replaceAll('[Session:ReminderText]', data.session?.reminderText || '')
      .replaceAll('[Session:ReminderTime]', data.session?.reminderTime || '');
    
    return result;
  };
}

/**
 * Convenience function for enrollment emails
 * @param {Object} enrollmentDetails - Enrollment data from GraphQL (should include CourseEnrollmentAddons with CourseAddonMapping)
 * @param {Function} formatDate - Date formatting function  
 * @returns {Function} Variable replacement function
 */
export function createEnrollmentVariableReplacer(enrollmentDetails, formatDate) {
  return createVariableReplacer({
    user: enrollmentDetails.User,
    course: enrollmentDetails.Course,
    enrollment: enrollmentDetails,
    enrollmentAddons: enrollmentDetails.CourseEnrollmentAddons || [],
    courseLink: `${process.env.FRONTEND_URL || 'https://edu.opencampus.sh'}/course/${enrollmentDetails.Course.id}`,
    certificateLink: enrollmentDetails.certificateLink || null
  }, formatDate);
}

/**
 * Convenience function for session reminder emails
 * @param {Object} session - Session data
 * @param {Object} enrollment - Enrollment data with User info
 * @param {Object} sessionData - Additional session data (duration, reminderText, etc.)
 * @returns {Function} Variable replacement function
 */
export function createSessionVariableReplacer(session, enrollment, sessionData = {}) {
  return createVariableReplacer({
    user: enrollment.User,
    course: session.Course,
    session: {
      title: session.title,
      startDateTime: sessionData.startDateTime,
      duration: sessionData.duration,
      reminderText: sessionData.reminderText,
      reminderTime: sessionData.reminderTime
    },
    courseLink: `${process.env.FRONTEND_URL || 'https://edu.opencampus.sh'}/course/${session.Course.id}`
  });
}

/**
 * Convenience function for project lifecycle emails
 * @param {Object} project - Project data ({ id, title })
 * @param {Object} recipientUser - Recipient user ({ firstName, lastName, email })
 * @param {Object} [extra] - Optional extra values ({ applicantName })
 * @returns {Function} Variable replacement function
 */
export function createProjectVariableReplacer(project, recipientUser, extra = {}) {
  return createVariableReplacer({
    user: recipientUser,
    project,
    projectLink: `${process.env.FRONTEND_URL || 'https://edu.opencampus.sh'}/project/${project?.id || ''}`,
    applicantName: extra.applicantName || ''
  });
}

/**
 * Generate documentation for available variables
 * @param {string} category - Optional category filter
 * @returns {string} Markdown documentation
 */
export function generateVariableDocumentation(category = null) {
  const variables = category ? getVariablesByCategory(category) : getAllVariableKeys();
  const variableList = category ? variables : EMAIL_VARIABLES;
  
  let doc = '# Email Template Variables\n\n';
  
  if (category) {
    doc += `Variables available for **${category}** emails:\n\n`;
    Object.entries(variables).forEach(([key, metadata]) => {
      doc += `- **${key}**: ${metadata.description}\n  - Example: \`${metadata.example}\`\n\n`;
    });
  } else {
    Object.entries(variableList).forEach(([categoryName, categoryVars]) => {
      doc += `## ${categoryName} Variables\n\n`;
      Object.entries(categoryVars).forEach(([key, metadata]) => {
        doc += `- **${key}**: ${metadata.description}\n  - Example: \`${metadata.example}\`\n  - Used in: ${metadata.categories.join(', ')}\n\n`;
      });
    });
  }
  
  return doc;
} 