import React, { forwardRef, memo } from 'react';

// --- 常量与主题 ---
const COLORS = {
  black: '#2a2a2a',
  yellow: '#f4c320',
  white: '#ffffff',
  line: 'rgba(255,255,255,0.08)',
  lineStrong: 'rgba(255,255,255,0.18)',
  softWhite: 'rgba(255,255,255,0.72)',
  faintWhite: 'rgba(255,255,255,0.26)'
};

const UI = {
  outerFrame: `1px solid ${COLORS.lineStrong}`,
  panelShadow: '0 10px 24px rgba(0,0,0,0.22)',
  hardShadow: '0 18px 40px rgba(0,0,0,0.28)',
  yellowGlow: '0 0 0 1px rgba(244,195,32,0.16), 0 0 18px rgba(244,195,32,0.08)',
  insetLine: 'inset 0 0 0 1px rgba(255,255,255,0.04)'
};

const DEFAULT_DATA = {
  coverMode: 'GENERIC', 
  titleMain: 'FRIES CUP',
  titleSubEn: 'ACADEMY',
  titleSubCn: '薯条杯学院赛',
  topLeftLabel: 'FCUP',
  topLeftYear: '2026',
  topRightLabelGeneric: 'BROADCAST // STANDBY',
  topRightLabelMatch: 'MATCH // READY',
  footerLeft: 'FRIES CUP LIVE ROOM',
  footerCenter: 'FRIES-CUP.COM',
  footerRight: 'LIVE COVER SYSTEM',
  genericWatermark: 'BROADCAST',
  phaseMainEn: 'OPEN QUALIFIER',
  phaseMainCn: '公开预选赛',
  phaseSubEn: 'SWISS STAGE',
  phaseSubCn: '瑞士轮',
  coverCasters: 'AAA / BBB',
  coverAdmins: 'CCC / DDD',
  
  // 对阵数据
  teamA: 'TEAM A',
  teamB: 'TEAM B',
  logoA: '',
  logoB: '',
  rosterStaffA: { clubName: '' }, 
  rosterStaffB: { clubName: '' },
  rosterPresetLibrary: [], // ✅ 引入 TEAM_DB 库
  
  matchStage: 'OPEN QUALIFIER',
  roundLabel: 'ROUND 01',
  matchTime: '19:30 CST',
  casterLabel: 'CASTER',
  casterNames: 'A / B',
  matchFormat: 'BO3',
  matchWatermark: 'MATCHDAY',
  showLogos: true,
  showFooterCenter: true
};

// --- 工具函数 ---
const safe = (v, fallback = '') => (v === undefined || v === null || v === '' ? fallback : String(v));
const up = (v, fallback = '') => safe(v, fallback).toUpperCase();

// --- 子组件 ---

const TopBar = memo(({ data, isMatch }) => {
  const { topLeftLabel, topLeftYear, topRightLabelMatch, topRightLabelGeneric } = data;
  const rightLabel = isMatch 
    ? up(topRightLabelMatch, 'MATCH // READY') 
    : up(topRightLabelGeneric, 'BROADCAST // STANDBY');

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: '44px',
      background: 'rgba(255,255,255,0.02)', borderBottom: `1px solid ${COLORS.line}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 30px', boxSizing: 'border-box', backdropFilter: 'blur(4px)', zIndex: 30
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '10px', height: '10px', background: COLORS.yellow, boxShadow: '0 0 12px rgba(244,195,32,0.28)' }} />
        <span style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '2px', color: COLORS.softWhite, textTransform: 'uppercase' }}>
          {up(topLeftLabel, 'FCUP')}
        </span>
        <span style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '2px', color: 'rgba(255,255,255,0.32)' }}>//</span>
        <span style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '2px', color: COLORS.softWhite }}>
          {up(topLeftYear, '2026')}
        </span>
      </div>
      <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', color: 'rgba(255,255,255,0.38)' }}>
        {rightLabel}
      </div>
    </div>
  );
});

const FrameShell = memo(({ children }) => (
  <div style={{
    position: 'absolute', inset: '96px 120px 92px',
    border: UI.outerFrame, boxShadow: `${UI.hardShadow}, ${UI.insetLine}`,
    background: 'linear-gradient(180deg, rgba(255,255,255,0.018) 0%, rgba(255,255,255,0.008) 100%)',
    overflow: 'hidden'
  }}>
    <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.01) 0 1px, transparent 1px 24px)', opacity: 0.22, pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: `linear-gradient(90deg, ${COLORS.yellow} 0%, rgba(244,195,32,0.28) 100%)`, boxShadow: UI.yellowGlow }} />

    <div style={{ position: 'absolute', top: '28px', left: '28px', width: '18px', height: '18px', borderTop: `2px solid ${COLORS.yellow}`, borderLeft: `2px solid ${COLORS.yellow}` }} />
    <div style={{ position: 'absolute', top: '28px', right: '28px', width: '18px', height: '18px', borderTop: `2px solid rgba(255,255,255,0.10)`, borderRight: `2px solid rgba(255,255,255,0.10)` }} />
    <div style={{ position: 'absolute', bottom: '28px', left: '28px', width: '18px', height: '18px', borderBottom: `2px solid rgba(255,255,255,0.10)`, borderLeft: `2px solid rgba(255,255,255,0.10)` }} />
    <div style={{ position: 'absolute', bottom: '28px', right: '28px', width: '18px', height: '18px', borderBottom: `2px solid ${COLORS.yellow}`, borderRight: `2px solid ${COLORS.yellow}` }} />
    {children}
  </div>
));

const Watermark = memo(({ text, size = 220, x = 0, y = 0 }) => (
  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', overflow: 'hidden' }}>
    <div style={{
      fontSize: `${size}px`, fontWeight: 900, letterSpacing: '8px', color: 'transparent',
      WebkitTextStroke: '1px rgba(255,255,255,0.08)', textTransform: 'uppercase',
      lineHeight: 0.9, transform: `translate(${x}px, ${y}px)`, whiteSpace: 'nowrap', userSelect: 'none'
    }}>
      {up(text, 'BROADCAST')}
    </div>
  </div>
));

const GenericInfoPanel = memo(({ data }) => (
  <div style={{
    background: 'rgba(255,255,255,0.02)', border: UI.outerFrame, boxShadow: `${UI.panelShadow}, ${UI.insetLine}`,
    padding: '24px 26px', position: 'relative', overflow: 'hidden', minHeight: '250px',
    display: 'grid', gridTemplateRows: '1fr 1fr'
  }}>
    <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.014) 0 1px, transparent 1px 22px)', opacity: 0.38, pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
    <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: '3px', background: `linear-gradient(90deg, ${COLORS.yellow} 0%, rgba(244,195,32,0.10) 100%)`, transform: 'translateY(-1px)' }} />

    <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ fontSize: '12px', fontWeight: 900, color: COLORS.faintWhite, letterSpacing: '2px', textTransform: 'uppercase' }}>
        {`${up(data.coverCasterLabelEn, 'CASTERS')} // ${up(data.coverCasterLabelCn, '解说')}`}
      </div>
      <div style={{ marginTop: '12px', fontSize: '26px', fontWeight: 900, color: COLORS.white, lineHeight: 1.08, letterSpacing: '1px', wordBreak: 'break-word' }}>
        {safe(data.coverCasters, 'AAA / BBB')}
      </div>
    </div>

    <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ fontSize: '12px', fontWeight: 900, color: COLORS.faintWhite, letterSpacing: '2px', textTransform: 'uppercase' }}>
        {`${up(data.coverAdminLabelEn, 'ADMIN')} // ${up(data.coverAdminLabelCn, '赛管')}`}
      </div>
      <div style={{ marginTop: '12px', fontSize: '26px', fontWeight: 900, color: COLORS.white, lineHeight: 1.08, letterSpacing: '1px', wordBreak: 'break-word' }}>
        {safe(data.coverAdmins, 'CCC / DDD')}
      </div>
    </div>
  </div>
));

const GenericCover = memo(({ data }) => (
  <>
    <Watermark text={data.genericWatermark} />
    <div style={{
      position: 'absolute', left: '64px', right: '64px', top: '190px', bottom: '160px',
      display: 'grid', gridTemplateColumns: 'minmax(760px, 1fr) 390px', gap: '42px', zIndex: 10, alignItems: 'center'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
        <div style={{ fontSize: '112px', fontWeight: 900, color: COLORS.white, lineHeight: 0.92, letterSpacing: '2px', textTransform: 'uppercase' }}>
          {up(data.titleMain, 'FRIES CUP')}
        </div>
        <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ width: '10px', height: '10px', background: COLORS.yellow }} />
          <span style={{ fontSize: '24px', fontWeight: 900, color: COLORS.yellow, letterSpacing: '2.6px', textTransform: 'uppercase' }}>
            {up(data.titleSubEn, 'ACADEMY')}
          </span>
          <span style={{ fontSize: '16px', fontWeight: 900, color: COLORS.yellow, letterSpacing: '2px' }}>//</span>
          <span style={{ fontSize: '24px', fontWeight: 900, color: COLORS.yellow, letterSpacing: '1px' }}>
            {up(data.titleSubCn, '薯条杯学院赛')}
          </span>
        </div>
        <div style={{ width: '620px', height: '8px', marginTop: '24px', background: `linear-gradient(90deg, ${COLORS.yellow} 0%, rgba(244,195,32,0.16) 100%)`, border: '1px solid rgba(244,195,32,0.18)', boxShadow: UI.yellowGlow, position: 'relative' }}>
          <div style={{ position: 'absolute', right: '-1px', top: '-1px', width: '38px', height: '8px', background: COLORS.yellow, opacity: 0.16 }} />
        </div>
        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '18px', fontWeight: 900, color: COLORS.softWhite, letterSpacing: '2px', textTransform: 'uppercase' }}>
            {up(data.phaseMainEn, 'OPEN QUALIFIER')}
          </span>
          <span style={{ fontSize: '13px', fontWeight: 900, color: 'rgba(255,255,255,0.34)', letterSpacing: '2px' }}>//</span>
          <span style={{ fontSize: '18px', fontWeight: 900, color: COLORS.softWhite, letterSpacing: '0.8px' }}>
            {up(data.phaseMainCn, '公开预选赛')}
          </span>
        </div>
      </div>
      <div style={{ alignSelf: 'center' }}>
        <GenericInfoPanel data={data} />
      </div>
    </div>
  </>
));

const TeamLogoBox = memo(({ logo, alt, align = 'left', size = 178 }) => {
  const isSmall = size <= 160;
  const padding = isSmall ? '14px' : '18px';
  const cornerSize = isSmall ? '16px' : '18px';

  return (
    <div style={{
      width: `${size}px`, height: `${size}px`, background: 'rgba(255,255,255,0.03)',
      border: UI.outerFrame, boxShadow: `${UI.panelShadow}, ${UI.insetLine}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', flexShrink: 0
    }}>
      <div style={{
        position: 'absolute', top: padding, [align]: padding,
        width: cornerSize, height: cornerSize, borderTop: `2px solid ${COLORS.yellow}`,
        ...(align === 'left' ? { borderLeft: `2px solid ${COLORS.yellow}` } : { borderRight: `2px solid ${COLORS.yellow}` })
      }} />
      {logo ? (
        <img src={logo} alt={alt} style={{ width: '74%', height: '74%', objectFit: 'contain', display: 'block' }} />
      ) : (
        <div style={{ fontSize: isSmall ? '18px' : '20px', fontWeight: 900, color: COLORS.softWhite, letterSpacing: '2px', textTransform: 'uppercase' }}>LOGO</div>
      )}
    </div>
  );
});

// ✅ 确保字号充足
const getUnifiedNameStyle = (nameA = '', nameB = '') => {
  const lenA = String(nameA).replace(/\s+/g, '').length;
  const lenB = String(nameB).replace(/\s+/g, '').length;
  const maxLen = Math.max(lenA, lenB);

  if (maxLen <= 8) return { fontSize: '72px', letterSpacing: '1px' };
  if (maxLen <= 12) return { fontSize: '56px', letterSpacing: '0px' };
  if (maxLen <= 16) return { fontSize: '46px', letterSpacing: '-0.5px' }; 
  if (maxLen <= 22) return { fontSize: '38px', letterSpacing: '-1px' };
  return { fontSize: '32px', letterSpacing: '-1.5px' };
};

const TeamNameBlock = memo(({ name, club, align = 'left', unifiedStyle }) => {
  const isLeft = align === 'left';

  return (
    <div style={{ 
      minWidth: 0, 
      display: 'flex', 
      alignSelf: 'stretch', 
      justifyContent: isLeft ? 'flex-end' : 'flex-start' 
    }}>
      <div style={{
        width: '100%', 
        height: '100%', 
        minWidth: 0, 
        textAlign: isLeft ? 'right' : 'left',
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: isLeft ? 'flex-end' : 'flex-start',
        borderRight: isLeft ? `4px solid ${COLORS.yellow}` : 'none',
        borderLeft: !isLeft ? `4px solid ${COLORS.yellow}` : 'none',
        paddingRight: isLeft ? '24px' : '0',
        paddingLeft: !isLeft ? '24px' : '0',
        overflow: 'hidden'
      }}>
        
        {club && (
          <div style={{
            fontSize: '13px',
            color: COLORS.yellow,
            letterSpacing: '4px',
            fontWeight: 900,
            marginBottom: '6px',
            textTransform: 'uppercase',
            opacity: 0.9,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%'
          }}>
            {up(club)}
          </div>
        )}

        <div style={{
          fontWeight: 900,
          color: COLORS.white,
          textTransform: 'uppercase',
          whiteSpace: 'nowrap', 
          overflow: 'hidden',   
          textOverflow: 'ellipsis', 
          textShadow: '3px 3px 0 rgba(0,0,0,0.5)', 
          lineHeight: 1, 
          maxWidth: '100%',
          ...unifiedStyle 
        }}>
          {up(name, 'TEAM')}
        </div>
        
      </div>
    </div>
  );
});

const InfoCard = memo(({ label, value, highlight = false }) => (
  <div style={{
    background: highlight ? 'linear-gradient(180deg, rgba(244,195,32,0.16) 0%, rgba(244,195,32,0.08) 100%)' : 'rgba(255,255,255,0.03)',
    border: highlight ? '1px solid rgba(244,195,32,0.22)' : UI.outerFrame,
    boxShadow: `${UI.panelShadow}, ${UI.insetLine}`, padding: '18px 20px', position: 'relative', overflow: 'hidden'
  }}>
    <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.012) 0 1px, transparent 1px 22px)', opacity: 0.45, pointerEvents: 'none' }} />
    <div style={{ position: 'relative', zIndex: 1, fontSize: '11px', fontWeight: 900, color: highlight ? 'rgba(244,195,32,0.82)' : COLORS.faintWhite, letterSpacing: '2px', textTransform: 'uppercase' }}>
      {label}
    </div>
    <div style={{ position: 'relative', zIndex: 1, marginTop: '10px', fontSize: '26px', fontWeight: 900, color: COLORS.white, letterSpacing: '1px', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {value}
    </div>
  </div>
));

const MatchCover = memo(({ data }) => {
  const { 
    roundLabel, matchStage, matchFormat, matchTime, casterLabel, casterNames, 
    teamA, teamB, logoA, logoB, showLogos, 
    rosterStaffA, rosterStaffB, rosterPresetLibrary // ✅ 解构引入数据库
  } = data;
  
  const safeRound = up(roundLabel, 'ROUND 01');
  const safeStage = up(matchStage, 'OPEN QUALIFIER');

  // ✅ 终极核心修复：通过下拉框传入的 teamA 名字，主动去 TEAM_DB (rosterPresetLibrary) 里面把 clubName 捞出来！
  const findClubName = (teamName, staffData, fallback) => {
    if (!teamName) return fallback || '';
    
    // 1. 优先去 TEAM_DB 库里找这个队伍的预设（匹配 name 或 teamName）
    const preset = (rosterPresetLibrary || []).find(p => p.name === teamName || p.data?.teamName === teamName);
    
    // 如果预设里存了 clubName，直接返回预设里的！这完美解决了“下拉载入后没变动”的问题
    if (preset && preset.data && typeof preset.data.clubName === 'string') {
      return preset.data.clubName; 
    }
    
    // 2. 如果库里没有，再退回看当前表单上暂存的数据
    if (staffData && typeof staffData.clubName === 'string') {
      return staffData.clubName;
    }
    
    // 3. 最后兜底
    return fallback || '';
  };

  const clubA = findClubName(teamA, rosterStaffA, data.clubA);
  const clubB = findClubName(teamB, rosterStaffB, data.clubB);

  // 统一下发字号
  const unifiedTeamStyle = getUnifiedNameStyle(teamA, teamB);

  return (
    <>
      <Watermark text={data.matchWatermark || 'MATCHDAY'} size={240} />
      <div style={{
        position: 'absolute', top: '170px', left: '64px', right: '64px', bottom: '160px',
        zIndex: 10, display: 'grid', gridTemplateRows: 'auto auto 1fr auto', gap: '22px'
      }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ background: COLORS.yellow, color: COLORS.black, padding: '8px 16px', fontSize: '13px', fontWeight: 900, letterSpacing: '1.8px', textTransform: 'uppercase', boxShadow: UI.yellowGlow }}>
            {safeRound}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: UI.outerFrame, boxShadow: `${UI.panelShadow}, ${UI.insetLine}`, padding: '8px 16px', fontSize: '13px', fontWeight: 900, color: COLORS.softWhite, letterSpacing: '1.8px', textTransform: 'uppercase' }}>
            {safeStage}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: UI.outerFrame, boxShadow: `${UI.panelShadow}, ${UI.insetLine}`, padding: '8px 16px', fontSize: '13px', fontWeight: 900, color: COLORS.softWhite, letterSpacing: '1.8px', textTransform: 'uppercase' }}>
            {up(matchFormat, 'BO3')}
          </div>
        </div>

        <div style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.012) 100%)', border: UI.outerFrame, boxShadow: `${UI.hardShadow}, ${UI.insetLine}`, minHeight: '360px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.014) 0 1px, transparent 1px 22px)', opacity: 0.42, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: `linear-gradient(90deg, ${COLORS.yellow} 0%, rgba(244,195,32,0.16) 100%)` }} />
          
          <div style={{
            position: 'relative', zIndex: 1, height: '100%', display: 'grid',
            gridTemplateColumns: showLogos === false ? '1fr 124px 1fr' : '156px minmax(0,1.35fr) 124px minmax(0,1.35fr) 156px',
            alignItems: 'center', columnGap: '20px', padding: '42px 28px'
          }}>
            {showLogos !== false && <TeamLogoBox logo={logoA} alt={teamA} align="left" size={156} />}
            
            <TeamNameBlock name={teamA} club={clubA} align="left" unifiedStyle={unifiedTeamStyle} />

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '124px', height: '124px', background: COLORS.yellow, color: COLORS.black, borderLeft: `2px solid ${COLORS.black}`, borderRight: `2px solid ${COLORS.black}`, boxShadow: UI.yellowGlow, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
                <div style={{ position: 'absolute', inset: '10px', border: '1px solid rgba(0,0,0,0.12)' }} />
                <span style={{ position: 'relative', zIndex: 1, fontSize: '34px', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase' }}>VS</span>
              </div>
            </div>

            <TeamNameBlock name={teamB} club={clubB} align="right" unifiedStyle={unifiedTeamStyle} />
            
            {showLogos !== false && <TeamLogoBox logo={logoB} alt={teamB} align="right" size={156} />}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <InfoCard label="TIME" value={up(matchTime, '19:30 CST')} highlight />
          <InfoCard label={up(casterLabel, 'CASTER')} value={up(casterNames, 'A / B')} />
          <InfoCard label="SERIES" value={`${safeRound} // ${safeStage}`} />
        </div>
      </div>
    </>
  );
});

const BottomBar = memo(({ data, isMatch }) => {
  const left = up(data.footerLeft, 'FRIES CUP LIVE ROOM');
  const center = up(data.footerCenter, 'FRIES-CUP.COM');
  
  const rightBase = isMatch 
    ? `${up(data.matchTime, '19:30 CST')}${data.matchFormat ? ` // ${up(data.matchFormat)}` : ''}` 
    : up(data.footerRight, 'LIVE COVER SYSTEM');

  return (
    <>
      <div style={{ position: 'absolute', left: '64px', right: '64px', bottom: '70px', height: '2px', background: 'rgba(255,255,255,0.08)', zIndex: 12 }} />
      <div style={{
        position: 'absolute', left: '64px', right: '64px', bottom: '42px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', zIndex: 12
      }}>
        <span style={{ fontSize: '11px', fontWeight: 900, color: 'rgba(255,255,255,0.26)', letterSpacing: '1.8px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          {left}
        </span>
        {data.showFooterCenter !== false && (
          <span style={{ fontSize: '11px', fontWeight: 900, color: COLORS.yellow, letterSpacing: '1.8px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            {center}
          </span>
        )}
        <span style={{ fontSize: '11px', fontWeight: 900, color: 'rgba(255,255,255,0.26)', letterSpacing: '1.8px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          {rightBase}
        </span>
      </div>
    </>
  );
});

// --- 主渲染出口 ---
const BroadcastCoverScene = forwardRef(({ matchData = {} }, ref) => {
  const data = { ...DEFAULT_DATA, ...matchData };
  const isMatch = up(data.coverMode) === 'MATCH';

  return (
    <div
      ref={ref}
      style={{
        width: '1920px', height: '1080px', position: 'relative', overflow: 'hidden',
        backgroundColor: COLORS.black, fontFamily: '"HarmonyOS Sans SC", "Microsoft YaHei", sans-serif',
        backgroundImage: `radial-gradient(circle at center, rgba(42,42,42,0.90) 0%, rgba(42,42,42,0.98) 100%), linear-gradient(180deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0) 100%)`
      }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.012) 0 1px, transparent 1px 40px)', opacity: 0.18, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: '70px', top: '70px', width: '520px', height: '520px', border: '1px solid rgba(244,195,32,0.07)', transform: 'rotate(45deg)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: '-120px', bottom: '-120px', width: '460px', height: '460px', border: '1px solid rgba(255,255,255,0.03)', transform: 'rotate(45deg)', pointerEvents: 'none' }} />

      <TopBar data={data} isMatch={isMatch} />
      <FrameShell>
        {isMatch ? <MatchCover data={data} /> : <GenericCover data={data} />}
      </FrameShell>
      <BottomBar data={data} isMatch={isMatch} />
    </div>
  );
});

export default BroadcastCoverScene;