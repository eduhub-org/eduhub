/**
 * Helper function to load translation messages for a given locale
 * This ensures all pages have access to common translations and prevents MISSING_MESSAGE errors
 */
export const loadMessages = async (locale: string = 'de') => {
  try {
    const messages = {
      // Always load common messages as they're used by hooks like useErrorHandler
      common: (await import(`../locales/${locale}/common.json`)).default,
      'start-page': (await import(`../locales/${locale}/start-page.json`)).default,
      course: (await import(`../locales/${locale}/course.json`)).default,
      'course-page': (await import(`../locales/${locale}/course-page.json`)).default,
      'course-admin-page': (await import(`../locales/${locale}/course-admin-page.json`)).default,
      'achievements-page': (await import(`../locales/${locale}/achievements-page.json`)).default,
      statistics: (await import(`../locales/${locale}/statistics.json`)).default,
      'manageAchievementTemplates': (await import(`../locales/${locale}/manageAchievementTemplates.json`)).default,
      'manageAdminUsers': (await import(`../locales/${locale}/manageAdminUsers.json`)).default,
      'manageAppSettings': (await import(`../locales/${locale}/manageAppSettings.json`)).default,
      'manageCourse': (await import(`../locales/${locale}/manageCourse.json`)).default,
      'manageCourses': (await import(`../locales/${locale}/manageCourses.json`)).default,
      'managePrograms': (await import(`../locales/${locale}/managePrograms.json`)).default,
      'manageUsers': (await import(`../locales/${locale}/manageUsers.json`)).default,
      'manageOrganizations': (await import(`../locales/${locale}/manageOrganizations.json`)).default,
      'manageLocationAddresses': (await import(`../locales/${locale}/manageLocationAddresses.json`)).default,
      'manageEmailTemplates': (await import(`../locales/${locale}/manageEmailTemplates.json`)).default,
      profile: (await import(`../locales/${locale}/profile.json`)).default,
      programs: (await import(`../locales/${locale}/programs.json`)).default,
    };

    return messages;
  } catch (error) {
    console.error(`Failed to load messages for locale ${locale}:`, error);
    // Return empty messages object to prevent crashes
    return {};
  }
};

/**
 * Helper function to load minimal messages (just common) for pages that don't need all translations
 */
export const loadCommonMessages = async (locale: string = 'de') => {
  try {
    const messages = {
      common: (await import(`../locales/${locale}/common.json`)).default,
    };

    return messages;
  } catch (error) {
    console.error(`Failed to load common messages for locale ${locale}:`, error);
    return {};
  }
};
