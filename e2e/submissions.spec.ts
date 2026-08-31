import { expect, test, type Page } from "@playwright/test";

async function signedInSubmissionPage(page: Page, verified = true) {
  await page.addInitScript(({ verified }) => {
    localStorage.setItem("playwright-authenticated", "true");
    localStorage.setItem("playwright-email-verified", String(verified));
  }, { verified });
  await page.route("https://mock.supabase.local/rest/v1/**", async (route) => {
    const preferences = route.request().url().includes("account_track_preferences");
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(preferences
        ? [{ track_id: "flutter", is_default: true, tracks: { id: "flutter", is_active: true, track_locales: [{ locale: "en", name: "Flutter" }] } }]
        : [{ id: "flutter", is_active: true, track_locales: [{ locale: "en", name: "Flutter" }] }]),
    });
  });
  await page.goto("/en/submissions/");
}

test("anonymous and unconfirmed Accounts are explicitly blocked", async ({ page }) => {
  await page.goto("/en/submissions/");
  await expect(page.getByRole("heading", { name: "Sign in to submit a question." })).toBeVisible();
  await signedInSubmissionPage(page, false);
  await expect(page.getByText("Confirm your email before submitting a contribution.")).toBeVisible();
});

test("minimal Submission retries with one idempotency key and shows duplicate advisory and Issue link", async ({ page }) => {
  await signedInSubmissionPage(page);
  const requests: Array<Record<string, unknown>> = [];
  await page.route("https://mock.supabase.local/functions/v1/submit-question", async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(requests.length === 1
        ? { submissionId: "submission-1", status: "failed", retryable: true }
        : { submissionId: "submission-1", status: "issue_created", githubIssueUrl: "https://github.com/example/repo/issues/53", duplicateAdvisory: true }),
    });
  });

  await expect(page.getByLabel("Track")).toHaveValue("flutter");
  await expect(page.getByLabel("Difficulty")).toHaveValue("");
  await page.getByLabel("Question", { exact: true }).fill("What is final?");
  await page.getByLabel(/CC BY 4\.0/).check();
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.getByText("The review Issue could not be created.")).toBeVisible();
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.getByRole("link", { name: "Open GitHub Issue" })).toHaveAttribute("href", "https://github.com/example/repo/issues/53");
  await expect(page.getByText(/It may resemble an existing question/)).toBeVisible();

  expect(requests).toHaveLength(2);
  expect(requests[0].idempotencyKey).toBe(requests[1].idempotencyKey);
  expect(requests[0]).toMatchObject({ trackId: "flutter", topicIds: [], difficulty: null, shortAnswer: "", explanation: "", sources: [] });
});

for (const [code, message] of [
  ["daily_limit_reached", "Daily limit reached (5 submissions)."],
  ["cooldown_active", "Wait a minute before sending another contribution."],
] as const) test(`shows localized ${code} feedback`, async ({ page }) => {
  await signedInSubmissionPage(page);
  await page.route("https://mock.supabase.local/functions/v1/submit-question", (route) => route.fulfill({ status: 429, contentType: "application/json", body: JSON.stringify({ error: code }) }));
  await page.getByLabel("Question", { exact: true }).fill("What is final?");
  await page.getByLabel(/CC BY 4\.0/).check();
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.locator("p[role=alert]")).toHaveText(message);
});
