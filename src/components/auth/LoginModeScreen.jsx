import React from 'react';
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
  const LANG_OPTIONS = [
    { label: 'ENG', value: 'en' },
    { label: '中文', value: 'zh' }
  ];

  const t = densityTokens;

  const compactSelectStyle = {
    ...selectStyle,
    padding: t.inputPadding,
    fontSize: `${t.inputFontSize}px`,
    minHeight: density === 'spacious' ? '40px' : '36px',
    height: density === 'spacious' ? '40px' : '36px',
    boxSizing: 'border-box'
  };

  const btnFlex = { display: 'flex', alignItems: 'center', justifyContent: 'center' };

  const compactActionBtn = {
    ...actionBtn,
    padding: t.buttonPadding,
    fontSize: `${t.buttonFontSize}px`,
    minHeight: density === 'spacious' ? '40px' : '36px',
    height: density === 'spacious' ? '40px' : '36px',
    boxSizing: 'border-box',
    fontWeight: 900,
    ...btnFlex
  };

  const compactOutlineBtn = {
    ...outlineBtn,
    padding: t.buttonPadding,
    fontSize: `${t.buttonFontSize}px`,
    minHeight: density === 'spacious' ? '40px' : '36px',
    height: density === 'spacious' ? '40px' : '36px',
    boxSizing: 'border-box',
    fontWeight: 900,
    ...btnFlex
  };

  const TEXT = {
    en: {
      modeSelect: 'Mode Select',
      resolutionSetup: 'Resolution Setup',
      language: 'Language',
      loginGateway: 'Login Gateway',
      intro:
        'Basic Mode keeps only the core broadcast controls. Pro Mode unlocks the full editor stack, asset libraries, logs, and advanced operations. The Pro access code still supports your sci-fi easter egg entry.',
      enterBasic: 'Enter Basic Mode',
      proAccess: 'Pro Access',
      proPlaceholder: 'The answer to life, the universe, and everything',
      verifyPro: 'Verify and Enter Pro Mode',
      backNotice: 'Back to Notice',
      consoleResolution: 'Console Resolution',
      broadcastResolution: 'Broadcast Resolution',
      consolePreset: 'Console Preset',
      currentWindow: 'Current Window',
      presetNotes: 'Preset Notes',
      consoleNotePrefix: 'Console',
      outputNotePrefix: 'Output',
      output4k: 'Currently using 4K broadcast output.',
      output1080: 'Currently using 1080P broadcast output.',
      overlayNote: 'Overlay pages remain locked to a fixed 16:9 output and do not scale with console layout.',
      presetAuto: 'Auto · Testing',
      preset1080: '1080P · 1920 × 1080 (Default)'
    },
    zh: {
      modeSelect: '模式选择',
      resolutionSetup: '分辨率设置',
      language: '语言',
      loginGateway: '登录入口',
      intro:
        '基础模式只保留最核心的导播控制。专业模式将开放完整编辑器、总库、日志与高级操作。专业模式口令仍保留你现在的科幻梗入口。',
      enterBasic: '进入基础模式',
      proAccess: '专业模式口令',
      proPlaceholder: '输入 42 / fries',
      verifyPro: '验证并进入专业模式',
      backNotice: '返回公告页',
      consoleResolution: '控制台分辨率',
      broadcastResolution: '播出分辨率',
      consolePreset: '控制台预设',
      currentWindow: '当前窗口',
      presetNotes: '预设说明',
      consoleNotePrefix: '控制台',
      outputNotePrefix: '播出层',
      output4k: '当前为 4K 播出层。',
      output1080: '当前为 1080P 播出层。',
      overlayNote: 'Overlay 页面继续保持 16:9 固定输出，不跟随控制台布局缩放。',
      presetAuto: 'Auto · 自适应布局',
      preset1080: '1080P · 1920 × 1080 (默认)'
    }
  };

  const text = TEXT[uiLanguage] || TEXT.en;

  // 将 1080P 放在首位作为首选，将 Auto 加上
  const CONSOLE_PRESETS = [
    { label: text.preset1080, value: '1920x1080' },
    { label: '2K · 2560 × 1440', value: '2560x1440' },
    { label: '4K · 3840 × 2160', value: '3840x2160' },
    { label: text.presetAuto, value: 'auto' }
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isUltra ? '14px' : density === 'spacious' ? '32px' : '28px'
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
            <ShellPanel title={text.modeSelect} accent bodyStyle={{ padding: t.panelPaddingLg }} density={density} style={{ height: '100%' }}>
              <div style={{ display: 'grid', gap: '12px' }}>
                <Field label={text.language} density={density}>
                  <select
                    style={compactSelectStyle}
                    value={uiLanguage}
                    onChange={e => setUiLanguage && setUiLanguage(e.target.value)}
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
                  {text.loginGateway}
                </div>

                <div
                  style={{
                    color: COLORS.softWhite,
                    fontSize: density === 'spacious' ? '14px' : '13px',
                    lineHeight: 1.8
                  }}
                >
                  {text.intro}
                </div>

                <div style={{ display: 'grid', gap: '10px', marginTop: '4px' }}>
                  <button style={{ ...compactActionBtn, width: '100%' }} onClick={onEnterBasicMode}>
                    {text.enterBasic}
                  </button>

                  <div style={{ ...panelBase, padding: t.panelPadding, borderTop: `2px solid ${COLORS.yellow}` }}>
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
                      {text.proAccess}
                    </div>

                    <input
                      style={{ ...compactSelectStyle, cursor: 'text', marginBottom: '10px' }}
                      type="password"
                      value={proAccessCode}
                      onChange={e => setProAccessCode(e.target.value)}
                      placeholder={text.proPlaceholder}
                      onKeyDown={e => e.key === 'Enter' && onEnterProMode()}
                    />

                    <button
                      style={{ ...compactOutlineBtn, width: '100%', borderColor: COLORS.yellow, color: COLORS.yellow }}
                      onClick={onEnterProMode}
                    >
                      {text.verifyPro}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
                  <button style={compactOutlineBtn} onClick={onBackNotice}>
                    {text.backNotice}
                  </button>
                </div>
              </div>
            </ShellPanel>
          </div>

          {/* 右侧面板：分辨率设置 */}
          <div style={{ opacity: 0, animation: 'loginSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards' }}>
            <ShellPanel title={text.resolutionSetup} accent bodyStyle={{ padding: t.panelPaddingLg }} density={density} style={{ height: '100%' }}>
              <div style={{ display: 'grid', gap: '14px' }}>
                <Field label={text.consoleResolution} density={density}>
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

                <Field label={text.broadcastResolution} density={density}>
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
                    label={text.consolePreset}
                    value={consolePresetMeta?.label || 'Adaptive'}
                    valueColor={COLORS.yellow}
                    compact
                    density={density}
                  />
                  <QuickStat
                    label={text.currentWindow}
                    value={`${w} × ${h}`}
                    compact
                    density={density}
                  />
                </div>

                <div style={{ ...panelBase, padding: t.panelPadding }}>
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
                    {text.presetNotes}
                  </div>

                  <div
                    style={{
                      color: COLORS.softWhite,
                      fontSize: density === 'spacious' ? '14px' : '13px',
                      lineHeight: 1.8
                    }}
                  >
                    <strong style={{ color: COLORS.white }}>{text.consoleNotePrefix}：</strong>{consolePresetMeta?.desc || 'Auto scaling based on current window size.'}
                    <br />
                    <strong style={{ color: COLORS.white }}>{text.outputNotePrefix}：</strong>{outputResolution === '3840x2160' ? text.output4k : text.output1080}
                    <br />
                    {text.overlayNote}
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