import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import OBSWebSocket from 'obs-websocket-js';

const OBSContext = createContext();

export function OBSProvider({ children }) {
  // 🚀 修复 1：惰性初始化，防止 React 每次渲染都 new 出一个垃圾实例
  const obs = useRef(null);
  if (!obs.current) {
    obs.current = new OBSWebSocket();
  }
  
  const [obsStatus, setObsStatus] = useState('disconnected');

  useEffect(() => {
    const obsInstance = obs.current;

    // 🚀 修复 2：监听底层真实断开事件，防止拔网线后的“假连接”状态
    const handleConnectionClosed = () => {
      console.warn('OBS WebSocket Disconnected!');
      setObsStatus('disconnected');
    };

    const handleConnectionError = (err) => {
      console.error('OBS WebSocket Error:', err);
      setObsStatus('error');
    };

    obsInstance.on('ConnectionClosed', handleConnectionClosed);
    obsInstance.on('ConnectionError', handleConnectionError);

    return () => {
      obsInstance.off('ConnectionClosed', handleConnectionClosed);
      obsInstance.off('ConnectionError', handleConnectionError);
      obsInstance.disconnect();
    };
  }, []);

  const connectOBS = async (url = 'ws://127.0.0.1:4455', password = '') => {
    try {
      setObsStatus('connecting');
      await obs.current.connect(url, password);
      setObsStatus('connected');
      console.log('OBS WebSocket Connected!');
    } catch (error) {
      console.error('OBS Connection Error:', error);
      setObsStatus('error');
    }
  };

  const saveReplay = async () => {
    if (obsStatus !== 'connected') return;
    try {
      await obs.current.call('SaveReplayBuffer');
      console.log('Replay saved successfully');
    } catch (error) {
      console.error('Failed to save replay:', error);
    }
  };

  // 🚀 修复 3：合并为一个通用的媒体播放遥控器
  const playMedia = async (mediaSourceName, videoPath, sceneName) => {
    if (obsStatus !== 'connected') return;
    try {
      await obs.current.call('SetInputSettings', {
        inputName: mediaSourceName,
        inputSettings: { local_file: videoPath, looping: false }
      });
      await obs.current.call('SetCurrentProgramScene', { sceneName: sceneName });
      console.log(`Now playing: ${videoPath} on scene: ${sceneName}`);
    } catch (error) {
      console.error(`Failed to play media ${videoPath}:`, error);
    }
  };

  return (
    <OBSContext.Provider value={{ 
      obsStatus, connectOBS, saveReplay, 
      playHighlight: playMedia, 
      playVideo: playMedia 
    }}>
      {children}
    </OBSContext.Provider>
  );
}

export const useOBS = () => useContext(OBSContext);