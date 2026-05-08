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

export function useHistory(matchDataRef, updateData) {
  const [history, setHistoryState] = useState([]);
  const historyRef = useRef(history);

  const setHistory = useCallback(nextHistory => {
    setHistoryState(prev => {
      const resolved = typeof nextHistory === 'function' ? nextHistory(prev) : nextHistory;
      const safeHistory = Array.isArray(resolved) ? resolved : [];
      historyRef.current = safeHistory;
      return safeHistory;
    });
  }, []);

  const updateWithHistory = useCallback((actionName, newData) => {
    const timeStr = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    const snapshot = cloneData(matchDataRef.current);

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
    updateData(cloneData(lastState.data));

    setHistoryState(prev => {
      const newHistory = prev.slice(1);
      historyRef.current = newHistory;
      return newHistory;
    });
  }, [updateData]);

  return { history, historyRef, setHistory, updateWithHistory, handleUndo };
}