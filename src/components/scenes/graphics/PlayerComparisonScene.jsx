import React from 'react';

const COLORS = {
  black: '#2a2a2a', yellow: '#f4c320', white: '#ffffff',
  deepBlack: '#101010', panel: '#141414', panel2: '#1a1a1a',
  line: 'rgba(255,255,255,0.08)', lineStrong: 'rgba(255,255,255,0.18)',
  softWhite: 'rgba(255,255,255,0.72)', faintWhite: 'rgba(255,255,255,0.26)',
  gray: 'rgba(255,255,255,0.05)'
};

const UI = {
  outerFrame: `1px solid ${COLORS.lineStrong}`,
  innerFrame: `1px solid ${COLORS.line}`,
  panelShadow: '0 10px 24px rgba(0,0,0,0.22)',
  hardShadow: '0 18px 40px rgba(0,0,0,0.28)',
  yellowGlow: '0 0 0 1px rgba(244,195,32,0.16), 0 0 18px rgba(244,195,32,0.08)'
};

const safeText = v => String(v || '').trim();
const toNum = v => Number(v) || 0;

const formatHeroName = (name) => {
  if (!name || name === '-') return 'unknown';
  return name.toLowerCase().replace(/ /g, '_').replace(/:/g, '').replace(/-/g, '_').replace(/\./g, '');
};

const getRoleFolder = (role) => {
  const r = String(role || '').toUpperCase();
  if (r === 'TANK') return 'tank';
  if (r === 'SUP' || r === 'SUPPORT') return 'support';
  return 'damage'; 
};

// 🌟 数据条组件：自带动态能量槽
const ComparisonRow = ({ label, valA, valB }) => {
  const numA = toNum(valA);
  const numB = toNum(valB);
  
  // 识别是否是死亡类指标（越低越好）
  const isReverse = String(label).includes('死亡') || String(label).includes('阵亡');

  let isAWin = false, isBWin = false;
  let pctA = 0, pctB = 0;

  const maxVal = Math.max(numA, numB) || 1;

  if (isReverse) {
    isAWin = numA < numB && numA >= 0; 
    isBWin = numB < numA && numB >= 0;
    
    if (numA === numB) {
      pctA = 100; pctB = 100;
    } else {
      pctA = isAWin ? 100 : (numA === 0 ? 0 : (numB / numA) * 100);
      pctB = isBWin ? 100 : (numB === 0 ? 0 : (numA / numB) * 100);
    }
  } else {
    isAWin = numA > numB;
    isBWin = numB > numA;
    pctA = Math.max(2, (numA / maxVal) * 100); 
    pctB = Math.max(2, (numB / maxVal) * 100);
  }

  const aColor = isAWin ? COLORS.yellow : COLORS.white;
  const bColor = isBWin ? COLORS.yellow : COLORS.white;

  return (
    // 🌟 与上方 Header 共享 1fr 240px 1fr 的网格模型，保证完美对齐
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px 1fr', height: '86px', marginBottom: '14px', background: 'rgba(255,255,255,0.02)', border: UI.innerFrame }}>
      
      {/* 左侧数据槽 */}
      <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '50px' }}>
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${pctA}%`, background: isAWin ? 'linear-gradient(90deg, transparent, rgba(244,195,32,0.25))' : COLORS.gray, transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }} />
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '4px', background: isAWin ? COLORS.yellow : 'rgba(255,255,255,0.1)' }} />
        <span style={{ fontSize: '56px', fontWeight: '900', color: aColor, fontVariantNumeric: 'tabular-nums', letterSpacing: '-1px', zIndex: 1, textShadow: isAWin ? '0 4px 16px rgba(244,195,32,0.4)' : '0 4px 12px rgba(0,0,0,0.5)' }}>
          {valA || '0'}
        </span>
      </div>
      
      {/* 中间指标标签 */}
      <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.6)', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: UI.innerFrame, borderRight: UI.innerFrame }}>
        <span style={{ fontSize: '14px', fontWeight: '900', color: COLORS.faintWhite, letterSpacing: '2px', textTransform: 'uppercase' }}>{label}</span>
      </div>

      {/* 右侧数据槽 */}
      <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', paddingLeft: '50px' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pctB}%`, background: isBWin ? 'linear-gradient(-90deg, transparent, rgba(244,195,32,0.25))' : COLORS.gray, transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }} />
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: isBWin ? COLORS.yellow : 'rgba(255,255,255,0.1)' }} />
        <span style={{ fontSize: '56px', fontWeight: '900', color: bColor, fontVariantNumeric: 'tabular-nums', letterSpacing: '-1px', zIndex: 1, textShadow: isBWin ? '0 4px 16px rgba(244,195,32,0.4)' : '0 4px 12px rgba(0,0,0,0.5)' }}>
          {valB || '0'}
        </span>
      </div>
    </div>
  );
};

export default function PlayerComparisonScene({ matchData = {} }) {
  const data = matchData.playerComparisonData || {};
  
  const nameA = safeText(data.nameA) || 'PLAYER A';
  const teamA = safeText(data.teamA) || 'TEAM A';
  const battletagA = safeText(data.battletagA) || '';
  const heroA = safeText(data.heroA);
  const roleA = safeText(data.roleA) || 'DPS';

  const nameB = safeText(data.nameB) || 'PLAYER B';
  const teamB = safeText(data.teamB) || 'TEAM B';
  const battletagB = safeText(data.battletagB) || '';
  const heroB = safeText(data.heroB);
  const roleB = safeText(data.roleB) || 'DPS';

  const presetKey = safeText(data.presetKey) || 'H2H';

  const metrics = [
    { label: safeText(data.stat1Label), a: safeText(data.stat1A), b: safeText(data.stat1B) },
    { label: safeText(data.stat2Label), a: safeText(data.stat2A), b: safeText(data.stat2B) },
    { label: safeText(data.stat3Label), a: safeText(data.stat3A), b: safeText(data.stat3B) },
    { label: safeText(data.stat4Label), a: safeText(data.stat4A), b: safeText(data.stat4B) },
    { label: safeText(data.stat5Label), a: safeText(data.stat5A), b: safeText(data.stat5B) }
  ].filter(m => m.label);

  const heroPathA = heroA ? `/assets/heroes/${getRoleFolder(roleA)}/${formatHeroName(heroA)}.png` : null;
  const heroPathB = heroB ? `/assets/heroes/${getRoleFolder(roleB)}/${formatHeroName(heroB)}.png` : null;

  return (
    <div style={{ width: '1920px', height: '1080px', position: 'relative', overflow: 'hidden', backgroundColor: COLORS.black, fontFamily: '"HarmonyOS Sans SC", sans-serif' }}>
      {/* 背景点阵 */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.014) 1px, transparent 1px)', backgroundSize: '120px 120px', opacity: 0.18, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: '70px', top: '70px', width: '520px', height: '520px', border: '1px solid rgba(244,195,32,0.06)', transform: 'rotate(45deg)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: '-120px', bottom: '-120px', width: '460px', height: '460px', border: '1px solid rgba(255,255,255,0.03)', transform: 'rotate(45deg)', pointerEvents: 'none' }} />

      {/* 顶部指示条 */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '44px', background: 'rgba(255,255,255,0.02)', borderBottom: `1px solid ${COLORS.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', boxSizing: 'border-box', backdropFilter: 'blur(4px)', zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '10px', height: '10px', background: COLORS.yellow, boxShadow: '0 0 12px rgba(244,195,32,0.28)' }} />
          <span style={{ fontSize: '12px', fontWeight: '900', letterSpacing: '2px', color: COLORS.softWhite }}>FCUP_DATA_SYS // HEAD_TO_HEAD_INTERFACE</span>
        </div>
        <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '2px', color: 'rgba(255,255,255,0.38)' }}>PRESET // {presetKey}</div>
      </div>

      {/* 主画布容器 */}
      <div style={{ position: 'absolute', top: '100px', left: '100px', right: '100px', bottom: '80px', display: 'flex', flexDirection: 'column' }}>
        
        {/* 🌟 全新向心排版 Header：头像固定在外边缘，名字向中央 VS 靠拢 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px 1fr', alignItems: 'center', marginBottom: '40px' }}>
          
          {/* 左侧：选手 A */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '30px' }}>
             {/* 头像咬死最左侧边缘 */}
             <div style={{ width: '280px', height: '280px', border: `2px solid ${COLORS.yellow}`, background: 'radial-gradient(circle at center, rgba(244,195,32,0.15) 0%, #101010 70%)', boxShadow: UI.hardShadow, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
               {heroPathA && (
                 <img 
                   src={heroPathA} 
                   alt="Hero A" 
                   style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} 
                   onError={(e) => { e.target.style.display = 'none'; }} 
                 />
               )}
               <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 80px rgba(0,0,0,0.8)', zIndex: 2 }} />
             </div>
             
             {/* 名字锚点：靠右（贴近中心 VS） */}
             <div style={{ textAlign: 'right', flex: 1, minWidth: 0, paddingRight: '20px' }}>
               <div style={{ display: 'inline-block', padding: '6px 14px', background: COLORS.yellow, color: COLORS.black, fontSize: '16px', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px', boxShadow: UI.yellowGlow }}>{teamA}</div>
               <div style={{ fontSize: '86px', fontWeight: '900', color: COLORS.white, lineHeight: 0.9, textTransform: 'uppercase', textShadow: '0 4px 18px rgba(0,0,0,0.4)', letterSpacing: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nameA}</div>
               {battletagA && battletagA !== nameA && (
                 <div style={{ fontSize: '24px', fontWeight: '900', color: 'rgba(255,255,255,0.45)', letterSpacing: '2px', marginTop: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{battletagA}</div>
               )}
             </div>
          </div>

          {/* 中央 VS 标志 */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '64px', fontWeight: '900', color: COLORS.yellow, letterSpacing: '6px', fontStyle: 'italic', textShadow: '0 4px 24px rgba(244,195,32,0.4)' }}>VS</div>
          </div>

          {/* 右侧：选手 B */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '30px' }}>
             {/* 名字锚点：靠左（贴近中心 VS） */}
             <div style={{ textAlign: 'left', flex: 1, minWidth: 0, paddingLeft: '20px' }}>
               <div style={{ display: 'inline-block', padding: '6px 14px', background: COLORS.yellow, color: COLORS.black, fontSize: '16px', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px', boxShadow: UI.yellowGlow }}>{teamB}</div>
               <div style={{ fontSize: '86px', fontWeight: '900', color: COLORS.white, lineHeight: 0.9, textTransform: 'uppercase', textShadow: '0 4px 18px rgba(0,0,0,0.4)', letterSpacing: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nameB}</div>
               {battletagB && battletagB !== nameB && (
                 <div style={{ fontSize: '24px', fontWeight: '900', color: 'rgba(255,255,255,0.45)', letterSpacing: '2px', marginTop: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{battletagB}</div>
               )}
             </div>

             {/* 头像咬死最右侧边缘，水平翻转形成对峙感 */}
             <div style={{ width: '280px', height: '280px', border: `2px solid ${COLORS.yellow}`, background: 'radial-gradient(circle at center, rgba(244,195,32,0.15) 0%, #101010 70%)', boxShadow: UI.hardShadow, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
               {heroPathB && (
                 <img 
                   src={heroPathB} 
                   alt="Hero B" 
                   style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', transform: 'scaleX(-1)' }} 
                   onError={(e) => { e.target.style.display = 'none'; }} 
                 />
               )}
               <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 80px rgba(0,0,0,0.8)', zIndex: 2 }} />
             </div>
          </div>
        </div>

        {/* 核心数据对位区（彻底去掉了外部 padding，让外边框与头像精准对齐） */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {metrics.map((m, idx) => (
            <ComparisonRow key={idx} label={m.label} valA={m.a} valB={m.b} />
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <div style={{ display: 'inline-block', width: '800px', height: '2px', background: `linear-gradient(90deg, transparent 0%, ${COLORS.lineStrong} 50%, transparent 100%)` }} />
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '30px', left: '80px', right: '80px', height: '1px', background: COLORS.lineStrong }} />
      <div style={{ position: 'absolute', bottom: '15px', left: '80px', color: 'rgba(255,255,255,0.2)', fontSize: '10px', fontWeight: '900', letterSpacing: '1px' }}>
        FRIES_CUP_DATA_ENGINE // H2H_ANALYTICS_V4 // {new Date().getFullYear()}
      </div>
    </div>
  );
}