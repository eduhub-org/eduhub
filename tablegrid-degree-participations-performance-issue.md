# Degree Participations TableGrid sorting and performance issues

**Describe the bug**

The Degree Participations view in the Next.js web app has several TableGrid-related usability and performance issues on larger datasets.

On `manage > course > degrees > view > degree participations`, users need to identify participants who qualify for certificate generation, especially participants with at least `12.5` ECTS and at least one attended event. Sorting by total ECTS is available, but sorting by attended events is currently missing.

Sorting also appears to apply only to the currently rendered rows, for example the first visible batch, instead of the complete dataset. Search already considers the complete dataset, so sorting should behave consistently.

The page also loads too much data too early, shows confusing loading or error states during normal loading, and has table layout issues caused by wide columns and dense participation details.

**To Reproduce**

Steps to reproduce the behavior:

1. Go to `manage > course > degrees > view`.
2. Open a degree with many participant records.
3. Open the `degree participations` tab.
4. Try to sort participants by total ECTS.
5. Try to sort participants by attended events.
6. Scroll through the table or use a dataset with more rows than the initial visible page.
7. Observe the loading states and table layout while data is loading.

**Expected behavior**

- Users can sort Degree Participations by attended events in ascending and descending order.
- Sorting by attended events and total ECTS applies to the full dataset, not only the currently visible or initially rendered rows.
- Search continues to work across the full dataset.
- Opening the first tab, which only shows the description, does not trigger the expensive Degree Participations data load.
- Degree Participations data loading starts when the user opens the `degree participations` tab.
- The initial Degree Participations view becomes usable before all participant rows are rendered.
- Loading states show a central spinner and clear loading copy.
- Temporary loading states do not show misleading messages such as `Course 158 not found`.
- Missing-course errors are shown only when the course is actually known to be missing.
- The `Participations` and `Attended Events` columns are easier to scan and do not force excessive horizontal table width.

**Acceptance criteria**

- Attended-event sorting is available for Degree Participations.
- Sorting is performed on the complete dataset.
- Lazy loading or staged rendering prevents the page from blocking on all participant rows before becoming usable.
- Loading starts only when the Degree Participations tab is opened.
- Missing-course states during loading are no longer misleading.
- Table width and participation formatting are improved enough that the page remains readable on normal desktop widths.
- Development seed data supports testing with approximately 300 users.
