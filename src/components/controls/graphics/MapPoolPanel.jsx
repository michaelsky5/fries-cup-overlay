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

const MODES = ['CONTROL', 'HYBRID', 'ESCORT', 'FLASHPOINT', 'PUSH'];
const MODE_LABELS = {
  CONTROL: 'CONTROL WR',
  HYBRID: 'HYBRID WR',
  ESCORT: 'ESCORT WR',
  FLASHPOINT: 'FLASHPOINT WR',
  PUSH: 'PUSH WR'
};

const safeArr = v => Array.isArray(v) ? v : [];
const toNum = v => (Number.isFinite(Number(v)) ? Number(v) : 0);

function getTeamId(team) {
  return team?.team_id || team?.id || '';
}

function normalizeMode(mode) {
  const v = typeof mode === 'string' ? mode.trim().toUpperCase() : '';
  return v;
}

function resolveWinnerId(winner, teamA, teamB) {
  if (!winner) return '';
  if (winner === teamA?.id || winner === teamB?.id) return winner;
  if (winner === teamA?.name || winner === teamA?.short) return teamA.id;
  if (winner === teamB?.name || winner === teamB?.short) return teamB.id;
  return '';
}

function buildTeamMapStats(db) {
  const teamMapStats = new Map();

  safeArr(db?.teams).forEach(team => {
    teamMapStats.set(getTeamId(team), {
      teamId: getTeamId(team),
      teamName: team.team_name || '',
      teamShort: team.team_short_name || '',
      byMode: {},
      byMap: {}
    });
  });

  safeArr(db?.matches).forEach(match => {
    const teamA = match?.team_a || {};
    const teamB = match?.team_b || {};

    if (!teamA?.id || !teamB?.id || !teamMapStats.has(teamA.id) || !teamMapStats.has(teamB.id)) return;

    const rowA = teamMapStats.get(teamA.id);
    const rowB = teamMapStats.get(teamB.id);

    safeArr(match?.maps).forEach(map => {
      const mapName = typeof map?.map_name === 'string' ? map.map_name.trim() : '';
      const mapType = normalizeMode(map?.map_type);
      if (!mapName || !mapType) return;

      const winnerId = resolveWinnerId(map?.winner, teamA, teamB);

      const modeA = rowA.byMode[mapType] || { played: 0, won: 0, lost: 0 };
      const modeB = rowB.byMode[mapType] || { played: 0, won: 0, lost: 0 };
      modeA.played += 1;
      modeB.played += 1;

      const mapA = rowA.byMap[mapName] || { played: 0, won: 0, lost: 0, mapType };
      const mapB = rowB.byMap[mapName] || { played: 0, won: 0, lost: 0, mapType };
      mapA.played += 1;
      mapB.played += 1;

      if (winnerId === teamA.id) {
        modeA.won += 1;
        modeB.lost += 1;
        mapA.won += 1;
        mapB.lost += 1;
      } else if (winnerId === teamB.id) {
        modeB.won += 1;
        modeA.lost += 1;
        mapB.won += 1;
        mapA.lost += 1;
      }

      rowA.byMode[mapType] = modeA;
      rowB.byMode[mapType] = modeB;
      rowA.byMap[mapName] = mapA;
      rowB.byMap[mapName] = mapB;
    });
  });

  return teamMapStats;
}

function formatPct(won, played) {
  if (!played) return '0%';
  return `${((won / played) * 100).toFixed(1)}%`;
}

export default function MapPoolPanel({ db, dbStatus, density, densityTokens, is1080Compact }) {
  const { matchData, updateWithHistory, setPreviewScene } = useMatchContext();
  const t = densityTokens || { panelPadding: '12px' };
  const rowH = is1080Compact ? '32px' : '36px';

  const [teamAId, setTeamAId] = useState('');
  const [teamBId, setTeamBId] = useState('');
  const [modeFilter, setModeFilter] = useState('ALL MODES');

  const [formData, setFormData] = useState({
    teamA: 'TEAM A',
    teamB: 'TEAM B',
    filterLabel: 'ALL MODES',
    rows: [
      { label: 'CONTROL WR', valA: '0%', valB: '0%' },
      { label: 'HYBRID WR', valA: '0%', valB: '0%' },
      { label: 'ESCORT WR', valA: '0%', valB: '0%' },
      { label: 'PUSH WR', valA: '0%', valB: '0%' },
      { label: 'FLASHPOINT WR', valA: '0%', valB: '0%' }
    ]
  });

  const teamStatsMap = useMemo(() => buildTeamMapStats(db), [db]);

  const teamOptions = useMemo(() => {
    return safeArr(db?.teams).map(team => ({
      id: getTeamId(team),
      name: team.team_name || '',
      short: team.team_short_name || ''
    }));
  }, [db]);

  useEffect(() => {
    const tA = teamOptions.find(t => t.id === teamAId);
    const tB = teamOptions.find(t => t.id === teamBId);

    const next = {
      teamA: tA?.short || 'TEAM A',
      teamB: tB?.short || 'TEAM B',
      filterLabel: modeFilter,
      rows: []
    };

    if (!teamAId || !teamBId || !teamStatsMap.has(teamAId) || !teamStatsMap.has(teamBId)) {
      next.rows = [
        { label: 'CONTROL WR', valA: '0%', valB: '0%' },
        { label: 'HYBRID WR', valA: '0%', valB: '0%' },
        { label: 'ESCORT WR', valA: '0%', valB: '0%' },
        { label: 'PUSH WR', valA: '0%', valB: '0%' },
        { label: 'FLASHPOINT WR', valA: '0%', valB: '0%' }
      ];
      setFormData(next);
      return;
    }

    const statsA = teamStatsMap.get(teamAId);
    const statsB = teamStatsMap.get(teamBId);

    if (modeFilter === 'ALL MODES') {
      next.rows = MODES.map(mode => {
        const rowA = statsA.byMode[mode] || { played: 0, won: 0 };
        const rowB = statsB.byMode[mode] || { played: 0, won: 0 };
        return {
          label: MODE_LABELS[mode] || mode,
          valA: formatPct(rowA.won, rowA.played),
          valB: formatPct(rowB.won, rowB.played)
        };
      });
    } else {
      const sharedMaps = Array.from(
        new Set([
          ...Object.keys(statsA.byMap || {}),
          ...Object.keys(statsB.byMap || {})
        ])
      )
        .map(mapName => {
          const rowA = statsA.byMap?.[mapName] || { played: 0, won: 0, mapType: '' };
          const rowB = statsB.byMap?.[mapName] || { played: 0, won: 0, mapType: '' };
          return {
            mapName,
            mapType: rowA.mapType || rowB.mapType || '',
            playedA: rowA.played,
            playedB: rowB.played,
            valA: formatPct(rowA.won, rowA.played),
            valB: formatPct(rowB.won, rowB.played)
          };
        })
        .filter(row => row.mapType === modeFilter)
        .sort((a, b) => (b.playedA + b.playedB) - (a.playedA + a.playedB))
        .slice(0, 5);

      next.rows = sharedMaps.length
        ? sharedMaps.map(row => ({
            label: row.mapName,
            valA: row.valA,
            valB: row.valB
          }))
        : [{ label: `${modeFilter} // NO SHARED MAP DATA`, valA: '-', valB: '-' }];
    }

    setFormData(next);
  }, [teamAId, teamBId, modeFilter, teamStatsMap, teamOptions]);

  const updateRow = (index, field, value) => {
    const newRows = [...formData.rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setFormData(prev => ({ ...prev, rows: newRows }));
  };

  const handleTake = () => {
    updateWithHistory('Take Map Pool Analysis', {
      ...matchData,
      mapPoolData: formData,
      globalScene: 'MAP_POOL_SCENE'
    });
    if (setPreviewScene) setPreviewScene('MAP_POOL_SCENE');
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', alignItems: 'start' }}>
      <ShellPanel title="AUTO_FILL // 地图池数据获取" accent density={density} bodyStyle={{ padding: t.panelPadding }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={labelStyle}>ANALYSIS FILTER // 分析维度</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <button
                style={{ ...UI.chip, borderColor: modeFilter === 'ALL MODES' ? COLORS.yellow : 'rgba(255,255,255,0.1)', color: modeFilter === 'ALL MODES' ? COLORS.yellow : COLORS.white }}
                onClick={() => setModeFilter('ALL MODES')}
              >
                ALL MODES
              </button>
              {MODES.map(m => (
                <button
                  key={m}
                  style={{ ...UI.chip, borderColor: modeFilter === m ? COLORS.yellow : 'rgba(255,255,255,0.1)', color: modeFilter === m ? COLORS.yellow : COLORS.white }}
                  onClick={() => setModeFilter(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <div style={labelStyle}>TEAM A (LEFT)</div>
              <select
                style={{ ...UI.select, height: rowH, color: COLORS.yellow }}
                value={teamAId}
                onChange={e => setTeamAId(e.target.value)}
                disabled={dbStatus !== 'LOADED'}
              >
                <option value="">-- SELECT T1 --</option>
                {teamOptions.map(t => (
                  <option key={`MP_A_${t.id}`} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div style={labelStyle}>TEAM B (RIGHT)</div>
              <select
                style={{ ...UI.select, height: rowH, color: COLORS.yellow }}
                value={teamBId}
                onChange={e => setTeamBId(e.target.value)}
                disabled={dbStatus !== 'LOADED'}
              >
                <option value="">-- SELECT T2 --</option>
                {teamOptions.map(t => (
                  <option key={`MP_B_${t.id}`} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
            ALL MODES will fill 5 mode win-rate rows. Selecting a specific mode will switch the table to shared maps under that mode.
          </div>
        </div>
      </ShellPanel>

      <ShellPanel title="MANUAL_OVERRIDE // 地图池覆写" accent density={density} bodyStyle={{ padding: t.panelPadding }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <input
              style={{ ...UI.input, height: rowH, textAlign: 'center', color: COLORS.white }}
              value={formData.teamA}
              onChange={e => setFormData({ ...formData, teamA: e.target.value })}
              placeholder="TEAM A"
            />
            <input
              style={{ ...UI.input, height: rowH, textAlign: 'center', color: COLORS.yellow, backgroundColor: 'rgba(244,195,32,0.1)' }}
              value={formData.filterLabel}
              onChange={e => setFormData({ ...formData, filterLabel: e.target.value })}
              placeholder="FILTER"
            />
            <input
              style={{ ...UI.input, height: rowH, textAlign: 'center', color: COLORS.white }}
              value={formData.teamB}
              onChange={e => setFormData({ ...formData, teamB: e.target.value })}
              placeholder="TEAM B"
            />
          </div>

          <div style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', margin: '4px 0' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {formData.rows.map((row, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: 6 }}>
                <input
                  style={{ ...UI.input, height: rowH, color: COLORS.yellow, textAlign: 'center' }}
                  value={row.valA}
                  onChange={e => updateRow(idx, 'valA', e.target.value)}
                />
                <input
                  style={{ ...UI.input, height: rowH, fontSize: 11, backgroundColor: 'rgba(255,255,255,0.02)', textAlign: 'center' }}
                  value={row.label}
                  onChange={e => updateRow(idx, 'label', e.target.value)}
                />
                <input
                  style={{ ...UI.input, height: rowH, color: COLORS.yellow, textAlign: 'center' }}
                  value={row.valB}
                  onChange={e => updateRow(idx, 'valB', e.target.value)}
                />
              </div>
            ))}
          </div>

          <button
            style={{ ...UI.btn, height: '48px', backgroundColor: COLORS.yellow, color: COLORS.black, fontWeight: 900, marginTop: '8px' }}
            onClick={handleTake}
          >
            TAKE_MAP_POOL // 推送地图池分析
          </button>
        </div>
      </ShellPanel>
    </div>
  );
}