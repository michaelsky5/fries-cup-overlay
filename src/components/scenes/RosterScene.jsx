import React from 'react';

const COLORS = { black: '#2a2a2a', yellow: '#f4c320', white: '#ffffff', deepBlack: '#101010', panel: '#141414', panel2: '#1a1a1a', line: 'rgba(255,255,255,0.08)', lineStrong: 'rgba(255,255,255,0.18)', softWhite: 'rgba(255,255,255,0.72)', faintWhite: 'rgba(255,255,255,0.26)' };
const UI = { outerFrame: `1px solid ${COLORS.lineStrong}`, innerFrame: `1px solid ${COLORS.line}`, panelShadow: '0 10px 24px rgba(0,0,0,0.22)', hardShadow: '0 18px 40px rgba(0,0,0,0.28)', yellowGlow: '0 0 0 1px rgba(244,195,32,0.16), 0 0 18px rgba(244,195,32,0.08)', insetLine: 'inset 0 0 0 1px rgba(255,255,255,0.04)' };
const safeText = v => String(v || '').trim();

const ROSTER_PRESETS = {
  CRAZY_RABBIT: {
    teamName: 'CRAZY RABBIT',
    teamLogo: '/assets/logos/crazy-rabbit.jpg',
    clubName: 'FRENCH FRIES',
    manager: { nickname: '1', battleTag: '' },
    coaches: [],
    players: [
      { nickname: 'PLAYER1', battleTag: 'ID1', role: 'TANK', heroImage: '/assets/roster/player1.jpg', heroPosition: '30% 24%', heroScale: 1.1 },
      { nickname: 'PLAYER2', battleTag: 'ID2', role: 'DAMAGE', heroImage: '/assets/roster/player2.jpg', heroPosition: '46% 24%', heroScale: 1.14 },
      { nickname: 'PLAYER3', battleTag: 'ID3', role: 'DAMAGE', heroImage: '/assets/roster/player3.jpg', heroPosition: '38% 24%', heroScale: 1.12 },
      { nickname: 'PLAYER4', battleTag: 'ID4', role: 'DAMAGE', heroImage: '/assets/roster/player4.jpg', heroPosition: '50% 22%', heroScale: 1.08 },
      { nickname: 'PLAYER5', battleTag: 'ID5', role: 'SUPPORT', heroImage: '/assets/roster/player5.jpg', heroPosition: '43% 23%', heroScale: 1.1 },
      { nickname: 'PLAYER6', battleTag: 'ID6', role: 'SUPPORT', heroImage: '/assets/roster/player6.jpg', heroPosition: '40% 23%', heroScale: 1.08 },
      { nickname: 'PLAYER7', battleTag: 'ID7', role: 'SUPPORT', heroImage: '/assets/roster/player7.jpg', heroPosition: '58% 22%', heroScale: 1.1 }
    ]
  }
};

const normalizePlayer = p => ({ nickname: safeText(p?.nickname), battleTag: safeText(p?.battleTag), role: safeText(p?.role).toUpperCase(), heroImage: safeText(p?.heroImage), heroPosition: safeText(p?.heroPosition), heroScale: Number(p?.heroScale) || undefined, heroBrightness: Number(p?.heroBrightness) || undefined });
const normalizeCoach = c => ({ nickname: safeText(c?.nickname), battleTag: safeText(c?.battleTag) });

const getRosterData = matchData => {
  const presetKey = safeText(matchData.rosterPresetKey).toUpperCase(), preset = ROSTER_PRESETS[presetKey];
  if (preset) return { teamName: safeText(preset.teamName) || 'TEAM', teamLogo: safeText(preset.teamLogo) || '/assets/logos/OW.jpg', players: (preset.players || []).map(normalizePlayer).filter(p => ['TANK', 'DAMAGE', 'SUPPORT'].includes(p.role)).slice(0, 7), staff: { clubName: safeText(preset.clubName), showClubName: !!safeText(preset.clubName), manager: normalizeCoach(preset.manager), coaches: Array.isArray(preset.coaches) ? preset.coaches.map(normalizeCoach).filter(c => c.nickname || c.battleTag) : [] } };

  const target = matchData.rosterTeamTarget || 'A', players = target === 'B' ? (matchData.rosterPlayersB || []) : (matchData.rosterPlayersA || []), staff = target === 'B' ? (matchData.rosterStaffB || {}) : (matchData.rosterStaffA || {}), teamName = target === 'B' ? (matchData.teamB || 'TEAM B') : (matchData.teamA || 'TEAM A'), teamLogo = target === 'B' ? (matchData.logoB || '/assets/logos/OW.jpg') : (matchData.logoA || '/assets/logos/OW.jpg');
  return { teamName, teamLogo, players: players.map(normalizePlayer).filter(p => ['TANK', 'DAMAGE', 'SUPPORT'].includes(p.role)).slice(0, 7), staff: { clubName: safeText(staff.clubName), showClubName: !!staff.showClubName, manager: normalizeCoach(staff.manager), coaches: Array.isArray(staff.coaches) ? staff.coaches.map(normalizeCoach).filter(c => c.nickname || c.battleTag) : [] } };
};

const displayPrimaryName = p => safeText(p.nickname) || safeText(p.battleTag) || 'PLAYER';
const displaySecondaryName = p => { const main = safeText(p.nickname), sub = safeText(p.battleTag); return sub && sub !== main ? sub : ''; };
const displayStaffInline = p => { const main = safeText(p?.nickname), sub = safeText(p?.battleTag); return main && sub && main !== sub ? `${main} / ${sub}` : main || sub || '—'; };

const getHeroImageStyle = (player, total) => {
  const baseScale = total >= 7 ? 1.04 : total === 6 ? 1.02 : 1.0;
  const scale = player.heroScale || baseScale;
  const brightness = player.heroBrightness || 0.84;
  const position = player.heroPosition || '50% 24%';

  return {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: position,
    transform: `scale(${scale})`,
    transformOrigin: 'center center',
    filter: `brightness(${brightness}) contrast(1.04) saturate(0.9)`
  };
};

const StaffMeta = ({ label, value }) => (
  <div style={{ minWidth: '240px', background: 'rgba(255,255,255,0.02)', border: UI.outerFrame, boxShadow: UI.insetLine, padding: '10px 14px 12px', position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.012) 0 1px, transparent 1px 22px)', opacity: 0.18, pointerEvents: 'none' }} />
    <div style={{ position: 'relative', zIndex: 1, display: 'grid', gap: '6px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '8px', height: '8px', background: COLORS.yellow }} /><span style={{ fontSize: '10px', fontWeight: '900', color: COLORS.yellow, letterSpacing: '2px', textTransform: 'uppercase' }}>{label}</span></div>
      <div style={{ fontSize: '13px', fontWeight: '900', color: COLORS.white, letterSpacing: '0.4px', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
    </div>
  </div>
);

const RosterCard = ({ player, index, total }) => {
  const compact = total >= 7, titleSize = total >= 7 ? 20 : total === 6 ? 23 : 26, subSize = compact ? 10 : 11, roleSize = compact ? 10 : 11, shellPad = compact ? '10px' : '12px', footerPad = compact ? '12px 12px 13px' : '14px 14px 15px';

  return (
    <div style={{ position: 'relative', height: '100%', minHeight: 0, overflow: 'hidden', background: 'linear-gradient(180deg, rgba(255,255,255,0.028) 0%, rgba(255,255,255,0.012) 100%)', border: `1px solid rgba(255,255,255,0.14)`, boxShadow: `${UI.panelShadow}, ${UI.insetLine}`, display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.012) 0 1px, transparent 1px 22px)', opacity: 0.08, pointerEvents: 'none', zIndex: 1 }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, rgba(244,195,32,0.95) 0%, rgba(244,195,32,0.22) 100%)', zIndex: 7 }} />
      <div style={{ position: 'absolute', top: '10px', left: '10px', width: '14px', height: '14px', borderTop: `2px solid ${COLORS.yellow}`, borderLeft: `2px solid ${COLORS.yellow}`, zIndex: 8 }} />
      <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '10px', fontWeight: '900', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.18)', textTransform: 'uppercase', zIndex: 8 }}>{String(index + 1).padStart(2, '0')}</div>

      <div style={{ position: 'relative', flex: 1, minHeight: 0, padding: shellPad, display: 'flex', flexDirection: 'column', zIndex: 2 }}>
        <div style={{ position: 'relative', flex: 1, minHeight: 0, background: COLORS.black, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.025)' }}>
          
          <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', bottom: '104px', background: 'linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.008) 100%)', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: '8px', border: '1px solid rgba(255,255,255,0.035)', pointerEvents: 'none', zIndex: 3 }} />
            <img src={player.heroImage} alt={displayPrimaryName(player)} onError={e => { e.target.src = '/assets/roster/placeholder.jpg'; }} style={getHeroImageStyle(player, total)} />

            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.00) 14%, rgba(42,42,42,0.04) 32%, rgba(42,42,42,0.16) 62%, rgba(42,42,42,0.60) 100%)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.01) 1px, transparent 1px)', backgroundSize: '24px 24px, 24px 24px', opacity: 0.08, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(255,255,255,0.00) 46%, rgba(42,42,42,0.18) 100%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 64px rgba(42,42,42,0.20), inset 0 0 0 1px rgba(255,255,255,0.025)' }} />

            <div style={{ position: 'absolute', top: 0, right: 0, width: '32%', height: '15%', background: COLORS.yellow, clipPath: 'polygon(100% 0, 100% 100%, 0 0)' }} />
            <div style={{ position: 'absolute', top: '12px', right: '12px', width: '34px', height: '2px', background: 'rgba(255,255,255,0.14)' }} />
            <div style={{ position: 'absolute', top: '18px', right: '12px', width: '18px', height: '2px', background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ position: 'absolute', left: '8px', top: '36px', bottom: '12px', width: '1px', background: 'linear-gradient(180deg, rgba(244,195,32,0.34) 0%, rgba(244,195,32,0.02) 100%)' }} />
            <div style={{ position: 'absolute', top: '10px', left: '10px', width: '11px', height: '11px', borderTop: `2px solid ${COLORS.yellow}`, borderLeft: `2px solid ${COLORS.yellow}` }} />
            <div style={{ position: 'absolute', right: '10px', bottom: '10px', width: '12px', height: '12px', background: COLORS.white, opacity: 0.92 }} />
            <div style={{ position: 'absolute', left: '10px', right: '10px', bottom: '10px', height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 100%)' }} />
          </div>

          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
            <div style={{ height: '3px', background: `linear-gradient(90deg, ${COLORS.white} 0 10%, ${COLORS.yellow} 10% 100%)` }} />
            <div style={{ position: 'relative', padding: footerPad, background: 'linear-gradient(180deg, rgba(42,42,42,0.18) 0%, rgba(42,42,42,0.92) 100%)', borderTop: `1px solid ${COLORS.line}` }}>
              <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.01) 0 1px, transparent 1px 22px)', opacity: 0.14, pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: `${titleSize}px`, fontWeight: '900', color: COLORS.white, lineHeight: 0.94, textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '0 4px 18px rgba(0,0,0,0.25)' }}>{displayPrimaryName(player)}</div>
                {!!displaySecondaryName(player) && <div style={{ marginTop: '5px', fontSize: `${subSize}px`, fontWeight: '900', color: COLORS.faintWhite, letterSpacing: '1.1px', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displaySecondaryName(player)}</div>}
                <div style={{ marginTop: compact ? '9px' : '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ padding: compact ? '6px 10px' : '7px 11px', background: COLORS.yellow, color: COLORS.black, fontSize: `${roleSize}px`, fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', boxShadow: 'inset 0 0 0 1px rgba(42,42,42,0.12)' }}>{player.role}</div>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.10)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function RosterScene({ matchData = {} }) {
  const { teamName, teamLogo, players, staff } = getRosterData(matchData), total = Math.max(players.length, 5), gridCols = total <= 5 ? `repeat(${total}, 1fr)` : total === 6 ? 'repeat(6, 1fr)' : 'repeat(7, 1fr)', gap = total >= 7 ? '10px' : total === 6 ? '12px' : '14px', managerText = displayStaffInline(staff.manager), coachText = staff.coaches.length ? staff.coaches.map(displayStaffInline).join(' / ') : '—';

  return (
    <div style={{ width: '1920px', height: '1080px', position: 'relative', overflow: 'hidden', backgroundColor: COLORS.black, fontFamily: '"HarmonyOS Sans SC", sans-serif' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.014) 1px, transparent 1px)', backgroundSize: '120px 120px', opacity: 0.18, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: '70px', top: '70px', width: '520px', height: '520px', border: '1px solid rgba(244,195,32,0.06)', transform: 'rotate(45deg)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: '-120px', bottom: '-120px', width: '460px', height: '460px', border: '1px solid rgba(255,255,255,0.03)', transform: 'rotate(45deg)', pointerEvents: 'none' }} />

      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '44px', background: 'rgba(255,255,255,0.02)', borderBottom: `1px solid ${COLORS.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', boxSizing: 'border-box', backdropFilter: 'blur(4px)', zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><div style={{ width: '10px', height: '10px', background: COLORS.yellow, boxShadow: '0 0 12px rgba(244,195,32,0.28)' }} /><span style={{ fontSize: '12px', fontWeight: '900', letterSpacing: '2px', color: COLORS.softWhite }}>FCUP_ROSTER_INTERFACE</span></div>
        <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '2px', color: 'rgba(255,255,255,0.38)' }}>TEAM_ROSTER // POSTER_READY</div>
      </div>

      <div style={{ position: 'absolute', top: '72px', left: '80px', right: '80px', zIndex: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '104px minmax(0,1fr) auto', alignItems: 'end', gap: '20px' }}>
          <div style={{ width: '104px', height: '104px', background: 'rgba(255,255,255,0.02)', border: UI.outerFrame, boxShadow: `${UI.panelShadow}, ${UI.insetLine}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '12px', left: '12px', width: '18px', height: '18px', borderTop: `2px solid ${COLORS.yellow}`, borderLeft: `2px solid ${COLORS.yellow}` }} />
            <img src={teamLogo} alt={teamName} onError={e => { e.target.src = '/assets/logos/OW.jpg'; }} style={{ width: '76%', height: '76%', objectFit: 'contain' }} />
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: '36px', height: '36px', backgroundColor: COLORS.yellow, boxShadow: '0 0 16px rgba(244,195,32,0.18)' }} />
              <span style={{ fontSize: '52px', fontWeight: '900', color: COLORS.white, letterSpacing: '4px', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{teamName}</span>
            </div>
            <div style={{ width: total >= 7 ? '540px' : '600px', height: '8px', background: `linear-gradient(90deg, ${COLORS.yellow} 0%, rgba(244,195,32,0.14) 100%)`, border: '1px solid rgba(244,195,32,0.16)', boxShadow: UI.yellowGlow, marginTop: '10px' }} />
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '18px', fontWeight: '900', color: COLORS.yellow, letterSpacing: '2px', textTransform: 'uppercase' }}>Team Roster</span>
              {!!(staff.showClubName && staff.clubName) && <span style={{ fontSize: '12px', fontWeight: '900', color: COLORS.faintWhite, letterSpacing: '1.6px', textTransform: 'uppercase' }}>CLUB // {staff.clubName}</span>}
              {!!safeText(matchData.rosterPresetKey) && <span style={{ fontSize: '11px', fontWeight: '900', color: COLORS.faintWhite, letterSpacing: '1.6px', textTransform: 'uppercase' }}>PRESET // {safeText(matchData.rosterPresetKey)}</span>}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'stretch', gap: '10px', alignSelf: 'center' }}>
            <StaffMeta label="Manager" value={managerText} />
            <StaffMeta label="Coach" value={coachText} />
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', top: '208px', left: '80px', right: '80px', bottom: '126px', display: 'grid', gridTemplateColumns: gridCols, gap, zIndex: 5 }}>
        {players.map((player, idx) => <RosterCard key={idx} player={player} index={idx} total={total} />)}
      </div>

      <div style={{ position: 'absolute', left: '80px', right: '80px', bottom: '80px', height: '2px', background: 'rgba(255,255,255,0.08)' }} />
      <div style={{ position: 'absolute', bottom: '58px', left: '80px', right: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'rgba(255,255,255,0.26)', fontSize: '11px', fontWeight: '900', letterSpacing: '1.8px', textTransform: 'uppercase' }}>
        <span>FCUP_ROSTER_SYS // LINEUP_PRESENTATION_ACTIVE</span>
        <span style={{ color: COLORS.yellow, opacity: 0.92 }}>{players.length} PLAYERS</span>
      </div>
    </div>
  );
}