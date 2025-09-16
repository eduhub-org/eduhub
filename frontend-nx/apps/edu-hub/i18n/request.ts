import { getRequestConfig } from 'next-intl/server';

// Can be imported from a shared config
const locales = ['en', 'de'];

export default getRequestConfig(async ({ locale }) => {
  // Validate and fallback to default locale if undefined or invalid
  const validLocale = locale && locales.includes(locale) ? locale : 'de';
  
  console.log('i18n request config - received locale:', locale, 'using:', validLocale);

  try {
    // Load translation files with error handling - start with just the essential ones
    console.log('Loading messages for locale:', validLocale);
    
    const commonMessages = (await import(`../locales/${validLocale}/common.json`)).default;
    const startPageMessages = (await import(`../locales/${validLocale}/start-page.json`)).default;
    
    console.log('Common messages loaded:', !!commonMessages, 'keys:', Object.keys(commonMessages || {}).length);
    console.log('Start-page messages loaded:', !!startPageMessages, 'keys:', Object.keys(startPageMessages || {}).length);
    
    const messages = {
      // Load essential translation files first
      common: commonMessages,
      'start-page': startPageMessages,
      course: (await import(`../locales/${validLocale}/course.json`)).default,
      'course-page': (await import(`../locales/${validLocale}/course-page.json`)).default,
      'course-admin-page': (await import(`../locales/${validLocale}/course-admin-page.json`)).default,
      'achievements-page': (await import(`../locales/${validLocale}/achievements-page.json`)).default,
      profile: (await import(`../locales/${validLocale}/profile.json`)).default,
      programs: (await import(`../locales/${validLocale}/programs.json`)).default,
      statistics: (await import(`../locales/${validLocale}/statistics.json`)).default,
      manageAchievementTemplates: (await import(`../locales/${validLocale}/manageAchievementTemplates.json`)).default,
      manageAdminUsers: (await import(`../locales/${validLocale}/manageAdminUsers.json`)).default,
      manageAppSettings: (await import(`../locales/${validLocale}/manageAppSettings.json`)).default,
      manageCourse: (await import(`../locales/${validLocale}/manageCourse.json`)).default,
      manageCourses: (await import(`../locales/${validLocale}/manageCourses.json`)).default,
      manageEmailTemplates: (await import(`../locales/${validLocale}/manageEmailTemplates.json`)).default,
      manageLocationAddresses: (await import(`../locales/${validLocale}/manageLocationAddresses.json`)).default,
      manageOrganizations: (await import(`../locales/${validLocale}/manageOrganizations.json`)).default,
      managePrograms: (await import(`../locales/${validLocale}/managePrograms.json`)).default,
      manageUsers: (await import(`../locales/${validLocale}/manageUsers.json`)).default,
    };

    console.log('i18n messages loaded successfully for locale:', validLocale);
    console.log('Available namespaces:', Object.keys(messages));
    console.log('start-page keys:', Object.keys(messages['start-page'] || {}));
    
    return {
      locale: validLocale,
      messages
    };
  } catch (error) {
    console.error('Error loading translation messages:', error);
    throw error;
  }
});
