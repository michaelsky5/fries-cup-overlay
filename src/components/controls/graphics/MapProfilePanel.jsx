import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMatchContext } from '../../../contexts/MatchContext';
import { ShellPanel } from '../../common/SharedUI';
import { COLORS, labelStyle } from '../../../constants/styles';

const PLAYOFF_TEAMS = ['NGP', 'TNS', 'YOU', 'ZS', 'HYW', 'SPC', 'XCFN.G', 'FG'];

const UI = {
  input: {
    width: '100%',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.14)',
    color: COLORS.white,
    outline: 'none',
    boxSizing: 'border-box',
    padding: '0 10px',
    fontWeight: 900,
    fontVariantNumeric: 'tabular-nums'
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
  }
};

const safeArr = v => Array.isArray(v) ? v : [];
const safeRows = v => {
  if (Array.isArray(v)) return v;
  if (v && typeof v === 'object') return Object.values(v);
  return [];
};
const toNum = v => (Number.isFinite(Number(v)) ? Number(v) : 0);

function getTeamId(team) {
  return team?.team_id || team?.id || '';
}

function normalizeText(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function resolveWinnerId(winner, teamA, teamB) {
  if (!winner) return '';
  if (winner === teamA?.id || winner === teamB?.id) return winner;
  if (winner === teamA?.name || winner === teamA?.short) return teamA.id;
  if (winner === teamB?.name || winner === teamB?.short) return teamB.id;
  return '';
}

function parseClockStringToMinutes(value) {
  if (typeof value !== 'string') return 0;
  const s = value.trim();
  if (!s.includes(':')) return 0;
  const parts = s.split(':').map(Number);
  if (parts.some(n => !Number.isFinite(n))) return 0;

  if (parts.length === 2) return parts[0] + parts[1] / 60;
  if (parts.length === 3) return parts[0] * 60 + parts[1] + parts[2] / 60;
  return 0;
}

function readStat(row, keys) {
  const targets = [row, row?.totals, row?.stats];
  for (const target of targets) {
    if (!target || typeof target !== 'object') continue;
    for (const key of keys) {
      if (target[key] !== undefined && target[key] !== null) {
        const n = Number(target[key]);
        if (Number.isFinite(n)) return n;
      }
    }
  }
  return 0;
}

function extractPlayerMinutes(row) {
  const targets = [row, row?.totals, row?.stats];
  for (const target of targets) {
    if (!target || typeof target !== 'object') continue;

    const minuteFields = ['playtimeMinutes', 'time_played_minutes', 'timePlayedMinutes', 'minutes', 'play_time_minutes', 'duration_minutes', 'time_minutes'];
    for (const key of minuteFields) {
      const n = Number(target[key]);
      if (Number.isFinite(n) && n > 0) return n;
    }

    const secondFields = ['playtimeSeconds', 'time_played_seconds', 'timePlayedSeconds', 'seconds', 'duration_seconds', 'time_seconds'];
    for (const key of secondFields) {
      const n = Number(target[key]);
      if (Number.isFinite(n) && n > 0) return n / 60;
    }

    const clockFields = ['duration', 'time_played', 'timePlayed', 'time'];
    for (const key of clockFields) {
      const mins = parseClockStringToMinutes(target[key]);
      if (mins > 0) return mins;
    }
  }
  return 0;
}

function extractMapMinutes(map) {
  return extractPlayerMinutes(map) || extractPlayerMinutes({ stats: map });
}

// 🌟 核心引擎重构：确保时间强制对齐为 5 个人的总和
function sumStats(rawStats, fallbackMapMinutes = 0) {
  const result = { elims: 0, assists: 0, deaths: 0, damage: 0, healing: 0, mitigation: 0, rawPlayerMinutes: 0 };
  if (!rawStats) return result;

  if (rawStats.elims !== undefined || rawStats.damage !== undefined || rawStats.eliminations !== undefined) {
    result.elims = readStat(rawStats, ['eliminations', 'elims', 'elim', 'kills']);
    result.assists = readStat(rawStats, ['assists', 'ast']);
    result.deaths = readStat(rawStats, ['deaths', 'dth', 'death']);
    result.damage = readStat(rawStats, ['damage', 'dmg']);
    result.healing = readStat(rawStats, ['healing', 'heal']);
    result.mitigation = readStat(rawStats, ['mitigation', 'blocked', 'block']);
    
    let mapMins = extractMapMinutes(rawStats) || fallbackMapMinutes;
    // 智能防御：如果抓到的时间小于30分钟，说明是单张地图的物理时间，需要乘5折算成五人总时间
    if (mapMins > 0 && mapMins < 30) {
        mapMins = mapMins * 5;
    }
    result.rawPlayerMinutes = mapMins;
  } else {
    const rows = safeRows(rawStats);
    let totalPlayerMins = 0;
    rows.forEach(row => {
      if (typeof row !== 'object' || !row) return;
      result.elims += readStat(row, ['eliminations', 'elims', 'elim', 'kills']);
      result.assists += readStat(row, ['assists', 'ast']);
      result.deaths += readStat(row, ['deaths', 'dth', 'death']);
      result.damage += readStat(row, ['damage', 'dmg']);
      result.healing += readStat(row, ['healing', 'heal']);
      result.mitigation += readStat(row, ['mitigation', 'blocked', 'block']);
      totalPlayerMins += extractPlayerMinutes(row);
    });
    result.rawPlayerMinutes = totalPlayerMins > 0 ? totalPlayerMins : (fallbackMapMinutes * 5);
  }

  return result;
}

function formatPct(won, played) {
  if (!played) return '0%';
  return `${((won / played) * 100).toFixed(1)}%`;
}

// 🌟 数学闭环：严格使用 (总数值 / 五人总时间) * 5个人 * 10分钟
function formatPer10(total, rawPlayerMinutes, digits = 1) {
  if (!rawPlayerMinutes || rawPlayerMinutes <= 0) return digits > 0 ? '0.0' : '0';
  return ((toNum(total) / rawPlayerMinutes) * 5 * 10).toFixed(digits);
}

function buildMapProfileIndex(db) {
  const mapIndex = new Map();

  safeArr(db?.matches).forEach(match => {
    const teamA = { id: match?.team_a?.id || '', name: match?.team_a?.name || '', short: match?.team_a?.short || '' };
    const teamB = { id: match?.team_b?.id || '', name: match?.team_b?.name || '', short: match?.team_b?.short || '' };

    safeArr(match?.maps).forEach(map => {
      const mapName = normalizeText(map?.map_name || map?.mapName);
      const mapType = normalizeText(map?.map_type || map?.mapType);
      if (!mapName) return;

      if (!mapIndex.has(mapName)) {
        mapIndex.set(mapName, { mapName, mapType: mapType || 'MODE', globalPlays: 0, teams: {} });
      }
      const bucket = mapIndex.get(mapName);
      bucket.globalPlays += 1;
      if (mapType && !bucket.mapType) bucket.mapType = mapType;

      const winnerId = resolveWinnerId(map?.winner, teamA, teamB);
      const fallbackMapMinutes = extractMapMinutes(map);

      [
        { team: teamA, stats: sumStats(map?.team_a_stats, fallbackMapMinutes) },
        { team: teamB, stats: sumStats(map?.team_b_stats, fallbackMapMinutes) }
      ].forEach(({ team, stats }) => {
        if (!team?.id) return;
        if (!bucket.teams[team.id]) {
          bucket.teams[team.id] = {
            teamId: team.id, teamName: team.name, teamShort: team.short,
            played: 0, won: 0, lost: 0,
            totals: { elims: 0, assists: 0, deaths: 0, damage: 0, healing: 0, mitigation: 0 },
            rawPlayerMinutes: 0
          };
        }
        const row = bucket.teams[team.id];
        row.played += 1;
        if (winnerId === team.id) row.won += 1;
        else if (winnerId) row.lost += 1;

        row.totals.elims += stats.elims;
        row.totals.assists += stats.assists;
        row.totals.deaths += stats.deaths;
        row.totals.damage += stats.damage;
        row.totals.healing += stats.healing;
        row.totals.mitigation += stats.mitigation;
        row.rawPlayerMinutes += stats.rawPlayerMinutes; 
      });
    });
  });

  safeArr(db?.players).forEach(player => {
    const teamId = player?.team_id || player?.team_short_name;
    if (!teamId) return;

    safeArr(player?.match_logs).forEach(log => {
      const mapName = normalizeText(log?.mapName || log?.map_name);
      if (!mapName) return;

      if (!mapIndex.has(mapName)) {
        mapIndex.set(mapName, { mapName, mapType: log?.mapType || 'MODE', globalPlays: 1, teams: {} });
      }
      const bucket = mapIndex.get(mapName);

      if (!bucket.teams[teamId]) {
        bucket.teams[teamId] = {
          teamId, teamName: player?.team_name || teamId, teamShort: player?.team_short_name || teamId,
          played: 1, won: 0, lost: 0,
          totals: { elims: 0, assists: 0, deaths: 0, damage: 0, healing: 0, mitigation: 0 },
          rawPlayerMinutes: 0
        };
      }

      const row = bucket.teams[teamId];

      if (row.rawPlayerMinutes <= 0 || row._isFallback) {
        row._isFallback = true;
        row.totals.elims += readStat(log, ['elims', 'eliminations', 'kills']);
        row.totals.assists += readStat(log, ['assists', 'ast']);
        row.totals.deaths += readStat(log, ['deaths', 'dth']);
        row.totals.damage += readStat(log, ['damage', 'dmg']);
        row.totals.healing += readStat(log, ['healing', 'heal']);
        row.totals.mitigation += readStat(log, ['blocked', 'mitigation']);
        row.rawPlayerMinutes += extractPlayerMinutes(log);
      }
    });
  });

  return mapIndex;
}

function createDefaultRows(tr) {
  const tt = (key, fallback) => (typeof tr === 'function' ? tr(key, { defaultValue: fallback }) : fallback);
  return [
    { label: tt('dataGraphicsPanels.metrics.mapWinRate', '地图胜率'), valA: '0%', valB: '0%' },
    { label: tt('dataGraphicsPanels.metrics.elimPer10', '击杀 / 10分'), valA: '0.0', valB: '0.0' },
    { label: tt('dataGraphicsPanels.metrics.astPer10', '助攻 / 10分'), valA: '0.0', valB: '0.0' },
    { label: tt('dataGraphicsPanels.metrics.dthPer10', '死亡 / 10分'), valA: '0.0', valB: '0.0' },
    { label: tt('dataGraphicsPanels.metrics.dmgPer10', '伤害 / 10分'), valA: '0', valB: '0' },
    { label: tt('dataGraphicsPanels.metrics.healPer10', '治疗 / 10分'), valA: '0', valB: '0' }
  ];
}

const sourceCardStyle = {
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.025)',
  padding: '10px 12px',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  minHeight: 92
};

const headStripStyle = {
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.025)',
  padding: '10px',
  display: 'grid',
  gridTemplateColumns: 'minmax(0,1fr) 120px 120px',
  gap: 10,
  alignItems: 'stretch'
};

const metricCardStyle = {
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.03)',
  padding: '10px',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  minHeight: 98
};

export default function MapProfilePanel({ db, dbStatus, density, densityTokens, is1080Compact }) {
  const { t: tr } = useTranslation();
  const { matchData, updateWithHistory, setPreviewScene, takeScene } = useMatchContext();
  const t = densityTokens || { panelPadding: '12px' };
  const rowH = is1080Compact ? '32px' : '36px';

  const [mapType, setMapType] = useState('');
  const [mapName, setMapName] = useState('');
  const [teamAId, setTeamAId] = useState('');
  const [teamBId, setTeamBId] = useState('');

  const [formData, setFormData] = useState({
    mapName: tr('dataGraphicsPanels.mapProfile.defaultMapName', { defaultValue: '地图名称' }),
    mapType: tr('dataGraphicsPanels.mapProfile.defaultMode', { defaultValue: '模式' }),
    globalPlays: '0',
    teamA: tr('dataGraphicsPanels.mapProfile.defaultTeamA', { defaultValue: '队伍 A' }),
    teamB: tr('dataGraphicsPanels.mapProfile.defaultTeamB', { defaultValue: '队伍 B' }),
    fullNameA: '', 
    fullNameB: '', 
    recordA: '0-0',
    recordB: '0-0',
    rows: createDefaultRows(tr)
  });

  const teamOptions = useMemo(() => {
    return safeArr(db?.teams)
      .filter(team => PLAYOFF_TEAMS.includes(team?.team_short_name || team?.short || team?.team_name))
      .map(team => ({
        id: getTeamId(team),
        name: team?.team_name || team?.name || '',
        short: team?.team_short_name || team?.short || team?.team_name || ''
      }));
  }, [db]);

  const mapProfileIndex = useMemo(() => buildMapProfileIndex(db), [db]);

  const uniqueMaps = useMemo(() => {
    return Array.from(mapProfileIndex.values()).sort((a, b) => a.mapName.localeCompare(b.mapName));
  }, [mapProfileIndex]);

  const mapTypes = useMemo(() => {
    return Array.from(new Set(uniqueMaps.map(m => m.mapType).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }, [uniqueMaps]);

  const filteredMaps = useMemo(() => {
    return uniqueMaps.filter(m => !mapType || m.mapType === mapType);
  }, [uniqueMaps, mapType]);

  useEffect(() => {
    if (!mapName) return;
    const exists = filteredMaps.some(m => m.mapName === mapName);
    if (!exists) setMapName('');
  }, [mapType, filteredMaps, mapName]);

  useEffect(() => {
    const teamA = teamOptions.find(t => t.id === teamAId) || null;
    const teamB = teamOptions.find(t => t.id === teamBId) || null;
    const mapBucket = mapProfileIndex.get(mapName) || null;
    const rowA = mapBucket?.teams?.[teamAId] || null;
    const rowB = mapBucket?.teams?.[teamBId] || null;

    setFormData({
      mapName: mapBucket?.mapName || mapName || tr('dataGraphicsPanels.mapProfile.defaultMapName', { defaultValue: '地图名称' }),
      mapType: mapBucket?.mapType || mapType || tr('dataGraphicsPanels.mapProfile.defaultMode', { defaultValue: '模式' }),
      globalPlays: mapBucket ? String(mapBucket.globalPlays) : '0',
      teamA: teamA?.short || tr('dataGraphicsPanels.mapProfile.defaultTeamA', { defaultValue: '队伍 A' }),
      teamB: teamB?.short || tr('dataGraphicsPanels.mapProfile.defaultTeamB', { defaultValue: '队伍 B' }),
      fullNameA: rowA?.teamName || teamA?.name || '', 
      fullNameB: rowB?.teamName || teamB?.name || '', 
      recordA: rowA ? `${rowA.won}-${rowA.lost}` : '0-0',
      recordB: rowB ? `${rowB.won}-${rowB.lost}` : '0-0',
      rows: [
        { label: tr('dataGraphicsPanels.metrics.mapWinRate', { defaultValue: '地图胜率' }), valA: rowA ? formatPct(rowA.won, rowA.played) : '0%', valB: rowB ? formatPct(rowB.won, rowB.played) : '0%' },
        { label: tr('dataGraphicsPanels.metrics.elimPer10', { defaultValue: '击杀 / 10分' }), valA: rowA ? formatPer10(rowA.totals.elims, rowA.rawPlayerMinutes, 1) : '0.0', valB: rowB ? formatPer10(rowB.totals.elims, rowB.rawPlayerMinutes, 1) : '0.0' },
        { label: tr('dataGraphicsPanels.metrics.astPer10', { defaultValue: '助攻 / 10分' }), valA: rowA ? formatPer10(rowA.totals.assists, rowA.rawPlayerMinutes, 1) : '0.0', valB: rowB ? formatPer10(rowB.totals.assists, rowB.rawPlayerMinutes, 1) : '0.0' },
        { label: tr('dataGraphicsPanels.metrics.dthPer10', { defaultValue: '死亡 / 10分' }), valA: rowA ? formatPer10(rowA.totals.deaths, rowA.rawPlayerMinutes, 1) : '0.0', valB: rowB ? formatPer10(rowB.totals.deaths, rowB.rawPlayerMinutes, 1) : '0.0' },
        { label: tr('dataGraphicsPanels.metrics.dmgPer10', { defaultValue: '伤害 / 10分' }), valA: rowA ? formatPer10(rowA.totals.damage, rowA.rawPlayerMinutes, 0) : '0', valB: rowB ? formatPer10(rowB.totals.damage, rowB.rawPlayerMinutes, 0) : '0' },
        { label: tr('dataGraphicsPanels.metrics.healPer10', { defaultValue: '治疗 / 10分' }), valA: rowA ? formatPer10(rowA.totals.healing, rowA.rawPlayerMinutes, 0) : '0', valB: rowB ? formatPer10(rowB.totals.healing, rowB.rawPlayerMinutes, 0) : '0' }
      ]
    });
  }, [mapType, mapName, teamAId, teamBId, teamOptions, mapProfileIndex, tr]);

  const updateRow = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      rows: prev.rows.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    }));
  };

  const swapSides = () => {
    setFormData(prev => ({
      ...prev,
      teamA: prev.teamB,
      teamB: prev.teamA,
      fullNameA: prev.fullNameB,
      fullNameB: prev.fullNameA,
      recordA: prev.recordB,
      recordB: prev.recordA,
      rows: prev.rows.map(row => ({
        ...row,
        valA: row.valB,
        valB: row.valA
      }))
    }));

    setTeamAId(teamBId);
    setTeamBId(teamAId);
  };

  const handleTake = () => {
    updateWithHistory('Take Map Profile', {
      ...matchData,
      mapProfileData: formData,
      dataGraphics: { type: 'MAP_PROFILE', payload: formData },
      globalScene: 'MAP_PROFILE_SCENE'
    });
    
    if (setPreviewScene) setPreviewScene('MAP_PROFILE_SCENE');
    if (takeScene) takeScene('MAP_PROFILE_SCENE'); 
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '360px minmax(0,1fr)', gap: 10, alignItems: 'start' }}>
      <ShellPanel title={tr('dataGraphicsPanels.common.autoFill', { defaultValue: '自动填充' })} accent density={density} bodyStyle={{ padding: t.panelPadding }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <div style={labelStyle}>{tr('dataGraphicsPanels.mapProfile.targetType', { defaultValue: '目标类型' })}</div>
            <select
              style={{ ...UI.select, height: rowH, color: COLORS.yellow }}
              value={mapType}
              onChange={e => setMapType(e.target.value)}
              disabled={dbStatus !== 'LOADED'}
            >
              <option value="">{tr('dataGraphicsPanels.mapProfile.selectType', { defaultValue: '-- 选择类型 --' })}</option>
              {mapTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={labelStyle}>{tr('dataGraphicsPanels.mapProfile.targetMap', { defaultValue: '目标地图' })}</div>
            <select
              style={{ ...UI.select, height: rowH, color: COLORS.yellow }}
              value={mapName}
              onChange={e => setMapName(e.target.value)}
              disabled={dbStatus !== 'LOADED'}
            >
              <option value="">{tr('dataGraphicsPanels.mapProfile.selectMap', { defaultValue: '-- 选择地图 --' })}</option>
              {filteredMaps.map(m => (
                <option key={m.mapName} value={m.mapName}>
                  {m.mapName}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <div style={labelStyle}>{tr('dataGraphicsPanels.common.leftTeam', { defaultValue: '左侧队伍' })}</div>
              <select
                style={{ ...UI.select, height: rowH }}
                value={teamAId}
                onChange={e => setTeamAId(e.target.value)}
                disabled={dbStatus !== 'LOADED'}
              >
                <option value="">{tr('dataGraphicsPanels.common.selectTeamA', { defaultValue: '-- 选择队伍 A --' })}</option>
                {teamOptions.map(t => (
                  <option key={`PRF_A_${t.id}`} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div style={labelStyle}>{tr('dataGraphicsPanels.common.rightTeam', { defaultValue: '右侧队伍' })}</div>
              <select
                style={{ ...UI.select, height: rowH }}
                value={teamBId}
                onChange={e => setTeamBId(e.target.value)}
                disabled={dbStatus !== 'LOADED'}
              >
                <option value="">{tr('dataGraphicsPanels.common.selectTeamB', { defaultValue: '-- 选择队伍 B --' })}</option>
                {teamOptions.map(t => (
                  <option key={`PRF_B_${t.id}`} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            style={{
              ...UI.btn,
              height: 34,
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.14)',
              color: COLORS.white,
              fontWeight: 900
            }}
            onClick={swapSides}
          >
            {tr('dataGraphicsPanels.common.swapSides', { defaultValue: '交换左右' })}
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={sourceCardStyle}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.46)', fontWeight: 800 }}>{tr('dataGraphicsPanels.common.leftSource', { defaultValue: '左侧来源' })}</div>
              <div style={{ fontSize: 18, color: COLORS.white, fontWeight: 900, lineHeight: 1.1 }}>
                {formData.teamA}
              </div>
              <div style={{ fontSize: 11, color: COLORS.yellow, fontWeight: 800 }}>
                {tr('dataGraphicsPanels.mapProfile.record', { defaultValue: '战绩' })} {formData.recordA}
              </div>
            </div>

            <div style={sourceCardStyle}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.46)', fontWeight: 800 }}>{tr('dataGraphicsPanels.common.rightSource', { defaultValue: '右侧来源' })}</div>
              <div style={{ fontSize: 18, color: COLORS.white, fontWeight: 900, lineHeight: 1.1 }}>
                {formData.teamB}
              </div>
              <div style={{ fontSize: 11, color: COLORS.yellow, fontWeight: 800 }}>
                {tr('dataGraphicsPanels.mapProfile.record', { defaultValue: '战绩' })} {formData.recordB}
              </div>
            </div>
          </div>
        </div>
      </ShellPanel>

      <ShellPanel title={tr('dataGraphicsPanels.mapProfile.editTitle', { defaultValue: '资料编辑' })} accent density={density} bodyStyle={{ padding: t.panelPadding }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
          <div style={headStripStyle}>
            <input
              style={{ ...UI.input, height: 38, textAlign: 'left', fontSize: 16, fontWeight: 900 }}
              value={formData.mapName}
              onChange={e => setFormData({ ...formData, mapName: e.target.value })}
            />
            <input
              style={{ ...UI.input, height: 38, fontSize: 13 }}
              value={formData.mapType}
              onChange={e => setFormData({ ...formData, mapType: e.target.value })}
            />
            <input
              style={{ ...UI.input, height: 38, fontSize: 13 }}
              value={formData.globalPlays}
              onChange={e => setFormData({ ...formData, globalPlays: e.target.value })}
            />
          </div>

          <div
            style={{
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.025)',
              padding: '10px',
              display: 'grid',
              gridTemplateColumns: 'minmax(0,1fr) 72px minmax(0,1fr)',
              gap: 10,
              alignItems: 'stretch'
            }}
          >
            {/* 🌟 核心：队伍A的简称与全称均支持手改 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: 8 }}>
                <input
                  style={{ ...UI.input, height: 34, fontSize: 16 }}
                  value={formData.teamA}
                  onChange={e => setFormData({ ...formData, teamA: e.target.value })}
                  placeholder={tr('dataGraphicsPanels.common.shortName', { defaultValue: '简称' })}
                />
                <input
                  style={{ ...UI.input, height: 34, fontSize: 13 }}
                  value={formData.recordA}
                  onChange={e => setFormData({ ...formData, recordA: e.target.value })}
                  placeholder="0-0"
                />
              </div>
              <input
                  style={{ ...UI.input, height: 26, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}
                  value={formData.fullNameA}
                  onChange={e => setFormData({ ...formData, fullNameA: e.target.value })}
                  placeholder={tr('dataGraphicsPanels.mapProfile.fullNameAPlaceholder', { defaultValue: '队伍 A 全称编辑' })}
              />
            </div>

            <div
              style={{
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: COLORS.yellow,
                fontWeight: 900,
                fontSize: 18
              }}
            >
              VS
            </div>

            {/* 🌟 核心：队伍B的简称与全称均支持手改 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: 8 }}>
                <input
                  style={{ ...UI.input, height: 34, fontSize: 16 }}
                  value={formData.teamB}
                  onChange={e => setFormData({ ...formData, teamB: e.target.value })}
                  placeholder={tr('dataGraphicsPanels.common.shortName', { defaultValue: '简称' })}
                />
                <input
                  style={{ ...UI.input, height: 34, fontSize: 13 }}
                  value={formData.recordB}
                  onChange={e => setFormData({ ...formData, recordB: e.target.value })}
                  placeholder="0-0"
                />
              </div>
              <input
                  style={{ ...UI.input, height: 26, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}
                  value={formData.fullNameB}
                  onChange={e => setFormData({ ...formData, fullNameB: e.target.value })}
                  placeholder={tr('dataGraphicsPanels.mapProfile.fullNameBPlaceholder', { defaultValue: '队伍 B 全称编辑' })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 10 }}>
            {formData.rows.map((row, idx) => (
              <div key={`row_${idx}`} style={metricCardStyle}>
                <input
                  style={{ ...UI.input, height: 28, fontSize: 10, backgroundColor: 'rgba(255,255,255,0.05)' }}
                  value={row.label}
                  onChange={e => updateRow(idx, 'label', e.target.value)}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input
                    style={{ ...UI.input, height: 34, color: COLORS.yellow, fontSize: 15 }}
                    value={row.valA}
                    onChange={e => updateRow(idx, 'valA', e.target.value)}
                  />
                  <input
                    style={{ ...UI.input, height: 34, color: COLORS.yellow, fontSize: 15 }}
                    value={row.valB}
                    onChange={e => updateRow(idx, 'valB', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            style={{
              ...UI.btn,
              height: 42,
              backgroundColor: COLORS.yellow,
              color: COLORS.black,
              fontWeight: 900,
              letterSpacing: '1px',
              fontSize: 13
            }}
            onClick={handleTake}
          >
            {tr('dataGraphicsPanels.mapProfile.takeButton', { defaultValue: '推送单图资料卡' })}
          </button>
        </div>
      </ShellPanel>
    </div>
  );
}