import { test, expect } from "@playwright/test";

test.describe("Discovery, study session, and progress journey", () => {
  test("covers library discovery, answer reveal, question progress persistence after reload, and core navigation", async ({ page }) => {
    // 1. Home page & Topics discovery
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "ادخل الانترفيو وإجابتك مرتبة في دماغك." })).toBeVisible();
    await expect(page.getByText("سؤال دائم في النسخة الأولى")).toBeVisible();

    await page.goto("/topics");
    await expect(page.getByRole("heading", { name: "الموضوعات" })).toBeVisible();
    await page.click("text=عرض الأسئلة");

    // 2. Library Discovery & Filters
    await expect(page).toHaveURL(/\/questions\/\?topic=dart/);
    const searchInput = page.getByLabel("ابحث في الأسئلة");
    await searchInput.fill("final");

    // Search and Topic reflected in URL, omitting personal progress / favorites
    await expect(page).toHaveURL(/\/questions\/\?search=final&topic=dart/);

    // Select Difficulty Level
    await page.getByLabel("Difficulty Level").selectOption("Junior");
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
  });
});
