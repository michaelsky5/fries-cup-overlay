import { useState, useRef, useCallback } from 'react';

export function useHistory(matchDataRef, updateData) {
  const [history, setHistory] = useState([]);
  const historyRef = useRef(history);

  // 🚀 优化：使用 useCallback 并在内部同步更新 Ref，不再依赖 useEffect 的异步生命周期
  const updateWithHistory = useCallback((actionName, newData) => {
    const timeStr = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    
    setHistory(prev => {
      const newHistory = [
        { time: timeStr, action: actionName, data: matchDataRef.current }, 
        ...prev
      ].slice(0, 20); // 最多存 20 步
      
      // 同步更新，供后续极速操作读取
      historyRef.current = newHistory; 
      return newHistory;
    });
    
    updateData(newData);
  }, [matchDataRef, updateData]);

  const handleUndo = useCallback(() => {
    if (historyRef.current.length === 0) return;
    
    const lastState = historyRef.current[0];
    updateData(lastState.data);
    
    setHistory(prev => {
      const newHistory = prev.slice(1);
      historyRef.current = newHistory;
      return newHistory;
    });
  }, [updateData]);

  return { history, historyRef, setHistory, updateWithHistory, handleUndo };
}