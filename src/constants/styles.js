export const COLORS = {
  mainDark: '#2a2a2a',
  yellow: '#f4c320',
  white: '#ffffff',
  black: '#000000',
  banRed: '#ff4d4d',
  gray: '#aaaaaa',
  banGold: '#f4c320',
  panel: '#141414',
  panel2: '#1a1a1a',
  line: 'rgba(255,255,255,0.08)',
  lineStrong: 'rgba(255,255,255,0.18)',
  softWhite: 'rgba(255,255,255,0.62)',
  faintWhite: 'rgba(255,255,255,0.26)',
  green: '#27ae60',
  blue: '#3498db',
  red: '#ff4d4d'
};

export const UI = {
  outerFrame: `1px solid ${COLORS.lineStrong}`,
  innerFrame: `1px solid ${COLORS.line}`,
  panelShadow: '0 18px 40px rgba(0,0,0,0.28)',
  yellowGlow: '0 0 0 1px rgba(244,195,32,0.16), 0 0 18px rgba(244,195,32,0.08)',
  insetLine: 'inset 0 0 0 1px rgba(255,255,255,0.04)',
  bevelInset: 'inset 0 1px 0 rgba(255,255,255,0.04), inset 0 -1px 0 rgba(0,0,0,0.35)'
};

export const BASE_SCENE_W = 1920;
export const BASE_SCENE_H = 1080;

export const panelBase = {
  background: `linear-gradient(180deg, ${COLORS.panel2} 0%, ${COLORS.panel} 100%)`,
  border: UI.outerFrame,
  boxShadow: `${UI.panelShadow}, ${UI.insetLine}`,
  position: 'relative',
  overflow: 'hidden'
};

export const labelStyle = {
  fontSize: '11px',
  color: COLORS.softWhite,
  marginBottom: '6px',
  fontWeight: '900',
  letterSpacing: '1.2px',
  textTransform: 'uppercase'
};

export const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  backgroundColor: COLORS.mainDark,
  border: UI.innerFrame,
  color: COLORS.white,
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: '"HarmonyOS Sans SC", sans-serif'
};

export const selectStyle = {
  ...inputStyle,
  cursor: 'pointer'
};

export const btnStyle = {
  padding: '10px 14px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: '900',
  color: COLORS.white,
  fontFamily: '"HarmonyOS Sans SC", sans-serif',
  letterSpacing: '0.5px',
  textTransform: 'uppercase'
};

export const actionBtn = {
  ...btnStyle,
  backgroundColor: COLORS.yellow,
  color: COLORS.black,
  boxShadow: UI.yellowGlow
};

export const outlineBtn = {
  ...btnStyle,
  backgroundColor: 'transparent',
  border: UI.outerFrame,
  color: COLORS.softWhite
};

export const DENSITY_TOKENS = {
  ultra: {
    pagePadding: 10,
    blockGap: 10,
    panelPadding: '10px 12px',
    panelPaddingLg: '12px 14px',
    panelHeaderGap: 8,
    titleSize: 12,
    titleLetterSpacing: '1.6px',
    labelSize: 10,
    inputPadding: '8px 10px',
    inputFontSize: 12,
    buttonPadding: '8px 10px',
    buttonFontSize: 12,
    statValue: 18,
    statValueCompact: 16,
    tabPadding: '10px 12px',
    tabFontSize: 12,
    sideColWidth: 180,
    rightColWidth: 240
  },
  compact: {
    pagePadding: 14,
    blockGap: 12,
    panelPadding: '12px 14px',
    panelPaddingLg: '14px 16px',
    panelHeaderGap: 10,
    titleSize: 13,
    titleLetterSpacing: '1.8px',
    labelSize: 11,
    inputPadding: '9px 11px',
    inputFontSize: 12,
    buttonPadding: '9px 12px',
    buttonFontSize: 12,
    statValue: 19,
    statValueCompact: 17,
    tabPadding: '10px 14px',
    tabFontSize: 12,
    sideColWidth: 210,
    rightColWidth: 250
  },
  standard: {
    pagePadding: 18,
    blockGap: 14,
    panelPadding: '14px 16px',
    panelPaddingLg: '16px 18px',
    panelHeaderGap: 10,
    titleSize: 13,
    titleLetterSpacing: '2px',
    labelSize: 11,
    inputPadding: '10px 12px',
    inputFontSize: 13,
    buttonPadding: '10px 14px',
    buttonFontSize: 13,
    statValue: 20,
    statValueCompact: 18,
    tabPadding: '12px 18px',
    tabFontSize: 13,
    sideColWidth: 235,
    rightColWidth: 280
  },
  spacious: {
    pagePadding: 24,
    blockGap: 18,
    panelPadding: '16px 18px',
    panelPaddingLg: '18px 20px',
    panelHeaderGap: 12,
    titleSize: 14,
    titleLetterSpacing: '2.2px',
    labelSize: 12,
    inputPadding: '12px 14px',
    inputFontSize: 14,
    buttonPadding: '11px 16px',
    buttonFontSize: 13,
    statValue: 22,
    statValueCompact: 19,
    tabPadding: '13px 20px',
    tabFontSize: 13,
    sideColWidth: 250,
    rightColWidth: 300
  }
};

export const getDensityTokens = density => DENSITY_TOKENS[density] || DENSITY_TOKENS.standard;