import React, { useEffect, useMemo, useState } from 'react';

const COLORS = {
  black: '#2a2a2a',
  panel: '#141414',
  panel2: '#1a1a1a',
  yellow: '#f4c320',
  white: '#ffffff',
  softWhite: 'rgba(255,255,255,0.72)',
  faintWhite: 'rgba(255,255,255,0.26)',
  line: 'rgba(255,255,255,0.08)',
  lineStrong: 'rgba(255,255,255,0.18)'
};

const UI = {
  outerFrame: `1px solid ${COLORS.lineStrong}`,
  innerFrame: `1px solid ${COLORS.line}`,
  hardShadow: '0 18px 40px rgba(0,0,0,0.28)',
  yellowGlow: '0 0 0 1px rgba(244,195,32,0.16), 0 0 18px rgba(244,195,32,0.08)',
  insetLine: 'inset 0 0 0 1px rgba(255,255,255,0.04)'
};

const getBanInfo = bans => {
  const raw = bans?.[0] || '';
  if (!raw) return { role: 'damage', hero: 'tbd' };
  if (!raw.includes('/')) return { role: 'damage', hero: raw };
  const [role, hero] = raw.split('/');
  return { role: role || 'damage', hero: hero || 'tbd' };
};

const normalizeRole = role => {
  if (!role) return 'BAN STATUS';
  if (role === 'damage') return 'DAMAGE';
  if (role === 'support') return 'SUPPORT';
  if (role === 'tank') return 'TANK';
  return String(role).toUpperCase();
};

const getScreenshotPath = banInfo => {
  if (!banInfo?.hero || !banInfo?.role || banInfo.hero === 'tbd') return '';
  return `/assets/roster/${banInfo.role}/${banInfo.hero}.png`;
};

const getFallbackPortraitPath = banInfo => {
  if (!banInfo?.hero || !banInfo?.role || banInfo.hero === 'tbd') return '';
  return `/assets/heroes/${banInfo.role}/${banInfo.hero}.png`;
};

function TechCorner({ top = true, left = true, color = COLORS.yellow }) {
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

function OrderBadge({ order = 1, side = 'left' }) {
  const isLeft = side === 'left';
  return (
    <div
      style={{
        position: 'absolute',
        top: 22,
        [isLeft ? 'left' : 'right']: 22,
        zIndex: 8,
        display: 'flex',
        alignItems: 'stretch',
        boxShadow: '0 8px 18px rgba(0,0,0,0.24)'
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          background: COLORS.yellow,
          color: COLORS.black,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 900,
          fontSize: 22,
          lineHeight: 1
        }}
      >
        {order}
      </div>
      <div
        style={{
          width: 12,
          height: 42,
          background: 'rgba(244,195,32,0.14)',
          borderTop: `1px solid ${COLORS.yellow}`,
          borderBottom: `1px solid ${COLORS.yellow}`,
          borderRight: isLeft ? `1px solid ${COLORS.yellow}` : 'none',
          borderLeft: !isLeft ? `1px solid ${COLORS.yellow}` : 'none'
        }}
      />
    </div>
  );
}

function PendingState() {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
      <div style={{ display: 'grid', gap: 16, justifyItems: 'center' }}>
        <div style={{ color: COLORS.yellow, fontWeight: 900, fontSize: 52, letterSpacing: 1.2, lineHeight: 1, textTransform: 'uppercase', textShadow: '0 0 18px rgba(244,195,32,0.10)' }}>
          Pending
        </div>
        <div style={{ width: 240, height: 4, background: 'linear-gradient(90deg, rgba(244,195,32,0.00) 0%, rgba(244,195,32,0.92) 50%, rgba(244,195,32,0.00) 100%)' }} />
        <div style={{ color: COLORS.softWhite, fontWeight: 900, fontSize: 13, letterSpacing: 2.2, textTransform: 'uppercase' }}>
          Waiting For Ban
        </div>
      </div>
    </div>
  );
}

function TeamBanCard({ side = 'left', order = 1, teamName, banInfo, reveal = false }) {
  const isLeft = side === 'left';
  const heroName = banInfo?.hero || 'tbd';
  const roleLabel = normalizeRole(banInfo?.role);
  const isTbd = heroName === 'tbd';

  const [imgSrc, setImgSrc] = useState(getScreenshotPath(banInfo));

  useEffect(() => setImgSrc(getScreenshotPath(banInfo)), [banInfo?.hero, banInfo?.role]);

  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        background: `
          radial-gradient(circle at center, rgba(244,195,32,0.05) 0%, rgba(244,195,32,0.015) 30%, rgba(0,0,0,0) 76%),
          linear-gradient(180deg, rgba(28,28,28,0.96) 0%, rgba(18,18,18,0.98) 100%)
        `,
        border: UI.outerFrame,
        boxShadow: `${UI.hardShadow}, ${UI.insetLine}`,
        overflow: 'hidden'
      }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.01) 0 1px, transparent 1px 18px)', opacity: 0.14, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${COLORS.yellow} 0%, rgba(244,195,32,0.28) 100%)`, boxShadow: UI.yellowGlow, zIndex: 6 }} />
      <div style={{ position: 'absolute', inset: 12, border: `1px solid ${COLORS.line}`, pointerEvents: 'none' }} />

      <TechCorner top left={isLeft} />
      <TechCorner top left={!isLeft} color="rgba(255,255,255,0.12)" />
      <OrderBadge order={order} side={side} />

      <div style={{ position: 'absolute', top: 26, [isLeft ? 'right' : 'left']: 40, zIndex: 7, textAlign: isLeft ? 'right' : 'left' }}>
        <div style={{ color: COLORS.white, fontSize: 45, fontWeight: 900, lineHeight: 1.3, letterSpacing: 1, textTransform: 'uppercase', maxWidth: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '0 2px 8px rgba(0,0,0,0.22)' }}>
          {teamName || 'TEAM'}
        </div>
      </div>

      <div style={{ position: 'absolute', top: 102, left: 18, right: 18, bottom: 104, overflow: 'hidden', border: `1px solid rgba(255,255,255,0.05)`, background: isTbd ? 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.00) 100%)' : 'transparent' }}>
        {!isTbd ? (
          <>
            {/* 🌟 核心修复 1：将双向 transition 替换为单向播放的 animation，彻底消灭倒放闪烁 */}
            <img
              src={imgSrc}
              alt={heroName}
              onError={() => setImgSrc(getFallbackPortraitPath(banInfo))}
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
                opacity: reveal ? 1 : 0,
                transform: reveal ? 'scale(1.03)' : 'scale(1.08)',
                filter: reveal ? 'blur(0px)' : 'blur(8px)',
                animation: reveal ? 'banCardRevealImg 860ms cubic-bezier(.2,.8,.2,1) forwards' : 'none',
                willChange: 'transform, opacity, filter',
                backfaceVisibility: 'hidden'
              }}
            />

            <div style={{ position: 'absolute', inset: 0, background: isLeft ? 'linear-gradient(90deg, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.34) 30%, rgba(0,0,0,0.12) 100%)' : 'linear-gradient(270deg, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.34) 30%, rgba(0,0,0,0.12) 100%)' }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.016) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)', backgroundSize: '52px 52px', opacity: 0.18 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.00) 18%, rgba(255,255,255,0.00) 100%)' }} />

            {/* 🌟 核心修复 2：扫光层改为 animation forwards，保证触发时只往右边扫一次 */}
            <div
              style={{
                position: 'absolute', top: 0, bottom: 0, width: '24%',
                background: 'linear-gradient(90deg, rgba(255,255,255,0.00) 0%, rgba(255,255,255,0.14) 50%, rgba(255,255,255,0.00) 100%)',
                transform: 'translateX(-120%)',
                animation: reveal ? 'banCardSweep 760ms cubic-bezier(.2,.8,.2,1) 140ms forwards' : 'none',
                mixBlendMode: 'screen', pointerEvents: 'none',
                willChange: 'transform',
                backfaceVisibility: 'hidden'
              }}
            />

            <div style={{ position: 'absolute', [isLeft ? 'left' : 'right']: 18, top: 18, width: 84, height: 3, background: COLORS.yellow, opacity: 0.9 }} />
            <div style={{ position: 'absolute', [isLeft ? 'left' : 'right']: 18, bottom: 92, width: 3, height: 58, background: COLORS.yellow, opacity: 0.9 }} />
          </>
        ) : (
          <PendingState />
        )}
      </div>

      {/* 底部信息栏 */}
      <div style={{ position: 'absolute', left: 18, right: 18, bottom: 18, minHeight: 78, background: 'linear-gradient(180deg, rgba(24,24,24,0.98) 0%, rgba(16,16,16,0.99) 100%)', borderTop: `2px solid ${COLORS.yellow}`, borderLeft: `1px solid ${COLORS.line}`, borderRight: `1px solid ${COLORS.line}`, borderBottom: `1px solid ${COLORS.line}`, display: 'grid', alignContent: 'center', padding: '12px 16px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)' }}>
        <div style={{ display: 'grid', gap: 4, justifyItems: isLeft ? 'start' : 'end' }}>
          <div style={{ color: COLORS.softWhite, fontSize: 11, fontWeight: 800, letterSpacing: 1.4, textTransform: 'uppercase' }}>
            {isTbd ? 'Ban Status' : roleLabel}
          </div>
          <div style={{ color: COLORS.white, fontSize: 42, fontWeight: 900, lineHeight: 0.94, letterSpacing: 0.45, textTransform: 'uppercase', textAlign: isLeft ? 'left' : 'right' }}>
            {isTbd ? 'Pending' : heroName}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BanPhaseScene({ matchData, triggerAt }) {
  const [visible, setVisible] = useState(false);
  const [revealA, setRevealA] = useState(false);
  const [revealB, setRevealB] = useState(false);

  const banA = useMemo(() => getBanInfo(matchData?.bansA), [matchData?.bansA]);
  const banB = useMemo(() => getBanInfo(matchData?.bansB), [matchData?.bansB]);
  const orderMode = matchData?.banOrderMode || 'A_FIRST';
  const isAFirst = orderMode === 'A_FIRST';

  useEffect(() => {
    if (!triggerAt) return;
    setVisible(true);
  }, [triggerAt]);

  useEffect(() => {
    if (!triggerAt) return;

    setRevealA(false);
    setRevealB(false);

    const t1 = setTimeout(() => {
      if (isAFirst) setRevealA(true);
      else setRevealB(true);
    }, 260);

    const t2 = setTimeout(() => {
      if (isAFirst) setRevealB(true);
      else setRevealA(true);
    }, 980);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [triggerAt, isAFirst]);

  if (!visible) return null;

  const orderA = isAFirst ? 1 : 2;
  const orderB = isAFirst ? 2 : 1;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: `linear-gradient(180deg, ${COLORS.black} 0%, #202020 100%)`,
        animation: 'banSceneBgFade 0.4s ease forwards', // 🌟 增加全场景的柔和渐入
        willChange: 'opacity'
      }}
    >
      {/* 🌟 注入独立的高性能 CSS 引擎 */}
      <style>{`
        @keyframes banSceneBgFade {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes banTextDrop {
          0% { opacity: 0; transform: translateY(-40px) scale(1.05); }
          100% { opacity: 1; transform: translateY(-8px) scale(1); }
        }
        @keyframes banCardRevealImg {
          0% { opacity: 0; transform: scale(1.08); filter: blur(8px); }
          100% { opacity: 1; transform: scale(1.03); filter: blur(0px); }
        }
        @keyframes banCardSweep {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(440%); }
        }
      `}</style>

      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(90deg, rgba(255,255,255,0.016) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.012) 1px, transparent 1px)', backgroundSize: '120px 120px', opacity: 0.24 }} />
      <div style={{ position: 'absolute', left: '90px', top: '90px', width: '520px', height: '520px', border: '1px solid rgba(244,195,32,0.05)', transform: 'rotate(45deg)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: '-80px', bottom: '-80px', width: '420px', height: '420px', border: '1px solid rgba(255,255,255,0.03)', transform: 'rotate(45deg)', pointerEvents: 'none' }} />

      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '44px', background: 'rgba(255,255,255,0.02)', borderBottom: `1px solid ${COLORS.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', boxSizing: 'border-box', backdropFilter: 'blur(4px)', zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '10px', height: '10px', background: COLORS.yellow, boxShadow: '0 0 12px rgba(244,195,32,0.28)' }} />
          <span style={{ fontSize: '12px', fontWeight: '900', letterSpacing: '2px', color: COLORS.softWhite }}>FCUP_BAN_INTERFACE</span>
        </div>
        <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '2px', color: 'rgba(255,255,255,0.38)' }}>
          {orderMode === 'A_FIRST' ? 'A_FIRST // B_SECOND' : 'B_FIRST // A_SECOND'}
        </div>
      </div>

      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <div
          style={{
            fontSize: '250px', fontWeight: '900', lineHeight: 0.9, letterSpacing: '8px', color: 'transparent',
            WebkitTextStroke: '2px rgba(255,255,255,0.08)', textTransform: 'uppercase', userSelect: 'none',
            animation: 'banTextDrop 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards', // 🌟 给巨大的 BAN 字加入进场下落效果
            willChange: 'transform, opacity'
          }}
        >
          BAN
        </div>
      </div>

      {/* 🌟 这个 Grid 布局使用了 alignItems: 'stretch'，保证了左右卡片和中间的线完美等高，非常精妙！ */}
      <div style={{ position: 'absolute', inset: '150px 120px 92px', display: 'grid', gridTemplateColumns: '1fr 42px 1fr', gap: 28, alignItems: 'stretch' }}>
        <TeamBanCard side="left" order={orderA} teamName={matchData.teamA} banInfo={banA} reveal={revealA} />
        
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 2, height: '74%', background: 'linear-gradient(180deg, rgba(244,195,32,0.00) 0%, rgba(244,195,32,0.42) 18%, rgba(244,195,32,0.42) 82%, rgba(244,195,32,0.00) 100%)' }} />
        </div>

        <TeamBanCard side="right" order={orderB} teamName={matchData.teamB} banInfo={banB} reveal={revealB} />
      </div>
    </div>
  );
}