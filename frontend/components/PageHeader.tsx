type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  image?: string;
};

export default function PageHeader({ eyebrow, title, description, image }: Props) {
  if (image) {
    return (
      <div className="relative overflow-hidden border-b border-[var(--line)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-navy)]/95 via-[var(--brand-navy)]/70 to-[var(--brand-navy)]/40" />
        <div className="relative mx-auto max-w-4xl px-5 py-20 text-center md:py-28">
          {eyebrow && <p className="mb-3 text-sm font-semibold text-[var(--gold-soft)]">{eyebrow}</p>}
          <h1 className="text-balance text-3xl font-extrabold text-white md:text-4xl">{title}</h1>
          {description && (
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/85 md:text-base">
              {description}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden border-b border-[var(--line)] bg-[var(--paper-raised)]">
      <div className="mx-auto max-w-4xl px-5 py-16 text-center">
        {eyebrow && (
          <p className="mb-3 text-sm font-semibold text-[var(--brick)]">{eyebrow}</p>
        )}
        <h1 className="text-balance text-3xl font-extrabold text-[var(--green-deeper)] md:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--ink-soft)] md:text-base">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
