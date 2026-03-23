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
      }
      
      // 4. 🌟 核心优化：按人体工程学使用频率重排，支持 1-9 键
      if (e.key >= '1' && e.key <= '9' && isUnlocked) {
        const tabs = [
          'LIVE',       // 1. 赛中极高频
          'MAP_POOL',   // 2. 局间高频切换地图与比分
          'ROSTER',     // 3. 上场名单与替补轮换
          'STATS',      // 4. 赛后高阶数据结算
          'CASTERS',    // 5. 解说更新
          'COUNTDOWN',  // 6. 局间休息/暖场
          'HIGHLIGHT',  // 7. 高光回放
          'VIDEO',      // 8. 宣传片播放
          'TEAM_DB'     // 9. 全局战队库 (极低频，赛前配置)
        ];
        // 彻底移除了 WINNER，它不再是一个 Tab
        const targetTab = tabs[parseInt(e.key, 10) - 1];
        if (targetTab) setActiveTab(targetTab);
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