export const siteConfig = {
  name: "FileToolkit",
  description:
    "Convert, edit, compress and manage your files. Fast, private, and entirely on your device.",
  slogan: "Your files. Your device. Your privacy.",
  url: process.env.NEXT_PUBLIC_URL || "http://localhost:3000",
  github: "https://github.com/kuzoooooooooooooooooo/universal-file-toolkit",
  license: "MIT",
} as const;

export const navLinks = [
  { label: "Image Tools", href: "/categories/image" },
  { label: "PDF Tools", href: "/categories/pdf" },
  { label: "Video Tools", href: "/categories/video" },
  { label: "Audio Tools", href: "/categories/audio" },
  { label: "Archive Tools", href: "/categories/archive" },
  { label: "Dev Tools", href: "/categories/devtools" },
  { label: "All Tools", href: "/tools" },
] as const;
