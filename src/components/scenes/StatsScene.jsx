import React, { useState, useEffect, useMemo } from 'react';

const COLORS = {
  black: '#2a2a2a',
  panel: '#2a2a2a',
  panel2: '#2a2a2a',
  yellow: '#f4c320',
  white: '#ffffff',
  red: '#ff4d4d',
  blue: '#59a7ff',
  line: 'rgba(255,255,255,0.08)',
  lineStrong: 'rgba(255,255,255,0.18)',
  softWhite: 'rgba(255,255,255,0.62)',
  faintWhite: 'rgba(255,255,255,0.26)'
};

const UI = {
  outerFrame: `1px solid ${COLORS.lineStrong}`,
  panelShadow: '0 18px 40px rgba(0,0,0,0.28)',
  yellowGlow: '0 0 0 1px rgba(244,195,32,0.16), 0 0 18px rgba(244,195,32,0.08)',
  insetLine: 'inset 0 0 0 1px rgba(255,255,255,0.04)',
  bevelInset: 'inset 0 1px 0 rgba(255,255,255,0.04), inset 0 -1px 0 rgba(0,0,0,0.35)'
};

const GLOBAL_FONT = '"HarmonyOS Sans SC", sans-serif';
const BASE_IMAGE_W = 1920;
const BASE_IMAGE_H = 1080;

const containerStyle = {
  width: '1920px',
  height: '1080px',
  backgroundColor: COLORS.black,
  position: 'relative',
  fontFamily: GLOBAL_FONT,
  overflow: 'hidden'
};

const formatNumber = v => {
  const n = Number(v || 0);
  return Number.isFinite(n) ? n.toLocaleString('en-US') : '0';
};

const parseStat = v => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
};

const num = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const scoreText = value => (value === '' || value === null || value === undefined ? '0' : String(value));

const getDisplayTeamName = (shortName, fullName, fallback) => {
  const shortText = String(shortName || '').trim();
  const fullText = String(fullName || '').trim();
  if (shortText) return shortText.toUpperCase();
  if (fullText) return fullText.toUpperCase();
  return fallback;
};

const splitInfoText = text =>
  String(text || '')
    .split('|')
    .map(v => v.trim())
    .filter(Boolean);

const StatCompareRow = ({ label, a, b, delay }) => {
  const na = parseStat(a), nb = parseStat(b);
  const total = Math.max(na + nb, 1);
  const ratioA = `${(na / total) * 100}%`;
  const ratioB = `${(nb / total) * 100}%`;
  const aLead = na > nb;
  const bLead = nb > na;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px 1fr', minHeight: '88px', borderTop: `1px solid ${COLORS.line}`, opacity: 0, willChange: 'opacity, transform', animation: `statsRowSlideIn 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s forwards`, position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.012) 0 1px, transparent 1px 22px)', pointerEvents: 'none', opacity: 0.14 }} />

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '14px 26px 14px 30px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: aLead ? '4px' : '0px', background: COLORS.yellow, transition: 'width 0.3s' }} />
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '16px' }}>
          <span style={{ fontSize: '46px', fontWeight: '900', color: COLORS.white, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{formatNumber(na)}</span>
          <span style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '2px', color: aLead ? COLORS.yellow : COLORS.faintWhite, textTransform: 'uppercase' }}>{aLead ? 'Lead' : ''}</span>
        </div>
        <div style={{ marginTop: '10px', height: '8px', background: 'rgba(255,255,255,0.06)', border: `1px solid rgba(255,255,255,0.05)`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ width: ratioA, height: '100%', background: aLead ? COLORS.yellow : 'rgba(255,255,255,0.20)' }} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '10px 12px' }}>
        <div style={{ width: '100%', height: '100%', background: COLORS.yellow, border: `1px solid rgba(42,42,42,0.14)`, boxShadow: UI.bevelInset, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: '8px', border: '1px solid rgba(42,42,42,0.10)' }} />
          <span style={{ fontSize: '13px', fontWeight: '900', color: COLORS.black, letterSpacing: '2px', textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.25 }}>{label}</span>
        </div>
      </div>

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '14px 30px 14px 26px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: bLead ? '4px' : '0px', background: COLORS.yellow, transition: 'width 0.3s' }} />
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '16px' }}>
          <span style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '2px', color: bLead ? COLORS.yellow : COLORS.faintWhite, textTransform: 'uppercase' }}>{bLead ? 'Lead' : ''}</span>
          <span style={{ fontSize: '46px', fontWeight: '900', color: COLORS.white, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{formatNumber(nb)}</span>
        </div>
        <div style={{ marginTop: '10px', height: '8px', background: 'rgba(255,255,255,0.06)', border: `1px solid rgba(255,255,255,0.05)`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ width: ratioB, height: '100%', background: bLead ? COLORS.yellow : 'rgba(255,255,255,0.20)', marginLeft: 'auto' }} />
        </div>
      </div>
    </div>
  );
};

const TemplateStatsClassic = ({ matchData, statsData }) => {
  const vis = matchData.statsTemplateVisibility || {};
  const nameA = matchData.teamA || 'TEAM A';
  const nameB = matchData.teamB || 'TEAM B';

  let delayCounter = 0;
  const getDelay = () => { delayCounter += 1; return 0.08 + (delayCounter * 0.1); };

  return (
    <div style={{ width: '1420px', display: 'flex', flexDirection: 'column', gap: 0, zIndex: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px 1fr', minHeight: '126px', background: COLORS.black, border: `2px solid ${COLORS.yellow}`, boxShadow: `${UI.panelShadow}, ${UI.yellowGlow}`, position: 'relative', overflow: 'hidden', opacity: 0, willChange: 'opacity, transform', animation: 'statsHeaderDrop 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.014) 0 1px, transparent 1px 22px)', pointerEvents: 'none', opacity: 0.18 }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '18px', padding: '20px 30px', position: 'relative', zIndex: 1, minWidth: 0 }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: '38px', fontWeight: '900', color: COLORS.white, letterSpacing: '1px', textTransform: 'uppercase', lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nameA}</span>
          </div>
          <div style={{ width: '82px', height: '82px', backgroundColor: matchData.logoBgA, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, border: `1px solid rgba(0,0,0,0.14)`, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)' }}>
            <img src={matchData.logoA} alt="A" style={{ height: '74%', maxWidth: '74%', objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
          </div>
        </div>

        <div style={{ background: COLORS.yellow, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '22px', borderLeft: `2px solid ${COLORS.black}`, borderRight: `2px solid ${COLORS.black}`, position: 'relative', zIndex: 1, boxShadow: UI.bevelInset }}>
          <div style={{ position: 'absolute', inset: '10px 14px', border: '1px solid rgba(42,42,42,0.14)' }} />
          <span style={{ fontSize: '82px', fontWeight: '900', color: COLORS.black, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{matchData.scoreA}</span>
          <span style={{ fontSize: '18px', fontWeight: '900', color: 'rgba(42,42,42,0.55)', letterSpacing: '2px', textTransform: 'uppercase' }}>VS</span>
          <span style={{ fontSize: '82px', fontWeight: '900', color: COLORS.black, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{matchData.scoreB}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '18px', padding: '20px 30px', position: 'relative', zIndex: 1, minWidth: 0 }}>
          <div style={{ width: '82px', height: '82px', backgroundColor: matchData.logoBgB, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, border: `1px solid rgba(0,0,0,0.14)`, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)' }}>
            <img src={matchData.logoB} alt="B" style={{ height: '74%', maxWidth: '74%', objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'flex-start' }}>
            <span style={{ fontSize: '38px', fontWeight: '900', color: COLORS.white, letterSpacing: '1px', textTransform: 'uppercase', lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nameB}</span>
          </div>
        </div>
      </div>

      <div style={{ background: COLORS.black, borderLeft: `2px solid ${COLORS.yellow}`, borderRight: `2px solid ${COLORS.yellow}`, borderBottom: `2px solid ${COLORS.yellow}`, boxShadow: `${UI.panelShadow}, ${UI.yellowGlow}`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.012) 0 1px, transparent 1px 22px)', pointerEvents: 'none', opacity: 0.12 }} />
        <div style={{ height: '58px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', borderBottom: `2px solid ${COLORS.yellow}`, position: 'relative', zIndex: 1 }}>
          <div style={{ width: '8px', height: '8px', background: COLORS.yellow }} />
          <span style={{ fontSize: '14px', fontWeight: '900', color: COLORS.yellow, letterSpacing: '3px', textTransform: 'uppercase' }}>Post-Match Key Stats // 赛后关键数据</span>
          <div style={{ width: '8px', height: '8px', background: COLORS.yellow }} />
        </div>

        {vis.elims !== false && <StatCompareRow label="Total Eliminations" a={statsData.elimsA} b={statsData.elimsB} delay={getDelay()} />}
        {vis.assists !== false && <StatCompareRow label="Total Assists" a={statsData.assistsA} b={statsData.assistsB} delay={getDelay()} />}
        {vis.deaths !== false && <StatCompareRow label="Total Deaths" a={statsData.deathsA} b={statsData.deathsB} delay={getDelay()} />}
        {vis.damage !== false && <StatCompareRow label="Total Damage" a={statsData.damageA} b={statsData.damageB} delay={getDelay()} />}
        {vis.healing !== false && <StatCompareRow label="Total Healing" a={statsData.healingA} b={statsData.healingB} delay={getDelay()} />}
        {vis.mitigated !== false && <StatCompareRow label="Total Mitigated" a={statsData.mitigatedA} b={statsData.mitigatedB} delay={getDelay()} />}
      </div>
    </div>
  );
};

// ==========================================
// 修改后的 ImageStatsRowPRO 组件：彻底修复 Flex 溢出
// ==========================================
const ImageStatsRowPRO = ({
  shortName,
  logo,
  logoBg,
  score,
  imageSrc,
  cropX,
  cropY,
  cropScale,
  dockWidth,
  viewportWidth,
  viewportHeight,
  animationDelay = 0
}) => {
  const imageStyle = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: `${BASE_IMAGE_W * cropScale}px`,
    height: `${BASE_IMAGE_H * cropScale}px`,
    transform: `translate(${-cropX * cropScale}px, ${-cropY * cropScale}px)`,
    objectFit: 'none',
    userSelect: 'none',
    pointerEvents: 'none',
    display: 'block'
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `${dockWidth}px ${viewportWidth}px`,
      height: `${viewportHeight}px`,
      background: 'rgba(18,18,18,0.92)',
      border: `1px solid ${COLORS.lineStrong}`,
      boxShadow: `${UI.panelShadow}, ${UI.insetLine}`,
      overflow: 'hidden',
      position: 'relative',
      opacity: 0,
      animation: `proPanelIn 0.58s cubic-bezier(0.16, 1, 0.3, 1) ${animationDelay}s forwards`
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.012) 0 1px, transparent 1px 24px)', pointerEvents: 'none', opacity: 0.12 }} />
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: COLORS.yellow, zIndex: 3 }} />

      {/* 左侧 Dock 面板 */}
      <div style={{
        height: '100%', 
        borderRight: `1px solid ${COLORS.line}`,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1
      }}>
        {/* 上方黑色区域：填满无边框的自动缩放 Logo */}
        <div style={{ 
          flex: 1, 
          position: 'relative',
          background: COLORS.black, 
        }}>
          <div style={{
            position: 'absolute',
            inset: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img 
              src={logo} 
              alt={shortName || 'TEAM'} 
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
              onError={e => e.target.style.display = 'none'} 
            />
          </div>
        </div>

        {/* 下方黄色区域：包含队伍简称和比分 */}
        <div style={{
          height: '82px',
          flexShrink: 0,
          background: COLORS.yellow,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          borderTop: `1px solid rgba(0,0,0,0.1)`,
          boxShadow: UI.bevelInset,
          boxSizing: 'border-box'
        }}>
           <span style={{ 
             fontSize: shortName && shortName.length > 4 ? '36px' : '44px', 
             fontWeight: '900', 
             color: COLORS.black, 
             letterSpacing: '1px', 
             textTransform: 'uppercase',
             whiteSpace: 'nowrap',
             overflow: 'hidden',
             textOverflow: 'ellipsis',
             maxWidth: '180px' 
           }}>
             {shortName}
           </span>
           <span style={{ 
             fontSize: '58px', 
             fontWeight: '900', 
             color: COLORS.black, 
             lineHeight: 1, 
             fontVariantNumeric: 'tabular-nums' 
           }}>
             {scoreText(score)}
           </span>
        </div>
      </div>

      {/* 右侧：图片裁切区域 */}
      <div style={{ position: 'relative', width: `${viewportWidth}px`, height: '100%', overflow: 'hidden', background: '#000', zIndex: 1 }}>
        {imageSrc ? (
          <img src={imageSrc} alt={`${shortName || 'TEAM'} crop`} style={imageStyle} onError={e => { e.target.src = '/assets/screenshots/placeholder.png'; }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: COLORS.softWhite }}>
            <span style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '3px', textTransform: 'uppercase', color: COLORS.yellow }}>No Image Source</span>
            <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase' }}>statsImageTempUrl / statsImagePath</span>
          </div>
        )}
        <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05), inset 0 0 80px rgba(0,0,0,0.12)', pointerEvents: 'none' }} />
      </div>
    </div>
  );
};

const ImageStatsPRO = ({ matchData, statsImageSrc }) => {
  const cropX = num(matchData.cropX, 460);
  const cropW = num(matchData.cropW, 1000);
  const cropH = num(matchData.cropH, 320);
  const cropY1 = num(matchData.cropY1, 195);
  const cropY2 = num(matchData.cropY2, 600);
  const cropScale = num(matchData.cropScale, 100) / 100;

  const dockWidth = 318;
  const viewportWidth = Math.round(cropW * cropScale);
  const viewportHeight = Math.round(cropH * cropScale);
  const totalWidth = dockWidth + viewportWidth;
  const colLabels = ['E', 'A', 'D', 'DMG', 'HEAL', 'MIT'];

  const teamShortA = getDisplayTeamName(matchData.teamShortA, matchData.teamA, 'TEAM A');
  const teamShortB = getDisplayTeamName(matchData.teamShortB, matchData.teamB, 'TEAM B');

  const infoSegments = useMemo(() => {
    const source = splitInfoText(matchData.info || matchData.infoSubtitle || '');
    return source.length ? source : ['MATCH DATA', 'PRO IMAGE PANEL'];
  }, [matchData.info, matchData.infoSubtitle]);

  const labelAnchors = [507, 563, 620, 705, 803, 905].map(v => Math.round(v * cropScale));

  return (
    <div style={{ position: 'absolute', top: '102px', left: '50%', transform: 'translateX(-50%)', width: `${totalWidth}px`, display: 'flex', flexDirection: 'column', gap: '16px', zIndex: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'end', gap: '28px', paddingBottom: '14px', borderBottom: `1px solid ${COLORS.line}`, opacity: 0, animation: 'statsHeaderDrop 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '24px', height: '24px', backgroundColor: COLORS.yellow, boxShadow: '0 0 16px rgba(244,195,32,0.18)' }} />
            <span style={{ fontSize: '30px', fontWeight: '900', color: COLORS.white, letterSpacing: '4px', textTransform: 'uppercase' }}>FRIES CUP</span>
          </div>
          <div style={{ width: '360px', height: '8px', background: `linear-gradient(90deg, ${COLORS.yellow} 0%, rgba(244,195,32,0.14) 100%)`, border: '1px solid rgba(244,195,32,0.16)', boxShadow: UI.yellowGlow }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', minWidth: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', columnGap: '12px', rowGap: '6px', maxWidth: '720px' }}>
            {infoSegments.map((item, index) => (
              <React.Fragment key={`${item}-${index}`}>
                {index > 0 && <span style={{ color: COLORS.faintWhite, fontSize: '13px', fontWeight: '900' }}>|</span>}
                <span style={{ color: COLORS.white, fontSize: '14px', fontWeight: '900', letterSpacing: '1px', whiteSpace: 'nowrap' }}>{item}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <ImageStatsRowPRO
        shortName={teamShortA}
        logo={matchData.logoA}
        logoBg={matchData.logoBgA}
        score={matchData.scoreA}
        imageSrc={statsImageSrc}
        cropX={cropX}
        cropY={cropY1}
        cropScale={cropScale}
        dockWidth={dockWidth}
        viewportWidth={viewportWidth}
        viewportHeight={viewportHeight}
        animationDelay={0.08}
      />

      <div style={{ display: 'grid', gridTemplateColumns: `${dockWidth}px ${viewportWidth}px`, alignItems: 'center', height: '20px', opacity: 0, animation: 'proStripIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) 0.14s forwards' }}>
        <div />
        <div style={{ position: 'relative', height: '100%' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: '1px', background: 'rgba(255,255,255,0.06)', transform: 'translateY(-50%)' }} />
          {colLabels.map((label, index) => (
            <div
              key={label}
              style={{
                position: 'absolute',
                left: `${labelAnchors[index]}px`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                minWidth: label === 'DMG' ? '44px' : label === 'MIT' ? '34px' : label === 'HEAL' ? '46px' : '26px',
                textAlign: 'center',
                background: COLORS.black,
                padding: '0 6px'
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: '900', color: COLORS.yellow, letterSpacing: '2px', textTransform: 'uppercase' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <ImageStatsRowPRO
        shortName={teamShortB}
        logo={matchData.logoB}
        logoBg={matchData.logoBgB}
        score={matchData.scoreB}
        imageSrc={statsImageSrc}
        cropX={cropX}
        cropY={cropY2}
        cropScale={cropScale}
        dockWidth={dockWidth}
        viewportWidth={viewportWidth}
        viewportHeight={viewportHeight}
        animationDelay={0.18}
      />
    </div>
  );
};

export default function StatsScene({ matchData, isActive = false }) {
  const statsData = matchData.statsTemplateData || {};
  const statsMode = matchData.statsMode || 'TEMPLATE';
  const statsTheme = matchData.statsTheme || 'CLASSIC';
  const statsImageSrc = matchData.statsImageTempUrl || matchData.statsImagePath || '/assets/screenshots/placeholder.png';
  const [techTime, setTechTime] = useState('');

  useEffect(() => {
    if (!isActive) return;
    const timer = setInterval(() => {
      const now = new Date();
      setTechTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [isActive]);

  return (
    <div style={containerStyle}>
      <style>{`
        @keyframes statsRowSlideIn { 0% { opacity: 0; transform: translateY(18px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes statsHeaderDrop { 0% { opacity: 0; transform: translateY(-22px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes imageFrameExpand { 0% { opacity: 0; transform: scale(0.985); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes proPanelIn { 0% { opacity: 0; transform: translateY(16px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes proStripIn { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.014) 1px, transparent 1px)', backgroundSize: '120px 120px, 120px 120px', opacity: 0.24 }} />
      <div style={{ position: 'absolute', left: '70px', top: '70px', width: '520px', height: '520px', border: '1px solid rgba(244,195,32,0.06)', transform: 'rotate(45deg)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: '-120px', bottom: '-120px', width: '460px', height: '460px', border: '1px solid rgba(255,255,255,0.03)', transform: 'rotate(45deg)', pointerEvents: 'none' }} />

      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '44px', background: 'rgba(255,255,255,0.02)', borderBottom: `1px solid ${COLORS.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', boxSizing: 'border-box', backdropFilter: 'blur(4px)', zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '10px', height: '10px', background: COLORS.yellow, boxShadow: '0 0 12px rgba(244,195,32,0.28)' }} />
          <span style={{ fontSize: '12px', fontWeight: '900', letterSpacing: '2px', color: COLORS.softWhite }}>FCUP_DATA_INTERFACE</span>
        </div>
        <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '2px', color: 'rgba(255,255,255,0.38)' }}>STATS_CORE // STABLE</div>
      </div>

      {statsMode === 'TEMPLATE' && (
        <>
          <div style={{ position: 'absolute', top: '56px', left: '80px', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: '30px', height: '30px', backgroundColor: COLORS.yellow, boxShadow: '0 0 16px rgba(244,195,32,0.18)' }} />
              <span style={{ fontSize: '32px', fontWeight: '900', color: COLORS.white, letterSpacing: '4px', textTransform: 'uppercase' }}>FRIES CUP</span>
            </div>
            <div style={{ width: '420px', height: '8px', background: `linear-gradient(90deg, ${COLORS.yellow} 0%, rgba(244,195,32,0.14) 100%)`, border: '1px solid rgba(244,195,32,0.16)', boxShadow: UI.yellowGlow, marginTop: '10px' }} />
            <span style={{ fontSize: '16px', fontWeight: '900', color: 'rgba(255,255,255,0.58)', marginTop: '12px', letterSpacing: '2.4px', textTransform: 'uppercase' }}>{matchData.infoSubtitle || 'MATCH STATS'}</span>
          </div>

          <div style={{ position: 'absolute', top: '96px', left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {/* Template 模式下直接无条件渲染 Classic */}
            <TemplateStatsClassic matchData={matchData} statsData={statsData} />
          </div>
        </>
      )}

      {statsMode === 'IMAGE' && statsTheme === 'PRO' && (
        <ImageStatsPRO matchData={matchData} statsImageSrc={statsImageSrc} />
      )}

      {statsMode === 'IMAGE' && statsTheme !== 'PRO' && (
        <div style={{ position: 'absolute', top: '92px', left: '50%', transform: 'translateX(-50%)', width: '1568px', height: '882px', zIndex: 10 }}>
          <div style={{ width: '100%', height: '100%', background: COLORS.black, border: `2px solid ${COLORS.yellow}`, boxShadow: `${UI.panelShadow}, ${UI.yellowGlow}`, opacity: 0, willChange: 'opacity, transform', animation: 'imageFrameExpand 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards', overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.012) 0 1px, transparent 1px 22px)', pointerEvents: 'none', opacity: 0.10 }} />
            <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '40px', height: '6px', backgroundColor: COLORS.yellow }} />
            <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '6px', height: '40px', backgroundColor: COLORS.yellow }} />
            <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '40px', height: '6px', backgroundColor: COLORS.yellow }} />
            <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '6px', height: '40px', backgroundColor: COLORS.yellow }} />

            <div style={{ position: 'absolute', left: '50%', top: '50%', width: '1456px', height: '819px', transform: 'translate(-50%, -50%)', background: '#000', border: `1px solid ${COLORS.lineStrong}`, overflow: 'hidden', boxShadow: UI.insetLine }}>
              <img src={statsImageSrc} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', background: '#000' }} alt="stats screenshot" onError={e => { e.target.src = '/assets/screenshots/placeholder.png'; }} />
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', boxShadow: 'inset 0 0 80px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(255,255,255,0.04)' }} />
            </div>

            <div style={{ position: 'absolute', right: '24px', bottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 2 }}>
              <span style={{ color: COLORS.white, fontSize: '12px', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', opacity: 0.82 }}>{matchData.infoCupName || 'FRIES CUP'}</span>
              <div style={{ width: '36px', height: '1px', background: 'rgba(255,255,255,0.35)' }} />
              <span style={{ color: COLORS.yellow, fontSize: '11px', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase' }}>Match Stats Review</span>
            </div>
          </div>
        </div>
      )}

      <div style={{ position: 'absolute', bottom: '80px', left: '80px', width: 'calc(100% - 160px)', height: '2px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
      <div style={{ position: 'absolute', bottom: '60px', left: '80px', right: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', color: 'rgba(255,255,255,0.26)', fontSize: '11px', fontWeight: '900', letterSpacing: '1.8px', fontVariantNumeric: 'tabular-nums', textTransform: 'uppercase' }}>
        <div>FCUP_DATA_CORE // STATS_RENDER_ACTIVE</div>
        <div style={{ display: 'flex', gap: '40px' }}>
          <span>Theme: {statsTheme} | Mode: {statsMode}</span>
          <span style={{ color: COLORS.yellow, opacity: 0.9 }}>TC: {techTime || '--:--:--'}</span>
        </div>
      </div>
    </div>
  );
}