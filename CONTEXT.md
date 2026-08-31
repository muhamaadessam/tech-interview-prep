# Technical Interview Preparation

A study platform for preparing software developers for technical interviews. It starts with Flutter while keeping the content model open to additional specialties later.

## Language

**Track**:
A technical specialty that groups related interview content, such as Flutter or Backend.
_Avoid_: Category, specialization

**Topic**:
A subject scoped to one Track, such as Dart, OOP, SOLID, or State Management within Flutter.
_Avoid_: Category, section

**Interview Question**:
A technical prompt belonging to one Track and one or more Topics in that Track. Its learning material can include a short answer, detailed explanation, code example, common mistakes, follow-up questions, official sources, and a last-reviewed date.
_Avoid_: Card, item

**Difficulty Level**:
The expected interview depth of an Interview Question: Junior, Mid, or Senior.
_Avoid_: User level, experience level

**Question Progress**:
A learner's local study state for an Interview Question: Not Started, Reviewing, or Mastered. Saving a question as a favorite is independent of this state.
_Avoid_: Completion, status

**Study Session**:
An ordered set of Interview Questions selected by Topic and Difficulty Level for focused review.
_Avoid_: Quiz, mock interview

**Submission**:
A proposed Interview Question sent by an authenticated contributor. Its Track, question, and CC BY publication consent are required; Topics, Difficulty Level, and learning material are optional enrichment. A Submission is not part of the public catalogue until it passes Review.
_Avoid_: User question, draft question

**Onboarding**:
The flow shown after sign-in when an Account has no active Track Preferences. It requires at least one active Track before completion, may preselect the only available Track, and appears again only when no selected Track remains active. Public catalogue browsing does not require completing Onboarding.
_Avoid_: Setup wizard, profile form

**Track Preference**:
One or more active Tracks selected by an Account and stored as its personalization source of truth. An Account must keep at least one Track Preference. Removing one changes personalized views but does not delete historical progress, favorites, or Submissions. An Account selects one preferred Track as its Default Track. When multiple preferred Tracks are available, the Account chooses the single Track that owns a Submission.
_Avoid_: Category filter, specialty

**Default Track**:
The Track Preference selected by an Account in My Tracks as the starting context for personalized content. It is a persistent preference, distinct from a temporary Active Track chosen within a page.
_Avoid_: Primary category, global filter

**Active Track**:
The Track currently scoping a track-sensitive page, such as Topics, the Question Library, a Study Session, a Full Interview, or a Submission. For an Account it must be one of its Track Preferences; for an anonymous visitor it may be any active Track. A valid Track in the URL takes precedence over the Default Track for that page.
_Avoid_: Default track, selected topic

**Review**:
The moderation process that evaluates a Submission for correctness, clarity, attribution, and fit before it becomes a published Interview Question.
_Avoid_: Approval only, voting

**Moderator**:
An Account authorized to conduct Review, request changes, reject Submissions,
publish accepted content, and restore an earlier Question Revision. Moderator
access is separate from learner progress and contribution ownership.
_Avoid_: Reviewer when referring to the Account role

**Question Revision**:
An immutable version of an Interview Question's learning material. A Revision
may be a working draft or the version currently published in the catalogue;
publishing or restoring content creates a new Revision.
_Avoid_: Edit, overwrite

**Review Issue**:
The GitHub Issue created for a Submission that records its review conversation and decision. A Moderator manually updates the database after reviewing the Issue; the Issue is not the catalogue source of truth.
It is a review record, not the catalogue source of truth and not proof that a
Submission is published.
_Avoid_: Pull request, publication record

**Community Interview Question**:
An Interview Question created from a reviewed Submission and published in its Track's community collection. It keeps its contributor attribution and can be promoted permanently into the public catalogue after reaching the configured unique-Account Like threshold.
_Avoid_: User question, unreviewed submission

**Question Like**:
One Account's positive vote for a Community Interview Question. An Account may Like a question at most once, cannot Like its own contribution, and Likes are not used for public-catalogue questions.
_Avoid_: Rating, review, approval

**Account**:
An authenticated identity used to own Question Progress, Favorites, and Submissions. Anonymous learners may browse without an Account.
_Avoid_: Profile when referring to identity or access
