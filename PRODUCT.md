# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Software developers preparing for technical interviews, primarily Flutter developers today. Authenticated contributors can suggest questions; authorized Moderators review and publish them.

## Product Purpose

Tech Interview Prep helps developers study technical interview questions through organized Tracks and Topics, bilingual explanations, progress tracking, and focused Study Sessions. Success means a learner can find relevant material quickly and a contributor can submit a useful question for human review.

## Positioning

An Arabic-first, bilingual interview preparation library that combines curated learning material with a transparent community Review workflow recorded in GitHub Issues.

## Operating Context

Learners browse anonymously, sign in with Clerk when they need Account-owned features, choose Track Preferences during Onboarding, study by Topic and Difficulty Level, and optionally submit questions. Moderators inspect Review Issues and update the Supabase catalogue after verification.

## Capabilities and Constraints

- The initial Track is Flutter with Dart and related Topics; the content model must support additional Tracks.
- Onboarding selects one or more Tracks and can be revisited later. Topics shown to an Account are scoped to its selected Tracks.
- A Submission requires a Track, a question, and license consent. Topics, short answer, explanation, Difficulty Level, sources, code, mistakes, follow-ups, and display name are optional.
- Each Submission creates a GitHub Review Issue labelled for suggested questions and review. AI may provide advisory review notes; only a Moderator publishes or updates the database.
- Anonymous catalogue browsing remains available. Clerk provides authentication and Supabase stores Account data and published content.
- The site is a static Next.js export hosted on Cloudflare Pages and supports Arabic/English plus light/dark themes.

## Brand Commitments

The product name is Tech Interview Prep. The voice is clear, practical, Arabic-first, and source-aware. Arabic and English are first-class locales, and the existing logo and theme toggle remain recognizable.

## Evidence on Hand

The repository contains 100 permanent Flutter/Dart interview questions across 14 Topics, bilingual copy, official source links, Study Sessions, progress and favorites, Submission and Moderator surfaces, Supabase migrations, and a live Cloudflare Pages deployment backed by the Node API on Vercel.

## Product Principles

- Make interview preparation scannable by Track, Topic, and Difficulty Level.
- Keep public learning open while protecting Account-owned state and Review permissions.
- Treat human Review as the publication gate; automation assists but does not silently publish.
- Prefer useful, source-backed content over required form completeness.

## Accessibility & Inclusion

All core flows must work with keyboard navigation, visible focus, readable contrast, responsive layouts, and complete Arabic/English labels. Onboarding and forms must expose clear loading, validation, error, and success states.
