import Link from "next/link";

/*
 * THESIS: Turn a dead link into a calm reset point instead of a generic error card.
 * OWN-WORLD: The existing blue study-room palette, with a single cyan route marker and quiet orbital motion.
 * STORY: The visitor understands the page moved, recognizes the product, and returns to the Arabic library or home.
 * FIRST VIEWPORT: A centered 404 route marker sits beside the message; recovery actions stay directly beneath it.
 * FORM: Full-width error state, compact two-action recovery, with motion staged as a slow signal sweep.
 */
export default function NotFound() {
  return (
    <section className="not-found-page" aria-labelledby="not-found-title">
      <div className="not-found-scene" aria-hidden="true">
        <span className="not-found-orbit not-found-orbit-one" />
        <span className="not-found-orbit not-found-orbit-two" />
        <span className="not-found-node not-found-node-one" />
        <span className="not-found-node not-found-node-two" />
        <span className="not-found-node not-found-node-three" />
        <span className="not-found-route">404</span>
      </div>
      <div className="not-found-copy">
        <span className="eyebrow">Tech Interview Prep · Route not found</span>
        <h1 id="not-found-title">الصفحة دي خرجت من المسار.</h1>
        <p>الرابط مش موجود أو اتنقل. ارجع للمكتبة وكمّل مراجعتك من مكان واضح.</p>
        <div className="not-found-actions">
          <Link className="button primary" href="/ar/">العودة للرئيسية</Link>
          <Link className="button" href="/ar/questions/">فتح مكتبة الأسئلة</Link>
        </div>
        <p className="not-found-english">The page you’re looking for moved. Start again from the question library.</p>
      </div>
    </section>
  );
}
