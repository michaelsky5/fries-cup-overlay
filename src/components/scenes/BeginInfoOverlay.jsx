import React, { useEffect, useMemo, useState, useRef } from 'react';

const OVERLAY_STYLE = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  // 🌟 注入独立的高性能 CSS 动画引擎
  animation: 'overlayBgFade 0.4s ease forwards',
  willChange: 'opacity'
};

const colors = {
  bg: '#2a2a2a',
  panel: 'rgba(20,20,20,0.94)',
  panel2: 'rgba(28,28,28,0.96)',
  line: 'rgba(255,255,255,0.08)',
  lineStrong: 'rgba(255,255,255,0.18)',
  yellow: '#f4c320',
  white: '#ffffff',
  softWhite: 'rgba(255,255,255,0.72)',
  faintWhite: 'rgba(255,255,255,0.26)',
  black: '#000000',
  banRed: '#ff4d4d'
};

const getMapLabel = matchData => {
  if (matchData.currentMapLabel) return matchData.currentMapLabel;
  if (typeof matchData.currentMap === 'number') return `MAP ${matchData.currentMap}`;
  if (typeof matchData.mapNumber === 'number') return `MAP ${matchData.mapNumber}`;
  if (typeof matchData.currentMapIndex === 'number') return `MAP ${matchData.currentMapIndex + 1}`;
  if (typeof matchData.mapIndex === 'number') return `MAP ${matchData.mapIndex + 1}`;
  return 'MAP 1';
};

function TechCorner({ top = true, left = true, color = colors.yellow }) {
  return (
    <div
      style={{
        position: 'absolute',
        [top ? 'top' : 'bottom']: 18,
        [left ? 'left' : 'right']: 18,
        width: 18,
        height: 18,
        pointerEvents: 'none',
        zIndex: 5
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, width: 18, height: 2, background: color }} />
      <div style={{ position: 'absolute', top: 0, left: 0, width: 2, height: 18, background: color }} />
    </div>
  );
}

function TeamBlock({ logo, name, align = 'left', phase }) {
  const isLeft = align === 'left';
  
  // 🌟 核心修复：完全舍弃 transition，改用 CSS animation
  let animationName = 'none';
  if (phase === 'show') {
    animationName = isLeft ? 'blockSlideInLeft 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.1s forwards' : 'blockSlideInRight 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.1s forwards';
  } else if (phase === 'exit') {
    animationName = 'blockSlideOut 0.3s ease-in forwards';
  }

  return (
    <div
      style={{
        position: 'relative',
        minWidth: 0,
        display: 'grid',
        gap: 16,
        justifyItems: isLeft ? 'start' : 'end',
        opacity: 0, // 初始透明
        animation: animationName,
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden' // 🌟 榨干显卡
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexDirection: isLeft ? 'row' : 'row-reverse' }}>
        <div
          style={{
            width: 124, height: 124, background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${colors.lineStrong}`, display: 'flex', alignItems: 'center',
            justifyContent: 'center', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)'
          }}
        >
          {logo ? (
            <img src={logo} alt={name} style={{ width: '78%', height: '78%', objectFit: 'contain', display: 'block' }} />
          ) : (
            <div style={{ color: colors.softWhite, fontWeight: 800, fontSize: 18, letterSpacing: 1.2 }}>LOGO</div>
          )}
        </div>

        <div style={{ display: 'grid', gap: 8, textAlign: isLeft ? 'left' : 'right', minWidth: 0 }}>
          <div
            style={{
              color: colors.white, fontWeight: 900, fontSize: 34, lineHeight: 1, letterSpacing: 0.4,
              textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden',
              textOverflow: 'ellipsis', maxWidth: 360,
              textShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}
          >
            {name || 'TEAM'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BeginInfoOverlay({
  matchData,
  triggerAt,
  duration = 2200, // 🌟 广电标准建议延长至 2200ms
  onFinish
}) {
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState('idle');

  // 【数据流优化】：防止 React 组件卸载引起的回调丢失
  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  const forceVisible = !!matchData?.beginInfoVisible;

  useEffect(() => {
    if (!forceVisible) return;
    setVisible(true);
    setPhase('show'); // 强制模式直接显示，不需要 enter 状态
  }, [forceVisible]);

  useEffect(() => {
    if (triggerAt === undefined || triggerAt === null) return;
    if (forceVisible) return;

    // 🛑 核心修复：如果控制台的 AUTO BEGIN 是关闭状态，直接拦截！
    if (matchData?.beginInfoEnabled === false) return;

    // 🌟 核心修复：简化生命周期，不再需要极短的 'enter' 状态引起 transition 跳动
    setVisible(true);
    setPhase('show'); // 直接设为 show，触发进场 CSS Animation

    // 只保留出场和结束计时器
    const exitTimer = setTimeout(() => setPhase('exit'), Math.max(700, duration - 420));
    const doneTimer = setTimeout(() => {
      setVisible(false);
      setPhase('idle');
      onFinishRef.current?.();
    }, duration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [triggerAt, duration, forceVisible, matchData?.beginInfoEnabled]); // 👈 别忘了把开关加进依赖数组里

  const mapLabel = useMemo(() => getMapLabel(matchData), [matchData]);

  if (!visible && !forceVisible) return null;

  // 🌟 核心修复：完全舍弃 inline transition，改用 CSS animation
  let animationName = 'none';
  if (phase === 'show') {
    animationName = 'panelSlideIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards';
  } else if (phase === 'exit') {
    animationName = 'panelSlideOut 0.4s ease-in forwards';
  }

  // VS 文本动画
  const vsAnimation = phase === 'show' ? 'vsPopIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards' : 'none';

  return (
    <div style={OVERLAY_STYLE}>
      {/* 🌟 注入纯 CSS 动画引擎：单向播放，绝对防抽搐 */}
      <style>{`
        @keyframes overlayBgFade {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes panelSlideIn {
          0% { opacity: 0; transform: translate3d(0, 18px, 0) scale(0.988); }
          100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
        }
        @keyframes panelSlideOut {
          0% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
          100% { opacity: 0; transform: translate3d(0, -12px, 0) scale(0.99); }
        }
        @keyframes blockSlideInLeft {
          0% { opacity: 0; transform: translate3d(-30px, 0, 0); }
          100% { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes blockSlideInRight {
          0% { opacity: 0; transform: translate3d(30px, 0, 0); }
          100% { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes blockSlideOut {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.96); }
        }
        @keyframes vsPopIn {
          0% { opacity: 0; transform: translateY(15px) scale(0.8); }
          100% { opacity: 1; transform: translateY(6px) scale(1); }
        }
        @keyframes centerTextPop {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        style={{
          width: '78%', maxWidth: 1480, minHeight: 308, position: 'relative',
          background: `radial-gradient(circle at center, rgba(244,195,32,0.06) 0%, rgba(244,195,32,0.015) 32%, rgba(0,0,0,0) 76%), linear-gradient(180deg, ${colors.panel2} 0%, ${colors.panel} 100%)`,
          border: `1px solid ${colors.lineStrong}`, boxShadow: '0 24px 64px rgba(0,0,0,0.42), inset 0 0 0 1px rgba(255,255,255,0.04)',
          overflow: 'hidden',
          animation: animationName,
          willChange: 'transform, opacity',
          backfaceVisibility: 'hidden' // 🌟 榨干显卡
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.010) 1px, transparent 1px)', backgroundSize: '72px 72px', opacity: 0.16, pointerEvents: 'none' }} />
        
        {/* VS 背景文本 */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ 
            fontSize: 220, fontWeight: 900, lineHeight: 0.9, letterSpacing: 8, color: 'transparent', WebkitTextStroke: '2px rgba(255,255,255,0.06)', textTransform: 'uppercase', userSelect: 'none', 
            opacity: 0,
            animation: vsAnimation, 
            willChange: 'transform, opacity' 
          }}>
            VS
          </div>
        </div>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${colors.yellow} 0%, rgba(244,195,32,0.28) 100%)`, boxShadow: '0 0 0 1px rgba(244,195,32,0.16), 0 0 18px rgba(244,195,32,0.08)' }} />

        <TechCorner top left />
        <TechCorner top left={false} color="rgba(255,255,255,0.12)" />
        <TechCorner top={false} left color="rgba(255,255,255,0.12)" />
        <TechCorner top={false} left={false} />

        <div style={{ position: 'absolute', inset: 16, border: `1px solid ${colors.line}`, pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 2, display: 'grid', gridTemplateColumns: '1fr 0.9fr 1fr', gap: 34, alignItems: 'center', minHeight: 308, padding: '38px 42px' }}>
          <TeamBlock logo={matchData.logoA} name={matchData.teamA} align="left" phase={phase} />

          {/* 中央信息区 */}
          <div style={{ 
            display: 'grid', justifyItems: 'center', alignContent: 'center', gap: 14,
            opacity: 0,
            animation: phase === 'show' ? 'centerTextPop 0.4s ease-out 0.15s forwards' : phase === 'exit' ? 'blockSlideOut 0.3s ease-in forwards' : 'none',
            willChange: 'transform, opacity'
          }}>
            <div style={{ color: colors.softWhite, fontWeight: 800, fontSize: 13, letterSpacing: 2.2, textTransform: 'uppercase' }}>MATCH INFO</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 20, width: '100%' }}>
              <div style={{ textAlign: 'right', color: colors.white, fontWeight: 900, fontSize: 92, lineHeight: 0.9 }}>{matchData.scoreA ?? 0}</div>
              <div style={{ display: 'grid', justifyItems: 'center', gap: 10 }}>
                <div style={{ color: colors.yellow, fontWeight: 900, fontSize: 30, letterSpacing: 1.6, textShadow: '0 0 12px rgba(244,195,32,0.4)' }}>VS</div>
                <div style={{ minWidth: 122, height: 36, padding: '0 16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(244,195,32,0.12)', border: '1px solid rgba(244,195,32,0.26)', color: colors.white, fontWeight: 900, fontSize: 15, letterSpacing: 1.4, textTransform: 'uppercase' }}>{mapLabel}</div>
              </div>
              <div style={{ textAlign: 'left', color: colors.white, fontWeight: 900, fontSize: 92, lineHeight: 0.9 }}>{matchData.scoreB ?? 0}</div>
            </div>
            <div style={{ width: 220, height: 4, background: 'linear-gradient(90deg, rgba(244,195,32,0.00) 0%, rgba(244,195,32,0.92) 50%, rgba(244,195,32,0.00) 100%)', boxShadow: '0 0 8px rgba(244,195,32,0.2)' }} />
          </div>

          <TeamBlock logo={matchData.logoB} name={matchData.teamB} align="right" phase={phase} />
        </div>
      </div>
    </div>
  );
}