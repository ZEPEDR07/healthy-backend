export const theme = {
  bg: '#0A0A0A',
  card: '#1A1A1A',
  cardElevated: '#242424',
  nav: '#0A0A0A',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  textTertiary: '#636366',
  border: '#2A2A2A',
  borderFocus: '#0A84FF',
  // accents — primary is BLUE now
  primary: '#0A84FF',
  primarySoft: '#2A6FE0',
  // metric colors (kept multi-color as in screenshot)
  recovery: '#B6F242',     // lime/green-yellow
  strain: '#FFB930',       // amber
  sleep: '#7B8BFF',        // indigo-blue
  stressOrange: '#FF9F0A',
  stressRed: '#FF453A',
  ok: '#34C759',
  premium: '#FFD60A',      // gold for premium markers
  battery: '#B6F242',
  white: '#FFFFFF',
};

export const recoveryColor = (v: number) => {
  if (v >= 67) return theme.recovery;
  if (v >= 34) return theme.stressOrange;
  return theme.stressRed;
};

export const stressColor = (v: number) => {
  if (v <= 33) return theme.recovery;
  if (v <= 66) return theme.stressOrange;
  return theme.stressRed;
};

export const strainColor = (_v: number) => theme.strain;
