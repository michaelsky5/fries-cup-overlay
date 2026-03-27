import { useState, useEffect, useRef, useCallback } from 'react';
import { defaultData } from '../constants/defaultData';
import { getSafeCasters } from '../utils';

export function useMatchState() {
  const [matchData, setMatchData] = useState(defaultData);
  const [videoProgress, setVideoProgress] = useState({ currentTime: 0, duration: 0 });
  const matchDataRef = useRef(matchData);
  
  // 🚀 优化：新增一个 ref 用于防抖存储，避免高频操作卡死浏览器
  const saveTimeoutRef = useRef(null);

  const getNormalizedData = useCallback((input) => {
    const merged = { ...defaultData, ...input };
    return { ...merged, casters: getSafeCasters(merged) };
  }, []);

  const updateData = useCallback((nextInput) => {
    setMatchData((prev) => {
      const resolvedInput = typeof nextInput === 'function' ? nextInput(prev) : nextInput;
      const safeData = getNormalizedData({ ...prev, ...resolvedInput });
      
      matchDataRef.current = safeData;
      
      // 🚀 优化：非阻塞写入。延迟 300ms 存入本地，打字再快也不会掉帧
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        localStorage.setItem('fries_cup_data', JSON.stringify(safeData));
      }, 300);
      
      return safeData;
    });
  }, [getNormalizedData]);

  useEffect(() => {
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