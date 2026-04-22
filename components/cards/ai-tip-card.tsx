import { BrainCircuit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AITipData } from "@/types/dashboard";

interface AITipCardProps {
  tip: AITipData;
}

export function AITipCard({ tip }: AITipCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>{tip.title}</CardTitle>
            <CardDescription>Practical AI workflow suggestion</CardDescription>
          </div>
          <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
            <BrainCircuit className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {tip.tag ? <Badge variant="success">{tip.tag}</Badge> : null}
        <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{tip.body}</p>
      </CardContent>
    </Card>
  );
}
