import { Shield, EyeOff, UserX, Heart } from "lucide-react";
import { SearchBar } from "./SearchBar";

const BADGES = [
  { label: "No Uploads", Icon: Shield },
  { label: "No Tracking", Icon: EyeOff },
  { label: "No Account Required", Icon: UserX },
  { label: "100% Free", Icon: Heart },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-24 sm:px-6 lg:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(52,120,246,0.15),transparent_60%)]"
      />
      <div className="relative mx-auto max-w-4xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Every file. Every format.{" "}
          <span className="text-primary">One place.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Convert, edit, compress and manage your files. Fast, private, and
          entirely on your device.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {BADGES.map(({ label, Icon }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-2"
            >
              <Icon className="h-4 w-4 text-primary" />
              <span className="text-sm text-secondary-foreground">{label}</span>
            </div>
          ))}
        </div>
        <div className="mt-10">
          <SearchBar />
        </div>
      </div>
    </section>
  );
}
