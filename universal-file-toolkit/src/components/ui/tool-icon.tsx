import {
  Image,
  FileText,
  Video,
  Music,
  FileSpreadsheet,
  Archive,
  Code,
  Minimize2,
  Maximize2,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Image,
  FileText,
  Video,
  Music,
  FileSpreadsheet,
  Archive,
  Code,
  Minimize2,
  Maximize2,
};

export function ToolIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? Code;
  return <Icon className={className} />;
}
