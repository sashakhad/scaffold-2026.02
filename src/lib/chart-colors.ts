export const CHART_COLORS = {
  primary: '#f54e00',
  secondary: '#2d6a9f',
  tertiary: '#34a853',
  accent: '#9333ea',
  muted: '#6b7280',
  line1: '#f54e00',
  line2: '#2d6a9f',
  line3: '#34a853',
  line4: '#9333ea',
  line5: '#ec4899',
  bar1: '#f54e00',
  bar2: '#D1D5DB',
  bar3: '#9CA3AF',
} as const;

export const MODEL_COLORS: Record<string, string> = {
  'claude-3.5-sonnet': '#CC7832',
  'claude-3-opus': '#CC7832',
  'claude-sonnet': '#CC7832',
  'gpt-4': '#10a37f',
  'gpt-4o': '#10a37f',
  'gpt-4o-mini': '#74c69d',
  'gpt-3.5-turbo': '#52b788',
  'gemini-pro': '#4285f4',
  'gemini-1.5-pro': '#4285f4',
  cursor: '#f54e00',
  'cursor-small': '#ff8c5a',
  other: '#9CA3AF',
};

export function getModelColor(model: string): string {
  const lower = model.toLowerCase();
  for (const [key, color] of Object.entries(MODEL_COLORS)) {
    if (lower.includes(key.toLowerCase())) {
      return color;
    }
  }
  return MODEL_COLORS.other ?? '#9CA3AF';
}
