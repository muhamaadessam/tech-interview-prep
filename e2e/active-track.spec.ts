import { expect, test, type Page } from "@playwright/test";

type Preference = { trackId: "flutter" | "backend"; isDefault: boolean };

async function authenticate(page: Page, preferences: Preference[]) {
  await page.addInitScript(() => localStorage.setItem("playwright-authenticated", "true"));
  await page.route("https://mock.supabase.local/rest/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname.split("/rest/v1/")[1];
    const body = path.startsWith("tracks")
      ? [
          { id: "flutter", is_active: true, track_locales: [{ name: "Flutter" }] },
          { id: "backend", is_active: true, track_locales: [{ name: "Backend" }] },
        ]
      : path.startsWith("account_track_preferences")
        ? preferences.map(({ trackId, isDefault }) => ({ track_id: trackId, is_default: isDefault, tracks: { id: trackId, is_active: true, track_locales: [{ name: trackId === "flutter" ? "Flutter" : "Backend" }] } }))
        : [];
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
}

test("anonymous browsing exposes active Tracks and keeps a temporary Track in shareable links", async ({ page }) => {
  const preferenceWrites: string[] = [];
  page.on("request", (request) => { if (request.url().includes("set_track_preferences")) preferenceWrites.push(request.url()); });
  await page.goto("/en/topics/");
  const selector = page.getByLabel("Active Track");
  await expect(selector.locator("option")).toHaveText(["Flutter", "Backend"]);
  await selector.selectOption("backend");
  await expect(page).toHaveURL(/\/en\/topics\/\?track=backend$/);
  await expect(page.getByRole("heading", { name: "This Track has no content yet" })).toBeVisible();
  await page.getByRole("link", { name: "Question Library" }).click();
  await expect(page).toHaveURL(/\/en\/questions\/\?track=backend$/);
  expect(preferenceWrites).toEqual([]);
});

test("authenticated catalogue exposes only active Track Preferences", async ({ page }) => {
  await authenticate(page, [{ trackId: "backend", isDefault: true }]);
  await page.goto("/en/questions/");
  const selector = page.getByLabel("Active Track");
  await expect(selector).toHaveValue("backend");
  await expect(selector.locator("option")).toHaveText(["Backend"]);
  await expect(page.getByRole("heading", { name: "This Track has no content yet" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Manage Track Preferences" })).toBeVisible();
});

test("valid URL Track wins over Account Default Track and invalid Topic context recovers", async ({ page }) => {
  await authenticate(page, [
    { trackId: "flutter", isDefault: false },
    { trackId: "backend", isDefault: true },
  ]);
  await page.goto("/en/questions/?track=flutter&topic=dart");
  await expect(page.getByLabel("Active Track")).toHaveValue("flutter");
  await expect(page.getByText("What should a Flutter developer know about Final Vs Const In Dart?")).toBeVisible();

  await page.goto("/en/questions/?track=flutter&topic=api");
  await expect(page.getByRole("heading", { name: "This Topic does not belong to the Active Track" })).toBeVisible();
  await expect(page.locator(".card .question-title")).toHaveCount(0);
});

test("Study Session stays within one Topic and Full Interview includes multiple Topics in its Track", async ({ page }) => {
  await page.goto("/en/session/?track=flutter&topic=dart&difficulty=Junior");
  await expect(page.getByText(/Question 1 of \d+/)).toBeVisible();
  await expect(page.getByRole("heading", { level: 2 })).toContainText("Final Vs Const In Dart");

  await page.goto("/en/session/?track=backend&topic=dart&difficulty=Junior");
  await expect(page.getByRole("heading", { name: "This Topic does not belong to the Active Track" })).toBeVisible();

  await page.goto("/en/interview/?track=flutter&topics=dart,oop&difficulty=Senior");
  await expect(page.getByText(/Question 1 of \d+/)).toBeVisible();
  await expect(page.getByLabel("Dart")).toBeChecked();
  await expect(page.getByLabel("OOP")).toBeChecked();
  await expect(page.getByText("The selected level includes every lower level.")).toBeVisible();
});

test("Arabic and English keep Track context with RTL and LTR direction", async ({ page }) => {
  await page.goto("/ar/topics/?track=flutter");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(/\/en\/topics\/\?track=flutter$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
});
