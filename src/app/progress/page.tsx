import { questions } from "../../content/questions";
import { ProgressDashboard } from "./progress-dashboard";

export const metadata = { title: "تقدمي" };

export default function ProgressPage() {
  return (
    <section className="shell section">
      <header className="page-header">
        <span className="eyebrow">تقدمك على الجهاز</span>
        <h1>تقدمي</h1>
        <p>حالتك محفوظة على الجهاز ده فقط، من غير حساب أو إرسال بيانات.</p>
      </header>
      <ProgressDashboard questions={questions.map(({ id, slug, question }) => ({ id, slug, question }))} />
    </section>
  );
}
