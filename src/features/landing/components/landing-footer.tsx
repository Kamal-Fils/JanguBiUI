const LogoMark = () => (
  <svg width="26" height="26" viewBox="0 0 30 30" fill="none" aria-hidden>
    <rect x="12.5" y="2" width="5" height="26" rx="2.5" fill="#70CBFF" />
    <rect x="3" y="9.5" width="24" height="5" rx="2.5" fill="#70CBFF" />
    <circle cx="15" cy="12" r="3" fill="#06101A" />
  </svg>
);

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-background py-16">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-10">
        <div className="mb-12 grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <div className="mb-3 flex items-center gap-2 font-serif text-xl font-semibold text-foreground">
              <LogoMark />
              Jàngu Bi
            </div>
            <p className="max-w-[26ch] text-[0.875rem] leading-relaxed text-foreground/40">
              L&apos;Église du Sénégal dans votre poche.
            </p>
          </div>

          {/* Fonctionnalités */}
          <div>
            <p className="mb-4 text-[0.625rem] font-bold uppercase tracking-[.1em] text-foreground/20">
              Fonctionnalités
            </p>
            <ul className="flex flex-col gap-2.5">
              {[
                'Bible',
                'Rosaire',
                'Liturgie',
                'Actualités',
                'Messagerie',
                'Dons & Quête',
              ].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-[0.875rem] text-foreground/40 transition-colors hover:text-primary"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Paroisses */}
          <div>
            <p className="mb-4 text-[0.625rem] font-bold uppercase tracking-[.1em] text-foreground/20">
              Paroisses
            </p>
            <ul className="flex flex-col gap-2.5">
              {['Annuaire', 'Rejoindre', 'Contact'].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-[0.875rem] text-foreground/40 transition-colors hover:text-primary"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Légal */}
          <div>
            <p className="mb-4 text-[0.625rem] font-bold uppercase tracking-[.1em] text-foreground/20">
              Légal
            </p>
            <ul className="flex flex-col gap-2.5">
              {['CGU', 'Confidentialité', 'Mentions légales'].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-[0.875rem] text-foreground/40 transition-colors hover:text-primary"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <hr className="mb-6 border-border" />
        <p className="text-[0.75rem] text-foreground/20">
          © 2026 Jàngu Bi · Fait avec ❤️ pour l&apos;Église catholique du
          Sénégal
        </p>
      </div>
    </footer>
  );
}
