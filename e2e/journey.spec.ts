import { test, expect } from "@playwright/test";

test.describe("Discovery, study session, and progress journey", () => {
  test("covers library discovery, answer reveal, question progress persistence after reload, and core navigation", async ({ page }) => {
    // 1. Home page & Topics discovery
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "ادخل الانترفيو وإجابتك مرتبة في دماغك." })).toBeVisible();
    await expect(page.getByText("سؤال دائم في النسخة الأولى")).toBeVisible();

    const themeToggle = page.getByRole("button", { name: "تغيير المظهر" });
    const initialTheme = await page.locator("html").getAttribute("data-theme");
    await themeToggle.click();
    const nextTheme = initialTheme === "dark" ? "light" : "dark";
    await expect(page.locator("html")).toHaveAttribute("data-theme", nextTheme);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", nextTheme);

    await page.goto("/topics");
    await expect(page.getByRole("heading", { name: "الموضوعات" })).toBeVisible();
    await page.click("text=عرض الأسئلة");

    // 2. Library Discovery & Filters
    await expect(page).toHaveURL(/\/ar\/questions\/\?topic=dart/);
    const searchInput = page.getByLabel("ابحث في الأسئلة");
    await searchInput.fill("final");

    // Search and Topic reflected in URL, omitting personal progress / favorites
    await expect(page).toHaveURL(/\/questions\/\?search=final&topic=dart/);

    // Select Difficulty Level
    await page.getByLabel("مستوى الصعوبة").selectOption("Junior");
    await expect(page).toHaveURL(/\/questions\/\?search=final&topic=dart&difficulty=Junior/);

    // Verify session button is available when topic & difficulty are set
    const sessionLink = page.getByRole("link", { name: "ابدأ جلسة المراجعة" });
    await expect(sessionLink).toBeVisible();

    // 3. Question Details & Answer Reveal
    await page.click("text=ما الفرق بين final و const في Dart؟");
    await expect(page).toHaveURL(/\/questions\/final-vs-const-in-dart\//);

    // Answer hidden initially
    const revealButton = page.getByRole("button", { name: "اكشف الإجابة" });
    await expect(revealButton).toBeVisible();

    // Reveal answer
    await revealButton.click();
    await expect(page.getByRole("heading", { name: "الإجابة المختصرة" })).toBeVisible();
    await expect(page.getByText("final تعني أن المتغير يُسند مرة واحدة وقت التشغيل")).toBeVisible();

    // 4. Question Progress Persistence after reload
    const masteredRadio = page.getByLabel("متقن");
    const favoriteCheckbox = page.getByLabel("حفظ في المفضلة");

    await masteredRadio.check();
    await favoriteCheckbox.check();

    await expect(masteredRadio).toBeChecked();
    await expect(favoriteCheckbox).toBeChecked();
    await expect(page.getByText("تم حفظ التقدم على هذا الجهاز")).toBeAttached();

    // Reload page to verify persistence
    await page.reload();

    await expect(page.getByLabel("متقن")).toBeChecked();
    await expect(page.getByLabel("حفظ في المفضلة")).toBeChecked();

    // 5. Core Navigation Journey: Back to library & Study Session navigation
    await page.click("text=← مكتبة الأسئلة");
    await expect(page).toHaveURL(/\/questions\//);

    // Navigate to Study Session
    await page.goto("/session?topic=dart&difficulty=Junior");
    await expect(page.getByRole("heading", { name: "جلسة مراجعة" })).toBeVisible();
    await expect(page.getByText(/سؤال 1 من \d+/)).toBeVisible();
    const firstSessionQuestion = page.getByRole("heading", { level: 2 });
    await expect(firstSessionQuestion).toHaveText("ما الفرق بين final و const في Dart؟");

    // Verify previous/next navigation buttons and transitions
    const prevButton = page.getByRole("button", { name: "السؤال السابق" });
    const nextButton = page.getByRole("button", { name: "السؤال التالي" });
    await expect(prevButton).toBeDisabled();
    await expect(nextButton).toBeEnabled();

    // Navigate to Next Question
    await nextButton.click();
    await expect(page.getByText(/سؤال 2 من \d+/)).toBeVisible();
    await expect(firstSessionQuestion).not.toHaveText("ما الفرق بين final و const في Dart؟");
    await expect(prevButton).toBeEnabled();

    // Navigate back to Previous Question
    await prevButton.click();
    await expect(page.getByText(/سؤال 1 من \d+/)).toBeVisible();
    await expect(firstSessionQuestion).toHaveText("ما الفرق بين final و const في Dart؟");

    // 6. Full interview: multiple topics and inclusive difficulty
    await page.goto("/interview");
    await expect(page.getByRole("heading", { name: "ابنِ انترفيو شامل" })).toBeVisible();
    await page.getByRole("checkbox", { name: "Dart" }).check();
    await page.getByRole("checkbox", { name: "OOP" }).check();
    await page.getByLabel("مستوى المقابلة").selectOption("Senior");
    await expect(page).toHaveURL(/topics=dart(?:%2C|,)oop&difficulty=Senior/);
    await expect(page.getByText(/سؤال 1 من \d+/)).toBeVisible();
    await expect(page.getByRole("heading", { level: 2 })).toHaveText("ما الفرق بين final و const في Dart؟");
  });

  test("serves the English locale with LTR metadata and preserves study state", async ({ page }) => {
    await page.goto("/en/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.getByRole("heading", { name: "Walk into the interview with your answers organized." })).toBeVisible();
    await page.getByRole("link", { name: "Question Library" }).click();
    await expect(page).toHaveURL(/\/en\/questions\/\?track=flutter$/);
    await expect(page.getByLabel("Search questions")).toBeVisible();
    await page.getByText("What should a Flutter developer know about Final Vs Const In Dart?").click();
    await expect(page).toHaveURL(/\/en\/questions\/final-vs-const-in-dart\/\?track=flutter$/);
    await expect(page.getByRole("heading", { name: "What should a Flutter developer know about Final Vs Const In Dart?" })).toBeVisible();
    await page.getByRole("link", { name: "العربية" }).click();
    await expect(page).toHaveURL(/\/ar\/questions\/final-vs-const-in-dart\/\?track=flutter$/);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });
});
