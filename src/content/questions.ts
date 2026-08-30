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
  codeExample?: string;
  commonMistakes?: string[];
  followUpQuestions?: string[];
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
    codeExample: `final currentTime = DateTime.now();
const apiVersion = 2;
const point = Point(1, 2);`,
    commonMistakes: [
      "اعتبار final قيمة ثابتة وقت الترجمة؛ هي فقط تُسند مرة واحدة.",
      "استخدام const مع قيمة لا يمكن حسابها وقت الترجمة مثل DateTime.now().",
    ],
    followUpQuestions: [
      "هل يمكن أن تتغير محتويات List مُسندة إلى متغير final؟",
      "ما المقصود بـ canonical instances عند استخدام const؟",
    ],
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

export function validateQuestions(interviewQuestions: InterviewQuestion[]): void {
  const ids = new Set<string>();
  const slugs = new Set<string>();

  for (const question of interviewQuestions) {
    if (
      requiredText.some((field) => !question[field]?.trim()) ||
      question.topicIds.length === 0 ||
      question.sources.length === 0 ||
      question.sources.some((source) => !source.title.trim() || !source.url.trim())
    ) {
      throw new Error(`Question ${question.id || "unknown"} is missing required data`);
    }

    if (ids.has(question.id) || slugs.has(question.slug)) {
      throw new Error(`Question ${question.id} has a duplicate id or slug`);
    }

    ids.add(question.id);
    slugs.add(question.slug);
  }
}

validateQuestions(questions);

export function getQuestion(slug: string): InterviewQuestion | undefined {
  return questions.find((question) => question.slug === slug);
}

export function getQuestionTopics(question: InterviewQuestion): Topic[] {
  return topics.filter((topic) => question.topicIds.includes(topic.id));
}
