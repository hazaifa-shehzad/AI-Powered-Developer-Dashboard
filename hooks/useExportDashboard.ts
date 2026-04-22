"use client";

import { RefObject, useCallback, useState } from "react";

export type ExportFormat = "png" | "pdf" | "print";

interface ExportOptions {
  fileName?: string;
  scale?: number;
  backgroundColor?: string;
  pdfOrientation?: "portrait" | "landscape";
}

interface UseExportDashboardResult {
  isExporting: boolean;
  error: string | null;
  exportAsPng: (options?: ExportOptions) => Promise<void>;
  exportAsPdf: (options?: ExportOptions) => Promise<void>;
  printDashboard: () => Promise<void>;
  exportDashboard: (format: ExportFormat, options?: ExportOptions) => Promise<void>;
}

function downloadFile(dataUrl: string, fileName: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  link.click();
}

function openPrintWindow(imageDataUrl: string) {
  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=1200,height=900");
  if (!printWindow) {
    throw new Error("Popup blocked. Please allow popups to print the dashboard.");
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>Print Dashboard</title>
        <style>
          html, body {
            margin: 0;
            padding: 0;
            background: #ffffff;
          }
          img {
            width: 100%;
            height: auto;
            display: block;
          }
          @media print {
            @page { margin: 12mm; }
          }
        </style>
      </head>
      <body>
        <img src="${imageDataUrl}" alt="Dashboard export" />
        <script>
          window.onload = function () {
            window.focus();
            window.print();
            window.onafterprint = function () {
              window.close();
            };
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

export function useExportDashboard<T extends HTMLElement>(
  targetRef: RefObject<T | null>,
): UseExportDashboardResult {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCanvas = useCallback(async (options?: ExportOptions) => {
    const element = targetRef.current;

    if (!element) {
      throw new Error("Dashboard container not found.");
    }

    const html2canvas = (await import("html2canvas")).default;

    return html2canvas(element, {
      backgroundColor: options?.backgroundColor ?? "#0b1020",
      scale: options?.scale ?? 2,
      useCORS: true,
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });
  }, [targetRef]);

  const exportAsPng = useCallback(
    async (options?: ExportOptions) => {
      setIsExporting(true);
      setError(null);

      try {
        const canvas = await createCanvas(options);
        const dataUrl = canvas.toDataURL("image/png");
        const fileName = `${options?.fileName ?? "developer-dashboard"}.png`;
        downloadFile(dataUrl, fileName);
      } catch (exportError) {
        const message =
          exportError instanceof Error
            ? exportError.message
            : "Unable to export dashboard as PNG.";
        setError(message);
      } finally {
        setIsExporting(false);
      }
    },
    [createCanvas],
  );

  const exportAsPdf = useCallback(
    async (options?: ExportOptions) => {
      setIsExporting(true);
      setError(null);

      try {
        const canvas = await createCanvas(options);
        const imageData = canvas.toDataURL("image/png");
        const { default: JsPDF } = await import("jspdf");

        const orientation = options?.pdfOrientation ?? "landscape";
        const pdf = new JsPDF({
          orientation,
          unit: "px",
          format: [canvas.width, canvas.height],
        });

        pdf.addImage(imageData, "PNG", 0, 0, canvas.width, canvas.height);
        pdf.save(`${options?.fileName ?? "developer-dashboard"}.pdf`);
      } catch (exportError) {
        const message =
          exportError instanceof Error
            ? exportError.message
            : "Unable to export dashboard as PDF.";
        setError(message);
      } finally {
        setIsExporting(false);
      }
    },
    [createCanvas],
  );

  const printDashboard = useCallback(async () => {
    setIsExporting(true);
    setError(null);

    try {
      const canvas = await createCanvas({ backgroundColor: "#ffffff", scale: 2 });
      openPrintWindow(canvas.toDataURL("image/png"));
    } catch (exportError) {
      const message =
        exportError instanceof Error
          ? exportError.message
          : "Unable to print dashboard.";
      setError(message);
    } finally {
      setIsExporting(false);
    }
  }, [createCanvas]);

  const exportDashboard = useCallback(
    async (format: ExportFormat, options?: ExportOptions) => {
      if (format === "png") return exportAsPng(options);
      if (format === "pdf") return exportAsPdf(options);
      return printDashboard();
    },
    [exportAsPdf, exportAsPng, printDashboard],
  );

  return {
    isExporting,
    error,
    exportAsPng,
    exportAsPdf,
    printDashboard,
    exportDashboard,
  };
}

export default useExportDashboard;
