import { topicTranslations, type Locale } from "./content/questions";
export type { Locale } from "./content/questions";

export const locales: Locale[] = ["ar", "en"];

export const messages = {
  ar: {
    brandName: "تحضير المقابلات التقنية",
    home: "الرئيسية", topics: "الموضوعات", questions: "مكتبة الأسئلة", interview: "مقابلة كاملة", progress: "تقدمي",
    skip: "انتقل إلى المحتوى", theme: "تغيير المظهر", dark: "◐ الوضع الداكن", light: "☀ الوضع الفاتح", signIn: "تسجيل الدخول", signUp: "إنشاء حساب",
    libraryEyebrow: "مكتبة الأسئلة", libraryTitle: "مكتبة الأسئلة", libraryDescription: "راجع السؤال، جاوب بصوتك، وبعدها افتح التفاصيل وقارن إجابتك بشرح مدعوم بالمصدر الرسمي.",
    search: "ابحث في الأسئلة", searchPlaceholder: "مثال: final أو وقت التشغيل", topic: "الموضوع", allTopics: "كل الموضوعات", difficulty: "مستوى الصعوبة", allDifficulties: "كل المستويات", progressFilter: "حالة المراجعة", allProgress: "كل الحالات", favoriteOnly: "المفضلة فقط", available: "سؤال متاح.", startSession: "ابدأ جلسة المراجعة", prepareSession: "جهّز جلسة مراجعة", noResults: "مفيش نتائج مطابقة", expandFilters: "جرّب تغيّر البحث أو توسّع الفلاتر.",
    topicsEyebrow: "مسار Flutter", topicsTitle: "الموضوعات", topicsDescription: "المحتوى متقسم حسب المفاهيم اللي بتتقابل في الانترفيو.", availableQuestions: "سؤال متاح للمراجعة حاليًا.", viewQuestions: "عرض الأسئلة ←",
    homeEyebrow: "مسار Flutter متاح الآن", homeTitle: "ادخل الانترفيو وإجابتك مرتبة في دماغك.", homeLead: "أسئلة تقنية مختارة، إجابات عربية واضحة، ومراجع رسمية تساعدك تراجع المفهوم بدل ما تحفظ جملة.", startReview: "ابدأ المراجعة", exploreTopics: "استكشف الموضوعات", currentQuestions: "سؤال دائم في النسخة الأولى", firstTopic: "أول موضوع متاح ضمن مسار Flutter.", featuredTitle: "ابدأ بسؤال Dart", featuredLead: "إجابة قصيرة أولاً، ثم شرح أعمق ومصدر رسمي.", allQuestions: "كل الأسئلة", answerPrompt: "جاوب من ذاكرتك، وبعدها اكشف الإجابة وقارن شرحك بالتفاصيل.", readAnswer: "اقرأ الإجابة كاملة ←",
    sessionEyebrow: "جلسة مراجعة", sessionTitle: "جلسة مراجعة", sessionDescription: "اختار موضوعًا ومستوى، وراجع بالترتيب من غير مؤقت أو عشوائية.", chooseTopic: "اختار موضوعًا", chooseDifficulty: "اختار المستوى", preparing: "جاري تجهيز الجلسة...", question: "سؤال", of: "من", previous: "السؤال السابق", next: "السؤال التالي", noCombination: "لا توجد أسئلة للجمع ده", startStudy: "ابدأ جلسة مراجعة", selectSession: "اختار موضوعًا ومستوى من القوائم عشان نجهز لك الأسئلة بالترتيب.",
    interviewEyebrow: "مقابلة Flutter كاملة", interviewTitle: "ابنِ انترفيو شامل", interviewDescription: "اختار أكثر من موضوع ومستوى واحد. المستوى الأعلى يشمل أسئلته وأسئلة المستويات الأقل.", chooseTopics: "اختار الموضوعات", selected: "مختارة", interviewLevel: "مستوى المقابلة", inclusiveHint: "المستوى المختار يشمل كل المستويات الأقل منه.", preparingInterview: "جاري تجهيز المقابلة...", completeSetup: "كمّل إعداد المقابلة", startInterview: "ابدأ مقابلة كاملة", interviewEmpty: "اختار موضوعًا واحدًا على الأقل ومستوى المقابلة عشان نجهز لك الأسئلة.",
    progressEyebrow: "تقدمك على الجهاز", progressTitle: "تقدمي", progressDescription: "حالتك محفوظة على الجهاز ده فقط، من غير حساب أو إرسال بيانات.", reviewed: "راجعت", continueReview: "كمّل المراجعة", reviewing: "قيد المراجعة", mastered: "متقن", favorites: "المفضلة", noQuestions: "لا توجد أسئلة هنا حاليًا.", resetTitle: "إعادة ضبط البيانات المحلية", resetDescription: "يمسح تقدم الأسئلة والمفضلة فقط.", reset: "إعادة ضبط التقدم", resetConfirm: "متأكد إنك عايز تمسح تقدمك والمفضلة من الجهاز ده؟",
    backLibrary: "← مكتبة الأسئلة", lastReviewed: "آخر مراجعة", staleReview: "راجع الإجابة من المصدر قبل الانترفيو لو مر وقت طويل على التاريخ ده.", progressLegend: "تقدم السؤال", favorite: "حفظ في المفضلة", saved: "تم حفظ التقدم على هذا الجهاز", reveal: "اكشف الإجابة", hide: "اخفِ الإجابة", shortAnswer: "الإجابة المختصرة", explanation: "الشرح", code: "مثال بالكود", mistakes: "أخطاء شائعة", followUps: "أسئلة متابعة", sources: "المصادر", notFound: "السؤال غير موجود", footer: "محتوى عربي أصلي بمراجع رسمية.", language: "English",
  },
  en: {
    brandName: "Tech Interview Prep",
    home: "Home", topics: "Topics", questions: "Question Library", interview: "Full Interview", progress: "Progress",
    skip: "Skip to content", theme: "Change theme", dark: "◐ Dark mode", light: "☀ Light mode", signIn: "Sign in", signUp: "Sign up",
    libraryEyebrow: "Question library", libraryTitle: "Question library", libraryDescription: "Answer out loud, open the details, and compare your reasoning with an answer backed by official sources.",
    search: "Search questions", searchPlaceholder: "Example: final or runtime", topic: "Topic", allTopics: "All topics", difficulty: "Difficulty", allDifficulties: "All levels", progressFilter: "Question progress", allProgress: "All progress", favoriteOnly: "Favorites only", available: "questions available.", startSession: "Start review session", prepareSession: "Prepare a review session", noResults: "No matching results", expandFilters: "Try changing the search or widening the filters.",
    topicsEyebrow: "Flutter track", topicsTitle: "Topics", topicsDescription: "Browse the concepts that commonly appear in Flutter interviews.", availableQuestions: "questions currently available for review.", viewQuestions: "View questions →",
    homeEyebrow: "Flutter track is ready", homeTitle: "Walk into the interview with your answers organized.", homeLead: "Curated technical questions, clear explanations, and official references that help you understand instead of memorizing.", startReview: "Start reviewing", exploreTopics: "Explore topics", currentQuestions: "questions in the first release", firstTopic: "First topic in the Flutter track.", featuredTitle: "Start with a Dart question", featuredLead: "A short answer first, then a deeper explanation and an official source.", allQuestions: "All questions", answerPrompt: "Answer from memory, then reveal the explanation and compare your reasoning.", readAnswer: "Read the full answer →",
    sessionEyebrow: "Review session", sessionTitle: "Review session", sessionDescription: "Choose a topic and level, then review in order without a timer or randomization.", chooseTopic: "Choose a topic", chooseDifficulty: "Choose a level", preparing: "Preparing the session…", question: "Question", of: "of", previous: "Previous question", next: "Next question", noCombination: "No questions match this combination", startStudy: "Start a review session", selectSession: "Choose a topic and level to prepare the questions in order.",
    interviewEyebrow: "Full Flutter interview", interviewTitle: "Build a complete interview", interviewDescription: "Choose multiple topics and one level. A higher level includes its own questions and all lower levels.", chooseTopics: "Choose topics", selected: "selected", interviewLevel: "Interview level", inclusiveHint: "The selected level includes every lower level.", preparingInterview: "Preparing the interview…", completeSetup: "Finish setting up the interview", startInterview: "Start full interview", interviewEmpty: "Choose at least one topic and an interview level to prepare your questions.",
    progressEyebrow: "Your progress on this device", progressTitle: "Progress", progressDescription: "Your state is stored on this device only. No account or data upload is required.", reviewed: "Reviewed", continueReview: "Continue reviewing", reviewing: "Reviewing", mastered: "Mastered", favorites: "Favorites", noQuestions: "No questions here yet.", resetTitle: "Reset local data", resetDescription: "Clears question progress and favorites only.", reset: "Reset progress", resetConfirm: "Are you sure you want to clear progress and favorites on this device?",
    backLibrary: "← Question library", lastReviewed: "Last reviewed", staleReview: "Check the source before your interview if this review date is old.", progressLegend: "Question progress", favorite: "Save to favorites", saved: "Progress saved on this device", reveal: "Reveal answer", hide: "Hide answer", shortAnswer: "Short answer", explanation: "Explanation", code: "Code example", mistakes: "Common mistakes", followUps: "Follow-up questions", sources: "Sources", notFound: "Question not found", footer: "Original content with official references.", language: "العربية",
  },
} as const;

export function localeFromPathname(pathname: string): Locale {
  return pathname.split("/").filter(Boolean).find((segment) => segment === "en" || segment === "ar") === "en" ? "en" : "ar";
}

export function localizedHref(locale: Locale, path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${normalized === "/" ? "/" : normalized}`;
}

export function localeDirection(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

export function topicName(locale: Locale, topicId: string): string {
  return topicTranslations[locale][topicId] ?? topicId;
}

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US").format(value);
}

export function formatDate(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", { dateStyle: "medium" }).format(new Date(`${value}T00:00:00Z`));
}
