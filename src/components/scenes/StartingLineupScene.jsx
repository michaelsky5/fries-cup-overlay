import React from 'react';

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
  insetLine: 'inset 0 0 0 1px rgba(255,255,255,0.04)',
  yellowGlow: '0 0 0 1px rgba(244,195,32,0.16), 0 0 18px rgba(244,195,32,0.08)' 
};

const safeText = v => String(v || '').trim();

// 核心逻辑：从大名单池中提取当前上场的首发选手信息
const getActiveLineup = (matchData, side) => {
  const isA = side === 'A';
  const teamName = isA ? matchData.teamA : matchData.teamB;
  const teamLogo = isA ? matchData.logoA : matchData.logoB;
  
  // LiveEditor 中设置的当前场上五人名单（字符串数组）
  const activeNames = (isA ? matchData.playersA : matchData.playersB) || [];
  // LiveEditor 导入的完整大名单池
  const rosterPool = (isA ? matchData.rosterPlayersA : matchData.rosterPlayersB) || [];

  const players = activeNames.map(name => {
    if (!name) return null;
    const found = rosterPool.find(p => p.nickname === name || p.battleTag === name);
    return found ? {
      nickname: safeText(found.nickname),
      battleTag: safeText(found.battleTag),
      role: safeText(found.role).toUpperCase() || 'UNKNOWN',
      heroImage: safeText(found.heroImage),
      heroScale: Number(found.heroScale) || 1.0,
      heroPosition: safeText(found.heroPosition) || '50% 24%',
      heroBrightness: Number(found.heroBrightness) || 0.84
    } : { nickname: name, role: 'TBD', heroImage: '' };
  });

  // 补齐 5 人位
  while (players.length < 5) {
    players.push(null);
  }

  return { teamName: teamName || `TEAM ${side}`, teamLogo, players: players.slice(0, 5) };
};

const displayPrimaryName = p => p ? (safeText(p.nickname) || safeText(p.battleTag) || 'PLAYER') : 'EMPTY';
const displaySecondaryName = p => { 
  if (!p) return '';
  const main = safeText(p.nickname); 
  const sub = safeText(p.battleTag); 
  return sub && sub !== main ? sub : ''; 
};

const PlayerCard = ({ player, index }) => {
  const isEmpty = !player;
  
  return (
    <div style={{ position: 'relative', height: '100%', minHeight: 0, overflow: 'hidden', background: 'linear-gradient(180deg, rgba(255,255,255,0.028) 0%, rgba(255,255,255,0.012) 100%)', border: `1px solid rgba(255,255,255,0.14)`, boxShadow: `${UI.panelShadow}, ${UI.insetLine}`, display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: isEmpty ? 'rgba(255,255,255,0.1)' : 'linear-gradient(90deg, rgba(244,195,32,0.95) 0%, rgba(244,195,32,0.22) 100%)', zIndex: 7 }} />
      <div style={{ position: 'absolute', top: '10px', left: '10px', width: '14px', height: '14px', borderTop: `2px solid ${isEmpty ? COLORS.faintWhite : COLORS.yellow}`, borderLeft: `2px solid ${isEmpty ? COLORS.faintWhite : COLORS.yellow}`, zIndex: 8 }} />
      <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '10px', fontWeight: '900', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.18)', textTransform: 'uppercase', zIndex: 8 }}>{String(index + 1).padStart(2, '0')}</div>

      <div style={{ position: 'relative', flex: 1, minHeight: 0, padding: '12px', display: 'flex', flexDirection: 'column', zIndex: 2 }}>
        <div style={{ position: 'relative', flex: 1, minHeight: 0, background: COLORS.black, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          
          <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', bottom: '110px', background: 'linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.008) 100%)', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            {!isEmpty && player.heroImage && (
              <img 
                src={player.heroImage} 
                alt={displayPrimaryName(player)} 
                onError={e => { e.target.src = '/assets/roster/placeholder.jpg'; }} 
                style={{
                  width: '100%', height: '100%', objectFit: 'cover', objectPosition: player.heroPosition,
                  transform: `scale(${player.heroScale})`, transformOrigin: 'center center',
                  filter: `brightness(${player.heroBrightness}) contrast(1.04) saturate(0.9)`
                }} 
              />
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 14%, rgba(42,42,42,0.16) 62%, rgba(42,42,42,0.80) 100%)' }} />
          </div>

          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
            <div style={{ height: '3px', background: isEmpty ? COLORS.faintWhite : `linear-gradient(90deg, ${COLORS.white} 0 10%, ${COLORS.yellow} 10% 100%)` }} />
            <div style={{ position: 'relative', padding: '14px 14px 15px', background: 'linear-gradient(180deg, rgba(42,42,42,0.18) 0%, rgba(42,42,42,0.92) 100%)', borderTop: `1px solid ${COLORS.line}` }}>
              <div style={{ fontSize: '20px', fontWeight: '900', color: isEmpty ? COLORS.faintWhite : COLORS.white, lineHeight: 0.94, textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {displayPrimaryName(player)}
              </div>
              {!isEmpty && !!displaySecondaryName(player) && (
                <div style={{ marginTop: '5px', fontSize: '11px', fontWeight: '900', color: COLORS.faintWhite, letterSpacing: '1.1px', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {displaySecondaryName(player)}
                </div>
              )}
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '7px 11px', background: isEmpty ? 'transparent' : COLORS.yellow, border: isEmpty ? `1px solid ${COLORS.line}` : 'none', color: isEmpty ? COLORS.faintWhite : COLORS.black, fontSize: '11px', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase' }}>
                  {isEmpty ? 'TBD' : player.role}
                </div>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.10)' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TeamSection = ({ data, align }) => {
  const isLeft = align === 'left';
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Team Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '0 40px', marginBottom: '30px', flexDirection: isLeft ? 'row' : 'row-reverse' }}>
        <div style={{ width: '90px', height: '90px', background: 'rgba(255,255,255,0.02)', border: UI.outerFrame, boxShadow: `${UI.panelShadow}, ${UI.insetLine}`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '8px', [isLeft ? 'left' : 'right']: '8px', width: '12px', height: '12px', borderTop: `2px solid ${COLORS.yellow}`, [isLeft ? 'borderLeft' : 'borderRight']: `2px solid ${COLORS.yellow}` }} />
          <img src={data.teamLogo} alt={data.teamName} onError={e => { e.target.src = '/assets/logos/OW.jpg'; }} style={{ width: '70%', height: '70%', objectFit: 'contain' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: isLeft ? 'flex-start' : 'flex-end' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexDirection: isLeft ? 'row' : 'row-reverse' }}>
            <div style={{ width: '24px', height: '24px', backgroundColor: COLORS.yellow, boxShadow: '0 0 16px rgba(244,195,32,0.18)' }} />
            <span style={{ fontSize: '42px', fontWeight: '900', color: COLORS.white, letterSpacing: '4px', textTransform: 'uppercase' }}>{data.teamName}</span>
          </div>
          <div style={{ width: '400px', height: '4px', background: `linear-gradient(${isLeft ? '90deg' : '270deg'}, ${COLORS.yellow} 0%, rgba(244,195,32,0.14) 100%)`, marginTop: '8px' }} />
        </div>
      </div>

      {/* Roster Cards */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', padding: '0 40px' }}>
        {data.players.map((p, idx) => <PlayerCard key={idx} player={p} index={idx} />)}
      </div>
    </div>
  );
};

export default function StartingLineupScene({ matchData = {} }) {
  const teamA = getActiveLineup(matchData, 'A');
  const teamB = getActiveLineup(matchData, 'B');

  return (
    <div style={{ width: '1920px', height: '1080px', position: 'relative', overflow: 'hidden', backgroundColor: COLORS.black, fontFamily: '"HarmonyOS Sans SC", sans-serif' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.014) 1px, transparent 1px)', backgroundSize: '120px 120px', opacity: 0.18, pointerEvents: 'none' }} />
      
      {/* Top Bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '44px', background: 'rgba(255,255,255,0.02)', borderBottom: `1px solid ${COLORS.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '10px', height: '10px', background: COLORS.yellow, boxShadow: '0 0 12px rgba(244,195,32,0.28)' }} />
          <span style={{ fontSize: '12px', fontWeight: '900', letterSpacing: '2px', color: COLORS.softWhite }}>FCUP_STARTING_LINEUP</span>
        </div>
        <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '2px', color: 'rgba(255,255,255,0.38)' }}>MATCH_START // LIVE_SYNC</div>
      </div>

      {/* Main Content Grid (Left VS Right) */}
      <div style={{ position: 'absolute', top: '120px', left: 0, right: 0, bottom: '120px', display: 'grid', gridTemplateColumns: '1fr 1fr', zIndex: 10 }}>
        <TeamSection data={teamA} align="left" />
        <TeamSection data={teamB} align="right" />
      </div>

      {/* Center VS Graphic */}
      <div style={{ position: 'absolute', top: '120px', bottom: '120px', left: '50%', transform: 'translateX(-50%)', width: '2px', background: 'rgba(255,255,255,0.06)', zIndex: 5 }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '70px', height: '70px', background: COLORS.black, border: `2px solid ${COLORS.yellow}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: UI.yellowGlow }}>
          <span style={{ fontSize: '24px', fontWeight: '900', color: COLORS.yellow, letterSpacing: '2px', fontStyle: 'italic' }}>VS</span>
        </div>
      </div>

      {/* Bottom Status Line */}
      <div style={{ position: 'absolute', bottom: '60px', left: '40px', right: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid rgba(255,255,255,0.08)', paddingTop: '20px', color: 'rgba(255,255,255,0.26)', fontSize: '11px', fontWeight: '900', letterSpacing: '1.8px', textTransform: 'uppercase' }}>
        <span>SYS // LIVE_ROSTER_CONFIRMED</span>
        <span style={{ color: COLORS.yellow, opacity: 0.92 }}>10 PLAYERS READY</span>
      </div>
    </div>
  );
}