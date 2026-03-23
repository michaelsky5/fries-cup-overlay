import React from 'react';
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

import RightSidebar from './RightSidebar';
import StingerTransition from '../scenes/StingerTransition';

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
  const t = densityTokens || {
    panelPadding: '12px',
    buttonPadding: '10px 12px',
    buttonFontSize: 12,
    inputFontSize: 12,
    inputPadding: '8px 10px'
  };

  const ui = createEditorUi(densityTokens, density);
  const headerPanelBodyStyle = { padding: t.panelPadding };
  const editorEnv = { density, densityTokens, isDense, isUltra };

  const isTakeDisabled = isTransitioning || previewScene === matchData.globalScene;

  // 🌟 神级优化：定义绝对最优的人体工程学 Tab 排序
  const OPTIMAL_TAB_ORDER = [
    'LIVE',
    'MAP_POOL',
    'ROSTER',
    'STATS',
    'CASTERS',
    'COUNTDOWN',
    'HIGHLIGHT',
    'VIDEO',
    'TEAM_DB'
  ];
  
  // 仅渲染在这个最优数组内，且确实可用的 Tab
  const displayTabs = OPTIMAL_TAB_ORDER.filter(tab => availableTabs.includes(tab));

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
            {/* 🌟 模式指示 Badge */}
            <span style={{ 
              fontSize: '10px', 
              fontWeight: '900', 
              letterSpacing: '1px', 
              padding: '2px 6px', 
              backgroundColor: isUnlocked ? 'rgba(244,195,32,0.15)' : 'rgba(255,255,255,0.1)', 
              color: isUnlocked ? COLORS.yellow : COLORS.white,
              borderRadius: '2px'
            }}>
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
            // 🌟 动态适配宽容模式，EASY 模式强制单列展开
            gridTemplateColumns: isUnlocked ? topGridTemplate : '1fr',
            gap: blockGap,
            // 🌟 强迫症修复：从 'start' 改为 'stretch'，强制三个面板无论内容多少都保持绝对等高！
            alignItems: 'stretch' 
          }}
        >
          {isUnlocked ? (
            /* 🌟 PRO 模式：保留原汁原味的三大控制面板 */
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
                  {/* Row 1 */}
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

                  {/* Row 2 */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isUltra ? '1fr' : 'minmax(0,1fr) 132px 180px',
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
                          paddingLeft: '10px',
                          paddingRight: '24px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'clip',
                          appearance: 'none',
                          WebkitAppearance: 'none',
                          MozAppearance: 'none'
                        }}
                        value={matchData.stingerLogo || '/assets/logos/fc_logo.png'}
                        onChange={e => updateData({ ...matchData, stingerLogo: e.target.value })}
                      >
                        <option value="/assets/logos/fc_logo.png">MAIN</option>
                        <option value="/assets/logos/fca_logo.png">ACADEMY</option>
                        <option value="/assets/logos/fcr_logo.png">REGULAR</option>
                      </select>
                    </div>

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
                        Output Mode
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        <button
                          style={{
                            ...ui.btn,
                            minHeight: density === 'spacious' ? '38px' : '34px',
                            height: density === 'spacious' ? '38px' : '34px',
                            boxSizing: 'border-box',
                            backgroundColor: outputResolution === '1920x1080' ? COLORS.yellow : '#111',
                            color: outputResolution === '1920x1080' ? COLORS.black : COLORS.softWhite,
                            border: UI.outerFrame,
                            cursor: 'pointer',
                            fontWeight: '900',
                            fontSize: density === 'spacious' ? '11px' : '10px',
                            letterSpacing: '0.6px'
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
                            border: UI.outerFrame,
                            cursor: 'pointer',
                            fontWeight: '900',
                            fontSize: density === 'spacious' ? '11px' : '10px',
                            letterSpacing: '0.6px'
                          }}
                          onClick={() => onChangeOutputResolution('3840x2160')}
                        >
                          4K
                        </button>
                      </div>
                    </div>

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
                          boxSizing: 'border-box'
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
            /* 🌟 EASY 模式：专为 4K 巨屏重构的大字号“播控状态台” */
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
                   <div style={{ 
                     fontSize: density === 'spacious' ? '36px' : '28px', 
                     color: '#2ecc71', 
                     fontWeight: 900, 
                     letterSpacing: '1px', 
                     textTransform: 'uppercase', 
                     textShadow: '0 0 20px rgba(46, 204, 113, 0.3)',
                     lineHeight: 1 
                   }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: blockGap, minWidth: 0, minHeight: 0 }}>
              <ShellPanel 
                title={isUnlocked ? "Scene Selector" : "Auto-Take Deck"} 
                accent 
                bodyStyle={headerPanelBodyStyle} 
                density={density}
              >
                <div style={{ display: 'grid', gap: '8px' }}>
                  {/* 🌟 使用过滤后的 displayTabs 渲染，彻底阻断 WINNER */}
                  {displayTabs.map((tab, idx) => (
                    <TabButton
                      key={tab}
                      active={activeTab === tab}
                      onClick={() => {
                        setActiveTab(tab);
                        // 🌟 EASY 模式盲切引擎触发
                        if (!isUnlocked) {
                          setPreviewScene(tab);
                          takeScene(tab, '[AUTO-TAKE] Menu');
                        }
                      }}
                      label={tab}
                      index={idx + 1}
                      compact={isDense}
                      density={density}
                    />
                  ))}
                </div>
              </ShellPanel>

              <ShellPanel
                title="Quick Summary"
                bodyStyle={{
                  ...headerPanelBodyStyle,
                  padding: isDense || isUltra ? '10px' : headerPanelBodyStyle.padding
                }}
                density={density}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isUltra ? '1fr' : isDense ? '1fr' : '1fr 1fr',
                    gap: isDense || isUltra ? '6px' : '8px'
                  }}
                >
                  <QuickStat label="Match Format" value={matchData.matchFormat} compact density={density} />
                  <QuickStat label="Current Map" value={`MAP ${matchData.currentMap}`} compact density={density} />
                  <QuickStat label="Score" value={`${matchData.scoreA} : ${matchData.scoreB}`} valueColor={COLORS.yellow} compact density={density} />
                  <QuickStat label="Ticker" value={matchData.showTicker ? 'ACTIVE' : 'OFF'} valueColor={matchData.showTicker ? COLORS.yellow : COLORS.softWhite} compact density={density} />
                </div>
              </ShellPanel>
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
              {/* 🌟 核心优化：仅在专业模式下渲染监视器 */}
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

export default ConsoleWorkspace;