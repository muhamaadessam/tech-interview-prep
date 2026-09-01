import { test, expect, type Page } from "@playwright/test";

const question = {
  id: "community-001",
  slug: "dynamic-question",
  trackId: "flutter",
  topicIds: ["dart"],
  topicNames: ["Dart"],
  difficulty: "Mid",
  lastReviewedAt: "2026-08-30",
  translations: {
    ar: { question: "ما هو السؤال الديناميكي؟", shortAnswer: "إجابة عربية قصيرة.", explanation: "شرح عربي كامل.", commonMistakes: [], followUpQuestions: [], sources: [{ title: "Flutter docs", url: "https://docs.flutter.dev" }] },
    en: { question: "What is a dynamic question?", shortAnswer: "A short English answer.", explanation: "A complete English explanation.", commonMistakes: [], followUpQuestions: [], sources: [{ title: "Flutter docs", url: "https://docs.flutter.dev" }] },
  },
};

async function mockQuestionApi(page: Page, options: { failFirst?: boolean } = {}) {
  let failing = Boolean(options.failFirst);
  await page.route("http://127.0.0.1:3001/v1/questions/**", async (route) => {
    if (failing) {
      await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "temporary" }) });
      return;
    }
    const missing = new URL(route.request().url()).pathname.endsWith("/missing");
    await route.fulfill({ status: missing ? 404 : 200, contentType: "application/json", body: JSON.stringify(missing ? { error: "question_not_found" } : question) });
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
