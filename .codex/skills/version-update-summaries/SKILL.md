---
name: version-update-summaries
description: Write user-facing EduHub release summaries in plain language. Use when turning release notes or commit history into Slack posts, release announcements, newsletters, or other non-technical update summaries.
---
# Version Update Summaries

Use this skill when the audience is non-technical.

## Goals

- focus on user-visible value
- explain benefits, not implementation details
- keep the summary easy to scan

## Include

- new features
- meaningful workflow improvements
- important UI/UX changes
- major technical upgrades when users should know about them

## Exclude By Default

- commit hashes
- low-level refactors
- internal tooling changes
- bug fixes that have no meaningful user-facing effect

## Slack-Friendly Style

- use short sections
- use bold section headers
- prefer concise bullets
- group related changes by feature area

## How To Gather Material

Start from:

1. the release page or generated release notes
2. commits between versions
3. feature commits first
4. major technical upgrades that deserve plain-language explanation

## Writing Rule

Translate technical work into user impact:

- not "migrated to next-intl"
- instead "modernized the translation system to improve maintainability and reduce translation issues over time"

## Output Style For This Skill

When asked for a release summary:

1. open with one short overview paragraph
2. group changes by user-facing area
3. keep each bullet benefit-oriented
4. end with any important expectation-setting note if a major technical change may surface minor issues
