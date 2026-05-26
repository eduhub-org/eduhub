Write a user-facing release summary after an EduHub production deployment.

## Audience

Non-technical: students, instructors, program managers. No commit hashes, no
internal refactor details, no developer jargon.

## Gather material

```bash
# Features in this release
git log v<PREV>..v<CURR> --pretty=format:"%h %s" --grep="^feat" --no-merges

# Breaking changes
git log v<PREV>..v<CURR> --pretty=format:"%h|%s|%b" --no-merges | grep -i BREAKING

# Major technical upgrades worth surfacing
git log v<PREV>..v<CURR> --pretty=format:"%h %s" \
  --grep="^chore.*upgrade\|^refactor.*migrate" --no-merges
```

Cross-check the GitHub release page for the same tag.

## Include

- New features users can act on.
- UI/UX improvements that change how users interact.
- Workflow enhancements (bulk actions, better filtering, new pages).
- Major technical upgrades framed as user benefit (in a dedicated section).
- Important user-impacting bug fixes (rare — most fixes don't need a mention).

## Exclude

- Commit hashes, branch names.
- Internal refactors, code cleanup.
- CI/tooling changes.
- Developer-facing API changes that don't affect operator workflows.
- Most bug fixes.

## Structure

```
*[Product] Version [X.Y.Z] — What's New*

*Released:* [Date]

[One-paragraph overview]

*[Emoji] [Feature Area 1]*

• *Feature name:* short user-benefit description.
• *Feature name:* short user-benefit description.

*[Emoji] [Feature Area 2]*

• *Feature name:* short user-benefit description.

*🔧 Technical Improvements*

• *Upgrade:* plain-language description of what changed and why it matters.

[Disclaimer paragraph if a major change might surface minor issues.]

[Closing line.]
```

## Slack formatting

- Bold with single asterisks `*text*` (Slack does not support `**text**`).
- Section headers as bold lines, no `#` syntax.
- Bullets with `•`, not `-`.
- Skip horizontal rules (`---`) — Slack renders them poorly.
- Keep paragraphs to 2-3 sentences.

Common emojis: 🎓 Education/Certificates · 📧 Email · 📍 Location/Addresses ·
📊 Analytics · 🎯 Course Management · 💬 Content/FAQ · 🌐 UX · 🔧 Technical.

## Technical Improvements section

Always include this section when the release contains framework or library
upgrades, large migrations, or security-relevant version bumps. The goal is
transparency: tell users what changed in plain language, why it matters, and
what minor issues they might see.

Example:

```
*🔧 Technical Improvements*

• *Next.js 15 upgrade:* We upgraded to Next.js 15, which brings faster page
  loads, better React Server Components support, and modern build tooling.
  This keeps EduHub on a supported, secure release line.

• *Translation system modernization:* We migrated from next-translate to
  next-intl, consolidating translation files and simplifying how new
  languages and keys are added.

These changes are important for keeping EduHub modern, secure, and
maintainable. Because of the scope — especially the translation library
swap — you may occasionally see missing translations or small display
glitches. If you spot any, please report them so we can fix them quickly.
```

## Breaking changes

Explain what the user must do differently:

```
⚠️ Action required: the login URL is now /auth/signin (was /login). Please
update any saved bookmarks.
```

## Review checklist

- [ ] All user-facing features included
- [ ] Each feature describes the user benefit, not the implementation
- [ ] Technical Improvements section explains upgrades in plain language
- [ ] Breaking changes (major bumps) are called out with required actions
- [ ] No commit hashes, branch names, or jargon
- [ ] Slack formatting works (single `*`, bullets, no `---`)
- [ ] Features grouped by area, most impactful first
- [ ] Tone is enthusiastic but professional
