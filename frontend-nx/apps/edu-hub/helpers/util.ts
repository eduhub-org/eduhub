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
