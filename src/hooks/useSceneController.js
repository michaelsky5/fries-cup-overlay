import { useState, useEffect, useRef, useCallback } from 'react';

const TRANSITION_SWAP_MS = 450;
const TRANSITION_END_MS = 1000;

const cloneData = data => {
  try {
    if (typeof structuredClone === 'function') return structuredClone(data);
  } catch (err) {
    console.warn('[FCUP_SCENE] structuredClone failed, fallback to JSON clone.', err);
  }

  try {
    return JSON.parse(JSON.stringify(data));
  } catch (err) {
    console.warn('[FCUP_SCENE] JSON clone failed, fallback to raw data.', err);
    return data;
  }
};

export function useSceneController(matchData, matchDataRef, updateData, setHistory) {
  const initialScene = matchData?.globalScene || 'LIVE';

  const [previewScene, setPreviewScene] = useState(initialScene);
  const [renderScene, setRenderScene] = useState(initialScene);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const previewSceneRef = useRef(previewScene);
  const renderSceneRef = useRef(renderScene);
  const isTransitioningRef = useRef(isTransitioning);
  const pendingAutoBeginRef = useRef(false);

  useEffect(() => {
    previewSceneRef.current = previewScene;
  }, [previewScene]);

  useEffect(() => {
    renderSceneRef.current = renderScene;
  }, [renderScene]);

  useEffect(() => {
    isTransitioningRef.current = isTransitioning;
  }, [isTransitioning]);

  // 1. 场景转场控制 / Stinger Transition
  useEffect(() => {
    const targetScene = matchData?.globalScene || 'LIVE';

    if (targetScene === renderSceneRef.current) return;

    setIsTransitioning(true);

    const t1 = setTimeout(() => {
      setRenderScene(targetScene);
      renderSceneRef.current = targetScene;
    }, TRANSITION_SWAP_MS);

    const t2 = setTimeout(() => {
      setIsTransitioning(false);
      isTransitioningRef.current = false;
    }, TRANSITION_END_MS);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [matchData?.globalScene]);

  // 2. 自动触发 Begin Info 逻辑
  useEffect(() => {
    if (!pendingAutoBeginRef.current || renderScene !== 'LIVE' || isTransitioning) return;

    pendingAutoBeginRef.current = false;

    const t = setTimeout(() => {
      updateData(prev => ({
        ...prev,
        beginInfoTriggerAt: Date.now(),
        autoBeginPendingAt: 0
      }));
    }, 50);

    return () => clearTimeout(t);
  }, [renderScene, isTransitioning, updateData]);

  // 3. 核心切换动作
  const takeScene = useCallback((nextScene, actionLabel = 'TAKE') => {
    const md = matchDataRef.current || {};
    const currentScene = md.globalScene || 'LIVE';

    if (!nextScene || currentScene === nextScene || isTransitioningRef.current) {
      console.warn(
        `[TAKE Blocked] Target: ${nextScene}, Current: ${currentScene}, Locked: ${isTransitioningRef.current}`
      );
      return;
    }

    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
    const shouldAutoBegin = nextScene === 'LIVE' && !!md.beginInfoEnabled;
    const snapshot = cloneData(md);

    const nextData = {
      ...md,
      globalScene: nextScene,
      autoBeginPendingAt: shouldAutoBegin ? Date.now() : 0
    };

    pendingAutoBeginRef.current = shouldAutoBegin;

    setHistory(prev => [
      { time: timeStr, action: `${actionLabel} ➔ ${nextScene}`, data: snapshot },
      ...(Array.isArray(prev) ? prev : [])
    ].slice(0, 20));

    updateData(nextData);
  }, [matchDataRef, setHistory, updateData]);

  return {
    previewScene,
    setPreviewScene,
    previewSceneRef,
    renderScene,
    renderSceneRef,
    isTransitioning,
    takeScene
  };
}