import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getToolById, getSupportedTools } from "@/lib/registry/tool-registry";
import { ToolWorkspace } from "@/components/tool/ToolWorkspace";
import { MultiFileWorkspace } from "@/components/tool/MultiFileWorkspace";
import { PdfToJpgWorkspace } from "@/components/tool/PdfToJpgWorkspace";
import { TextToolWorkspace } from "@/components/tool/TextToolWorkspace";
import { ArchiveExtractWorkspace } from "@/components/tool/ArchiveExtractWorkspace";
import { HashWorkspace } from "@/components/tool/HashWorkspace";
import { UuidWorkspace } from "@/components/tool/UuidWorkspace";
import { FileToTextWorkspace } from "@/components/tool/FileToTextWorkspace";
import { FileToBlobWorkspace } from "@/components/tool/FileToBlobWorkspace";

export function generateStaticParams() {
  return getSupportedTools().map((tool) => ({ slug: tool.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolById(slug);
  if (!tool) return { title: "Tool not found" };
  return { title: tool.name, description: tool.description };
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = getToolById(slug);
  if (!tool || !tool.supported) notFound();

  const ui = tool.ui ?? "single-file";
  if (ui === "multi-file") return <MultiFileWorkspace tool={tool} />;
  if (ui === "pdf-render") return <PdfToJpgWorkspace tool={tool} />;
  if (ui === "text") return <TextToolWorkspace tool={tool} />;
  if (ui === "archive-extract") return <ArchiveExtractWorkspace tool={tool} />;
  if (ui === "hash") return <HashWorkspace tool={tool} />;
  if (ui === "uuid") return <UuidWorkspace tool={tool} />;
  if (ui === "file-to-text") return <FileToTextWorkspace tool={tool} />;
  if (ui === "file-to-blob") return <FileToBlobWorkspace tool={tool} />;
  return <ToolWorkspace tool={tool} />;
}
