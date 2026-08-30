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
  {
    id: "dart-002",
    slug: "var-vs-dynamic-in-dart",
    trackId: "flutter",
    topicIds: ["dart"],
    difficulty: "Junior",
    question: "ما الفرق بين var و dynamic في Dart؟",
    shortAnswer:
      "var تحدد نوع المتغير مرة واحدة وقت الترجمة بالاستنتاج (Type Inference)، بينما dynamic تُلغي فحص الأنواع وقت الترجمة وتسمح بتغيير نوع القيمة وقت التشغيل.",
    explanation:
      "عند استخدام var مع تعيين قيمة أولية، يستنتج Dart نوع المتغير ولا يمكنك تعيين قيمة من نوع آخر لاحقًا. أما dynamic فتخبر المترجم بتقبل أي نوع وأي استدعاء ميثود، ويتأجل التحقق من صحة الاستدعاء إلى وقت التشغيل مما قد يسبب Runtime Errors إذا لم تكن الميثود موجودة.",
    codeExample: `var name = "Dart"; // type is String
// name = 123; // Error: A value of type 'int' can't be assigned to 'String'

dynamic value = "Dart";
value = 123; // Allowed`,
    commonMistakes: [
      "اعتبار var تماثل dynamic؛ var تنشئ متغيرًا محدد النوع بعد الاستنتاج.",
      "الإفراط في استخدام dynamic مما يفقدك حماية نظام الأنواع Strong Type System في Dart.",
    ],
    followUpQuestions: [
      "متى يكون استخدام dynamic مطلوبًا بالفعل؟",
      "ما الفرق بين Object و dynamic في Dart؟",
    ],
    sources: [
      {
        title: "Dart language — Types",
        url: "https://dart.dev/language/type-system",
      },
    ],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "dart-003",
    slug: "nullable-and-non-nullable-types-in-dart",
    trackId: "flutter",
    topicIds: ["dart"],
    difficulty: "Junior",
    question: "إزاي يشتغل نظام Null Safety في Dart؟",
    shortAnswer: "النوع غير القابل لـ null مثل String لا يقبل null، ولما القيمة تكون اختيارية بنكتب String? ونفحصها قبل الاستخدام.",
    explanation: "Null Safety يخلّي المترجم يكتشف أغلب أخطاء null قبل التشغيل. استخدم ? للنوع القابل لـ null، وخلّي التحويل إلى نوع غير قابل لـ null بعد شرط واضح. عامل ! يجبر المترجم على الثقة فيك، لكنه يرمي خطأ وقت التشغيل لو القيمة كانت null بالفعل.",
    codeExample: `String? nickname;
if (nickname != null) {
  print(nickname.length);
}`,
    commonMistakes: ["استخدام ! كحل دائم بدل فحص القيمة أو تصميم النوع بشكل أوضح.", "اعتبار String? مساويًا لـ String؛ الأول يحتاج تعاملًا صريحًا مع null."],
    followUpQuestions: ["ما الفرق بين ?? و ?. في التعامل مع القيم الاختيارية؟"],
    sources: [{ title: "Dart language — Sound null safety", url: "https://dart.dev/null-safety" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "dart-004",
    slug: "late-variables-in-dart",
    trackId: "flutter",
    topicIds: ["dart"],
    difficulty: "Mid",
    question: "متى نستخدم late في Dart وما مخاطرتها؟",
    shortAnswer: "late تؤجل تهيئة متغير غير قابل لـ null، لكن قراءة المتغير قبل إسناده تسبب LateInitializationError وقت التشغيل.",
    explanation: "استخدم late عندما تكون متأكدًا أن القيمة ستُجهّز قبل أول قراءة، مثل قيمة تُحسب داخل دورة حياة كائن. الكلمة لا تلغي الحاجة للتهيئة؛ هي فقط تنقل التحقق من وقت الترجمة إلى وقت التشغيل، لذلك لا تصلح لإخفاء ترتيب تهيئة غير واضح.",
    codeExample: `late final String token;
void configure() {
  token = loadToken();
}`,
    commonMistakes: ["استخدام late لمجرد إسكات المترجم من غير ضمان ترتيب التهيئة.", "نسيان أن late final لا يمكن إسنادها مرتين."],
    followUpQuestions: ["إيه الفرق بين late و nullable variable في تصميم API؟"],
    sources: [{ title: "Dart language — Late variables", url: "https://dart.dev/language/variables#late-variables" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "dart-005",
    slug: "object-and-type-safety-in-dart",
    trackId: "flutter",
    difficulty: "Mid",
    topicIds: ["dart"],
    question: "ليه Object غالبًا أكثر أمانًا من dynamic في Dart؟",
    shortAnswer: "Object يقبل أي قيمة غير null مع الحفاظ على فحص النوع، بينما dynamic يسمح باستدعاءات غير متحققة قد تفشل وقت التشغيل.",
    explanation: "استخدم Object عندما تحتاج تخزين قيم من أنواع مختلفة لكنك تريد أن يطلب منك المترجم فحص النوع قبل استدعاء خصائص أو ميثود. استخدم dynamic فقط عند التعامل مع API أو بيانات لا يمكن وصفها بشكل أفضل، لأنك تتنازل عندها عن جزء كبير من أمان الأنواع.",
    codeExample: `Object value = "Dart";
if (value is String) {
  print(value.length);
}`,
    commonMistakes: ["اعتبار Object و dynamic نفس الشيء لأن الاثنين يقبلان أنواعًا متعددة.", "اختيار dynamic بدل union-like design أو type check واضح."],
    followUpQuestions: ["كيف يساعد promotion بعد is في كتابة كود آمن؟"],
    sources: [{ title: "Dart language — Built-in types", url: "https://dart.dev/language/built-in-types" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "dart-006",
    slug: "list-set-and-map-in-dart",
    trackId: "flutter",
    difficulty: "Junior",
    topicIds: ["dart"],
    question: "إمتى تختار List أو Set أو Map في Dart؟",
    shortAnswer: "List للترتيب والوصول بالفهرس، Set للقيم الفريدة، وMap للوصول إلى قيمة باستخدام مفتاح.",
    explanation: "اختيار collection يعبر عن قاعدة البيانات التي تحتاجها. List تحفظ ترتيب العناصر وقد تحتوي على تكرار، Set تمنع التكرار وتناسب membership checks، وMap تربط key بقيمة ويجب أن تكون المفاتيح مناسبة للمقارنة. لا تختار النوع لمجرد أنه الأكثر شيوعًا.",
    codeExample: `final names = <String>["Ali", "Mona"];
final tags = <String>{"flutter", "dart"};
final scores = <String, int>{"Ali": 90};`,
    commonMistakes: ["استخدام List ثم البحث الخطي عن قيمة يجب أن تكون فريدة.", "نسيان أن Map لا تضمن منطقًا مناسبًا للمفاتيح القابلة للتغيير."],
    followUpQuestions: ["كيف تتعامل مع collection غير قابلة للتعديل؟"],
    sources: [{ title: "Dart language — Collections", url: "https://dart.dev/language/collections" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "dart-007",
    slug: "spread-and-collection-if-in-dart",
    trackId: "flutter",
    difficulty: "Mid",
    topicIds: ["dart"],
    question: "ما فائدة spread و collection-if في Dart؟",
    shortAnswer: "هما يخلّيا بناء collection أكثر وضوحًا: spread يضيف عناصر collection أخرى، وcollection-if يضيفها بشرط أثناء الإنشاء.",
    explanation: "استخدم ... لنسخ عناصر collection داخل collection جديدة، و...? عندما تكون collection المصدر قابلة لـ null. أما collection-if وcollection-for فيضيفان عناصر بناءً على شرط أو تكرار من غير إنشاء قوائم مؤقتة كثيرة، وده مفيد في تكوين بيانات الواجهة.",
    codeExample: `final base = ["Dart"];
final topics = [
  ...base,
  if (includeFlutter) "Flutter",
];`,
    commonMistakes: ["الخلط بين إضافة collection نفسها وإضافة عناصرها باستخدام spread.", "استخدام spread قابل لـ null من غير ...? أو فحص مناسب."],
    followUpQuestions: ["ما الفرق بين collection-if وشرط يضيف قائمة كاملة؟"],
    sources: [{ title: "Dart language — Collections", url: "https://dart.dev/language/collections" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "dart-008",
    slug: "named-and-optional-parameters-in-dart",
    trackId: "flutter",
    difficulty: "Junior",
    topicIds: ["dart"],
    question: "إيه الفرق بين named و positional optional parameters في Dart؟",
    shortAnswer: "الـnamed parameters تُمرر باسمها وتوضح النية، بينما positional optional تعتمد على ترتيبها ويمكن تحديد قيمة افتراضية لها.",
    explanation: "استخدم named parameters عندما تكون القراءة والتمييز أهم، خصوصًا مع أكثر من خيار اختياري. يمكن جعل named parameter مطلوبًا باستخدام required، ويمكن وضع قيمة افتراضية للـoptional positional أو named. تصميم التوقيع الجيد يقلل تمرير قيم في ترتيب يصعب مراجعته.",
    codeExample: `void greet(String name, {String punctuation = "!"}) {
  print("Hello $name$punctuation");
}

greet("Dart", punctuation: ".");`,
    commonMistakes: ["اعتبار كل named parameter اختياريًا؛ required يغير ذلك.", "الإفراط في positional parameters يجعل استدعاء الدالة غير واضح."],
    followUpQuestions: ["إزاي تعمل parameter مطلوب مع قيمة nullable؟"],
    sources: [{ title: "Dart language — Functions", url: "https://dart.dev/language/functions" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "dart-009",
    slug: "cascade-notation-in-dart",
    trackId: "flutter",
    difficulty: "Mid",
    topicIds: ["dart"],
    question: "ما هي cascade notation في Dart ومتى تكون مناسبة؟",
    shortAnswer: "cascade تسمح بتنفيذ عدة عمليات على نفس الكائن دون تكرار اسمه، باستخدام .. أو ?.. عندما يكون الكائن nullable.",
    explanation: "الـcascade تجعل تهيئة كائن أو تعديل خصائصه متتابعًا وواضحًا. التعبير يرجع الكائن الأصلي، لذلك لا تخلط بينه وبين سلسلة ميثودز ترجع قيمًا مختلفة. استخدمها عندما تقلل التكرار من غير أن تخفي تدفقًا مهمًا أو تجعل التعبير طويلًا.",
    codeExample: `final buffer = StringBuffer()
  ..write("Dart")
  ..write(" ")
  ..write("Interview");`,
    commonMistakes: ["توقع أن cascade ترجع نتيجة آخر استدعاء بدل الكائن الأصلي.", "استخدام cascade طويلة تخفي خطوات لها معنى مستقل."],
    followUpQuestions: ["متى تستخدم ?.. بدل ..؟"],
    sources: [{ title: "Dart language — Cascade notation", url: "https://dart.dev/language/operators#cascade-notation" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "dart-010",
    slug: "classes-constructors-and-factory-in-dart",
    trackId: "flutter",
    difficulty: "Senior",
    topicIds: ["dart"],
    question: "إيه دور factory constructor في Dart مقارنة بالـgenerative constructor؟",
    shortAnswer: "الـgenerative constructor ينشئ instance من نفس الكلاس، بينما factory يمكنه إرجاع instance موجودة أو من subclass أو تنفيذ منطق اختيار قبل الإرجاع.",
    explanation: "استخدم generative constructor عندما تريد إنشاء object وتهيئة حقوله مباشرة. factory لا يملك وصولًا مباشرًا إلى this قبل الإرجاع، لكنه مناسب للـcaching أو parsing أو اختيار implementation. وجود factory لا يعني تلقائيًا أن هناك singleton؛ القرار يعتمد على منطق الكلاس.",
    codeExample: `class User {
  final String id;
  User._(this.id);

  factory User.fromJson(Map<String, Object?> json) {
    return User._(json["id"]! as String);
  }
}`,
    commonMistakes: ["اعتبار factory دائمًا singleton.", "نسيان أن factory لا يستطيع استخدام this قبل إنشاء الكائن."],
    followUpQuestions: ["إمتى يكون named constructor أبسط من factory؟"],
    sources: [{ title: "Dart language — Constructors", url: "https://dart.dev/language/constructors" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "dart-011",
    slug: "extension-methods-in-dart",
    trackId: "flutter",
    difficulty: "Senior",
    topicIds: ["dart"],
    question: "كيف تضيف سلوكًا لنوع موجود باستخدام extension في Dart؟",
    shortAnswer: "extension تضيف ميثودز أو getters لنوع موجود من غير تعديل الكلاس الأصلي أو إنشاء subclass، وتُحسم الاستدعاءات حسب النوع الثابت.",
    explanation: "الـextension مفيدة لتجميع تحويل أو سلوك صغير قريب من النوع الذي يعمل عليه. هي لا تضيف state ولا تغيّر واجهة الكلاس فعليًا، كما أن اختيار extension يعتمد على static type؛ لذلك لا تستخدمها لبناء polymorphism يحتاج dispatch وقت التشغيل.",
    codeExample: `extension StringParsing on String {
  int? toSafeInt() => int.tryParse(this);
}

final count = "42".toSafeInt();`,
    commonMistakes: ["توقع أن extension تضيف حقولًا أو state للكائن.", "نسيان تأثير static type عند وجود extension بنفس الاسم."],
    followUpQuestions: ["ما الفرق بين extension وmixin في هدف التصميم؟"],
    sources: [{ title: "Dart language — Extension methods", url: "https://dart.dev/language/extension-methods" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "dart-012",
    slug: "async-await-and-futures-in-dart",
    trackId: "flutter",
    difficulty: "Mid",
    topicIds: ["dart"],
    question: "إزاي async و await بيتعاملوا مع Future في Dart؟",
    shortAnswer: "الدالة async ترجع Future، وawait ينتظر اكتمال Future داخل الدالة من غير حجز خيط التنفيذ، مع تمرير النتيجة أو الخطأ بشكل واضح.",
    explanation: "Future يمثل نتيجة قد تصل لاحقًا. await يوقف استكمال الدالة الحالية حتى تكتمل العملية، لكنه لا يحول العملية إلى synchronous ولا يجمّد event loop. تعامل مع الأخطاء باستخدام try/catch، وتأكد أن كل Future مهم إما awaited أو تتم إدارته صراحة.",
    codeExample: `Future<String> loadName() async {
  final response = await fetchName();
  return response;
}

try {
  final name = await loadName();
} catch (error) {
  handle(error);
}`,
    commonMistakes: ["اعتبار await معناه تشغيل العملية على isolate آخر.", "نسيان await ثم التعامل مع Future كأنه القيمة النهائية."],
    followUpQuestions: ["إمتى تستخدم Future.wait بدل انتظار العمليات واحدة تلو الأخرى؟"],
    sources: [{ title: "Dart language — Asynchronous programming", url: "https://dart.dev/language/async" }],
    lastReviewedAt: "2026-08-30",
  },
];

const requiredQuestionFields = [
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
  const trackIds = new Set(tracks.map((track) => track.id));
  const topicById = new Map(topics.map((topic) => [topic.id, topic]));

  for (const question of interviewQuestions) {
    if (
      requiredQuestionFields.some((field) => !question[field]?.trim()) ||
      question.topicIds.length === 0 ||
      question.sources.length === 0 ||
      question.sources.some((source) => !source.title.trim() || !source.url.trim())
    ) {
      throw new Error(`Question ${question.id || "unknown"} is missing required data`);
    }

    if (!trackIds.has(question.trackId) || question.topicIds.some((topicId) => topicById.get(topicId)?.trackId !== question.trackId)) {
      throw new Error(`Question ${question.id || "unknown"} has an invalid Track or Topic reference`);
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
