// Design system — matches the intro/welcome screen aesthetic.

export const COLORS = {
  /** Main purple background — matches intro page */
  BACKGROUND: '#4A4AE8',
  /** Slightly lighter purple for decorative circles */
  CIRCLE_LIGHT: '#6B6BFF',
  /** Even lighter purple circle */
  CIRCLE_LIGHTER: '#9B9BFF',
  /** Lime / yellow-green — primary accent, buttons, highlights */
  LIME: '#C8FF3E',
  /** Mint — secondary speech-bubble / tag accent */
  MINT: '#B2F0E8',
  /** Pink — decorative accent circle */
  PINK: '#FF9BCC',
  /** White card surface */
  CARD: '#FFFFFF',
  /** Very light purple-tinted input background */
  INPUT_BG: '#F2F2FF',
  /** Light purple-tinted input border */
  INPUT_BORDER: '#DCDCFF',
  /** Primary dark text (on light backgrounds) */
  DARK_TEXT: '#1A1A1A',
  /** Pure white text (on purple backgrounds) */
  WHITE_TEXT: '#FFFFFF',
  /** Muted text on purple background */
  MUTED_ON_DARK: 'rgba(255,255,255,0.60)',
  /** Muted text on white card */
  MUTED_ON_CARD: '#9999BB',
  /** Purple icon / label inside card */
  ICON_COLOR: '#7070CC',
  /** Strength bar empty */
  STRENGTH_EMPTY: '#E8E8FF',
} as const;
