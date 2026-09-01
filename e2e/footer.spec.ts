import { expect, test } from "@playwright/test";

test("footer exposes localized legal links and stays after the page content", async ({
  page,
}) => {
  await page.goto("/ar/privacy/");

  await expect(
    page.getByRole("heading", { name: "سياسة الخصوصية" }),
  ).toBeVisible();
  const footer = page.getByRole("contentinfo");
  await expect(
    footer.getByRole("link", { name: "شروط الاستخدام" }),
  ).toHaveAttribute("href", "/ar/terms/");
  await expect(
    footer.getByRole("link", { name: "المشروع على GitHub" }),
  ).toHaveAttribute(
    "href",
    "https://github.com/muhamaadessam/tech-interview-prep",
  );

  const geometry = await page.evaluate(() => {
    const frame = document.querySelector<HTMLElement>(".site-frame");
    const main = document.querySelector<HTMLElement>("main");
    const siteFooter = document.querySelector<HTMLElement>(".site-footer");
    if (!frame || !main || !siteFooter)
      throw new Error("site frame is incomplete");
    return {
      frameHeight: frame.getBoundingClientRect().height,
      viewportHeight: window.innerHeight,
      mainBottom: main.getBoundingClientRect().bottom,
      footerTop: siteFooter.getBoundingClientRect().top,
    };
  });
  expect(geometry.frameHeight).toBeGreaterThanOrEqual(geometry.viewportHeight);
  expect(geometry.footerTop).toBeGreaterThanOrEqual(geometry.mainBottom - 1);
});

test("english footer links point to english legal pages", async ({ page }) => {
  await page.goto("/en/terms/");

  const footer = page.getByRole("contentinfo");
  await expect(
    page.getByRole("heading", { name: "Terms of use" }),
  ).toBeVisible();
  await expect(
    footer.getByRole("link", { name: "Privacy policy" }),
  ).toHaveAttribute("href", "/en/privacy/");
});
