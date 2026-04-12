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
      // 🚀 优化 1：将 Escape 退出局部弹窗的判定放在最前面！
      // 防止被下方的 'fc-modal-open' 全局锁直接拦截导致 ESC 失效
      if (presetModalTarget && e.key === 'Escape') {
        setPresetModalTarget(null);
        return;
      }

      // 🚀 优化 2：如果有系统级全局弹窗打开，彻底封锁后续操作
      if (document.body.classList.contains('fc-modal-open')) return;

      const tag = e.target.tagName.toUpperCase();
      
      // 🚀 优化 3：放开所有可交互元素，避免在输入文字或按按钮时触发快捷键
      if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(tag)) return;

      // 空格 / 回车 触发 TAKE
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        // 增加容错，防止 previewSceneRef.current 为空
        if (previewSceneRef && previewSceneRef.current) {
          takeScene(previewSceneRef.current, '[快捷键] TAKE');
        }
        return;
      }

      // 支持 1-9 和 0 切换页面
      if (isUnlocked && ((e.key >= '1' && e.key <= '9') || e.key === '0')) {
        // 🚀 优化 4：严格对齐 ConsoleWorkspace 里的 OPTIMAL_TAB_ORDER
        const tabs = [
          'LIVE',       // 1
          'MAP_POOL',   // 2
          'ROSTER',     // 3
          'STATS',      // 4
          'CASTERS',    // 5
          'COUNTDOWN',  // 6
          'HIGHLIGHT',  // 7
          'VIDEO',      // 8
          'COVER',      // 9 (封面已提前)
          'TEAM_DB'     // 0 (数据已置后)
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