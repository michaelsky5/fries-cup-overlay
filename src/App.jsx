import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { MatchContext } from './contexts/MatchContext';
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

import PlayerSpotlightScene from './components/scenes/graphics/PlayerSpotlightScene';
import PlayerComparisonScene from './components/scenes/graphics/PlayerComparisonScene';
import TeamComparisonScene from './components/scenes/graphics/TeamComparisonScene';
import MapProfileScene from './components/scenes/graphics/MapProfileScene';
import LeaderboardScene from './components/scenes/graphics/LeaderboardScene';

import {
  getProgramRoomId,
  getProgramSyncServerUrl,
  publishProgramState,
  subscribeProgramState
} from './services/programSyncClient';

import { COLORS, getDensityTokens } from './constants/styles';
import { LOGO_LIST } from './constants/logos';
import { defaultData } from './constants/defaultData';

const APP_SCREENS = { INTRO: 'intro', NOTICE: 'notice', LOGIN: 'login', WORKSPACE: 'workspace' };

const EASY_TABS = ['LIVE', 'MAP_POOL', 'COUNTDOWN', 'STATS'];
const PRO_TABS = ['LIVE', 'MAP_POOL', 'ROSTER', 'STATS', 'DATA_GRAPHICS', 'CASTERS', 'COUNTDOWN', 'HIGHLIGHT', 'VIDEO', 'TEAM_DB', 'COVER'];

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const cloneValue = value => {
  try {
    if (typeof structuredClone === 'function') return structuredClone(value);
  } catch (err) {
    console.warn('[FCUP_APP] structuredClone failed, fallback to JSON clone.', err);
  }

  try {
    return JSON.parse(JSON.stringify(value));
  } catch (err) {
    console.warn('[FCUP_APP] JSON clone failed, fallback to raw value.', err);
    return value;
  }
};

const DEFAULT_BAN_ENTRY = 'damage/tbd';
const resetBanList = () => [DEFAULT_BAN_ENTRY];

const resetMapBans = map => ({
  ...map,
  bansA: resetBanList(),
  bansB: resetBanList(),
  banOrderMode: 'A_FIRST'
});

const parseSeriesCount = value => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;

  if (typeof value === 'string') {
    const matched = value.match(/\d+/);
    if (matched) return Number(matched[0]);
  }

  return null;
};

const getMapWinnerSide = map => {
  const value = String(map?.winner || map?.winnerSide || '').trim().toUpperCase();
  return value === 'A' || value === 'B' ? value : '';
};

const getExplicitProgramRoomId = () => {
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

const stripSceneFieldsFromPlainUpdate = input => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return input;

  const { globalScene, ...rest } = input;
  return rest;
};

const shouldAllowSceneChangeFromHistory = actionName => {
  const text = String(actionName || '').toUpperCase();

  return (
    text.includes('TAKE') ||
    text.includes('CUT') ||
    text.includes('BROADCAST') ||
    text.includes('AUTO-TAKE') ||
    text.includes('推送') ||
    text.includes('切入') ||
    text.includes('切换') ||
    text.includes('上墙')
  );
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
  COVER: BroadcastCoverScene,
  MVP_SCENE: PlayerSpotlightScene,
  H2H_SCENE: PlayerComparisonScene,
  TEAM_COMPARISON_SCENE: TeamComparisonScene,
  MAP_PROFILE_SCENE: MapProfileScene,
  LEADERBOARD_SCENE: LeaderboardScene
};

const renderSceneByKey = (sceneKey, matchData, isActive = false) => {
  const SceneComponent = SceneComponentMap[sceneKey] || MatchLiveHUD;
  return <SceneComponent matchData={matchData} isActive={isActive} />;
};

function MainApp() {
  const isOverlay = typeof window !== 'undefined' && window.location.hash.startsWith('#overlay');
  const { t } = useTranslation();

  const programRoomId = useMemo(() => getProgramRoomId(), []);
  const programSyncServerUrl = useMemo(() => getProgramSyncServerUrl(), []);
  const explicitProgramRoomId = useMemo(() => getExplicitProgramRoomId(), []);
  const hasBroadcastRoom = isOverlay || !!explicitProgramRoomId;

  const { w, h, density, isDense, isUltra, isShort } = useViewport();
  const { matchData, matchDataRef, videoProgress, updateData: originalUpdateData } = useMatchState();

  const {
    history,
    setHistory,
    updateWithHistory: originalUpdateWithHistory,
    handleUndo: originalHandleUndo
  } = useHistory(matchDataRef, originalUpdateData);

  const {
    previewScene,
    setPreviewScene,
    previewSceneRef,
    renderScene,
    isTransitioning,
    takeScene: originalTakeScene
  } = useSceneController(matchData, matchDataRef, originalUpdateData, setHistory);

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

  const closeModal = useCallback(() => setModalConfig({ isOpen: false }), []);
  const showModal = useCallback(config => setModalConfig({ ...config, isOpen: true }), []);

  const showRoomRequiredModal = useCallback(() => {
    showModal({
      type: 'alert',
      title: 'BROADCAST ROOM REQUIRED',
      message: '请先点击顶部 BROADCAST ROOM 创建本场导播房间，再进行 TAKE / 推送 / 上墙。这样可以避免多个导播互相覆盖。',
      isDanger: true
    });
  }, [showModal]);

  useEffect(() => {
    if (isOverlay || typeof document === 'undefined') return undefined;

    const muteMediaElement = media => {
      if (!media) return;

      media.muted = true;
      media.volume = 0;
      media.setAttribute('muted', '');
    };

    const muteAllMedia = () => {
      document.querySelectorAll('video, audio').forEach(muteMediaElement);
    };

    const handleMediaEvent = event => {
      const target = event.target;

      if (typeof HTMLMediaElement !== 'undefined' && target instanceof HTMLMediaElement) {
        muteMediaElement(target);
      }
    };

    muteAllMedia();

    const observer = typeof MutationObserver !== 'undefined'
      ? new MutationObserver(muteAllMedia)
      : null;

    if (observer) {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    document.addEventListener('play', handleMediaEvent, true);
    document.addEventListener('volumechange', handleMediaEvent, true);
    document.addEventListener('loadedmetadata', handleMediaEvent, true);

    return () => {
      if (observer) observer.disconnect();

      document.removeEventListener('play', handleMediaEvent, true);
      document.removeEventListener('volumechange', handleMediaEvent, true);
      document.removeEventListener('loadedmetadata', handleMediaEvent, true);
    };
  }, [isOverlay]);

  useEffect(() => {
    if (!isOverlay) return undefined;

    let lastProgramKey = '';

    const applyProgramPayload = remotePayload => {
      if (!remotePayload) return;

      const incomingScene =
        remotePayload.programScene ||
        remotePayload.globalScene ||
        remotePayload.matchData?.globalScene ||
        'LIVE';

      const key = [
        remotePayload.roomId || remotePayload.room || programRoomId,
        remotePayload.sequence || '',
        remotePayload.timestamp || '',
        incomingScene
      ].join(':');

      if (key && key === lastProgramKey) return;
      lastProgramKey = key;

      if (remotePayload.matchData) {
        originalUpdateData({
          ...remotePayload.matchData,
          globalScene: incomingScene
        });
        return;
      }

      originalUpdateData(prev => ({
        ...prev,
        globalScene: incomingScene
      }));
    };

    const cleanupProgramSync = subscribeProgramState(applyProgramPayload, {
      roomId: programRoomId,
      serverUrl: programSyncServerUrl
    });

    return () => {
      if (typeof cleanupProgramSync === 'function') cleanupProgramSync();
    };
  }, [
    isOverlay,
    programRoomId,
    programSyncServerUrl,
    originalUpdateData
  ]);

  const syncToOverlay = useCallback((newData, newScene) => {
    if (isOverlay || !hasBroadcastRoom) return;

    const baseData = newData || matchDataRef.current || matchData;
    const targetScene = newScene || baseData?.globalScene || matchDataRef.current?.globalScene || renderScene || 'LIVE';
    const payloadData = { ...baseData, globalScene: targetScene };

    const payload = {
      type: 'FCUP_PROGRAM_STATE',
      roomId: programRoomId,
      room: programRoomId,
      matchData: payloadData,
      globalScene: targetScene,
      programScene: targetScene,
      source: 'console',
      timestamp: Date.now()
    };

    publishProgramState(payload, {
      roomId: programRoomId,
      serverUrl: programSyncServerUrl
    }).catch(err => {
      console.warn('[FCUP_APP] publishProgramState failed.', err);
    });

  }, [
    isOverlay,
    hasBroadcastRoom,
    matchDataRef,
    matchData,
    renderScene,
    programRoomId,
    programSyncServerUrl,
  ]);

  const handleUpdateDataAndSync = useCallback(newData => {
    const baseData = matchDataRef.current || matchData;
    const resolvedInput = typeof newData === 'function' ? newData(baseData) : newData;

    const safeInput = stripSceneFieldsFromPlainUpdate(resolvedInput);
    const targetScene = baseData.globalScene || 'LIVE';
    const nextData = { ...baseData, ...(safeInput || {}), globalScene: targetScene };

    originalUpdateData(safeInput || {});
    syncToOverlay(nextData, targetScene);
  }, [matchDataRef, matchData, originalUpdateData, syncToOverlay]);

  const handleUpdateWithHistoryAndSync = useCallback((actionName, newData) => {
    const baseData = matchDataRef.current || matchData;
    const resolvedInput = typeof newData === 'function' ? newData(baseData) : newData;

    const allowSceneChange = shouldAllowSceneChangeFromHistory(actionName);
    const requestedSceneChange =
      allowSceneChange &&
      resolvedInput &&
      typeof resolvedInput === 'object' &&
      !Array.isArray(resolvedInput) &&
      resolvedInput.globalScene &&
      resolvedInput.globalScene !== baseData.globalScene;

    if (requestedSceneChange && !hasBroadcastRoom) {
      showRoomRequiredModal();

      const safeInput = stripSceneFieldsFromPlainUpdate(resolvedInput);
      const targetScene = baseData.globalScene || 'LIVE';
      const nextData = { ...baseData, ...(safeInput || {}), globalScene: targetScene };

      originalUpdateWithHistory(actionName, safeInput || {});
      syncToOverlay(nextData, targetScene);
      return;
    }

    const safeInput = allowSceneChange
      ? resolvedInput
      : stripSceneFieldsFromPlainUpdate(resolvedInput);

    const targetScene = allowSceneChange
      ? (safeInput?.globalScene || baseData.globalScene || 'LIVE')
      : (baseData.globalScene || 'LIVE');

    const nextData = { ...baseData, ...(safeInput || {}), globalScene: targetScene };

    originalUpdateWithHistory(actionName, safeInput || {});
    syncToOverlay(nextData, targetScene);
  }, [
    matchDataRef,
    matchData,
    hasBroadcastRoom,
    showRoomRequiredModal,
    originalUpdateWithHistory,
    syncToOverlay
  ]);

  const handleTakeSceneAndSync = useCallback(targetScene => {
    if (!targetScene) return;

    if (!hasBroadcastRoom) {
      showRoomRequiredModal();
      return;
    }

    const baseData = matchDataRef.current || matchData;
    const shouldAutoBegin = targetScene === 'LIVE' && !!baseData.beginInfoEnabled;

    const nextData = {
      ...baseData,
      globalScene: targetScene,
      autoBeginPendingAt: shouldAutoBegin ? Date.now() : 0
    };

    originalTakeScene(targetScene);
    syncToOverlay(nextData, targetScene);
  }, [
    hasBroadcastRoom,
    showRoomRequiredModal,
    matchDataRef,
    matchData,
    originalTakeScene,
    syncToOverlay
  ]);

  const handleUndoAndSync = useCallback(() => {
    originalHandleUndo();

    setTimeout(() => {
      const currentData = matchDataRef.current || matchData;
      syncToOverlay(currentData, currentData?.globalScene || 'LIVE');
    }, 50);
  }, [originalHandleUndo, syncToOverlay, matchDataRef, matchData]);

  const getSeriesMapTotal = useCallback(() => {
    const lineupLen = Array.isArray(matchData.mapLineup) ? matchData.mapLineup.length : 0;
    if (lineupLen > 0) return lineupLen;

    return parseSeriesCount(matchData.bestOf) ||
      parseSeriesCount(matchData.seriesLength) ||
      parseSeriesCount(matchData.totalMaps) ||
      5;
  }, [matchData.mapLineup, matchData.bestOf, matchData.seriesLength, matchData.totalMaps]);

  const getCurrentMapIndex = useCallback(total => {
    return clamp((Number(matchData.currentMap) || 1) - 1, 0, Math.max(0, total - 1));
  }, [matchData.currentMap]);

  const recountScoreFromMapLineup = useCallback(lineup => ({
    scoreA: lineup.filter(map => getMapWinnerSide(map) === 'A').length,
    scoreB: lineup.filter(map => getMapWinnerSide(map) === 'B').length
  }), []);

  const updateCurrentMapWinner = useCallback(winner => {
    const lineup = Array.isArray(matchData.mapLineup)
      ? matchData.mapLineup.map(map => ({ ...map }))
      : [];

    if (!lineup.length) {
      handleUpdateWithHistoryAndSync(
        winner === 'A' ? t('history.teamAPlus') : t('history.teamBPlus'),
        {
          ...matchData,
          scoreA: winner === 'A' ? (matchData.scoreA || 0) + 1 : matchData.scoreA || 0,
          scoreB: winner === 'B' ? (matchData.scoreB || 0) + 1 : matchData.scoreB || 0,
          winner,
          winnerSide: winner,
          winnerScene: {
            ...(matchData.winnerScene || {}),
            winner
          }
        }
      );
      return;
    }

    const idx = getCurrentMapIndex(lineup.length);

    lineup[idx] = {
      ...lineup[idx],
      winner,
      winnerSide: winner
    };

    const nextScore = recountScoreFromMapLineup(lineup);

    handleUpdateWithHistoryAndSync(t('history.setMapWinner', { map: idx + 1, winner }), {
      ...matchData,
      ...nextScore,
      winner,
      winnerSide: winner,
      winnerScene: {
        ...(matchData.winnerScene || {}),
        winner
      },
      mapLineup: lineup
    });
  }, [
    matchData,
    handleUpdateWithHistoryAndSync,
    t,
    getCurrentMapIndex,
    recountScoreFromMapLineup
  ]);

  const clearCurrentMapWinner = useCallback(() => {
    const lineup = Array.isArray(matchData.mapLineup)
      ? matchData.mapLineup.map(map => ({ ...map }))
      : [];

    if (!lineup.length) return;

    const idx = getCurrentMapIndex(lineup.length);

    lineup[idx] = {
      ...lineup[idx],
      winner: '',
      winnerSide: ''
    };

    const nextScore = recountScoreFromMapLineup(lineup);

    handleUpdateWithHistoryAndSync(t('history.clearMapWinner', { map: idx + 1 }), {
      ...matchData,
      ...nextScore,
      winner: '',
      winnerSide: '',
      mapLineup: lineup
    });
  }, [
    matchData,
    getCurrentMapIndex,
    recountScoreFromMapLineup,
    handleUpdateWithHistoryAndSync,
    t
  ]);

  const handleScoreAUp = useCallback(() => {
    handleUpdateWithHistoryAndSync(t('history.teamAPlus'), {
      ...matchData,
      scoreA: (matchData.scoreA || 0) + 1
    });
  }, [handleUpdateWithHistoryAndSync, matchData, t]);

  const handleScoreADown = useCallback(() => {
    handleUpdateWithHistoryAndSync(t('history.teamAMinus'), {
      ...matchData,
      scoreA: Math.max(0, (matchData.scoreA || 0) - 1)
    });
  }, [handleUpdateWithHistoryAndSync, matchData, t]);

  const handleScoreBUp = useCallback(() => {
    handleUpdateWithHistoryAndSync(t('history.teamBPlus'), {
      ...matchData,
      scoreB: (matchData.scoreB || 0) + 1
    });
  }, [handleUpdateWithHistoryAndSync, matchData, t]);

  const handleScoreBDown = useCallback(() => {
    handleUpdateWithHistoryAndSync(t('history.teamBMinus'), {
      ...matchData,
      scoreB: Math.max(0, (matchData.scoreB || 0) - 1)
    });
  }, [handleUpdateWithHistoryAndSync, matchData, t]);

  const setWinnerA = useCallback(() => updateCurrentMapWinner('A'), [updateCurrentMapWinner]);
  const setWinnerB = useCallback(() => updateCurrentMapWinner('B'), [updateCurrentMapWinner]);
  const clearWinner = useCallback(() => clearCurrentMapWinner(), [clearCurrentMapWinner]);

  const nextMap = useCallback(() => {
    const total = getSeriesMapTotal();
    const current = Number(matchData.currentMap) || 1;

    handleUpdateWithHistoryAndSync(t('history.nextMap'), {
      ...matchData,
      currentMap: clamp(current + 1, 1, total)
    });
  }, [getSeriesMapTotal, matchData, handleUpdateWithHistoryAndSync, t]);

  const prevMap = useCallback(() => {
    const total = getSeriesMapTotal();
    const current = Number(matchData.currentMap) || 1;

    handleUpdateWithHistoryAndSync(t('history.previousMap'), {
      ...matchData,
      currentMap: clamp(current - 1, 1, total)
    });
  }, [getSeriesMapTotal, matchData, handleUpdateWithHistoryAndSync, t]);

  const resetSeriesScore = useCallback(() => {
    const lineup = Array.isArray(matchData.mapLineup)
      ? matchData.mapLineup.map(map => ({ ...map, winner: '', winnerSide: '' }))
      : [];

    handleUpdateWithHistoryAndSync(t('history.resetSeriesScore'), {
      ...matchData,
      currentMap: 1,
      scoreA: 0,
      scoreB: 0,
      winner: '',
      winnerSide: '',
      mapLineup: lineup
    });
  }, [matchData, handleUpdateWithHistoryAndSync, t]);

  const toggleTicker = useCallback(() => {
    handleUpdateDataAndSync({
      ...matchData,
      showTicker: !matchData.showTicker
    });
  }, [handleUpdateDataAndSync, matchData]);

  const toggleNames = useCallback(() => {
    handleUpdateDataAndSync({
      ...matchData,
      showPlayers: !matchData.showPlayers
    });
  }, [handleUpdateDataAndSync, matchData]);

  const toggleBans = useCallback(() => {
    handleUpdateWithHistoryAndSync(
      matchData.showBans ? t('history.disableBanMode') : t('history.enableBanMode'),
      {
        ...matchData,
        showBans: !matchData.showBans,
        showBanPhase: !matchData.showBans ? matchData.showBanPhase : false
      }
    );
  }, [handleUpdateWithHistoryAndSync, matchData, t]);

  const toggleVoice = useCallback(() => {
    const next = matchData.activeComms === 'A'
      ? 'B'
      : matchData.activeComms === 'B'
        ? null
        : 'A';

    handleUpdateDataAndSync({
      ...matchData,
      activeComms: next
    });
  }, [handleUpdateDataAndSync, matchData]);

  const voiceToA = useCallback(() => {
    handleUpdateDataAndSync({
      ...matchData,
      activeComms: 'A'
    });
  }, [handleUpdateDataAndSync, matchData]);

  const voiceToB = useCallback(() => {
    handleUpdateDataAndSync({
      ...matchData,
      activeComms: 'B'
    });
  }, [handleUpdateDataAndSync, matchData]);

  const voiceOff = useCallback(() => {
    handleUpdateDataAndSync({
      ...matchData,
      activeComms: null
    });
  }, [handleUpdateDataAndSync, matchData]);

  const toggleAutoBegin = useCallback(() => {
    const nextEnabled = !matchData.beginInfoEnabled;

    handleUpdateWithHistoryAndSync(
      nextEnabled ? t('history.autoBeginOn') : t('history.autoBeginOff'),
      {
        ...matchData,
        beginInfoEnabled: nextEnabled,
        beginInfoVisible: false,
        autoBeginPendingAt: 0,
        beginInfoTriggerAt: matchData.beginInfoTriggerAt || 0
      }
    );
  }, [matchData, handleUpdateWithHistoryAndSync, t]);

  const hudOn = useCallback(() => {
    handleUpdateWithHistoryAndSync(t('history.hudOn'), {
      ...matchData,
      showTicker: true,
      showPlayers: true,
      showBans: true
    });
  }, [handleUpdateWithHistoryAndSync, matchData, t]);

  const hudOff = useCallback(() => {
    handleUpdateWithHistoryAndSync(t('history.hudOff'), {
      ...matchData,
      showTicker: false,
      showPlayers: false,
      showBans: false,
      showBanPhase: false
    });
  }, [handleUpdateWithHistoryAndSync, matchData, t]);

  const toggleProModeLock = useCallback(() => setIsUnlocked(prev => !prev), []);

  const handleSwapTeams = useCallback(() => {
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
    const swappedWinner = matchData.winner === 'A'
      ? 'B'
      : matchData.winner === 'B'
        ? 'A'
        : matchData.winner || '';

    const swappedWinnerSide = matchData.winnerSide === 'A'
      ? 'B'
      : matchData.winnerSide === 'B'
        ? 'A'
        : matchData.winnerSide || '';

    handleUpdateWithHistoryAndSync(t('history.swapTeams'), {
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
      rosterPlayersA: cloneValue(matchData.rosterPlayersB || []),
      rosterPlayersB: cloneValue(matchData.rosterPlayersA || []),
      rosterStaffA: cloneValue(matchData.rosterStaffB || {}),
      rosterStaffB: cloneValue(matchData.rosterStaffA || {}),
      winner: swappedWinner,
      winnerSide: swappedWinnerSide,
      winnerScene: {
        ...(matchData.winnerScene || {}),
        winner: matchData.winnerScene?.winner === 'A'
          ? 'B'
          : matchData.winnerScene?.winner === 'B'
            ? 'A'
            : matchData.winnerScene?.winner || swappedWinner
      },
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
  }, [matchData, handleUpdateWithHistoryAndSync, t]);

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

  const sceneLabelMap = useMemo(() => ({
    LIVE: t('scenes.LIVE'),
    TEAM_DB: t('scenes.TEAM_DB'),
    MAP_POOL: t('scenes.MAP_POOL'),
    CASTERS: t('scenes.CASTERS'),
    COUNTDOWN: t('scenes.COUNTDOWN'),
    VIDEO: t('scenes.VIDEO'),
    HIGHLIGHT: t('scenes.HIGHLIGHT'),
    STATS: t('scenes.STATS'),
    ROSTER: t('scenes.ROSTER'),
    DATA_GRAPHICS: t('scenes.DATA_GRAPHICS'),
    WINNER: t('scenes.WINNER'),
    COVER: t('scenes.COVER'),
    MVP_SCENE: t('scenes.MVP_SCENE'),
    H2H_SCENE: t('scenes.H2H_SCENE'),
    TEAM_COMPARISON_SCENE: t('scenes.TEAM_COMPARISON_SCENE'),
    MAP_PROFILE_SCENE: t('scenes.MAP_PROFILE_SCENE'),
    LEADERBOARD_SCENE: t('scenes.LEADERBOARD_SCENE')
  }), [t]);

  const silentMatchData = useMemo(() => ({
    ...matchData,
    videoMuted: true,
    highlightMuted: true,
    autoBeginTrigger: 0,
    beginInfoVisible: false,
    autoBeginPendingAt: 0,
    beginInfoTriggerAt: 0
  }), [matchData]);

  const renderMonitorScene = useCallback(sceneKey => renderSceneByKey(
    sceneKey,
    silentMatchData,
    sceneKey === 'LIVE' && sceneKey === renderScene
  ), [silentMatchData, renderScene]);

  const renderPreviewMonitorScene = useCallback(sceneKey => renderSceneByKey(
    sceneKey,
    silentMatchData,
    false
  ), [silentMatchData]);

  const renderProgramMonitorScene = useCallback(() => {
    const programScene = matchData.globalScene || 'LIVE';
    return renderSceneByKey(programScene, silentMatchData, programScene === 'LIVE');
  }, [matchData.globalScene, silentMatchData]);

  const syncOutputResolution = useCallback(value => {
    handleUpdateDataAndSync({
      ...matchData,
      outputMode: value === '3840x2160' ? '4K' : '1080P'
    });
  }, [handleUpdateDataAndSync, matchData]);

  const enterEasyMode = useCallback(() => {
    setConsoleMode('easy');
    setIsUnlocked(false);
    setActiveTab('LIVE');
    setAppScreen(APP_SCREENS.WORKSPACE);
  }, []);

  const enterProMode = useCallback(() => {
    const answer = String(proAccessCode || '').trim().toLowerCase();

    if (answer === '42' || answer === 'fries') {
      setConsoleMode('pro');
      setIsUnlocked(true);
      setAppScreen(APP_SCREENS.WORKSPACE);
      setProAccessCode('');
      return;
    }

    showModal({
      type: 'alert',
      title: t('modals.accessDenied.title'),
      message: t('modals.accessDenied.message'),
      isDanger: true
    });
  }, [proAccessCode, showModal, t]);

  const handleUnlock = useCallback(() => {
    if (isUnlocked) {
      setIsUnlocked(false);
      setConsoleMode('easy');
      setActiveTab('LIVE');
      setAppScreen(APP_SCREENS.LOGIN);
      return;
    }

    setAppScreen(APP_SCREENS.LOGIN);
  }, [isUnlocked]);

  const exportConfig = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify(matchData))
      .then(() => showModal({
        type: 'alert',
        title: t('modals.exportSuccess.title'),
        message: t('modals.exportSuccess.message')
      }))
      .catch(() => showModal({
        type: 'alert',
        title: t('modals.exportFailed.title'),
        message: t('modals.exportFailed.message'),
        isDanger: true
      }));
  }, [matchData, showModal, t]);

  const importConfig = useCallback(() => {
    showModal({
      type: 'prompt',
      title: t('modals.importConfig.title'),
      message: t('modals.importConfig.message'),
      onConfirm: data => {
        if (!data) return;

        try {
          const parsed = JSON.parse(data);
          handleUpdateDataAndSync(parsed);

          showModal({
            type: 'alert',
            title: t('modals.importSuccess.title'),
            message: t('modals.importSuccess.message')
          });
        } catch (e) {
          showModal({
            type: 'alert',
            title: t('modals.importFailed.title'),
            message: t('modals.importFailed.message'),
            isDanger: true
          });
        }
      }
    });
  }, [showModal, t, handleUpdateDataAndSync]);

  const handleReset = useCallback(() => {
    const defaultLogoPath = LOGO_LIST[0]?.path || defaultData.logoA || '/assets/logos/OW.png';

    showModal({
      type: 'confirm',
      title: t('modals.nuclearReset.title'),
      isDanger: true,
      message: t('modals.nuclearReset.message'),
      onConfirm: () =>
        handleUpdateWithHistoryAndSync(t('history.nuclearReset'), {
          ...matchData,

          currentMap: defaultData.currentMap,
          showBans: defaultData.showBans,
          showPlayers: defaultData.showPlayers,
          showTicker: false,
          showBanPhase: false,
          beginInfoEnabled: defaultData.beginInfoEnabled,
          beginInfoVisible: false,
          beginInfoTriggerAt: 0,
          autoBeginPendingAt: 0,

          scoreA: 0,
          scoreB: 0,
          winner: defaultData.winner || 'A',
          winnerSide: defaultData.winnerSide || 'A',
          winnerScene: cloneValue(defaultData.winnerScene),

          subIndexA: null,
          subIndexB: null,
          activeComms: null,

          teamA: defaultData.teamA,
          teamB: defaultData.teamB,
          teamShortA: defaultData.teamShortA || '',
          teamShortB: defaultData.teamShortB || '',

          casters: cloneValue(defaultData.casters),
          staffTitle: defaultData.staffTitle,
          staffSubtitle: defaultData.staffSubtitle,
          staffMembers: cloneValue(defaultData.staffMembers),

          logoA: defaultLogoPath,
          logoB: defaultLogoPath,
          logoBgA: COLORS.mainDark,
          logoBgB: COLORS.mainDark,

          bansA: resetBanList(),
          bansB: resetBanList(),
          banOrderMode: 'A_FIRST',

          playersA: cloneValue(defaultData.playersA),
          playersB: cloneValue(defaultData.playersB),
          rosterTeamTarget: defaultData.rosterTeamTarget,
          liveRosterTeam: defaultData.liveRosterTeam,
          rosterPlayersA: cloneValue(defaultData.rosterPlayersA),
          rosterPlayersB: cloneValue(defaultData.rosterPlayersB),
          rosterStaffA: cloneValue(defaultData.rosterStaffA),
          rosterStaffB: cloneValue(defaultData.rosterStaffB),

          statsMode: defaultData.statsMode,
          statsTheme: defaultData.statsTheme,
          statsImagePath: defaultData.statsImagePath,
          statsImageTempUrl: '',
          statsTemplateVisibility: cloneValue(defaultData.statsTemplateVisibility),
          statsTemplateData: cloneValue(defaultData.statsTemplateData),

          mapPoolDisplayMode: defaultData.mapPoolDisplayMode,
          showOverviewCurrent: defaultData.showOverviewCurrent,
          mapLineup: Array.isArray(defaultData.mapLineup)
            ? defaultData.mapLineup.map(resetMapBans)
            : [],
          eventMapPool: cloneValue(defaultData.eventMapPool),
          enabledMapTypes: cloneValue(defaultData.enabledMapTypes)
        })
    });
  }, [showModal, t, handleUpdateWithHistoryAndSync, matchData]);

  const renderOverlayPage = () => {
    const is4K = matchData.outputMode === '4K';
    const outW = is4K ? 3840 : 1920;
    const outH = is4K ? 2160 : 1080;
    const scale = is4K ? 2 : 1;
    const programScene = matchData.globalScene || 'LIVE';

    return (
      <div style={{ width: `${outW}px`, height: `${outH}px`, position: 'relative', overflow: 'hidden', background: 'transparent' }}>
        <div style={{ width: '1920px', height: '1080px', position: 'absolute', left: 0, top: 0, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          {renderSceneByKey(programScene, matchData, programScene === 'LIVE')}
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
    setPreviewScene,
    takeScene: handleTakeSceneAndSync,
    programRoomId,
    programSyncServerUrl
  }), [
    matchData,
    handleUpdateDataAndSync,
    handleUpdateWithHistoryAndSync,
    history,
    handleUndoAndSync,
    videoProgress,
    showModal,
    setPreviewScene,
    handleTakeSceneAndSync,
    programRoomId,
    programSyncServerUrl
  ]);

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
  return <MainApp />;
}