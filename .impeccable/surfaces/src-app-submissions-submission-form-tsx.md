---
version: 1
slug: "src-app-submissions-submission-form-tsx"
primary_target: "src/app/submissions/submission-form.tsx"
related_targets: ["src/app/site-shell.tsx","src/app/topics/page.tsx"]
---

## Job and audience

Operate-mode web surfaces for signed-in learners choosing Tracks and contributing an Interview Question. The visitor needs to orient quickly, select a default Track confidently, then submit only the information they have.

## Outcome and proof

The product proves its value through clear Track-scoped content and a transparent human Review path. Success is a completed Onboarding, a legible Active Track, or a submitted question with an explicit GitHub Review Issue result.

## Selected direction

Preserve the blue/cyan logo and bilingual light/dark support while replacing the crowded application chrome with a calm technical workspace: compact rails, precise borders, strong type hierarchy, and purposeful status color. Navigation is grouped by task rather than exposing every route. Topic selection uses labelled chips with question counts, not checkbox grids.

## Interaction and layout

- Desktop header: brand/home, Topics, Question Library, Practice, then account, locale, and theme controls. Account owns My Tracks, Progress, Suggest a question, and Moderator access when authorized.
- Mobile: a single menu trigger opens the full navigation and account actions; no horizontal scrolling navigation.
- Onboarding: selectable Track cards, a visible Default Track control, preselected Flutter when it is the sole active Track, and a clear Continue action.
- Track-sensitive pages: a compact page-local Active Track switcher; it never overwrites the Default Track. Topics appear as selectable chips/cards with counts and selected state.
- Submission: an essentials section for Track, question, and consent, followed by a progressive "Add optional details" disclosure. Topics appear only after Track selection.

## States and constraints

Show explicit loading, signed-out, email-verification, empty-Track, invalid URL, validation, retry, success, and GitHub Issue states. Preserve keyboard operation, visible focus, RTL/LTR ordering, readable contrast, reduced motion, and localized AR/EN copy. Do not add a global Track switcher or require a personal Track selection to browse public content.
