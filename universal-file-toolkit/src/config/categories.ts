import { ToolCategoryMeta, ToolCategory } from "@/types/tool";

export const categories: Record<ToolCategory, ToolCategoryMeta> = {
  image: {
    id: "image",
    name: "Image Tools",
    description: "Convert, compress, resize and optimize images",
    icon: "Image",
    color: "#3478F6",
  },
  pdf: {
    id: "pdf",
    name: "PDF Tools",
    description: "Merge, split, compress and convert PDF documents",
    icon: "FileText",
    color: "#EF4444",
  },
  video: {
    id: "video",
    name: "Video Tools",
    description: "Convert, compress, trim and extract video",
    icon: "Video",
    color: "#8B5CF6",
  },
  audio: {
    id: "audio",
    name: "Audio Tools",
    description: "Convert, compress, trim and normalize audio",
    icon: "Music",
    color: "#F59E0B",
  },
  document: {
    id: "document",
    name: "Document Tools",
    description: "Convert documents, spreadsheets and text files",
    icon: "FileSpreadsheet",
    color: "#22C55E",
  },
  archive: {
    id: "archive",
    name: "Archive Tools",
    description: "Extract, create and manage archives",
    icon: "Archive",
    color: "#06B6D4",
  },
  devtools: {
    id: "devtools",
    name: "Developer Tools",
    description: "Format, validate, encode and generate",
    icon: "Code",
    color: "#EC4899",
  },
};

export const categoryList = Object.values(categories);
