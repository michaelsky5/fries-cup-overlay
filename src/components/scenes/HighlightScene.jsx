import React, { useRef, useEffect, useState } from 'react';

const C = {
  y: '#f4c320',
  b: '#2a2a2a',
  w: '#ffffff',
  line: 'rgba(255,255,255,0.08)',
  lineStrong: 'rgba(255,255,255,0.18)',
  softWhite: 'rgba(255,255,255,0.72)'
};

const UI = {
  outerFrame: `1px solid ${C.lineStrong}`,
  panelShadow: '0 18px 40px rgba(0,0,0,0.28)',
  yellowGlow: '0 0 0 1px rgba(244,195,32,0.16), 0 0 18px rgba(244,195,32,0.08)',
  insetLine: 'inset 0 0 0 1px rgba(255,255,255,0.04)'
};

export default function HighlightScene({ matchData = {} }) {
  const videoRef = useRef(null);

  const playlist = Array.isArray(matchData.highlightPlaylist) ? matchData.highlightPlaylist : [];
  const [localHighlightPath, setLocalHighlightPath] = useState(matchData.activeHighlightPath || '');

  const currentVideo = localHighlightPath || matchData.activeHighlightPath || '';

  const renderMode = matchData.highlightRenderMode || 'WEB';
  const isOBSLocal = renderMode === 'OBS_LOCAL';

  const isOverlay = typeof window !== 'undefined' && window.location.hash === '#overlay';
  const forceMuted = !isOverlay || matchData.highlightMuted !== false;

  useEffect(() => {
    setLocalHighlightPath(matchData.activeHighlightPath || '');
  }, [matchData.activeHighlightPath]);

  useEffect(() => {
    if (!isOBSLocal && videoRef.current && currentVideo) {
      videoRef.current.muted = forceMuted;
      videoRef.current.play().catch(err => console.warn('[FCUP_SYS] Highlight Autoplay blocked:', err));
    }
  }, [currentVideo, forceMuted, isOBSLocal]);

  const handleVideoEnded = () => {
    if (!playlist || playlist.length <= 1) return;

    const currentIndex = playlist.indexOf(currentVideo);
    const nextIndex = currentIndex !== -1 && currentIndex < playlist.length - 1
      ? currentIndex + 1
      : 0;

    setLocalHighlightPath(playlist[nextIndex] || '');
  };

  const cupName = (matchData.infoCupName || 'FRIES CUP').toUpperCase();
  const frameW = 1680;
  const frameH = 945;

  const holeClipPath = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 77.5px, 130px 77.5px, 130px 1002.5px, 1790px 1002.5px, 1790px 77.5px, 130px 77.5px, 0% 77.5px)';

  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        position: 'relative',
        overflow: 'hidden',
        background: isOBSLocal ? 'transparent' : C.b,
        fontFamily: '"HarmonyOS Sans SC","Microsoft YaHei",sans-serif'
      }}
    >
      <style>{`
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-50px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {isOBSLocal && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: C.b,
            clipPath: holeClipPath
          }}
        />
      )}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.014) 1px, transparent 1px)',
          backgroundSize: '120px 120px, 120px 120px',
          opacity: 0.24,
          clipPath: isOBSLocal ? holeClipPath : 'none'
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: '70px',
          top: '70px',
          width: '520px',
          height: '520px',
          border: '1px solid rgba(244,195,32,0.06)',
          transform: 'rotate(45deg)',
          pointerEvents: 'none'
        }}
      />

      <div
        style={{
          position: 'absolute',
          right: '-120px',
          bottom: '-120px',
          width: '460px',
          height: '460px',
          border: '1px solid rgba(255,255,255,0.03)',
          transform: 'rotate(45deg)',
          pointerEvents: 'none'
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '44px',
          background: 'rgba(255,255,255,0.02)',
          borderBottom: `1px solid ${C.line}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 30px',
          boxSizing: 'border-box',
          backdropFilter: 'blur(4px)',
          zIndex: 20
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              background: C.y,
              boxShadow: '0 0 12px rgba(244,195,32,0.28)'
            }}
          />
          <span
            style={{
              fontSize: '12px',
              fontWeight: '900',
              letterSpacing: '2px',
              color: C.softWhite
            }}
          >
            FCUP_HIGHLIGHT_INTERFACE
          </span>
        </div>

        <div
          style={{
            fontSize: '11px',
            fontWeight: '700',
            letterSpacing: '2px',
            color: 'rgba(255,255,255,0.38)'
          }}
        >
          HIGHLIGHT_FEED // STABLE
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: frameW,
          height: frameH,
          transform: 'translate(-50%, -50%)',
          zIndex: 10
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            border: `2px solid ${C.y}`,
            boxSizing: 'border-box',
            boxShadow: `${UI.panelShadow}, ${UI.yellowGlow}`
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: UI.insetLine,
            pointerEvents: 'none'
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 10,
            background: isOBSLocal ? 'transparent' : '#000',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.012) 0 1px, transparent 1px 22px)',
              pointerEvents: 'none',
              zIndex: 2,
              display: isOBSLocal ? 'none' : 'block'
            }}
          />

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
              loop={!playlist || playlist.length <= 1}
              onEnded={handleVideoEnded}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 18
              }}
            >
              <div
                style={{
                  width: 84,
                  height: 84,
                  border: `2px solid ${C.y}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: C.y,
                  fontSize: 22,
                  fontWeight: 900,
                  letterSpacing: 2
                }}
              >
                FC
              </div>

              <span
                style={{
                  color: C.w,
                  fontSize: 24,
                  fontWeight: 900,
                  letterSpacing: 4,
                  textTransform: 'uppercase',
                  opacity: 0.9
                }}
              >
                Awaiting Video Feed
              </span>
            </div>
          )}

          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              boxShadow: 'inset 0 0 80px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(255,255,255,0.04)'
            }}
          />
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          right: 120,
          bottom: 45,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          animation: 'slideInRight 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.08) forwards'
        }}
      >
        <span
          style={{
            color: C.w,
            fontSize: 14,
            fontWeight: 900,
            letterSpacing: 3,
            textTransform: 'uppercase',
            opacity: 0.88
          }}
        >
          {cupName}
        </span>

        <div
          style={{
            width: 42,
            height: 1,
            background: C.w,
            opacity: 0.35
          }}
        />

        <span
          style={{
            color: C.y,
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: 2,
            textTransform: 'uppercase',
            opacity: 0.9
          }}
        >
          Highlight
        </span>
      </div>
    </div>
  );
}