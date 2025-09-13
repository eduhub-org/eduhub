import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';

// Can be imported from a shared config
const locales = ['en', 'de'];

export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound();

  return {
    messages: {
      // Load all translation files for the locale
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
    }
  };
});
