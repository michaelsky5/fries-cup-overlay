import { useEffect } from 'react';
import { DEFAULT_SHORTCUTS } from '../components/controls/ShortcutSettingsModal';

function isEditableTarget(target) {
  if (!target) return false;
  const tag = target.tagName?.toUpperCase?.() || '';
  if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(tag)) return true;
  return Boolean(target.isContentEditable);
}

function matchShortcut(e, config) {
  if (!config?.code) return false;
  const isCtrl = e.ctrlKey || e.metaKey; // 完美兼容 Mac 的 Cmd 键
  return (
    e.code === config.code &&
    e.altKey === !!config.altKey &&
    isCtrl === !!config.ctrlKey &&
    e.shiftKey === !!config.shiftKey
  );
}

export function useKeyboardShortcuts({
  isUnlocked,
  presetModalTarget,
  setPresetModalTarget,
  takeScene,
  previewSceneRef,
  setPreviewScene, // 【新增】引入这个，用于傻瓜模式下的状态同步
  setActiveTab,
  handleUndo,

  // 比赛数据与快捷键自定义
  matchData,

  // 基础比赛操作
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

  // HUD / 包装 / 系统控制
  toggleTicker,
  toggleNames,
  toggleBans,
  toggleVoice,
  toggleAutoBegin,
  toggleProModeLock,
  setShortcutSettingsOpen,
  hudOn,
  hudOff,
  voiceToA,
  voiceToB,
  voiceOff
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 1. 局部弹窗优先退出
      if (presetModalTarget && e.key === 'Escape') {
        setPresetModalTarget?.(null);
        return;
      }

      // 2. 任意系统级弹窗打开时，封锁全局快捷键
      if (document.body.classList.contains('fc-modal-open')) return;

      // 3. 在可编辑区域内不触发快捷键
      if (isEditableTarget(e.target)) return;

      // 4. 无修饰键的 1-9 / 0 切换顶部 Tab
      if (
        isUnlocked &&
        ((e.key >= '1' && e.key <= '9') || e.key === '0') &&
        !e.altKey &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey
      ) {
        const tabs = [
          'LIVE',
          'MAP_POOL',
          'ROSTER',
          'STATS',
          'CASTERS',
          'COUNTDOWN',
          'HIGHLIGHT',
          'VIDEO',
          'COVER',
          'TEAM_DB'
        ];
        const targetTab = e.key === '0' ? tabs[9] : tabs[parseInt(e.key, 10) - 1];
        
        if (targetTab) {
          e.preventDefault();
          setActiveTab?.(targetTab);
          
          // 【修复】：对齐鼠标点击逻辑。如果在 Easy Mode，快捷键切 Tab 也要自动上墙
          if (!isUnlocked) {
            setPreviewScene?.(targetTab);
            takeScene?.(targetTab, `[AUTO-TAKE] Shortcut ${e.key}`);
          }
        }
        return;
      }

      // 5. 动态读取当前快捷键配置
      const currentShortcuts = {
        ...DEFAULT_SHORTCUTS,
        ...(matchData?.shortcuts || {})
      };

      const safeTakeScene = (sceneId, logText) => {
        if (!takeScene) return;
        takeScene(sceneId, logText);
      };

      // 6. 动作映射表
      const actionMap = {
        // =========================
        // 全局与控制
        // =========================
        TAKE: () => {
          const scene = previewSceneRef?.current;
          if (!scene || !takeScene) return;
          takeScene(scene, '[快捷键] TAKE');
        },
        SWAP_TEAMS: () => handleSwapTeams?.(),
        UNDO: () => handleUndo?.(),
        TOGGLE_LOCK: () => toggleProModeLock?.(),
        OPEN_SHORTCUTS: () => setShortcutSettingsOpen?.(true),

        // =========================
        // 计分与判胜
        // =========================
        SCORE_A_UP: () => handleScoreAUp?.(),
        SCORE_A_DOWN: () => handleScoreADown?.(),
        SCORE_B_UP: () => handleScoreBUp?.(),
        SCORE_B_DOWN: () => handleScoreBDown?.(),
        SET_WINNER_A: () => setWinnerA?.(),
        SET_WINNER_B: () => setWinnerB?.(),
        CLEAR_WINNER: () => clearWinner?.(),

        // =========================
        // 对局流程
        // =========================
        NEXT_MAP: () => nextMap?.(),
        PREV_MAP: () => prevMap?.(),
        RESET_SERIES_SCORE: () => resetSeriesScore?.(),
        TOGGLE_AUTO_BEGIN: () => toggleAutoBegin?.(),

        // =========================
        // 视觉与包装
        // =========================
        TOGGLE_TICKER: () => toggleTicker?.(),
        TOGGLE_NAMES: () => toggleNames?.(),
        TOGGLE_BANS: () => toggleBans?.(),
        TOGGLE_VOICE: () => toggleVoice?.(),
        HUD_ON: () => hudOn?.(),
        HUD_OFF: () => hudOff?.(),
        VOICE_TO_A: () => voiceToA?.(),
        VOICE_TO_B: () => voiceToB?.(),
        VOICE_OFF: () => voiceOff?.(),

        // =========================
        // 画面盲切
        // =========================
        DIRECT_CUT_LIVE: () => safeTakeScene('LIVE', '[快捷键] 硬切 LIVE'),
        DIRECT_CUT_CASTER: () => safeTakeScene('CASTERS', '[快捷键] 硬切 解说席'),
        DIRECT_CUT_MAP_POOL: () => safeTakeScene('MAP_POOL', '[快捷键] 硬切 地图池'),
        DIRECT_CUT_ROSTER: () => safeTakeScene('ROSTER', '[快捷键] 硬切 首发名单'),
        DIRECT_CUT_STATS: () => safeTakeScene('STATS', '[快捷键] 硬切 赛后数据'),
        DIRECT_CUT_COUNTDOWN: () => safeTakeScene('COUNTDOWN', '[快捷键] 硬切 倒计时'),
        DIRECT_CUT_HIGHLIGHT: () => safeTakeScene('HIGHLIGHT', '[快捷键] 硬切 精彩回放'),
        DIRECT_CUT_VIDEO: () => safeTakeScene('VIDEO', '[快捷键] 硬切 视频播放'),
        DIRECT_CUT_COVER: () => safeTakeScene('COVER', '[快捷键] 硬切 封面画面'),
        DIRECT_CUT_WINNER: () => safeTakeScene('WINNER', '[快捷键] 硬切 获胜图板'),

        // =========================
        // 组合动作
        // =========================
        SET_WINNER_A_AND_CUT: () => {
          setWinnerA?.();
          safeTakeScene('WINNER', '[快捷键] A队获胜并切获胜图板');
        },
        SET_WINNER_B_AND_CUT: () => {
          setWinnerB?.();
          safeTakeScene('WINNER', '[快捷键] B队获胜并切获胜图板');
        }
      };

      // 7. 逐个匹配当前快捷键
      for (const [actionId, config] of Object.entries(currentShortcuts)) {
        if (!matchShortcut(e, config)) continue;

        e.preventDefault();
        const actionFunc = actionMap[actionId];
        if (actionFunc) actionFunc();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isUnlocked,
    presetModalTarget,
    setPresetModalTarget,
    takeScene,
    previewSceneRef,
    setPreviewScene, // 【新增依赖】
    setActiveTab,
    handleUndo,
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
    setShortcutSettingsOpen,
    hudOn,
    hudOff,
    voiceToA,
    voiceToB,
    voiceOff
  ]);
}