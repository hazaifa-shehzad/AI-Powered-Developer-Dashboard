import { toJpeg, toPng } from "html-to-image";

export type ExportImageFormat = "png" | "jpeg";

export type ExportImageOptions = {
  fileName?: string;
  format?: ExportImageFormat;
  quality?: number;
  pixelRatio?: number;
  backgroundColor?: string;
};

function downloadDataUrl(dataUrl: string, fileName: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  link.click();
}

export async function exportElementAsImage(
  element: HTMLElement,
  options: ExportImageOptions = {},
) {
  if (typeof window === "undefined") {
    throw new Error("Image export is only available in the browser.");
  }

  const {
    fileName = `dashboard-export-${Date.now()}`,
    format = "png",
    quality = 0.95,
    pixelRatio = 2,
    backgroundColor,
  } = options;

  const sharedOptions = {
    cacheBust: true,
    pixelRatio,
    backgroundColor,
  };

  const dataUrl =
    format === "jpeg"
      ? await toJpeg(element, { ...sharedOptions, quality })
      : await toPng(element, sharedOptions);

  downloadDataUrl(dataUrl, `${fileName}.${format}`);

  return dataUrl;
}
