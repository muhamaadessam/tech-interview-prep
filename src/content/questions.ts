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
  { id: "oop", slug: "oop", trackId: "flutter", name: "OOP" },
  { id: "solid", slug: "solid", trackId: "flutter", name: "SOLID" },
  { id: "flutter-fundamentals", slug: "flutter-fundamentals", trackId: "flutter", name: "Flutter Fundamentals" },
  { id: "widgets", slug: "widgets", trackId: "flutter", name: "Widgets" },
  { id: "state-management", slug: "state-management", trackId: "flutter", name: "State Management" },
  { id: "navigation", slug: "navigation", trackId: "flutter", name: "Navigation" },
  { id: "networking", slug: "networking", trackId: "flutter", name: "Networking" },
  { id: "local-storage", slug: "local-storage", trackId: "flutter", name: "Local Storage" },
  { id: "platform-integration", slug: "platform-integration", trackId: "flutter", name: "Platform Integration" },
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
  {
    id: "oop-001",
    slug: "class-and-object-in-dart",
    trackId: "flutter",
    topicIds: ["oop"],
    difficulty: "Junior",
    question: "إيه الفرق بين class و object في Dart؟",
    shortAnswer: "الـclass هو تعريف للبيانات والسلوك، والـobject هو instance فعلية منشأة من هذا التعريف.",
    explanation: "الكلاس يحدد الحقول والميثودز والـconstructors التي تشترك فيها instances. عند استدعاء constructor ينشئ Dart object له state مستقل، حتى لو كان أكثر من object مبنيًا من نفس الكلاس.",
    codeExample: `class Candidate {
  final String name;
  Candidate(this.name);
}

final candidate = Candidate("Mona");`,
    commonMistakes: ["اعتبار class نفسه قيمة يمكن تعديل state الخاص بها.", "نسيان أن كل instance تملك state خاصًا بها."],
    followUpQuestions: ["أين تضع السلوك الذي لا يعتمد على instance state؟"],
    sources: [
      { title: "Dart language — Classes", url: "https://dart.dev/language/classes" },
    ],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "oop-002",
    slug: "encapsulation-and-private-members-in-dart",
    trackId: "flutter",
    topicIds: ["oop"],
    difficulty: "Junior",
    question: "إزاي نطبق Encapsulation في Dart؟",
    shortAnswer: "نخفي تفاصيل التغيير خلف API صغيرة، وتُعد الأسماء التي تبدأ بـ _ خاصة بالـlibrary في Dart.",
    explanation: "Encapsulation ليست مجرد جعل الحقول private؛ الفكرة أن الكلاس يحافظ على invariants ويمنح المستهلك عمليات صحيحة لتعديل state. خصوصية Dart مرتبطة بالـlibrary، لذلك صمّم حدود الملفات والواجهات بعناية ولا تعتمد على setter لكل حقل.",
    codeExample: `class Score {
  int _value = 0;

  void add(int points) {
    if (points > 0) _value += points;
  }

  int get value => _value;
}`,
    commonMistakes: ["تعريض كل state عبر public setters وإضاعة قواعد الكلاس.", "اعتبار _private على مستوى object فقط؛ هو private للـlibrary."],
    followUpQuestions: ["متى يكون getter محسوبًا أفضل من كشف field؟"],
    sources: [
      { title: "Dart language — Classes", url: "https://dart.dev/language/classes" },
    ],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "oop-003",
    slug: "composition-vs-inheritance-in-flutter",
    trackId: "flutter",
    topicIds: ["oop", "widgets"],
    difficulty: "Mid",
    question: "إمتى تختار composition بدل inheritance في كود Flutter؟",
    shortAnswer: "اختر composition عندما تجمع سلوكيات مستقلة وتريد تغييرها أو اختبارها، واستخدم inheritance لعلاقة is-a مستقرة وواضحة.",
    explanation: "Composition تبني object من collaborators وتقلل coupling إلى implementation base class. Inheritance مفيدة عندما يفرض framework contract أو توجد علاقة تخصص حقيقية، لكنها تجعل التغيير في base class يؤثر على subclasses؛ لذلك لا تستخدمها لمشاركة كود صغير فقط.",
    codeExample: `class LoginController {
  LoginController(this.validator);
  final Validator validator;
}

abstract interface class Validator {
  bool isValid(String value);
}`,
    commonMistakes: ["وراثة كلاس فقط لإعادة استخدام ميثود واحدة.", "تحويل composition إلى طبقات كثيرة من غير حدود مفهومة."],
    followUpQuestions: ["كيف تختبر collaborator في تصميم قائم على composition؟"],
    sources: [
      { title: "Dart language — Classes", url: "https://dart.dev/language/classes" },
      { title: "Flutter FAQ — Programming paradigm", url: "https://docs.flutter.dev/resources/faq#what-programming-paradigm-does-flutters-framework-use" },
    ],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "oop-004",
    slug: "polymorphism-and-interfaces-in-dart",
    trackId: "flutter",
    topicIds: ["oop"],
    difficulty: "Mid",
    question: "كيف نستخدم Polymorphism في Dart من غير ربط الكود بتطبيق واحد؟",
    shortAnswer: "عرّف contract مشتركًا، واجعل الكود المستعمل يتعامل مع النوع المجرد بينما توفر implementations مختلفة نفس السلوك.",
    explanation: "Polymorphism يسمح باستدعاء نفس العملية على implementations مختلفة من خلال interface أو abstract class. في Dart كل class يعرّف interface ضمنيًا، ويمكن استخدام abstract interface class لتوضيح أن المستهلك يعتمد على contract لا على constructor أو تفاصيل التنفيذ.",
    codeExample: `abstract interface class Formatter {
  String format(String value);
}

String render(Formatter formatter, String value) => formatter.format(value);`,
    commonMistakes: ["فحص نوع concrete داخل كل مستهلك بدل الاعتماد على contract.", "إضافة interface لا يملك أكثر من implementation ولا يحتاج نقطة تغيير."],
    followUpQuestions: ["ما الفرق بين runtime dispatch و static extension dispatch؟"],
    sources: [{ title: "Dart language — Class modifiers", url: "https://dart.dev/language/class-modifiers" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "oop-005",
    slug: "abstract-class-and-interface-in-dart",
    trackId: "flutter",
    topicIds: ["oop"],
    difficulty: "Mid",
    question: "ما الفرق العملي بين abstract class و abstract interface class في Dart؟",
    shortAnswer: "abstract class تصلح كأساس للمشاركة والوراثة، بينما abstract interface class توضح أن الهدف هو تعريف contract يمكن تطبيقه من غير وراثة implementation.",
    explanation: "الاثنان لا يمكن إنشاء instance منهما مباشرة. abstract class قد تحتوي implementation وحقولًا مشتركة، أما abstract interface class فتمنع استخدامها كـbase class خارج المكتبة وتعبّر عن اعتماد المستهلك على الواجهة فقط؛ اختر modifier حسب الحد الذي تريد فرضه.",
    commonMistakes: ["اعتبار abstract interface class مجرد اسم مختلف بلا أثر تصميمي.", "استخدام abstract class كحاوية utility عامة بلا علاقة وراثة واضحة."],
    followUpQuestions: ["متى يكون class modifier final أو sealed أنسب؟"],
    sources: [{ title: "Dart language — Class modifiers", url: "https://dart.dev/language/class-modifiers" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "oop-006",
    slug: "mixins-and-reusable-behavior-in-dart",
    trackId: "flutter",
    topicIds: ["oop"],
    difficulty: "Senior",
    question: "متى يكون mixin مناسبًا لمشاركة سلوك في Dart؟",
    shortAnswer: "mixin مناسب لسلوك أفقي صغير يمكن تركيبه على classes متعددة من غير ادعاء علاقة وراثة، مع تحديد on عندما يحتاج نوعًا أساسيًا معينًا.",
    explanation: "المـixin يضيف implementation إلى class عبر with، ويمنع تكرار سلوك مشترك لا يمثل is-a relationship. اجعله مركزًا ومحدودًا، واستخدم on فقط عندما يعتمد السلوك فعلًا على contract محدد؛ mixin ضخم يتحول إلى base class مخفي.",
    codeExample: `mixin Loggable {
  void log(String message) => print(message);
}

class ApiClient with Loggable {}`,
    commonMistakes: ["استخدام mixin لتجميع state وعلاقات كثيرة غير مترابطة.", "نسيان أن ترتيب mixins قد يؤثر على override resolution."],
    followUpQuestions: ["ما الفرق بين mixin وextension method؟"],
    sources: [{ title: "Dart language — Mixins", url: "https://dart.dev/language/mixins" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "oop-007",
    slug: "equality-and-hashcode-for-dart-objects",
    trackId: "flutter",
    topicIds: ["oop"],
    difficulty: "Senior",
    question: "إزاي تعرّف equality صحيحة لـ value object في Dart؟",
    shortAnswer: "override == وhashCode معًا باستخدام نفس الحقول التي تحدد الهوية المنطقية، ولا تغيّر هذه الحقول أثناء استخدام object كمفتاح.",
    explanation: "الـSet والـMap يعتمدان على اتساق == مع hashCode: لو كائنان متساويان يجب أن يكون لهما hashCode واحد. قارن الأنواع والحقول المهمة فقط، وحافظ على immutability للحقول التي تدخل في الهوية حتى لا يصبح المفتاح غير قابل للوصول.",
    codeExample: `final class Point {
  const Point(this.x, this.y);
  final int x;
  final int y;

  @override bool operator ==(Object other) =>
      other is Point && other.x == x && other.y == y;
  @override int get hashCode => Object.hash(x, y);
}`,
    commonMistakes: ["override == من غير hashCode.", "استخدام mutable fields في hashCode ثم تعديلها داخل Set أو Map."],
    followUpQuestions: ["لماذا يجب فحص runtime type قبل مقارنة الحقول؟"],
    sources: [
      { title: "Dart API — Object ==", url: "https://api.dart.dev/dart-core/Object/operator_equals.html" },
      { title: "Dart API — Object.hashCode", url: "https://api.dart.dev/dart-core/Object/hashCode.html" },
    ],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "oop-008",
    slug: "immutable-value-objects-in-dart",
    trackId: "flutter",
    topicIds: ["oop"],
    difficulty: "Senior",
    question: "إيه فوائد immutable value objects في تطبيق Flutter؟",
    shortAnswer: "القيم غير القابلة للتعديل أسهل في المقارنة والاختبار وتتبع تغييرات الواجهة، وتقلل الآثار الجانبية بين أجزاء التطبيق.",
    explanation: "اجعل الحقول final، وفّر constructor واضحًا، وأعد instance جديدة عند التغيير بدل تعديل القديمة. هذا يجعل state transitions صريحة ويقلل مفاجآت rebuilds، لكن لا تحوّل كل object إلى immutable بلا حاجة؛ الصور والموارد ذات lifecycle مختلف.",
    commonMistakes: ["تجميد reference مع إبقاء List داخلية قابلة للتعديل.", "اعتبار إنشاء نسخة جديدة حلًا لمشكلة أداء قبل القياس."],
    followUpQuestions: ["كيف تحمي collection داخل value object من التعديل الخارجي؟"],
    sources: [{ title: "Dart Blog — An intro to immutability", url: "https://dart.dev/blog/an-intro-to-immutability-with-dart" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "solid-001",
    slug: "single-responsibility-in-flutter",
    trackId: "flutter",
    topicIds: ["solid"],
    difficulty: "Junior",
    question: "إزاي نطبق Single Responsibility Principle في شاشة Flutter؟",
    shortAnswer: "خلي كل وحدة تملك سبب تغيير واحد؛ الشاشة تنسق العرض، والخدمات أو controllers تملك منطق البيانات المناسب لها.",
    explanation: "SRP لا يعني أن كل class يحتوي ميثود واحدة. اسأل: هل تغييرات تصميم الواجهة وتغييرات API ستجبر نفس الملف على التعديل؟ فصل orchestration عن data access وعن presentation يجعل الكود أوضح وأسهل في الاختبار من غير طبقات شكلية.",
    commonMistakes: ["تقسيم كل سطر إلى class جديد بلا سبب تغيير حقيقي.", "ترك parsing وطلبات الشبكة داخل build method."],
    followUpQuestions: ["ما العلامة التي تقول إن الفصل زاد عن حاجته؟"],
    sources: [
      { title: "Flutter docs — App architecture", url: "https://docs.flutter.dev/app-architecture" },
      { title: "Robert C. Martin — Solid Relevance", url: "https://blog.cleancoder.com/uncle-bob/2020/10/18/Solid-Relevance.html" },
    ],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "solid-002",
    slug: "open-closed-principle-for-renderers",
    trackId: "flutter",
    topicIds: ["solid"],
    difficulty: "Mid",
    question: "كيف يساعد Open/Closed Principle عند إضافة أنواع UI جديدة؟",
    shortAnswer: "صمّم نقطة امتداد تضيف implementation جديدة من غير تعديل منطق قديم ومستقر، لكن لا تبنِ abstraction قبل ظهور variation حقيقي.",
    explanation: "بدل if أو switch يتضخم مع كل نوع، يمكن تعريف contract للمصدر أو renderer وإضافة implementation جديدة. OCP ليس منع كل تعديل؛ الكود نفسه يجب أن يتغير عندما يتغير المتطلب، والفائدة تظهر عندما يكون محور التغيير معروفًا ومكررًا.",
    codeExample: `abstract interface class CardRenderer {
  String render();
}

String buildCard(CardRenderer renderer) => renderer.render();`,
    commonMistakes: ["إنشاء factory وinterface لفرع واحد لا يتغير.", "إخفاء switch داخل abstraction من غير تقليل تكلفة التغيير."],
    followUpQuestions: ["إمتى يكون switch الواضح أفضل من polymorphism؟"],
    sources: [
      { title: "Flutter docs — Design patterns", url: "https://docs.flutter.dev/app-architecture/design-patterns" },
      { title: "Robert C. Martin — Solid Relevance", url: "https://blog.cleancoder.com/uncle-bob/2020/10/18/Solid-Relevance.html" },
    ],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "solid-003",
    slug: "liskov-substitution-in-dart",
    trackId: "flutter",
    topicIds: ["solid"],
    difficulty: "Mid",
    question: "ما معنى Liskov Substitution Principle في كود Dart؟",
    shortAnswer: "أي subtype يجب أن يحل محل الـbase contract من غير كسر توقعات المستهلك في النتائج أو القيود أو الأخطاء.",
    explanation: "لو implementation ترمي UnsupportedError لميثود يفرضها base interface أو تقبل مدخلات أضيق من العقد، فهي غالبًا ليست subtype صالحًا. أصلح العقد ليعبّر عن القدرات الحقيقية أو استخدم interfaces أصغر بدل إجبار كل implementation على سلوك لا يملكه.",
    commonMistakes: ["اعتبار inheritance صحيحًا لمجرد أن الكود يترجم.", "إرجاع null أو خطأ مفاجئ بدل contract متوقع."],
    followUpQuestions: ["كيف تكشف اختبارًا أن implementation كسرت LSP؟"],
    sources: [
      { title: "Dart language — Class modifiers", url: "https://dart.dev/language/class-modifiers" },
      { title: "Robert C. Martin — Solid Relevance", url: "https://blog.cleancoder.com/uncle-bob/2020/10/18/Solid-Relevance.html" },
    ],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "solid-004",
    slug: "interface-segregation-in-flutter",
    trackId: "flutter",
    topicIds: ["solid"],
    difficulty: "Mid",
    question: "إزاي نطبق Interface Segregation في طبقة بيانات Flutter؟",
    shortAnswer: "قسّم contract الكبير إلى capabilities صغيرة يحتاجها المستهلك فعلًا، بدل إجبار class على تنفيذ عمليات لا يستخدمها.",
    explanation: "interface صغيرة مثل UserReader وUserWriter تسمح للـview model بالاعتماد على القراءة فقط، وللاختبار بتوفير fake أصغر. لا تقسّم كل ميثود في interface منفصلة؛ اجمع العمليات التي تتغير معًا ولها نفس المستهلك.",
    commonMistakes: ["إضافة ميثود no-op لإرضاء interface ضخمة.", "تقسيم الواجهة بلا محور استخدام واضح."],
    followUpQuestions: ["ما علاقة ISP بالـmock أو fake في اختبارات Flutter؟"],
    sources: [
      { title: "Flutter docs — App architecture", url: "https://docs.flutter.dev/app-architecture" },
      { title: "Robert C. Martin — Solid Relevance", url: "https://blog.cleancoder.com/uncle-bob/2020/10/18/Solid-Relevance.html" },
    ],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "solid-005",
    slug: "dependency-inversion-in-flutter",
    trackId: "flutter",
    topicIds: ["solid"],
    difficulty: "Senior",
    question: "ما المقصود بـ Dependency Inversion Principle في تطبيق Flutter؟",
    shortAnswer: "الطبقات الأعلى تعتمد على contracts مستقرة، بينما تفاصيل مثل HTTP أو التخزين تطبق هذه العقود وتُحقن من الخارج.",
    explanation: "DIP يقلل اعتماد use case أو view model على package أو client concrete. عرّف interface عند الحد الذي يحتاجه المستهلك، ومرّر implementation في constructor أو composition root. لا تضف service locator عالميًا لمجرد تطبيق المبدأ؛ سهولة التتبع والاختبار أهم.",
    codeExample: `abstract interface class UserReader {
  Future<String> readName();
}

class ProfileController {
  ProfileController(this.reader);
  final UserReader reader;
}`,
    commonMistakes: ["اعتبار حقن dependency عبر global singleton تطبيقًا كاملًا لـDIP.", "وضع interface بجانب implementation بدل حدود المستهلك."],
    followUpQuestions: ["أين يكون composition root في تطبيق Flutter؟"],
    sources: [
      { title: "Flutter docs — App architecture", url: "https://docs.flutter.dev/app-architecture" },
      { title: "Robert C. Martin — Solid Relevance", url: "https://blog.cleancoder.com/uncle-bob/2020/10/18/Solid-Relevance.html" },
    ],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "solid-006",
    slug: "solid-boundaries-in-flutter-widgets",
    trackId: "flutter",
    topicIds: ["solid"],
    difficulty: "Senior",
    question: "إزاي نستخدم مبادئ SOLID من غير ما نحمّل Widget مسؤوليات زائدة؟",
    shortAnswer: "خلّي Widget ينسق rendering والتفاعل، ومرّر state أو callbacks واضحة بدل جعلها تقرأ الشبكة وتقرر قواعد المجال.",
    explanation: "Flutter يشجع composition، لذلك فصل العرض عن state والبيانات غالبًا أوضح من توريث Widgets مخصصة. خذ القرار على أساس أسباب التغيير واختباراتك، لا على أسماء طبقات ثابتة؛ شاشة صغيرة قد لا تحتاج architecture كاملة.",
    commonMistakes: ["وضع كل منطق التطبيق داخل build لأن الوصول إلى context سهل.", "نسخ Widget tree عميقة لإخفاء مسؤوليات مختلطة."],
    followUpQuestions: ["ما الذي يبقى داخل StatefulWidget حتى بعد فصل state؟"],
    sources: [
      { title: "Flutter docs — Architectural overview", url: "https://docs.flutter.dev/app-architecture/guide" },
      { title: "Robert C. Martin — Solid Relevance", url: "https://blog.cleancoder.com/uncle-bob/2020/10/18/Solid-Relevance.html" },
    ],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "solid-007",
    slug: "when-not-to-apply-solid",
    trackId: "flutter",
    topicIds: ["solid"],
    difficulty: "Junior",
    question: "هل لازم نطبق كل مبادئ SOLID في كل جزء من تطبيق Flutter؟",
    shortAnswer: "لا؛ استخدم المبدأ عندما يقلل تكلفة تغيير أو اختبار حقيقية، وإلا قد تضيف indirection وتعقيدًا بلا عائد.",
    explanation: "SOLID heuristics وليست checklist. في feature صغيرة، function واضحة قد تكون أفضل من خمس interfaces. راقب محاور التغيير، حجم الفريق، وعمر الكود، ثم افصل عند ظهور ضغط حقيقي بدل بناء بنية مستقبلية غير مؤكدة.",
    commonMistakes: ["قياس جودة التصميم بعدد الملفات والـinterfaces.", "استخدام SOLID ذريعة لتأجيل شحن feature بسيطة."],
    followUpQuestions: ["كيف تكتشف أن abstraction أصبحت عبئًا؟"],
    sources: [
      { title: "Flutter docs — App architecture", url: "https://docs.flutter.dev/app-architecture" },
      { title: "Robert C. Martin — Solid Relevance", url: "https://blog.cleancoder.com/uncle-bob/2020/10/18/Solid-Relevance.html" },
    ],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "solid-008",
    slug: "refactoring-legacy-flutter-code-with-solid",
    trackId: "flutter",
    topicIds: ["solid"],
    difficulty: "Senior",
    question: "إزاي تبدأ refactor لكود Flutter قديم باستخدام SOLID بأمان؟",
    shortAnswer: "ابدأ بسلوك قابل للملاحظة واختبار صغير، حدد أكثر سبب تغيير مؤلم، ثم افصل حدًا واحدًا مع إبقاء السلوك كما هو.",
    explanation: "لا تعِد كتابة الشاشة كلها دفعة واحدة. أضف characterization test، افصل طلب الشبكة أو parsing خلف contract، ثم انقل المسؤولية تدريجيًا. كل خطوة يجب أن تقلل coupling أو تحسن الاختبار، وإلا ارجع لأبسط شكل.",
    commonMistakes: ["دمج refactor شامل مع تغيير سلوك يصعب مراجعته.", "اختيار abstraction قبل فهم السلوك الحالي والقيود."],
    followUpQuestions: ["ما أول seam تختاره لاختبار شاشة تعتمد على API؟"],
    sources: [
      { title: "Flutter docs — App architecture", url: "https://docs.flutter.dev/app-architecture" },
      { title: "Robert C. Martin — Solid Relevance", url: "https://blog.cleancoder.com/uncle-bob/2020/10/18/Solid-Relevance.html" },
    ],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "fundamentals-001",
    slug: "flutter-framework-engine-and-embedder",
    trackId: "flutter",
    topicIds: ["flutter-fundamentals"],
    difficulty: "Junior",
    question: "إيه الفرق بين Flutter framework وengine وembedder؟",
    shortAnswer: "الـframework يوفر APIs وWidgets بلغة Dart، والـengine يرسم ويشغّل runtime، والـembedder يربط Flutter بنظام التشغيل والمنصة.",
    explanation: "فصل الطبقات يوضح مكان المشكلة: كود التطبيق وWidgets في framework، rasterization وDart runtime في engine، ونافذة التطبيق ودورة الحياة وإدخال المنصة في embedder. لا تحتاج حفظ كل التفاصيل، لكن مهم تعرف أن Flutter ليس مكتبة Widgets فقط.",
    commonMistakes: ["اختزال Flutter في engine الرسم فقط.", "اعتبار platform embedder جزءًا من كود Widget نفسه."],
    followUpQuestions: ["أي طبقة تتأثر عند تغيير طريقة الرسم أو منصة التشغيل؟"],
    sources: [{ title: "Flutter docs — Architectural overview", url: "https://docs.flutter.dev/resources/architectural-overview" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "fundamentals-002",
    slug: "declarative-ui-in-flutter",
    trackId: "flutter",
    topicIds: ["flutter-fundamentals"],
    difficulty: "Junior",
    question: "ماذا تعني Declarative UI في Flutter؟",
    shortAnswer: "تصف شكل الواجهة الناتج من state الحالية، وعندما تتغير state يعيد Flutter بناء الوصف بدل أن تطلب تعديل كل عنصر يدويًا.",
    explanation: "في النموذج التصريحي تكتب ما يجب أن يظهر لحالة معينة، وFlutter يقارن شجرة Widgets الجديدة ويطبق التغيير على الواجهة. هذا يقلل أوامر mutation المتناثرة، لكنه يتطلب إدارة state ومفاتيح وهوية Widgets بشكل صحيح.",
    codeExample: `Widget build(BuildContext context) {
  return Text(isLoading ? "Loading" : "Ready");
}`,
    commonMistakes: ["اعتبار build عملية رسم مباشرة لكل بكسل.", "تعديل state داخل build بدل تغييرها في حدث أو controller."],
    followUpQuestions: ["لماذا لا يعني rebuild أن كل الشاشة تُرسم من الصفر؟"],
    sources: [{ title: "Flutter docs — Declarative UI", url: "https://docs.flutter.dev/get-started/flutter-for/declarative" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "fundamentals-003",
    slug: "widget-element-render-object-trees",
    trackId: "flutter",
    topicIds: ["flutter-fundamentals"],
    difficulty: "Mid",
    question: "ليه Flutter عنده Widget tree وElement tree وRenderObject tree؟",
    shortAnswer: "Widgets وصف immutable، وElements تحفظ الهوية والمكان بين rebuilds، وRenderObjects تتولى layout وpainting والتفاعل مع hit testing.",
    explanation: "فصل الوصف عن الحالة وعن الرسم يسمح بإعادة إنشاء Widgets الرخيصة مع الحفاظ على عناصر stateful المناسبة. ليس كل Widget ينشئ RenderObject؛ بعض Widgets تنظم الشجرة أو تضيف behavior فقط.",
    commonMistakes: ["القول إن كل Widget يمثل object مرسومًا على الشاشة.", "توقع أن إعادة build تنشئ state جديدة دائمًا."],
    followUpQuestions: ["كيف تؤثر keys في مطابقة Elements أثناء التحديث؟"],
    sources: [{ title: "Flutter docs — Inside Flutter", url: "https://docs.flutter.dev/resources/inside-flutter" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "fundamentals-004",
    slug: "flutter-frame-rendering-pipeline",
    trackId: "flutter",
    topicIds: ["flutter-fundamentals"],
    difficulty: "Mid",
    question: "ما المراحل الأساسية لإنتاج frame في Flutter؟",
    shortAnswer: "عند الحاجة يمر Flutter بعمليات build ثم layout ثم paint، وبعدها compositing و rasterization لإظهار frame على الشاشة.",
    explanation: "الفكرة العملية هي معرفة أين تبحث عند البطء: build يحدّث وصف الواجهة، layout يحسب الأحجام والمواقع، paint يسجل أوامر الرسم، والـengine ينفذها. قد يعيد Flutter مرحلة محددة فقط أو يتداخل ترتيب العمل حسب ما تغيّر، لذلك استخدم profiling بدل افتراض سبب البطء.",
    commonMistakes: ["ربط كل jank بمرحلة build فقط.", "تحسين أرقام نظرية من غير قياس في profile mode."],
    followUpQuestions: ["أي أدوات Flutter تساعدك في رؤية frame work؟"],
    sources: [{ title: "Flutter docs — Inside Flutter", url: "https://docs.flutter.dev/resources/inside-flutter" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "fundamentals-005",
    slug: "hot-reload-vs-hot-restart",
    trackId: "flutter",
    topicIds: ["flutter-fundamentals"],
    difficulty: "Junior",
    question: "ما الفرق بين hot reload وhot restart في Flutter؟",
    shortAnswer: "hot reload يحقن تغييرات الكود ويحافظ غالبًا على state الحالية، بينما hot restart يعيد تشغيل Dart app ويفقد state الموجودة.",
    explanation: "Hot reload مناسب لتعديل UI أو منطق مع الاحتفاظ بمكان المستخدم، لكنه لا يعيد تنفيذ كل initialization أو يطبق تغييرات تتطلب إعادة تشغيل كاملة. استخدم hot restart عندما تحتاج دورة تشغيل جديدة، واختبر النتيجة النهائية في build مناسب.",
    commonMistakes: ["اعتبار hot reload بديلًا لاختبار release.", "الاستغراب من بقاء state قديمة بعد تعديل initialization."],
    followUpQuestions: ["متى تحتاج إعادة تشغيل التطبيق أو الجهاز بالكامل؟"],
    sources: [{ title: "Flutter docs — Hot reload", url: "https://docs.flutter.dev/tools/hot-reload" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "fundamentals-006",
    slug: "debug-profile-and-release-modes",
    trackId: "flutter",
    topicIds: ["flutter-fundamentals"],
    difficulty: "Mid",
    question: "إمتى تستخدم debug وprofile وrelease mode في Flutter؟",
    shortAnswer: "debug للتطوير مع أدوات التشخيص، profile لقياس الأداء قريبًا من release، وrelease للتوزيع مع تحسينات وتعطيل أدوات التطوير.",
    explanation: "اختيار mode يغير assertions والتشخيص والتحسينات، لذلك لا تقيس أداء التطبيق من debug. استخدم profile على جهاز حقيقي عندما تريد قياس frame أو استهلاك الموارد، ثم تحقق من سلوك release قبل النشر.",
    commonMistakes: ["اتخاذ قرار أداء من تجربة debug فقط.", "تضمين أدوات أو logs تطويرية في release بلا قصد."],
    followUpQuestions: ["لماذا قد يختلف سلوك code path بين debug وrelease؟"],
    sources: [{ title: "Flutter docs — Build modes", url: "https://docs.flutter.dev/testing/build-modes" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "fundamentals-007",
    slug: "pubspec-dependencies-and-packages",
    trackId: "flutter",
    topicIds: ["flutter-fundamentals"],
    difficulty: "Junior",
    question: "ما دور pubspec.yaml وpubspec.lock في مشروع Flutter؟",
    shortAnswer: "pubspec.yaml يعلن metadata والاعتماديات والأصول، بينما lockfile يثبت الإصدارات المحلولة للمشروع أو التطبيق حسب نوع الحزمة.",
    explanation: "ملف pubspec هو مصدر نية المشروع: dependencies وdev_dependencies وassets وغيرها. pub get يحل شجرة الاعتماديات، ووجود lockfile يساعد reproducibility للتطبيقات؛ لا تعدّل الملفات المحلولة يدويًا بدل تحديث القيود المقصودة.",
    codeExample: `dependencies:
  flutter:
    sdk: flutter
  http: ^1.0.0`,
    commonMistakes: ["وضع dependency تشغيلية في dev_dependencies.", "تجاهل تعارضات الإصدارات بدل فهم constraint وlockfile."],
    followUpQuestions: ["متى تستخدم package ومتى تستخدم plugin؟"],
    sources: [{ title: "Flutter docs — Using packages", url: "https://docs.flutter.dev/packages-and-plugins/using-packages" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "fundamentals-008",
    slug: "flutter-app-lifecycle",
    trackId: "flutter",
    topicIds: ["flutter-fundamentals"],
    difficulty: "Mid",
    question: "إيه الحالات الأساسية في lifecycle بتاع تطبيق Flutter؟",
    shortAnswer: "AppLifecycleListener يتابع حالات مثل resumed وinactive وhidden وpaused وdetached، مع اختلاف الانتقالات حسب المنصة.",
    explanation: "استخدم lifecycle لإيقاف عمل مؤقت أو حفظ state عند انتقال التطبيق للخلفية، لكن لا تفترض أن كل منصة ترسل نفس التسلسل أو أن callback واحد يضمن اكتمال الحفظ. اربط listener بعمر الشاشة أو التطبيق ونظّفه عند الانتهاء.",
    commonMistakes: ["اعتبار paused هو الحالة الوحيدة المهمة.", "ترك listener يعمل بعد dispose أو الاعتماد على callback واحد لحفظ بيانات حرجة."],
    followUpQuestions: ["متى تستخدم AppLifecycleListener بدل WidgetsBindingObserver؟"],
    sources: [{ title: "Flutter API — AppLifecycleListener", url: "https://api.flutter.dev/flutter/widgets/AppLifecycleListener-class.html" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "fundamentals-009",
    slug: "assets-and-images-in-flutter",
    trackId: "flutter",
    topicIds: ["flutter-fundamentals"],
    difficulty: "Junior",
    question: "إزاي تضيف assets وصور إلى تطبيق Flutter؟",
    shortAnswer: "تعلن المسارات في pubspec.yaml ثم تستخدم APIs المناسبة لتحميلها، ويجب أن تكون المسارات والـindentation صحيحة ضمن asset bundle.",
    explanation: "Flutter لا يضم ملفًا لمجرد وجوده في repository؛ pubspec يحدد ما يدخل في asset bundle. عرّف مجلدًا أو ملفًا بوضوح، واستخدم package prefix عند استهلاك asset من package أخرى، ثم اختبر build النهائي لا hot reload فقط.",
    commonMistakes: ["نسيان إعلان asset أو خطأ indentation في YAML.", "استخدام path محلي يعمل في debug ولا يوجد داخل bundle المنشور."],
    followUpQuestions: ["كيف تشير إلى asset موجود داخل dependency package؟"],
    sources: [{ title: "Flutter docs — Assets and images", url: "https://docs.flutter.dev/ui/assets/assets-and-images" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "fundamentals-010",
    slug: "flutter-flavors-and-build-configurations",
    trackId: "flutter",
    topicIds: ["flutter-fundamentals"],
    difficulty: "Mid",
    question: "ما فائدة Android product flavors في تطبيق Flutter؟",
    shortAnswer: "تفصل إعدادات مثل API endpoint واسم التطبيق بين dev وstaging وproduction من غير نسخ مشروع Dart كامل.",
    explanation: "تختار Android product flavor إعدادات build وموارد أو entrypoint مناسبة لبيئة، مع إبقاء منطق التطبيق مشتركًا. استخدمها عندما توجد بيئات حقيقية تحتاج اختلافًا مضبوطًا، وتأكد ألا تتسرب مفاتيح أو endpoints تجريبية إلى release.",
    commonMistakes: ["استخدام flavor كبديل لإدارة secrets.", "اختبار بيئة واحدة ثم اكتشاف أن configuration أخرى لا تبني."],
    followUpQuestions: ["كيف تتحقق من configuration التي يعمل بها التطبيق وقت التشغيل؟"],
    sources: [{ title: "Flutter docs — Flavors", url: "https://docs.flutter.dev/deployment/flavors" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "storage-001",
    slug: "preferences-files-and-local-databases",
    trackId: "flutter",
    topicIds: ["local-storage"],
    difficulty: "Junior",
    question: "إزاي تختار بين preferences وfiles وstructured local database للتخزين المحلي؟",
    shortAnswer: "استخدم preferences لإعدادات صغيرة، وfiles للمستندات أو البيانات غير المهيكلة، وdatabase للبيانات المترابطة التي تحتاج query وtransaction.",
    explanation: "الاختيار يبدأ من شكل البيانات وطريقة الوصول لها، وليس من اسم package. key-value مناسب لقيم بسيطة، والملف يحافظ على blob أو مستند كامل، بينما قاعدة البيانات تضيف schema واستعلامات وعلاقات وتكلفة تشغيل وصيانة أعلى. حدّد حجم البيانات، عدد القراءات والكتابات، الحاجة إلى بحث أو migration، ثم استخدم أبسط خيار يحقق العقد.",
    commonMistakes: ["حفظ قائمة كبيرة أو بيانات مترابطة كـkey-value واحد.", "اختيار قاعدة بيانات لمجرد أن التطبيق لديه أكثر من شاشة.", "اعتبار أي package حلًا عالميًا لكل أنواع التخزين."],
    followUpQuestions: ["إمتى يتحول ملف JSON إلى عبء مقارنة بقاعدة بيانات؟"],
    sources: [{ title: "Flutter cookbook — Persistence", url: "https://docs.flutter.dev/cookbook/persistence" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "storage-002",
    slug: "key-value-preferences-for-small-settings",
    trackId: "flutter",
    topicIds: ["local-storage"],
    difficulty: "Junior",
    question: "إمتى تستخدم key-value preferences وما حدودها؟",
    shortAnswer: "هي مناسبة لإعدادات صغيرة primitive مثل theme أو flag، لكنها ليست مخزنًا لملفات كبيرة أو بيانات معقدة أو أسرار حساسة.",
    explanation: "تخزين key-value يجعل قراءة إعداد صغير سهلة، لكن الأنواع المدعومة محدودة ولا يوفر model للعلاقات أو استعلامات غنية. صمّم مفاتيح ثابتة، تعامل مع غياب القيمة، ولا تضع tokens أو أسرارًا لمجرد أن القيمة ستبقى بعد إعادة تشغيل التطبيق؛ اختر تخزينًا آمنًا عندما تكون السرية جزءًا من المتطلب.",
    codeExample: `final prefs = await SharedPreferences.getInstance();
await prefs.setBool("dark_mode", true);
final enabled = prefs.getBool("dark_mode") ?? false;`,
    commonMistakes: ["استخدام preferences لتخزين cache كبير أو JSON ضخم.", "افتراض أن الكتابة تعني ضمانًا مطلقًا لبقاء البيانات.", "حفظ secret أو access token في مخزن غير مخصص للأسرار."],
    followUpQuestions: ["كيف تختبر كود preferences من غير الاعتماد على disk حقيقي؟"],
    sources: [{ title: "Flutter cookbook — Store key-value data on disk", url: "https://docs.flutter.dev/cookbook/persistence/key-value" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "storage-003",
    slug: "files-for-local-documents-and-blobs",
    trackId: "flutter",
    topicIds: ["local-storage"],
    difficulty: "Junior",
    question: "إزاي تحفظ مستند أو blob محليًا باستخدام files؟",
    shortAnswer: "احصل على مسار خاص بالتطبيق عبر path_provider، ثم استخدم dart:io للقراءة والكتابة بشكل asynchronous مع التعامل مع فشل القرص.",
    explanation: "الملف مناسب عندما تكون الوحدة التي تقرأها وتكتبها مستندًا أو binary blob مثل صورة أو export. لا تفترض مسارًا ثابتًا يخص نظامًا واحدًا؛ اطلب directory مناسبًا للمنصة، وفكّر في atomic writes وحجم الملف وصلاحياته. لو احتجت البحث داخل حقول كثيرة أو علاقات، فالملف وحده ليس boundary مناسبة.",
    codeExample: `final directory = await getApplicationDocumentsDirectory();
final file = File("\${directory.path}/draft.json");
await file.writeAsString(jsonText);`,
    commonMistakes: ["تثبيت path مثل /data أو C:\\ داخل كود مشترك.", "تنفيذ write متزامن على واجهة المستخدم لملف كبير.", "اعتبار وجود الملف دليلًا على أن محتواه صالح دائمًا."],
    followUpQuestions: ["كيف تتعامل مع ملف ناقص بعد انقطاع أثناء الكتابة؟"],
    sources: [{ title: "Flutter cookbook — Read and write files", url: "https://docs.flutter.dev/cookbook/persistence/reading-writing-files" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "storage-004",
    slug: "sqlite-for-structured-local-data",
    trackId: "flutter",
    topicIds: ["local-storage"],
    difficulty: "Mid",
    question: "متى تكون SQLite أو structured local database مناسبة في تطبيق Flutter؟",
    shortAnswer: "عندما تكون البيانات كثيرة أو مترابطة وتحتاج استعلامًا وفرزًا وتحديثًا متكررًا، مع schema وversioning واضحين.",
    explanation: "قاعدة البيانات تكسب عندما تصبح القراءة الانتقائية والعلاقات والـtransactions أهم من بساطة ملف واحد. صمّم الجداول والمفاتيح، حدّد migrations عند تغيير schema، واعزل API الخاصة بالقاعدة خلف repository أو data source. اختيار SQLite أو engine آخر يتبع المنصات والمتطلبات؛ لا تجعل اسم package هو القرار المعماري نفسه.",
    codeExample: `final database = await openDatabase(
  join(await getDatabasesPath(), "notes.db"),
  version: 1,
  onCreate: (db, version) => db.execute(
    "CREATE TABLE notes(id INTEGER PRIMARY KEY, body TEXT)",
  ),
);`,
    commonMistakes: ["وضع SQL وdatabase handles داخل Widgets.", "تغيير schema من غير migration أو version.", "استخدام database بينما احتياج feature مجرد setting واحدة."],
    followUpQuestions: ["ما الذي يجب أن يحدث عند فتح نسخة أقدم من قاعدة البيانات؟"],
    sources: [{ title: "Flutter cookbook — Persist data with SQLite", url: "https://docs.flutter.dev/cookbook/persistence/sqlite" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "storage-005",
    slug: "testable-and-resilient-local-persistence",
    trackId: "flutter",
    topicIds: ["local-storage"],
    difficulty: "Mid",
    question: "إزاي تصمم local persistence قابلة للاختبار ومقاومة لفشل التخزين؟",
    shortAnswer: "اعزل storage خلف contract صغير، عالج غياب البيانات وأخطاء القراءة والكتابة صراحةً، واختبر serialization والترقية بعيدًا عن UI.",
    explanation: "المستخدم قد يملك نسخة قديمة أو ملفًا تالفًا أو مساحة قرص ممتلئة، لذلك لا تحول exception إلى data فارغة بصمت. اجعل format وdefaults وschema version جزءًا من boundary، واستبدل implementation الحقيقية بـin-memory fake في الاختبار. لا تخلط persistence الدائم مع restoration المؤقت أو cache الذي يمكن إعادة بنائه.",
    commonMistakes: ["ابتلاع كل storage errors ثم عرض نجاح كاذب.", "ربط الشاشة مباشرة بـpackage أو database API.", "اعتبار cache وبيانات المستخدم الدائمة نفس مستوى الأهمية."],
    followUpQuestions: ["كيف تميّز بين بيانات stale وبيانات لا يمكن استعادتها؟"],
    sources: [
      { title: "Flutter cookbook — Store key-value data on disk", url: "https://docs.flutter.dev/cookbook/persistence/key-value" },
      { title: "Flutter cookbook — Persist data with SQLite", url: "https://docs.flutter.dev/cookbook/persistence/sqlite" },
      { title: "Flutter docs — App architecture guide", url: "https://docs.flutter.dev/app-architecture/guide" },
      { title: "Dart API — File", url: "https://api.dart.dev/dart-io/File-class.html" },
    ],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "platform-001",
    slug: "platform-channels-and-native-boundaries",
    trackId: "flutter",
    topicIds: ["platform-integration"],
    difficulty: "Mid",
    question: "إيه دور platform channels وإزاي تحافظ على boundary واضحة مع native code؟",
    shortAnswer: "Platform channel تنقل رسائل asynchronous بين Dart وكود المنصة مثل Kotlin أو Swift؛ ضع contract وadapter بعيدًا عن Widgets وعرّف الأخطاء والأنواع بوضوح.",
    explanation: "عندما لا تكفي APIs المشتركة أو plugin جاهز، يرسل جانب Flutter method أو message عبر channel باسم وcodec متفق عليه، ويرد host بنتيجة أو خطأ. اجعل أسماء methods والـpayload versioned ومحدودة، وحوّل نتيجة native إلى model أو error domain داخل boundary؛ لا تنشر MethodChannel في كل شاشة ولا تفترض أن كل منصة تدعم السلوك نفسه.",
    codeExample: `const channel = MethodChannel("com.example.device");
final value = await channel.invokeMethod<int>("readValue");`,
    commonMistakes: ["خلط channel calls داخل build أو presentation logic.", "عدم تطابق channel name أو payload بين Dart والـhost.", "نسيان platform exceptions أو اختلاف capabilities بين المنصات."],
    followUpQuestions: ["متى يكون Pigeon أنسب من كتابة MethodChannel يدويًا؟"],
    sources: [{ title: "Flutter docs — Writing custom platform-specific code", url: "https://docs.flutter.dev/platform-integration/platform-channels" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "platform-002",
    slug: "choosing-flutter-plugins-and-native-integration",
    trackId: "flutter",
    topicIds: ["platform-integration"],
    difficulty: "Senior",
    question: "إمتى تختار plugin جاهزًا أو custom platform integration؟",
    shortAnswer: "ابدأ بـFlutter API أو plugin موثوق، واكتب integration مخصصًا فقط عندما توجد capability حقيقية غير مغطاة، مع عزل اختلافات المنصات خلف contract واحد.",
    explanation: "الـplugin الجاهز يقلل native code والصيانة، لكن يجب فحص المنصات المدعومة والـlifecycle وجودة الصيانة. عند الحاجة المخصصة، يمكن بناء plugin أو channel وربط Dart بالـhost، مع تنفيذ fallback أو رفض واضح للمنصة غير المدعومة. هذا قرار boundary وتكلفة ملكية، وليس قاعدة أن package واحدة أفضل دائمًا.",
    commonMistakes: ["إضافة native code قبل التحقق من Flutter API أو plugin مناسب.", "كشف تفاصيل Android وiOS في كل مستهلك بدل adapter واحد.", "التعامل مع capability غير المدعومة كأنها قيمة null عادية بلا UX أو error policy."],
    followUpQuestions: ["كيف تختبر contract بين Dart وimplementation native لكل منصة؟"],
    sources: [
      { title: "Flutter docs — Build for and integrate with multiple platforms", url: "https://docs.flutter.dev/platform-integration" },
      { title: "Flutter docs — Writing custom platform-specific code", url: "https://docs.flutter.dev/platform-integration/platform-channels" },
      { title: "Flutter docs — Using packages and plugins", url: "https://docs.flutter.dev/packages-and-plugins/using-packages" },
    ],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "widgets-001",
    slug: "statelesswidget-and-build",
    trackId: "flutter",
    topicIds: ["widgets"],
    difficulty: "Junior",
    question: "إمتى تستخدم StatelessWidget وإيه معنى build بتاعها؟",
    shortAnswer: "StatelessWidget يصف UI اعتمادًا على configuration ثابتة، وbuild ترجع شجرة Widgets جديدة عندما يطلب Flutter تحديثها.",
    explanation: "Stateless لا يعني أن الواجهة لن تتغير؛ يمكن أن تتغير عندما تتغير المدخلات أو يعيد parent البناء. لا تضع state متغيرة داخلها، ومرّر القيمة الجديدة من الخارج بدل mutation مخفي.",
    codeExample: `class Greeting extends StatelessWidget {
  const Greeting({super.key, required this.name});
  final String name;

  @override
  Widget build(BuildContext context) => Text("Hello $name");
}`,
    commonMistakes: ["اعتبار StatelessWidget غير قابل لإعادة البناء.", "تخزين mutable state داخله بدل تمريرها كـparameters."],
    followUpQuestions: ["متى يكون const constructor مفيدًا في StatelessWidget؟"],
    sources: [{ title: "Flutter API — StatelessWidget", url: "https://api.flutter.dev/flutter/widgets/StatelessWidget-class.html" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "widgets-002",
    slug: "statefulwidget-state-lifecycle",
    trackId: "flutter",
    topicIds: ["widgets"],
    difficulty: "Mid",
    question: "اشرح lifecycle الأساسي لـ StatefulWidget State؟",
    shortAnswer: "State يمر عادةً بـinitState ثم didChangeDependencies وbuild، وقد يستقبل didUpdateWidget، ثم dispose عند الإزالة النهائية.",
    explanation: "ضع initialization مرة واحدة في initState، وتابع Inherited dependencies في didChangeDependencies، ونظّف controllers وlisteners في dispose. لا تنفذ side effects داخل build لأنها قد تتكرر.",
    commonMistakes: ["إنشاء subscription داخل build.", "نسيان dispose لـAnimationController أو StreamSubscription."],
    followUpQuestions: ["متى يُستدعى didUpdateWidget؟"],
    sources: [{ title: "Flutter API — State lifecycle", url: "https://api.flutter.dev/flutter/widgets/State-class.html" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "widgets-003",
    slug: "buildcontext-scope-and-inherited-widgets",
    trackId: "flutter",
    topicIds: ["widgets"],
    difficulty: "Mid",
    question: "إيه هو BuildContext وليه مكانه في الشجرة مهم؟",
    shortAnswer: "BuildContext هو handle لموضع Widget داخل Element tree، وبه تبحث عن ancestors مثل Theme أو InheritedWidget.",
    explanation: "السياق يحدد النطاق الذي تبحث فيه APIs مثل Theme.of وMediaQuery.of. لا تحتفظ به بعد dispose، ولا تستخدم context فوق الـProvider أو Navigator الذي تريد الوصول إليه.",
    commonMistakes: ["استخدام context من parent للوصول إلى Widget أسفل منه.", "تخزين BuildContext لاستخدامه بعد انتهاء lifecycle."],
    followUpQuestions: ["ما الفرق بين context داخل build وcontext داخل callback؟"],
    sources: [{ title: "Flutter API — BuildContext", url: "https://api.flutter.dev/flutter/widgets/BuildContext-class.html" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "widgets-004",
    slug: "keys-and-widget-identity",
    trackId: "flutter",
    topicIds: ["widgets"],
    difficulty: "Mid",
    question: "إزاي تساعد keys Flutter في الحفاظ على هوية Widgets؟",
    shortAnswer: "Key تجعل Flutter يطابق Widget جديدًا مع Element سابق عند تغيير ترتيب أو مجموعة siblings، فيحافظ على state الصحيحة.",
    explanation: "استخدم ValueKey بمعرّف domain مستقر في القوائم القابلة لإعادة الترتيب. لا تضف keys عشوائيًا في كل مكان؛ تغيير key يطلب هوية جديدة ويفقد state القديمة.",
    codeExample: `ListView(
  children: items.map((item) => ItemTile(
    key: ValueKey(item.id),
    item: item,
  )).toList(),
)`,
    commonMistakes: ["استخدام index كهوية لقائمة يمكن إعادة ترتيبها.", "إنشاء UniqueKey في كل build ثم توقع بقاء state."],
    followUpQuestions: ["متى تحتاج GlobalKey بدل ValueKey؟"],
    sources: [{ title: "Flutter API — Key", url: "https://api.flutter.dev/flutter/foundation/Key-class.html" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "widgets-005",
    slug: "flutter-constraints-go-down-sizes-go-up",
    trackId: "flutter",
    topicIds: ["widgets"],
    difficulty: "Junior",
    question: "اشرح قاعدة constraints go down, sizes go up في Flutter؟",
    shortAnswer: "الـparent يرسل قيودًا للـchild، والـchild يختار size داخلها، ثم يضعه parent في مكانه.",
    explanation: "حل مشاكل overflow يبدأ بقراءة constraints الفعلية، لا بإضافة Expanded عشوائيًا. Widget لا يختار حجمًا خارج الحد الذي أعطاه parent، وبعض parents مثل Column قد ترسل قيودًا غير محدودة في محور معين.",
    commonMistakes: ["افتراض أن child يفرض حجمه على parent.", "إخفاء overflow بـSingleChildScrollView بلا فهم سبب القيود."],
    followUpQuestions: ["لماذا يفشل Expanded داخل Column في بعض الحالات؟"],
    sources: [{ title: "Flutter docs — Understanding constraints", url: "https://docs.flutter.dev/ui/layout/constraints" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "widgets-007",
    slug: "const-widgets-and-rebuild-cost",
    trackId: "flutter",
    topicIds: ["widgets"],
    difficulty: "Mid",
    question: "كيف تساعد const Widgets في تقليل تكلفة rebuild؟",
    shortAnswer: "const تنشئ configuration قابلة للمشاركة وقت الترجمة، فتسمح لـFlutter بتخطي أجزاء ثابتة ومراجعة أقل أثناء التحديث.",
    explanation: "استخدم const عندما تكون كل المدخلات compile-time constants، لكن لا تجعلها هدفًا شكليًا. افهم أولًا أي subtree يعاد بناؤه، ثم قلّل العمل داخل build وقِس الأداء عند الحاجة.",
    commonMistakes: ["الاعتقاد أن const يمنع parent من rebuild بالكامل.", "إضافة تعقيد فقط للوصول إلى const في قيمة متغيرة."],
    followUpQuestions: ["ما الفرق بين rebuild وlayout وpaint؟"],
    sources: [{ title: "Flutter docs — Performance best practices", url: "https://docs.flutter.dev/perf/best-practices" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "widgets-008",
    slug: "setstate-and-rebuild-scope",
    trackId: "flutter",
    topicIds: ["widgets"],
    difficulty: "Junior",
    question: "ماذا يفعل setState فعلًا، وكيف تتجنب rebuild واسع؟",
    shortAnswer: "setState يخبر framework أن State تغيرت ويطلب إعادة build للـStatefulElement وأبنائه؛ ضع الحالة عند أقرب مالك منطقي.",
    explanation: "عدّل state داخل callback ثم دع Flutter يعيد بناء subtree المتأثر. لا تستدعِ setState بعد dispose، ولا تضع state تخص عنصرًا صغيرًا في أعلى الشاشة بلا سبب.",
    codeExample: `setState(() {
  isExpanded = !isExpanded;
});`,
    commonMistakes: ["تغيير field خارج setState وتوقع تحديث UI.", "استدعاء setState بعد await من غير التحقق من mounted."],
    followUpQuestions: ["متى تحتاج mounted بعد asynchronous work؟"],
    sources: [{ title: "Flutter API — State.setState", url: "https://api.flutter.dev/flutter/widgets/State/setState.html" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "widgets-009",
    slug: "didchangedependencies-and-inheritedwidget",
    trackId: "flutter",
    topicIds: ["widgets"],
    difficulty: "Mid",
    question: "إمتى تستخدم InheritedWidget وdidChangeDependencies؟",
    shortAnswer: "InheritedWidget يشارك قيمة عبر الشجرة، وdidChangeDependencies تنبه State عندما تتغير dependency سجّلها عبر context.",
    explanation: "استخدمه لقيمة مشتركة تتغير مع الزمن مثل Theme أو locale، وسجّل القراءة في build أو didChangeDependencies. لا تجعل InheritedWidget مخزنًا عامًا لكل state؛ اجعل نطاقه واضحًا واستعمل API متخصصة عندما تكبر المتطلبات.",
    commonMistakes: ["قراءة dependency في initState فقط رغم أنها قد تتغير.", "تمرير كل بيانات التطبيق عبر InheritedWidget واحد ضخم."],
    followUpQuestions: ["ما الذي يجعل dependOnInheritedWidgetOfExactType يعيد الإشعار؟"],
    sources: [{ title: "Flutter API — InheritedWidget", url: "https://api.flutter.dev/flutter/widgets/InheritedWidget-class.html" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "widgets-010",
    slug: "globalkey-tradeoffs",
    trackId: "flutter",
    topicIds: ["widgets"],
    difficulty: "Senior",
    question: "ما trade-offs استخدام GlobalKey في Flutter؟",
    shortAnswer: "GlobalKey تعطي وصولًا وهوية فريدة عبر الشجرة، لكنها أغلى وأشد coupling من local keys ويجب ألا تُنشأ داخل build.",
    explanation: "استخدم GlobalKey عند حاجة حقيقية مثل الوصول إلى FormState أو نقل subtree، وثبّت instance في State أو owner مناسب. في القوائم استخدم ValueKey غالبًا، لأن GlobalKey كثيرة تصعّب المطابقة وتؤثر على الأداء.",
    commonMistakes: ["إنشاء GlobalKey جديدة في كل build.", "استخدامها كبديل لتمرير callback أو state بطريقة واضحة."],
    followUpQuestions: ["كيف تستبدل GlobalKey بواجهة أبسط في نموذج صغير؟"],
    sources: [{ title: "Flutter API — GlobalKey", url: "https://api.flutter.dev/flutter/widgets/GlobalKey-class.html" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "state-001",
    slug: "local-vs-shared-state",
    trackId: "flutter",
    topicIds: ["state-management"],
    difficulty: "Junior",
    question: "إيه الفرق بين local state وshared state في Flutter؟",
    shortAnswer: "local state تخص Widget أو feature صغيرة، أما shared state فتحتاجها أجزاء متعددة أو شاشات مختلفة وتتطلب مالكًا ونطاقًا أوضح.",
    explanation: "ابدأ بأقرب owner للحالة؛ لا ترفع قيمة لا يحتاجها غير child واحد. اجعل shared state صريحة في حدود feature، واحتفظ بالحالة المؤقتة مثل اختيار tab محلية ما لم يوجد سبب حقيقي لمشاركتها.",
    commonMistakes: ["وضع كل state في singleton عالمي.", "اعتبار كل قيمة داخل الشاشة app state."],
    followUpQuestions: ["ما العلامة التي تقول إن local state يجب أن تصبح shared؟"],
    sources: [{ title: "Flutter docs — Ephemeral vs app state", url: "https://docs.flutter.dev/data-and-backend/state-mgmt/ephemeral-vs-app" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "state-002",
    slug: "lifting-state-up-in-flutter",
    trackId: "flutter",
    topicIds: ["state-management"],
    difficulty: "Junior",
    question: "إزاي تطبق lifting state up بين Widgets؟",
    shortAnswer: "انقل state إلى أقرب parent مشترك يحتاج قراءتها أو تعديلها، ثم مرّر القيمة وcallbacks إلى children.",
    explanation: "الـparent يصبح مصدر الحقيقة الواحد، وchildren تعرض البيانات أو تطلب تغييرها عبر callback. ارفع state تدريجيًا؛ رفعها إلى أعلى التطبيق من البداية يزيد التمرير والاقتران.",
    codeExample: `class Parent extends StatefulWidget {
  const Parent({super.key});
  @override State<Parent> createState() => _ParentState();
}

class _ParentState extends State<Parent> {
  int count = 0;
  @override Widget build(BuildContext context) => Child(
    value: count,
    onChanged: (value) => setState(() => count = value),
  );
}`,
    commonMistakes: ["امتلاك نفس state في child وparent معًا.", "تمرير callbackات كثيرة بدل تحديد owner واحد."],
    followUpQuestions: ["متى يصبح prop drilling إشارة لاختيار shared state؟"],
    sources: [{ title: "Flutter docs — Lifting state up", url: "https://docs.flutter.dev/data-and-backend/state-mgmt/simple#lifting-state-up" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "state-003",
    slug: "immutable-state-and-change-notification",
    trackId: "flutter",
    topicIds: ["state-management"],
    difficulty: "Mid",
    question: "ليه immutable state وchange notification مهمين؟",
    shortAnswer: "نسخة state جديدة مع إشعار واضح تجعل التغيير قابلًا للتتبع وتمنع المستهلكين من رؤية mutation جزئية أو مخفية.",
    explanation: "عرّف state كقيمة تصف الحالة الحالية، ثم استبدلها عند التغيير وأبلغ listeners مرة واحدة. لو استخدمت mutable collections احمِها من التعديل الخارجي أو انسخها عند إنشاء state الجديدة.",
    commonMistakes: ["تعديل List داخل state من غير إشعار.", "إطلاق notifications متعددة لعملية منطقية واحدة بلا حاجة."],
    followUpQuestions: ["ما الفرق بين equality بالمرجع وequality بالقيمة عند مقارنة state؟"],
    sources: [{ title: "Flutter API — ValueNotifier", url: "https://api.flutter.dev/flutter/foundation/ValueNotifier-class.html" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "state-004",
    slug: "unidirectional-data-flow",
    trackId: "flutter",
    topicIds: ["state-management"],
    difficulty: "Mid",
    question: "اشرح unidirectional data flow في تطبيق Flutter؟",
    shortAnswer: "البيانات تنزل من owner إلى UI، والأحداث تصعد كـintent؛ owner يحدّث state ثم يعيد نشر snapshot جديدة.",
    explanation: "هذا الاتجاه يجعل مصدر الحقيقة ومسار التغيير واضحين: UI لا تعدّل model مباشرة، بل ترسل event أو command. استخدمه لتقليل التحديثات المتبادلة، مع إبقاء التدفق بسيطًا في features الصغيرة.",
    commonMistakes: ["تعديل shared model من أي Widget مباشرة.", "إضافة طبقات event ضخمة لزر واحد بلا فائدة."],
    followUpQuestions: ["كيف تمنع event قديمًا من الكتابة فوق state أحدث؟"],
    sources: [{ title: "Flutter docs — Unidirectional data flow", url: "https://docs.flutter.dev/app-architecture/concepts#unidirectional-data-flow" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "state-005",
    slug: "state-controller-lifecycle-and-dispose",
    trackId: "flutter",
    topicIds: ["state-management"],
    difficulty: "Mid",
    question: "إزاي تدير lifecycle للـcontroller أو notifier؟",
    shortAnswer: "أنشئ controller في owner واضح، اربط listeners في الوقت المناسب، ونظّف timers وstreams والـnotifier في dispose.",
    explanation: "كل object يملك resources يجب أن يملك نقطة cleanup معروفة. لا تجعل provider أو service يعيش للأبد افتراضيًا؛ اربط عمره بعمر feature أو التطبيق حسب الحاجة الفعلية.",
    commonMistakes: ["إنشاء controller داخل build.", "نسيان إلغاء subscription بعد مغادرة الشاشة."],
    followUpQuestions: ["متى يكون auto-dispose آمنًا ومتى تحتاج cache أطول؟"],
    sources: [{ title: "Flutter API — ChangeNotifier.dispose", url: "https://api.flutter.dev/flutter/foundation/ChangeNotifier/dispose.html" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "state-006",
    slug: "testable-state-management-boundaries",
    trackId: "flutter",
    topicIds: ["state-management"],
    difficulty: "Mid",
    question: "إزاي تخلي state management قابلة للاختبار؟",
    shortAnswer: "افصل قواعد الحالة عن Widget rendering، ومرّر dependencies عبر constructor أو boundary يمكن استبداله في الاختبار.",
    explanation: "اختبر transitions من input إلى state output من غير تشغيل شجرة UI كاملة، ثم أضف اختبارات widget قليلة للتكامل. اجعل clock وrepository وnetwork قابلين للحقن بدل globals يصعب عزلها.",
    commonMistakes: ["اختبار implementation الداخلية بدل السلوك المرئي.", "ربط controller مباشرة بـHTTP client حقيقي في unit test."],
    followUpQuestions: ["ما الذي تختبره في notifier وما الذي تتركه لاختبار widget؟"],
    sources: [{ title: "Flutter docs — Testing architecture", url: "https://docs.flutter.dev/app-architecture/case-study/testing" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "state-007",
    slug: "valuenotifier-and-changenotifier",
    trackId: "flutter",
    topicIds: ["state-management"],
    difficulty: "Junior",
    question: "متى تختار ValueNotifier ومتى تختار ChangeNotifier؟",
    shortAnswer: "ValueNotifier مناسب لقيمة واحدة مع setter وإشعار، بينما ChangeNotifier أنسب عندما تملك model أو أكثر من field وعمليات مترابطة.",
    explanation: "ابدأ بالأبسط: ValueNotifier<T> لحالة صغيرة، وChangeNotifier عندما تحتاج methods وقراءة أكثر من قيمة. كلاهما يحتاج owner واضحًا وdispose، ولا يحل وحده مشكلة async أو persistence.",
    codeExample: `final selectedTab = ValueNotifier<int>(0);
selectedTab.value = 1;`,
    commonMistakes: ["تغيير محتوى mutable value داخل ValueNotifier من غير استبدال value.", "استخدام ChangeNotifier ضخم لكل feature في التطبيق."],
    followUpQuestions: ["كيف تربط Listenable بـListenableBuilder؟"],
    sources: [
      { title: "Flutter API — ValueNotifier", url: "https://api.flutter.dev/flutter/foundation/ValueNotifier-class.html" },
      { title: "Flutter API — ChangeNotifier", url: "https://api.flutter.dev/flutter/foundation/ChangeNotifier-class.html" },
    ],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "state-008",
    slug: "streams-vs-notifiers-for-state",
    trackId: "flutter",
    topicIds: ["state-management"],
    difficulty: "Mid",
    question: "متى تستخدم Stream بدل notifier لإدارة state؟",
    shortAnswer: "Stream مناسب لتتابع أحداث أو بيانات asynchronous، بينما notifier أبسط لحالة حالية synchronous تحتاج قراءة مباشرة.",
    explanation: "اختر Stream عندما يكون الزمن والترتيب والـerror جزءًا من العقد، مثل socket أو repository events. لا تحول boolean محلية إلى Stream بلا سبب؛ التعقيد الإضافي يحتاج فائدة قابلة للقياس.",
    commonMistakes: ["إنشاء Stream جديد في كل build.", "نسيان التعامل مع loading وerror وdone states."],
    followUpQuestions: ["كيف تمنع race condition بين طلبين asynchronous؟"],
    sources: [{ title: "Flutter API — StreamBuilder", url: "https://api.flutter.dev/flutter/widgets/StreamBuilder-class.html" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "state-009",
    slug: "choosing-a-state-management-approach",
    trackId: "flutter",
    topicIds: ["state-management"],
    difficulty: "Senior",
    question: "إزاي تختار approach لإدارة state من غير اعتبار package واحدة حلًا عالميًا؟",
    shortAnswer: "قارن scope والـlifecycle وحجم الفريق والاختبار والـasync وboilerplate، ثم اختر أبسط approach تحقق احتياجات feature الحالية.",
    explanation: "setState وInheritedWidget وValueNotifier وpackages مثل Provider أو Riverpod أو BLoC أدوات لها trade-offs، وليست درجات جودة ثابتة. قيّم سهولة التتبع، migration cost، ووضوح ownership قبل الالتزام بقرار واسع.",
    commonMistakes: ["اختيار package بسبب الشيوع فقط.", "خلط أربع approaches في feature واحدة من غير حدود."],
    followUpQuestions: ["ما مؤشرات أن approach الحالية أصبحت عنق زجاجة؟"],
    sources: [{ title: "Flutter docs — State management options", url: "https://docs.flutter.dev/data-and-backend/state-mgmt/options" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "state-010",
    slug: "state-restoration-and-persistence",
    trackId: "flutter",
    topicIds: ["state-management"],
    difficulty: "Senior",
    question: "إيه الفرق بين state داخل الذاكرة وstate التي تحتاج restoration أو persistence؟",
    shortAnswer: "memory state تختفي عند إنهاء العملية، أما restoration أو persistence فتحتاج عقدًا واضحًا لما يُحفظ ومتى يُستعاد وأين.",
    explanation: "لا تحفظ كل object تلقائيًا؛ اختر قيمًا صغيرة قابلة للتسلسل مثل navigation أو form draft، وحدد سلوك stale data والترقية. استخدم restoration للعودة بعد أن ينهي النظام تطبيقًا كان في الخلفية عندما يدعمها flow، وتخزينًا دائمًا للبيانات التي يجب أن تعيش أطول.",
    commonMistakes: ["اعتبار state restoration بديلًا لقاعدة بيانات.", "حفظ secrets أو tokens في restoration bundle بلا حماية."],
    followUpQuestions: ["متى تحتاج RestorationMixin ومتى تحتاج storage package؟"],
    sources: [
      { title: "Flutter API — RestorationMixin", url: "https://api.flutter.dev/flutter/widgets/RestorationMixin-mixin.html" },
      { title: "Flutter API — RestorationManager", url: "https://api.flutter.dev/flutter/widgets/RestorationManager-class.html" },
    ],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "nav-001",
    slug: "navigator-route-stack-and-push-pop",
    trackId: "flutter",
    topicIds: ["navigation"],
    difficulty: "Junior",
    question: "إزاي يشتغل route stack في Navigator؟",
    shortAnswer: "Navigator يحتفظ بمكدس routes؛ push يضيف شاشة، وpop يزيل الحالية ويرجع لما تحتها.",
    explanation: "تعامل مع route كحالة تنقل لها owner واضح، وتحقق من canPop قبل pop عندما لا تضمن وجود route سابقة. لا تضع side effects في build لمجرد فتح شاشة.",
    codeExample: `Navigator.of(context).push(
  MaterialPageRoute(builder: (_) => const DetailsPage()),
);

// داخل DetailsPage بعد انتهاء التفاعل:
Navigator.of(context).pop();`,
    commonMistakes: ["استدعاء pop من context خارج Navigator المقصود.", "فتح نفس route عدة مرات من غير قرار واضح حول stack."],
    followUpQuestions: ["متى تستخدم pushReplacement أو pushAndRemoveUntil؟"],
    sources: [{ title: "Flutter API — Navigator", url: "https://api.flutter.dev/flutter/widgets/Navigator-class.html" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "nav-002",
    slug: "passing-data-between-flutter-routes",
    trackId: "flutter",
    topicIds: ["navigation"],
    difficulty: "Junior",
    question: "إيه الطرق الواضحة لتمرير data بين routes؟",
    shortAnswer: "مرّر required constructor arguments للصفحة الجديدة، وأعد نتيجة من pop عندما تحتاج الشاشة السابقة قيمة.",
    explanation: "constructor يجعل contract الشاشة typed ومباشرًا، وpop(result) يعيد نتيجة إلى caller. لا تعتمد على global mutable object أو arguments غير typed لإخفاء dependency.",
    codeExample: `final saved = await Navigator.push<bool>(
  context,
  MaterialPageRoute(builder: (_) => EditPage(id: item.id)),
);`,
    commonMistakes: ["تمرير object ضخم لكل route بدل identifier أو contract صغير.", "تجاهل نتيجة pop ثم تحديث UI اعتمادًا على قيمة قديمة."],
    followUpQuestions: ["كيف تتعامل مع نتيجة route أُغلقت من system back؟"],
    sources: [
      { title: "Flutter cookbook — Pass data to a new screen", url: "https://docs.flutter.dev/cookbook/navigation/passing-data" },
      { title: "Flutter cookbook — Return data from a screen", url: "https://docs.flutter.dev/cookbook/navigation/returning-data" },
    ],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "nav-003",
    slug: "deep-links-and-route-information",
    trackId: "flutter",
    topicIds: ["navigation"],
    difficulty: "Mid",
    question: "ما الذي يجب أن يحدث عند فتح deep link مباشرة؟",
    shortAnswer: "يحوّل التطبيق URL إلى route state قابلة للفهم، ويتحقق من الصلاحيات والبيانات ثم يبني stack مناسبًا بدل افتراض أن المستخدم بدأ من home.",
    explanation: "صمّم parsing للـpath والـquery مع fallback عند URL غير صالح، وراعِ restoration وback behavior. لا تضع object غير قابل للتسلسل داخل الرابط؛ استخدم معرفًا ثم حمّل التفاصيل من boundary مناسبة.",
    commonMistakes: ["عمل deep link لا يمكن الرجوع منه منطقيًا.", "كشف بيانات حساسة في query string أو تجاهل auth عند فتح الرابط."],
    followUpQuestions: ["ما الفرق بين cold-start وwarm deep link؟"],
    sources: [{ title: "Flutter docs — Deep linking", url: "https://docs.flutter.dev/ui/navigation/deep-linking" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "nav-004",
    slug: "imperative-vs-declarative-navigation",
    trackId: "flutter",
    topicIds: ["navigation"],
    difficulty: "Senior",
    question: "إمتى تختار imperative navigation وإمتى declarative navigation؟",
    shortAnswer: "imperative مناسب لأمر انتقال محلي سريع، بينما declarative يصف stack من state ويُفضّل عندما تتغير الروابط أو auth أو deep links باستمرار.",
    explanation: "في declarative navigation يكون route state مصدر الحقيقة ويمكن إعادة بنائه من URL أو session. لا تستخدم نمطًا معقدًا لمجرد شاشة واحدة، ولا تخلط مصادر متعددة تتحكم في stack بلا ownership واضح.",
    commonMistakes: ["التنقل من عدة أماكن مع اختلاف تفسير auth state.", "اعتبار declarative مجرد API مختلفة لـpush وpop."],
    followUpQuestions: ["كيف تمنع redirect loop في router declarative؟"],
    sources: [{ title: "Flutter docs — Navigation and routing", url: "https://docs.flutter.dev/ui/navigation" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "nav-005",
    slug: "nested-navigation-flows",
    trackId: "flutter",
    topicIds: ["navigation"],
    difficulty: "Mid",
    question: "كيف تصمم nested navigation لتبويبات أو flow مستقل؟",
    shortAnswer: "امنح كل flow Navigator أو route scope واضحًا، وحدد أي back action يخص child وأيها يخرج إلى parent.",
    explanation: "النقل المتداخل مفيد عندما يحتفظ كل tab بتاريخ تنقله، لكنه يضيف حدودًا للـcontext وback handling. لا تنشئ Navigatorات كثيرة بلا حاجة؛ وثّق owner لكل stack واختبر system back على المنصات المستهدفة.",
    commonMistakes: ["إرسال pop إلى Navigator الخطأ بسبب context قريب.", "فقدان تاريخ tab عند كل تبديل لأنها تعاد من الصفر."],
    followUpQuestions: ["متى يكفي IndexedStack بدل nested Navigator؟"],
    sources: [{ title: "Flutter API — Navigator", url: "https://api.flutter.dev/flutter/widgets/Navigator-class.html" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "net-001",
    slug: "http-responses-and-status-codes",
    trackId: "flutter",
    topicIds: ["networking"],
    difficulty: "Junior",
    question: "إزاي تفسر HTTP response وتتعامل مع status codes؟",
    shortAnswer: "افحص status code وheaders وbody معًا؛ 2xx نجاح، 4xx مشكلة في الطلب أو الصلاحية، و5xx مشكلة مؤقتة في الخادم غالبًا.",
    explanation: "حوّل response إلى نتيجة domain مفهومة بدل نشر HttpResponse في كل UI. ميّز 401 عن 403 وعن 404 وعن 429، ولا تعتبر أي body يصل عبر الشبكة نجاحًا تلقائيًا.",
    commonMistakes: ["اعتبار status code أي شيء غير exception نجاحًا.", "إعادة محاولة 4xx غير القابلة للإصلاح بلا تغيير الطلب."],
    followUpQuestions: ["متى تعيد محاولة 429 أو 503؟"],
    sources: [{ title: "Dart API — HttpClientResponse", url: "https://api.dart.dev/dart-io/HttpClientResponse-class.html" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "net-002",
    slug: "json-serialization-and-typed-models",
    trackId: "flutter",
    topicIds: ["networking"],
    difficulty: "Junior",
    question: "ليه نعمل JSON serialization إلى typed models؟",
    shortAnswer: "typed model يضع contract للبيانات ويعزل parsing عن UI، فيكشف الحقول المفقودة أو المتغيرة قبل انتشارها في التطبيق.",
    explanation: "تحقق من nullability والأنواع عند boundary الشبكة، واحتفظ بتحويل JSON في data layer. generator أو parsing يدوي كلاهما خيار؛ القرار يعتمد على حجم schema وتكرارها وليس على package واحدة.",
    codeExample: `factory User.fromJson(Map<String, Object?> json) => User(
  id: json["id"]! as String,
  name: json["name"]! as String,
);`,
    commonMistakes: ["تمرير Map<String, dynamic> إلى كل طبقات التطبيق.", "افتراض أن API schema ثابتة بلا versioning أو validation."],
    followUpQuestions: ["كيف تتعامل مع field جديد لا يعرفه إصدار التطبيق؟"],
    sources: [{ title: "Flutter docs — JSON serialization", url: "https://docs.flutter.dev/data-and-backend/serialization/json" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "net-003",
    slug: "future-loading-success-and-error-states",
    trackId: "flutter",
    topicIds: ["networking"],
    difficulty: "Junior",
    question: "إزاي تعرض loading وsuccess وerror لطلب شبكة؟",
    shortAnswer: "مثّل حالة الطلب صراحةً بدل boolean واحد، واعرض UI مناسبًا لكل من loading وdata وerror مع إمكانية retry واضحة.",
    explanation: "FutureBuilder يسهّل ربط Future بالواجهة، لكن أنشئ Future خارج build حتى لا يبدأ الطلب من جديد مع كل rebuild. انقل orchestration إلى controller عندما تتعدد الطلبات أو تحتاج caching.",
    commonMistakes: ["إنشاء Future داخل build.", "إخفاء error برسالة عامة من غير logging أو retry."],
    followUpQuestions: ["كيف تميز empty state عن error state؟"],
    sources: [{ title: "Flutter API — FutureBuilder", url: "https://api.flutter.dev/flutter/widgets/FutureBuilder-class.html" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "net-004",
    slug: "network-timeouts-and-retry-boundaries",
    trackId: "flutter",
    topicIds: ["networking"],
    difficulty: "Mid",
    question: "فين تحط timeout وretry في network client؟",
    shortAnswer: "ضع timeout عند boundary الخارجية، واجعل retry محدودًا ومشروطًا بأخطاء مؤقتة مع backoff وبدون تكرار side effects خطرة.",
    explanation: "حدّد budget زمنيًا للمحاولة، وسجّل سبب الانقطاع، ولا تعيد POST غير idempotent بلا idempotency key أو عقد واضح. لا تجعل كل UI يقرر سياسة retry الخاصة به.",
    commonMistakes: ["retry فوري بلا حد فيزيد الحمل.", "إخفاء timeout كأنه response فارغ."],
    followUpQuestions: ["كيف تختار retryable status codes؟"],
    sources: [
      { title: "Dart API — Future.timeout", url: "https://api.dart.dev/dart-async/Future/timeout.html" },
      { title: "RFC 9110 — HTTP Semantics", url: "https://www.rfc-editor.org/rfc/rfc9110#name-retry-after" },
    ],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "net-005",
    slug: "cancelling-network-work-with-widget-lifecycle",
    trackId: "flutter",
    topicIds: ["networking"],
    difficulty: "Mid",
    question: "إزاي تمنع نتيجة network قديمة من تحديث Widget بعد خروجها؟",
    shortAnswer: "اربط العملية بعمر owner، ألغِ subscription أو استخدم cancellation support، وافحص mounted قبل setState بعد await.",
    explanation: "الإلغاء الحقيقي يعتمد على client؛ لو غير متاح، تجاهل النتيجة بعد dispose وامنع race عبر request id أو controller. لا تفترض أن Future.timeout يلغي العمل الموجود على الشبكة تلقائيًا.",
    commonMistakes: ["استدعاء setState بعد dispose.", "اعتبار timeout إلغاءً للـsocket أو server request."],
    followUpQuestions: ["كيف تمنع response أقدم من الكتابة فوق أحدث request؟"],
    sources: [{ title: "Flutter API — State lifecycle", url: "https://api.flutter.dev/flutter/widgets/State-class.html" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "net-006",
    slug: "service-repository-network-boundaries",
    trackId: "flutter",
    topicIds: ["networking"],
    difficulty: "Senior",
    question: "إيه الفرق بين network service وrepository في architecture؟",
    shortAnswer: "service يتعامل مع transport وserialization، بينما repository ينسق مصدر البيانات ويعرض contract domain مناسبًا لباقي التطبيق.",
    explanation: "الفصل يمنع UI من معرفة headers وJSON ويجعل تبديل remote أو cache قابلًا للاختبار. لا تضف طبقة repository لمجرد تسمية wrapper؛ يجب أن تملك boundary أو قرارًا حقيقيًا.",
    commonMistakes: ["تسريب DTOs وHTTP exceptions إلى Widgets.", "عمل service وrepository متطابقين بلا مسؤولية مختلفة."],
    followUpQuestions: ["أين تضع cache وmapping إلى domain model؟"],
    sources: [{ title: "Flutter docs — App architecture", url: "https://docs.flutter.dev/app-architecture/guide" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "net-007",
    slug: "websockets-and-stream-lifecycle",
    trackId: "flutter",
    topicIds: ["networking"],
    difficulty: "Senior",
    question: "متى تستخدم WebSocket وما الذي يجب إدارته في lifecycle؟",
    shortAnswer: "WebSocket مناسب لتدفق ثنائي الاتجاه شبه فوري؛ يجب إدارة reconnect وbackoff وauth وclose وإلغاء listener عند انتهاء owner.",
    explanation: "صمّم connection state مثل connecting وopen وclosed وerror، وميّز إعادة الاتصال من إعادة إرسال message. لا تستخدم WebSocket لتحديثات نادرة يمكن أن تخدمها request عادية أو polling بسيط.",
    commonMistakes: ["فتح socket جديد مع كل rebuild.", "إعادة الاتصال بلا backoff أو تسريب subscriptions بعد مغادرة الشاشة."],
    followUpQuestions: ["كيف تمنع duplicate messages بعد reconnect؟"],
    sources: [{ title: "Dart API — WebSocket", url: "https://api.dart.dev/dart-io/WebSocket-class.html" }],
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
