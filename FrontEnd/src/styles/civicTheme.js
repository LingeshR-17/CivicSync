// 🏛️ CivicSync Official Government & Public Portal Design System Tokens
export const civicTheme = {
  colors: {
    // Backgrounds & Surface (Prestigious Civic Navy)
    bgMidnight: '#060d19',
    bgNavy: '#0a192f',
    bgNavyDeep: '#0d213f',
    bgCard: '#112240',
    bgCardSubtle: 'rgba(17, 34, 64, 0.75)',
    bgCardGlass: 'rgba(15, 31, 56, 0.85)',
    bgInput: 'rgba(10, 25, 47, 0.8)',
    
    // Borders & Dividers
    borderSubtle: 'rgba(255, 255, 255, 0.08)',
    borderMedium: 'rgba(255, 255, 255, 0.16)',
    borderCivic: 'rgba(56, 189, 248, 0.3)',
    borderGold: 'rgba(217, 119, 6, 0.4)',
    
    // Text Hierarchy
    textHeading: '#f8fafc',
    textBody: '#cbd5e1',
    textMuted: '#94a3b8',
    textDim: '#64748b',
    
    // Official Civic & National Accents
    civicBlue: '#0284c7',        // Official municipal azure
    civicBlueLight: '#38bdf8',   // Highlight / focus
    civicBlueDark: '#0369a1',
    civicSaffron: '#d97706',     // National civic saffron / alert
    civicSaffronLight: '#f59e0b',
    civicGreen: '#059669',       // Verification & Redressed green
    civicGreenLight: '#10b981',
    civicRed: '#ef4444',         // Emergency / Dispute alert
    
    // Status Mapping
    statusPending: '#ef4444',
    statusAssigned: '#38bdf8',
    statusInProgress: '#f59e0b',
    statusResolved: '#10b981',
    statusClosed: '#059669',
    statusReopened: '#f97316',
    
    // Gradient Collections
    gradients: {
      officialNavy: ['#0a192f', '#060d19'],
      headerBar: ['#0f243e', '#0a192f'],
      cardHighlight: ['rgba(17, 34, 64, 0.95)', 'rgba(10, 25, 47, 0.95)'],
      civicButton: ['#0284c7', '#0369a1'],
      emeraldButton: ['#10b981', '#059669'],
      saffronStrip: ['#d97706', '#f59e0b', '#10b981'],
      badgePending: ['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0.05)'],
      badgeResolved: ['rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0.05)'],
      badgeAssigned: ['rgba(56, 189, 248, 0.2)', 'rgba(56, 189, 248, 0.05)'],
    }
  },
  
  typography: {
    fontFamilyHeading: 'System',
    fontFamilyBody: 'System',
    fontSizeH1: 22,
    fontSizeH2: 18,
    fontSizeH3: 15,
    fontSizeBody: 13,
    fontSizeCaption: 11,
    fontSizeMicro: 10,
    letterSpacingWide: 0.8,
    letterSpacingTitle: 0.3,
  },
  
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },
  
  shadows: {
    subtle: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 3,
    },
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 6,
    },
    floating: {
      shadowColor: '#0284c7',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 10,
    }
  }
};
