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
      // 1. 如果打开了预设弹窗，按 Esc 关闭
      if (presetModalTarget && e.key === 'Escape') {
        setPresetModalTarget(null);
        return;
      }

      // 2. 如果焦点在输入框里，无视所有快捷键
      const tag = e.target.tagName.toUpperCase();
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      // 3. 空格 / 回车 触发 TAKE
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        takeScene(previewSceneRef.current, '[快捷键] TAKE');
        return;
      }

      // 4. 支持 1-9 和 0
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

      // 5. Ctrl+Z / Cmd+Z 触发撤销
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isUnlocked, presetModalTarget, takeScene, previewSceneRef, setActiveTab, handleUndo, setPresetModalTarget]);
}