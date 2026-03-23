import React, { createContext, useContext } from 'react';

// 1. 创建 Context（数据广播站）
export const MatchContext = createContext(null);

// 2. 提供一个自定义 Hook，方便后代组件直接获取数据
export function useMatchContext() {
  const context = useContext(MatchContext);
  if (!context) {
    throw new Error('useMatchContext 必须在 MatchContext.Provider 内部使用');
  }
  return context;
}