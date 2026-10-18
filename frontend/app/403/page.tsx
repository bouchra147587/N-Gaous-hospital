import Link from "next/link";

export const metadata = {
  title: "غير مصرح بالوصول",
};

export default function ForbiddenPage() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center px-5 text-center">
      <h1 className="text-3xl font-extrabold text-[var(--ink)]">403 — غير مصرح بالوصول</h1>
      <p className="mt-3 text-[var(--ink-soft)]">
        ليس لديك صلاحية الوصول إلى هذه الصفحة. إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع الإدارة.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-[var(--green-deep)] px-5 py-2.5 font-semibold text-white hover:bg-[var(--green-deeper)]"
      >
        العودة إلى الصفحة الرئيسية
      </Link>
    </div>
  );
}
