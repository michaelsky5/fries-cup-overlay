import React from 'react';
import { COLORS, UI, panelBase, actionBtn, outlineBtn } from '../../constants/styles';
import { ShellPanel, QuickStat, SectionHint } from '../common/SharedUI';

function NoticeScreen({
  density = 'standard',
  densityTokens,
  isDense,
  isUltra,
  blockGap,
  w,
  h,
  consolePresetMeta,
  outputResolution,
  consoleMode,
  onEnterSystem,
  onSetDefault1080,
  uiLanguage = 'en' // 🌟 接收语言状态
}) {
  const t = densityTokens;

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

  // 🌟 国际化文本字典
  const TEXT = {
    en: {
      toolTitle: 'FCUP Broadcast Control Tool',
      sysTitle: 'Broadcast Control System',
      intro: 'A unified workstation for tournament directing, overlay routing, and scene control. The current build already supports LIVE, MAP, CASTERS, COUNTDOWN, STATS, and ROSTER, while keeping the console workspace separated from independent broadcast output pages.',
      build: 'Build',
      currentWindow: 'Current Window',
      recConsole: 'Recommended Console Resolution',
      recOutput: 'Recommended Broadcast Resolution',
      sysNotes: 'System Notes',
      note1: '1. The console uses fixed workspace presets instead of adaptive layout by default.',
      note2: '2. Overlay pages should be captured in OBS through a separate window or dedicated page.',
      note3: '3. Avoid using browser zoom to directly affect broadcast output ratio.',
      note4: '4. Confirm both Console and Output presets before entering the workspace.',
      enterBtn: 'Enter System',
      set1080Btn: 'Set Output to 1080P',
      currentPresets: 'Current Presets',
      consolePreset: 'Console Preset',
      outputPreset: 'Output Preset',
      modeEntry: 'Mode Entry',
      hint: 'The next step will take you to the login and mode selection page. You can enter Basic Mode directly or unlock Pro Mode with the access code.'
    },
    zh: {
      toolTitle: 'FCUP 导播控制工具',
      sysTitle: '赛事导播总控系统',
      intro: '用于赛事导播、推流路由和场景控制的统一工作站。当前构建版本已支持 LIVE、MAP、CASTERS、COUNTDOWN、STATS 和 ROSTER 模块，同时保持控制台工作区与独立的推流输出页面物理隔离。',
      build: '版本',
      currentWindow: '当前窗口',
      recConsole: '推荐控制台分辨率',
      recOutput: '推荐播出分辨率',
      sysNotes: '系统注意事项',
      note1: '1. 控制台默认使用固定的工作区预设，而非全自适应布局。',
      note2: '2. 推流层 (Overlay) 页面应在 OBS 中通过独立窗口或专用链接进行捕获。',
      note3: '3. 避免使用浏览器全局缩放功能，以免直接破坏播出画面的输出比例。',
      note4: '4. 在进入工作区前，请务必确认“控制台”和“输出”两项分辨率预设。',
      enterBtn: '进入系统',
      set1080Btn: '设为 1080P 播出',
      currentPresets: '当前配置预览',
      consolePreset: '控制台预设',
      outputPreset: '播出输出预设',
      modeEntry: '目标模式',
      hint: '下一步将进入登录与模式选择页面。您可以直接进入基础模式，或使用口令解锁专业模式。'
    }
  };

  const text = TEXT[uiLanguage] || TEXT.en;

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
      {/* 🌟 动画声明 */}
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
            gridTemplateColumns: isDense ? '1fr' : '1.15fr 0.85fr',
            gap: blockGap
          }}
        >
          {/* 左侧大面板 */}
          <div style={{ opacity: 0, animation: 'loginSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards' }}>
            <ShellPanel title={text.toolTitle} accent bodyStyle={{ padding: t.panelPaddingLg }} density={density}>
              <div style={{ display: 'grid', gap: blockGap }}>
                <div>
                  <div
                    style={{
                      fontSize: density === 'spacious' ? '34px' : isUltra ? '24px' : '30px',
                      fontWeight: '900',
                      color: COLORS.white,
                      letterSpacing: density === 'spacious' ? '2.4px' : '2px',
                      textTransform: 'uppercase'
                    }}
                  >
                    {text.sysTitle}
                  </div>

                  <div
                    style={{
                      marginTop: '8px',
                      color: COLORS.softWhite,
                      fontSize: density === 'spacious' ? '14px' : '13px',
                      lineHeight: 1.8
                    }}
                  >
                    {text.intro}
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isUltra ? '1fr' : '1fr 1fr',
                    gap: '10px'
                  }}
                >
                  <QuickStat label={text.build} value="BETA / INTERNAL" valueColor={COLORS.yellow} density={density} />
                  <QuickStat label={text.currentWindow} value={`${w} × ${h}`} valueColor={COLORS.white} density={density} />
                </div>

                <div style={{ ...panelBase, padding: t.panelPadding, borderTop: `2px solid ${COLORS.yellow}` }}>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: '900',
                      color: COLORS.white,
                      letterSpacing: '2px',
                      textTransform: 'uppercase'
                    }}
                  >
                    {text.recConsole}
                  </div>
                  <div
                    style={{
                      marginTop: '8px',
                      color: COLORS.softWhite,
                      fontSize: density === 'spacious' ? '14px' : '13px',
                      lineHeight: 1.8
                    }}
                  >
                    1080P (1920 × 1080) / 2K (2560 × 1440) / 4K (3840 × 2160)
                  </div>
                </div>

                <div style={{ ...panelBase, padding: t.panelPadding, borderTop: '2px solid #2ecc71' }}>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: '900',
                      color: COLORS.white,
                      letterSpacing: '2px',
                      textTransform: 'uppercase'
                    }}
                  >
                    {text.recOutput}
                  </div>
                  <div
                    style={{
                      marginTop: '8px',
                      color: COLORS.softWhite,
                      fontSize: density === 'spacious' ? '14px' : '13px',
                      lineHeight: 1.8
                    }}
                  >
                    1080P (1920 × 1080) / 4K (3840 × 2160)
                  </div>
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
                    {text.sysNotes}
                  </div>

                  <div
                    style={{
                      color: COLORS.softWhite,
                      fontSize: density === 'spacious' ? '14px' : '13px',
                      lineHeight: 1.85
                    }}
                  >
                    {text.note1}
                    <br />
                    {text.note2}
                    <br />
                    {text.note3}
                    <br />
                    {text.note4}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button style={{ ...compactActionBtn, minWidth: '180px' }} onClick={onEnterSystem}>
                    {text.enterBtn}
                  </button>

                  <button style={{ ...compactOutlineBtn, minWidth: '180px' }} onClick={onSetDefault1080}>
                    {text.set1080Btn}
                  </button>
                </div>
              </div>
            </ShellPanel>
          </div>

          {/* 右侧预设面板 */}
          <div style={{ opacity: 0, animation: 'loginSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards' }}>
            <ShellPanel title={text.currentPresets} accent bodyStyle={{ padding: t.panelPaddingLg }} density={density} style={{ height: '100%' }}>
              <div style={{ display: 'grid', gap: '12px' }}>
                <QuickStat
                  label={text.consolePreset}
                  value={consolePresetMeta.label}
                  valueColor={COLORS.yellow}
                  density={density}
                />

                <QuickStat
                  label={text.outputPreset}
                  value={outputResolution === '3840x2160' ? '4K' : '1080P'}
                  valueColor={COLORS.white}
                  density={density}
                />

                <QuickStat
                  label={text.modeEntry}
                  value={consoleMode === 'pro' ? 'PRO MODE' : 'BASIC MODE'}
                  valueColor={consoleMode === 'pro' ? COLORS.yellow : COLORS.white}
                  density={density}
                />

                <SectionHint text={text.hint} density={density} />
              </div>
            </ShellPanel>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NoticeScreen;