import { Course_Course_by_pk } from '../queries/__generated__/Course';
import { CourseWithEnrollment_Course_by_pk } from '../queries/__generated__/CourseWithEnrollment';

export const prioritizeClasses = (classString: string): string => {
  const classes = classString.split(' ');
  const mbClasses = classes.filter(className => className.startsWith('mb-'));
  const lastMbClass = mbClasses[mbClasses.length - 1];
  const nonMbClasses = classes.filter(className => !className.startsWith('mb-'));
  return [...nonMbClasses, lastMbClass].join(' ');
}

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


export const isLinkFormat = (str) => {
  const pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name and extension
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
    '(\\:\\d+)?' + // port
    '(\\/[-a-z\\d%@_.~+&:]*)*' + // path
    '(\\?[;&a-z\\d%@_.,~+&:=-]*)?' + // query string
    '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
  return pattern.test(str);
};

export const isECTSFormat = (str) => {
  return str.match(/^(2,5|5|12,5|NONE)$/);
};
