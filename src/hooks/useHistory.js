import { useState, useEffect, useRef } from 'react';

export function useHistory(matchDataRef, updateData) {
  const [history, setHistory] = useState([]);
  const historyRef = useRef(history);

  // 随时保持 ref 同步，供快捷键(Ctrl+Z)使用，避免闭包陷阱
  useEffect(() => { 
    historyRef.current = history; 
  }, [history]);

  // 核心方法：带历史记录的数据更新
  const updateWithHistory = (actionName, newData) => {
    const timeStr = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    // 记录的是动作发生【前】的数据，以便撤销
    setHistory(prev => [
      { time: timeStr, action: actionName, data: matchDataRef.current }, 
      ...prev
    ].slice(0, 20)); // 最多存 20 步
    
    updateData(newData);
  };

  // 执行撤销
  const handleUndo = () => {
    if (historyRef.current.length === 0) return;
    const lastState = historyRef.current[0];
    updateData(lastState.data);
    setHistory(historyRef.current.slice(1));
  };

  return { history, historyRef, setHistory, updateWithHistory, handleUndo };
}