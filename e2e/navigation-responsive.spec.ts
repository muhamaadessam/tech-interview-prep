import { expect, test, type Page } from "@playwright/test";

async function authenticate(page: Page, role: "learner" | "moderator") {
  await page.addInitScript(() => localStorage.setItem("playwright-authenticated", "true"));
  await page.route("https://mock.supabase.local/rest/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname.split("/rest/v1/")[1];
    const body = path.startsWith("tracks")
      ? [{ id: "flutter", is_active: true, track_locales: [{ name: "Flutter" }] }]
      : path.startsWith("account_track_preferences")
        ? [{ track_id: "flutter", is_default: true, tracks: { id: "flutter", is_active: true, track_locales: [{ name: "Flutter" }] } }]
        : path.startsWith("account_roles") ? [{ role, suspended: false }] : [];
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
}

test("desktop navigation groups catalogue and account actions without exposing Moderation", async ({ page }) => {
  await authenticate(page, "learner");
  await page.goto("/en/topics/?track=flutter");

  await expect(page.getByRole("link", { name: "Tech Interview Prep — Home" })).toBeVisible();
  await expect(page.locator(".desktop-navigation").getByRole("link", { name: "Question Library" })).toBeVisible();
  await expect(page.locator(".desktop-navigation").getByRole("link", { name: "My Tracks" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Moderation" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Menu" })).toBeHidden();
});

test("authorized Moderators receive the Moderation account action", async ({ page }) => {
  await authenticate(page, "moderator");
  await page.goto("/en/topics/?track=flutter");

  await expect(page.locator(".desktop-navigation").getByRole("link", { name: "Moderation" })).toBeVisible();
});

test("mobile drawer contains contextual links, traps focus, and closes with Escape", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en/topics/?track=flutter&topic=dart");

  await expect(page.getByLabel("Active Track")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Dart" })).toBeVisible();
  await expect(page.getByText(/questions currently available for review/).first()).toBeVisible();
  const trigger = page.getByRole("button", { name: "Menu" });
  await expect(trigger).toBeVisible();
  await trigger.click();

  const drawer = page.getByRole("dialog", { name: "Menu" });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("button", { name: "Close" })).toBeFocused();
  await expect(drawer.getByRole("link", { name: "Question Library" })).toHaveAttribute("href", "/en/questions/?track=flutter&topic=dart");
  await page.keyboard.press("Tab");
  await expect(drawer.getByRole("link", { name: "Topics" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("Track Preference cards remain usable in a mobile viewport", async ({ page }) => {
  await authenticate(page, "learner");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en/my-tracks/?track=flutter");

  await expect(page.getByRole("group", { name: "Track Preferences" })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Flutter" })).toBeChecked();
  await expect(page.getByRole("button", { name: "Save Tracks" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
