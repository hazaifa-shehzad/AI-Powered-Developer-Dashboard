"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ExportDashboardButtonProps {
  targetId?: string;
  fileName?: string;
}

export function ExportDashboardButton({
  targetId = "dashboard-root",
  fileName = "developer-dashboard",
}: ExportDashboardButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);

    try {
      const element = document.getElementById(targetId);
      if (!element) {
        window.print();
        return;
      }

      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(element, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });

      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName}.png`;
      link.click();
    } catch {
      window.print();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleExport} disabled={loading}>
      <Download className="h-4 w-4" />
      {loading ? "Exporting..." : "Export Dashboard"}
    </Button>
  );
}
