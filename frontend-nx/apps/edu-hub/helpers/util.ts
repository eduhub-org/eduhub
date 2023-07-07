import { Course_Course_by_pk } from '../queries/__generated__/Course';
import { CourseWithEnrollment_Course_by_pk } from '../queries/__generated__/CourseWithEnrollment';

export const makeFullName = (firstName: string, lastName: string): string => {
  return `${firstName} ${lastName}`;
};

export const formattedDate = (date: Date) => {
  const y = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(date);
  const m = new Intl.DateTimeFormat('en', { month: '2-digit' }).format(date);
  const day = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(date);
  return [day, m, y].join('.');
};

export const formattedDateWithTime = (date: Date, language = 'de') => {
  const at = language === 'en' ? 'at' : 'um';
  const y = new Intl.DateTimeFormat(language, { year: 'numeric' }).format(date);
  const m = new Intl.DateTimeFormat(language, { month: '2-digit' }).format(
    date
  );
  const day = new Intl.DateTimeFormat(language, { day: '2-digit' }).format(
    date
  );

  const hour = new Intl.DateTimeFormat(language, { hour: '2-digit' }).format(
    date
  );
  const minute = new Intl.DateTimeFormat(language, {
    minute: '2-digit',
  }).format(date);

  return `${[day, m, y].join('.')} ${at} ${hour.replace(
    ' ',
    ':' + minute + ' '
  )}`;
};

export const downloadCSVFileFromBase64String = (base64File: string) => {
  // decode the base-64 string
  const csvContent = Buffer.from(base64File, 'base64');

  // Creating a Blob for having a csv file format
  // and passing the data with type

  const blob = new Blob([csvContent], { type: 'text/csv' });

  // Creating an object for downloading url
  const url = window.URL.createObjectURL(blob);

  // Creating an anchor(a) tag of HTML
  const a = document.createElement('a');

  // Passing the blob downloading url
  a.setAttribute('href', url);

  // Setting the anchor tag attribute for downloading
  // and passing the download file name
  a.setAttribute('download', 'template.csv');

  // Performing a download with click
  a.click();
};

export const isDateExpired = (givenDate: Date) => {
  return givenDate.getTime() - new Date().getTime() <= 0;
};

export const getCourseEnrollment = (
  course: Course_Course_by_pk | CourseWithEnrollment_Course_by_pk,
  userId: string
) => {
  // if the type is Course_Course_by_pk return the same value as if the type was CourseWithEnrollment_Course_by_pk and no enrollment was found
  if (!course || !('CourseEnrollments' in course)) {
    return null;
  }
  return course.CourseEnrollments.find(
    (enrollment) => enrollment.userId === userId
  );
};
