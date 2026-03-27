import { useState, useEffect, useRef, useCallback } from 'react';

export function useSceneController(matchData, matchDataRef, updateData, setHistory) {
  const [previewScene, setPreviewScene] = useState('LIVE');
  const [renderScene, setRenderScene] = useState(matchData.globalScene || 'LIVE');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const previewSceneRef = useRef(previewScene);
  const isTransitioningRef = useRef(isTransitioning);
  const pendingAutoBeginRef = useRef(false);

  useEffect(() => {
    previewSceneRef.current = previewScene;
  }, [previewScene]);

  useEffect(() => {
    isTransitioningRef.current = isTransitioning;
  }, [isTransitioning]);

  // 1. 场景转场控制 (Stinger Transition)
  useEffect(() => {
    if (matchData.globalScene === renderScene) return;

    setIsTransitioning(true);

    const t1 = setTimeout(() => {
      setRenderScene(matchData.globalScene);
    }, 450);

    const t2 = setTimeout(() => {
      setIsTransitioning(false);
    }, 1000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchData.globalScene]);

  // 2. 自动触发 Begin Info 逻辑
  useEffect(() => {
    if (!pendingAutoBeginRef.current || renderScene !== 'LIVE' || isTransitioning) return;

    pendingAutoBeginRef.current = false;

    const t = setTimeout(() => {
      updateData({
        ...matchDataRef.current,
        beginInfoTriggerAt: Date.now(),
        autoBeginPendingAt: 0
      });
    }, 50);

    return () => clearTimeout(t);
  }, [renderScene, isTransitioning, updateData, matchDataRef]);

  // 3. 核心切换动作
  const takeScene = useCallback((nextScene, actionLabel = 'TAKE') => {
    const md = matchDataRef.current;

    if (!nextScene || md.globalScene === nextScene || isTransitioningRef.current) {
      console.warn(`[TAKE Blocked] Target: ${nextScene}, Current: ${md.globalScene}, Locked: ${isTransitioningRef.current}`);
      return;
    }

    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
    const shouldAutoBegin = nextScene === 'LIVE' && !!md.beginInfoEnabled;

    const nextData = {
      ...md,
      globalScene: nextScene,
      autoBeginPendingAt: shouldAutoBegin ? Date.now() : 0
    };

    pendingAutoBeginRef.current = shouldAutoBegin;

    // 🚀 核心修复：记录切换【前】的状态 (md)，而不是 nextData，否则无法 Undo！
    setHistory(prev => {
      const newHistory = [
        { time: timeStr, action: `${actionLabel} ➔ ${nextScene}`, data: md },
        ...prev
      ].slice(0, 20);
      return newHistory;
    });

    updateData(nextData);
  }, [matchDataRef, setHistory, updateData]);

  return {
    previewScene,
    setPreviewScene,
    previewSceneRef,
    renderScene,
    isTransitioning,
    takeScene
  };
}