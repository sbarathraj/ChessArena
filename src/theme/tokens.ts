export const KnightArenaTheme = {
  colors: {
    // Primary Brand
    brandPrimary: '#F59E0B',     // Amber Gold Accent
    brandSecondary: '#D97706',   // Deep Gold
    brandMuted: '#78350F',       // Warm Ember
    
    // Backgrounds & Surfaces
    backgroundDark: '#090D16',   // Obsidian Night
    surfaceDark: '#0F172A',      // Slate Dark 900
    surfaceCard: '#1E293B',      // Slate Dark 800
    surfaceBorder: '#334155',    // Slate Dark 700
    
    // High-Contrast Board Colors (Original Obsidian Theme)
    boardLight: '#CBD5E1',       // High-contrast cool silver/light
    boardDark: '#334155',        // High-contrast deep slate
    boardHighlightLast: 'rgba(245, 158, 11, 0.45)', // Amber glow
    boardHighlightLegal: 'rgba(16, 185, 129, 0.65)', // Emerald legal indicator
    boardHighlightCheck: 'rgba(239, 68, 68, 0.75)',  // Crimson check danger
    
    // Pieces Colors
    pieceWhite: '#FFFFFF',
    pieceBlack: '#0F172A',
    
    // Text Hierarchy
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    
    // Status Indicators
    statusSuccess: '#10B981',    // Emerald
    statusDanger: '#EF4444',     // Crimson
    statusWarning: '#F59E0B',    // Amber
    statusInfo: '#3B82F6',       // Royal Blue
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 6,
    md: 10,
    lg: 16,
    full: 9999,
  },
  typography: {
    display: {
      fontSize: 28,
      fontWeight: '700' as const,
      letterSpacing: -0.5,
    },
    title: {
      fontSize: 20,
      fontWeight: '600' as const,
      letterSpacing: -0.2,
    },
    body: {
      fontSize: 15,
      fontWeight: '400' as const,
      lineHeight: 22,
    },
    caption: {
      fontSize: 12,
      fontWeight: '500' as const,
      letterSpacing: 0.2,
    },
    mono: {
      fontFamily: 'Courier',
      fontSize: 14,
      fontWeight: '600' as const,
    },
  },
};
