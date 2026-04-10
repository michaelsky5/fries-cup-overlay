import React, { useRef, useState, useMemo } from 'react';
import html2canvas from 'html2canvas';

import {
  COLORS,
  UI,
  panelBase
} from '../../constants/styles';
import { createEditorUi } from '../../utils/editorUi';
import {
  ShellPanel,
  Field,
  TabButton,
  QuickStat,
  MonitorFrame,
  AutoFitScene
} from '../common/SharedUI';

import LiveEditor from '../controls/LiveEditor';
import TeamDBEditor from '../controls/TeamDBEditor';
import MapPoolEditor from '../controls/MapPoolEditor';
import CasterEditor from '../controls/CasterEditor';
import RosterEditor from '../controls/RosterEditor';
import StatsEditor from '../controls/StatsEditor';
import CountdownEditor from '../controls/CountdownEditor';
import VideoEditor from '../controls/VideoEditor';
import HighlightEditor from '../controls/HighlightEditor';
import CoverEditor from '../controls/CoverEditor';

import RightSidebar from './RightSidebar';
import StingerTransition from '../scenes/StingerTransition';
import BroadcastCoverScene from '../scenes/BroadcastCoverScene'; 

function ConsoleWorkspace({
  density,
  densityTokens,
  isOverlay,
  isDense,
  isUltra,
  isShort,
  pagePadding,
  blockGap,
  sideColWidth,
  rightColWidth,
  showRightColumn,
  showEmbeddedRightPanels,
  topGridTemplate,
  mainGridTemplate,
  monitorGridTemplate,
  workspaceFrameStyle,

  matchData,
  updateData,
  history,
  handleUndo,
  previewScene,
  setPreviewScene,
  renderScene,
  isTransitioning,
  takeScene,

  activeTab,
  setActiveTab,
  availableTabs,
  isUnlocked,
  isLogOpen,
  setIsLogOpen,
  handleUnlock,
  exportConfig,
  importConfig,
  handleSwapTeams,
  handleReset,

  consolePresetMeta,
  outputResolution,
  onChangeOutputResolution,

  renderPreviewMonitorScene,
  renderProgramMonitorScene,
  sceneLabelMap
}) {
  // 优化：使用 useMemo 缓存 UI 对象，防止其在每次渲染时重建导致子组件 props 改变而击穿缓存
  const t = useMemo(() => densityTokens || {
    panelPadding: '12px',
    buttonPadding: '10px 12px',
    buttonFontSize: 12,
    inputFontSize: 12,
    inputPadding: '8px 10px'
  }, [densityTokens]);

  const ui = useMemo(() => createEditorUi(t, density), [t, density]);
  const headerPanelBodyStyle = { padding: t.panelPadding };
  
  const editorEnv = useMemo(() => ({ 
    density, 
    densityTokens, 
    isDense, 
    isUltra 
  }), [density, densityTokens, isDense, isUltra]);

  const isTakeDisabled = isTransitioning || previewScene === matchData.globalScene;

  const is1080Output = outputResolution === '1920x1080';
  const isSelectorTight = is1080Output || isShort || isDense || isUltra;
  const selectorBodyPadding = isSelectorTight ? '8px' : t.panelPadding;
  const selectorGap = isSelectorTight ? '5px' : '8px';
  const quickSummaryPadding = isSelectorTight ? '8px' : isDense || isUltra ? '10px' : headerPanelBodyStyle.padding;
  const quickSummaryGap = isSelectorTight ? '5px' : isDense || isUltra ? '6px' : '8px';
  const quickSummaryCols = isUltra ? '1fr' : isSelectorTight ? '1fr' : '1fr 1fr';

  const OPTIMAL_TAB_ORDER = [
    'LIVE',
    'MAP_POOL',
    'ROSTER',
    'STATS',
    'CASTERS',
    'COUNTDOWN',
    'HIGHLIGHT',
    'VIDEO',
    'TEAM_DB',
    'COVER',
  ];

  const displayTabs = OPTIMAL_TAB_ORDER.filter(tab => availableTabs.includes(tab));

  const [isExporting, setIsExporting] = useState(false);
  const coverSceneRef = useRef(null);

  const handleExportCover = async () => {
    if (!coverSceneRef.current) return;
    try {
      setIsExporting(true);
      const canvas = await html2canvas(coverSceneRef.current, {
        useCORS: true,
        scale: 1, 
        backgroundColor: COLORS.mainDark || '#111',
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const mode = matchData.coverMode || 'GENERIC';
      link.download = `FCUP-Cover-${mode}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('导出封面失败:', error);
      alert('导出图片失败，请检查是否包含跨域图片问题。');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      style={{
        height: '100vh',
        backgroundColor: COLORS.mainDark,
        color: COLORS.white,
        fontFamily: '"HarmonyOS Sans SC", sans-serif',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <style>{`
        @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
        * { box-sizing: border-box; }
        /* 隐藏数字输入框默认的上下箭头 */
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>

      {/* 修复：移回坐标原点，使用透明度而非负数坐标进行隐藏，防止现代浏览器离屏资源被强行回收导致截图空白 */}
      <div 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '1920px', 
          height: '1080px', 
          pointerEvents: 'none',
          opacity: 0.001, // 确保它仍在浏览器的渲染管线中
          zIndex: -100,
          overflow: 'hidden'
        }}
      >
        <BroadcastCoverScene ref={coverSceneRef} matchData={matchData} />
      </div>

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
          ...workspaceFrameStyle,
          position: 'relative',
          zIndex: 1,
          height: '100vh',
          display: 'grid',
          gridTemplateRows: 'auto auto 1fr',
          minHeight: 0
        }}
      >
        <div
          style={{
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: `6px ${pagePadding}px`,
            borderBottom: `1px solid ${COLORS.lineStrong}`,
            background: 'rgba(20,20,20,0.92)',
            backdropFilter: 'blur(6px)',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div style={{ width: '10px', height: '10px', background: COLORS.yellow, boxShadow: UI.yellowGlow, flexShrink: 0 }} />
            <span style={{ fontSize: '12px', fontWeight: '900', letterSpacing: '2px', color: COLORS.softWhite }}>
              FCUP_CONTROL_INTERFACE
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: '900',
                letterSpacing: '1px',
                padding: '2px 6px',
                backgroundColor: isUnlocked ? 'rgba(244,195,32,0.15)' : 'rgba(255,255,255,0.1)',
                color: isUnlocked ? COLORS.yellow : COLORS.white,
                borderRadius: '2px'
              }}
            >
              {isUnlocked ? 'PRO MODE' : 'EASY MODE'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={handleUnlock}
              style={{
                ...ui.outlineBtn,
                borderColor: isUnlocked ? COLORS.red : COLORS.lineStrong,
                color: isUnlocked ? COLORS.red : COLORS.softWhite,
                cursor: 'pointer'
              }}
            >
              {isUnlocked ? 'EXIT PRO' : 'MODE SELECT'}
            </button>

            <button style={{ ...ui.outlineBtn, cursor: 'pointer' }} onClick={exportConfig}>EXPORT CONFIG</button>
            <button style={{ ...ui.outlineBtn, cursor: 'pointer' }} onClick={importConfig}>IMPORT CONFIG</button>

            {isUnlocked && (
              <button
                style={{
                  ...ui.outlineBtn,
                  borderColor: isLogOpen ? COLORS.yellow : COLORS.lineStrong,
                  color: isLogOpen ? COLORS.yellow : COLORS.softWhite,
                  cursor: 'pointer'
                }}
                onClick={() => setIsLogOpen(!isLogOpen)}
              >
                {isLogOpen ? 'LOG ON' : 'LOG OFF'}
              </button>
            )}
          </div>
        </div>

        <div
          style={{
            padding: `${blockGap}px ${pagePadding}px 0`,
            display: 'grid',
            gridTemplateColumns: isUnlocked ? topGridTemplate : '1fr',
            gap: blockGap,
            alignItems: 'stretch'
          }}
        >
          {isUnlocked ? (
            <>
              <ShellPanel
                title="System Status"
                accent
                density={density}
                style={{ height: '100%' }}
                bodyStyle={{ padding: density === 'spacious' ? '10px 12px' : '8px 10px', height: '100%' }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isUltra ? '1fr' : 'repeat(3, minmax(0,1fr))',
                    gap: '5px'
                  }}
                >
                  <QuickStat label="Mode" value="PRO MODE" valueColor={COLORS.yellow} compact density={density} />
                  <QuickStat label="Console" value={consolePresetMeta.label} compact density={density} />
                  <QuickStat label="Output" value={outputResolution === '3840x2160' ? '4K' : '1080P'} compact density={density} />
                  <QuickStat label="Route" value={isOverlay ? 'OVERLAY' : 'CONTROL'} valueColor={isOverlay ? COLORS.yellow : COLORS.white} compact density={density} />
                  <QuickStat label="Program" value={matchData.globalScene} valueColor="#2ecc71" compact density={density} />
                  <QuickStat label="Preview" value={previewScene} valueColor={COLORS.yellow} compact density={density} />
                </div>
              </ShellPanel>

              <ShellPanel
                title="Scene Routing Center"
                accent
                density={density}
                style={{ height: '100%' }}
                bodyStyle={{ padding: density === 'spacious' ? '10px 12px' : '8px 10px', height: '100%' }}
              >
                <div
                  style={{
                    display: 'grid',
                    gap: '8px'
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isUltra ? '1fr' : '1fr 28px 1fr 96px',
                      gap: '8px',
                      alignItems: 'end'
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '10px',
                          color: COLORS.softWhite,
                          marginBottom: '5px',
                          fontWeight: '900',
                          letterSpacing: '1.6px',
                          textTransform: 'uppercase',
                          lineHeight: 1
                        }}
                      >
                        Preview
                      </div>

                      <select
                        style={{
                          ...ui.select,
                          backgroundColor: COLORS.mainDark,
                          minHeight: density === 'spacious' ? '42px' : '38px',
                          height: density === 'spacious' ? '42px' : '38px',
                          fontSize: density === 'spacious' ? '14px' : '13px',
                          fontWeight: '800',
                          boxSizing: 'border-box'
                        }}
                        value={previewScene}
                        onChange={e => setPreviewScene(e.target.value)}
                      >
                        <option value="LIVE">LIVE</option>
                        <option value="MAP_POOL">MAP_POOL</option>
                        <option value="ROSTER">ROSTER</option>
                        <option value="STATS">STATS</option>
                        <option value="CASTERS">CASTERS</option>
                        <option value="COUNTDOWN">COUNTDOWN</option>
                        <option value="HIGHLIGHT">HIGHLIGHT</option>
                        <option value="VIDEO">VIDEO</option>
                        <option value="WINNER">WINNER</option>
                        <option value="COVER">COVER</option>
                      </select>
                    </div>

                    {!isUltra && (
                      <div
                        style={{
                          height: density === 'spacious' ? '42px' : '38px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          fontWeight: '900',
                          color: COLORS.faintWhite,
                          lineHeight: 1,
                          paddingTop: '1px'
                        }}
                      >
                        →
                      </div>
                    )}

                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '10px',
                          color: COLORS.softWhite,
                          marginBottom: '5px',
                          fontWeight: '900',
                          letterSpacing: '1.6px',
                          textTransform: 'uppercase',
                          lineHeight: 1
                        }}
                      >
                        Program
                      </div>

                      <div
                        style={{
                          ...panelBase,
                          padding: '0 14px',
                          minHeight: density === 'spacious' ? '42px' : '38px',
                          height: density === 'spacious' ? '42px' : '38px',
                          borderTop: '2px solid #2ecc71',
                          display: 'flex',
                          alignItems: 'center',
                          boxSizing: 'border-box'
                        }}
                      >
                        <div
                          style={{
                            color: '#2ecc71',
                            fontSize: density === 'spacious' ? '15px' : '14px',
                            fontWeight: '900',
                            letterSpacing: '0.8px',
                            textTransform: 'uppercase',
                            lineHeight: 1,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {matchData.globalScene}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => takeScene(previewScene)}
                      disabled={isTakeDisabled}
                      style={{
                        width: isUltra ? '100%' : '96px',
                        minHeight: density === 'spacious' ? '42px' : '38px',
                        height: density === 'spacious' ? '42px' : '38px',
                        backgroundColor: isTakeDisabled ? '#555' : COLORS.red,
                        color: isTakeDisabled ? '#999' : '#fff',
                        fontSize: density === 'spacious' ? '18px' : '17px',
                        fontWeight: '900',
                        border: 'none',
                        cursor: isTakeDisabled ? 'not-allowed' : 'pointer',
                        boxShadow: isTakeDisabled ? 'none' : '0 0 16px rgba(255, 77, 77, 0.20)',
                        letterSpacing: '1.2px',
                        fontFamily: '"HarmonyOS Sans SC", sans-serif',
                        transition: 'background-color 0.2s, box-shadow 0.2s, color 0.2s',
                        boxSizing: 'border-box',
                        alignSelf: 'end'
                      }}
                    >
                      TAKE
                    </button>
                  </div>

                  {/* ===== HUD Mode 和 Output Mode 调整行 ===== */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isUltra ? '1fr' : 'minmax(0,1.2fr) 110px 88px 110px 140px',
                      gap: '10px',
                      alignItems: 'end'
                    }}
                  >
                    {/* 1. Stinger Logo */}
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '10px',
                          color: COLORS.faintWhite,
                          marginBottom: '6px',
                          fontWeight: '900',
                          letterSpacing: '1.2px',
                          textTransform: 'uppercase',
                          lineHeight: 1
                        }}
                      >
                        Stinger Logo
                      </div>
                      <select
                        style={{
                          ...ui.select,
                          width: '100%',
                          minWidth: 0,
                          minHeight: density === 'spacious' ? '38px' : '34px',
                          height: density === 'spacious' ? '38px' : '34px',
                          boxSizing: 'border-box',
                          fontSize: density === 'spacious' ? '11px' : '11px',
                          fontWeight: '600',
                          letterSpacing: '0.2px',
                          paddingLeft: '12px',
                          paddingRight: '24px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'clip',
                          appearance: 'none',
                          WebkitAppearance: 'none',
                          MozAppearance: 'none',
                          backgroundColor: 'rgba(0,0,0,0.3)',
                        }}
                        value={matchData.stingerLogo || '/assets/logos/fc_logo.png'}
                        onChange={e => updateData({ ...matchData, stingerLogo: e.target.value })}
                      >
                        <option value="/assets/logos/fc_logo.png">MAIN</option>
                        <option value="/assets/logos/fca_logo.png">ACADEMY</option>
                        <option value="/assets/logos/fcr_logo.png">REGULAR</option>
                      </select>
                    </div>

                    {/* 2. HUD Mode 切换 */}
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '10px',
                          color: COLORS.faintWhite,
                          marginBottom: '6px',
                          fontWeight: '900',
                          letterSpacing: '1.2px',
                          textTransform: 'uppercase',
                          lineHeight: 1
                        }}
                      >
                        HUD Mode
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                        <button
                          style={{
                            ...ui.btn,
                            minHeight: density === 'spacious' ? '38px' : '34px',
                            height: density === 'spacious' ? '38px' : '34px',
                            boxSizing: 'border-box',
                            backgroundColor: matchData.uiMode !== 'TOURNAMENT' ? COLORS.yellow : '#111',
                            color: matchData.uiMode !== 'TOURNAMENT' ? COLORS.black : COLORS.softWhite,
                            border: matchData.uiMode !== 'TOURNAMENT' ? '1px solid transparent' : UI.outerFrame,
                            cursor: 'pointer',
                            fontWeight: '900',
                            fontSize: density === 'spacious' ? '11px' : '10px',
                            letterSpacing: '0.6px',
                            padding: 0
                          }}
                          onClick={() => updateData({ ...matchData, uiMode: 'NORMAL', hudMarginTop: 0 })}
                        >
                          NORM
                        </button>
                        <button
                          style={{
                            ...ui.btn,
                            minHeight: density === 'spacious' ? '38px' : '34px',
                            height: density === 'spacious' ? '38px' : '34px',
                            boxSizing: 'border-box',
                            backgroundColor: matchData.uiMode === 'TOURNAMENT' ? COLORS.yellow : '#111',
                            color: matchData.uiMode === 'TOURNAMENT' ? COLORS.black : COLORS.softWhite,
                            border: matchData.uiMode === 'TOURNAMENT' ? '1px solid transparent' : UI.outerFrame,
                            cursor: 'pointer',
                            fontWeight: '900',
                            fontSize: density === 'spacious' ? '11px' : '10px',
                            letterSpacing: '0.6px',
                            padding: 0
                          }}
                          onClick={() => updateData({ ...matchData, uiMode: 'TOURNAMENT', hudMarginTop: 56 })}
                        >
                          MATCH
                        </button>
                      </div>
                    </div>

                    {/* 3. Margin Top Offset (上下堆叠调整) */}
                    <div style={{ minWidth: 0, opacity: matchData.uiMode === 'TOURNAMENT' ? 1 : 0.25, transition: 'opacity 0.25s ease' }}>
                      <div
                        style={{
                          fontSize: '10px',
                          color: COLORS.faintWhite,
                          marginBottom: '6px',
                          fontWeight: '900',
                          letterSpacing: '1.2px',
                          textTransform: 'uppercase',
                          lineHeight: 1,
                          textAlign: 'center'
                        }}
                      >
                        Y-Offset
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          width: '100%',
                          minHeight: density === 'spacious' ? '38px' : '34px',
                          height: density === 'spacious' ? '38px' : '34px',
                          backgroundColor: matchData.uiMode === 'TOURNAMENT' ? 'rgba(0,0,0,0.5)' : 'transparent',
                          border: matchData.uiMode === 'TOURNAMENT' ? `1px solid ${COLORS.lineStrong}` : '1px dashed rgba(255,255,255,0.1)',
                          boxSizing: 'border-box',
                          borderRadius: '2px',
                          paddingRight: '2px' // 给右侧控制柱留一点边距
                        }}
                      >
                        {/* 左侧大字号数值 */}
                        <input
                          type="number"
                          disabled={matchData.uiMode !== 'TOURNAMENT'}
                          style={{
                            flex: 1,
                            width: '100%',
                            height: '100%',
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: COLORS.yellow,
                            fontWeight: '900',
                            textAlign: 'center',
                            padding: '0 0 0 6px',
                            fontSize: density === 'spacious' ? '13px' : '12px',
                            outline: 'none',
                            fontFamily: '"HarmonyOS Sans SC", sans-serif' // 恢复默认字体体系
                          }}
                          value={matchData.hudMarginTop ?? (matchData.uiMode === 'TOURNAMENT' ? 56 : 0)}
                          onChange={e => {
                            const val = e.target.value;
                            updateData({ ...matchData, hudMarginTop: val });
                          }}
                        />

                        {/* 右侧堆叠的上下调整按钮柱 */}
                        <div style={{ display: 'flex', flexDirection: 'column', height: '80%', flex: '0 0 16px', gap: '2px' }}>
                          <button
                            disabled={matchData.uiMode !== 'TOURNAMENT'}
                            style={{
                              flex: 1,
                              backgroundColor: 'transparent',
                              border: 'none',
                              color: '#888',
                              fontSize: '8px',
                              cursor: matchData.uiMode === 'TOURNAMENT' ? 'pointer' : 'not-allowed',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 0,
                              lineHeight: 1,
                              transition: 'color 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.color = COLORS.white}
                            onMouseOut={e => e.currentTarget.style.color = '#888'}
                            onClick={() => {
                              const current = parseInt(matchData.hudMarginTop, 10);
                              const val = isNaN(current) ? 56 : current;
                              updateData({ ...matchData, hudMarginTop: val + 1 });
                            }}
                          >
                            ▲
                          </button>
                          <button
                            disabled={matchData.uiMode !== 'TOURNAMENT'}
                            style={{
                              flex: 1,
                              backgroundColor: 'transparent',
                              border: 'none',
                              color: '#888',
                              fontSize: '8px',
                              cursor: matchData.uiMode === 'TOURNAMENT' ? 'pointer' : 'not-allowed',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 0,
                              lineHeight: 1,
                              transition: 'color 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.color = COLORS.white}
                            onMouseOut={e => e.currentTarget.style.color = '#888'}
                            onClick={() => {
                              const current = parseInt(matchData.hudMarginTop, 10);
                              const val = isNaN(current) ? 56 : current;
                              updateData({ ...matchData, hudMarginTop: val - 1 });
                            }}
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 4. Output Mode */}
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '10px',
                          color: COLORS.faintWhite,
                          marginBottom: '6px',
                          fontWeight: '900',
                          letterSpacing: '1.2px',
                          textTransform: 'uppercase',
                          lineHeight: 1
                        }}
                      >
                        Output Mode
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                        <button
                          style={{
                            ...ui.btn,
                            minHeight: density === 'spacious' ? '38px' : '34px',
                            height: density === 'spacious' ? '38px' : '34px',
                            boxSizing: 'border-box',
                            backgroundColor: outputResolution === '1920x1080' ? COLORS.yellow : '#111',
                            color: outputResolution === '1920x1080' ? COLORS.black : COLORS.softWhite,
                            border: outputResolution === '1920x1080' ? '1px solid transparent' : UI.outerFrame,
                            cursor: 'pointer',
                            fontWeight: '900',
                            fontSize: density === 'spacious' ? '11px' : '10px',
                            letterSpacing: '0.6px',
                            padding: 0
                          }}
                          onClick={() => onChangeOutputResolution('1920x1080')}
                        >
                          1080P
                        </button>
                        <button
                          style={{
                            ...ui.btn,
                            minHeight: density === 'spacious' ? '38px' : '34px',
                            height: density === 'spacious' ? '38px' : '34px',
                            boxSizing: 'border-box',
                            backgroundColor: outputResolution === '3840x2160' ? COLORS.yellow : '#111',
                            color: outputResolution === '3840x2160' ? COLORS.black : COLORS.softWhite,
                            border: outputResolution === '3840x2160' ? '1px solid transparent' : UI.outerFrame,
                            cursor: 'pointer',
                            fontWeight: '900',
                            fontSize: density === 'spacious' ? '11px' : '10px',
                            letterSpacing: '0.6px',
                            padding: 0
                          }}
                          onClick={() => onChangeOutputResolution('3840x2160')}
                        >
                          4K
                        </button>
                      </div>
                    </div>

                    {/* 5. Current Editor */}
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '10px',
                          color: COLORS.faintWhite,
                          marginBottom: '6px',
                          fontWeight: '900',
                          letterSpacing: '1.2px',
                          textTransform: 'uppercase',
                          lineHeight: 1
                        }}
                      >
                        Current Editor
                      </div>
                      <div
                        style={{
                          ...panelBase,
                          padding: '0 12px',
                          minHeight: density === 'spacious' ? '38px' : '34px',
                          height: density === 'spacious' ? '38px' : '34px',
                          display: 'flex',
                          alignItems: 'center',
                          boxSizing: 'border-box',
                          backgroundColor: 'rgba(0,0,0,0.3)',
                          border: `1px solid ${COLORS.lineStrong}`
                        }}
                      >
                        <div
                          style={{
                            color: COLORS.yellow,
                            fontSize: density === 'spacious' ? '13px' : '12px',
                            fontWeight: '900',
                            lineHeight: 1,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            letterSpacing: '0.4px'
                          }}
                        >
                          {sceneLabelMap[activeTab] || activeTab}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* ================================================= */}
                </div>
              </ShellPanel>

              <ShellPanel
                title="Instant Actions"
                accent
                density={density}
                style={{ height: '100%' }}
                bodyStyle={{ padding: density === 'spacious' ? '10px 12px' : '8px 10px', height: '100%' }}
              >
                <div style={{ display: 'grid', gap: '6px' }}>
                  <button
                    style={{
                      ...ui.actionBtn,
                      minHeight: density === 'spacious' ? '36px' : '36px',
                      height: density === 'spacious' ? '36px' : '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      boxSizing: 'border-box',
                      backgroundColor: COLORS.blue,
                      color: '#fff',
                      cursor: 'pointer'
                    }}
                    onClick={handleSwapTeams}
                  >
                    SWAP SIDES
                  </button>

                  <button
                    style={{
                      ...ui.outlineBtn,
                      minHeight: density === 'spacious' ? '36px' : '36px',
                      height: density === 'spacious' ? '36px' : '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      boxSizing: 'border-box',
                      borderColor: history.length ? COLORS.yellow : COLORS.lineStrong,
                      color: history.length ? COLORS.yellow : COLORS.softWhite,
                      cursor: history.length ? 'pointer' : 'not-allowed',
                      opacity: history.length ? 1 : 0.5
                    }}
                    onClick={handleUndo}
                    disabled={history.length === 0}
                  >
                    UNDO LAST STEP
                  </button>

                  <button
                    style={{
                      ...ui.outlineBtn,
                      minHeight: density === 'spacious' ? '36px' : '36px',
                      height: density === 'spacious' ? '36px' : '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      boxSizing: 'border-box',
                      borderColor: COLORS.red,
                      color: COLORS.red,
                      cursor: 'pointer'
                    }}
                    onClick={handleReset}
                  >
                    HARD RESET
                  </button>
                </div>
              </ShellPanel>
            </>
          ) : (
            <ShellPanel
              title="LIVE STATUS & ACTIONS"
              accent
              density={density}
              style={{ height: '100%' }}
              bodyStyle={{
                padding: density === 'spacious' ? '16px 24px' : '14px 18px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: density === 'spacious' ? '12px' : '11px', color: COLORS.faintWhite, fontWeight: 900, letterSpacing: '2px', marginBottom: '8px' }}>
                    CURRENTLY ON AIR
                  </div>
                  <div
                    style={{
                      fontSize: density === 'spacious' ? '36px' : '28px',
                      color: '#2ecc71',
                      fontWeight: 900,
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      textShadow: '0 0 20px rgba(46, 204, 113, 0.3)',
                      lineHeight: 1
                    }}
                  >
                    {matchData.globalScene}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    style={{
                      ...ui.actionBtn,
                      padding: '0 28px',
                      height: density === 'spacious' ? '54px' : '44px',
                      backgroundColor: COLORS.blue,
                      color: '#fff',
                      cursor: 'pointer',
                      fontWeight: 900,
                      fontSize: density === 'spacious' ? '15px' : '14px',
                      letterSpacing: '0.5px'
                    }}
                    onClick={handleSwapTeams}
                  >
                    SWAP SIDES
                  </button>
                  <button
                    style={{
                      ...ui.outlineBtn,
                      padding: '0 28px',
                      height: density === 'spacious' ? '54px' : '44px',
                      borderColor: history.length ? COLORS.yellow : COLORS.lineStrong,
                      color: history.length ? COLORS.yellow : COLORS.softWhite,
                      cursor: history.length ? 'pointer' : 'not-allowed',
                      opacity: history.length ? 1 : 0.5,
                      fontWeight: 900,
                      fontSize: density === 'spacious' ? '15px' : '14px',
                      letterSpacing: '0.5px'
                    }}
                    onClick={handleUndo}
                    disabled={history.length === 0}
                  >
                    UNDO
                  </button>
                </div>
              </div>
            </ShellPanel>
          )}
        </div>

        <div style={{ minHeight: 0, padding: `${blockGap}px ${pagePadding}px ${pagePadding}px` }}>
          <div style={{ display: 'grid', gridTemplateColumns: mainGridTemplate, gap: blockGap, height: '100%', minHeight: 0 }}>
            {/* Left Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: blockGap, minWidth: 0, minHeight: 0, height: '100%' }}>
              <div style={{ flex: '1 1 0', minHeight: 0, overflow: 'hidden' }}>
                <ShellPanel
                  title={isUnlocked ? "Scene Selector" : "Auto-Take Deck"}
                  accent
                  density={density}
                  style={{ height: '100%' }}
                  bodyStyle={{
                    padding: selectorBodyPadding,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gap: selectorGap,
                      minHeight: 0,
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      paddingRight: isSelectorTight ? '2px' : '0',
                      scrollbarWidth: 'thin'
                    }}
                  >
                    {displayTabs.map((tab, idx) => (
                      <TabButton
                        key={tab}
                        active={activeTab === tab}
                        onClick={() => {
                          setActiveTab(tab);
                          if (!isUnlocked) {
                            setPreviewScene(tab);
                            takeScene(tab, '[AUTO-TAKE] Menu');
                          }
                        }}
                        label={tab}
                        index={idx + 1}
                        compact={isSelectorTight}
                        density={isSelectorTight ? 'compact' : density}
                      />
                    ))}
                  </div>
                </ShellPanel>
              </div>

              <div style={{ flex: '0 0 auto' }}>
                <ShellPanel
                  title="Quick Summary"
                  bodyStyle={{
                    ...headerPanelBodyStyle,
                    padding: quickSummaryPadding
                  }}
                  density={density}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: quickSummaryCols,
                      gap: quickSummaryGap
                    }}
                  >
                    <QuickStat label="Match Format" value={matchData.matchFormat} compact density={density} />
                    <QuickStat label="Current Map" value={`MAP ${matchData.currentMap}`} compact density={density} />
                    <QuickStat label="Score" value={`${matchData.scoreA} : ${matchData.scoreB}`} valueColor={COLORS.yellow} compact density={density} />
                    <QuickStat label="Ticker" value={matchData.showTicker ? 'ACTIVE' : 'OFF'} valueColor={matchData.showTicker ? COLORS.yellow : COLORS.softWhite} compact density={density} />
                  </div>
                </ShellPanel>
              </div>
            </div>

            {/* Center Editor */}
            <div
              style={{
                minWidth: 0,
                minHeight: 0,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: blockGap,
                paddingRight: '2px'
              }}
            >
              {isUnlocked && (
                <div style={{ display: 'grid', gridTemplateColumns: monitorGridTemplate, gap: blockGap }}>
                  <MonitorFrame title={`Preview // ${previewScene}`} accent={COLORS.yellow} compact={isDense} density={density}>
                    <AutoFitScene>{renderPreviewMonitorScene(previewScene)}</AutoFitScene>
                  </MonitorFrame>

                  <MonitorFrame title={`Program // ${matchData.globalScene}`} accent="#2ecc71" compact={isDense} density={density}>
                    <AutoFitScene>
                      {renderProgramMonitorScene(renderScene)}
                      <StingerTransition
                        isActive={isTransitioning}
                        logoPath={matchData.stingerLogo || '/assets/logos/fc_logo.png'}
                        divisionLabel={matchData.infoSubtitle || 'OVERWATCH'}
                      />
                    </AutoFitScene>
                  </MonitorFrame>
                </div>
              )}

              {activeTab === 'LIVE' && <LiveEditor {...editorEnv} isShort={isShort} handleSwapTeams={handleSwapTeams} />}
              {activeTab === 'TEAM_DB' && <TeamDBEditor {...editorEnv} />}
              {activeTab === 'MAP_POOL' && <MapPoolEditor {...editorEnv} />}
              {activeTab === 'CASTERS' && <CasterEditor {...editorEnv} />}
              {activeTab === 'COUNTDOWN' && <CountdownEditor {...editorEnv} />}
              {activeTab === 'VIDEO' && <VideoEditor {...editorEnv} />}
              {activeTab === 'HIGHLIGHT' && <HighlightEditor {...editorEnv} />}
              {activeTab === 'STATS' && <StatsEditor {...editorEnv} />}
              {activeTab === 'ROSTER' && <RosterEditor {...editorEnv} blockGap={blockGap} />}
              
              {activeTab === 'COVER' && (
                <CoverEditor 
                  {...editorEnv} 
                  matchData={matchData} 
                  updateData={updateData} 
                  blockGap={blockGap} 
                  onExport={handleExportCover}   
                  isExporting={isExporting}     
                />
              )}

              {showEmbeddedRightPanels && (
                <div style={{ display: 'grid', gap: blockGap }}>
                  <RightSidebar
                    previewScene={previewScene}
                    showRightColumn={showRightColumn}
                    density={density}
                    densityTokens={densityTokens}
                  />
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            {showRightColumn && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: blockGap, minWidth: 0, minHeight: 0 }}>
                <RightSidebar
                  previewScene={previewScene}
                  showRightColumn={showRightColumn}
                  density={density}
                  densityTokens={densityTokens}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 优化：增加 React.memo，只有 Props 改变时才触发工作区整体重渲染
export default React.memo(ConsoleWorkspace);