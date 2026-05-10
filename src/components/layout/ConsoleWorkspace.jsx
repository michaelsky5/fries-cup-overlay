import React, { useRef, useState, useMemo, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { useTranslation } from 'react-i18next';

import {
  COLORS,
  UI,
  panelBase
} from '../../constants/styles';
import { createEditorUi } from '../../utils/editorUi';
import {
  ShellPanel,
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
import DataGraphicsEditor from '../controls/DataGraphicsEditor';

import RightSidebar from './RightSidebar';
import StingerTransition from '../scenes/StingerTransition';
import BroadcastCoverScene from '../scenes/BroadcastCoverScene';

const DEFAULT_BAN_ENTRY = 'damage/tbd';
const resetBanList = () => [DEFAULT_BAN_ENTRY];

const getBaseControlUrl = () => {
  if (typeof window === 'undefined') return 'https://console.fries-cup.com/';
  return new URL('/', window.location.origin).toString();
};

const getCurrentRoomId = () => {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  return (
    url.searchParams.get('room') ||
    url.searchParams.get('roomId') ||
    url.searchParams.get('match') ||
    url.searchParams.get('matchId') ||
    ''
  ).trim();
};

const getCurrentSyncUrl = () => {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  return (
    url.searchParams.get('syncUrl') ||
    url.searchParams.get('sync') ||
    ''
  ).trim();
};

const createBroadcastRoomId = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `fcup-${yyyy}${mm}${dd}-${random}`.toLowerCase();
};

const buildBroadcastRoomUrl = (roomId, hash = '') => {
  const url = new URL(getBaseControlUrl());
  const syncUrl = getCurrentSyncUrl();

  url.searchParams.set('room', roomId);
  if (syncUrl) url.searchParams.set('syncUrl', syncUrl);
  url.hash = hash;

  return url.toString();
};

const getBroadcastRoomInfo = () => {
  const roomId = getCurrentRoomId();
  const syncUrl = getCurrentSyncUrl();

  const hasRoom = !!roomId;
  const controlUrl = hasRoom ? buildBroadcastRoomUrl(roomId) : getBaseControlUrl();
  const overlayUrl = hasRoom ? buildBroadcastRoomUrl(roomId, 'overlay') : '';

  return {
    hasRoom,
    roomId,
    roomLabel: hasRoom ? roomId : 'NOT CREATED',
    syncUrl: syncUrl || 'AUTO',
    controlUrl,
    overlayUrl
  };
};

function GuideCopyRow({
  label,
  value,
  copied,
  onCopy,
  disabled = false,
  accent = false,
  copyLabel = 'COPY',
  copiedLabel = 'COPIED'
}) {
  return (
    <div
      style={{
        border: `1px solid ${accent ? 'rgba(244,195,32,0.24)' : 'rgba(255,255,255,0.08)'}`,
        background: accent ? 'rgba(244,195,32,0.055)' : 'rgba(255,255,255,0.035)',
        padding: '10px',
        display: 'grid',
        gridTemplateColumns: '112px minmax(0,1fr) 72px',
        gap: '10px',
        alignItems: 'center'
      }}
    >
      <div style={{ color: accent ? COLORS.yellow : COLORS.softWhite, fontSize: 11, fontWeight: 900, letterSpacing: 0.8 }}>
        {label}
      </div>

      <div
        style={{
          color: disabled ? 'rgba(255,255,255,0.34)' : COLORS.white,
          fontSize: 11,
          fontWeight: 800,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          fontFamily: 'monospace'
        }}
        title={value}
      >
        {value || '-'}
      </div>

      <button
        type="button"
        disabled={disabled || !value}
        onClick={() => onCopy(value, label)}
        style={{
          height: 28,
          border: `1px solid ${copied === label ? COLORS.yellow : 'rgba(255,255,255,0.14)'}`,
          background: copied === label ? 'rgba(244,195,32,0.16)' : 'rgba(0,0,0,0.35)',
          color: copied === label ? COLORS.yellow : disabled ? 'rgba(255,255,255,0.28)' : COLORS.softWhite,
          cursor: disabled || !value ? 'not-allowed' : 'pointer',
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: 0.8
        }}
      >
        {copied === label ? copiedLabel : copyLabel}
      </button>
    </div>
  );
}

function ConsoleWorkspace({
  density,
  densityTokens,
  isOverlay,
  isDense,
  isUltra,
  isShort,
  pagePadding,
  blockGap,
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
  sceneLabelMap = {},

  openShortcutModal
}) {
  const { t: tr } = useTranslation();

  const br = useCallback((key, options = {}) => {
    return tr(`workspace.broadcastRoom.${key}`, options);
  }, [tr]);

  const broadcastRoomInfo = useMemo(() => getBroadcastRoomInfo(), []);
  const roomDisplayLabel = broadcastRoomInfo.hasRoom ? broadcastRoomInfo.roomLabel : br('notCreated');
  const roomBadgeLabel = broadcastRoomInfo.hasRoom ? `${br('roomPrefix')} ${broadcastRoomInfo.roomLabel}` : br('roomNotSet');
  const copyLabel = br('copy');
  const copiedLabel = br('copied');
  const copyObsUrlTarget = br('copyObsUrl');

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

  const isTakeDisabled = isTransitioning || (broadcastRoomInfo.hasRoom && previewScene === matchData.globalScene);

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
    'DATA_GRAPHICS',
    'CASTERS',
    'COUNTDOWN',
    'HIGHLIGHT',
    'VIDEO',
    'COVER',
    'TEAM_DB',
    'WINNER',
    'MVP_SCENE',
    'H2H_SCENE',
    'TEAM_COMPARISON_SCENE',
    'MAP_PROFILE_SCENE',
    'LEADERBOARD_SCENE'
  ];

  const ESSENTIAL_SCENE_KEYS = [
    'LIVE',
    'MAP_POOL',
    'ROSTER',
    'STATS',
    'CASTERS',
    'COUNTDOWN',
    'HIGHLIGHT',
    'VIDEO'
  ];

  const AUTO_TAKE_TABS = new Set([
    'LIVE',
    'MAP_POOL',
    'ROSTER',
    'STATS',
    'CASTERS',
    'COUNTDOWN',
    'HIGHLIGHT',
    'VIDEO',
    'COVER'
  ]);

  const displayTabs = OPTIMAL_TAB_ORDER.filter(tab => availableTabs.includes(tab));

  const [previewSceneScope, setPreviewSceneScope] = useState('ESSENTIAL');
  const [isExporting, setIsExporting] = useState(false);
  const [isRoomPanelOpen, setIsRoomPanelOpen] = useState(false);
  const [copiedGuideTarget, setCopiedGuideTarget] = useState('');
  const coverSceneRef = useRef(null);

  const openRoomRequiredPanel = useCallback(() => {
    setCopiedGuideTarget('');
    setIsRoomPanelOpen(true);
  }, []);

  const guardedTakeScene = useCallback(targetScene => {
    if (!broadcastRoomInfo.hasRoom) {
      openRoomRequiredPanel();
      return;
    }

    takeScene(targetScene);
  }, [broadcastRoomInfo.hasRoom, openRoomRequiredPanel, takeScene]);

  const copyGuideText = useCallback((text, target) => {
    if (!text) return;

    const markCopied = () => {
      setCopiedGuideTarget(target);
      window.setTimeout(() => setCopiedGuideTarget(''), 1200);
    };

    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(markCopied).catch(() => {});
      return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    markCopied();
  }, []);

  const createNewBroadcastRoom = useCallback(() => {
    const nextRoomId = createBroadcastRoomId();
    window.location.assign(buildBroadcastRoomUrl(nextRoomId));
  }, []);

  const previewSceneEntries = useMemo(() => {
    const sourceEntries = Object.keys(sceneLabelMap).length > 0
      ? Object.entries(sceneLabelMap)
      : OPTIMAL_TAB_ORDER.map(key => [key, key]);

    const sortedEntries = sourceEntries
      .filter(([key]) => key !== 'TEAM_DB')
      .sort(([keyA], [keyB]) => {
        const indexA = OPTIMAL_TAB_ORDER.indexOf(keyA);
        const indexB = OPTIMAL_TAB_ORDER.indexOf(keyB);
        const orderA = indexA !== -1 ? indexA : 999;
        const orderB = indexB !== -1 ? indexB : 999;
        return orderA - orderB;
      });

    if (previewSceneScope === 'ALL') return sortedEntries;

    const coreEntries = sortedEntries.filter(([key]) => ESSENTIAL_SCENE_KEYS.includes(key));
    const hasCurrentPreview = coreEntries.some(([key]) => key === previewScene);

    if (hasCurrentPreview || !previewScene) return coreEntries;

    const currentPreviewEntry = sortedEntries.find(([key]) => key === previewScene);

    if (!currentPreviewEntry) return coreEntries;

    return [
      currentPreviewEntry,
      ...coreEntries.filter(([key]) => key !== previewScene)
    ];
  }, [sceneLabelMap, previewSceneScope, previewScene]);

  const handleExportCover = async () => {
    if (!coverSceneRef.current) return;

    try {
      setIsExporting(true);

      const canvas = await html2canvas(coverSceneRef.current, {
        useCORS: true,
        scale: 1,
        backgroundColor: COLORS.mainDark || '#111'
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const mode = matchData.coverMode || 'GENERIC';

      link.download = `FCUP-Cover-${mode}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error(br('exportCoverFailedLog'), error);
      alert(br('exportCoverFailedMessage'));
    } finally {
      setIsExporting(false);
    }
  };

  const normalizeResetBanState = useCallback(data => {
    const source = data || {};

    return {
      ...source,
      bansA: resetBanList(),
      bansB: resetBanList(),
      banOrderMode: 'A_FIRST',
      showBanPhase: false,
      heroBanTriggerAt: 0,
      autoBeginTriggerAt: 0,
      mapLineup: Array.isArray(source.mapLineup)
        ? source.mapLineup.map(map => ({
            ...map,
            bansA: resetBanList(),
            bansB: resetBanList(),
            banOrderMode: 'A_FIRST'
          }))
        : source.mapLineup
    };
  }, []);

  const handleWorkspaceReset = useCallback(() => {
    handleReset?.();

    window.setTimeout(() => {
      updateData(prev => normalizeResetBanState(prev || matchData));
    }, 0);
  }, [handleReset, updateData, normalizeResetBanState, matchData]);

  const handleAutoTakeTab = useCallback(tab => {
    setActiveTab(tab);

    if (!isUnlocked && AUTO_TAKE_TABS.has(tab)) {
      setPreviewScene(tab);

      if (!broadcastRoomInfo.hasRoom) {
        window.setTimeout(() => {
          openRoomRequiredPanel();
        }, 0);
        return;
      }

      window.setTimeout(() => {
        takeScene(tab);
      }, 0);
    }
  }, [
    isUnlocked,
    broadcastRoomInfo.hasRoom,
    setActiveTab,
    setPreviewScene,
    takeScene,
    openRoomRequiredPanel
  ]);

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
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>

      <div
        ref={coverSceneRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '1920px',
          height: '1080px',
          pointerEvents: 'none',
          opacity: 0.001,
          zIndex: -100,
          overflow: 'hidden'
        }}
      >
        <BroadcastCoverScene matchData={matchData} />
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

      {isRoomPanelOpen && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 80,
            background: 'rgba(0,0,0,0.72)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24
          }}
          onMouseDown={() => setIsRoomPanelOpen(false)}
        >
          <div
            style={{
              width: 'min(780px, 92vw)',
              border: `1px solid ${COLORS.lineStrong}`,
              background: 'rgba(16,16,16,0.98)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
              padding: 18,
              display: 'flex',
              flexDirection: 'column',
              gap: 14
            }}
            onMouseDown={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <div style={{ color: COLORS.yellow, fontSize: 18, fontWeight: 950, letterSpacing: 1.2 }}>
                  {br('title')}
                </div>
                <div style={{ color: COLORS.softWhite, fontSize: 12, fontWeight: 800, marginTop: 6, lineHeight: 1.55 }}>
                  {br('description')}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsRoomPanelOpen(false)}
                style={{
                  width: 34,
                  height: 34,
                  border: '1px solid rgba(255,255,255,0.16)',
                  background: 'rgba(255,255,255,0.04)',
                  color: COLORS.white,
                  cursor: 'pointer',
                  fontSize: 18,
                  fontWeight: 900
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                border: `1px solid ${broadcastRoomInfo.hasRoom ? 'rgba(46,204,113,0.36)' : 'rgba(255,77,77,0.32)'}`,
                background: broadcastRoomInfo.hasRoom ? 'rgba(46,204,113,0.075)' : 'rgba(255,77,77,0.065)',
                padding: '12px 14px',
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: 14,
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ color: broadcastRoomInfo.hasRoom ? '#2ecc71' : COLORS.red, fontSize: 12, fontWeight: 950, letterSpacing: 1 }}>
                  {broadcastRoomInfo.hasRoom ? br('roomReady') : br('roomNotCreated')}
                </div>
                <div style={{ color: COLORS.white, fontSize: 18, fontWeight: 950, marginTop: 6, letterSpacing: 0.6, fontFamily: 'monospace' }}>
                  {roomDisplayLabel}
                </div>
              </div>

              <button
                type="button"
                onClick={createNewBroadcastRoom}
                style={{
                  height: 38,
                  border: 'none',
                  background: COLORS.yellow,
                  color: COLORS.black,
                  cursor: 'pointer',
                  padding: '0 14px',
                  fontSize: 12,
                  fontWeight: 950,
                  letterSpacing: 0.9
                }}
              >
                {broadcastRoomInfo.hasRoom ? br('newRoom') : br('createRoom')}
              </button>
            </div>

            <div style={{ display: 'grid', gap: 8 }}>
              <GuideCopyRow
                label={br('control')}
                value={broadcastRoomInfo.controlUrl}
                copied={copiedGuideTarget}
                onCopy={copyGuideText}
                copyLabel={copyLabel}
                copiedLabel={copiedLabel}
              />

              <GuideCopyRow
                label={br('obsUrl')}
                value={broadcastRoomInfo.overlayUrl || br('overlayUrlPlaceholder')}
                copied={copiedGuideTarget}
                onCopy={copyGuideText}
                disabled={!broadcastRoomInfo.hasRoom}
                accent
                copyLabel={copyLabel}
                copiedLabel={copiedLabel}
              />

              <GuideCopyRow
                label={br('room')}
                value={roomDisplayLabel}
                copied={copiedGuideTarget}
                onCopy={copyGuideText}
                disabled={!broadcastRoomInfo.hasRoom}
                copyLabel={copyLabel}
                copiedLabel={copiedLabel}
              />

              <GuideCopyRow
                label={br('sync')}
                value={broadcastRoomInfo.syncUrl}
                copied={copiedGuideTarget}
                onCopy={copyGuideText}
                copyLabel={copyLabel}
                copiedLabel={copiedLabel}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: broadcastRoomInfo.hasRoom ? '1fr 1fr' : '1fr', gap: 8 }}>
              {broadcastRoomInfo.hasRoom && (
                <button
                  type="button"
                  onClick={() => copyGuideText(broadcastRoomInfo.overlayUrl, copyObsUrlTarget)}
                  style={{
                    height: 42,
                    border: 'none',
                    background: COLORS.yellow,
                    color: COLORS.black,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 950,
                    letterSpacing: 1
                  }}
                >
                  {copiedGuideTarget === copyObsUrlTarget ? br('copiedObsUrl') : br('copyObsUrl')}
                </button>
              )}

              <button
                type="button"
                onClick={createNewBroadcastRoom}
                style={{
                  height: 42,
                  border: `1px solid ${broadcastRoomInfo.hasRoom ? COLORS.lineStrong : 'transparent'}`,
                  background: broadcastRoomInfo.hasRoom ? 'rgba(255,255,255,0.04)' : COLORS.yellow,
                  color: broadcastRoomInfo.hasRoom ? COLORS.softWhite : COLORS.black,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 950,
                  letterSpacing: 1
                }}
              >
                {broadcastRoomInfo.hasRoom ? br('createAnotherRoom') : br('createRoom')}
              </button>
            </div>

            <div
              style={{
                border: '1px solid rgba(244,195,32,0.18)',
                background: 'rgba(244,195,32,0.055)',
                padding: '12px 14px',
                display: 'grid',
                gap: 8
              }}
            >
              <div style={{ color: COLORS.yellow, fontSize: 12, fontWeight: 950, letterSpacing: 1 }}>
                {br('guideTitle')}
              </div>

              <div style={{ color: COLORS.softWhite, fontSize: 12, lineHeight: 1.65, fontWeight: 700 }}>
                {br('guideStep1')}<br />
                {br('guideStep2')}<br />
                {br('guideStep3')}<br />
                {br('guideStep4')}<br />
                {br('guideStep5')}
              </div>
            </div>

            <div
              style={{
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)',
                padding: '12px 14px',
                color: 'rgba(255,255,255,0.68)',
                fontSize: 11,
                lineHeight: 1.6,
                fontWeight: 700
              }}
            >
              {br('obsTipPrefix')}
              <span style={{ color: COLORS.yellow }}> Shutdown source when not visible </span>
              {br('obsTipMiddle')}
              <span style={{ color: COLORS.yellow }}> Refresh browser when scene becomes active</span>
              {br('obsTipSuffix')}
            </div>
          </div>
        </div>
      )}

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
              {tr('workspace.headerTitle')}
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
              {isUnlocked ? tr('workspace.proMode') : tr('workspace.easyMode')}
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: '900',
                letterSpacing: '0.8px',
                padding: '2px 7px',
                backgroundColor: broadcastRoomInfo.hasRoom ? 'rgba(46,204,113,0.14)' : 'rgba(255,77,77,0.12)',
                color: broadcastRoomInfo.hasRoom ? '#2ecc71' : COLORS.red,
                border: `1px solid ${broadcastRoomInfo.hasRoom ? 'rgba(46,204,113,0.28)' : 'rgba(255,77,77,0.24)'}`,
                borderRadius: '2px',
                maxWidth: '220px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
              title={roomDisplayLabel}
            >
              {roomBadgeLabel}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setIsRoomPanelOpen(true)}
              style={{
                ...ui.outlineBtn,
                cursor: 'pointer',
                height: '26px',
                padding: '0 10px',
                borderColor: broadcastRoomInfo.hasRoom ? 'rgba(46,204,113,0.36)' : 'rgba(244,195,32,0.34)',
                color: broadcastRoomInfo.hasRoom ? '#2ecc71' : COLORS.yellow,
                fontWeight: 900,
                letterSpacing: '0.6px'
              }}
              title={br('button')}
            >
              {br('button')}
            </button>

            <div style={{ width: '1px', height: '16px', backgroundColor: COLORS.lineStrong, margin: '0 4px' }} />

            <button
              onClick={handleUnlock}
              style={{
                ...ui.outlineBtn,
                borderColor: isUnlocked ? COLORS.red : COLORS.lineStrong,
                color: isUnlocked ? COLORS.red : COLORS.softWhite,
                cursor: 'pointer',
                height: '26px',
                padding: '0 10px'
              }}
            >
              {isUnlocked ? tr('workspace.exitPro') : tr('workspace.modeSelect')}
            </button>

            {isUnlocked && (
              <button
                style={{
                  ...ui.outlineBtn,
                  cursor: 'pointer',
                  height: '26px',
                  padding: '0 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderColor: 'rgba(244,195,32,0.3)',
                  color: COLORS.yellow
                }}
                onClick={openShortcutModal}
                title={tr('workspace.shortcutSettingsTitle')}
              >
                {tr('workspace.shortcuts')}
              </button>
            )}

            <button style={{ ...ui.outlineBtn, cursor: 'pointer', height: '26px', padding: '0 10px' }} onClick={exportConfig}>
              {tr('workspace.exportConfig')}
            </button>

            <button style={{ ...ui.outlineBtn, cursor: 'pointer', height: '26px', padding: '0 10px' }} onClick={importConfig}>
              {tr('workspace.importConfig')}
            </button>

            {isUnlocked && (
              <button
                style={{
                  ...ui.outlineBtn,
                  borderColor: isLogOpen ? COLORS.yellow : COLORS.lineStrong,
                  color: isLogOpen ? COLORS.yellow : COLORS.softWhite,
                  cursor: 'pointer',
                  height: '26px',
                  padding: '0 10px'
                }}
                onClick={() => setIsLogOpen(!isLogOpen)}
              >
                {isLogOpen ? tr('workspace.logOn') : tr('workspace.logOff')}
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
                title={tr('workspace.systemStatus')}
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
                  <QuickStat label={tr('workspace.mode')} value={tr('workspace.proMode')} valueColor={COLORS.yellow} compact density={density} />
                  <QuickStat label={tr('workspace.console')} value={consolePresetMeta.label} compact density={density} />
                  <QuickStat label={tr('workspace.output')} value={outputResolution === '3840x2160' ? '4K' : '1080P'} compact density={density} />
                  <QuickStat label={tr('workspace.route')} value={isOverlay ? tr('workspace.overlay') : tr('workspace.control')} valueColor={isOverlay ? COLORS.yellow : COLORS.white} compact density={density} />
                  <QuickStat label={tr('workspace.program')} value={matchData.globalScene} valueColor="#2ecc71" compact density={density} />
                  <QuickStat label={tr('workspace.preview')} value={previewScene} valueColor={COLORS.yellow} compact density={density} />
                </div>
              </ShellPanel>

              <ShellPanel
                title={tr('workspace.sceneCenter')}
                accent
                density={density}
                style={{ height: '100%' }}
                bodyStyle={{ padding: density === 'spacious' ? '10px 12px' : '8px 10px', height: '100%' }}
              >
                <div style={{ display: 'grid', gap: '8px' }}>
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
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '6px',
                          marginBottom: '5px'
                        }}
                      >
                        <div
                          style={{
                            fontSize: '10px',
                            color: COLORS.softWhite,
                            fontWeight: '900',
                            letterSpacing: '1.6px',
                            textTransform: 'uppercase',
                            lineHeight: 1
                          }}
                        >
                          {tr('workspace.preview')}
                        </div>

                        <button
                          type="button"
                          onClick={() => setPreviewSceneScope(prev => prev === 'ESSENTIAL' ? 'ALL' : 'ESSENTIAL')}
                          style={{
                            height: '20px',
                            padding: '0 7px',
                            border: `1px solid ${previewSceneScope === 'ALL' ? COLORS.yellow : 'rgba(255,255,255,0.16)'}`,
                            background: previewSceneScope === 'ALL' ? 'rgba(244,195,32,0.14)' : 'rgba(255,255,255,0.04)',
                            color: previewSceneScope === 'ALL' ? COLORS.yellow : COLORS.softWhite,
                            fontSize: '9px',
                            fontWeight: '900',
                            letterSpacing: '0.8px',
                            cursor: 'pointer',
                            fontFamily: '"HarmonyOS Sans SC", sans-serif'
                          }}
                        >
                          {previewSceneScope === 'ALL'
                            ? tr('workspace.previewScopeAll')
                            : tr('workspace.previewScopeCore')}
                        </button>
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
                        {previewSceneEntries.map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
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
                        {tr('workspace.program')}
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
                      onClick={() => guardedTakeScene(previewScene)}
                      disabled={isTakeDisabled}
                      style={{
                        width: isUltra ? '100%' : '96px',
                        minHeight: density === 'spacious' ? '42px' : '38px',
                        height: density === 'spacious' ? '42px' : '38px',
                        backgroundColor: isTakeDisabled ? '#555' : broadcastRoomInfo.hasRoom ? COLORS.red : COLORS.yellow,
                        color: isTakeDisabled ? '#999' : broadcastRoomInfo.hasRoom ? '#fff' : COLORS.black,
                        fontSize: density === 'spacious' ? '18px' : '17px',
                        fontWeight: '900',
                        border: 'none',
                        cursor: isTakeDisabled ? 'not-allowed' : 'pointer',
                        boxShadow: isTakeDisabled ? 'none' : broadcastRoomInfo.hasRoom ? '0 0 16px rgba(255, 77, 77, 0.20)' : '0 0 16px rgba(244,195,32,0.18)',
                        letterSpacing: '1.2px',
                        fontFamily: '"HarmonyOS Sans SC", sans-serif',
                        transition: 'background-color 0.2s, box-shadow 0.2s, color 0.2s',
                        boxSizing: 'border-box',
                        alignSelf: 'end'
                      }}
                    >
                      {broadcastRoomInfo.hasRoom ? tr('workspace.takeBtn') : br('roomRequiredShort')}
                    </button>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isUltra ? '1fr' : 'minmax(0,1.2fr) 110px 88px 110px 140px',
                      gap: '10px',
                      alignItems: 'end'
                    }}
                  >
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
                        {tr('workspace.stingerLogo')}
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
                          backgroundColor: 'rgba(0,0,0,0.3)'
                        }}
                        value={matchData.stingerLogo || '/assets/logos/fc_logo.png'}
                        onChange={e => updateData({ ...matchData, stingerLogo: e.target.value })}
                      >
                        <option value="/assets/logos/fc_logo.png">{tr('workspace.logoMain')}</option>
                        <option value="/assets/logos/fca_logo.png">{tr('workspace.logoAcademy')}</option>
                        <option value="/assets/logos/fcr_logo.png">{tr('workspace.logoRegular')}</option>
                      </select>
                    </div>

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
                        {tr('workspace.hudMode')}
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
                          {tr('workspace.modeNorm')}
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
                          {tr('workspace.modeMatch')}
                        </button>
                      </div>
                    </div>

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
                        {tr('workspace.yOffset')}
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
                          paddingRight: '2px'
                        }}
                      >
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
                            fontFamily: '"HarmonyOS Sans SC", sans-serif'
                          }}
                          value={matchData.hudMarginTop ?? (matchData.uiMode === 'TOURNAMENT' ? 56 : 0)}
                          onChange={e => {
                            const val = e.target.value;
                            updateData({ ...matchData, hudMarginTop: val });
                          }}
                        />

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
                        {tr('workspace.outputMode')}
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
                        {tr('workspace.currentEditor')}
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
                </div>
              </ShellPanel>

              <ShellPanel
                title={tr('workspace.instantActions')}
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
                      cursor: isTransitioning ? 'not-allowed' : 'pointer',
                      opacity: isTransitioning ? 0.5 : 1
                    }}
                    onClick={handleSwapTeams}
                    disabled={isTransitioning}
                  >
                    {tr('workspace.swapSides')}
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
                      cursor: history.length && !isTransitioning ? 'pointer' : 'not-allowed',
                      opacity: history.length && !isTransitioning ? 1 : 0.5
                    }}
                    onClick={handleUndo}
                    disabled={history.length === 0 || isTransitioning}
                  >
                    {tr('workspace.undo')}
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
                      cursor: isTransitioning ? 'not-allowed' : 'pointer',
                      opacity: isTransitioning ? 0.5 : 1
                    }}
                    onClick={handleWorkspaceReset}
                    disabled={isTransitioning}
                  >
                    {tr('workspace.hardReset')}
                  </button>
                </div>
              </ShellPanel>
            </>
          ) : (
            <ShellPanel
              title={tr('workspace.liveStatus')}
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
                    {tr('workspace.currentlyOnAir')}
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
                      cursor: isTransitioning ? 'not-allowed' : 'pointer',
                      opacity: isTransitioning ? 0.5 : 1,
                      fontWeight: 900,
                      fontSize: density === 'spacious' ? '15px' : '14px',
                      letterSpacing: '0.5px'
                    }}
                    onClick={handleSwapTeams}
                    disabled={isTransitioning}
                  >
                    {tr('workspace.swapSides')}
                  </button>
                  <button
                    style={{
                      ...ui.outlineBtn,
                      padding: '0 28px',
                      height: density === 'spacious' ? '54px' : '44px',
                      borderColor: history.length ? COLORS.yellow : COLORS.lineStrong,
                      color: history.length ? COLORS.yellow : COLORS.softWhite,
                      cursor: history.length && !isTransitioning ? 'pointer' : 'not-allowed',
                      opacity: history.length && !isTransitioning ? 1 : 0.5,
                      fontWeight: 900,
                      fontSize: density === 'spacious' ? '15px' : '14px',
                      letterSpacing: '0.5px'
                    }}
                    onClick={handleUndo}
                    disabled={history.length === 0 || isTransitioning}
                  >
                    {tr('workspace.undo')}
                  </button>
                </div>
              </div>
            </ShellPanel>
          )}
        </div>

        <div style={{ minHeight: 0, padding: `${blockGap}px ${pagePadding}px ${pagePadding}px` }}>
          <div style={{ display: 'grid', gridTemplateColumns: mainGridTemplate, gap: blockGap, height: '100%', minHeight: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: blockGap, minWidth: 0, minHeight: 0, height: '100%' }}>
              <div style={{ flex: '1 1 0', minHeight: 0, overflow: 'hidden' }}>
                <ShellPanel
                  title={isUnlocked ? tr('workspace.sceneSelector') : tr('workspace.autoTakeDeck')}
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
                        onClick={() => handleAutoTakeTab(tab)}
                        label={sceneLabelMap[tab] || tab}
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
                  title={tr('workspace.quickSummary')}
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
                    <QuickStat label={tr('workspace.matchFormat')} value={matchData.matchFormat} compact density={density} />
                    <QuickStat label={tr('workspace.currentMap')} value={`${tr('workspace.mapShort')} ${matchData.currentMap}`} compact density={density} />
                    <QuickStat label={tr('workspace.score')} value={`${matchData.scoreA} : ${matchData.scoreB}`} valueColor={COLORS.yellow} compact density={density} />
                    <QuickStat label={tr('workspace.ticker')} value={matchData.showTicker ? tr('workspace.active') : tr('workspace.off')} valueColor={matchData.showTicker ? COLORS.yellow : COLORS.softWhite} compact density={density} />
                  </div>
                </ShellPanel>
              </div>
            </div>

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
                  <MonitorFrame title={`${tr('workspace.preview')} // ${previewScene}`} accent={COLORS.yellow} compact={isDense} density={density}>
                    <AutoFitScene>{renderPreviewMonitorScene(previewScene)}</AutoFitScene>
                  </MonitorFrame>

                  <MonitorFrame title={`${tr('workspace.program')} // ${matchData.globalScene}`} accent="#2ecc71" compact={isDense} density={density}>
                    <AutoFitScene>
                      {renderProgramMonitorScene()}
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
              {activeTab === 'DATA_GRAPHICS' && <DataGraphicsEditor {...editorEnv} />}
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

export default React.memo(ConsoleWorkspace);