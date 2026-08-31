import { expect, test } from "@playwright/test";

test("anonymous learners can keep browsing the public catalogue", async ({ page }) => {
  await page.goto("/en/topics/");
  await expect(page.getByRole("heading", { name: "Topics" })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Choose your Tracks" })).toHaveCount(0);
  await page.getByRole("link", { name: "View questions →" }).first().click();
  await expect(page).toHaveURL(/\/en\/questions\/\?topic=/);
});

test("Track Preferences require authentication before editing", async ({ page }) => {
  await page.goto("/en/my-tracks/");
  await expect(page.getByRole("heading", { name: "Sign in to manage your Tracks.", level: 2 })).toBeVisible();
  await expect(page.locator("#main-content").getByRole("button", { name: "Sign in" })).toBeVisible();
});
