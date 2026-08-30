---
target: src/app/page.tsx
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-08-30T11-37-02Z
slug: src-app-page-tsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|---:|---|
| 1 | Visibility of System Status | 3/4 | Library count and session position are visible, but saves had no confirmation and progress had no summary. |
| 2 | Match System / Real World | 3/4 | The study language fits the task, but English labels interrupted the Arabic mental model. |
| 3 | User Control and Freedom | 3/4 | Reveal/hide, back links, URL state, and reset confirmation work; there is no resume position. |
| 4 | Consistency and Standards | 3/4 | Shared controls are consistent, but mixed language and no active navigation cue weaken orientation. |
| 5 | Error Prevention | 3/4 | Empty states and reset confirmation help; a topic+difficulty combination can quietly return zero questions. |
| 6 | Recognition Rather Than Recall | 3/4 | Filters and topics are visible, but difficulty meanings and current location are not explained. |
| 7 | Flexibility and Efficiency | 2/4 | Search, filters, and deep links help; there are no keyboard shortcuts or resume flow. |
| 8 | Aesthetic and Minimalist Design | 3/4 | The system is calm and readable, but the question wall becomes repetitive at 100 items. |
| 9 | Error Recovery | 2/4 | Empty states explain outcomes; local-storage failures are silent. |
| 10 | Help and Documentation | 2/4 | Official sources are strong, but there is no workflow or difficulty guidance. |
| **Total** | | **27/40** | **Good foundation; interaction hierarchy needs one more pass.** |

## Design Specificity Verdict

The product is clearly authored for Arabic Flutter interview preparation: RTL content, active recall, official sources, local progress, and topic/difficulty structure are distinctive. The visual language itself is more interchangeable: teal-and-ink colors, rounded cards, chips, a large hero, and generic grids could fit many study products. The strongest opportunity is to make the ritual “جاوب بصوتك → اكشف الإجابة → سجّل تقدمك” the dominant visual story.

The independent detector found three warnings before the polish pass: a 4px answer side accent at `src/app/globals.css`, and Space Grotesk usage/import at the same file. These were subjective/slop heuristics rather than functional failures; the final pass reduced the accent to 1px and kept one Arabic-first font, leaving the final detector clean.

## Overall Impression

Calm, credible, and easy to understand once the learner reaches a question. The content model is stronger than the interaction model. The single biggest opportunity is to make “where am I and what should I do next?” obvious on progress, library, and session surfaces.

## What's Working

- The semantic shell, skip link, RTL metadata, and persistent theme control establish a reliable foundation.
- The question page has a low-friction self-test loop with native progress/favorite controls, answer disclosure, code, sources, and follow-ups.
- Library filters, session position, useful empty states, and shareable search/topic/difficulty URLs support real study behavior.

## Priority Issues

### [P1] Progress had no narrative or next action

`src/app/progress/progress-dashboard.tsx` listed Reviewing, Mastered, and Favorites but did not show a count or obvious next step. This made the learner reconstruct progress manually. Fixed with a “راجعت X من Y سؤالًا” summary and a “كمّل المراجعة” action.

### [P1] The library felt like a 100-question wall

Every question card had equal visual weight, and the review CTA appeared only after both filters were chosen. Fixed by keeping the existing grid while exposing “جهّز جلسة مراجعة” immediately when no complete filter selection exists.

### [P1] Saved state had no feedback

Progress and favorite changes persisted silently. Fixed with an `aria-live` confirmation: “تم حفظ التقدم على هذا الجهاز”. Touch targets for question-control labels were also raised to 44px.

### [P2] Language and taxonomy were split

English labels such as “Difficulty Level”, “Question Progress”, “Question Library”, “Flutter Track”, and “Local Progress” interrupted an otherwise Arabic interface. Fixed by localizing those visible labels while preserving the technical Junior/Mid/Senior values.

### [P2] Session completion remains thin

The last question only disables “السؤال التالي”; there is no completion summary or resume position. This was intentionally left outside this focused pass to avoid inventing session semantics before the product decides what completion should mean.

## Persona Red Flags

- **First-timer:** previously landed in a 100-question wall, had to choose two filters, and saw unexplained English labels. The immediate session action and Arabic labels now reduce that friction.
- **Power user:** sessions still restart at question one, and there are no keyboard shortcuts or resume state. This remains the main efficiency gap.
- **Mobile learner:** the source has a stacked mobile layout and 44px controls, but the browser viewport override was unavailable, so narrow-layout behavior was not browser-measured.

## Minor Observations

- The main nav has no active-link state or breadcrumb cue.
- `id="question-answer"` is unique today but brittle if a page later renders multiple disclosures.
- “سؤال دائم في النسخة الأولى” is awkward copy for a mutable catalogue.
- Local-storage exceptions remain intentionally silent; a future hardening pass could expose a non-blocking fallback message.

## Questions to Consider

- What if “ابدأ المراجعة” opened one recommended question immediately instead of the full library?
- Is “100 questions” motivating, or should the home page foreground a smaller next step?
- What should the learner see after the final session question: a score, a recap, or a next-topic recommendation?
