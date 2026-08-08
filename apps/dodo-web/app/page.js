import PixelDodo from "./components/PixelDodo";
import PixelIcon from "./components/PixelIcon";
import Customizer from "./components/Customizer";

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
    icon: "camera",
    title: "Made from your photo",
    body: "Client-side color extraction reads your pet's real palette and paints the sprite to match.",
  },
  {
    icon: "lock",
    title: "Private by design",
    body: "No uploads, no accounts, no servers. Your photo is processed entirely on your machine.",
  },
  {
    icon: "paw",
    title: "Actually alive",
    body: "Dodo lives on your desktop and reacts to your mouse and typing — a tiny companion while you work.",
  },
  {
    icon: "coin",
    title: "Free to start",
    body: "Download the app and skin it with your pet at no cost. No payment, no catch.",
  },
];

export default function Home() {
  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-20 border-b-2 border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="#top" className="flex items-center gap-3">
            <PixelIcon name="paw" className="h-5 w-5 text-foreground" />
            <span className="font-pixel text-[14px] tracking-tight">Dodo</span>
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
          <a href={DOWNLOAD_URL} className="btn-pixel btn-primary">
            Download
          </a>
        </div>
      </header>

      <main id="top" className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
            <div>
              <span className="inline-flex items-center gap-2 border-2 border-border px-3 py-1 font-pixel text-[9px] uppercase text-muted">
                <span className="h-1.5 w-1.5 bg-foreground" />
                Pixel-art desktop pets
              </span>
              <h1 className="font-pixel mt-6 text-[22px] leading-[1.5] sm:text-[30px] md:text-[38px]">
                Your pet,
                <br />
                on your desktop.
              </h1>
              <p className="mt-6 max-w-md text-lg text-muted">
                Upload a photo and Dodo turns it into a personalized pixel-art
                companion that lives on your screen and reacts to you. Free,
                private, and made entirely in your browser.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-5">
                <a href="#create" className="btn-pixel btn-primary">
                  Customize your pet
                </a>
                <a href={DOWNLOAD_URL} className="btn-pixel btn-secondary">
                  Download for Mac
                </a>
              </div>
              <p className="mt-5 text-xs text-muted">
                Windows coming soon · No account needed
              </p>
            </div>

            {/* Hero visual — the one place color is allowed (the pet). */}
            <div className="relative mx-auto w-full max-w-sm">
              <div className="pixel-monitor">
                <div className="pixel-screen">
                  <PixelDodo className="mx-auto w-40" />
                </div>
                <div className="mt-4 flex items-center justify-center gap-2">
                  {["#e8a33d", "#b06b18", "#fff4e4", "#2a2016", "#e8738f"].map(
                    (c) => (
                      <span
                        key={c}
                        title={c}
                        className="h-5 w-5 border-2 border-border"
                        style={{ background: c }}
                      />
                    )
                  )}
                </div>
                <p className="mt-3 text-center font-pixel text-[8px] uppercase text-muted">
                  Extracted palette
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="border-t-2 border-border py-20 md:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="font-pixel text-center text-[16px] leading-[1.6] sm:text-[20px]">
              Three steps to a
              <br className="sm:hidden" /> desktop companion
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-center text-muted">
              No design skills required. From photo to living pet in under a
              minute.
            </p>
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {STEPS.map((s) => (
                <div key={s.n} className="card-pixel p-7">
                  <div className="font-pixel text-[13px] text-foreground">
                    {s.n}
                  </div>
                  <h3 className="font-pixel mt-4 text-[12px] leading-[1.5]">
                    {s.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="border-t-2 border-border py-20 md:py-24"
        >
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="font-pixel text-[16px] leading-[1.6] sm:text-[20px]">
              Small, personal,
              <br className="sm:hidden" /> and yours.
            </h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {FEATURES.map((f) => (
                <div key={f.title} className="card-pixel flex gap-5 p-7">
                  <PixelIcon
                    name={f.icon}
                    className="mt-1 h-8 w-8 shrink-0 text-foreground"
                  />
                  <div>
                    <h3 className="font-pixel text-[12px] leading-[1.5]">
                      {f.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted">
                      {f.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Create — the photo-to-pet customizer (Phase 2). The Electron app
            deep-links here (DODO_WEB_URL = .../#create) from "Get a new pet…". */}
        <section
          id="create"
          className="border-t-2 border-border px-6 py-20 md:py-24"
        >
          <div className="mx-auto max-w-5xl">
            <h2 className="font-pixel text-center text-[16px] leading-[1.6] sm:text-[22px]">
              Make your pet
            </h2>
            <p className="mx-auto mt-5 mb-14 max-w-xl text-center text-muted">
              Upload a photo, frame the fur, and download a config that skins
              the app to match your pet&apos;s colors.
            </p>
            <Customizer />
            <div className="mt-16 text-center">
              <p className="mb-5 text-sm text-muted">
                Got your config? Grab the app and import it on first launch.
              </p>
              <a href={DOWNLOAD_URL} className="btn-pixel btn-secondary">
                Download for Mac
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted sm:flex-row">
          <div className="flex items-center gap-3">
            <PixelIcon name="paw" className="h-4 w-4 text-muted" />
            <span>Dodo — a tiny desktop companion.</span>
          </div>
          <div>© {new Date().getFullYear()} Dodo</div>
        </div>
      </footer>
    </>
  );
}
