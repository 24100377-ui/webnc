import { Construction } from 'lucide-react';

export default function PagePlaceholder({ eyebrow, title, description, items = [] }) {
  return (
    <div className="animate-fade-up space-y-6">
      <header className="space-y-1.5">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">{title}</h1>
        <p className="max-w-2xl text-sm leading-relaxed muted">{description}</p>
      </header>

      <section className="card p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
            <Construction className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold">Màn hình đang được dựng</p>

          </div>
        </div>

        {items.length > 0 && (
          <ul className="mt-6 space-y-3">
            {items.map((item, index) => (
              <li key={item} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] font-bold muted" style={{ borderColor: 'var(--border)' }}>
                  {index + 1}
                </span>
                <span className="leading-relaxed muted">{item}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
