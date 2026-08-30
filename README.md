# Tech Interview Prep

منصة عربية مفتوحة المصدر للتجهيز لمقابلات البرمجة التقنية. يبدأ المشروع بمسار Flutter ومحتوى Dart أصلي مرتبط بالمراجع الرسمية.

## التشغيل محليًا

يتطلب Node.js 22 أو أحدث.

```bash
npm install
npm run dev
```

لتفعيل تسجيل الدخول، انسخ `.env.example` إلى `.env.local` وضع `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` من Clerk. وللنشر على GitHub Pages أضف نفس القيمة كـ Actions variable باسم `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.

الموقع static، لذلك Clerk يعمل من المتصفح فقط؛ حماية المسارات من الخادم تحتاج استضافة تدعم runtime مثل Vercel.

التحقق قبل النشر:

```bash
npm test
npm run typecheck
npm run build
```

## التراخيص

- الكود المصدري مرخص وفق [MIT](LICENSE).
- المحتوى التعليمي الأصلي، بما فيه الأسئلة والإجابات والشروحات، مرخص وفق [CC BY 4.0](LICENSE-CONTENT).
- المصادر الخارجية المشار إليها تظل مملوكة لأصحابها وتخضع لشروطهم الأصلية.
