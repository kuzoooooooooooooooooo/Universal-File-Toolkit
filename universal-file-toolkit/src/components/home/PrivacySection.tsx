import { Cpu, ShieldCheck, FileLock } from "lucide-react";

const ITEMS = [
  {
    Icon: Cpu,
    title: "Processed on your device",
    text: "All conversions run in your browser using Web Workers and WebAssembly. Your CPU does the work, not a remote server.",
  },
  {
    Icon: ShieldCheck,
    title: "Nothing leaves your machine",
    text: "No uploads, no analytics, no tracking cookies, no fingerprinting. File names, contents and metadata are never transmitted.",
  },
  {
    Icon: FileLock,
    title: "Ephemeral by design",
    text: "Temporary object URLs and worker memory are released as soon as you finish. Close the tab and nothing remains.",
  },
];

export function PrivacySection() {
  return (
    <section className="border-t border-border/50 bg-card/30 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-center text-2xl font-semibold text-foreground">
          Privacy is the architecture, not a feature
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted-foreground">
          Most &quot;free&quot; converters upload your files to their servers.
          We built the opposite: a local-first pipeline where the server only
          ships static code.
        </p>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {ITEMS.map(({ Icon, title, text }) => (
            <div
              key={title}
              className="rounded-xl border border-border/60 bg-card p-6"
            >
              <Icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
