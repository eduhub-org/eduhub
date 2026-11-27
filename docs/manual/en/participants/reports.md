---
title: Reporting bugs and suggesting ideas
slug: participants/reports
audience: [participant, organizer, admin]
order: 40
language: en
summary: How to report a bug or suggest an idea for EduHub through the Assistant, join an existing report, see what became of it, and how admins handle reports.
---

If something on EduHub doesn't work as expected, or you have an idea for something new or better, tell the **Assistant**. It turns what you describe into a report for the EduHub team. Reports are only about the platform itself. For anything about a course, such as missing slides or a problem with a Session, contact the course's Organizers.

## Sending a report

1. Open the Assistant and describe the problem or idea in your own words, ideally on the page where it happened. The page goes along with your question.
2. The Assistant first checks whether it already works and, if so, explains how. If needed, it asks one or two short questions, for example what you expected to happen.
3. It then shows a card with the type (**Bug** or **Idea**), a title and a description. Nothing is sent yet. Click **Send** to send it, or **Discard** if you don't want to. To change the text, tell the Assistant what to change and it drafts a new card.

You can send up to 5 reports a day.

## Joining an existing report

If someone has already reported the same thing, the Assistant shows a card **Existing report** with a short summary in its own words instead of a new report. Click **Join** to add your voice: the more people are affected, the higher the team can prioritise it. You never see other people's reports themselves.

When the team accepts a report, it publishes it as an issue in EduHub's public code repository on GitHub, so developers can work on it. An admin checks the text first, and the issue never contains your name.

## What became of your reports

Ask the Assistant "What happened to my reports?" any time. It lists the reports you sent or joined, with their status (new, planned, in progress, done, declined or duplicate) and the EduHub team's note, if there is one.

As long as a report you sent still has the status new and nobody else has joined it, you can ask the Assistant to withdraw it; it shows a card with **Withdraw**.

## Feedback on the Assistant's answers

Under each answer you can rate it with thumbs up or down. With thumbs down you can also write what wasn't helpful. Your comment is kept for 30 days without your name, whether or not you agree to the conversation being kept. Both help the team improve the Assistant and this manual.

## For admins: the Reports page

Admins find all reports under **Reports** in the user menu. Each Monday a summary of the week is written there in English: the new and open reports grouped by topic, likely duplicates, suggested priorities and recurring problems with the Assistant's answers. A **Production errors** section groups the errors the platform's services logged that week and marks each group as a likely bug, a configuration problem (such as a missing or expired token), a capacity problem, a failing external service or noise, with a suggested next step. The summary is also written in weeks with errors but no reports. Earlier weeks can be picked under **Week**.

Below it, the table shows the open reports by default; filter by **Type** and **Status**. For each report you set the **Status** and **Priority**. Open a report to see its description, the page and role it was sent from and who sent it, and to:

- **Mark as duplicate of** another report. The people affected count towards the original.
- Write a **Public note**, which everyone who sent or joined the report sees when they ask the Assistant, for example why it was declined.

Who sent or joined a report is removed 6 months after the report was closed (done, declined or duplicate).

### Accepting a report: the GitHub issue

When the GitHub connection is set up, accepting a report creates its issue on GitHub:

1. Set the status to **Planned** or **In progress**, or open the report and click **Create or link issue**.
2. In the dialog, choose **Create a new issue** and check the title and description. The issue is public, so remove names, emails and other personal details. A footer with the report number, priority and the number of people affected is added below and kept up to date. Alternatively, choose **Link an existing issue** and enter the number of an issue the team already has.
3. Click **Create issue** or **Link issue**. Only then does the status change; **Cancel** leaves the report as it was.

New issues get the labels `bug` or `feature` and `from-assistant`, and go on the project board in the column that matches the status.

From then on, GitHub drives the status:

- Closing the issue as completed sets the report to **Done**; closing it as not planned sets **Declined**; closing it as a duplicate sets **Duplicate** (linked to the original report if that issue has one).
- Reopening the issue sets the report back to **Planned**, and moving the card to **In Progress** on the board sets **In progress**.
- If the issue is deleted or moved to another repository, the report loses its link and keeps its last status.

You can still change the status here: the issue is closed, reopened or moved to match. A report with an issue can't go back to **New**, and an issue belongs to one report only; mark further reports about the same thing as duplicates.
