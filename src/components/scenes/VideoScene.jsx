import React, { useRef, useEffect, useState } from 'react';

const COLORS = {
  black: '#2a2a2a',
  yellow: '#f4c320',
  white: '#ffffff'
};

export default function VideoScene({ matchData = {} }) {
  const videoRef = useRef(null);

  const playlist = Array.isArray(matchData.videoPlaylist) ? matchData.videoPlaylist : [];
  const globalActiveVideo = matchData.activeVideoPath || '';

  const renderMode = matchData.videoRenderMode || 'WEB';
  const isOBSLocal = renderMode === 'OBS_LOCAL';

  const [localVideoPath, setLocalVideoPath] = useState(globalActiveVideo);

  useEffect(() => {
    setLocalVideoPath(globalActiveVideo);
  }, [globalActiveVideo]);

  const currentVideo = localVideoPath || globalActiveVideo;

  const isOverlay = typeof window !== 'undefined' && window.location.hash.startsWith('#overlay');
  const forceMuted = !isOverlay || !!matchData.videoMuted;

  useEffect(() => {
    if (!isOBSLocal && videoRef.current && currentVideo) {
      videoRef.current.muted = forceMuted;
      videoRef.current.play().catch(err => {
        console.warn('[FCUP_SYS] Video autoplay blocked by browser policy.', err);
      });
    }
  }, [currentVideo, forceMuted, isOBSLocal]);

  const handleVideoEnded = () => {
    if (!playlist.length) return;

    if (playlist.length === 1) {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
      return;
    }

    const currentIndex = playlist.indexOf(currentVideo);
    const nextIndex = currentIndex !== -1 && currentIndex < playlist.length - 1
      ? currentIndex + 1
      : 0;

    setLocalVideoPath(playlist[nextIndex] || '');
  };

  return (
    <div
      style={{
        width: '1920px',
        height: '1080px',
        backgroundColor: isOBSLocal ? 'transparent' : '#000000',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '"HarmonyOS Sans SC", sans-serif'
      }}
    >
      {isOBSLocal ? (
        <div style={{ width: '100%', height: '100%', background: 'transparent' }} />
      ) : currentVideo ? (
        <video
          key={currentVideo}
          ref={videoRef}
          src={currentVideo}
          autoPlay
          muted={forceMuted}
          playsInline
          onEnded={handleVideoEnded}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block'
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#555',
            fontSize: '24px',
            fontWeight: 'bold',
            letterSpacing: '4px'
          }}
        >
          VIDEO_SYS // STANDBY
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          right: '60px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          opacity: 0.3,
          pointerEvents: 'none'
        }}
      >
        <div style={{ width: '15px', height: '15px', backgroundColor: COLORS.yellow }} />
        <span
          style={{
            fontSize: '18px',
            fontWeight: '900',
            color: COLORS.white,
            letterSpacing: '2px'
          }}
        >
          FRIES CUP
        </span>
      </div>
    </div>
  );
}