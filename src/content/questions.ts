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
    sources: [{ title: "Dart language — Classes", url: "https://dart.dev/language/classes" }],
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
    sources: [{ title: "Dart language — Classes", url: "https://dart.dev/language/classes" }],
    lastReviewedAt: "2026-08-30",
  },
  {
    id: "oop-003",
    slug: "composition-vs-inheritance-in-flutter",
    trackId: "flutter",
    topicIds: ["oop"],
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
    sources: [{ title: "Dart language — Class modifiers", url: "https://dart.dev/language/class-modifiers" }],
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
    codeExample: `class Point {
  const Point(this.x, this.y);
  final int x;
  final int y;

  @override bool operator ==(Object other) =>
      other is Point && other.x == x && other.y == y;
  @override int get hashCode => Object.hash(x, y);
}`,
    commonMistakes: ["override == من غير hashCode.", "استخدام mutable fields في hashCode ثم تعديلها داخل Set أو Map."],
    followUpQuestions: ["لماذا يجب فحص runtime type قبل مقارنة الحقول؟"],
    sources: [{ title: "Dart language — Equality and hash code", url: "https://dart.dev/language/operators#equality-and-relational-operators" }],
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
    sources: [{ title: "Dart language — Classes", url: "https://dart.dev/language/classes" }],
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
    sources: [{ title: "Flutter docs — App architecture", url: "https://docs.flutter.dev/app-architecture" }],
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
    sources: [{ title: "Flutter docs — Design patterns", url: "https://docs.flutter.dev/app-architecture/design-patterns" }],
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
    sources: [{ title: "Dart language — Class modifiers", url: "https://dart.dev/language/class-modifiers" }],
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
    sources: [{ title: "Flutter docs — App architecture", url: "https://docs.flutter.dev/app-architecture" }],
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
    sources: [{ title: "Flutter docs — App architecture", url: "https://docs.flutter.dev/app-architecture" }],
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
    sources: [{ title: "Flutter docs — Architectural overview", url: "https://docs.flutter.dev/app-architecture/guide" }],
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
    sources: [{ title: "Flutter docs — App architecture", url: "https://docs.flutter.dev/app-architecture" }],
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
    sources: [{ title: "Flutter docs — App architecture", url: "https://docs.flutter.dev/app-architecture" }],
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
