# Backend migration specifications

These are the remaining architecture slices from the review. They are
specifications only; implementation tickets should be created from one spec at
a time after the previous slice is accepted.

Recommended order:

1. [Tracks and Track Preferences](./tracks-track-preferences.md) — first
   product vertical slice behind the existing Node identity/policy seam.
2. [Catalogue reads](./catalogue-reads.md) — only the database-backed reads;
   keep the static public catalogue unchanged initially.
3. [Learner state](./learner-state.md) — Question Progress, Favorites, and
   Asked Markers remain separate concepts and contracts.
4. [Submission to Review](./submission-review.md) — validation, idempotency,
   Submission Review side effects after read/write parity is proven.

The Node backend is the application path for these slices. Supabase remains the
database provider and migration/seed source only.
