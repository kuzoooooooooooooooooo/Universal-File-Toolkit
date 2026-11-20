import Link from "next/link";
import { GitHubIcon } from "@/components/ui/github-icon";
import { siteConfig } from "@/config/site";

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
                <span className="text-xs font-bold text-white">FT</span>
              </div>
              <span className="font-semibold text-foreground">{siteConfig.name}</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{siteConfig.slogan}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">Tools</h3>
            <ul className="mt-3 space-y-2">
              <li><Link href="/categories/image" className="text-sm text-muted-foreground hover:text-foreground">Image Tools</Link></li>
              <li><Link href="/categories/pdf" className="text-sm text-muted-foreground hover:text-foreground">PDF Tools</Link></li>
              <li><Link href="/categories/video" className="text-sm text-muted-foreground hover:text-foreground">Video Tools</Link></li>
              <li><Link href="/tools" className="text-sm text-muted-foreground hover:text-foreground">All Tools</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">Project</h3>
            <ul className="mt-3 space-y-2">
              <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">Privacy Policy</Link></li>
              <li><Link href="/about" className="text-sm text-muted-foreground hover:text-foreground">About</Link></li>
              <li><a href={siteConfig.github} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground">GitHub</a></li>
              <li><a href={`${siteConfig.github}/blob/main/CONTRIBUTING.md`} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground">Contribute</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">Legal</h3>
            <ul className="mt-3 space-y-2">
              <li><span className="text-sm text-muted-foreground">License: {siteConfig.license}</span></li>
              <li><span className="text-sm text-muted-foreground">No tracking. No cookies. No telemetry.</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex items-center justify-between border-t border-border/50 pt-6">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {siteConfig.name}. Open-source under MIT license.
          </p>
          <a href={siteConfig.github} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
            <GitHubIcon className="h-4 w-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}
