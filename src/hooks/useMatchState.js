import { useState, useEffect, useRef, useCallback } from 'react';
import { defaultData } from '../constants/defaultData';
import { getSafeCasters } from '../utils';

// 🧹 专门用来清理本地缓存中已失效的 blob 临时体验卡
const cleanDeadBlobs = data => {
  if (!data) return data;

  const cleanedData = { ...data };

  // 1. 清理 StatsEditor 战绩 OCR 图
  if (cleanedData.statsImageTempUrl && cleanedData.statsImageTempUrl.startsWith('blob:')) {
    cleanedData.statsImageTempUrl = '';
  }

  // 2. 清理 RosterEditor A 队选手头像
  if (Array.isArray(cleanedData.rosterPlayersA)) {
    cleanedData.rosterPlayersA = cleanedData.rosterPlayersA.map(p =>
      p?.heroImage?.startsWith('blob:') ? { ...p, heroImage: '' } : p
    );
  }

  // 3. 清理 RosterEditor B 队选手头像
  if (Array.isArray(cleanedData.rosterPlayersB)) {
    cleanedData.rosterPlayersB = cleanedData.rosterPlayersB.map(p =>
      p?.heroImage?.startsWith('blob:') ? { ...p, heroImage: '' } : p
    );
  }

  // 4. 清理 CasterEditor 解说头像
  if (Array.isArray(cleanedData.casters)) {
    cleanedData.casters = cleanedData.casters.map(c =>
      c?.avatar?.startsWith('blob:') ? { ...c, avatar: '' } : c
    );
  }

  return cleanedData;
};

const saveDataToLocalStorage = data => {
  try {
    localStorage.setItem('fries_cup_data', JSON.stringify(data));
  } catch (err) {
    console.error('[FCUP_STATE] Failed to save fries_cup_data:', err);
  }
};

const mergeObject = (base, value) => ({
  ...(base || {}),
  ...(value && typeof value === 'object' && !Array.isArray(value) ? value : {})
});

const normalizeActivePlayers = players => {
  if (!Array.isArray(players)) return ['PLAYER1', 'PLAYER2', 'PLAYER3', 'PLAYER4', 'PLAYER5'];

  const oldDefault = ['P1', 'P2', 'P3', 'P4', 'P5'];
  const isOldDefault =
    players.length === oldDefault.length &&
    players.every((name, index) => String(name || '').trim().toUpperCase() === oldDefault[index]);

  if (isOldDefault) return ['PLAYER1', 'PLAYER2', 'PLAYER3', 'PLAYER4', 'PLAYER5'];

  return players;
};

const normalizeMapLineup = lineup => {
  const source = Array.isArray(lineup) && lineup.length ? lineup : defaultData.mapLineup;

  return source.map((map, index) => {
    const base = defaultData.mapLineup?.[index] || {};

    return {
      ...base,
      ...(map || {}),
      type: map?.type || base.type || 'CONTROL',
      name: map?.name || base.name || '',
      bansA: Array.isArray(map?.bansA) ? map.bansA : Array.isArray(base.bansA) ? base.bansA : [],
      bansB: Array.isArray(map?.bansB) ? map.bansB : Array.isArray(base.bansB) ? base.bansB : [],
      winner: map?.winner || '',
      winnerSide: map?.winnerSide || ''
    };
  });
};

const normalizeRosterStaff = (base, value) => {
  const merged = mergeObject(base, value);

  return {
    ...merged,
    manager: mergeObject(base?.manager, merged.manager),
    coaches: Array.isArray(merged.coaches) ? merged.coaches : []
  };
};

export function useMatchState() {
  const [matchData, setMatchData] = useState(defaultData);
  const [videoProgress, setVideoProgress] = useState({ currentTime: 0, duration: 0 });

  const matchDataRef = useRef(matchData);
  const saveTimeoutRef = useRef(null);

  const getNormalizedData = useCallback(input => {
    const merged = { ...defaultData, ...(input || {}) };

    const normalized = {
      ...merged,

      playersA: normalizeActivePlayers(merged.playersA),
      playersB: normalizeActivePlayers(merged.playersB),

      winnerScene: mergeObject(defaultData.winnerScene, merged.winnerScene),

      statsTemplateVisibility: mergeObject(
        defaultData.statsTemplateVisibility,
        merged.statsTemplateVisibility
      ),

      statsTemplateData: mergeObject(
        defaultData.statsTemplateData,
        merged.statsTemplateData
      ),

      eventMapPool: mergeObject(defaultData.eventMapPool, merged.eventMapPool),

      enabledMapTypes: mergeObject(defaultData.enabledMapTypes, merged.enabledMapTypes),

      rosterStaffA: normalizeRosterStaff(defaultData.rosterStaffA, merged.rosterStaffA),
      rosterStaffB: normalizeRosterStaff(defaultData.rosterStaffB, merged.rosterStaffB),

      mapLineup: normalizeMapLineup(merged.mapLineup)
    };

    return { ...normalized, casters: getSafeCasters(normalized) };
  }, []);

  const scheduleSave = useCallback(data => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      saveDataToLocalStorage(data);
      saveTimeoutRef.current = null;
    }, 300);
  }, []);

  const flushSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    saveDataToLocalStorage(matchDataRef.current);
  }, []);

  const updateData = useCallback(nextInput => {
    setMatchData(prev => {
      const resolvedInput = typeof nextInput === 'function' ? nextInput(prev) : nextInput;
      const safeData = getNormalizedData({ ...prev, ...(resolvedInput || {}) });

      matchDataRef.current = safeData;
      scheduleSave(safeData);

      return safeData;
    });
  }, [getNormalizedData, scheduleSave]);

  useEffect(() => {
    const saved = localStorage.getItem('fries_cup_data');

    if (saved) {
      try {
        const parsedData = JSON.parse(saved);
        const cleanedData = cleanDeadBlobs(parsedData);
        const normalized = getNormalizedData(cleanedData);

        matchDataRef.current = normalized;
        setMatchData(normalized);
      } catch (e) {
        console.error('Data parse error:', e);
      }
    }

    const handleStorage = e => {
      if (!e.newValue) return;

      try {
        if (e.key === 'fries_cup_data') {
          if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = null;
          }

          const parsedData = JSON.parse(e.newValue);
          const cleanedData = cleanDeadBlobs(parsedData);
          const normalized = getNormalizedData(cleanedData);

          matchDataRef.current = normalized;
          setMatchData(normalized);
        } else if (e.key === 'fries_cup_video_progress') {
          setVideoProgress(JSON.parse(e.newValue));
        } else if (e.key === 'fries_cup_ticker_command' && e.newValue === 'OFF') {
          updateData(prev => ({ ...prev, showTicker: false }));
          localStorage.removeItem('fries_cup_ticker_command');
        }
      } catch (err) {
        console.error('Storage sync error:', err);
      }
    };

    const handleBeforeUnload = () => {
      flushSave();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      flushSave();
    };
  }, [getNormalizedData, updateData, flushSave]);

  return { matchData, matchDataRef, videoProgress, updateData };
}