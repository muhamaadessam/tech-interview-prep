import Link from "next/link";

import { localizedHref, type Locale } from "../i18n";
import { repositoryUrl } from "./site-config";

type LegalKind = "privacy" | "terms";

const content = {
  ar: {
    privacy: {
      eyebrow: "الخصوصية",
      title: "سياسة الخصوصية",
      intro:
        "تشرح هذه الصفحة باختصار ما نحتاجه لتشغيل تحضير المقابلات التقنية وكيف نتعامل معه.",
      sections: [
        [
          "ما الذي نحتاجه؟",
          "يمكنك تصفح الأسئلة العامة بدون حساب. عند تسجيل الدخول، يزوّدنا Clerk بمعرّف الحساب وحالة المصادقة وبعض بيانات الحساب التي تختار مشاركتها. يحفظ الحساب تقدّمك ومفضلاتك وتفضيلات المسارات والمساهمات التي ترسلها.",
        ],
        [
          "كيف نستخدم البيانات؟",
          "نستخدمها لعرض المحتوى، مزامنة حالتك بين أجهزتك، حماية الخدمة من إساءة الاستخدام، ومراجعة مساهمات المجتمع. لا نبيع بياناتك ولا نستخدمها للإعلانات السلوكية.",
        ],
        [
          "مقدمو الخدمات",
          "تتم المصادقة عبر Clerk، ويعمل الـbackend على Vercel، وتستضيف الواجهة Cloudflare Pages. يتعامل الـbackend مع قاعدة البيانات نيابةً عن المتصفح؛ لا يتصل المتصفح بقاعدة البيانات مباشرة. قد تُرسل المساهمات إلى GitHub للمراجعة.",
        ],
        [
          "المحتوى العام",
          "قد تصبح المساهمة التي توافق على نشرها متاحة للعامة بعد المراجعة، وقد تتضمن اسم العرض والمحتوى والمراجع التي أرسلتها. لا ترسل معلومات شخصية لا تريد نشرها.",
        ],
        [
          "الاحتفاظ والحذف",
          "نحتفظ بالبيانات طالما كانت لازمة لتقديم الخدمة أو الوفاء بالتزامات المراجعة. لطلب تصحيح أو حذف، افتح Issue على مستودع المشروع مع توضيح الطلب، من دون نشر بيانات حساسة.",
        ],
        [
          "الأمان والتحديثات",
          "نطبق ضوابط وصول وممارسات معقولة لحماية البيانات، لكن لا توجد خدمة على الإنترنت تضمن أمانًا مطلقًا. قد نحدّث هذه السياسة عند تغيير الخدمة، وسننشر النسخة الحالية هنا.",
        ],
      ],
    },
    terms: {
      eyebrow: "الاستخدام",
      title: "شروط الاستخدام",
      intro:
        "باستخدام الموقع، توافق على الشروط التالية. إذا لم توافق، توقف عن استخدام الخدمة.",
      sections: [
        [
          "الخدمة التعليمية",
          "الموقع أداة للمراجعة والتعلم. المحتوى لا يضمن اجتياز مقابلة أو الحصول على وظيفة، ولا يغني عن الرجوع إلى التوثيق الرسمي أو التحقق من المعلومات بنفسك.",
        ],
        [
          "الحساب والمسؤولية",
          "أنت مسؤول عن بيانات الدخول ونشاط حسابك. استخدم حسابك بطريقة قانونية، ولا تحاول تجاوز المصادقة أو حدود الاستخدام أو الوصول إلى بيانات مستخدمين آخرين.",
        ],
        [
          "المساهمات",
          "يجب أن تكون المساهمة أصلية أو لديك حق نشرها، وأن تكون المراجع صحيحة وملائمة. عند الموافقة على النشر، تمنح المشروع ترخيص CC BY 4.0 للمساهمة حتى يمكن عرضها وتعديلها مع نسبها إليك.",
        ],
        [
          "المراجعة والإزالة",
          "نحتفظ بحق تعديل أو رفض أو إزالة أي مساهمة تخالف هذه الشروط أو تضر بجودة المكتبة، من دون التزام بقبول كل مساهمة أو إبقائها متاحة.",
        ],
        [
          "الروابط والتوافر",
          "قد تتضمن الإجابات روابط لخدمات خارجية لا نتحكم فيها. نبذل جهدًا للحفاظ على الموقع، لكن قد تحدث صيانة أو انقطاعات أو تغييرات في المحتوى دون ضمان توافر مستمر.",
        ],
        [
          "التحديث والتواصل",
          "قد نعدّل هذه الشروط عند تطوير الخدمة. استمرارك في الاستخدام بعد نشر التعديل يعني قبول النسخة الجديدة. للاستفسارات أو طلبات الحقوق، استخدم مستودع المشروع على GitHub.",
        ],
      ],
    },
  },
  en: {
    privacy: {
      eyebrow: "Privacy",
      title: "Privacy policy",
      intro:
        "This page explains what Tech Interview Prep needs to run and how that information is handled.",
      sections: [
        [
          "What we need",
          "You can browse public questions without an account. When you sign in, Clerk provides an account identifier, authentication state, and some account details you choose to share. Your account can store progress, favorites, Track Preferences, and submissions.",
        ],
        [
          "How we use it",
          "We use data to provide the catalogue, sync your state across devices, protect the service from abuse, and review community contributions. We do not sell your data or use it for behavioral advertising.",
        ],
        [
          "Service providers",
          "Authentication is provided by Clerk, the Node backend runs on Vercel, and the frontend is hosted on Cloudflare Pages. The backend talks to the database on the browser’s behalf; the browser does not connect to the database directly. Submissions may be sent to GitHub for review.",
        ],
        [
          "Public contributions",
          "A contribution you approve for publication may become public after review and can include your display name, content, and submitted references. Do not send personal information you do not want published.",
        ],
        [
          "Retention and deletion",
          "We keep data while it is needed to provide the service or complete moderation work. To request correction or deletion, open an Issue in the project repository without posting sensitive information.",
        ],
        [
          "Security and updates",
          "We use reasonable access controls and operational practices to protect data, but no internet service can promise absolute security. We may update this policy as the service changes and will publish the current version here.",
        ],
      ],
    },
    terms: {
      eyebrow: "Use of the service",
      title: "Terms of use",
      intro:
        "By using this website, you agree to these terms. If you do not agree, stop using the service.",
      sections: [
        [
          "Educational service",
          "This site is a study aid. Its content does not guarantee an interview result or a job, and it does not replace official documentation or your own verification.",
        ],
        [
          "Account responsibility",
          "You are responsible for your credentials and activity on your account. Use the service lawfully and do not bypass authentication, usage limits, or access controls.",
        ],
        [
          "Contributions",
          "A submission must be original or something you have the right to publish, with accurate and relevant references. By approving publication, you grant the project a CC BY 4.0 license so the contribution can be displayed and adapted with attribution.",
        ],
        [
          "Review and removal",
          "We may edit, reject, or remove a contribution that violates these terms or harms the quality of the catalogue. We do not promise to accept or keep every submission.",
        ],
        [
          "Links and availability",
          "Answers may link to external services that we do not control. We work to keep the site available, but maintenance, outages, and content changes can happen without a guarantee of uninterrupted service.",
        ],
        [
          "Updates and contact",
          "We may change these terms as the service evolves. Continuing to use the service after an update means you accept the new version. For questions or rights requests, use the project repository on GitHub.",
        ],
      ],
    },
  },
} as const;

export function LegalPage({
  locale,
  kind,
}: {
  locale: Locale;
  kind: LegalKind;
}) {
  const page = content[locale][kind];
  const otherKind: LegalKind = kind === "privacy" ? "terms" : "privacy";
  const otherLabel =
    locale === "ar"
      ? otherKind === "privacy"
        ? "سياسة الخصوصية"
        : "شروط الاستخدام"
      : otherKind === "privacy"
        ? "Privacy policy"
        : "Terms of use";

  return (
    <article className="shell section legal-page">
      <header className="page-header">
        <span className="eyebrow">{page.eyebrow}</span>
        <h1>{page.title}</h1>
        <p>{page.intro}</p>
        <p className="legal-updated">
          {locale === "ar"
            ? "آخر تحديث: 1 سبتمبر 2026"
            : "Last updated: September 1, 2026"}
        </p>
      </header>
      <div className="legal-content">
        {page.sections.map(([heading, text]) => (
          <section className="legal-section" key={heading}>
            <h2>{heading}</h2>
            <p>{text}</p>
          </section>
        ))}
      </div>
      <div className="legal-actions">
        <Link className="button" href={localizedHref(locale, `/${otherKind}`)}>
          {otherLabel}
        </Link>
        <a
          className="text-link"
          href={repositoryUrl}
          target="_blank"
          rel="noreferrer"
        >
          {locale === "ar" ? "التواصل عبر GitHub" : "Contact on GitHub"}
        </a>
      </div>
    </article>
  );
}
