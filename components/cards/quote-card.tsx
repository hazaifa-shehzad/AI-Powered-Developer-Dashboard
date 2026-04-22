import { Quote } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { QuoteData } from "@/types/dashboard";

interface QuoteCardProps {
  quote: QuoteData;
}

export function QuoteCard({ quote }: QuoteCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Motivational Quote</CardTitle>
            <CardDescription>Stay steady and keep shipping</CardDescription>
          </div>
          <div className="rounded-2xl bg-violet-100 p-3 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
            <Quote className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <blockquote className="text-lg leading-8 text-slate-700 dark:text-slate-200">“{quote.quote}”</blockquote>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">— {quote.author}</p>
      </CardContent>
    </Card>
  );
}
