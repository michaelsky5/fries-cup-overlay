import React from 'react';

const COLORS = {
  black: '#2a2a2a',
  yellow: '#f4c320',
  white: '#ffffff',
  panel: '#141414',
  panel2: '#1a1a1a',
  line: 'rgba(255,255,255,0.08)',
  lineStrong: 'rgba(255,255,255,0.18)',
  softWhite: 'rgba(255,255,255,0.72)',
  faintWhite: 'rgba(255,255,255,0.26)'
};

const UI = {
  outerFrame: `1px solid ${COLORS.lineStrong}`,
  innerFrame: `1px solid ${COLORS.line}`,
  panelShadow: '0 10px 24px rgba(0,0,0,0.22)',
  hardShadow: '0 18px 40px rgba(0,0,0,0.28)',
  yellowGlow: '0 0 0 1px rgba(244,195,32,0.16), 0 0 18px rgba(244,195,32,0.08)',
  insetLine: 'inset 0 0 0 1px rgba(255,255,255,0.04)'
};

// 🌟 新增：冠军专属动效帧
const WINNER_KEYFRAMES = `
  @keyframes fc_cardDrop {
    0% { opacity: 0; transform: scale(1.15) translateY(-40px); filter: blur(10px); }
    100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
  }
  @keyframes fc_bgPan {
    0% { transform: translateX(5%) translateY(14px); }
    100% { transform: translateX(-5%) translateY(14px); }
  }
  @keyframes fc_logoPop {
    0% { opacity: 0; transform: scale(0.6); }
    60% { transform: scale(1.08); }
    100% { opacity: 1; transform: scale(1); }
  }
  @keyframes fc_textSlideUp {
    0% { opacity: 0; transform: translateY(20px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes fc_glowPulse {
    0%, 100% { box-shadow: 0 0 18px rgba(244,195,32,0.08), inset 0 0 0 1px rgba(244,195,32,0.16); }
    50% { box-shadow: 0 0 35px rgba(244,195,32,0.25), inset 0 0 0 1px rgba(244,195,32,0.3); }
  }
  @keyframes fc_gridFade {
    0% { opacity: 0; }
    100% { opacity: 0.24; }
  }
`;

export default function WinnerScene({ matchData = {} }) {
  const winner = matchData?.winnerScene?.winner === 'B' ? 'B' : 'A';
  const winnerName = winner === 'B' ? (matchData.teamB || 'TEAM B') : (matchData.teamA || 'TEAM A');
  const winnerLogo = winner === 'B' ? (matchData.logoB || '') : (matchData.logoA || '');
  const topLabel = matchData?.winnerScene?.title || 'WINNER';

  return (
    <div
      style={{
        width: '1920px',
        height: '1080px',
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(180deg, ${COLORS.black} 0%, #202020 100%)`,
        fontFamily: '"HarmonyOS Sans SC", sans-serif',
        color: COLORS.white
      }}
    >
      <style>{WINNER_KEYFRAMES}</style>

      {/* 背景网格，加入淡入动画 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'linear-gradient(90deg, rgba(255,255,255,0.016) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.012) 1px, transparent 1px)',
          backgroundSize: '120px 120px',
          opacity: 0,
          willChange: 'opacity',
          animation: 'fc_gridFade 1.2s ease forwards'
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: '90px',
          top: '90px',
          width: '520px',
          height: '520px',
          border: '1px solid rgba(244,195,32,0.05)',
          transform: 'rotate(45deg)',
          pointerEvents: 'none'
        }}
      />

      <div
        style={{
          position: 'absolute',
          right: '-80px',
          bottom: '-80px',
          width: '420px',
          height: '420px',
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
          borderBottom: `1px solid ${COLORS.line}`,
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
          <div style={{ width: '10px', height: '10px', background: COLORS.yellow, boxShadow: '0 0 12px rgba(244,195,32,0.28)' }} />
          <span style={{ fontSize: '12px', fontWeight: '900', letterSpacing: '2px', color: COLORS.softWhite }}>
            FCUP_WINNER_INTERFACE
          </span>
        </div>

        <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '2px', color: 'rgba(255,255,255,0.38)' }}>
          RESULT // CONFIRMED
        </div>
      </div>

      {/* 🌟 巨型背景水印，加入无限缓慢平移动画 */}
      <div
        style={{
          position: 'absolute',
          inset: '96px 120px 92px',
          border: UI.outerFrame,
          boxShadow: `${UI.hardShadow}, ${UI.insetLine}`,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.018) 0%, rgba(255,255,255,0.008) 100%)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.01) 0 1px, transparent 1px 24px)',
            opacity: 0.22,
            pointerEvents: 'none'
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${COLORS.yellow} 0%, rgba(244,195,32,0.28) 100%)`,
            boxShadow: UI.yellowGlow
          }}
        />

        <div style={{ position: 'absolute', top: '28px', left: '28px', width: '18px', height: '18px', borderTop: `2px solid ${COLORS.yellow}`, borderLeft: `2px solid ${COLORS.yellow}` }} />
        <div style={{ position: 'absolute', top: '28px', right: '28px', width: '18px', height: '18px', borderTop: `2px solid rgba(255,255,255,0.10)`, borderRight: `2px solid rgba(255,255,255,0.10)` }} />
        <div style={{ position: 'absolute', bottom: '28px', left: '28px', width: '18px', height: '18px', borderBottom: `2px solid rgba(255,255,255,0.10)`, borderLeft: `2px solid rgba(255,255,255,0.10)` }} />
        <div style={{ position: 'absolute', bottom: '28px', right: '28px', width: '18px', height: '18px', borderBottom: `2px solid ${COLORS.yellow}`, borderRight: `2px solid ${COLORS.yellow}` }} />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none'
          }}
        >
          <div
            style={{
              fontSize: '250px',
              fontWeight: '900',
              lineHeight: 0.9,
              letterSpacing: '8px',
              color: 'transparent',
              WebkitTextStroke: '2px rgba(255,255,255,0.08)',
              textTransform: 'uppercase',
              userSelect: 'none',
              willChange: 'transform',
              animation: 'fc_bgPan 30s ease-in-out infinite alternate' // 🌟 缓慢巡游特效
            }}
          >
            WINNER
          </div>
        </div>

        {/* 🌟 冠军主卡片，加入重力砸入动画 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center'
          }}
        >
          <div
            style={{
              width: '760px',
              minHeight: '620px',
              position: 'relative',
              display: 'grid',
              alignContent: 'center',
              justifyItems: 'center',
              gap: '24px',
              padding: '56px 56px 60px',
              boxSizing: 'border-box',
              background: `
                radial-gradient(circle at center, rgba(244,195,32,0.08) 0%, rgba(244,195,32,0.025) 34%, rgba(0,0,0,0) 72%),
                linear-gradient(180deg, rgba(28,28,28,0.96) 0%, rgba(20,20,20,0.98) 100%)
              `,
              border: UI.outerFrame,
              boxShadow: `${UI.hardShadow}, ${UI.insetLine}`,
              opacity: 0,
              willChange: 'transform, opacity, filter',
              animation: 'fc_cardDrop 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards'
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.012) 0 1px, transparent 1px 18px)',
                opacity: 0.12,
                pointerEvents: 'none'
              }}
            />

            <div
              style={{
                position: 'absolute',
                inset: '16px',
                border: '1px solid rgba(255,255,255,0.04)',
                pointerEvents: 'none'
              }}
            />

            <div style={{ position: 'absolute', top: '22px', right: '22px', width: '34px', height: '2px', background: 'rgba(255,255,255,0.16)' }} />
            <div style={{ position: 'absolute', top: '28px', right: '22px', width: '18px', height: '2px', background: 'rgba(255,255,255,0.10)' }} />

            <div
              style={{
                position: 'absolute',
                left: '22px',
                top: '22px',
                bottom: '22px',
                width: '1px',
                background: 'linear-gradient(180deg, rgba(244,195,32,0.26) 0%, rgba(244,195,32,0.02) 100%)'
              }}
            />

            <div
              style={{
                position: 'relative',
                zIndex: 2,
                fontSize: '13px',
                fontWeight: '900',
                color: COLORS.softWhite,
                letterSpacing: '2.4px',
                textTransform: 'uppercase',
                opacity: 0,
                willChange: 'transform, opacity',
                animation: 'fc_textSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards'
              }}
            >
              {topLabel}
            </div>

            <div
              style={{
                position: 'relative',
                zIndex: 2,
                fontSize: '88px',
                fontWeight: '900',
                color: COLORS.yellow,
                lineHeight: 0.9,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                textShadow: '0 0 20px rgba(244,195,32,0.12)',
                opacity: 0,
                willChange: 'transform, opacity',
                animation: 'fc_textSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards'
              }}
            >
              WINNER
            </div>

            {/* 🌟 冠军队伍 Logo，加入爆点缩放动画和呼吸灯 */}
            <div
              style={{
                position: 'relative',
                zIndex: 2,
                width: '228px',
                height: '228px',
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid rgba(244,195,32,0.16)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                willChange: 'transform, opacity, box-shadow',
                animation: `
                  fc_logoPop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s forwards,
                  fc_glowPulse 3s ease-in-out 1.3s infinite
                ` // 弹出后衔接呼吸灯
              }}
            >
              {winnerLogo ? (
                <img
                  src={winnerLogo}
                  alt={winnerName}
                  style={{
                    width: '78%',
                    height: '78%',
                    objectFit: 'contain',
                    display: 'block'
                  }}
                />
              ) : (
                <div style={{ fontSize: '28px', fontWeight: '900', color: COLORS.white, letterSpacing: '2px' }}>
                  LOGO
                </div>
              )}
            </div>

            <div
              style={{
                position: 'relative',
                zIndex: 2,
                maxWidth: '100%',
                fontSize: '56px',
                fontWeight: '900',
                color: COLORS.white,
                lineHeight: 1.02,
                letterSpacing: '0.6px',
                textTransform: 'uppercase',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                textShadow: '0 4px 18px rgba(0,0,0,0.25)',
                opacity: 0,
                willChange: 'transform, opacity',
                animation: 'fc_textSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.6s forwards'
              }}
            >
              {winnerName}
            </div>

            <div
              style={{
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginTop: '2px',
                opacity: 0,
                willChange: 'transform, opacity',
                animation: 'fc_textSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.7s forwards'
              }}
            >
              <div style={{ width: '8px', height: '8px', background: COLORS.yellow }} />
              <div style={{ fontSize: '13px', fontWeight: '900', color: COLORS.yellow, letterSpacing: '2px', textTransform: 'uppercase' }}>
                Victory Confirmed
              </div>
              <div style={{ width: '8px', height: '8px', background: COLORS.yellow }} />
            </div>

            <div
              style={{
                position: 'relative',
                zIndex: 2,
                width: '380px',
                height: '10px',
                background: `linear-gradient(90deg, ${COLORS.yellow} 0%, rgba(244,195,32,0.20) 100%)`,
                border: '1px solid rgba(244,195,32,0.18)',
                boxShadow: UI.yellowGlow,
                marginTop: '2px',
                opacity: 0,
                willChange: 'transform, opacity',
                animation: 'fc_textSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.8s forwards'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}