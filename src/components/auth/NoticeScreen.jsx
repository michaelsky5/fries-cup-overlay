import React from 'react';
// 🚀 引入 i18n
import { useTranslation } from 'react-i18next';
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
  uiLanguage = 'en' // 🌟 保留传参以防破坏父组件调用
}) {
  // 🚀 初始化翻译钩子
  const { t } = useTranslation();
  // 🚀 将原来的 t 重命名为 tokens，避免冲突
  const tokens = densityTokens;

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
            <ShellPanel title={t('noticeScreen.toolTitle')} accent bodyStyle={{ padding: tokens.panelPaddingLg }} density={density}>
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
                    {t('noticeScreen.sysTitle')}
                  </div>

                  <div
                    style={{
                      marginTop: '8px',
                      color: COLORS.softWhite,
                      fontSize: density === 'spacious' ? '14px' : '13px',
                      lineHeight: 1.8
                    }}
                  >
                    {t('noticeScreen.intro')}
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isUltra ? '1fr' : '1fr 1fr',
                    gap: '10px'
                  }}
                >
                  <QuickStat label={t('noticeScreen.build')} value="PUBLIC BETA" valueColor={COLORS.yellow} density={density} />
                  <QuickStat label={t('noticeScreen.currentWindow')} value={`${w} × ${h}`} valueColor={COLORS.white} density={density} />
                </div>

                <div style={{ ...panelBase, padding: tokens.panelPadding, borderTop: `2px solid ${COLORS.yellow}` }}>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: '900',
                      color: COLORS.white,
                      letterSpacing: '2px',
                      textTransform: 'uppercase'
                    }}
                  >
                    {t('noticeScreen.recConsole')}
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

                <div style={{ ...panelBase, padding: tokens.panelPadding, borderTop: '2px solid #2ecc71' }}>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: '900',
                      color: COLORS.white,
                      letterSpacing: '2px',
                      textTransform: 'uppercase'
                    }}
                  >
                    {t('noticeScreen.recOutput')}
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
                    {t('noticeScreen.sysNotes')}
                  </div>

                  <div
                    style={{
                      color: COLORS.softWhite,
                      fontSize: density === 'spacious' ? '14px' : '13px',
                      lineHeight: 1.85
                    }}
                  >
                    {t('noticeScreen.note1')}
                    <br />
                    {t('noticeScreen.note2')}
                    <br />
                    {t('noticeScreen.note3')}
                    <br />
                    {t('noticeScreen.note4')}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button style={{ ...compactActionBtn, minWidth: '180px' }} onClick={onEnterSystem}>
                    {t('noticeScreen.enterBtn')}
                  </button>

                  <button style={{ ...compactOutlineBtn, minWidth: '180px' }} onClick={onSetDefault1080}>
                    {t('noticeScreen.set1080Btn')}
                  </button>
                </div>
              </div>
            </ShellPanel>
          </div>

          {/* 右侧当前预设面板 */}
          <div style={{ opacity: 0, animation: 'loginSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards' }}>
            <ShellPanel title={t('noticeScreen.currentPresets')} accent bodyStyle={{ padding: tokens.panelPaddingLg }} density={density} style={{ height: '100%' }}>
              <div style={{ display: 'grid', gap: '12px' }}>
                <QuickStat
                  label={t('noticeScreen.consolePreset')}
                  value={consolePresetMeta?.label}
                  valueColor={COLORS.yellow}
                  density={density}
                />

                <QuickStat
                  label={t('noticeScreen.outputPreset')}
                  value={outputResolution === '3840x2160' ? '4K' : '1080P'}
                  valueColor={COLORS.white}
                  density={density}
                />

                <QuickStat
                  label={t('noticeScreen.modeEntry')}
                  value={consoleMode === 'pro' ? t('noticeScreen.proMode') : t('noticeScreen.basicMode')}
                  valueColor={consoleMode === 'pro' ? COLORS.yellow : COLORS.white}
                  density={density}
                />

                <SectionHint text={t('noticeScreen.hint')} density={density} />
              </div>
            </ShellPanel>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NoticeScreen;