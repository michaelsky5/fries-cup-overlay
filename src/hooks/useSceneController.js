import { useState, useEffect, useRef, useCallback } from 'react';

export function useSceneController(matchData, matchDataRef, updateData, setHistory) {
  const [previewScene, setPreviewScene] = useState('LIVE');
  const [renderScene, setRenderScene] = useState(matchData.globalScene || 'LIVE');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const previewSceneRef = useRef(previewScene);
  const isTransitioningRef = useRef(isTransitioning);
  const pendingAutoBeginRef = useRef(false);

  // 同步状态到 Ref，供异步回调或快捷键使用
  useEffect(() => {
    previewSceneRef.current = previewScene;
  }, [previewScene]);

  useEffect(() => {
    isTransitioningRef.current = isTransitioning;
  }, [isTransitioning]);

  // 1. 场景转场控制 (Stinger Transition)
  useEffect(() => {
    // 🌟 修复陷阱：如果目标场景就是当前画面，直接跳过
    if (matchData.globalScene === renderScene) return;

    setIsTransitioning(true);

    // 450ms：画面刚好被动画完全遮挡，此时切换真实的底层场景
    const t1 = setTimeout(() => {
      setRenderScene(matchData.globalScene);
    }, 450);

    // 1000ms：转场动画播放完毕，解除转场锁定状态
    const t2 = setTimeout(() => {
      setIsTransitioning(false);
    }, 1000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // 🌟 核心修复：只监听 globalScene 的变化，无视 renderScene 的过程变化
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchData.globalScene]);

  // 2. 自动触发 Begin Info 逻辑
  useEffect(() => {
    // 只有在非转场状态，且已真正切入 LIVE 场景时，才触发
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

  // 3. 核心切换动作：使用 useCallback 避免引发全局重渲染
  const takeScene = useCallback((nextScene, actionLabel = 'TAKE') => {
    const md = matchDataRef.current;

    // 拦截无效切换：没有目标场景、目标场景即当前场景、或正在转场中
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

    // 写入历史记录，保留最近 20 条，防止内存溢出
    setHistory(prev => [
      { time: timeStr, action: `${actionLabel} ➔ ${nextScene}`, data: nextData },
      ...prev
    ].slice(0, 20));

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