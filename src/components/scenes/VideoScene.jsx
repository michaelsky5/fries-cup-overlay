import React, { useRef, useEffect, useState } from 'react';

const COLORS = { black: '#2a2a2a', yellow: '#f4c320', white: '#ffffff' };

export default function VideoScene({ matchData, updateData }) {
  const videoRef = useRef(null);
  const lastSaveTime = useRef(0);
  
  const playlist = matchData.videoPlaylist || [];
  const globalActiveVideo = matchData.activeVideoPath || '';

  // 🚀 核心修复 1：添加本地状态！让 OBS Overlay 即使没有写入权限也能自己切歌
  const [localVideoPath, setLocalVideoPath] = useState('');

  // 🚀 核心修复 2：当控制台点击了“Play Now”强制切视频时，让本地状态同步跟上
  useEffect(() => {
    setLocalVideoPath(globalActiveVideo);
  }, [globalActiveVideo]);

  const currentVideo = localVideoPath || globalActiveVideo;

  const isOverlay = typeof window !== 'undefined' && window.location.hash === '#overlay';
  const forceMuted = !isOverlay || !!matchData.videoMuted;

  useEffect(() => {
    if (videoRef.current && currentVideo) {
      videoRef.current.muted = forceMuted;
      videoRef.current.play().catch(err => {
        console.warn('[FCUP_SYS] Autoplay blocked by browser policy.', err);
      });
    }
  }, [currentVideo, forceMuted]);

  const handleVideoEnded = () => {
    if (!playlist || playlist.length === 0) return; 

    // 🚀 核心修复 3：防死锁机制。如果列表只有1个视频，手动拉回进度条重新播！
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
      // 如果是在控制台，走正常全局更新逻辑
      updateData({ ...matchData, activeVideoPath: nextVideo });
    } else {
      // 🚀 核心修复 4：如果在 OBS 浏览器源里（无权限），直接修改本地状态切歌！
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
    <div style={{ width: '1920px', height: '1080px', backgroundColor: '#000000', position: 'relative', overflow: 'hidden', fontFamily: '"HarmonyOS Sans SC", sans-serif' }}>
      {currentVideo ? (
        <video 
          key={currentVideo} // 状态改变时强制刷新播放器
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
      <div style={{ position: 'absolute', bottom: '40px', right: '60px', display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.3 }}>
        <div style={{ width: '15px', height: '15px', backgroundColor: COLORS.yellow }} />
        <span style={{ fontSize: '18px', fontWeight: '900', color: COLORS.white, letterSpacing: '2px' }}>FRIES CUP</span>
      </div>
    </div>
  );
}