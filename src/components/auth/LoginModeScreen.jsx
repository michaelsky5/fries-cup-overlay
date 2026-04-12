import React from 'react';
// 🚀 引入 i18n
import { useTranslation } from 'react-i18next';
import { COLORS, selectStyle, actionBtn, outlineBtn, panelBase } from '../../constants/styles';
import { ShellPanel, Field, QuickStat } from '../common/SharedUI';

export default function LoginModeScreen({
  density = 'standard',
  densityTokens,
  isDense,
  isUltra,
  blockGap,
  consoleResolution,
  setConsoleResolution,
  outputResolution,
  onChangeOutputResolution,
  consolePresetMeta,
  w,
  h,
  proAccessCode,
  setProAccessCode,
  onEnterBasicMode,
  onEnterProMode,
  onBackNotice,
  uiLanguage = 'en',
  setUiLanguage
}) {
  // 🚀 初始化 t 函数和 i18n 实例
  const { t, i18n } = useTranslation();

  const LANG_OPTIONS = [
    { label: 'ENG', value: 'en' },
    { label: '中文', value: 'zh' }
  ];

  const tokens = densityTokens;

  const compactSelectStyle = {
    ...selectStyle,
    padding: tokens.inputPadding,
    fontSize: `${tokens.inputFontSize}px`,
    minHeight: density === 'spacious' ? '40px' : '36px',
    height: density === 'spacious' ? '40px' : '36px',
    boxSizing: 'border-box'
  };

  const btnFlex = { display: 'flex', alignItems: 'center', justifyContent: 'center' };

  const compactActionBtn = {
    ...actionBtn,
    padding: tokens.buttonPadding,
    fontSize: `${tokens.buttonFontSize}px`,
    minHeight: density === 'spacious' ? '40px' : '36px',
    height: density === 'spacious' ? '40px' : '36px',
    boxSizing: 'border-box',
    fontWeight: 900,
    ...btnFlex
  };

  const compactOutlineBtn = {
    ...outlineBtn,
    padding: tokens.buttonPadding,
    fontSize: `${tokens.buttonFontSize}px`,
    minHeight: density === 'spacious' ? '40px' : '36px',
    height: density === 'spacious' ? '40px' : '36px',
    boxSizing: 'border-box',
    fontWeight: 900,
    ...btnFlex
  };

  // 🚀 切换语言的同时通知全局的 i18n 系统
  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    i18n.changeLanguage(newLang); // 切换词典
    if (setUiLanguage) setUiLanguage(newLang); // 兼容旧逻辑
  };

  const CONSOLE_PRESETS = [
    { label: t('loginMode.preset1080'), value: '1920x1080' },
    { label: '2K · 2560 × 1440', value: '2560x1440' },
    { label: '4K · 3840 × 2160', value: '3840x2160' },
    { label: t('loginMode.presetAuto'), value: 'auto' }
  ];

  const OUTPUT_PRESETS = [
    { label: '1080P · 1920 × 1080', value: '1920x1080' },
    { label: '4K · 3840 × 2160', value: '3840x2160' }
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: COLORS.mainDark,
        color: COLORS.white,
        fontFamily: '"HarmonyOS Sans SC", sans-serif',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <style>{`
        @keyframes loginSlideUp {
          0% { opacity: 0; transform: translateY(40px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.014) 1px, transparent 1px)',
          backgroundSize: '120px 120px, 120px 120px',
          opacity: 0.14
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isUltra ? '14px' : density === 'spacious' ? '32px' : '28px',
          boxSizing: 'border-box'
        }}
      >
        <div
          style={{
            width: density === 'spacious' ? 'min(1360px, 100%)' : 'min(1240px, 100%)',
            display: 'grid',
            gridTemplateColumns: isDense ? '1fr' : '0.95fr 1.05fr',
            gap: blockGap
          }}
        >
          {/* 左侧面板：模式选择 */}
          <div style={{ opacity: 0, animation: 'loginSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards' }}>
            <ShellPanel title={t('loginMode.modeSelect')} accent bodyStyle={{ padding: tokens.panelPaddingLg }} density={density} style={{ height: '100%' }}>
              <div style={{ display: 'grid', gap: '12px' }}>
                <Field label={t('loginMode.language')} density={density}>
                  <select
                    style={compactSelectStyle}
                    value={i18n.language || uiLanguage}
                    onChange={handleLanguageChange}
                  >
                    {LANG_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <div
                  style={{
                    fontSize: density === 'spacious' ? '28px' : '24px',
                    fontWeight: '900',
                    color: COLORS.white,
                    letterSpacing: density === 'spacious' ? '2.4px' : '2px',
                    textTransform: 'uppercase',
                    marginTop: '8px'
                  }}
                >
                  {t('loginMode.loginGateway')}
                </div>

                <div
                  style={{
                    color: COLORS.softWhite,
                    fontSize: density === 'spacious' ? '14px' : '13px',
                    lineHeight: 1.8
                  }}
                >
                  {t('loginMode.intro')}
                </div>

                <div style={{ display: 'grid', gap: '10px', marginTop: '4px' }}>
                  <button style={{ ...compactActionBtn, width: '100%' }} onClick={onEnterBasicMode}>
                    {t('loginMode.enterBasic')}
                  </button>

                  <div style={{ ...panelBase, padding: tokens.panelPadding, borderTop: `2px solid ${COLORS.yellow}` }}>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: '900',
                        color: COLORS.white,
                        letterSpacing: '2px',
                        textTransform: 'uppercase',
                        marginBottom: '8px'
                      }}
                    >
                      {t('loginMode.proAccess')}
                    </div>

                    <input
                      style={{ ...compactSelectStyle, cursor: 'text', marginBottom: '10px' }}
                      type="password"
                      value={proAccessCode}
                      onChange={e => setProAccessCode(e.target.value)}
                      placeholder={t('loginMode.proPlaceholder')}
                      onKeyDown={e => e.key === 'Enter' && onEnterProMode()}
                    />

                    <button
                      style={{ ...compactOutlineBtn, width: '100%', borderColor: COLORS.yellow, color: COLORS.yellow }}
                      onClick={onEnterProMode}
                    >
                      {t('loginMode.verifyPro')}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
                  <button style={compactOutlineBtn} onClick={onBackNotice}>
                    {t('loginMode.backNotice')}
                  </button>
                </div>
              </div>
            </ShellPanel>
          </div>

          {/* 右侧面板：分辨率设置 */}
          <div style={{ opacity: 0, animation: 'loginSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards' }}>
            <ShellPanel title={t('loginMode.resolutionSetup')} accent bodyStyle={{ padding: tokens.panelPaddingLg }} density={density} style={{ height: '100%' }}>
              <div style={{ display: 'grid', gap: '14px' }}>
                <Field label={t('loginMode.consoleResolution')} density={density}>
                  <select
                    style={compactSelectStyle}
                    value={consoleResolution}
                    onChange={e => setConsoleResolution(e.target.value)}
                  >
                    {CONSOLE_PRESETS.map(preset => (
                      <option key={preset.value} value={preset.value}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label={t('loginMode.broadcastResolution')} density={density}>
                  <select
                    style={compactSelectStyle}
                    value={outputResolution}
                    onChange={e => onChangeOutputResolution(e.target.value)}
                  >
                    {OUTPUT_PRESETS.map(preset => (
                      <option key={preset.value} value={preset.value}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isUltra ? '1fr' : '1fr 1fr',
                    gap: '10px'
                  }}
                >
                  <QuickStat
                    label={t('loginMode.consolePreset')}
                    value={consolePresetMeta?.label || t('loginMode.adaptive')}
                    valueColor={COLORS.yellow}
                    compact
                    density={density}
                  />
                  <QuickStat
                    label={t('loginMode.currentWindow')}
                    value={`${w} × ${h}`}
                    compact
                    density={density}
                  />
                </div>

                <div style={{ ...panelBase, padding: tokens.panelPadding }}>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: '900',
                      color: COLORS.white,
                      letterSpacing: '2px',
                      textTransform: 'uppercase',
                      marginBottom: '8px'
                    }}
                  >
                    {t('loginMode.presetNotes')}
                  </div>

                  <div
                    style={{
                      color: COLORS.softWhite,
                      fontSize: density === 'spacious' ? '14px' : '13px',
                      lineHeight: 1.8
                    }}
                  >
                    <strong style={{ color: COLORS.white }}>{t('loginMode.consoleNotePrefix')}：</strong>{consolePresetMeta?.desc || t('consoleMeta.auto_1080p_desc')}
                    <br />
                    <strong style={{ color: COLORS.white }}>{t('loginMode.outputNotePrefix')}：</strong>{outputResolution === '3840x2160' ? t('loginMode.output4k') : t('loginMode.output1080')}
                    <br />
                    {t('loginMode.overlayNote')}
                  </div>
                </div>
              </div>
            </ShellPanel>
          </div>
        </div>
      </div>
    </div>
  );
}