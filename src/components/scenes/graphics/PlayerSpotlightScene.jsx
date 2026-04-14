import React, { useMemo } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer
} from 'recharts';

const COLORS = {
  black: '#2a2a2a', yellow: '#f4c320', white: '#ffffff',
  deepBlack: '#101010', panel: '#141414', panel2: '#1a1a1a',
  line: 'rgba(255,255,255,0.08)', lineStrong: 'rgba(255,255,255,0.18)',
  softWhite: 'rgba(255,255,255,0.72)', faintWhite: 'rgba(255,255,255,0.26)'
};

const UI = {
  outerFrame: `1px solid ${COLORS.lineStrong}`,
  innerFrame: `1px solid ${COLORS.line}`,
  panelShadow: '0 10px 24px rgba(0,0,0,0.22)',
  hardShadow: '0 18px 40px rgba(0,0,0,0.28)',
  yellowGlow: '0 0 0 1px rgba(244,195,32,0.16), 0 0 18px rgba(244,195,32,0.08)'
};

const safeText = v => String(v || '').trim();

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

export default function PlayerSpotlightScene({ matchData = {} }) {
  const data = matchData.playerSpotlightData || {};

  const {
    cardTag = 'FOCUS PLAYER',
    displayName = 'UNKNOWN',
    battletag,
    teamShort = 'TBD',
    dataRole = 'FLEX',
    styleTag = '均衡型选手',
    styleDesc = '整体能力分布较为均衡。',
    playTime = '0m',
    signatureHero = '',
    topHeroes = '',
    metrics = [],
    radarData = [] // 🌟 直接从 Panel 接收算好的 6 轴绝对比例数据
  } = data;

  const heroList = useMemo(() => {
    return safeText(topHeroes).split('/').map(h => h.trim()).filter(h => h && h !== '-').slice(0, 3);
  }, [topHeroes]);

  const roleFolder = getRoleFolder(dataRole);
  const mainHero = signatureHero || heroList[0];

  return (
    <div style={{ width: '1920px', height: '1080px', position: 'relative', overflow: 'hidden', backgroundColor: COLORS.black, fontFamily: '"HarmonyOS Sans SC", sans-serif' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.014) 1px, transparent 1px)', backgroundSize: '120px 120px', opacity: 0.18, pointerEvents: 'none' }} />
      
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '44px', background: 'rgba(255,255,255,0.02)', borderBottom: `1px solid ${COLORS.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', boxSizing: 'border-box', backdropFilter: 'blur(4px)', zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '10px', height: '10px', background: COLORS.yellow, boxShadow: '0 0 12px rgba(244,195,32,0.28)' }} />
          <span style={{ fontSize: '12px', fontWeight: '900', letterSpacing: '2px', color: COLORS.softWhite }}>FCUP_DATA_SYS // PLAYER_SPOTLIGHT_V4</span>
        </div>
        <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '2px', color: 'rgba(255,255,255,0.38)' }}>SIGNAL_READY // 1080P_MASTER</div>
      </div>

      <div style={{ position: 'absolute', top: '100px', left: '80px', right: '80px', bottom: '80px', display: 'flex', gap: '30px' }}>
        
        <div style={{ width: '640px', height: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ flex: 1, border: `2px solid ${COLORS.yellow}`, background: COLORS.deepBlack, position: 'relative', boxShadow: UI.hardShadow, overflow: 'hidden' }}>
            
            {mainHero && (
              <img 
                src={`/assets/roster/${roleFolder}/${formatHeroName(mainHero)}.png`}
                alt={mainHero}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', opacity: 0.5, filter: 'contrast(1.2) grayscale(0.2)' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}

            <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 120px rgba(0,0,0,0.8)', background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.95) 100%)' }} />
            
            <div style={{ position: 'absolute', top: '20px', right: '-20px', fontSize: '140px', fontWeight: '900', color: 'rgba(255,255,255,0.06)', textTransform: 'uppercase', lineHeight: 0.8, pointerEvents: 'none' }}>
              {teamShort}
            </div>
            
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '50px', zIndex: 5 }}>
              <div style={{ display: 'inline-flex', padding: '6px 14px', background: COLORS.yellow, color: COLORS.black, fontSize: '18px', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '20px', boxShadow: UI.yellowGlow }}>{cardTag}</div>
              <div style={{ fontSize: '86px', fontWeight: '900', color: COLORS.white, lineHeight: 0.9, textTransform: 'uppercase', letterSpacing: '1px' }}>{displayName}</div>
              {battletag && <div style={{ fontSize: '24px', fontWeight: '900', color: COLORS.yellow, letterSpacing: '2px', textTransform: 'uppercase', marginTop: '15px', opacity: 0.8 }}>{battletag}</div>}
              <div style={{ width: '120px', height: '6px', background: COLORS.yellow, marginTop: '30px' }} />
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: UI.outerFrame, padding: '25px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', color: COLORS.yellow, fontWeight: '900', letterSpacing: '2px', marginBottom: '4px' }}>CURRENT_TEAM</div>
              <div style={{ fontSize: '32px', color: COLORS.white, fontWeight: '900' }}>{teamShort}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: COLORS.yellow, fontWeight: '900', letterSpacing: '2px', marginBottom: '4px' }}>DATA_ROLE</div>
              <div style={{ fontSize: '32px', color: COLORS.white, fontWeight: '900' }}>{dataRole}</div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '20px' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: UI.outerFrame, padding: '25px', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: COLORS.faintWhite, fontWeight: '900', letterSpacing: '2px', marginBottom: '10px' }}>TIME PLAYED</div>
              <div style={{ fontSize: '38px', color: COLORS.yellow, fontWeight: '900', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{playTime}</div>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.02)', border: UI.outerFrame, padding: '20px 30px', position: 'relative' }}>
              <div style={{ fontSize: '14px', color: COLORS.faintWhite, fontWeight: '900', letterSpacing: '2px', marginBottom: '15px' }}>HERO POOL</div>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                {heroList.map((hero, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '80px', height: '80px', background: 'rgba(0,0,0,0.4)', border: `1px solid ${idx === 0 ? COLORS.yellow : COLORS.line}`, padding: '4px' }}>
                      <img 
                        src={`/assets/heroes/${roleFolder}/${formatHeroName(hero)}.png`} 
                        alt={hero} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.style.background = '#333'; }}
                      />
                    </div>
                    <div style={{ fontSize: '11px', color: idx === 0 ? COLORS.yellow : COLORS.white, fontWeight: '900', textTransform: 'uppercase' }}>{hero}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', minHeight: 0 }}>
            
            {/* 🌟 还原 6 轴雷达图 */}
            <div style={{ background: 'rgba(0,0,0,0.2)', border: UI.outerFrame, position: 'relative', padding: '20px' }}>
              <div style={{ position: 'absolute', top: '15px', left: '20px', fontSize: '12px', fontWeight: '900', color: COLORS.yellow, letterSpacing: '2px' }}>RADAR MODEL</div>
              <div style={{ position: 'absolute', top: '15px', right: '20px', fontSize: '11px', fontWeight: '900', color: COLORS.faintWhite, letterSpacing: '1px', display: 'flex', gap: '15px' }}>
                <span><span style={{ color: COLORS.yellow }}>■</span> PLAYER</span>
                <span><span style={{ color: 'rgba(255,255,255,0.4)' }}>■</span> ROLE AVG</span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="55%" outerRadius="70%" data={radarData}>
                  {/* 使用真实的六边形蜘蛛网格 */}
                  <PolarGrid stroke="rgba(255,255,255,0.15)" gridType="polygon" />
                  {/* 优化文本的外边距，防止越界 */}
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 900, dy: 4 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  
                  {/* 真实平均值连线 */}
                  <Radar
                    name="Avg"
                    dataKey="avgScore"
                    stroke="rgba(255,255,255,0.42)"
                    fill="rgba(255,255,255,0.05)"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                  />
                  
                  {/* 选手真实的强弱切面 */}
                  <Radar
                    name="Player"
                    dataKey="score"
                    stroke={COLORS.yellow}
                    fill={COLORS.yellow}
                    fillOpacity={0.35}
                    strokeWidth={3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ flex: 1, background: `linear-gradient(135deg, rgba(244,195,32,0.1) 0%, transparent 100%)`, border: `1px solid ${COLORS.yellow}`, padding: '30px', position: 'relative' }}>
                <div style={{ fontSize: '14px', color: COLORS.yellow, fontWeight: '900', letterSpacing: '2px', marginBottom: '15px' }}>PLAYSTYLE PROFILE</div>
                <div style={{ fontSize: '42px', color: COLORS.white, fontWeight: '900', marginBottom: '15px', textTransform: 'uppercase' }}>{styleTag}</div>
                <div style={{ fontSize: '18px', color: COLORS.softWhite, fontWeight: '700', lineHeight: 1.6 }}>{styleDesc}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: UI.outerFrame, padding: '20px' }}>
                 <div style={{ fontSize: '12px', color: COLORS.faintWhite, fontWeight: '900', letterSpacing: '2px', marginBottom: '8px' }}>SIGNATURE_HERO</div>
                 <div style={{ fontSize: '28px', color: COLORS.white, fontWeight: '900', textTransform: 'uppercase' }}>{signatureHero || heroList[0] || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* 底部详细数据卡片，保持带排名进度条的设计不变 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px' }}>
            {metrics.map((m, idx) => {
              const rank = parseInt(m.rank) || 1;
              const total = parseInt(m.total) || 1;
              const percentile = total > 1 ? Math.round(((total - rank) / (total - 1)) * 100) : 100;
              const isFirst = rank === 1 && total > 1;

              return (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: UI.innerFrame, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '3px', background: 'rgba(255,255,255,0.06)' }}>
                    <div style={{ width: `${percentile}%`, height: '100%', background: COLORS.yellow, transition: 'width 0.5s ease-out' }} />
                  </div>
                  
                  <div style={{ padding: '18px 16px 12px' }}>
                    <div style={{ fontSize: '11px', color: COLORS.faintWhite, fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>
                      {m.label}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '38px', color: COLORS.white, fontWeight: '900', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{m.value || '0'}</div>
                      {isFirst && <div style={{ fontSize: '12px', color: COLORS.black, background: COLORS.yellow, padding: '2px 6px', fontWeight: '900' }}>TOP 1</div>}
                    </div>
                  </div>
                  
                  <div style={{ marginTop: 'auto', background: 'rgba(0,0,0,0.4)', padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: 800 }}>同职责排名</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                      <span style={{ fontSize: '14px', color: COLORS.white, fontWeight: 900 }}>NO.{rank}</span>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: 800 }}>/ {total}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '30px', left: '80px', right: '80px', height: '1px', background: COLORS.lineStrong }} />
      <div style={{ position: 'absolute', bottom: '15px', left: '80px', color: 'rgba(255,255,255,0.2)', fontSize: '10px', fontWeight: '900', letterSpacing: '1px' }}>
        FRIES_CUP_DATA_ENGINE // ANALYTICS_CORE_V4 // {new Date().getFullYear()}
      </div>
    </div>
  );
}