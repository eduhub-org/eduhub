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
/**
 * German date (dd.mm.yyyy) for a submission deadline, or '' when there is none.
 * Deadlines are date-only, so the date part is read verbatim instead of going
 * through a Date (which would shift the day across time zones).
 */
export function formatSubmissionDeadlineForEmail(value) {
  if (value == null) return '';
  const iso = String(value).trim();
  // The whole value has to be a date, optionally followed by a time — anchoring
  // only the start would let a malformed value through as a plausible date.
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ][^\s]*)?$/.exec(iso);
  if (!match) return '';
  const [, year, month, day] = match;
  // Reject impossible calendar dates (2026-02-31, 2026-13-01), which a Date
  // would silently roll forward — same guard as submissionDeadlineToCalendarDate
  // in the app. The variable must expand to nothing rather than invent a day.
  const y = Number(year);
  const m = Number(month) - 1;
  const d = Number(day);
  const probe = new Date(Date.UTC(y, m, d));
  if (
    probe.getUTCFullYear() !== y ||
    probe.getUTCMonth() !== m ||
    probe.getUTCDate() !== d
  ) {
    return '';
  }
  return `${day}.${month}.${year}`;
}

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
    '[Session:EndDateTime]': {
      description: 'Session end date and time (localized); time only when it ends on the start day',
      example: '16:00',
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
    '[Project:ReviewComment]': {
      description: 'The comment the instructor left when reviewing the project, as a labelled paragraph; empty when no comment was left',
      example: '<p><strong>Kommentar der Kursleitung / Instructor comment:</strong><br>Bitte die Quellen ergänzen.</p>',
      categories: ['project']
    },
    '[Project:SubmissionDeadline]': {
      description: 'The project\'s effective submission deadline, as a labelled paragraph; empty when no deadline is set',
      example: '<p><strong>Abgabefrist / Submission deadline:</strong> 04.09.2026</p>',
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
  },

  // StuJo job board variables.
  //
  // Documentation and discoverability only: the job board mails do NOT go
  // through createVariableReplacer below. They are substituted by their own
  // replacers, which must stay in step with this list --
  //   frontend-nx/apps/edu-hub/lib/stripeJobPosting.ts  (buildMailVars)
  //   functions/callNodeFunction/publishJobPosting/index.js  (buildJobPostingMailVars)
  // whose key sets are asserted identical by a test. Unifying the three is a
  // separate piece of work; until then, adding a variable means adding it in
  // both replacers as well as here.
  JOB_POSTING: {
    '[JobPosting:Title]': { description: 'Job posting title', example: 'Werkstudent:in Frontend', categories: ['jobposting'] },
    '[JobPosting:Type]': { description: 'Posting category, as a display label rather than the raw enum', example: 'Studentenjob', categories: ['jobposting'] },
    '[JobPosting:PublishedAt]': { description: 'Date the posting went live', example: '29. August 2026', categories: ['jobposting'] },
    '[JobPosting:ExpiresAt]': { description: 'Date the posting comes off the board', example: '24. Oktober 2026', categories: ['jobposting'] },
    '[JobPosting:Payment]': { description: 'How the posting was paid for', example: '59,50 \u20ac (bezahlt)', categories: ['jobposting'] },
    '[JobPosting:DashboardUrl]': { description: 'Employer dashboard link', example: 'https://stujo.net/mein-stujo', categories: ['jobposting'] },
    '[JobPosting:RepostUrl]': { description: 'Link that republishes an expired posting', example: 'https://stujo.net/mein-stujo?repost=1', categories: ['jobposting'] },
    '[JobPosting:AdminUrl]': { description: 'Admin moderation link', example: 'https://edu.opencampus.sh/manage/settings/jobboerse', categories: ['jobposting'] },
    '[JobPosting:TermsAcceptedAt]': { description: 'When the employer accepted the terms; empty if never recorded', example: '29. August 2026', categories: ['jobposting'] },
    // Also used by the organization-claim mails below, which DO go through
    // createVariableReplacer -- hence the second category.
    '[Organization:Name]': { description: 'Employer organisation name', example: 'Beispiel GmbH', categories: ['jobposting', 'organizationclaim'] }
  },

  // Invoice variables. Empty on free and credit-funded postings, which have no
  // Invoice row -- the [#if:Invoice] block is dropped for those.
  INVOICE: {
    '[Invoice:Number]': { description: 'Number printed on the Stripe invoice document, falling back to our record key while Stripe has not finalized it', example: 'VGD1VIPO-0001', categories: ['jobposting'] },
    '[Invoice:Date]': { description: 'Invoice date', example: '29. August 2026', categories: ['jobposting'] },
    '[Invoice:NetTotal]': { description: 'Net amount', example: '50,00 \u20ac', categories: ['jobposting'] },
    '[Invoice:VatRate]': { description: 'VAT percentage, derived from the amounts', example: '19', categories: ['jobposting'] },
    '[Invoice:VatTotal]': { description: 'VAT amount', example: '9,50 \u20ac', categories: ['jobposting'] },
    '[Invoice:GrossTotal]': { description: 'Gross amount', example: '59,50 \u20ac', categories: ['jobposting'] },
    '[Invoice:HostedUrl]': { description: 'Stripe hosted invoice page', example: 'https://invoice.stripe.com/i/example', categories: ['jobposting'] },
    '[Invoice:PaymentStatus]': { description: 'Whether the invoice is settled', example: 'bezahlt', categories: ['jobposting'] }
  },

  LEGAL: {
    '[Legal:TermsUrl]': { description: 'Terms and conditions URL used in the mail footer', example: 'https://www.stujo.net/agb', categories: ['jobposting'] }
  },

  // StuJo self-service organization claim. Unlike the job board mails above,
  // these are queued through lib/queueEmail.js and substituted by
  // createVariableReplacer, so every key here has a branch in it.
  ORGANIZATION_CLAIM: {
    '[OrganizationClaim:UserName]': { description: 'Name of the person who claimed the organization, or who is asking for access', example: 'Alex Beispiel', categories: ['organizationclaim'] },
    '[OrganizationClaim:UserEmail]': { description: 'Their email address, so the recipient can reply to them directly', example: 'alex@beispiel.de', categories: ['organizationclaim'] },
    '[OrganizationClaim:Verification]': { description: 'How the claim was verified, as a readable sentence rather than the raw enum', example: 'E-Mail-Domain stimmt mit der Website überein', categories: ['organizationclaim'] },
    '[OrganizationClaim:AdminUrl]': { description: 'Link to the admin screen where the grant can be reviewed or revoked', example: 'https://edu.opencampus.sh/manage/settings/access', categories: ['organizationclaim'] },
    '[OrganizationClaim:ContactEmail]': { description: 'The address responsible for StuJo enquiries, for the recipient to write to', example: 'stujo@opencampus.sh', categories: ['organizationclaim'] }
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
 * @returns {Function} Function that performs variable replacement. Accepts an
 *   options object as second argument: pass `{ html: false }` for plain-text
 *   targets such as the mail subject, where HTML entities would show up
 *   literally instead of being rendered.
 */
export function createVariableReplacer(data, formatDate) {
  return function replaceVariables(text, options = {}) {
    if (!text) return text;
    
    // Subjects are plain text: escaping there would render "&amp;" literally.
    const isHtml = options.html !== false;
    const escape = isHtml ? escapeHtml : (value) => (value == null ? '' : String(value));
    
    let result = text;
    
    // User variables - always attempt replacement
    // Escape user-supplied personal data to prevent XSS
    const firstName = escape(data.user?.firstName || '');
    const lastName = escape(data.user?.lastName || '');
    result = result
      .replaceAll('[User:FirstName]', firstName)
      .replaceAll('[User:LastName]', lastName);
    
    // Course variables - always attempt replacement  
    result = result
      .replaceAll('[Enrollment:CourseId--Course:Name]', escape(data.course?.title || ''))
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
        const description = escape(addon.CourseAddonMapping?.description || addon.name || 'Zusatzleistung / Add-on');
        const price = addon.priceAtPurchase ?? 0;
        const currencyCode = addon.currency || 'EUR';
        const currencySymbol = currencySymbolMap[currencyCode] || currencyCode;
        const formattedPrice = (price / 100).toFixed(2).replace('.', ',');
        return `– ${description}: ${formattedPrice} ${currencySymbol} inkl. MwSt.`;
      });
      addonsHtml = (isHtml ? '<strong>Add-ons:</strong>\n' : 'Add-ons:\n') + addonLines.join('\n');
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
    
    // Review feedback: a labelled block when the instructor left a comment,
    // nothing at all otherwise, so templates never show an empty heading.
    // The label carries both languages because a template body holds both.
    const reviewComment = (data.project?.ratingComment || '').trim();
    let reviewCommentBlock = '';
    if (reviewComment) {
      reviewCommentBlock = isHtml
        ? `<p><strong>Kommentar der Kursleitung / Instructor comment:</strong><br>${escapeHtml(reviewComment).replaceAll('\n', '<br>')}</p>`
        : reviewComment.replace(/\s+/g, ' ');
    }

    // Submission deadline: a labelled block when a deadline resolves, nothing at
    // all otherwise — same reasoning as the review comment above, so a template
    // never shows a dangling "Abgabefrist:" line. Date-only, like the field.
    const deadlineDate = formatSubmissionDeadlineForEmail(data.project?.submissionDeadline);
    let submissionDeadlineBlock = '';
    if (deadlineDate) {
      submissionDeadlineBlock = isHtml
        ? `<p><strong>Abgabefrist / Submission deadline:</strong> ${deadlineDate}</p>`
        : `Abgabefrist / Submission deadline: ${deadlineDate}`;
    }

    // Project variables - always attempt replacement (escape user-controlled strings)
    // ReviewComment is substituted last: it carries instructor-authored text,
    // which must not be rescanned for the placeholders replaced above.
    result = result
      .replaceAll('[Project:Title]', escape(data.project?.title || ''))
      .replaceAll('[Project:Link]',
        data.projectLink || `${process.env.FRONTEND_URL || 'https://edu.opencampus.sh'}/project/${data.project?.id || ''}`
      )
      .replaceAll('[Project:ApplicantName]', escape(data.applicantName || ''))
      .replaceAll('[Project:SubmissionDeadline]', submissionDeadlineBlock)
      .replaceAll('[Project:ReviewComment]', reviewCommentBlock);

    // Organization variables. [Organization:Name] is shared with the job board
    // mails, which substitute it in their own replacers; this branch serves the
    // organization-claim mails, which go through queueEmail.
    result = result.replaceAll('[Organization:Name]', escape(data.organization?.name || ''));

    // Organization-claim variables. The claimer's name and address are
    // user-supplied, so they are escaped like any other personal data.
    result = result
      .replaceAll('[OrganizationClaim:UserName]', escape(data.organizationClaim?.userName || ''))
      .replaceAll('[OrganizationClaim:UserEmail]', escape(data.organizationClaim?.userEmail || ''))
      .replaceAll('[OrganizationClaim:Verification]', escape(data.organizationClaim?.verification || ''))
      .replaceAll('[OrganizationClaim:AdminUrl]', data.organizationClaim?.adminUrl || '')
      .replaceAll('[OrganizationClaim:ContactEmail]', escape(data.organizationClaim?.contactEmail || ''));

    // Session variables (for reminders) - always attempt replacement
    result = result
      .replaceAll('[Session:Title]', escape(data.session?.title || ''))
      .replaceAll('[Session:StartDateTime]', data.session?.startDateTime || '')
      .replaceAll('[Session:EndDateTime]', data.session?.endDateTime || '')
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
 * Convenience function for the StuJo organization-claim emails
 * @param {Object} organization - Organization data ({ name })
 * @param {Object} claim - Claim data ({ userName, userEmail, verification, adminUrl, contactEmail })
 * @returns {Function} Variable replacement function
 */
export function createOrganizationClaimVariableReplacer(organization, claim) {
  return createVariableReplacer({
    organization,
    organizationClaim: claim,
  });
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