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
A proposed Interview Question sent by an authenticated contributor. Its Track and question are required; Topics and learning material are optional enrichment. A Submission is not part of the public catalogue until it passes Review.
_Avoid_: User question, draft question

**Onboarding**:
The first-run flow where an Account chooses one or more Tracks to personalize Topics and contribution defaults. An Account can revisit these choices later.
_Avoid_: Setup wizard, profile form

**Track Preference**:
One or more Tracks selected by an Account for personalization. When a Submission has multiple preferred Tracks available, the Account chooses the single Track that owns that Submission.
_Avoid_: Category filter, specialty

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

**Account**:
An authenticated identity used to own Question Progress, Favorites, and Submissions. Anonymous learners may browse without an Account.
_Avoid_: Profile when referring to identity or access
