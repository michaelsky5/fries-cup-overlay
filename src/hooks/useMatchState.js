import { useState, useEffect, useRef, useCallback } from 'react';
import { defaultData } from '../constants/defaultData';
import { getSafeCasters } from '../utils';

export function useMatchState() {
  const [matchData, setMatchData] = useState(defaultData);
  const [videoProgress, setVideoProgress] = useState({ currentTime: 0, duration: 0 });
  const matchDataRef = useRef(matchData);

  // 1. 统一的数据清洗与合并逻辑
  const getNormalizedData = useCallback((input) => {
    const merged = { ...defaultData, ...input };
    return { ...merged, casters: getSafeCasters(merged) };
  }, []);

  // 2. 核心更新逻辑：使用 useCallback 避免向下传递时引发子组件重渲染
  const updateData = useCallback((nextInput) => {
    setMatchData((prev) => {
      // 完美支持 updateData(prev => next) 和 updateData(next) 两种写法
      const resolvedInput = typeof nextInput === 'function' ? nextInput(prev) : nextInput;
      const safeData = getNormalizedData({ ...prev, ...resolvedInput });
      
      matchDataRef.current = safeData;
      localStorage.setItem('fries_cup_data', JSON.stringify(safeData));
      return safeData;
    });
  }, [getNormalizedData]);

  useEffect(() => {
    // 初始化读取
    const saved = localStorage.getItem('fries_cup_data');
    if (saved) {
      try {
        const normalized = getNormalizedData(JSON.parse(saved));
        matchDataRef.current = normalized;
        setMatchData(normalized);
      } catch (e) {
        console.error('Data parse error:', e);
      }
    }

    // 跨标签页/窗口同步
    const handleStorage = (e) => {
      if (!e.newValue) return;
      try {
        if (e.key === 'fries_cup_data') {
          const normalized = getNormalizedData(JSON.parse(e.newValue));
          matchDataRef.current = normalized;
          setMatchData(normalized);
        } else if (e.key === 'fries_cup_video_progress') {
          setVideoProgress(JSON.parse(e.newValue));
        } else if (e.key === 'fries_cup_ticker_command' && e.newValue === 'OFF') {
          updateData((prev) => ({ ...prev, showTicker: false }));
          localStorage.removeItem('fries_cup_ticker_command');
        }
      } catch (err) {
        console.error('Storage sync error:', err);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [getNormalizedData, updateData]);

  return { matchData, matchDataRef, videoProgress, updateData };
}