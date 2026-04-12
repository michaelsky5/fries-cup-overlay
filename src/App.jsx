import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { MatchContext } from './contexts/MatchContext';
import { OBSProvider, useOBS } from './contexts/OBSContext';
import { useViewport } from './hooks/useViewport';
import { useMatchState } from './hooks/useMatchState';
import { useHistory } from './hooks/useHistory';
import { useSceneController } from './hooks/useSceneController';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

import FriesModal from './components/common/FriesModal';
import ShortcutSettingsModal from './components/controls/ShortcutSettingsModal';

import IntroSplashScreen from './components/auth/IntroSplashScreen';
import NoticeScreen from './components/auth/NoticeScreen';
import LoginModeScreen from './components/auth/LoginModeScreen';
import ConsoleWorkspace from './components/layout/ConsoleWorkspace';

import MatchLiveHUD from './components/scenes/MatchLiveHUD';
import CountdownScene from './components/scenes/CountdownScene';
import CasterScene from './components/scenes/CasterScene';
import MapPoolScene from './components/scenes/MapPoolScene';
import VideoScene from './components/scenes/VideoScene';
import HighlightScene from './components/scenes/HighlightScene';
import StatsScene from './components/scenes/StatsScene';
import RosterScene from './components/scenes/RosterScene';
import StingerTransition from './components/scenes/StingerTransition';
import WinnerScene from './components/scenes/WinnerScene';
import BroadcastCoverScene from './components/scenes/BroadcastCoverScene';

import { COLORS, getDensityTokens } from './constants/styles';
import { LOGO_LIST } from './constants/logos';

const APP_SCREENS = { INTRO: 'intro', NOTICE: 'notice', LOGIN: 'login', WORKSPACE: 'workspace' };

const EASY_TABS = ['LIVE', 'MAP_POOL', 'COUNTDOWN', 'STATS'];
const PRO_TABS = ['LIVE', 'MAP_POOL', 'ROSTER', 'STATS', 'CASTERS', 'COUNTDOWN', 'HIGHLIGHT', 'VIDEO', 'TEAM_DB', 'COVER'];

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const parseSeriesCount = value => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;
  if (typeof value === 'string') {
    const matched = value.match(/\d+/);
    if (matched) return Number(matched[0]);
  }
  return null;
};

const getConsolePresetMeta = (value, viewportW = 0, t) => {
  if (value === '1920x1080') return { label: '1080P', width: 1920, desc: t('consoleMeta.1080p_desc'), densityHint: 'compact' };
  if (value === '2560x1440') return { label: '2K', width: 2560, desc: t('consoleMeta.2k_desc'), densityHint: 'standard' };
  if (value === '3840x2160') return { label: '4K', width: 3840, desc: t('consoleMeta.4k_desc'), densityHint: 'spacious' };
  if (viewportW >= 3000) return { label: 'AUTO · 4K+', width: null, desc: t('consoleMeta.auto_4k_desc'), densityHint: 'spacious' };
  if (viewportW >= 2200) return { label: 'AUTO · 2K', width: null, desc: t('consoleMeta.auto_2k_desc'), densityHint: 'standard' };
  return { label: 'AUTO · 1080P', width: null, desc: t('consoleMeta.auto_1080p_desc'), densityHint: 'compact' };
};

const SceneComponentMap = {
  LIVE: MatchLiveHUD,
  COUNTDOWN: CountdownScene,
  CASTERS: CasterScene,
  MAP_POOL: MapPoolScene,
  VIDEO: VideoScene,
  HIGHLIGHT: HighlightScene,
  STATS: StatsScene,
  ROSTER: RosterScene,
  WINNER: WinnerScene,
  COVER: BroadcastCoverScene
};

const renderSceneByKey = (sceneKey, matchData, isActive = false) => {
  const SceneComponent = SceneComponentMap[sceneKey] || MatchLiveHUD;
  return <SceneComponent matchData={matchData} isActive={isActive} />;
};

function MainApp() {
  const isOverlay = typeof window !== 'undefined' && window.location.hash === '#overlay';
  const { t } = useTranslation();

  const { w, h, density, isDense, isUltra, isShort } = useViewport();
  const { matchData, matchDataRef, videoProgress, updateData: originalUpdateData } = useMatchState();
  const { history, setHistory, updateWithHistory: originalUpdateWithHistory, handleUndo: originalHandleUndo } = useHistory(matchDataRef, originalUpdateData);
  const { previewScene, setPreviewScene, previewSceneRef, renderScene, isTransitioning, takeScene: originalTakeScene } = useSceneController(matchData, matchDataRef, originalUpdateData, setHistory);

  const { obsStatus, obsConfig, connectOBS, broadcastState, onReceiveSync } = useOBS();

  const [activeTab, setActiveTab] = useState('LIVE');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLogOpen, setIsLogOpen] = useState(true);
  const [isShortcutModalOpen, setIsShortcutModalOpen] = useState(false);

  const [appScreen, setAppScreen] = useState(APP_SCREENS.INTRO);
  const [consoleMode, setConsoleMode] = useState('easy');
  const [consoleResolution, setConsoleResolution] = useState('auto');

  const outputResolution = matchData.outputMode === '4K' ? '3840x2160' : '1920x1080';
  const [proAccessCode, setProAccessCode] = useState('');

  const [modalConfig, setModalConfig] = useState({ isOpen: false });
  const closeModal = () => setModalConfig({ isOpen: false });
  const showModal = config => setModalConfig({ ...config, isOpen: true });

  useEffect(() => {
    if (!isOverlay) return;

    const urlParams = new URLSearchParams(window.location.search);
    const pwdFromUrl = urlParams.get('pwd');
    const connectUrl = obsConfig.url || 'ws://127.0.0.1:4455';
    const connectPwd = pwdFromUrl || obsConfig.password || '';

    console.log('Overlay attempting to connect with pwd:', connectPwd ? '***' : 'NONE');
    connectOBS(connectUrl, connectPwd);

    onReceiveSync(remotePayload => {
      if (remotePayload.matchData) originalUpdateData(remotePayload.matchData);
      if (remotePayload.globalScene && remotePayload.globalScene !== matchDataRef.current.globalScene) {
        originalTakeScene(remotePayload.globalScene);
      }
    });
  }, [isOverlay]);

  const syncToOverlay = (newData, newScene) => {
    if (obsStatus !== 'connected' || isOverlay) return;
    broadcastState({ matchData: newData, globalScene: newScene || renderScene });
  };

  const handleUpdateDataAndSync = newData => {
    const resolvedData = typeof newData === 'function' ? newData(matchDataRef.current) : newData;
    originalUpdateData(resolvedData);
    syncToOverlay(resolvedData);
  };

  const handleUpdateWithHistoryAndSync = (actionName, newData) => {
    originalUpdateWithHistory(actionName, newData);
    syncToOverlay(newData);
  };

  const handleTakeSceneAndSync = targetScene => {
    originalTakeScene(targetScene);
    syncToOverlay(matchDataRef.current, targetScene);
  };

  const handleUndoAndSync = () => {
    originalHandleUndo();
    setTimeout(() => syncToOverlay(matchDataRef.current), 50);
  };

  const getSeriesMapTotal = () => {
    const lineupLen = Array.isArray(matchData.mapLineup) ? matchData.mapLineup.length : 0;
    if (lineupLen > 0) return lineupLen;
    return parseSeriesCount(matchData.bestOf) || parseSeriesCount(matchData.seriesLength) || parseSeriesCount(matchData.totalMaps) || 5;
  };

  const getCurrentMapIndex = total => clamp((Number(matchData.currentMap) || 1) - 1, 0, Math.max(0, total - 1));

  const recountScoreFromMapLineup = lineup => ({
    scoreA: lineup.filter(map => map?.winner === 'A').length,
    scoreB: lineup.filter(map => map?.winner === 'B').length
  });

  const updateCurrentMapWinner = winner => {
    const lineup = Array.isArray(matchData.mapLineup) ? matchData.mapLineup.map(map => ({ ...map })) : [];

    if (!lineup.length) {
      handleUpdateWithHistoryAndSync(
        winner === 'A' ? 'TEAM A +1' : 'TEAM B +1',
        {
          ...matchData,
          scoreA: winner === 'A' ? (matchData.scoreA || 0) + 1 : matchData.scoreA || 0,
          scoreB: winner === 'B' ? (matchData.scoreB || 0) + 1 : matchData.scoreB || 0
        }
      );
      return;
    }

    const idx = getCurrentMapIndex(lineup.length);
    lineup[idx] = { ...lineup[idx], winner };
    const nextScore = recountScoreFromMapLineup(lineup);

    handleUpdateWithHistoryAndSync(`Set map ${idx + 1} winner -> ${winner}`, {
      ...matchData,
      ...nextScore,
      mapLineup: lineup
    });
  };

  const clearCurrentMapWinner = () => {
    const lineup = Array.isArray(matchData.mapLineup) ? matchData.mapLineup.map(map => ({ ...map })) : [];
    if (!lineup.length) return;

    const idx = getCurrentMapIndex(lineup.length);
    lineup[idx] = { ...lineup[idx], winner: null, winnerSide: null };
    const nextScore = recountScoreFromMapLineup(lineup);

    handleUpdateWithHistoryAndSync(`Clear map ${idx + 1} winner`, {
      ...matchData,
      ...nextScore,
      mapLineup: lineup
    });
  };

  const handleScoreAUp = () => handleUpdateWithHistoryAndSync('TEAM A +1', { ...matchData, scoreA: (matchData.scoreA || 0) + 1 });
  const handleScoreADown = () => handleUpdateWithHistoryAndSync('TEAM A -1', { ...matchData, scoreA: Math.max(0, (matchData.scoreA || 0) - 1) });
  const handleScoreBUp = () => handleUpdateWithHistoryAndSync('TEAM B +1', { ...matchData, scoreB: (matchData.scoreB || 0) + 1 });
  const handleScoreBDown = () => handleUpdateWithHistoryAndSync('TEAM B -1', { ...matchData, scoreB: Math.max(0, (matchData.scoreB || 0) - 1) });

  const setWinnerA = () => updateCurrentMapWinner('A');
  const setWinnerB = () => updateCurrentMapWinner('B');
  const clearWinner = () => clearCurrentMapWinner();

  const nextMap = () => {
    const total = getSeriesMapTotal();
    const current = Number(matchData.currentMap) || 1;
    handleUpdateWithHistoryAndSync('Next Map', { ...matchData, currentMap: clamp(current + 1, 1, total) });
  };

  const prevMap = () => {
    const total = getSeriesMapTotal();
    const current = Number(matchData.currentMap) || 1;
    handleUpdateWithHistoryAndSync('Previous Map', { ...matchData, currentMap: clamp(current - 1, 1, total) });
  };

  const resetSeriesScore = () => {
    const lineup = Array.isArray(matchData.mapLineup)
      ? matchData.mapLineup.map(map => ({ ...map, winner: null, winnerSide: null }))
      : [];

    handleUpdateWithHistoryAndSync('Reset Series Score', {
      ...matchData,
      currentMap: 1,
      scoreA: 0,
      scoreB: 0,
      mapLineup: lineup
    });
  };

  const toggleTicker = () => handleUpdateDataAndSync({ ...matchData, showTicker: !matchData.showTicker });
  const toggleNames = () => handleUpdateDataAndSync({ ...matchData, showPlayers: !matchData.showPlayers });

  const toggleBans = () =>
    handleUpdateWithHistoryAndSync(
      matchData.showBans ? 'Disable ban mode' : 'Enable ban mode',
      {
        ...matchData,
        showBans: !matchData.showBans,
        showBanPhase: !matchData.showBans ? matchData.showBanPhase : false
      }
    );

  const toggleVoice = () => {
    const next = matchData.activeComms === 'A' ? 'B' : matchData.activeComms === 'B' ? null : 'A';
    handleUpdateDataAndSync({ ...matchData, activeComms: next });
  };

  const voiceToA = () => handleUpdateDataAndSync({ ...matchData, activeComms: 'A' });
  const voiceToB = () => handleUpdateDataAndSync({ ...matchData, activeComms: 'B' });
  const voiceOff = () => handleUpdateDataAndSync({ ...matchData, activeComms: null });

  const toggleAutoBegin = () => {
    const nextVisible = !matchData.beginInfoVisible;
    handleUpdateWithHistoryAndSync(nextVisible ? 'Auto Begin ON' : 'Auto Begin OFF', {
      ...matchData,
      beginInfoVisible: nextVisible,
      autoBeginTrigger: nextVisible ? (matchData.autoBeginTrigger || 0) + 1 : matchData.autoBeginTrigger || 0
    });
  };

  const hudOn = () =>
    handleUpdateWithHistoryAndSync('HUD ON', {
      ...matchData,
      showTicker: true,
      showPlayers: true,
      showBans: true
    });

  const hudOff = () =>
    handleUpdateWithHistoryAndSync('HUD OFF', {
      ...matchData,
      showTicker: false,
      showPlayers: false,
      showBans: false,
      showBanPhase: false
    });

  const toggleProModeLock = () => setIsUnlocked(prev => !prev);

  const handleSwapTeams = () => {
    const nextMapLineup = (matchData.mapLineup || []).map(map => {
      const nextMap = { ...map };
      if (nextMap.picker === 'A') nextMap.picker = 'B';
      else if (nextMap.picker === 'B') nextMap.picker = 'A';
      if (nextMap.winner === 'A') nextMap.winner = 'B';
      else if (nextMap.winner === 'B') nextMap.winner = 'A';
      if (nextMap.winnerSide === 'A') nextMap.winnerSide = 'B';
      else if (nextMap.winnerSide === 'B') nextMap.winnerSide = 'A';
      if (nextMap.banOrderMode === 'A_FIRST') nextMap.banOrderMode = 'B_FIRST';
      else if (nextMap.banOrderMode === 'B_FIRST') nextMap.banOrderMode = 'A_FIRST';
      const tempBansA = nextMap.bansA;
      nextMap.bansA = nextMap.bansB || [];
      nextMap.bansB = tempBansA || [];
      return nextMap;
    });

    const currentStats = matchData.statsTemplateData || {};

    handleUpdateWithHistoryAndSync('Swap Teams', {
      ...matchData,
      teamA: matchData.teamB || '',
      teamB: matchData.teamA || '',
      teamShortA: matchData.teamShortB || '',
      teamShortB: matchData.teamShortA || '',
      logoA: matchData.logoB || '',
      logoB: matchData.logoA || '',
      logoBgA: matchData.logoBgB || '',
      logoBgB: matchData.logoBgA || '',
      scoreA: matchData.scoreB ?? 0,
      scoreB: matchData.scoreA ?? 0,
      bansA: matchData.bansB || [],
      bansB: matchData.bansA || [],
      playersA: [...(matchData.playersB || [])],
      playersB: [...(matchData.playersA || [])],
      subIndexA: matchData.subIndexB ?? null,
      subIndexB: matchData.subIndexA ?? null,
      activeComms: matchData.activeComms === 'A' ? 'B' : matchData.activeComms === 'B' ? 'A' : null,
      rosterPlayersA: [...(matchData.rosterPlayersB || [])],
      rosterPlayersB: [...(matchData.rosterPlayersA || [])],
      rosterStaffA: { ...(matchData.rosterStaffB || {}) },
      rosterStaffB: { ...(matchData.rosterStaffA || {}) },
      mapLineup: nextMapLineup,
      statsTemplateData: {
        ...currentStats,
        elimsA: currentStats.elimsB || '',
        elimsB: currentStats.elimsA || '',
        assistsA: currentStats.assistsB || '',
        assistsB: currentStats.assistsA || '',
        deathsA: currentStats.deathsB || '',
        deathsB: currentStats.deathsA || '',
        damageA: currentStats.damageB || '',
        damageB: currentStats.damageA || '',
        healingA: currentStats.healingB || '',
        healingB: currentStats.healingA || '',
        mitigatedA: currentStats.mitigatedB || '',
        mitigatedB: currentStats.mitigatedA || ''
      }
    });
  };

  useKeyboardShortcuts({
    isUnlocked,
    presetModalTarget: null,
    setPresetModalTarget: () => {},
    takeScene: handleTakeSceneAndSync,
    previewSceneRef,
    setActiveTab,
    handleUndo: handleUndoAndSync,

    matchData,

    handleSwapTeams,
    handleScoreAUp,
    handleScoreADown,
    handleScoreBUp,
    handleScoreBDown,
    setWinnerA,
    setWinnerB,
    clearWinner,
    nextMap,
    prevMap,
    resetSeriesScore,

    toggleTicker,
    toggleNames,
    toggleBans,
    toggleVoice,
    toggleAutoBegin,
    toggleProModeLock,
    setShortcutSettingsOpen: setIsShortcutModalOpen,
    hudOn,
    hudOff,
    voiceToA,
    voiceToB,
    voiceOff
  });

  const consolePresetMeta = useMemo(() => getConsolePresetMeta(consoleResolution, w, t), [consoleResolution, w, t]);
  const uiDensity = consoleResolution === 'auto' ? density : consolePresetMeta.densityHint;
  const densityTokens = useMemo(() => getDensityTokens(uiDensity), [uiDensity]);

  const availableTabs = isUnlocked ? PRO_TABS : EASY_TABS;

  useEffect(() => {
    if (!availableTabs.includes(activeTab)) setActiveTab('LIVE');
  }, [activeTab, availableTabs]);

  const workspaceFrameStyle = useMemo(() => ({
    width: '100%',
    maxWidth: consolePresetMeta.width ? `${consolePresetMeta.width}px` : '100%',
    margin: '0 auto',
    height: '100%'
  }), [consolePresetMeta]);

  const pagePadding = densityTokens.pagePadding;
  const blockGap = densityTokens.blockGap;
  const sideColWidth = densityTokens.sideColWidth;
  const rightColWidth = densityTokens.rightColWidth;

  const showRightColumn = isUnlocked && isLogOpen && !isUltra;
  const showEmbeddedRightPanels = isUnlocked && isLogOpen && isUltra;
  const topGridTemplate = !isUnlocked ? (isDense ? '1fr' : '1fr 1.35fr') : (isUltra ? '1fr' : isDense ? '1fr 1fr' : '1fr 1.45fr 0.9fr');
  const mainGridTemplate = showRightColumn ? `${sideColWidth}px minmax(0,1fr) ${rightColWidth}px` : `${sideColWidth}px minmax(0,1fr)`;
  const monitorGridTemplate = isDense ? '1fr' : '1fr 1fr';

  const sceneLabelMap = {
    LIVE: t('scenes.MATCH_LIVE'),
    TEAM_DB: t('scenes.TEAM_DB'),
    MAP_POOL: t('scenes.MAP_POOL'),
    CASTERS: t('scenes.CASTERS'),
    COUNTDOWN: t('scenes.COUNTDOWN'),
    VIDEO: t('scenes.VIDEO_PLAYER'),
    HIGHLIGHT: t('scenes.HIGHLIGHTS'),
    STATS: t('scenes.MATCH_STATS'),
    ROSTER: t('scenes.TEAM_ROSTERS'),
    WINNER: t('scenes.WINNER_SCREEN'),
    COVER: t('scenes.BROADCAST_COVER')
  };

  const silentMatchData = useMemo(() => ({
    ...matchData,
    autoBeginTrigger: 0,
    beginInfoVisible: false
  }), [matchData]);

  const renderMonitorScene = sceneKey => renderSceneByKey(sceneKey, silentMatchData, sceneKey === 'LIVE' && sceneKey === renderScene);
  const renderPreviewMonitorScene = sceneKey => renderSceneByKey(sceneKey, silentMatchData, false);
  const renderProgramMonitorScene = sceneKey => renderSceneByKey(sceneKey, silentMatchData, sceneKey === 'LIVE');

  const syncOutputResolution = value => {
    handleUpdateDataAndSync({ ...matchData, outputMode: value === '3840x2160' ? '4K' : '1080P' });
  };

  const enterEasyMode = () => {
    setConsoleMode('easy');
    setIsUnlocked(false);
    setActiveTab('LIVE');
    setAppScreen(APP_SCREENS.WORKSPACE);
  };

  const enterProMode = () => {
    const answer = String(proAccessCode || '').trim().toLowerCase();
    if (answer === '42' || answer === 'fries') {
      setConsoleMode('pro');
      setIsUnlocked(true);
      setAppScreen(APP_SCREENS.WORKSPACE);
      setProAccessCode('');
      return;
    }
    showModal({ type: 'alert', title: t('modals.accessDenied.title'), message: t('modals.accessDenied.message'), isDanger: true });
  };

  const handleUnlock = () => {
    if (isUnlocked) {
      setIsUnlocked(false);
      setConsoleMode('easy');
      setActiveTab('LIVE');
      setAppScreen(APP_SCREENS.LOGIN);
      return;
    }
    setAppScreen(APP_SCREENS.LOGIN);
  };

  const exportConfig = () => {
    navigator.clipboard.writeText(JSON.stringify(matchData))
      .then(() => showModal({ type: 'alert', title: t('modals.exportSuccess.title'), message: t('modals.exportSuccess.message') }))
      .catch(() => showModal({ type: 'alert', title: t('modals.exportFailed.title'), message: t('modals.exportFailed.message'), isDanger: true }));
  };

  const importConfig = () => {
    showModal({
      type: 'prompt',
      title: t('modals.importConfig.title'),
      message: t('modals.importConfig.message'),
      onConfirm: data => {
        if (!data) return;
        try {
          const parsed = JSON.parse(data);
          handleUpdateDataAndSync(parsed);
          showModal({ type: 'alert', title: t('modals.importSuccess.title'), message: t('modals.importSuccess.message') });
        } catch (e) {
          showModal({ type: 'alert', title: t('modals.importFailed.title'), message: t('modals.importFailed.message'), isDanger: true });
        }
      }
    });
  };

  const handleReset = () => {
    showModal({
      type: 'confirm',
      title: t('modals.nuclearReset.title'),
      isDanger: true,
      message: t('modals.nuclearReset.message'),
      onConfirm: () =>
        handleUpdateWithHistoryAndSync('Nuclear Reset', {
          ...matchData,
          currentMap: 1,
          showBans: false,
          scoreA: 0,
          scoreB: 0,
          subIndexA: null,
          subIndexB: null,
          activeComms: null,
          teamA: 'TEAM A',
          teamB: 'TEAM B',
          casters: [
            { id: 'A', title: 'COMMENTATOR', label: 'CASTER A', social: '', avatar: '' },
            { id: 'B', title: 'COMMENTATOR', label: 'CASTER B', social: '', avatar: '' }
          ],
          logoA: LOGO_LIST[0].path,
          logoB: LOGO_LIST[0].path,
          logoBgA: COLORS.mainDark,
          logoBgB: COLORS.mainDark,
          bansA: ['tank/dva'],
          bansB: ['damage/tracer'],
          playersA: ['P1', 'P2', 'P3', 'P4', 'P5'],
          playersB: ['P1', 'P2', 'P3', 'P4', 'P5'],
          statsMode: 'IMAGE',
          statsTemplateData: {
            elimsA: '0',
            elimsB: '0',
            deathsA: '0',
            deathsB: '0',
            damageA: '0',
            damageB: '0',
            healingA: '0',
            healingB: '0'
          }
        })
    });
  };

  const renderOverlayPage = () => {
    const is4K = matchData.outputMode === '4K';
    const outW = is4K ? 3840 : 1920;
    const outH = is4K ? 2160 : 1080;
    const scale = is4K ? 2 : 1;

    return (
      <div style={{ width: `${outW}px`, height: `${outH}px`, position: 'relative', overflow: 'hidden', background: 'transparent' }}>
        <div style={{ width: '1920px', height: '1080px', position: 'absolute', left: 0, top: 0, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          {renderSceneByKey(renderScene, matchData, renderScene === 'LIVE')}
          <StingerTransition
            isActive={isTransitioning}
            logoPath={matchData.stingerLogo || '/assets/logos/fc_logo.png'}
            divisionLabel={matchData.infoSubtitle || 'OVERWATCH'}
          />
        </div>
      </div>
    );
  };

  const contextValue = useMemo(() => ({
    matchData,
    updateData: handleUpdateDataAndSync,
    updateWithHistory: handleUpdateWithHistoryAndSync,
    history,
    handleUndo: handleUndoAndSync,
    videoProgress,
    showModal,
    setPreviewScene
  }), [matchData, history, videoProgress, setPreviewScene]);

  return (
    <MatchContext.Provider value={contextValue}>
      {isOverlay ? (
        renderOverlayPage()
      ) : appScreen === APP_SCREENS.INTRO ? (
        <IntroSplashScreen duration={2200} onFinish={() => setAppScreen(APP_SCREENS.NOTICE)} />
      ) : appScreen === APP_SCREENS.NOTICE ? (
        <NoticeScreen
          density={uiDensity}
          densityTokens={densityTokens}
          isDense={isDense}
          isUltra={isUltra}
          blockGap={blockGap}
          w={w}
          h={h}
          consolePresetMeta={consolePresetMeta}
          outputResolution={outputResolution}
          consoleMode={consoleMode}
          onEnterSystem={() => setAppScreen(APP_SCREENS.LOGIN)}
          onSetDefault1080={() => syncOutputResolution('1920x1080')}
        />
      ) : appScreen === APP_SCREENS.LOGIN ? (
        <LoginModeScreen
          density={uiDensity}
          densityTokens={densityTokens}
          isDense={isDense}
          isUltra={isUltra}
          blockGap={blockGap}
          consoleResolution={consoleResolution}
          setConsoleResolution={setConsoleResolution}
          outputResolution={outputResolution}
          onChangeOutputResolution={syncOutputResolution}
          consolePresetMeta={consolePresetMeta}
          w={w}
          h={h}
          proAccessCode={proAccessCode}
          setProAccessCode={setProAccessCode}
          onEnterBasicMode={enterEasyMode}
          onEnterProMode={enterProMode}
          onBackNotice={() => setAppScreen(APP_SCREENS.NOTICE)}
        />
      ) : (
        <ConsoleWorkspace
          density={uiDensity}
          densityTokens={densityTokens}
          isOverlay={isOverlay}
          isDense={isDense}
          isUltra={isUltra}
          isShort={isShort}
          pagePadding={pagePadding}
          blockGap={blockGap}
          sideColWidth={sideColWidth}
          rightColWidth={rightColWidth}
          showRightColumn={showRightColumn}
          showEmbeddedRightPanels={showEmbeddedRightPanels}
          topGridTemplate={topGridTemplate}
          mainGridTemplate={mainGridTemplate}
          monitorGridTemplate={monitorGridTemplate}
          workspaceFrameStyle={workspaceFrameStyle}
          matchData={matchData}
          updateData={handleUpdateDataAndSync}
          history={history}
          handleUndo={handleUndoAndSync}
          previewScene={previewScene}
          setPreviewScene={setPreviewScene}
          renderScene={renderScene}
          isTransitioning={isTransitioning}
          takeScene={handleTakeSceneAndSync}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          availableTabs={availableTabs}
          isUnlocked={isUnlocked}
          isLogOpen={isLogOpen}
          setIsLogOpen={setIsLogOpen}
          handleUnlock={handleUnlock}
          exportConfig={exportConfig}
          importConfig={importConfig}
          handleSwapTeams={handleSwapTeams}
          handleReset={handleReset}
          consolePresetMeta={consolePresetMeta}
          outputResolution={outputResolution}
          onChangeOutputResolution={syncOutputResolution}
          renderMonitorScene={renderMonitorScene}
          renderPreviewMonitorScene={renderPreviewMonitorScene}
          renderProgramMonitorScene={renderProgramMonitorScene}
          sceneLabelMap={sceneLabelMap}
          openShortcutModal={() => setIsShortcutModalOpen(true)}
        />
      )}

      {!isOverlay && <FriesModal config={modalConfig} onClose={closeModal} />}

      {!isOverlay && isShortcutModalOpen && (
        <ShortcutSettingsModal
          onClose={() => setIsShortcutModalOpen(false)}
          matchData={matchData}
          updateData={handleUpdateDataAndSync}
          density={uiDensity}
          densityTokens={densityTokens}
        />
      )}
    </MatchContext.Provider>
  );
}

export default function App() {
  return (
    <OBSProvider>
      <MainApp />
    </OBSProvider>
  );
}