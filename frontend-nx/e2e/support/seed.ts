/**
 * Anchors from `backend/seeds/default/initial_seeds.sql`, applied by the Hasura
 * dev container's entrypoint the first time the `User` table comes up empty.
 *
 * Deliberately a published course with a fixed `applicationEnd` in the past:
 * nothing about it depends on today's date, unlike the semester-filtered tiles
 * on the start page.
 */
export const seededPublishedCourse = {
  id: 4,
  title: 'Present Course 1',
} as const;
