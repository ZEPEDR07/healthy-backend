export const theme = {
  bg: '#0A0A0A',
  card: '#1A1A1A',
  cardElevated: '#242424',
  nav: '#0A0A0A',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  textTertiary: '#636366',
  border: '#333333',
  borderFocus: '#5E5CE6',
  recovery: '#32D74B',
  strain: '#0A84FF',
  sleep: '#5E5CE6',
  stressOrange: '#FF9F0A',
  stressRed: '#FF453A',
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

export const strainColor = (v: number) => {
  if (v < 10) return '#34C7AE';
  if (v < 14) return theme.strain;
  if (v < 18) return '#7B61FF';
  return theme.stressRed;
};
