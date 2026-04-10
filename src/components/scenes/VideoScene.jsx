import React, { useRef, useEffect, useState } from 'react';

const COLORS = { black: '#2a2a2a', yellow: '#f4c320', white: '#ffffff' };

export default function VideoScene({ matchData, updateData }) {
  const videoRef = useRef(null);
  const lastSaveTime = useRef(0);
  
  const playlist = matchData.videoPlaylist || [];
  const globalActiveVideo = matchData.activeVideoPath || '';

  // 核心切换逻辑：判断当前是 Web 渲染还是 OBS 本地渲染
  const renderMode = matchData.videoRenderMode || 'WEB'; 
  const isOBSLocal = renderMode === 'OBS_LOCAL';

  const [localVideoPath, setLocalVideoPath] = useState('');

  useEffect(() => {
    setLocalVideoPath(globalActiveVideo);
  }, [globalActiveVideo]);

  const currentVideo = localVideoPath || globalActiveVideo;

  const isOverlay = typeof window !== 'undefined' && window.location.hash === '#overlay';
  const forceMuted = !isOverlay || !!matchData.videoMuted;

  useEffect(() => {
    // 只有在 Web 模式下才需要控制 video 实例
    if (!isOBSLocal && videoRef.current && currentVideo) {
      videoRef.current.muted = forceMuted;
      videoRef.current.play().catch(err => {
        console.warn('[FCUP_SYS] Autoplay blocked by browser policy.', err);
      });
    }
  }, [currentVideo, forceMuted, isOBSLocal]);

  const handleVideoEnded = () => {
    if (!playlist || playlist.length === 0) return; 

    if (playlist.length === 1) {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
      return;
    }

    const currentIndex = playlist.indexOf(currentVideo);
    let nextIndex = 0;
    if (currentIndex !== -1 && currentIndex < playlist.length - 1) {
      nextIndex = currentIndex + 1;
    }
    
    const nextVideo = playlist[nextIndex];

    if (updateData) {
      updateData({ ...matchData, activeVideoPath: nextVideo });
    } else {
      setLocalVideoPath(nextVideo);
    }
  };

  const handleTimeUpdate = (e) => {
    const video = e.target;
    if (!video) return;
    const now = Date.now();
    if (now - lastSaveTime.current > 500) {
      const progressData = { currentTime: video.currentTime, duration: video.duration || 0 };
      localStorage.setItem('fries_cup_video_progress', JSON.stringify(progressData));
      lastSaveTime.current = now;
    }
  };

  return (
    <div style={{ 
      width: '1920px', 
      height: '1080px', 
      backgroundColor: isOBSLocal ? 'transparent' : '#000000', 
      position: 'relative', 
      overflow: 'hidden', 
      fontFamily: '"HarmonyOS Sans SC", sans-serif' 
    }}>
      {isOBSLocal ? (
        // OBS 本地模式：渲染完全透明的占位层，让底层的媒体源透过来
        <div style={{ width: '100%', height: '100%', background: 'transparent' }} />
      ) : currentVideo ? (
        // Web 模式：正常渲染原有的视频播放器
        <video 
          key={currentVideo} 
          ref={videoRef}
          src={currentVideo} 
          autoPlay 
          muted={forceMuted}
          playsInline
          onEnded={handleVideoEnded}
          onTimeUpdate={handleTimeUpdate} 
          onLoadedMetadata={handleTimeUpdate} 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
        />
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#555', fontSize: '24px', fontWeight: 'bold', letterSpacing: '4px' }}>
          VIDEO_SYS // STANDBY
        </div>
      )}
      
      {/* 角标不受模式影响，始终显示 */}
      <div style={{ position: 'absolute', bottom: '40px', right: '60px', display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.3 }}>
        <div style={{ width: '15px', height: '15px', backgroundColor: COLORS.yellow }} />
        <span style={{ fontSize: '18px', fontWeight: '900', color: COLORS.white, letterSpacing: '2px' }}>FRIES CUP</span>
      </div>
    </div>
  );
}