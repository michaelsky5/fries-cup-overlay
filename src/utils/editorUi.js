import { inputStyle, selectStyle, btnStyle, outlineBtn, actionBtn, getDensityTokens } from '../constants/styles';

export function createEditorUi(densityTokens, density = 'standard') {
  const t = densityTokens || getDensityTokens(density);

  const isUltra = density === 'ultra';
  const isCompact = density === 'compact' || density === 'ultra';
  const isSpacious = density === 'spacious';

  return {
    input: {
      ...inputStyle,
      padding: t.inputPadding,
      fontSize: `${t.inputFontSize}px`
    },

    select: {
      ...selectStyle,
      padding: t.inputPadding,
      fontSize: `${t.inputFontSize}px`
    },

    btn: {
      ...btnStyle,
      padding: t.buttonPadding,
      fontSize: `${t.buttonFontSize}px`
    },

    outlineBtn: {
      ...outlineBtn,
      padding: t.buttonPadding,
      fontSize: `${t.buttonFontSize}px`
    },

    actionBtn: {
      ...actionBtn,
      padding: t.buttonPadding,
      fontSize: `${t.buttonFontSize}px`
    },

    softOutlineBtn: {
      ...outlineBtn,
      padding: isSpacious ? '6px 10px' : isUltra ? '4px 7px' : '5px 8px',
      fontSize: `${t.buttonFontSize}px`
    },

    panelBody: {
      padding: t.panelPadding
    },

    stack: {
      display: 'grid',
      gap: isUltra ? '6px' : isCompact ? '8px' : '10px'
    },

    inline2: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: isUltra ? '6px' : '8px'
    },

    inline3: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, minmax(0,1fr))',
      gap: isUltra ? '6px' : '8px'
    },

    smallText: {
      fontSize: `${Math.max(10, t.inputFontSize - 1)}px`
    },

    labelText: {
      fontSize: `${t.labelSize || 11}px`
    }
  };
}