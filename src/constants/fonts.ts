// ─── Design System: Typography ───────────────────────────────────────────────
//
// Fredoka is already loaded by the root app/_layout.tsx.
// These constants provide the font-family strings for StyleSheet.create().
//
//   FontFamily.BOLD    → Fredoka_700Bold    (headings, buttons, labels)
//   FontFamily.REGULAR → Fredoka_400Regular (body text, placeholders)

export const FontFamily = {
  BOLD: 'Fredoka_700Bold',
  REGULAR: 'Fredoka_400Regular',
} as const;
