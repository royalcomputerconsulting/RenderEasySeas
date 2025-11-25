export const COLORS = {
  primaryDark: '#001F3F',
  primaryGradientStart: '#003D5C',
  primaryGradientEnd: '#005A7A',
  highlightAqua: '#D4A574',
  textPrimary: '#FFFAF0',
  textSecondary: '#B8D4E8',
  accentMagenta: '#D4A574',
  violetGlow: '#005A7A',
  royalBlueDeep: '#003D5C',
  electricAqua: '#D4A574',
  iceWhite: '#FFFAF0',
  mutedLavender: '#E8D5C4',
  neonMagenta: '#D4A574',
  
  navyDeep: '#0A1E2E',
  navyMedium: '#0F3A52',
  navyLight: '#1A5278',
  navyBorder: '#2D6B8F',
  oceanicBlue: '#0A1E2E',
  oceanicBlueMedium: '#0F3A52',
  oceanicBlueLight: '#1A5278',
  aquaAccent: '#4DD0E1',
  lightBlue: '#6EC6E8',
  skyBlue: '#87CEEB',
  seafoam: '#9FE2BF',
  
  beigeWarm: '#D4A574',
  beigeMuted: '#E8D5C4',
  beigeLight: '#F5E6D3',
  creamWhite: '#FFFAF0',
  
  goldAccent: '#FFD700',
  goldDark: '#C9A44B',
  coralAccent: '#FF8A80',
  tealAccent: '#26C6DA',
  
  success: '#4CAF50',
  warning: '#FFA726',
  error: '#EF5350',
  info: '#42A5F5',
  
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  
  cardBackground: 'rgba(15, 58, 82, 0.92)',
  cardBorder: 'rgba(77, 208, 225, 0.25)',
  overlayDark: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(255, 255, 255, 0.1)',
};

export const GRADIENTS = {
  primary: [COLORS.primaryGradientStart, COLORS.primaryGradientEnd],
  navy: [COLORS.navyDeep, COLORS.navyMedium, COLORS.navyLight],
  beige: [COLORS.beigeWarm, COLORS.beigeLight],
  card: ['rgba(15, 58, 82, 0.95)', 'rgba(26, 82, 120, 0.88)'],
  header: [COLORS.navyDeep, COLORS.navyMedium],
  tabBar: ['rgba(10, 30, 46, 0.98)', 'rgba(15, 58, 82, 0.95)'],
  button: [COLORS.aquaAccent, COLORS.lightBlue],
  success: ['#43A047', '#66BB6A'],
  danger: ['#E53935', '#EF5350'],
};

export const TYPOGRAPHY = {
  fontSizeXS: 10,
  fontSizeSM: 12,
  fontSizeMD: 14,
  fontSizeLG: 16,
  fontSizeXL: 18,
  fontSizeXXL: 20,
  fontSizeTitle: 24,
  fontSizeHeader: 28,
  fontSizeHero: 32,
  
  fontWeightLight: '300' as const,
  fontWeightRegular: '400' as const,
  fontWeightMedium: '500' as const,
  fontWeightSemiBold: '600' as const,
  fontWeightBold: '700' as const,
  
  lineHeightTight: 1.2,
  lineHeightNormal: 1.5,
  lineHeightRelaxed: 1.75,
  
  letterSpacingTight: -0.5,
  letterSpacingNormal: 0,
  letterSpacingWide: 0.5,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 9999,
};

export const SHADOW = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  glow: {
    shadowColor: COLORS.beigeWarm,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
};

export const ANIMATION = {
  fast: 150,
  normal: 250,
  slow: 400,
  verySlow: 600,
};
