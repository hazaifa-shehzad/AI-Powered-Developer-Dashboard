export interface MotivationalQuote {
  id?: string;
  text: string;
  author: string;
  source?: string | null;
  tags?: string[];
}

export interface QuoteApiResponse {
  quote: MotivationalQuote;
}
