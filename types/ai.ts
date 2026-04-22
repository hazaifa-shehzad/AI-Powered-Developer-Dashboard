export type AiTipCategory =
  | "productivity"
  | "code-quality"
  | "career"
  | "debugging"
  | "architecture"
  | "testing"
  | "security"
  | "tooling";

export interface AiTip {
  id?: string;
  title: string;
  description: string;
  category: AiTipCategory;
  actionLabel?: string | null;
  actionUrl?: string | null;
}

export interface AiTipApiResponse {
  tip: AiTip;
}
