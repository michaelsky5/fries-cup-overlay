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
    textTransform: 'uppercase'
  },
  chip: {
    padding: '6px 12px',
    fontSize: '11px',
    fontWeight: 800,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: COLORS.white,
    cursor: 'pointer',
    borderRadius: '2px'
  }
};

const safeArr = v => Array.isArray(v) ? v : [];
const toNum = v => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

function sumStats(rows = []) {
  return safeArr(rows).reduce(
    (acc, row) => {
      acc.elims += toNum(row?.eliminations);
      acc.assists += toNum(row?.assists);
      acc.deaths += toNum(row?.deaths);
      acc.damage += toNum(row?.damage);
      acc.healing += toNum(row?.healing);
      acc.mitigation += toNum(row?.mitigation);
      return acc;
    },
    { elims: 0, assists: 0, deaths: 0, damage: 0, healing: 0, mitigation: 0 }
  );
}

function resolveWinnerId(winner, teamA, teamB) {
  if (!winner) return '';
  if (winner === teamA?.id || winner === teamB?.id) return winner;
  if (winner === teamA?.name || winner === teamA?.short) return teamA.id;
  if (winner === teamB?.name || winner === teamB?.short) return teamB.id;
  return '';
}

function buildFallbackPlayerTotals(players = []) {
  return safeArr(players).map((player, idx) => {
    const logs = safeArr(player?.match_logs).filter(log => toNum(log?.playtimeMinutes) > 0);

    let totalElim = 0;
    let totalAst = 0;
    let totalDth = 0;
    let totalDmg = 0;
    let totalHeal = 0;
    let totalBlock = 0;
    let totalMinutes = 0;

    logs.forEach(log => {
      totalMinutes += toNum(log?.playtimeMinutes);
      totalElim += toNum(log?.totals?.elims);
      totalAst += toNum(log?.totals?.assists);
      totalDth += toNum(log?.totals?.deaths);
      totalDmg += toNum(log?.totals?.damage);
      totalHeal += toNum(log?.totals?.healing);
      totalBlock += toNum(log?.totals?.blocked);
    });

    const per10 = value => (totalMinutes > 0 ? (value / totalMinutes) * 10 : 0);

    return {
      player_id: player?.player_id || `fallback_${idx}`,
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
      total_ast: totalAst,
      total_dth: totalDth,
      total_dmg: totalDmg,
      total_heal: totalHeal,
      total_block: totalBlock
    };
  });
}

function buildTeamTotals(db) {
  const teamIndex = new Map();

  safeArr(db?.teams).forEach(team => {
    teamIndex.set(team.team_id, {
      team_id: team.team_id,
      team_name: team.team_name,
      team_short_name: team.team_short_name,
      matches_played: 0,
      wins: 0,
      losses: 0,
      maps_played: 0,
      maps_won: 0,
      maps_lost: 0,
      total_elim: 0,
      total_ast: 0,
      total_dth: 0,
      total_dmg: 0,
      total_heal: 0,
      total_block: 0
    });
  });

  safeArr(db?.matches).forEach(match => {
    const teamA = match?.team_a || {};
    const teamB = match?.team_b || {};

    if (!teamA?.id || !teamB?.id || !teamIndex.has(teamA.id) || !teamIndex.has(teamB.id)) return;

    const rowA = teamIndex.get(teamA.id);
    const rowB = teamIndex.get(teamB.id);

    const scoreA = toNum(teamA?.score);
    const scoreB = toNum(teamB?.score);
    const hasSeriesResult = match?.status === 'COMPLETE' || scoreA !== scoreB;

    if (hasSeriesResult) {
      rowA.matches_played += 1;
      rowB.matches_played += 1;

      if (scoreA > scoreB) {
        rowA.wins += 1;
        rowB.losses += 1;
      } else if (scoreB > scoreA) {
        rowB.wins += 1;
        rowA.losses += 1;
      }
    }

    safeArr(match?.maps).forEach(map => {
      rowA.maps_played += 1;
      rowB.maps_played += 1;

      const winnerId = resolveWinnerId(map?.winner, teamA, teamB);
      if (winnerId === teamA.id) {
        rowA.maps_won += 1;
        rowB.maps_lost += 1;
      } else if (winnerId === teamB.id) {
        rowB.maps_won += 1;
        rowA.maps_lost += 1;
      }

      const statsA = sumStats(map?.team_a_stats);
      const statsB = sumStats(map?.team_b_stats);

      rowA.total_elim += statsA.elims;
      rowA.total_ast += statsA.assists;
      rowA.total_dth += statsA.deaths;
      rowA.total_dmg += statsA.damage;
      rowA.total_heal += statsA.healing;
      rowA.total_block += statsA.mitigation;

      rowB.total_elim += statsB.elims;
      rowB.total_ast += statsB.assists;
      rowB.total_dth += statsB.deaths;
      rowB.total_dmg += statsB.damage;
      rowB.total_heal += statsB.healing;
      rowB.total_block += statsB.mitigation;
    });
  });

  return Array.from(teamIndex.values()).map(team => ({
    ...team,
    match_win_rate: team.matches_played > 0 ? (team.wins / team.matches_played) * 100 : 0,
    map_win_rate: team.maps_played > 0 ? (team.maps_won / team.maps_played) * 100 : 0,
    avg_elim_per_map: team.maps_played > 0 ? team.total_elim / team.maps_played : 0,
    avg_ast_per_map: team.maps_played > 0 ? team.total_ast / team.maps_played : 0,
    avg_dth_per_map: team.maps_played > 0 ? team.total_dth / team.maps_played : 0,
    avg_dmg_per_map: team.maps_played > 0 ? team.total_dmg / team.maps_played : 0,
    avg_heal_per_map: team.maps_played > 0 ? team.total_heal / team.maps_played : 0,
    avg_block_per_map: team.maps_played > 0 ? team.total_block / team.maps_played : 0
  }));
}

export default function LeaderboardPanel({ db, dbStatus, density, densityTokens, is1080Compact }) {
  const { matchData, updateWithHistory, setPreviewScene } = useMatchContext();
  const t = densityTokens || { panelPadding: '12px' };
  const rowH = is1080Compact ? '32px' : '36px';

  const [boardType, setBoardType] = useState('PLAYER');
  const [metricKey, setMetricKey] = useState('avg_dmg');

  const PLAYER_METRICS = [
    { key: 'avg_dmg', label: 'DMG / 10M', title: 'PLAYER DAMAGE LEADERBOARD', dec: 0 },
    { key: 'avg_elim', label: 'ELIMS / 10M', title: 'PLAYER ELIMS LEADERBOARD', dec: 1 },
    { key: 'avg_heal', label: 'HEAL / 10M', title: 'PLAYER HEALING LEADERBOARD', dec: 0 },
    { key: 'avg_block', label: 'MIT / 10M', title: 'PLAYER MITIGATION LEADERBOARD', dec: 0 }
  ];

  const TEAM_METRICS = [
    { key: 'match_win_rate', label: 'MATCH WR', title: 'TEAM MATCH WINRATE LEADERBOARD', dec: 1, suffix: '%' },
    { key: 'map_win_rate', label: 'MAP WR', title: 'TEAM MAP WINRATE LEADERBOARD', dec: 1, suffix: '%' },
    { key: 'avg_dmg_per_map', label: 'AVG DMG / MAP', title: 'TEAM DAMAGE LEADERBOARD', dec: 0 },
    { key: 'avg_heal_per_map', label: 'AVG HEAL / MAP', title: 'TEAM HEALING LEADERBOARD', dec: 0 },
    { key: 'avg_block_per_map', label: 'AVG MIT / MAP', title: 'TEAM MITIGATION LEADERBOARD', dec: 0 }
  ];

  const metricOptions = boardType === 'PLAYER' ? PLAYER_METRICS : TEAM_METRICS;

  const [formData, setFormData] = useState({
    boardType: 'PLAYER',
    metricKey: 'avg_dmg',
    title: 'PLAYER DAMAGE LEADERBOARD',
    subtitle: 'GLOBAL DATA SNAPSHOT',
    rows: [
      { rank: 1, name: '', sub: '', value: '' },
      { rank: 2, name: '', sub: '', value: '' },
      { rank: 3, name: '', sub: '', value: '' },
      { rank: 4, name: '', sub: '', value: '' },
      { rank: 5, name: '', sub: '', value: '' }
    ]
  });

  const playerPool = useMemo(() => {
    const totals = safeArr(db?.player_totals).length ? safeArr(db.player_totals) : buildFallbackPlayerTotals(db?.players);
    return totals;
  }, [db]);

  const teamPool = useMemo(() => buildTeamTotals(db), [db]);

  useEffect(() => {
    if (boardType === 'PLAYER' && !PLAYER_METRICS.some(m => m.key === metricKey)) setMetricKey('avg_dmg');
    if (boardType === 'TEAM' && !TEAM_METRICS.some(m => m.key === metricKey)) setMetricKey('match_win_rate');
  }, [boardType, metricKey]);

  useEffect(() => {
    const metric = metricOptions.find(m => m.key === metricKey);
    if (!metric) return;

    const source = boardType === 'PLAYER' ? playerPool : teamPool;

    const sorted = [...source]
      .filter(row => Number.isFinite(Number(row?.[metricKey])))
      .sort((a, b) => Number(b?.[metricKey]) - Number(a?.[metricKey]))
      .slice(0, 5);

    setFormData({
      boardType,
      metricKey,
      title: metric.title,
      subtitle: boardType === 'PLAYER' ? 'GLOBAL PLAYER SNAPSHOT' : 'GLOBAL TEAM SNAPSHOT',
      rows: [0, 1, 2, 3, 4].map(i => {
        const row = sorted[i];
        if (!row) return { rank: i + 1, name: '-', sub: '-', value: '-' };

        if (boardType === 'PLAYER') {
          return {
            rank: i + 1,
            name: row.display_name || row.nickname || 'Unknown',
            sub: `${row.team_short_name || '-'} · ${row.role || '-'}`,
            value: `${Number(row[metricKey]).toFixed(metric.dec)}${metric.suffix || ''}`
          };
        }

        return {
          rank: i + 1,
          name: row.team_short_name || 'Unknown',
          sub: row.team_name || '-',
          value: `${Number(row[metricKey]).toFixed(metric.dec)}${metric.suffix || ''}`
        };
      })
    });
  }, [boardType, metricKey, metricOptions, playerPool, teamPool]);

  const updateRow = (index, field, value) => {
    const newRows = [...formData.rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setFormData(prev => ({ ...prev, rows: newRows }));
  };

  const handleTake = () => {
    updateWithHistory('Take Leaderboard Snapshot', {
      ...matchData,
      leaderboardData: formData,
      globalScene: 'LEADERBOARD_SCENE'
    });

    if (setPreviewScene) setPreviewScene('LEADERBOARD_SCENE');
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', alignItems: 'start' }}>
      <ShellPanel title="AUTO_EXTRACT // 自动榜单抓取" accent density={density} bodyStyle={{ padding: t.panelPadding }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={labelStyle}>BOARD TYPE // 榜单类型</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <button
                style={{ ...UI.chip, borderColor: boardType === 'PLAYER' ? COLORS.yellow : 'rgba(255,255,255,0.1)', color: boardType === 'PLAYER' ? COLORS.yellow : COLORS.white }}
                onClick={() => setBoardType('PLAYER')}
              >
                PLAYER
              </button>
              <button
                style={{ ...UI.chip, borderColor: boardType === 'TEAM' ? COLORS.yellow : 'rgba(255,255,255,0.1)', color: boardType === 'TEAM' ? COLORS.yellow : COLORS.white }}
                onClick={() => setBoardType('TEAM')}
              >
                TEAM
              </button>
            </div>
          </div>

          <div>
            <div style={labelStyle}>SELECT METRIC // 选择统计维度生成 TOP 5</div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                opacity: dbStatus === 'LOADED' ? 1 : 0.3,
                pointerEvents: dbStatus === 'LOADED' ? 'auto' : 'none'
              }}
            >
              {metricOptions.map(m => (
                <button
                  key={m.key}
                  style={{
                    ...UI.chip,
                    borderColor: metricKey === m.key ? COLORS.yellow : 'rgba(255,255,255,0.1)',
                    color: metricKey === m.key ? COLORS.yellow : COLORS.white
                  }}
                  onClick={() => setMetricKey(m.key)}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
              SYSTEM LOG: metric change will auto-sort the current database and fill TOP 5 into the override table.
            </div>
          </div>
        </div>
      </ShellPanel>

      <ShellPanel title="MANUAL_OVERRIDE // 榜单数据覆写" accent density={density} bodyStyle={{ padding: t.panelPadding }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 8 }}>
            <div>
              <div style={labelStyle}>TITLE // 榜单主标题</div>
              <input
                style={{ ...UI.input, height: rowH, fontSize: 14, color: COLORS.yellow }}
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <div style={labelStyle}>SUBTITLE // 副标题</div>
              <input
                style={{ ...UI.input, height: rowH, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}
                value={formData.subtitle}
                onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
              />
            </div>
          </div>

          <div style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', margin: '4px 0' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {formData.rows.map((row, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '32px 1.5fr 1fr 90px', gap: 6, alignItems: 'center' }}>
                <div style={{ color: COLORS.yellow, fontWeight: 900, textAlign: 'center', fontSize: 16 }}>#{row.rank}</div>
                <input
                  style={{ ...UI.input, height: rowH }}
                  value={row.name}
                  onChange={e => updateRow(idx, 'name', e.target.value)}
                  placeholder="Name"
                />
                <input
                  style={{ ...UI.input, height: rowH, fontSize: 11, backgroundColor: 'rgba(255,255,255,0.02)' }}
                  value={row.sub}
                  onChange={e => updateRow(idx, 'sub', e.target.value)}
                  placeholder="Team / Role / Detail"
                />
                <input
                  style={{ ...UI.input, height: rowH, color: COLORS.yellow, textAlign: 'right' }}
                  value={row.value}
                  onChange={e => updateRow(idx, 'value', e.target.value)}
                  placeholder="0"
                />
              </div>
            ))}
          </div>

          <button
            style={{ ...UI.btn, height: '48px', backgroundColor: COLORS.yellow, color: COLORS.black, fontWeight: 900, marginTop: '8px' }}
            onClick={handleTake}
          >
            TAKE_LEADERBOARD_SNAPSHOT // 推送榜单
          </button>
        </div>
      </ShellPanel>
    </div>
  );
}