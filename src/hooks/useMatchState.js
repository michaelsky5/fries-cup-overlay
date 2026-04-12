import { useState, useEffect, useRef, useCallback } from 'react';
import { defaultData } from '../constants/defaultData';
import { getSafeCasters } from '../utils';

// 🧹 专门用来清理本地缓存中已失效的 blob 临时体验卡
const cleanDeadBlobs = (data) => {
  if (!data) return data;
  
  const cleanedData = { ...data };

  // 1. 清理 StatsEditor (战绩OCR图)
  if (cleanedData.statsImageTempUrl && cleanedData.statsImageTempUrl.startsWith('blob:')) {
    cleanedData.statsImageTempUrl = '';
  }

  // 2. 清理 RosterEditor (A队选手头像)
  if (Array.isArray(cleanedData.rosterPlayersA)) {
    cleanedData.rosterPlayersA = cleanedData.rosterPlayersA.map(p => 
      (p.heroImage && p.heroImage.startsWith('blob:')) ? { ...p, heroImage: '' } : p
    );
  }

  // 3. 清理 RosterEditor (B队选手头像)
  if (Array.isArray(cleanedData.rosterPlayersB)) {
    cleanedData.rosterPlayersB = cleanedData.rosterPlayersB.map(p => 
      (p.heroImage && p.heroImage.startsWith('blob:')) ? { ...p, heroImage: '' } : p
    );
  }

  // 4. 清理 CasterEditor (解说头像)
  if (Array.isArray(cleanedData.casters)) {
    cleanedData.casters = cleanedData.casters.map(c => 
      (c.avatar && c.avatar.startsWith('blob:')) ? { ...c, avatar: '' } : c
    );
  }

  return cleanedData;
};

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
        // 🌟 在这里拦截！解析 JSON 后，先清理失效的 Blob，再去更新状态
        const parsedData = JSON.parse(saved);
        const cleanedData = cleanDeadBlobs(parsedData);
        const normalized = getNormalizedData(cleanedData);
        
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
          // 🌟 跨标签页同步时也拦截一下，防止接收到其他页面的脏数据
          const parsedData = JSON.parse(e.newValue);
          const cleanedData = cleanDeadBlobs(parsedData);
          const normalized = getNormalizedData(cleanedData);
          
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