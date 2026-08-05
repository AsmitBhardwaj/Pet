import PixelDodo from "./components/PixelDodo";

const DOWNLOAD_URL = "https://github.com/AsmitBhardwaj/dodopet/releases/latest";

const STEPS = [
  {
    n: "01",
    title: "Upload a photo",
    body: "Drop in a picture of your pet. Everything happens in your browser — the photo never leaves your device.",
  },
  {
    n: "02",
    title: "Pick species & style",
    body: "Choose Dog, Cat, or Bear, then a shape variant. We pull the dominant colors from your photo to match its coat.",
  },
  {
    n: "03",
    title: "Download & import",
    body: "Get the Dodo app plus a tiny pet-config file. Import it on first launch and your companion comes to life.",
  },
];

const FEATURES = [
  {
    icon: "🎨",
    title: "Made from your photo",
    body: "Client-side color extraction reads your pet's real palette and paints the sprite to match.",
  },
  {
    icon: "🔒",
    title: "Private by design",
    body: "No uploads, no accounts, no servers. Your photo is processed entirely on your machine.",
  },
  {
    icon: "🐾",
    title: "Actually alive",
    body: "Dodo lives on your desktop and reacts to your mouse and typing — a tiny companion while you work.",
  },
  {
    icon: "💸",
    title: "Free to start",
    body: "Download the app and skin it with your pet at no cost. No payment, no catch.",
  },
];

export default function Home() {
  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="#top" className="flex items-center gap-2 font-semibold">
            <span className="text-xl">🐾</span>
            <span className="text-lg tracking-tight">Dodo</span>
          </a>
          <nav className="hidden items-center gap-8 text-sm text-muted sm:flex">
            <a href="#how" className="hover:text-foreground transition-colors">
              How it works
            </a>
            <a
              href="#features"
              className="hover:text-foreground transition-colors"
            >
              Features
            </a>
          </nav>
          <a
            href={DOWNLOAD_URL}
            className="rounded-full bg-gold-deep px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gold"
          >
            Download
          </a>
        </div>
      </header>

      <main id="top" className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                Pixel-art desktop pets
              </span>
              <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
                Your pet,
                <br />
                on your desktop.
              </h1>
              <p className="mt-5 max-w-md text-lg text-muted">
                Upload a photo and Dodo turns it into a personalized pixel-art
                companion that lives on your screen and reacts to you. Free,
                private, and made entirely in your browser.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href="#create"
                  className="rounded-full bg-gold-deep px-6 py-3 font-medium text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-gold"
                >
                  Customize your pet
                </a>
                <a
                  href={DOWNLOAD_URL}
                  className="rounded-full border border-border bg-surface px-6 py-3 font-medium transition-colors hover:border-gold"
                >
                  Download for Mac
                </a>
              </div>
              <p className="mt-4 text-xs text-muted">
                Windows coming soon · No account needed
              </p>
            </div>

            {/* Hero visual */}
            <div className="relative mx-auto w-full max-w-sm">
              <div className="absolute inset-0 -z-10 rounded-[2rem] bg-gold-soft blur-2xl" />
              <div className="rounded-[2rem] border border-border bg-surface p-8 shadow-xl">
                <div className="rounded-xl border border-border bg-background p-6">
                  <PixelDodo className="mx-auto w-40" />
                </div>
                <div className="mt-5 flex items-center justify-center gap-2">
                  {["#e8a33d", "#b06b18", "#fff4e4", "#2a2016", "#e8738f"].map(
                    (c) => (
                      <span
                        key={c}
                        title={c}
                        className="h-5 w-5 rounded-full border border-border"
                        style={{ background: c }}
                      />
                    )
                  )}
                </div>
                <p className="mt-3 text-center text-xs text-muted">
                  Extracted palette · placeholder preview
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section
          id="how"
          className="border-t border-border bg-surface/50 py-20 md:py-24"
        >
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
              Three steps to a desktop companion
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-muted">
              No design skills required. From photo to living pet in under a
              minute.
            </p>
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {STEPS.map((s) => (
                <div
                  key={s.n}
                  className="rounded-2xl border border-border bg-background p-7"
                >
                  <div className="font-mono text-sm text-gold-deep">{s.n}</div>
                  <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20 md:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Small, personal, and yours.
            </h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="flex gap-4 rounded-2xl border border-border bg-surface p-7"
                >
                  <div className="text-2xl">{f.icon}</div>
                  <div>
                    <h3 className="text-lg font-semibold">{f.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">
                      {f.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section id="create" className="px-6 pb-24">
          <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-gold-soft to-surface p-10 text-center md:p-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to meet your Dodo?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-muted">
              The photo-to-pet customizer is on its way. For now, grab the app
              and be first in line.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href={DOWNLOAD_URL}
                className="rounded-full bg-gold-deep px-6 py-3 font-medium text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-gold"
              >
                Download for Mac
              </a>
              <span className="rounded-full border border-border bg-background px-6 py-3 text-sm font-medium text-muted">
                Customizer — coming soon
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted sm:flex-row">
          <div className="flex items-center gap-2">
            <span>🐾</span>
            <span>Dodo — a tiny desktop companion.</span>
          </div>
          <div>© {new Date().getFullYear()} Dodo</div>
        </div>
      </footer>
    </>
  );
}
