import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import OBSWebSocket from 'obs-websocket-js';

const OBSContext = createContext();

export function OBSProvider({ children }) {
  const obs = useRef(null);
  if (!obs.current) {
    obs.current = new OBSWebSocket();
  }
  
  const [obsStatus, setObsStatus] = useState('disconnected');
  const [obsConfig, setObsConfig] = useState({ url: 'ws://127.0.0.1:4455', password: '' });
  
  // 🚀 新增：用来存放外部注册的监听函数
  const syncCallback = useRef(null);

  useEffect(() => {
    const savedConfig = localStorage.getItem('fc_obs_config');
    if (savedConfig) setObsConfig(JSON.parse(savedConfig));
  }, []);

  useEffect(() => {
    const obsInstance = obs.current;

    const handleConnectionClosed = () => setObsStatus('disconnected');
    const handleConnectionError = () => setObsStatus('error');
    
    // 🚀 新增：监听别人发来的广播消息
    const handleCustomEvent = (event) => {
      if (event.type === 'FCUP_SYNC_STATE' && syncCallback.current) {
        syncCallback.current(event.payload);
      }
    };

    obsInstance.on('ConnectionClosed', handleConnectionClosed);
    obsInstance.on('ConnectionError', handleConnectionError);
    obsInstance.on('CustomEvent', handleCustomEvent); // 挂载监听

    return () => {
      obsInstance.off('ConnectionClosed', handleConnectionClosed);
      obsInstance.off('ConnectionError', handleConnectionError);
      obsInstance.off('CustomEvent', handleCustomEvent);
      obsInstance.disconnect();
    };
  }, []);

  const connectOBS = async (url, password) => {
    try {
      setObsStatus('connecting');
      await obs.current.connect(url, password);
      setObsStatus('connected');
      const newConfig = { url, password };
      setObsConfig(newConfig);
      localStorage.setItem('fc_obs_config', JSON.stringify(newConfig));
    } catch (error) {
      setObsStatus('error');
    }
  };

  const disconnectOBS = async () => {
    await obs.current.disconnect();
    setObsStatus('disconnected');
  };

  // 🚀 新增：向全网广播你的状态（iPad 会调用这个）
  const broadcastState = async (stateData) => {
    if (obsStatus !== 'connected') return;
    try {
      await obs.current.call('BroadcastCustomEvent', {
        eventData: {
          type: 'FCUP_SYNC_STATE',
          payload: stateData
        }
      });
    } catch (err) {
      console.error('广播状态失败', err);
    }
  };

  // 🚀 新增：注册接收回调（Overlay 会调用这个）
  const onReceiveSync = (callback) => {
    syncCallback.current = callback;
  };

  return (
    <OBSContext.Provider value={{ 
      obsStatus, obsConfig, connectOBS, disconnectOBS,
      broadcastState, onReceiveSync
    }}>
      {children}
    </OBSContext.Provider>
  );
}

export const useOBS = () => useContext(OBSContext);