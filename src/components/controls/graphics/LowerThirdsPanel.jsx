import React, { useEffect, useMemo, useState } from 'react';
import { useMatchContext } from '../../../contexts/MatchContext';
import { ShellPanel } from '../../common/SharedUI';
import { COLORS, labelStyle } from '../../../constants/styles';

const UI = {
  input: {
    width: '100%',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.14)',
    color: COLORS.white,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: '"HarmonyOS Sans SC", sans-serif',
    padding: '0 8px'
  },
  select: {
    width: '100%',
    background: '#1a1a1a',
    border: '1px solid rgba(255,255,255,0.14)',
    color: COLORS.white,
    outline: 'none',
    boxSizing: 'border-box',
    padding: '0 10px',
    fontWeight: 900
  },
  btn: {
    border: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
    textTransform: 'uppercase',
    fontWeight: 900,
    letterSpacing: '1px'
  },
  chip: {
    padding: '4px 10px',
    fontSize: '10px',
    fontWeight: 800,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: COLORS.white,
    cursor: 'pointer',
    borderRadius: '2px'
  }
};

const THEME_PRESETS = [
  { key: 'YELLOW', label: 'YELLOW', value: COLORS.yellow || '#f4c320' },
  { key: 'BLUE', label: 'BLUE', value: '#3498db' },
  { key: 'RED', label: 'RED', value: '#ff5a5a' },
  { key: 'WHITE', label: 'WHITE', value: '#ffffff' }
];

const safeArr = v => Array.isArray(v) ? v : [];
const toNum = v => (Number.isFinite(Number(v)) ? Number(v) : 0);

function buildFallbackPlayerTotals(players = []) {
  return safeArr(players).map((player, idx) => {
    const logs = safeArr(player?.match_logs).filter(log => toNum(log?.playtimeMinutes) > 0);

    let totalMinutes = 0;
    let totalElim = 0;
    let totalAst = 0;
    let totalDth = 0;
    let totalDmg = 0;
    let totalHeal = 0;
    let totalBlock = 0;
    const heroCount = {};

    logs.forEach(log => {
      totalMinutes += toNum(log?.playtimeMinutes);
      totalElim += toNum(log?.totals?.elims);
      totalAst += toNum(log?.totals?.assists);
      totalDth += toNum(log?.totals?.deaths);
      totalDmg += toNum(log?.totals?.damage);
      totalHeal += toNum(log?.totals?.healing);
      totalBlock += toNum(log?.totals?.blocked);

      const hero = typeof log?.hero === 'string' ? log.hero.trim() : '';
      if (hero) heroCount[hero] = (heroCount[hero] || 0) + 1;
    });

    const per10 = value => (totalMinutes > 0 ? (value / totalMinutes) * 10 : 0);
    const mostPlayedHero =
      Object.entries(heroCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '';

    return {
      player_id: player?.player_id || `player_${idx}`,
      display_name: player?.display_name || player?.nickname || player?.player_name || 'Unknown',
      nickname: player?.nickname || '',
      team_short_name: player?.team_short_name || '',
      role: player?.role || 'FLEX',
      maps_played: logs.length,
      avg_elim: per10(totalElim),
      avg_ast: per10(totalAst),
      avg_dth: per10(totalDth),
      avg_dmg: per10(totalDmg),
      avg_heal: per10(totalHeal),
      avg_block: per10(totalBlock),
      total_elim: totalElim,
      total_dth: totalDth,
      most_played_hero: mostPlayedHero
    };
  });
}

export default function LowerThirdsPanel({ db, dbStatus, density, densityTokens, is1080Compact }) {
  const { matchData, updateWithHistory } = useMatchContext();
  const t = densityTokens || { panelPadding: '12px' };
  const rowH = is1080Compact ? '36px' : '40px';

  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [activePlayerObj, setActivePlayerObj] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    statLabel: '',
    statValue: '',
    themeColor: COLORS.yellow || '#f4c320'
  });

  const playerPool = useMemo(() => {
    const source = safeArr(db?.player_totals).length
      ? safeArr(db.player_totals)
      : buildFallbackPlayerTotals(db?.players);

    return [...source].sort((a, b) => {
      const teamA = a?.team_short_name || '';
      const teamB = b?.team_short_name || '';
      if (teamA !== teamB) return teamA.localeCompare(teamB);
      const nameA = a?.display_name || a?.nickname || '';
      const nameB = b?.display_name || b?.nickname || '';
      return nameA.localeCompare(nameB);
    });
  }, [db]);

  const getSafeId = (p, idx) => p?.player_id || p?.id || p?.nickname || `p_${idx}`;

  useEffect(() => {
    if (!selectedPlayerId) {
      setActivePlayerObj(null);
      return;
    }

    const player = playerPool.find((p, idx) => getSafeId(p, idx) === selectedPlayerId);
    if (!player) {
      setActivePlayerObj(null);
      return;
    }

    setActivePlayerObj(player);
    setFormData(prev => ({
      ...prev,
      title: player.display_name || player.nickname || '',
      subtitle: `${player.team_short_name || '-'} · ${player.role || '-'}`,
      statLabel: '',
      statValue: ''
    }));
  }, [selectedPlayerId, playerPool]);

  const injectStat = (label, valueKey, decimals = 0) => {
    if (!activePlayerObj) return;
    const val = toNum(activePlayerObj[valueKey]);
    setFormData(prev => ({
      ...prev,
      statLabel: label,
      statValue: val.toFixed(decimals)
    }));
  };

  const injectKDA = () => {
    if (!activePlayerObj) return;
    const k = toNum(activePlayerObj.total_elim);
    const d = toNum(activePlayerObj.total_dth);
    const kd = d > 0 ? (k / d).toFixed(2) : k.toFixed(2);
    setFormData(prev => ({ ...prev, statLabel: 'K / D RATIO', statValue: String(kd) }));
  };

  const injectHero = () => {
    if (!activePlayerObj) return;
    setFormData(prev => ({
      ...prev,
      statLabel: 'SIGNATURE HERO',
      statValue: activePlayerObj.most_played_hero || 'N/A'
    }));
  };

  const pushLowerThird = (durationSec = 0) => {
    const payload = {
      ...formData,
      action: 'SHOW',
      duration: durationSec,
      timestamp: Date.now()
    };

    updateWithHistory(`L3: ${formData.title} (${formData.statLabel || 'INFO'})`, {
      ...matchData,
      lowerThirdData: payload
    });
  };

  const clearLowerThird = () => {
    updateWithHistory('Clear Lower Thirds', {
      ...matchData,
      lowerThirdData: { action: 'HIDE', timestamp: Date.now() }
    });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', alignItems: 'start' }}>
      <ShellPanel title="LIVE_TARGET // 实时目标获取" accent density={density} bodyStyle={{ padding: t.panelPadding }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={labelStyle}>SELECT PLAYER ON SCREEN // 画面焦点选手</div>
            <select
              style={{ ...UI.select, height: '44px', color: COLORS.yellow, fontSize: '14px' }}
              value={selectedPlayerId}
              onChange={e => setSelectedPlayerId(e.target.value)}
              disabled={dbStatus !== 'LOADED'}
            >
              <option value="">{dbStatus === 'LOADED' ? '-- SELECT PLAYER --' : '-- WAITING FOR DB --'}</option>
              {playerPool.map((p, idx) => (
                <option key={getSafeId(p, idx)} value={getSafeId(p, idx)}>
                  {(p.display_name || p.nickname || 'Unknown')} [{p.team_short_name || '-'}]
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={labelStyle}>QUICK STAT INJECTORS // 快捷数据填装</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, opacity: activePlayerObj ? 1 : 0.3, pointerEvents: activePlayerObj ? 'auto' : 'none' }}>
              <button style={UI.chip} onClick={() => injectStat('ELIMS / 10M', 'avg_elim', 1)}>ELIMS</button>
              <button style={UI.chip} onClick={() => injectStat('AST / 10M', 'avg_ast', 1)}>ASSISTS</button>
              <button style={UI.chip} onClick={() => injectStat('DAMAGE / 10M', 'avg_dmg', 0)}>DAMAGE</button>
              <button style={UI.chip} onClick={() => injectStat('HEALING / 10M', 'avg_heal', 0)}>HEALING</button>
              <button style={UI.chip} onClick={() => injectStat('MITIGATED / 10M', 'avg_block', 0)}>MITIGATED</button>
              <button style={UI.chip} onClick={injectKDA}>K / D RATIO</button>
              <button style={UI.chip} onClick={() => injectStat('MAPS PLAYED', 'maps_played', 0)}>MAPS</button>
              <button
                style={{ ...UI.chip, borderColor: COLORS.yellow, color: COLORS.yellow }}
                onClick={injectHero}
              >
                SIGNATURE HERO
              </button>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
              Clicking these will instantly fill the payload form on the right.
            </div>
          </div>

          <div>
            <div style={labelStyle}>THEME COLOR // 条幅主题色</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {THEME_PRESETS.map(theme => (
                <button
                  key={theme.key}
                  style={{
                    ...UI.chip,
                    borderColor: formData.themeColor === theme.value ? theme.value : 'rgba(255,255,255,0.1)',
                    color: formData.themeColor === theme.value ? theme.value : COLORS.white
                  }}
                  onClick={() => setFormData(prev => ({ ...prev, themeColor: theme.value }))}
                >
                  {theme.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </ShellPanel>

      <ShellPanel title="L3_PAYLOAD // 局内条幅装载区" accent density={density} bodyStyle={{ padding: t.panelPadding }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <div style={labelStyle}>TITLE // 主标题</div>
              <input
                style={{ ...UI.input, height: rowH, fontWeight: 900, fontSize: 14 }}
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Player Name"
              />
            </div>
            <div>
              <div style={labelStyle}>SUBTITLE // 副标题</div>
              <input
                style={{ ...UI.input, height: rowH, color: COLORS.yellow }}
                value={formData.subtitle}
                onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="Team / Role"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 8 }}>
            <div>
              <div style={{ ...labelStyle, color: COLORS.faintWhite }}>STAT LABEL // 数据标签</div>
              <input
                style={{ ...UI.input, height: rowH, fontSize: 12, backgroundColor: 'rgba(255,255,255,0.02)' }}
                value={formData.statLabel}
                onChange={e => setFormData({ ...formData, statLabel: e.target.value })}
                placeholder="e.g. DAMAGE / 10M"
              />
            </div>
            <div>
              <div style={{ ...labelStyle, color: COLORS.yellow }}>STAT VALUE // 数据值</div>
              <input
                style={{ ...UI.input, height: rowH, fontWeight: 900, color: COLORS.yellow, fontSize: 16 }}
                value={formData.statValue}
                onChange={e => setFormData({ ...formData, statValue: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <div
            style={{
              border: `1px solid ${formData.themeColor}55`,
              background: 'rgba(255,255,255,0.03)',
              minHeight: 84,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 4,
              padding: '10px 12px',
              boxShadow: `inset 3px 0 0 ${formData.themeColor}`
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 900, color: COLORS.white, lineHeight: 1.1 }}>{formData.title || 'PLAYER NAME'}</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: formData.themeColor }}>{formData.subtitle || 'TEAM / ROLE'}</div>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.8px' }}>
              {formData.statLabel || 'STAT LABEL'}
            </div>
            <div style={{ fontSize: 16, fontWeight: 900, color: COLORS.white }}>{formData.statValue || '0'}</div>
          </div>

          <div style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', margin: '4px 0' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button
              style={{
                ...UI.btn,
                height: '42px',
                backgroundColor: 'transparent',
                color: COLORS.white,
                border: '1px solid rgba(255,255,255,0.3)',
                fontSize: '12px'
              }}
              onClick={() => pushLowerThird(0)}
            >
              TAKE IN (STAY) // 常驻推送
            </button>

            <button
              style={{
                ...UI.btn,
                height: '42px',
                backgroundColor: '#3498db',
                color: COLORS.white,
                boxShadow: '0 0 12px rgba(52, 152, 219, 0.3)',
                fontSize: '12px'
              }}
              onClick={() => pushLowerThird(7)}
            >
              TAKE & AUTO-HIDE (7s) // 弹窗
            </button>
          </div>

          <button
            style={{
              ...UI.btn,
              height: '36px',
              backgroundColor: 'transparent',
              color: COLORS.red,
              border: '1px solid rgba(255,77,77,0.4)',
              fontSize: '12px',
              marginTop: '4px'
            }}
            onClick={clearLowerThird}
          >
            CLEAR GRAPHIC // 紧急撤回
          </button>
        </div>
      </ShellPanel>
    </div>
  );
}