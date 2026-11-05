// Tokens visuais do Hamm (D3): base neutra quente, UM destaque rosa-coral discreto.
// Coral só em: ação principal, estado ativo (aba, seleção, foco, progresso) e um dado-chave por tela.
// Entrada × saída nunca só por cor: sempre com sinal (+ / −). Saída usa a cor do texto, não vermelho,
// para não brigar com o coral nem com os erros.

export type Palette = {
  background: string;
  surface: string;
  surfaceMuted: string;
  surfacePressed: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  accent: string;
  accentPressed: string;
  accentSoft: string;
  accentLine: string;
  onAccent: string;
  positive: string;
  danger: string;
  dangerSoft: string;
  /** Cobertura de privacidade (apps recentes). */
  cover: string;
};

export const lightPalette: Palette = {
  background: '#FAF7F2',
  surface: '#FFFFFF',
  surfaceMuted: '#F3EEE7',
  surfacePressed: '#EAE3DA',
  border: '#E6DED4',
  borderStrong: '#CBBFB1',
  text: '#1F1A17',
  textMuted: '#5C544D',
  textSubtle: '#6F665E',
  accent: '#B2473F',
  accentPressed: '#9A3B34',
  accentSoft: 'rgba(178, 71, 63, 0.10)',
  accentLine: 'rgba(178, 71, 63, 0.50)',
  onAccent: '#FFFFFF',
  positive: '#2B7148',
  danger: '#A1281F',
  dangerSoft: 'rgba(161, 40, 31, 0.08)',
  cover: '#FAF7F2',
};

export const darkPalette: Palette = {
  background: '#161311',
  surface: '#201C19',
  surfaceMuted: '#28231F',
  surfacePressed: '#322B26',
  border: '#37302A',
  borderStrong: '#4C433B',
  text: '#F3EEE8',
  textMuted: '#BEB4A9',
  textSubtle: '#A0968C',
  accent: '#EE8B7D',
  accentPressed: '#F3A194',
  accentSoft: 'rgba(238, 139, 125, 0.14)',
  accentLine: 'rgba(238, 139, 125, 0.55)',
  onAccent: '#2B110D',
  positive: '#7DC99C',
  danger: '#FF8A80',
  dangerSoft: 'rgba(255, 138, 128, 0.10)',
  cover: '#161311',
};

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  full: 999,
} as const;

/** Alvo mínimo de toque (pt). */
export const touchTarget = 48;

/** Largura máxima de leitura (tablets e telas largas). */
export const maxContentWidth = 640;

export const type = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: '700' },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700' },
  heading: { fontSize: 17, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  overline: { fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' },
  /** Valores em destaque: algarismos de largura fixa para colunas alinharem. */
  amount: { fontSize: 28, lineHeight: 34, fontWeight: '700', fontVariant: ['tabular-nums'] },
} as const;
