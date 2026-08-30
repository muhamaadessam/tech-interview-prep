export type DifficultyLevel = "Junior" | "Mid" | "Senior";

export type Track = {
  id: string;
  slug: string;
  name: string;
};

export type Topic = {
  id: string;
  slug: string;
  trackId: Track["id"];
  name: string;
};

export type InterviewQuestion = {
  id: string;
  slug: string;
  trackId: Track["id"];
  topicIds: Topic["id"][];
  difficulty: DifficultyLevel;
  question: string;
  shortAnswer: string;
  explanation: string;
  sources: { title: string; url: string }[];
  lastReviewedAt: string;
};

export const tracks: Track[] = [
  { id: "flutter", slug: "flutter", name: "Flutter" },
];

export const topics: Topic[] = [
  { id: "dart", slug: "dart", trackId: "flutter", name: "Dart" },
];

export const questions: InterviewQuestion[] = [
  {
    id: "dart-001",
    slug: "final-vs-const-in-dart",
    trackId: "flutter",
    topicIds: ["dart"],
    difficulty: "Junior",
    question: "ما الفرق بين final و const في Dart؟",
    shortAnswer:
      "final تعني أن المتغير يُسند مرة واحدة وقت التشغيل، بينما const تنشئ قيمة ثابتة وقت الترجمة.",
    explanation:
      "استخدم final عندما لا تتغير الإشارة بعد تعيينها لكن القيمة لا تُعرف إلا وقت التشغيل، مثل نتيجة طلب أو الوقت الحالي. استخدم const عندما تكون القيمة وكل مكوناتها معروفة وقت الترجمة؛ والقيم المتطابقة من const يمكن أن تشترك في نفس النسخة canonical.",
    sources: [
      {
        title: "Dart language — Variables",
        url: "https://dart.dev/language/variables#final-and-const",
      },
    ],
    lastReviewedAt: "2026-08-30",
  },
];

const requiredText = [
  "id",
  "slug",
  "trackId",
  "difficulty",
  "question",
  "shortAnswer",
  "explanation",
  "lastReviewedAt",
] as const;

export function validateQuestions(items: InterviewQuestion[]): void {
  const ids = new Set<string>();
  const slugs = new Set<string>();

  for (const item of items) {
    if (
      requiredText.some((field) => !item[field]?.trim()) ||
      item.topicIds.length === 0 ||
      item.sources.length === 0 ||
      item.sources.some((source) => !source.title.trim() || !source.url.trim())
    ) {
      throw new Error(`Question ${item.id || "unknown"} is missing required data`);
    }

    if (ids.has(item.id) || slugs.has(item.slug)) {
      throw new Error(`Question ${item.id} has a duplicate id or slug`);
    }

    ids.add(item.id);
    slugs.add(item.slug);
  }
}

validateQuestions(questions);

export function getQuestion(slug: string): InterviewQuestion | undefined {
  return questions.find((question) => question.slug === slug);
}
