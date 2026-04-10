import React, { useEffect, useRef, useState, useMemo } from 'react';
import BeginInfoOverlay from './BeginInfoOverlay';
import { LOGO_LIST } from '../../constants/logos';
import BanPhaseScene from './BanPhaseScene';
import { needsAttackDefense } from '../../constants/gameData';

const COLORS = {
  mainDark: '#2a2a2a',
  yellow: '#f4c320',
  white: '#ffffff',
  black: '#000000',
  banRed: '#ff4d4d',
  gray: '#aaaaaa',
  line: 'rgba(255,255,255,0.05)',
  lineStrong: 'rgba(255,255,255,0.10)'
};

const MODE_ICON_MAP = {
  CONTROL: '/assets/modes/control.png',
  ESCORT: '/assets/modes/escort.png',
  FLASHPOINT: '/assets/modes/flashpoint.png',
  HYBRID: '/assets/modes/hybrid.png',
  PUSH: '/assets/modes/push.png'
};

const containerStyle = {
  width: '1920px',
  height: '1080px',
  backgroundColor: 'transparent',
  position: 'relative',
  fontFamily: '"HarmonyOS Sans SC", sans-serif'
};

const teamBarLayout = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '0px 42.5px'
};

const teamWrapperLeftStyle = {
  width: '525px',
  display: 'flex',
  flexDirection: 'column',
  opacity: 0,
  animation: 'hudSlideInLeft 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards',
  willChange: 'transform, opacity',
  backfaceVisibility: 'hidden'
};

const teamWrapperRightStyle = {
  width: '525px',
  display: 'flex',
  flexDirection: 'column',
  opacity: 0,
  animation: 'hudSlideInRight 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards',
  willChange: 'transform, opacity',
  backfaceVisibility: 'hidden'
};

const subBarStyle = {
  height: '20px',
  backgroundColor: 'rgba(26,26,26,0.94)',
  display: 'flex',
  width: '100%',
  borderTop: `1px solid ${COLORS.lineStrong}`,
  borderBottom: `1px solid ${COLORS.lineStrong}`
};

const yellowAccentLeft = { width: '4px', height: '100%', backgroundColor: COLORS.yellow };
const yellowAccentRight = { width: '4px', height: '100%', backgroundColor: COLORS.yellow };

const subBarContentStyle = {
  flex: 1,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0 8px'
};

const subBarTextHighlight = {
  color: COLORS.white,
  fontSize: '12px',
  fontWeight: '900',
  letterSpacing: '1px',
  textTransform: 'uppercase'
};

const subBarTextNormal = {
  color: COLORS.gray,
  fontSize: '12px',
  fontWeight: 'bold',
  letterSpacing: '1px',
  textTransform: 'uppercase'
};

const teamGroupStyle = { display: 'flex', width: '100%', height: '45px', alignItems: 'center' };

const logoBlockStyle = {
  width: '45px',
  height: '45px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flexShrink: 0
};

const logoImgStyle = { width: '80%', height: '80%', objectFit: 'contain' };

const banAreaStyle = {
  height: '45px',
  backgroundColor: COLORS.mainDark,
  display: 'flex',
  alignItems: 'center',
  padding: '0 5px',
  gap: '3px',
  flexShrink: 0
};

const teamNameBlockStyle = {
  flex: 1,
  height: '45px',
  backgroundColor: COLORS.mainDark,
  color: COLORS.white,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '20px',
  fontWeight: '900',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
  position: 'relative'
};

const teamNameTextStyle = {
  maxWidth: 'calc(100% - 20px)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  padding: '0 10px'
};

const getSideTagStyle = (tag, isLeft) => ({
  height: '45px',
  padding: '0 12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: COLORS.mainDark,
  color: tag === 'ATK' ? COLORS.yellow : COLORS.gray,
  fontSize: '13px',
  fontWeight: '900',
  letterSpacing: '1px',
  borderLeft: isLeft ? `1px solid ${COLORS.lineStrong}` : 'none',
  borderRight: !isLeft ? `1px solid ${COLORS.lineStrong}` : 'none',
  boxSizing: 'border-box',
  flexShrink: 0
});

const scoreBoxStyle = {
  width: '45px',
  height: '45px',
  backgroundColor: COLORS.yellow,
  color: COLORS.black,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontSize: '32px',
  fontWeight: '900',
  flexShrink: 0
};

const playerListRowStyle = { display: 'flex', gap: '3px' };

const playerSlotStyle = {
  width: '121px',
  height: '24px',
  backgroundColor: 'rgba(42,42,42,0.94)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontSize: '12px',
  fontWeight: '900',
  borderBottom: `2px solid ${COLORS.yellow}`,
  transition: 'color 0.3s',
  textTransform: 'uppercase',
  letterSpacing: '0.2px'
};

const subBadgeStyle = {
  fontSize: '9px',
  backgroundColor: COLORS.yellow,
  color: COLORS.black,
  padding: '1px 3px',
  marginRight: '4px',
  borderRadius: '2px',
  fontWeight: '900'
};

const commsUnderStyle = {
  backgroundColor: 'rgba(15,15,15,0.95)',
  color: COLORS.white,
  height: '18px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontSize: '10px',
  fontWeight: '900',
  marginTop: '2px',
  borderRadius: '2px',
  letterSpacing: '0.5px',
  textTransform: 'uppercase'
};

const banBoxContainer = { display: 'flex', height: '45px', gap: '2px' };

const banImgStyle = {
  height: '45px',
  width: '45px',
  objectFit: 'cover',
  backgroundColor: '#111'
};

const banLabelStyle = {
  width: '14px',
  height: '45px',
  backgroundColor: COLORS.yellow,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '9px',
  fontWeight: '900',
  color: COLORS.black,
  padding: '4px 0',
  boxSizing: 'border-box'
};

const normalizeText = v => String(v || '').trim().toLowerCase();

const normalizeRosterRole = role => {
  const v = String(role || '').trim().toLowerCase();
  if (['tank', 't'].includes(v)) return 'tank';
  if (['support', 'sup', 'healer'].includes(v)) return 'support';
  if (['damage', 'dps', 'attack'].includes(v)) return 'damage';
  return v || 'damage';
};

const getModeKey = type => String(type || '').trim().split(' ')[0].toUpperCase();
const getModeIconPath = type => MODE_ICON_MAP[getModeKey(type)] || '';

const getFallbackTeamShort = name =>
  String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(v => v[0])
    .join('')
    .slice(0, 4)
    .toUpperCase() || 'TBD';

const getKeyPlayerProfileFromRoster = (matchData, side, playerName) => {
  const roster = side === 'A' ? matchData.rosterPlayersA || [] : matchData.rosterPlayersB || [];
  const target = normalizeText(playerName);
  const found = roster.find(
    p =>
      normalizeText(p?.nickname) === target ||
      normalizeText(p?.battleTag) === target ||
      normalizeText(p?.name) === target ||
      normalizeText(p?.id) === target
  );
  if (!found) return null;
  return {
    nickname: found.nickname || playerName || 'PLAYER',
    battleTag: found.battleTag || '',
    role: normalizeRosterRole(found.role || found.position || ''),
    hero: String(found.hero || found.selectedHero || found.currentHero || found.mainHero || found.signatureHero || '').trim().toLowerCase()
  };
};

const getValidLogo = logoPath => {
  if (!logoPath) return LOGO_LIST[0]?.path;
  if (LOGO_LIST.some(l => l.path === logoPath)) return logoPath;
  const fileName = logoPath.split('/').pop();
  const fallback = LOGO_LIST.find(l => l.path.includes(fileName));
  return fallback ? fallback.path : LOGO_LIST[0]?.path;
};

const BanBox = React.memo(({ heroName, align }) => (
  <div style={{ ...banBoxContainer, flexDirection: align === 'left' ? 'row-reverse' : 'row' }}>
    <img src={`/assets/heroes/${heroName}.png`} style={banImgStyle} alt="ban" onError={e => { e.target.src = '/assets/logos/OW.png'; }} />
    <div style={banLabelStyle}><span>B</span><span>A</span><span>N</span></div>
  </div>
));

const KeyPlayerCard = React.memo(({ show, phase, data, matchData }) => {
  if (!show) return null;
  const isLeft = data.side === 'A';
  const isEnter = phase === 'enter';
  const profile = getKeyPlayerProfileFromRoster(matchData, data.side, data.name);
  const heroImg = profile?.role && profile?.hero ? `/assets/roster/${profile.role}/${profile.hero}.png` : '';
  const fallbackHeroImg = profile?.role && profile?.hero ? `/assets/heroes/${profile.role}/${profile.hero}.png` : '';

  return (
    <div
      style={{
        position: 'absolute',
        top: '500px',
        [isLeft ? 'left' : 'right']: '52px',
        width: '800px',
        height: '330px',
        zIndex: 340,
        pointerEvents: 'none',
        opacity: isEnter ? 1 : 0,
        transform: isEnter ? 'translateX(0) scale(0.7)' : isLeft ? 'translateX(-240px) scale(0.7)' : 'translateX(240px) scale(0.7)',
        transformOrigin: isLeft ? 'left center' : 'right center',
        transition: 'transform 520ms cubic-bezier(0.16, 1, 0.3, 1), opacity 420ms ease',
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden'
      }}
    >
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: 'linear-gradient(180deg, rgba(14,14,14,0.94) 0%, rgba(6,6,6,0.99) 100%)', border: `1px solid ${COLORS.lineStrong}`, boxShadow: '0 32px 90px rgba(0,0,0,0.52)' }}>
        <div style={{ position: 'absolute', inset: '10px', border: `1px solid ${COLORS.line}`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '5px', background: COLORS.yellow }} />
        <div style={{ position: 'absolute', top: 0, [isLeft ? 'right' : 'left']: 0, width: 0, height: 0, borderTop: '120px solid rgba(244,195,32,0.96)', borderLeft: isLeft ? '120px solid transparent' : '0 solid transparent', borderRight: isLeft ? '0 solid transparent' : '120px solid transparent' }} />
        <div style={{ position: 'absolute', [isLeft ? 'left' : 'right']: '34px', top: '34px', width: '5px', height: '92px', background: COLORS.yellow }} />
        <div style={{ position: 'absolute', [isLeft ? 'left' : 'right']: '34px', top: '34px', width: '132px', height: '5px', background: COLORS.yellow }} />

        <div style={{ position: 'absolute', top: 0, bottom: 0, [isLeft ? 'right' : 'left']: 0, width: '62%', overflow: 'hidden' }}>
          {heroImg ? (
            <img
              src={heroImg}
              alt={data.name}
              onError={e => {
                if (fallbackHeroImg && e.currentTarget.src !== window.location.origin + fallbackHeroImg) e.currentTarget.src = fallbackHeroImg;
              }}
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.82, filter: 'brightness(0.82) contrast(1.06) saturate(0.96)', transform: isLeft ? 'translateX(40px) scale(1.32)' : 'translateX(-40px) scale(1.32)' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.00) 100%)' }} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: isLeft ? 'linear-gradient(270deg, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.06) 18%, rgba(0,0,0,0.26) 42%, rgba(0,0,0,0.62) 72%, rgba(0,0,0,0.86) 100%)' : 'linear-gradient(90deg, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.06) 18%, rgba(0,0,0,0.26) 42%, rgba(0,0,0,0.62) 72%, rgba(0,0,0,0.86) 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.014) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px)', backgroundSize: '60px 60px', opacity: 0.12 }} />
          <div style={{ position: 'absolute', top: '-10%', bottom: '-10%', width: '28%', background: 'linear-gradient(90deg, rgba(255,255,255,0.00) 0%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.00) 100%)', transform: isEnter ? 'translateX(420%) skewX(-18deg)' : 'translateX(-120%) skewX(-18deg)', transition: 'transform 900ms cubic-bezier(.2,.8,.2,1) 120ms', mixBlendMode: 'screen', willChange: 'transform' }} />
        </div>

        <div style={{ position: 'absolute', inset: 0, clipPath: isLeft ? 'polygon(0 0, 64% 0, 60% 100%, 0 100%)' : 'polygon(36% 0, 100% 0, 100% 100%, 40% 100%)', background: isLeft ? 'linear-gradient(100deg, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.03) 22%, rgba(0,0,0,0.18) 44%, rgba(0,0,0,0.54) 72%, rgba(0,0,0,0.78) 100%)' : 'linear-gradient(260deg, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.03) 22%, rgba(0,0,0,0.18) 44%, rgba(0,0,0,0.54) 72%, rgba(0,0,0,0.78) 100%)' }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, [isLeft ? 'left' : 'right']: 0, width: '64%', clipPath: isLeft ? 'polygon(0 0, 74% 0, 64% 100%, 0 100%)' : 'polygon(26% 0, 100% 0, 100% 100%, 36% 100%)', borderRight: isLeft ? `2px solid ${COLORS.yellow}` : 'none', borderLeft: !isLeft ? `2px solid ${COLORS.yellow}` : 'none', opacity: 0.95 }} />

        <div style={{ position: 'absolute', [isLeft ? 'left' : 'right']: '52px', top: '52px', zIndex: 6, display: 'grid', gap: '12px', justifyItems: isLeft ? 'start' : 'end', maxWidth: '500px' }}>
          <div style={{ background: COLORS.yellow, color: COLORS.black, padding: '8px 14px', fontSize: '13px', fontWeight: '900', letterSpacing: '2.2px', textTransform: 'uppercase', boxShadow: '0 10px 18px rgba(0,0,0,0.24)' }}>KEY PLAYER</div>
          <div style={{ position: 'relative', color: COLORS.white, fontSize: '65px', fontWeight: '900', lineHeight: 0.88, letterSpacing: '1px', textTransform: 'uppercase', textAlign: isLeft ? 'left' : 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '0 12px 28px rgba(0,0,0,0.40)' }}>
            {data.name || 'PLAYER'}
            <div style={{ position: 'absolute', top: '8px', [isLeft ? 'left' : 'right']: '6px', color: 'rgba(255,255,255,0.05)', fontSize: '118px', fontWeight: '900', lineHeight: 0.9, letterSpacing: '1px', pointerEvents: 'none' }}>
              {data.name || 'PLAYER'}
            </div>
          </div>
          {!!data.battleTag && <div style={{ color: 'rgba(255,255,255,0.82)', fontSize: '24px', fontWeight: '700', letterSpacing: '0.6px', textAlign: isLeft ? 'left' : 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.battleTag}</div>}
        </div>

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '52px', background: 'linear-gradient(180deg, rgba(12,12,12,0.92) 0%, rgba(5,5,5,0.99) 100%)', borderTop: `2px solid ${COLORS.yellow}` }} />
        <div style={{ position: 'absolute', bottom: '16px', [isLeft ? 'left' : 'right']: '30px', width: '260px', height: '4px', background: 'linear-gradient(90deg, rgba(244,195,32,0.00) 0%, rgba(244,195,32,1) 45%, rgba(244,195,32,0.00) 100%)' }} />
      </div>
    </div>
  );
});

export default function MatchLiveHUD({ matchData, isActive = false }) {
  const [runState, setRunState] = useState('IDLE');
  const isOverlay = typeof window !== 'undefined' && window.location.hash === '#overlay';

  const isTournamentMode = matchData.uiMode === 'TOURNAMENT';

  // 🌟 [间距与悬浮调控中心] 🌟
  // 1. 中央 Logo 信息栏固定在屏幕正顶端 (Top: 0)
  // 2. 队伍名、头像、分数等主体根据 Y-Offset 下沉
  // 3. 左右两侧的地图/比分细条 (SubBar) 会自动在 顶部 与 下沉的主体 之间 垂直居中
  const dynamicLayout = useMemo(() => {
    const defaultTournamentMarginTop = 45;
    const defaultNormalMarginTop = 0;      

    const customTop = parseInt(matchData.hudMarginTop, 10);
    const appliedMarginTop = !isNaN(customTop) 
      ? customTop 
      : (isTournamentMode ? defaultTournamentMarginTop : defaultNormalMarginTop);

    // 计算地图细条 (SubBar) 的垂直居中逻辑：
    // appliedMarginTop 是顶部增加的空白高度。
    // 将这个高度一分为二，一半作为 SubBar 的 marginTop，一半作为 marginBottom。
    // 加上默认的 4px 基础间距。
    const subBarMarginTop = Math.floor(appliedMarginTop / 2);
    const subBarMarginBottom = Math.ceil(appliedMarginTop / 2) + 4;

    return {
      subBarMarginTop: `${subBarMarginTop}px`,
      subBarMarginBottom: `${subBarMarginBottom}px`,
      wrapperGap: isTournamentMode ? '88px' : '81px' 
    };
  }, [isTournamentMode, matchData.hudMarginTop]);


  const beginArmedRef = useRef(matchData.beginInfoEnabled);
  useEffect(() => {
    beginArmedRef.current = matchData.beginInfoEnabled;
  }, [matchData.beginInfoEnabled]);

  useEffect(() => {
    if (isActive) {
      if (beginArmedRef.current) setRunState('INTRO');
      else setRunState('HUD');
    } else {
      setRunState('IDLE');
    }
  }, [isActive]);

  const renderState = (runState === 'IDLE' && !isOverlay) ? 'HUD' : runState;

  const [tickerKey, setTickerKey] = useState(0);
  const [localShowTicker, setLocalShowTicker] = useState(matchData.showTicker);
  const [banPhaseTrigger, setBanPhaseTrigger] = useState(0);
  const [showKeyPlayer, setShowKeyPlayer] = useState(false);
  const [keyPlayerPhase, setKeyPlayerPhase] = useState('hidden');
  const [keyPlayerData, setKeyPlayerData] = useState({ side: 'A', name: '', battleTag: '' });

  const keyPlayerTimerRef = useRef(null);
  const keyPlayerExitTimerRef = useRef(null);
  const keyPlayerEnterTimerRef = useRef(null);
  const keyPlayerArmedRef = useRef(false);
  const lastConsumedKeyTriggerRef = useRef(0);

  const clearKeyPlayerTimers = () => {
    [keyPlayerTimerRef, keyPlayerExitTimerRef, keyPlayerEnterTimerRef].forEach(ref => {
      if (ref.current) {
        clearTimeout(ref.current);
        ref.current = null;
      }
    });
  };

  useEffect(() => {
    setLocalShowTicker(matchData.showTicker);
    if (matchData.showTicker) setTickerKey(k => k + 1);
  }, [matchData.showTicker]);

  useEffect(() => {
    const next = matchData.heroBanTriggerAt || 0;
    if (next && next !== banPhaseTrigger) setBanPhaseTrigger(next);
  }, [matchData.heroBanTriggerAt, banPhaseTrigger]);

  useEffect(() => {
    clearKeyPlayerTimers();
    setShowKeyPlayer(false);
    setKeyPlayerPhase('hidden');

    if (!isActive) {
      keyPlayerArmedRef.current = false;
      return;
    }

    lastConsumedKeyTriggerRef.current = matchData.keyPlayerTriggerAt || 0;
    keyPlayerArmedRef.current = true;
  }, [isActive]);

  useEffect(() => {
    if (!isActive || !keyPlayerArmedRef.current) return;

    const next = matchData.keyPlayerTriggerAt || 0;
    if (!next || next === lastConsumedKeyTriggerRef.current) return;

    lastConsumedKeyTriggerRef.current = next;

    const profile = getKeyPlayerProfileFromRoster(matchData, matchData.keyPlayerSide || 'A', matchData.keyPlayerName || 'PLAYER');

    setKeyPlayerData({
      side: matchData.keyPlayerSide || 'A',
      name: profile?.nickname || matchData.keyPlayerName || 'PLAYER',
      battleTag: profile?.battleTag || ''
    });

    clearKeyPlayerTimers();
    setShowKeyPlayer(true);
    setKeyPlayerPhase('pre-enter');

    keyPlayerEnterTimerRef.current = setTimeout(() => {
      setKeyPlayerPhase('enter');
      keyPlayerEnterTimerRef.current = null;
    }, 34);

    keyPlayerTimerRef.current = setTimeout(() => {
      setKeyPlayerPhase('exit');
      keyPlayerExitTimerRef.current = setTimeout(() => {
        setShowKeyPlayer(false);
        setKeyPlayerPhase('hidden');
        keyPlayerExitTimerRef.current = null;
      }, 520);
      keyPlayerTimerRef.current = null;
    }, 2300);
  }, [isActive, matchData.keyPlayerTriggerAt, matchData.keyPlayerSide, matchData.keyPlayerName, matchData.rosterPlayersA, matchData.rosterPlayersB]);

  useEffect(() => clearKeyPlayerTimers, []);

  const { safeLogoA, safeLogoB } = useMemo(() => ({
    safeLogoA: getValidLogo(matchData.logoA),
    safeLogoB: getValidLogo(matchData.logoB)
  }), [matchData.logoA, matchData.logoB]);

  const totalMaps = useMemo(
    () => parseInt(String(matchData.matchFormat || 'BO3').replace('BO', ''), 10) || 3,
    [matchData.matchFormat]
  );

  const pointsToWin = useMemo(() => Math.floor(totalMaps / 2) + 1, [totalMaps]);

  const renderScoreDots = (score, align) => (
    <div style={{ display: 'flex', gap: '3px', margin: align === 'left' ? '0 10px 0 0' : '0 0 0 10px', flexDirection: align === 'left' ? 'row' : 'row-reverse' }}>
      {Array.from({ length: pointsToWin }).map((_, i) => (
        <div key={i} style={{ width: '6px', height: '10px', backgroundColor: i < score ? COLORS.yellow : 'transparent', border: `1px solid ${COLORS.yellow}`, transform: 'skewX(-10deg)' }} />
      ))}
    </div>
  );

  const renderMapSequence = () => {
    const currentMapIndex = Math.max(0, (matchData.currentMap || 1) - 1);
    const teamShortA = String(matchData.teamShortA || getFallbackTeamShort(matchData.teamA)).toUpperCase();
    const teamShortB = String(matchData.teamShortB || getFallbackTeamShort(matchData.teamB)).toUpperCase();
    const isBo7Compact = totalMaps >= 7;

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          paddingLeft: '8px',
          gap: isBo7Compact ? '4px' : 0
        }}
      >
        {Array.from({ length: totalMaps }).map((_, i) => {
          const mapInfo = matchData.mapLineup?.[i];
          const isCurrent = i === currentMapIndex;
          const isFuture = i > currentMapIndex;
          const iconSrc = getModeIconPath(mapInfo?.type);
          const winnerSide = String(mapInfo?.winnerSide || mapInfo?.winner || '').trim().toUpperCase();
          const winnerTag = winnerSide === 'A' ? teamShortA : winnerSide === 'B' ? teamShortB : '';
          const showWinner = !isFuture && !!winnerTag;

          // BO3 / BO5：未来图继续显示 TBD
          const showTbd = !isBo7Compact && (isFuture || !iconSrc);

          // BO7：未来图不显示任何模式信息，只留空槽
          const showBo7FuturePlaceholder = isBo7Compact && isFuture;

          return (
            <React.Fragment key={i}>
              <div
                style={{
                  flex: 1,
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 0
                }}
              >
                {showTbd ? (
                  <span
                    style={{
                      color: isCurrent ? COLORS.yellow : isFuture ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.35)',
                      fontSize: isCurrent ? '10px' : '9px',
                      fontWeight: '900',
                      letterSpacing: '0.6px',
                      textTransform: 'uppercase'
                    }}
                  >
                    TBD
                  </span>
                ) : showBo7FuturePlaceholder ? (
                  <span
                    style={{
                      width: '10px',
                      height: '2px',
                      backgroundColor: 'rgba(255,255,255,0.10)',
                      display: 'block',
                      flexShrink: 0
                    }}
                  />
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: isBo7Compact ? '3px' : '4px',
                      minWidth: 0
                    }}
                  >
                    {iconSrc ? (
                      <img
                        src={iconSrc}
                        alt={getModeKey(mapInfo?.type)}
                        style={{
                          width: '12px',
                          height: '12px',
                          objectFit: 'contain',
                          opacity: isCurrent ? 1 : 0.72,
                          filter: isCurrent ? 'brightness(1.2)' : 'grayscale(1) brightness(1.45)',
                          flexShrink: 0
                        }}
                        onError={e => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          width: '10px',
                          height: '2px',
                          backgroundColor: 'rgba(255,255,255,0.10)',
                          display: 'block',
                          flexShrink: 0
                        }}
                      />
                    )}

                    {showWinner && (
                      <>
                        <span
                          style={{
                            width: '1px',
                            height: isBo7Compact ? '7px' : '8px',
                            backgroundColor: 'rgba(255,255,255,0.18)',
                            flexShrink: 0
                          }}
                        />
                        <span
                          style={{
                            fontSize: isBo7Compact ? '7px' : '8px',
                            fontWeight: '900',
                            letterSpacing: isBo7Compact ? '0.25px' : '0.35px',
                            lineHeight: 1,
                            color: COLORS.yellow,
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                          }}
                        >
                          {winnerTag}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {!isBo7Compact && i < totalMaps - 1 && (
                <span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 2px', fontSize: '10px' }}>/</span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const currentMapIndex = Math.min(Math.max(0, (matchData.currentMap || 1) - 1), 6);
  const currentMapData = matchData.mapLineup?.[currentMapIndex] || matchData.mapLineup?.[0] || {};
  const currentBanA = matchData.bansA?.[0] || 'tank/dva';
  const [roleA, heroA] = currentBanA.includes('/') ? currentBanA.split('/') : ['tank', currentBanA];
  const currentBanB = matchData.bansB?.[0] || 'damage/tracer';
  const [roleB, heroB] = currentBanB.includes('/') ? currentBanB.split('/') : ['damage', currentBanB];

  const currentMapModeKey = getModeKey(currentMapData?.type);
  const currentMapNumberLabel = `MAP ${matchData.currentMap || 1}`;
  const currentMapModeLabel = currentMapModeKey || 'TBD';
  const currentMapNameLabel = currentMapData?.name || 'TBD';

  const showSideStatus = needsAttackDefense(currentMapModeKey);
  const attackSide = currentMapData?.attackSide || '';

  const leftSideTag = showSideStatus && attackSide ? (attackSide === 'A' ? 'ATK' : 'DEF') : '';
  const rightSideTag = showSideStatus && attackSide ? (attackSide === 'B' ? 'ATK' : 'DEF') : '';

  const handleTickerEnd = () => {
    if (matchData.tickerMode === 'ONCE') {
      setTimeout(() => { setLocalShowTicker(false); }, 0);
    }
  };

  return (
    <div style={containerStyle}>
      <style>{`
        @keyframes hudFadeInDownCenter { 0% { opacity: 0; transform: translate(-50%, -15px); } 100% { opacity: 1; transform: translate(-50%, 0); } }
        @keyframes hudSlideInLeft { 0% { opacity: 0; transform: translateX(-40px); } 100% { opacity: 1; transform: translateX(0); } }
        @keyframes hudSlideInRight { 0% { opacity: 0; transform: translateX(40px); } 100% { opacity: 1; transform: translateX(0); } }
        @keyframes tickerScroll { 0% { transform: translateX(1920px); } 100% { transform: translateX(-100%); } }
      `}</style>

      {renderState === 'INTRO' && (
        <BeginInfoOverlay
          matchData={matchData}
          duration={3200}
          onFinish={() => setRunState('HUD')}
        />
      )}

      {renderState === 'HUD' && !matchData.showBanPhase && (
        <>
          <KeyPlayerCard show={showKeyPlayer} phase={keyPlayerPhase} data={keyPlayerData} matchData={matchData} />

          {/* 🌟 中央赛事胶囊组件：死死锚定在屏幕顶端 (Top: 0) 🌟 */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'stretch',
              justifyContent: 'center',
              zIndex: 100,
              opacity: 0,
              animation: 'hudFadeInDownCenter 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              willChange: 'transform, opacity',
              backfaceVisibility: 'hidden',
              height: '32px'
            }}
          >
            {/* 1. 左侧：赛事 Logo 块 */}
            <div
              style={{
                width: '32px',
                backgroundColor: COLORS.white,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                boxShadow: '2px 0 6px rgba(0,0,0,0.1)'
              }}
            >
              <img
                src={matchData.stingerLogo || '/assets/logos/fc_logo.png'}
                alt="Tournament"
                style={{ width: '90%', height: '90%', objectFit: 'contain' }}
              />
            </div>

            {/* 2. 中间：赛事信息块 */}
            <div
              style={{
                backgroundColor: COLORS.mainDark,
                color: COLORS.white,
                padding: '0 20px',
                fontSize: '14px',
                fontWeight: '900',
                letterSpacing: '2.2px',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                borderTop: `1px solid ${COLORS.lineStrong}`,
                borderBottom: `1px solid ${COLORS.lineStrong}`,
                borderLeft: `1px solid ${COLORS.lineStrong}`
              }}
            >
              {matchData.info}
            </div>

            {/* 3. 右侧：赛制标签块 */}
            <div
              style={{
                backgroundColor: COLORS.yellow,
                color: COLORS.mainDark,
                padding: '0 16px',
                fontSize: '13px',
                fontWeight: '900',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                borderLeft: `1px solid ${COLORS.mainDark}`
              }}
            >
              {matchData.matchFormat || 'TOURNAMENT'}
            </div>
          </div>
          
          <div style={teamBarLayout}>
            {/* 左侧 Wrapper */}
            <div style={{ ...teamWrapperLeftStyle, gap: dynamicLayout.wrapperGap }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                
                {/* 悬浮居中的 SubBar (地图比分栏) */}
                <div style={{
                  ...subBarStyle,
                  marginTop: dynamicLayout.subBarMarginTop,
                  marginBottom: dynamicLayout.subBarMarginBottom
                }}>
                  <div style={yellowAccentLeft}></div>
                  <div style={subBarContentStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      {renderScoreDots(matchData.scoreA, 'left')}
                      {renderMapSequence()}
                    </div>
                  </div>
                </div>

                {/* 队伍名称、比分与状态主体 */}
                <div style={teamGroupStyle}>
                  <div style={{ ...logoBlockStyle, backgroundColor: matchData.logoBgA }}>
                    <img src={safeLogoA} style={logoImgStyle} alt="logoA" />
                  </div>
                  {matchData.showBans && (
                    <div style={banAreaStyle}><BanBox heroName={`${roleA}/${heroA}`} align="right" /></div>
                  )}
                  <div style={teamNameBlockStyle}>
                    <div style={teamNameTextStyle}>{matchData.teamA}</div>
                  </div>
                  {leftSideTag && <div style={getSideTagStyle(leftSideTag, true)}>{leftSideTag}</div>}
                  <div style={scoreBoxStyle}>{matchData.scoreA}</div>
                </div>
              </div>

              {matchData.showPlayers && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={playerListRowStyle}>
                    {matchData.playersA?.map((p, i) => (
                      <div key={`${p || 'empty'}-${i}`} style={{ ...playerSlotStyle, color: matchData.subIndexA === i ? COLORS.yellow : COLORS.white }}>
                        {matchData.subIndexA === i && <span style={subBadgeStyle}>IN</span>}
                        {p}
                      </div>
                    ))}
                  </div>
                  {matchData.activeComms === 'A' && (
                    <div style={commsUnderStyle}>
                      <span>LISTENING TO <span style={{ color: COLORS.yellow }}>{matchData.teamA}</span> VOICE CHAT</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 右侧 Wrapper */}
            <div style={{ ...teamWrapperRightStyle, gap: dynamicLayout.wrapperGap }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                
                {/* 悬浮居中的 SubBar (地图比分栏) */}
                <div style={{
                  ...subBarStyle,
                  marginTop: dynamicLayout.subBarMarginTop,
                  marginBottom: dynamicLayout.subBarMarginBottom
                }}>
                  <div style={{ ...subBarContentStyle, gap: '10px', width: '100%' }}>
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                        alignItems: 'center'
                      }}
                    >
                      <div
                        style={{
                          minWidth: 0,
                          textAlign: 'center',
                          fontSize: '10px',
                          fontWeight: '900',
                          letterSpacing: '0.8px',
                          textTransform: 'uppercase',
                          color: COLORS.white
                        }}
                      >
                        {currentMapNumberLabel}
                      </div>

                      <div
                        style={{
                          minWidth: 0,
                          textAlign: 'center',
                          fontSize: '10px',
                          fontWeight: '900',
                          letterSpacing: '0.8px',
                          textTransform: 'uppercase',
                          color: COLORS.yellow,
                          borderLeft: `1px solid ${COLORS.line}`,
                          borderRight: `1px solid ${COLORS.line}`,
                          padding: '0 8px'
                        }}
                      >
                        {currentMapModeLabel}
                      </div>

                      <div
                        style={{
                          minWidth: 0,
                          textAlign: 'center',
                          fontSize: '10px',
                          fontWeight: '900',
                          letterSpacing: '0.8px',
                          textTransform: 'uppercase',
                          color: COLORS.gray,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          padding: '0 8px'
                        }}
                        title={currentMapNameLabel}
                      >
                        {currentMapNameLabel}
                      </div>
                    </div>

                    {renderScoreDots(matchData.scoreB, 'right')}
                  </div>
                  <div style={yellowAccentRight}></div>
                </div>

                {/* 队伍名称、比分与状态主体 */}
                <div style={{ ...teamGroupStyle, justifyContent: 'flex-end' }}>
                  <div style={scoreBoxStyle}>{matchData.scoreB}</div>
                  {rightSideTag && <div style={getSideTagStyle(rightSideTag, false)}>{rightSideTag}</div>}
                  <div style={teamNameBlockStyle}>
                    <div style={teamNameTextStyle}>{matchData.teamB}</div>
                  </div>
                  {matchData.showBans && (
                    <div style={banAreaStyle}><BanBox heroName={`${roleB}/${heroB}`} align="left" /></div>
                  )}
                  <div style={{ ...logoBlockStyle, backgroundColor: matchData.logoBgB }}>
                    <img src={safeLogoB} style={logoImgStyle} alt="logoB" />
                  </div>
                </div>
              </div>

              {matchData.showPlayers && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ ...playerListRowStyle, justifyContent: 'flex-end' }}>
                    {matchData.playersB?.map((p, i) => (
                      <div key={`${p || 'empty'}-${i}`} style={{ ...playerSlotStyle, color: matchData.subIndexB === i ? COLORS.yellow : COLORS.white }}>
                        {matchData.subIndexB === i && <span style={subBadgeStyle}>IN</span>}
                        {p}
                      </div>
                    ))}
                  </div>
                  {matchData.activeComms === 'B' && (
                    <div style={commsUnderStyle}>
                      <span>LISTENING TO <span style={{ color: COLORS.yellow }}>{matchData.teamB}</span> VOICE CHAT</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              height: '36px',
              backgroundColor: COLORS.yellow,
              display: 'flex',
              alignItems: 'center',
              overflow: 'hidden',
              zIndex: 200,
              transform: localShowTicker ? 'translateY(0)' : 'translateY(100%)',
              opacity: localShowTicker ? 1 : 0,
              transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
              willChange: 'transform, opacity',
              backfaceVisibility: 'hidden'
            }}
          >
            <div
              key={tickerKey}
              onAnimationEnd={handleTickerEnd}
              style={{
                whiteSpace: 'nowrap',
                color: COLORS.black,
                fontSize: '16px',
                fontWeight: '900',
                letterSpacing: '1.8px',
                animation: `tickerScroll 25s linear ${matchData.tickerMode === 'ONCE' ? '1 forwards' : 'infinite'}`,
                textTransform: 'uppercase',
                willChange: 'transform',
                backfaceVisibility: 'hidden'
              }}
            >
              {matchData.tickerText || 'SPONSORS // THANK YOU FOR YOUR SUPPORT // JOIN THE OFFICIAL COMMUNITY FOR THE LATEST NEWS // SPONSORS // THANKS FOR WATCHING'}
            </div>
          </div>
        </>
      )}

      {matchData.showBanPhase && (
        <BanPhaseScene matchData={matchData} triggerAt={banPhaseTrigger} />
      )}
    </div>
  );
}