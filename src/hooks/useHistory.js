import { useState, useRef, useCallback } from 'react';

const cloneData = data => {
  try {
    if (typeof structuredClone === 'function') return structuredClone(data);
  } catch (err) {
    console.warn('[FCUP_HISTORY] structuredClone failed, fallback to JSON clone.', err);
  }

  try {
    return JSON.parse(JSON.stringify(data));
  } catch (err) {
    console.warn('[FCUP_HISTORY] JSON clone failed, fallback to raw data.', err);
    return data;
  }
};

const stripSceneFields = data => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return data;

  const {
    globalScene,
    programScene,
    autoBeginPendingAt,
    ...rest
  } = data;

  return rest;
};

const normalizeHistoryEntry = entry => {
  if (!entry || typeof entry !== 'object') return entry;

  return {
    ...entry,
    data: stripSceneFields(entry.data)
  };
};

export function useHistory(matchDataRef, updateData) {
  const [history, setHistoryState] = useState([]);
  const historyRef = useRef(history);

  const setHistory = useCallback(nextHistory => {
    setHistoryState(prev => {
      const resolved = typeof nextHistory === 'function' ? nextHistory(prev) : nextHistory;
      const safeHistory = Array.isArray(resolved)
        ? resolved.map(normalizeHistoryEntry)
        : [];

      historyRef.current = safeHistory;
      return safeHistory;
    });
  }, []);

  const updateWithHistory = useCallback((actionName, newData) => {
    const timeStr = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    const snapshot = stripSceneFields(cloneData(matchDataRef.current));

    setHistoryState(prev => {
      const newHistory = [
        { time: timeStr, action: actionName, data: snapshot },
        ...prev
      ].slice(0, 20);

      historyRef.current = newHistory;
      return newHistory;
    });

    updateData(newData);
  }, [matchDataRef, updateData]);

  const handleUndo = useCallback(() => {
    if (historyRef.current.length === 0) return;

    const lastState = historyRef.current[0];
    const currentData = matchDataRef.current || {};
    const currentScene = currentData.globalScene || 'LIVE';
    const restoredData = stripSceneFields(cloneData(lastState.data));

    updateData({
      ...currentData,
      ...(restoredData || {}),
      globalScene: currentScene
    });

    setHistoryState(prev => {
      const newHistory = prev.slice(1);
      historyRef.current = newHistory;
      return newHistory;
    });
  }, [matchDataRef, updateData]);

  return { history, historyRef, setHistory, updateWithHistory, handleUndo };
}