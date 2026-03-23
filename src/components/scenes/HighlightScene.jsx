import React, { useEffect, useRef } from 'react';

const C = { y: '#f4c320', b: '#2a2a2a', w: '#ffffff', line: 'rgba(255,255,255,0.08)', lineStrong: 'rgba(255,255,255,0.18)', softWhite: 'rgba(255,255,255,0.72)' };
const UI = { outerFrame: `1px solid ${C.lineStrong}`, panelShadow: '0 18px 40px rgba(0,0,0,0.28)', yellowGlow: '0 0 0 1px rgba(244,195,32,0.16), 0 0 18px rgba(244,195,32,0.08)', insetLine: 'inset 0 0 0 1px rgba(255,255,255,0.04)' };

export default function HighlightScene({ matchData, updateData }) {
  const videoRef = useRef(null);
  const currentVideo = matchData.activeHighlightPath || '';
  const playlist = matchData.highlightPlaylist || [];

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = matchData.highlightMuted !== undefined ? matchData.highlightMuted : false;
  }, [matchData.highlightMuted, currentVideo]);

  const handleVideoEnded = () => {
    if (!playlist || playlist.length <= 1) return;
    const currentIndex = playlist.indexOf(currentVideo);
    const nextIndex = currentIndex !== -1 && currentIndex < playlist.length - 1 ? currentIndex + 1 : 0;
    updateData && updateData({ ...matchData, activeHighlightPath: playlist[nextIndex] });
  };

  const handleTimeUpdate = (e) => {
    const video = e.target;
    if (!video) return;
    localStorage.setItem('fries_cup_video_progress', JSON.stringify({ currentTime: video.currentTime, duration: video.duration || 0 }));
  };

  const cupName = (matchData.infoCupName || 'FRIES CUP').toUpperCase();
  const frameW = 1680, frameH = 945;

  return (
    <div style={{ width: 1920, height: 1080, position: 'relative', overflow: 'hidden', background: C.b, fontFamily: '"HarmonyOS Sans SC","Microsoft YaHei",sans-serif' }}>
      <style>{`
        @keyframes slideInLeft { from { opacity: 0; transform: translateX(-50px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(50px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>

      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.014) 1px, transparent 1px)', backgroundSize: '120px 120px, 120px 120px', opacity: 0.24 }} />
      <div style={{ position: 'absolute', left: '70px', top: '70px', width: '520px', height: '520px', border: '1px solid rgba(244,195,32,0.06)', transform: 'rotate(45deg)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: '-120px', bottom: '-120px', width: '460px', height: '460px', border: '1px solid rgba(255,255,255,0.03)', transform: 'rotate(45deg)', pointerEvents: 'none' }} />

      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '44px', background: 'rgba(255,255,255,0.02)', borderBottom: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', boxSizing: 'border-box', backdropFilter: 'blur(4px)', zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '10px', height: '10px', background: C.y, boxShadow: '0 0 12px rgba(244,195,32,0.28)' }} />
          <span style={{ fontSize: '12px', fontWeight: '900', letterSpacing: '2px', color: C.softWhite }}>FCUP_HIGHLIGHT_INTERFACE</span>
        </div>
        <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '2px', color: 'rgba(255,255,255,0.38)' }}>HIGHLIGHT_FEED // STABLE</div>
      </div>

      <div style={{ position: 'absolute', left: '50%', top: '50%', width: frameW, height: frameH, transform: 'translate(-50%, -50%)', zIndex: 10 }}>
        <div style={{ position: 'absolute', inset: 0, border: `2px solid ${C.y}`, boxSizing: 'border-box', boxShadow: `${UI.panelShadow}, ${UI.yellowGlow}` }} />
        <div style={{ position: 'absolute', inset: 0, boxShadow: UI.insetLine, pointerEvents: 'none' }} />

        <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: 56, height: 56, borderTop: `6px solid ${C.y}`, borderLeft: `6px solid ${C.y}`, boxSizing: 'border-box' }} />
        <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: 56, height: 56, borderTop: `6px solid ${C.y}`, borderRight: `6px solid ${C.y}`, boxSizing: 'border-box' }} />
        <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: 56, height: 56, borderBottom: `6px solid ${C.y}`, borderLeft: `6px solid ${C.y}`, boxSizing: 'border-box' }} />
        <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: 56, height: 56, borderBottom: `6px solid ${C.y}`, borderRight: `6px solid ${C.y}`, boxSizing: 'border-box' }} />

        <div style={{ position: 'absolute', top: -2, left: 120, width: 80, height: 2, background: C.b }} />
        <div style={{ position: 'absolute', bottom: -2, right: 120, width: 110, height: 2, background: C.b }} />

        <div style={{ position: 'absolute', top: '18px', left: '18px', width: '20px', height: '20px', borderTop: `2px solid ${C.y}`, borderLeft: `2px solid ${C.y}`, zIndex: 3 }} />
        <div style={{ position: 'absolute', bottom: '18px', right: '18px', width: '20px', height: '20px', borderBottom: `2px solid ${C.y}`, borderRight: `2px solid ${C.y}`, zIndex: 3 }} />

        <div style={{ position: 'absolute', inset: 10, background: '#000', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.012) 0 1px, transparent 1px 22px)', pointerEvents: 'none', zIndex: 2 }} />
          {currentVideo ? (
            <video
              ref={videoRef}
              src={currentVideo}
              autoPlay
              loop={!playlist || playlist.length <= 1}
              onEnded={handleVideoEnded}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleTimeUpdate}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 18 }}>
              <div style={{ width: 84, height: 84, border: `2px solid ${C.y}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.y, fontSize: 22, fontWeight: 900, letterSpacing: 2 }}>FC</div>
              <span style={{ color: C.w, fontSize: 24, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', opacity: 0.9 }}>Awaiting Video Feed</span>
            </div>
          )}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', boxShadow: 'inset 0 0 80px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(255,255,255,0.04)' }} />
        </div>
      </div>

      <div style={{ position: 'absolute', right: 120, bottom: 45, zIndex: 20, display: 'flex', alignItems: 'center', gap: 14, animation: 'slideInRight 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.08) forwards' }}>
        <span style={{ color: C.w, fontSize: 14, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.88 }}>{cupName}</span>
        <div style={{ width: 42, height: 1, background: C.w, opacity: 0.35 }} />
        <span style={{ color: C.y, fontSize: 11, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.9 }}>Highlight</span>
      </div>
    </div>
  );
}