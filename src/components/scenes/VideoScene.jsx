import React, { useRef, useEffect } from 'react';

const COLORS = {
  black: '#2a2a2a',
  yellow: '#f4c320',
  white: '#ffffff'
};

export default function VideoScene({ matchData, updateData }) {
  const videoRef = useRef(null);
  const currentVideo = matchData.activeVideoPath || '';
  const playlist = matchData.videoPlaylist || [];

  // 监听静音状态
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = matchData.videoMuted;
    }
  }, [matchData.videoMuted]);

  // 当视频播放结束时，触发列表循环逻辑
  const handleVideoEnded = () => {
    if (playlist.length === 0) return; // 没有列表就不循环
    
    const currentIndex = playlist.indexOf(currentVideo);
    let nextIndex = 0;
    
    // 如果当前视频在列表中，且不是最后一个，则播放下一个；否则回到第一个 (循环)
    if (currentIndex !== -1 && currentIndex < playlist.length - 1) {
      nextIndex = currentIndex + 1;
    }
    
    const nextVideoPath = playlist[nextIndex];
    
    // 把下一个视频的路径同步回中控台，触发重新渲染播放
    if (updateData) {
      updateData({ ...matchData, activeVideoPath: nextVideoPath });
    }
  };

  // 🚀 新增：实时同步进度给控制台
  const handleTimeUpdate = (e) => {
    const video = e.target;
    if (!video) return;
    const progressData = {
      currentTime: video.currentTime,
      duration: video.duration || 0
    };
    // 将进度写入缓存，App.js 那边正在监听这个 key
    localStorage.setItem('fries_cup_video_progress', JSON.stringify(progressData));
  };

  return (
    <div style={{ 
      width: '1920px', 
      height: '1080px', 
      backgroundColor: '#000000', // 视频底层必须是纯黑，防止不同比例视频出现白边
      position: 'relative', 
      overflow: 'hidden',
      fontFamily: '"HarmonyOS Sans SC", sans-serif'
    }}>
      
      {currentVideo ? (
        <video 
          ref={videoRef}
          src={currentVideo} 
          autoPlay 
          onEnded={handleVideoEnded}
          onTimeUpdate={handleTimeUpdate} // 🚀 绑定播放进度更新事件
          onLoadedMetadata={handleTimeUpdate} // 🚀 视频刚加载出元数据时也触发一次，避免起步瞬间没总时长
          style={{ width: '100%', height: '100%', objectFit: 'contain' }} // contain保证画面不被裁切
        />
      ) : (
        // 如果没有选择任何视频，显示黑屏待机字样
        <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#555', fontSize: '24px', fontWeight: 'bold', letterSpacing: '4px' }}>
          VIDEO_SYS // STANDBY
        </div>
      )}

      {/* 右下角极简常驻水印，防止盗播流 */}
      <div style={{ position: 'absolute', bottom: '40px', right: '60px', display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.3 }}>
        <div style={{ width: '15px', height: '15px', backgroundColor: COLORS.yellow }} />
        <span style={{ fontSize: '18px', fontWeight: '900', color: COLORS.white, letterSpacing: '2px' }}>FRIES CUP</span>
      </div>

    </div>
  );
}