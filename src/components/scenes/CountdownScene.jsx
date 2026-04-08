import React, { useState, useEffect, useRef } from 'react';

const COLORS = {
  black: '#2a2a2a', yellow: '#f4c320', white: '#ffffff',
  darkGray: '#1a1a1a', dimGray: '#555555', panel: '#101010', panel2: '#161616',
  line: 'rgba(255,255,255,0.08)', lineStrong: 'rgba(255,255,255,0.18)',
  softWhite: 'rgba(255,255,255,0.72)', softYellow: 'rgba(244,195,32,0.18)',
  shadow: 'rgba(0,0,0,0.35)'
};

const UI = {
  outerFrame: `1px solid ${COLORS.lineStrong}`,
  innerFrame: `1px solid ${COLORS.line}`,
  hardShadow: '0 18px 40px rgba(0,0,0,0.28)',
  panelShadow: '0 10px 24px rgba(0,0,0,0.22)',
  yellowGlow: '0 0 0 1px rgba(244,195,32,0.16), 0 0 18px rgba(244,195,32,0.08)',
  insetLine: 'inset 0 0 0 1px rgba(255,255,255,0.04)',
  bevelInset: 'inset 0 1px 0 rgba(255,255,255,0.04), inset 0 -1px 0 rgba(0,0,0,0.35)'
};

const ScheduleBoard = ({ matches, compact = false, dense = false }) => {
  const teamNameColor = (bg) => (bg === COLORS.white ? COLORS.black : COLORS.white);

  if (matches.length === 1 && !compact) {
    const m = matches[0];
    const hasScore = m.scoreA !== undefined && m.scoreA !== '' && m.scoreB !== undefined && m.scoreB !== '';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: 'max-content', padding: '8px 18px', background: COLORS.yellow, color: COLORS.black, borderTopLeftRadius: '4px', borderTopRightRadius: '4px', border: '1px solid rgba(0,0,0,0.18)', boxShadow: UI.yellowGlow, letterSpacing: '1.6px', fontWeight: 900, fontSize: '13px', textTransform: 'uppercase' }}>
          <span>{m.time ? `TIME // ${m.time}` : 'UPCOMING'}</span>
          {m.stage && <span style={{ opacity: 0.62 }}>| {m.stage}</span>}
        </div>

        <div style={{ width: '640px', background: `linear-gradient(180deg, ${COLORS.panel2} 0%, ${COLORS.panel} 100%)`, border: `2px solid ${COLORS.yellow}`, boxShadow: `${UI.hardShadow}, ${UI.yellowGlow}`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '20px', borderBottom: `1px solid ${COLORS.line}`, background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 20px)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', height: '170px', backgroundColor: m.logoBgA, position: 'relative', overflow: 'hidden' }}>
            <div style={{ width: '170px', height: '170px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.22) 100%)', borderRight: '1px solid rgba(0,0,0,0.12)', boxSizing: 'border-box', padding: '24px', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: '8px', border: '1px solid rgba(0,0,0,0.10)' }} />
              <img src={m.logoA} alt={m.teamA} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', position: 'relative', zIndex: 1 }} onError={(e) => (e.target.style.display = 'none')} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 34px', position: 'relative' }}>
              <span style={{ fontSize: '40px', fontWeight: '900', color: teamNameColor(m.logoBgA), textTransform: 'uppercase', lineHeight: 1.05, letterSpacing: '1px' }}>{m.teamA}</span>
            </div>
          </div>

          <div style={{ height: '68px', background: COLORS.yellow, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '18px', borderTop: `2px solid ${COLORS.black}`, borderBottom: `2px solid ${COLORS.black}`, position: 'relative', boxShadow: UI.bevelInset }}>
            <div style={{ position: 'absolute', inset: '8px 14px', border: '1px solid rgba(0,0,0,0.14)', pointerEvents: 'none' }} />
            {hasScore ? (
              <>
                <span style={{ fontSize: '46px', fontWeight: '900', color: COLORS.black, fontVariantNumeric: 'tabular-nums' }}>{m.scoreA}</span>
                <span style={{ fontSize: '17px', fontWeight: '900', color: 'rgba(42,42,42,0.55)', letterSpacing: '3px', textTransform: 'uppercase' }}>VS</span>
                <span style={{ fontSize: '46px', fontWeight: '900', color: COLORS.black, fontVariantNumeric: 'tabular-nums' }}>{m.scoreB}</span>
              </>
            ) : (
              <span style={{ fontSize: '26px', fontWeight: '900', color: COLORS.black, letterSpacing: '4px', textTransform: 'uppercase' }}>VS</span>
            )}
          </div>

          <div style={{ display: 'flex', height: '170px', backgroundColor: m.logoBgB, position: 'relative', overflow: 'hidden' }}>
            <div style={{ width: '170px', height: '170px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.22) 100%)', borderRight: '1px solid rgba(0,0,0,0.12)', boxSizing: 'border-box', padding: '24px', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: '8px', border: '1px solid rgba(0,0,0,0.10)' }} />
              <img src={m.logoB} alt={m.teamB} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', position: 'relative', zIndex: 1 }} onError={(e) => (e.target.style.display = 'none')} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 34px', position: 'relative' }}>
              <span style={{ fontSize: '40px', fontWeight: '900', color: teamNameColor(m.logoBgB), textTransform: 'uppercase', lineHeight: 1.05, letterSpacing: '1px' }}>{m.teamB}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? (dense ? '10px' : '14px') : '18px', width: compact ? '100%' : '690px' }}>
      {matches.map((m, i) => {
        const hasScore = m.scoreA !== undefined && m.scoreA !== '' && m.scoreB !== undefined && m.scoreB !== '';

        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div style={{ backgroundColor: COLORS.yellow, color: COLORS.black, padding: compact ? (dense ? '4px 10px' : '5px 12px') : '6px 14px', width: 'max-content', fontSize: compact ? (dense ? '10px' : '11px') : '12px', fontWeight: '900', letterSpacing: compact && dense ? '1.1px' : '1.4px', display: 'flex', gap: '8px', borderTopLeftRadius: '4px', borderTopRightRadius: '4px', textTransform: 'uppercase', boxShadow: UI.yellowGlow }}>
              <span>{m.time ? m.time : 'UPCOMING'}</span>
              {m.stage && <span style={{ opacity: 0.62 }}>| {m.stage}</span>}
            </div>

            <div style={{ display: 'flex', height: compact ? (dense ? '64px' : '72px') : '94px', border: `2px solid ${COLORS.yellow}`, background: `linear-gradient(180deg, ${COLORS.panel2} 0%, ${COLORS.panel} 100%)`, boxShadow: compact ? `${UI.panelShadow}, ${UI.yellowGlow}` : `${UI.hardShadow}, ${UI.yellowGlow}`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 24px)', pointerEvents: 'none' }} />

              <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
                <div style={{ width: compact ? (dense ? '58px' : '66px') : '96px', backgroundColor: m.logoBgA, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, position: 'relative', borderRight: '1px solid rgba(0,0,0,0.16)' }}>
                  <div style={{ position: 'absolute', inset: compact ? (dense ? '5px' : '6px') : '8px', border: '1px solid rgba(0,0,0,0.10)' }} />
                  <img src={m.logoA} alt={m.teamA} style={{ height: dense ? '58%' : '62%', maxWidth: dense ? '78%' : '82%', objectFit: 'contain', position: 'relative', zIndex: 1 }} onError={(e) => (e.target.style.display = 'none')} />
                </div>

                <div style={{ flex: 1, backgroundColor: COLORS.black, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: dense ? '0 8px' : '0 12px', overflow: 'hidden', borderLeft: '1px solid rgba(255,255,255,0.03)', boxShadow: UI.insetLine }}>
                  <span style={{ fontSize: compact ? (dense ? '14px' : '16px') : '24px', fontWeight: '900', color: COLORS.white, textTransform: 'uppercase', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', letterSpacing: compact ? (dense ? '0.3px' : '0.5px') : '1px' }}>{m.teamA}</span>
                </div>
              </div>

              <div style={{ width: compact ? (hasScore ? (dense ? '86px' : '98px') : (dense ? '50px' : '58px')) : hasScore ? '138px' : '68px', backgroundColor: COLORS.yellow, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: compact ? (dense ? '6px' : '8px') : '14px', borderLeft: `2px solid ${COLORS.black}`, borderRight: `2px solid ${COLORS.black}`, transition: 'width 0.3s ease', flexShrink: 0, position: 'relative', zIndex: 1, boxShadow: UI.bevelInset }}>
                <div style={{ position: 'absolute', inset: compact ? (dense ? '4px' : '5px') : '7px', border: '1px solid rgba(0,0,0,0.12)' }} />
                {hasScore ? (
                  <>
                    <span style={{ fontSize: compact ? (dense ? '24px' : '28px') : '36px', fontWeight: '900', color: COLORS.black, fontVariantNumeric: 'tabular-nums' }}>{m.scoreA}</span>
                    <span style={{ fontSize: compact ? (dense ? '10px' : '12px') : '14px', fontWeight: '900', color: 'rgba(42,42,42,0.55)', letterSpacing: dense ? '1px' : '2px', textTransform: 'uppercase' }}>VS</span>
                    <span style={{ fontSize: compact ? (dense ? '24px' : '28px') : '36px', fontWeight: '900', color: COLORS.black, fontVariantNumeric: 'tabular-nums' }}>{m.scoreB}</span>
                  </>
                ) : (
                  <span style={{ fontSize: compact ? (dense ? '12px' : '14px') : '16px', fontWeight: '900', color: COLORS.black, letterSpacing: dense ? '2px' : '3px', textTransform: 'uppercase' }}>VS</span>
                )}
              </div>

              <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
                <div style={{ flex: 1, backgroundColor: COLORS.black, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: dense ? '0 8px' : '0 12px', overflow: 'hidden', borderRight: '1px solid rgba(255,255,255,0.03)', boxShadow: UI.insetLine }}>
                  <span style={{ fontSize: compact ? (dense ? '14px' : '16px') : '24px', fontWeight: '900', color: COLORS.white, textTransform: 'uppercase', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', letterSpacing: compact ? (dense ? '0.3px' : '0.5px') : '1px' }}>{m.teamB}</span>
                </div>

                <div style={{ width: compact ? (dense ? '58px' : '66px') : '96px', backgroundColor: m.logoBgB, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, position: 'relative', borderLeft: '1px solid rgba(0,0,0,0.16)' }}>
                  <div style={{ position: 'absolute', inset: compact ? (dense ? '5px' : '6px') : '8px', border: '1px solid rgba(0,0,0,0.10)' }} />
                  <img src={m.logoB} alt={m.teamB} style={{ height: dense ? '58%' : '62%', maxWidth: dense ? '78%' : '82%', objectFit: 'contain', position: 'relative', zIndex: 1 }} onError={(e) => (e.target.style.display = 'none')} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function CountdownScene({ matchData, updateData }) {
  const mode = matchData.countdownMode || 'FULL';
  const videoRef = useRef(null);
  const currentVideo = matchData.activeVideoPath || '';
  const playlist = matchData.videoPlaylist || [];

  const [timeLeft, setTimeLeft] = useState(0);

  // 🚀 终极静音大法：判断当前窗口是不是 OBS 里的 Overlay
  const isOverlay = typeof window !== 'undefined' && window.location.hash === '#overlay';
  const forceMuted = !isOverlay || !!matchData.videoMuted;

  useEffect(() => {
    if (videoRef.current && currentVideo) {
      videoRef.current.muted = forceMuted; // 播放前强行上锁
      videoRef.current.play().catch(err => console.warn('[FCUP_SYS] PiP Autoplay blocked:', err));
    }
  }, [currentVideo, forceMuted]);

  useEffect(() => {
    const timerId = setInterval(() => {
      const target = matchData.targetTimestamp || 0;
      if (target > 0) {
        const remaining = Math.max(0, Math.floor((target - Date.now()) / 1000));
        setTimeLeft(remaining);
      } else {
        setTimeLeft(0);
      }
    }, 100); 
    return () => clearInterval(timerId);
  }, [matchData.targetTimestamp]); 

  const handleVideoEnded = () => {
    if (!playlist || playlist.length <= 1) return;
    const currentIndex = playlist.indexOf(currentVideo);
    let nextIndex = 0;
    if (currentIndex !== -1 && currentIndex < playlist.length - 1) nextIndex = currentIndex + 1;
    if (updateData) updateData({ ...matchData, activeVideoPath: playlist[nextIndex] });
  };

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');

  const upcomingMatches = matchData.upcomingMatches && matchData.upcomingMatches.length > 0 ? matchData.upcomingMatches : [{ teamA: matchData.teamA, logoA: matchData.logoA, logoBgA: matchData.logoBgA, teamB: matchData.teamB, logoB: matchData.logoB, logoBgB: matchData.logoBgB }];
  const activeVideoItem = (matchData.videoLibrary || []).find((v) => v.path === currentVideo);
  const promoName = activeVideoItem ? activeVideoItem.name : 'PROMO';
  const isDenseRightPanel = upcomingMatches.length >= 4;

  return (
    <div style={{ width: '1920px', height: '1080px', background: COLORS.black, position: 'relative', overflow: 'hidden', fontFamily: '"HarmonyOS Sans SC", sans-serif', color: COLORS.white }}>
      <style>{`
        @keyframes slideInLeft { from { opacity: 0; transform: translateX(-60px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(60px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.28; } }
      `}</style>

      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.014) 1px, transparent 1px)', backgroundSize: '120px 120px, 120px 120px', opacity: 0.32 }} />
      <div style={{ position: 'absolute', left: '70px', top: '70px', width: '520px', height: '520px', border: '1px solid rgba(244,195,32,0.07)', transform: 'rotate(45deg)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: '-120px', bottom: '-120px', width: '460px', height: '460px', border: '1px solid rgba(255,255,255,0.03)', transform: 'rotate(45deg)', pointerEvents: 'none' }} />

      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '44px', background: 'rgba(255,255,255,0.02)', borderBottom: `1px solid ${COLORS.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', boxSizing: 'border-box', backdropFilter: 'blur(4px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '10px', height: '10px', background: COLORS.yellow, boxShadow: '0 0 12px rgba(244,195,32,0.28)' }} />
          <span style={{ fontSize: '12px', fontWeight: '900', letterSpacing: '2px', color: COLORS.softWhite }}>FCUP_BROADCAST_INTERFACE</span>
        </div>
        <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '2px', color: 'rgba(255,255,255,0.38)' }}>SIGNAL // STABLE</div>
      </div>

      {mode === 'FULL' && (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 140px', boxSizing: 'border-box' }}>
          <div style={{ willChange: 'opacity, transform', animation: 'slideInLeft 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.08) forwards', display: 'flex', flexDirection: 'column', width: '760px', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '-28px', top: '-18px', width: '2px', height: '420px', background: 'linear-gradient(180deg, rgba(244,195,32,0.60) 0%, rgba(244,195,32,0.08) 100%)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ width: '32px', height: '32px', backgroundColor: COLORS.yellow, boxShadow: '0 0 16px rgba(244,195,32,0.20)' }} />
              <span style={{ fontSize: '36px', fontWeight: '900', color: COLORS.white, letterSpacing: '2.2px', textTransform: 'uppercase' }}>{matchData.infoCupName || 'FRIES CUP'}</span>
            </div>

            <div style={{ fontSize: '15px', fontWeight: '800', color: 'rgba(255,255,255,0.58)', letterSpacing: '2.6px', marginBottom: '34px', textTransform: 'uppercase' }}>{matchData.infoSubtitle || 'BO3 | OPEN QUALIFIER | ROUND 1'}</div>

            <div style={{ fontSize: '18px', fontWeight: '900', color: COLORS.yellow, letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '8px' }}>Broadcast Begins In</div>

            <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '8px', width: 'max-content', padding: '8px 0' }}>
              <div style={{ fontSize: '252px', fontWeight: '900', color: COLORS.white, lineHeight: '0.92', fontVariantNumeric: 'tabular-nums', letterSpacing: '-6px', textShadow: '0 8px 28px rgba(0,0,0,0.22)' }}>
                {minutes}<span style={{ animation: timeLeft > 0 ? 'blink 1s infinite' : 'none', color: COLORS.yellow }}>:</span>{seconds}
              </div>
            </div>

            <div style={{ width: '520px', height: '10px', background: `linear-gradient(90deg, ${COLORS.yellow} 0%, rgba(244,195,32,0.20) 100%)`, border: '1px solid rgba(244,195,32,0.18)', boxShadow: UI.yellowGlow, marginTop: '8px' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '18px' }}>
              <div style={{ width: '8px', height: '8px', background: COLORS.yellow }} />
              <div style={{ fontSize: '22px', fontWeight: '900', color: COLORS.yellow, letterSpacing: '2px', textTransform: 'uppercase' }}>{matchData.matchStageDescription ? matchData.matchStageDescription.toUpperCase() : 'PLEASE STAND BY'}</div>
            </div>

            <div style={{ marginTop: '30px', fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.24)', letterSpacing: '2px', textTransform: 'uppercase', lineHeight: 1.8 }}>
              Scene_Mode // Countdown_Full<br />
              Layout // 1920×1080 Broadcast Safe
            </div>
          </div>

          <div style={{ willChange: 'opacity, transform', animation: 'slideInRight 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.08) 0.14s forwards', opacity: 0 }}>
            <ScheduleBoard matches={upcomingMatches} compact={false} />
          </div>
        </div>
      )}

      {mode === 'VIDEO' && (
        <div style={{ display: 'flex', width: '100%', height: '100%', padding: '0 78px', boxSizing: 'border-box', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ width: '1280px', height: '720px', flexShrink: 0, border: `2px solid ${COLORS.yellow}`, background: '#000', position: 'relative', boxShadow: `${UI.hardShadow}, ${UI.yellowGlow}`, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 14, left: 14, width: 22, height: 22, borderTop: `2px solid ${COLORS.yellow}`, borderLeft: `2px solid ${COLORS.yellow}`, zIndex: 3 }} />
            <div style={{ position: 'absolute', top: 14, right: 14, width: 22, height: 22, borderTop: `2px solid ${COLORS.yellow}`, borderRight: `2px solid ${COLORS.yellow}`, zIndex: 3 }} />
            <div style={{ position: 'absolute', bottom: 14, left: 14, width: 22, height: 22, borderBottom: `2px solid ${COLORS.yellow}`, borderLeft: `2px solid ${COLORS.yellow}`, zIndex: 3 }} />
            <div style={{ position: 'absolute', bottom: 14, right: 14, width: 22, height: 22, borderBottom: `2px solid ${COLORS.yellow}`, borderRight: `2px solid ${COLORS.yellow}`, zIndex: 3 }} />

            {currentVideo ? (
              <video 
                key={currentVideo} // 🚀 终极修复：确保切视频时重置 DOM
                ref={videoRef} 
                src={currentVideo} 
                autoPlay 
                muted={forceMuted} // 🚀 使用强制静音标识
                playsInline
                loop={!playlist || playlist.length <= 1} 
                onEnded={handleVideoEnded} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                onError={(e) => { e.target.style.display = 'none'; }} 
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'rgba(255,255,255,0.26)', fontSize: '24px', fontWeight: '900', letterSpacing: '4px', textTransform: 'uppercase' }}>Promo_Sys // Standby</div>
            )}

            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', boxShadow: 'inset 0 0 80px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(255,255,255,0.04)' }} />
            <div style={{ position: 'absolute', bottom: '22px', left: '22px', backgroundColor: COLORS.yellow, color: COLORS.black, padding: '7px 14px', fontWeight: '900', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.4px', boxShadow: UI.yellowGlow }}>{promoName}</div>
          </div>

          <div style={{ width: '440px', display: 'flex', flexDirection: 'column', gap: isDenseRightPanel ? '16px' : '28px' }}>
            <div style={{ willChange: 'opacity, transform', animation: 'slideInRight 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.08) forwards', background: 'rgba(255,255,255,0.02)', border: UI.outerFrame, boxShadow: `${UI.panelShadow}, inset 0 0 0 1px rgba(255,255,255,0.02)`, padding: isDenseRightPanel ? '18px 20px' : '22px 24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.014) 0 1px, transparent 1px 22px)', pointerEvents: 'none', opacity: 0.55 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 1 }}>
                <div style={{ width: '18px', height: '18px', backgroundColor: COLORS.yellow, boxShadow: '0 0 14px rgba(244,195,32,0.2)' }} />
                <span style={{ fontSize: isDenseRightPanel ? '22px' : '24px', fontWeight: '900', color: COLORS.white, letterSpacing: isDenseRightPanel ? '2px' : '3px', textTransform: 'uppercase' }}>{matchData.infoCupName || 'FRIES CUP'}</span>
              </div>

              <div style={{ fontSize: isDenseRightPanel ? '12px' : '13px', fontWeight: '800', color: 'rgba(255,255,255,0.55)', letterSpacing: '2px', marginTop: '8px', textTransform: 'uppercase', position: 'relative', zIndex: 1 }}>{matchData.infoSubtitle || 'BO3 | OPEN QUALIFIER | ROUND 1'}</div>

              <div style={{ fontSize: isDenseRightPanel ? '94px' : '108px', fontWeight: '900', color: COLORS.white, lineHeight: '0.96', fontVariantNumeric: 'tabular-nums', marginTop: isDenseRightPanel ? '10px' : '14px', letterSpacing: isDenseRightPanel ? '-2px' : '-3px', textShadow: '0 6px 18px rgba(0,0,0,0.2)', position: 'relative', zIndex: 1 }}>{minutes}:{seconds}</div>

              <div style={{ fontSize: isDenseRightPanel ? '16px' : '18px', fontWeight: '900', color: COLORS.yellow, letterSpacing: '2px', textTransform: 'uppercase', marginTop: '8px', position: 'relative', zIndex: 1 }}>{matchData.matchStageDescription || 'PLEASE STAND BY'}</div>

              <div style={{ width: '100%', height: isDenseRightPanel ? '6px' : '8px', marginTop: isDenseRightPanel ? '12px' : '16px', background: `linear-gradient(90deg, ${COLORS.white} 0%, rgba(255,255,255,0.1) 100%)`, border: '1px solid rgba(255,255,255,0.08)', position: 'relative', zIndex: 1 }} />
            </div>

            <div style={{ willChange: 'opacity, transform', animation: 'slideInRight 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.08) 0.16s forwards', opacity: 0 }}>
              <ScheduleBoard matches={upcomingMatches} compact={true} dense={isDenseRightPanel} />
            </div>

            <div style={{ willChange: 'opacity, transform', animation: 'slideInRight 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.08) 0.24s forwards', opacity: 0, background: 'rgba(255,255,255,0.02)', border: UI.outerFrame, padding: isDenseRightPanel ? '12px 14px' : '16px 18px', color: 'rgba(255,255,255,0.26)', fontSize: isDenseRightPanel ? '10px' : '11px', fontWeight: '800', letterSpacing: isDenseRightPanel ? '1.4px' : '1.8px', textTransform: 'uppercase', lineHeight: isDenseRightPanel ? 1.6 : 1.8 }}>
              FCUP_BROADCAST_SYSTEM_V2.0<br />
              Scene_Mode // PiP_Warmup<br />
              Video_State // Synced_Output
            </div>
          </div>
        </div>
      )}
    </div>
  );
}