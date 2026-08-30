import { test, expect, type Page } from "@playwright/test";

const question = {
  id: "community-001",
  slug: "dynamic-question",
  track_id: "flutter",
  difficulty: "Mid",
  published_revision_id: "revision-001",
};

async function mockQuestionApi(page: Page, options: { failFirst?: boolean } = {}) {
  let failing = Boolean(options.failFirst);
  await page.route("https://mock.supabase.local/rest/v1/**", async (route) => {
    if (failing) {
      await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "temporary" }) });
      return;
    }
    const url = new URL(route.request().url());
    const path = url.pathname.split("/rest/v1/")[1];
    const body = path.startsWith("interview_questions") && url.searchParams.get("slug")?.includes("missing") ? []
      : path.startsWith("interview_questions") ? [question]
      : path.startsWith("question_revisions") ? [{ id: "revision-001", question_id: "community-001", reviewed_at: "2026-08-30" }]
      : path.startsWith("question_revision_locales") ? [
        { locale: "ar", question: "ما هو السؤال الديناميكي؟", short_answer: "إجابة عربية قصيرة.", explanation: "شرح عربي كامل.", code_example: null, common_mistakes: [], follow_up_questions: [], sources: [{ title: "Flutter docs", url: "https://docs.flutter.dev" }] },
        { locale: "en", question: "What is a dynamic question?", short_answer: "A short English answer.", explanation: "A complete English explanation.", code_example: null, common_mistakes: [], follow_up_questions: [], sources: [{ title: "Flutter docs", url: "https://docs.flutter.dev" }] },
      ]
      : path.startsWith("question_topics") ? [{ topic_id: "dart" }]
      : [{ topic_id: "dart", name: "Dart" }];
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
  return () => { failing = false; };
}

test.describe("database-only question route", () => {
  test("loads a deep link, switches locale while preserving the slug, and renders noindex metadata", async ({ page }) => {
    await mockQuestionApi(page);
    await page.goto("/ar/questions/view/?slug=dynamic-question");
    await expect(page.getByRole("heading", { name: "ما هو السؤال الديناميكي؟" })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await page.getByRole("link", { name: "English" }).click();
    await expect(page).toHaveURL(/\/en\/questions\/view\/\?slug=dynamic-question/);
    await expect(page.getByRole("heading", { name: "What is a dynamic question?" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });

  test("shows an explicit not-found state for a missing slug", async ({ page }) => {
    await mockQuestionApi(page);
    await page.goto("/ar/questions/view/?slug=missing");
    await expect(page.getByRole("heading", { name: "السؤال غير موجود" })).toBeVisible();
  });

  test("shows a retryable connection error", async ({ page }) => {
    const recover = await mockQuestionApi(page, { failFirst: true });
    await page.goto("/en/questions/view/?slug=dynamic-question");
    await expect(page.getByRole("heading", { name: "Could not load the question" })).toBeVisible();
    recover();
    await page.getByRole("button", { name: "Retry" }).click();
    await expect(page.getByRole("heading", { name: "What is a dynamic question?" })).toBeVisible();
  });
});
