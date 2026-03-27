import { useEffect } from 'react';

export function useKeyboardShortcuts({
  isUnlocked,
  presetModalTarget,
  setPresetModalTarget,
  takeScene,
  previewSceneRef,
  setActiveTab,
  handleUndo
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 🚀 优化 1：如果有系统级弹窗打开，彻底封锁全局快捷键，防止误操作！
      if (document.body.classList.contains('fc-modal-open')) return;

      if (presetModalTarget && e.key === 'Escape') {
        setPresetModalTarget(null);
        return;
      }

      const tag = e.target.tagName.toUpperCase();
      
      // 🚀 优化 2：不仅放过输入框，还要放开按钮和链接！防止用户点完按钮按空格键引发的连环车祸
      if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(tag)) return;

      // 空格 / 回车 触发 TAKE
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        takeScene(previewSceneRef.current, '[快捷键] TAKE');
        return;
      }

      // 支持 1-9 和 0
      if (isUnlocked && ((e.key >= '1' && e.key <= '9') || e.key === '0')) {
        const tabs = [
          'LIVE',       // 1
          'MAP_POOL',   // 2
          'ROSTER',     // 3
          'STATS',      // 4
          'CASTERS',    // 5
          'COUNTDOWN',  // 6
          'HIGHLIGHT',  // 7
          'VIDEO',      // 8
          'TEAM_DB',    // 9
          'COVER'       // 0
        ];

        const targetTab = e.key === '0' ? tabs[9] : tabs[parseInt(e.key, 10) - 1];
        if (targetTab) setActiveTab(targetTab);
        return;
      }

      // Ctrl+Z / Cmd+Z 触发撤销
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isUnlocked, presetModalTarget, takeScene, previewSceneRef, setActiveTab, handleUndo, setPresetModalTarget]);
}