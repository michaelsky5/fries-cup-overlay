import React, { useEffect, useMemo, useState } from 'react';

// Context / Hooks
import { MatchContext } from './contexts/MatchContext';
import { OBSProvider } from './contexts/OBSContext';
import { useViewport } from './hooks/useViewport';
import { useMatchState } from './hooks/useMatchState';
import { useHistory } from './hooks/useHistory';
import { useSceneController } from './hooks/useSceneController';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

// Modal
import FriesModal from './components/common/FriesModal';

// Auth / Layout
import IntroSplashScreen from './components/auth/IntroSplashScreen';
import NoticeScreen from './components/auth/NoticeScreen';
import LoginModeScreen from './components/auth/LoginModeScreen';
import ConsoleWorkspace from './components/layout/ConsoleWorkspace';

// Scenes
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

// Config / Styles
import { COLORS, BASE_SCENE_W, BASE_SCENE_H, getDensityTokens } from './constants/styles';
import { LOGO_LIST } from './constants/logos';

const APP_SCREENS = { INTRO: 'intro', NOTICE: 'notice', LOGIN: 'login', WORKSPACE: 'workspace' };

const EASY_TABS = ['LIVE', 'MAP_POOL', 'COUNTDOWN', 'STATS'];
const PRO_TABS = ['LIVE', 'MAP_POOL', 'ROSTER', 'STATS', 'CASTERS', 'COUNTDOWN', 'HIGHLIGHT', 'VIDEO', 'TEAM_DB', 'COVER'];

const getConsolePresetMeta = (value, viewportW = 0) => {
  if (value === '1920x1080') return { label: '1080P', width: 1920, desc: 'Optimized for compact console layouts.', densityHint: 'compact' };
  if (value === '2560x1440') return { label: '2K', width: 2560, desc: 'Standard layout for desktop directing.', densityHint: 'standard' };
  if (value === '3840x2160') return { label: '4K', width: 3840, desc: 'Spacious layout for large monitor setups.', densityHint: 'spacious' };
  if (viewportW >= 3000) return { label: 'AUTO · 4K+', width: null, desc: 'Auto-adapting to high-res environments.', densityHint: 'spacious' };
  if (viewportW >= 2200) return { label: 'AUTO · 2K', width: null, desc: 'Auto-adapting to 2K environments.', densityHint: 'standard' };
  return { label: 'AUTO · 1080P', width: null, desc: 'Auto-adapting to 1080P environments.', densityHint: 'compact' };
};

// 🚀 优化：使用对象映射表替换长长的 if-else，代码更干净查找更块
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

function App() {
  const isOverlay = typeof window !== 'undefined' && window.location.hash === '#overlay';

  const { w, h, density, isDense, isUltra, isShort } = useViewport();
  const { matchData, matchDataRef, videoProgress, updateData } = useMatchState();
  const { history, setHistory, updateWithHistory, handleUndo } = useHistory(matchDataRef, updateData);
  const { previewScene, setPreviewScene, previewSceneRef, renderScene, isTransitioning, takeScene } = useSceneController(matchData, matchDataRef, updateData, setHistory);

  const [activeTab, setActiveTab] = useState('LIVE');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLogOpen, setIsLogOpen] = useState(true);

  const [appScreen, setAppScreen] = useState(APP_SCREENS.INTRO);
  const [consoleMode, setConsoleMode] = useState('easy'); 
  const [consoleResolution, setConsoleResolution] = useState('auto');

  // 🚀 优化：不再使用独立 state，直接从 matchData 派生，杜绝状态脱节
  const outputResolution = matchData.outputMode === '4K' ? '3840x2160' : '1920x1080';
  const [proAccessCode, setProAccessCode] = useState('');

  const [modalConfig, setModalConfig] = useState({ isOpen: false });
  const closeModal = () => setModalConfig({ isOpen: false });
  const showModal = config => setModalConfig({ ...config, isOpen: true });

  useKeyboardShortcuts({
    isUnlocked,
    presetModalTarget: null,
    setPresetModalTarget: () => {},
    takeScene,
    previewSceneRef,
    setActiveTab,
    handleUndo
  });

  const consolePresetMeta = useMemo(() => getConsolePresetMeta(consoleResolution, w), [consoleResolution, w]);
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
    LIVE: 'MATCH LIVE',
    TEAM_DB: 'TEAM DATABASE',
    MAP_POOL: 'MAP POOL',
    CASTERS: 'CASTERS',
    COUNTDOWN: 'COUNTDOWN',
    VIDEO: 'VIDEO PLAYER',
    HIGHLIGHT: 'HIGHLIGHTS',
    STATS: 'MATCH STATS',
    ROSTER: 'TEAM ROSTERS',
    WINNER: 'WINNER SCREEN',
    COVER: 'BROADCAST COVER',
  };

  // 🚀 优化：包裹 useMemo 防止每次 App 渲染都创建新对象导致下游画面全盘闪烁
  const silentMatchData = useMemo(() => ({
    ...matchData,
    autoBeginTrigger: 0,
    beginInfoVisible: false
  }), [matchData]);

  const renderMonitorScene = sceneKey =>
    renderSceneByKey(sceneKey, silentMatchData, sceneKey === 'LIVE' && sceneKey === renderScene);

  const renderPreviewMonitorScene = sceneKey =>
    renderSceneByKey(sceneKey, silentMatchData, false);

  const renderProgramMonitorScene = sceneKey =>
    renderSceneByKey(sceneKey, silentMatchData, sceneKey === 'LIVE');

  const syncOutputResolution = value => {
    updateData({ ...matchData, outputMode: value === '3840x2160' ? '4K' : '1080P' });
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
    showModal({ type: 'alert', title: 'ACCESS DENIED', message: 'Access Denied: Incorrect passcode.', isDanger: true });
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

  // 🚀 优化：加上 catch 处理，防止非 HTTPS 或浏览器权限拒绝导致应用崩溃
  const exportConfig = () => {
    navigator.clipboard.writeText(JSON.stringify(matchData))
      .then(() => showModal({ type: 'alert', title: 'EXPORT SUCCESS', message: 'All configurations successfully copied to clipboard.' }))
      .catch(err => showModal({ type: 'alert', title: 'EXPORT FAILED', message: 'Failed to copy to clipboard. Ensure you have clipboard permissions.', isDanger: true }));
  };

  const importConfig = () => {
    showModal({
      type: 'prompt',
      title: 'IMPORT CONFIG',
      message: 'Paste the full JSON configuration below:',
      onConfirm: data => {
        if (!data) return;
        try {
          updateData(JSON.parse(data));
          showModal({ type: 'alert', title: 'IMPORT SUCCESS', message: 'Configuration imported successfully!' });
        } catch (e) {
          showModal({ type: 'alert', title: 'IMPORT FAILED', message: 'Invalid JSON format. Import failed.', isDanger: true });
        }
      }
    });
  };

  const handleSwapTeams = () => {
    updateWithHistory('Swap Teams', {
      ...matchData,
      teamA: matchData.teamB,
      teamB: matchData.teamA,
      logoA: matchData.logoB,
      logoB: matchData.logoA,
      logoBgA: matchData.logoBgB,
      logoBgB: matchData.logoBgA,
      scoreA: matchData.scoreB,
      scoreB: matchData.scoreA,
      bansA: matchData.bansB,
      bansB: matchData.bansA,
      playersA: [...matchData.playersB],
      playersB: [...matchData.playersA],
      rosterPlayersA: [...(matchData.rosterPlayersB || [])],
      rosterPlayersB: [...(matchData.rosterPlayersA || [])],
      rosterStaffA: { ...(matchData.rosterStaffB || {}) },
      rosterStaffB: { ...(matchData.rosterStaffA || {}) },
      subIndexA: matchData.subIndexB,
      subIndexB: matchData.subIndexA,
      activeComms: matchData.activeComms === 'A' ? 'B' : matchData.activeComms === 'B' ? 'A' : null,
      statsTemplateData: {
        elimsA: matchData.statsTemplateData.elimsB,
        elimsB: matchData.statsTemplateData.elimsA,
        deathsA: matchData.statsTemplateData.deathsB,
        deathsB: matchData.statsTemplateData.deathsA,
        damageA: matchData.statsTemplateData.damageB,
        damageB: matchData.statsTemplateData.damageA,
        healingA: matchData.statsTemplateData.healingB,
        healingB: matchData.statsTemplateData.healingA
      }
    });
  };

  const handleReset = () => {
    showModal({
      type: 'confirm',
      title: 'NUCLEAR RESET',
      isDanger: true,
      message: 'WARNING: Are you sure you want to reset all scores, maps, casters, and rosters?\nThis will clear all temporary match data! (Global Team DB will not be affected)',
      onConfirm: () =>
        updateWithHistory('Nuclear Reset', {
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

  // 🚀 优化：缓存 Context Value，避免 App.jsx 内部小状态更新导致全组件强制重绘！
  const contextValue = useMemo(() => ({
    matchData,
    updateData,
    updateWithHistory,
    history,
    handleUndo,
    videoProgress,
    showModal,
    setPreviewScene
  }), [matchData, updateData, updateWithHistory, history, handleUndo, videoProgress, showModal, setPreviewScene]);

  return (
    <OBSProvider>
      <MatchContext.Provider value={contextValue}>
        {isOverlay ? (
          renderOverlayPage()
        ) : appScreen === APP_SCREENS.INTRO ? (
          <IntroSplashScreen
            duration={2200}
            onFinish={() => setAppScreen(APP_SCREENS.NOTICE)}
          />
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
            updateData={updateData}
            history={history}
            handleUndo={handleUndo}
            previewScene={previewScene}
            setPreviewScene={setPreviewScene}
            renderScene={renderScene}
            isTransitioning={isTransitioning}
            takeScene={takeScene}
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
          />
        )}

        {!isOverlay && <FriesModal config={modalConfig} onClose={closeModal} />}
      </MatchContext.Provider>
    </OBSProvider>
  );
}

export default App;