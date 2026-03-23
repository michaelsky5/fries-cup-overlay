import React from 'react';

const COLORS = {
  yellow: '#f4c320',
  black: '#2a2a2a',
  deepBlack: '#101010',
  white: '#ffffff',
  softWhite: 'rgba(255,255,255,0.72)',
  line: 'rgba(255,255,255,0.08)',
  lineStrong: 'rgba(255,255,255,0.18)'
};

// 🌟 性能优化 1：将庞大的关键帧动画静态化、外置化
// 避免每次组件挂载时 React 重新拼接字符串，也避免浏览器反复重算 CSSOM 树
const STINGER_KEYFRAMES = `
  @keyframes fc_baseOut {
    0%, 84% { opacity: 1; }
    100% { opacity: 0; }
  }

  @keyframes fc_grid {
    0% { opacity: 0; }
    16%, 72% { opacity: 0.18; }
    100% { opacity: 0; }
  }

  @keyframes fc_topLine {
    0% { opacity: 0; transform: translateX(-18%); }
    20%, 58% { opacity: 1; transform: translateX(0); }
    100% { opacity: 0; transform: translateX(18%); }
  }

  @keyframes fc_bottomLine {
    0% { opacity: 0; transform: translateX(18%) skewX(-16deg); }
    22%, 60% { opacity: 1; transform: translateX(0) skewX(-16deg); }
    100% { opacity: 0; transform: translateX(-18%) skewX(-16deg); }
  }

  @keyframes fc_panelLeft {
    0% { transform: translateX(-125%) skewX(-16deg); }
    20% { transform: translateX(0) skewX(-16deg); }
    46% { transform: translateX(0) skewX(-16deg); }
    100% { transform: translateX(-125%) skewX(-16deg); }
  }

  @keyframes fc_panelRight {
    0% { transform: translateX(125%) skewX(-16deg); }
    20% { transform: translateX(0) skewX(-16deg); }
    46% { transform: translateX(0) skewX(-16deg); }
    100% { transform: translateX(125%) skewX(-16deg); }
  }

  @keyframes fc_accentLeft {
    0% { transform: translateX(-145%) skewX(-16deg); }
    24% { transform: translateX(0) skewX(-16deg); }
    42% { transform: translateX(0) skewX(-16deg); }
    100% { transform: translateX(-145%) skewX(-16deg); }
  }

  @keyframes fc_accentRight {
    0% { transform: translateX(145%) skewX(-16deg); }
    26% { transform: translateX(0) skewX(-16deg); }
    44% { transform: translateX(0) skewX(-16deg); }
    100% { transform: translateX(145%) skewX(-16deg); }
  }

  @keyframes fc_plate {
    0%, 10% { opacity: 0; transform: translate(-50%, -50%) scale(0.96); }
    24% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    62% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    100% { opacity: 0; transform: translate(-50%, -50%) scale(1.02); }
  }

  @keyframes fc_logoMask {
    0%, 18% { transform: scaleX(1); opacity: 1; }
    34% { transform: scaleX(0.18); opacity: 1; }
    56% { transform: scaleX(0); opacity: 0; }
    100% { transform: scaleX(0); opacity: 0; }
  }

  @keyframes fc_logo {
    0%, 18% { opacity: 0; transform: scale(1.06); }
    34% { opacity: 1; transform: scale(1.01); }
    56% { opacity: 1; transform: scale(1); }
    78% { opacity: 1; transform: scale(1); }
    100% { opacity: 0; transform: scale(1.03); }
  }

  @keyframes fc_sysTextIn {
    0%, 18% { opacity: 0; transform: translateY(6px); }
    34%, 74% { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(6px); }
  }
`;

export default function StingerTransition({
  isActive,
  logoPath,
  divisionLabel = 'OVERWATCH',
  duration = 850
}) {
  if (!isActive) return null;

  const dur = `${duration}ms`;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 9999,
        pointerEvents: 'none',
        overflow: 'hidden',
        fontFamily: '"HarmonyOS Sans SC", sans-serif'
      }}
    >
      <style>{STINGER_KEYFRAMES}</style>

      {/* 🌟 性能优化 2：全方位加入 willChange 开启 GPU 独立图层 */}

      {/* 底层遮罩 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: COLORS.black,
          willChange: 'opacity',
          animation: `fc_baseOut ${dur} linear forwards`
        }}
      />

      {/* 轻量系统网格 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.014) 1px, transparent 1px)',
          backgroundSize: '128px 128px',
          opacity: 0,
          willChange: 'opacity',
          animation: `fc_grid ${dur} ease forwards`
        }}
      />

      {/* 顶部横向扫描线 */}
      <div
        style={{
          position: 'absolute',
          top: '18%',
          left: 0,
          width: '100%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 20%, rgba(255,255,255,0.36) 50%, rgba(255,255,255,0.08) 80%, transparent 100%)',
          opacity: 0,
          willChange: 'opacity, transform',
          animation: `fc_topLine ${dur} cubic-bezier(0.16, 1, 0.3, 1) forwards`
        }}
      />

      {/* 主切板：黑 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '-16%',
          width: '54%',
          height: '100%',
          background: COLORS.black,
          transform: 'skewX(-16deg)',
          willChange: 'transform',
          animation: `fc_panelLeft ${dur} cubic-bezier(0.16, 1, 0.3, 1) forwards`
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: '-16%',
          width: '54%',
          height: '100%',
          background: COLORS.black,
          transform: 'skewX(-16deg)',
          willChange: 'transform',
          animation: `fc_panelRight ${dur} cubic-bezier(0.16, 1, 0.3, 1) forwards`
        }}
      />

      {/* 主切板：黄 accent */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '-20%',
          width: '18%',
          height: '100%',
          background: COLORS.yellow,
          transform: 'skewX(-16deg)',
          boxShadow: '0 0 0 1px rgba(244,195,32,0.14), 0 0 18px rgba(244,195,32,0.08)',
          willChange: 'transform',
          animation: `fc_accentLeft ${dur} cubic-bezier(0.16, 1, 0.3, 1) forwards`
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: '-20%',
          width: '18%',
          height: '100%',
          background: COLORS.yellow,
          transform: 'skewX(-16deg)',
          boxShadow: '0 0 0 1px rgba(244,195,32,0.14), 0 0 18px rgba(244,195,32,0.08)',
          willChange: 'transform',
          animation: `fc_accentRight ${dur} cubic-bezier(0.16, 1, 0.3, 1) forwards`
        }}
      />

      {/* 中央承载牌面 */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 'min(78vw, 980px)',
          height: 'min(38vw, 480px)',
          transform: 'translate(-50%, -50%)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.00) 100%)',
          borderTop: `1px solid ${COLORS.lineStrong}`,
          borderBottom: `1px solid ${COLORS.line}`,
          opacity: 0,
          willChange: 'opacity, transform',
          animation: `fc_plate ${dur} cubic-bezier(0.16, 1, 0.3, 1) forwards`
        }}
      >
        {/* 牌面顶部细线 */}
        <div
          style={{
            position: 'absolute',
            left: '4%',
            right: '4%',
            top: '12%',
            height: '2px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 12%, rgba(244,195,32,0.95) 50%, rgba(255,255,255,0.15) 88%, transparent 100%)',
            opacity: 0.9
          }}
        />

        {/* 左上角标签 */}
        <div
          style={{
            position: 'absolute',
            left: '4%',
            top: '4%',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            opacity: 0,
            willChange: 'opacity, transform',
            animation: `fc_sysTextIn ${dur} ease forwards`
          }}
        >
          <div style={{ width: '8px', height: '8px', background: COLORS.yellow }} />
          <span style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '2px', color: COLORS.softWhite }}>
            FRIES CUP // LIVE TRANSITION
          </span>
        </div>

        {/* 右下角比赛类型 */}
        <div
          style={{
            position: 'absolute',
            right: '4%',
            bottom: '6%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            opacity: 0,
            willChange: 'opacity, transform',
            animation: `fc_sysTextIn ${dur} ease forwards`
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '2px', color: COLORS.softWhite }}>
            DIVISION
          </span>
          <div style={{ width: '32px', height: '1px', background: 'rgba(255,255,255,0.28)' }} />
          <span style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '2px', color: COLORS.yellow }}>
            {divisionLabel}
          </span>
        </div>

        {/* Logo reveal 容器 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}
        >
          {/* 横向 reveal 遮罩层 */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: COLORS.black,
              transformOrigin: 'center',
              willChange: 'opacity, transform',
              animation: `fc_logoMask ${dur} cubic-bezier(0.16, 1, 0.3, 1) forwards`
            }}
          />

          {/* Logo 本体 */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              opacity: 0,
              willChange: 'opacity, transform',
              animation: `fc_logo ${dur} cubic-bezier(0.16, 1, 0.3, 1) forwards`
            }}
          >
            <img
              src={logoPath}
              alt="fries-cup-logo"
              onError={e => (e.target.style.display = 'none')}
              style={{
                width: 'min(74vw, 980px)',
                maxHeight: 'min(44vw, 520px)',
                objectFit: 'contain',
                filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.35))'
              }}
            />
          </div>
        </div>
      </div>

      {/* 底部辅助亮线 */}
      <div
        style={{
          position: 'absolute',
          bottom: '18%',
          left: '-10%',
          width: '120%',
          height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 20%, rgba(255,255,255,0.32) 50%, rgba(255,255,255,0.08) 80%, transparent 100%)',
          opacity: 0,
          transform: 'skewX(-16deg)',
          willChange: 'opacity, transform',
          animation: `fc_bottomLine ${dur} cubic-bezier(0.16, 1, 0.3, 1) forwards`
        }}
      />
    </div>
  );
}