import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMatchContext } from '../../../contexts/MatchContext';
import { ShellPanel } from '../../common/SharedUI';
import { COLORS, labelStyle } from '../../../constants/styles';

const PLAYOFF_TEAMS = ['NGP', 'TNS', 'YOU', 'ZS', 'HYW', 'SPC', 'XCFN.G', 'FG'];
const MAP_PROFILE_CACHE_KEY = 'FCUP_DATA_GRAPHICS_MAP_PROFILE_PANEL_V1';

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
const safeText = v => String(v ?? '').trim();
const normaliseKey = v => safeText(v).toLowerCase();
const normaliseShort = v => safeText(v).toUpperCase();

function readPanelCache() {
  try {
    const raw = localStorage.getItem(MAP_PROFILE_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writePanelCache(payload) {
  try {
    localStorage.setItem(MAP_PROFILE_CACHE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('[SYS_WARN] MapProfile cache write failed:', err);
  }
}

function getTeamId(team) {
  return team?.team_id || team?.id || team?.teamId || '';
}

function normalizeText(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function pickTeamValue(value) {
  if (!value) return '';
  if (typeof value === 'string' || typeof value === 'number') return safeText(value);

  return safeText(
    value.team_short_name ||
    value.shortName ||
    value.short ||
    value.abbr ||
    value.code ||
    value.tag ||
    value.id ||
    value.team_id ||
    value.teamId ||
    value.team_name ||
    value.name ||
    value.fullName ||
    value.displayName
  );
}

function extractSideTeam(matchData, side) {
  if (!matchData) return '';

  const isA = side === 'A';
  const directKeys = isA
    ? ['teamA', 'teamAInfo', 'teamAData', 'team_a', 'homeTeam', 'leftTeam', 'blueTeam', 'team1', 'selectedTeamA', 'teamAName', 'teamAShort', 'teamAId']
    : ['teamB', 'teamBInfo', 'teamBData', 'team_b', 'awayTeam', 'rightTeam', 'redTeam', 'team2', 'selectedTeamB', 'teamBName', 'teamBShort', 'teamBId'];

  for (const key of directKeys) {
    const picked = pickTeamValue(matchData[key]);
    if (picked) return picked;
  }

  const nestedCandidates = [
    matchData.teams?.[side],
    matchData.teams?.[side.toLowerCase()],
    matchData.teams?.[isA ? 0 : 1],
    matchData.currentMatch?.[isA ? 'teamA' : 'teamB'],
    matchData.currentMatch?.teams?.[side],
    matchData.currentMatch?.teams?.[side.toLowerCase()],
    matchData.currentMatch?.teams?.[isA ? 0 : 1],
    matchData.liveMatch?.[isA ? 'teamA' : 'teamB'],
    matchData.liveMatch?.teams?.[side],
    matchData.liveMatch?.teams?.[side.toLowerCase()],
    matchData.liveMatch?.teams?.[isA ? 0 : 1]
  ];

  for (const item of nestedCandidates) {
    const picked = pickTeamValue(item);
    if (picked) return picked;
  }

  return '';
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
    if (mapMins > 0 && mapMins < 30) mapMins = mapMins * 5;
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

    result.rawPlayerMinutes = totalPlayerMins > 0 ? totalPlayerMins : fallbackMapMinutes * 5;
  }

  return result;
}

function formatPct(won, played) {
  if (!played) return '0%';
  return `${((won / played) * 100).toFixed(1)}%`;
}

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
            teamId: team.id,
            teamName: team.name,
            teamShort: team.short,
            played: 0,
            won: 0,
            lost: 0,
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
          teamId,
          teamName: player?.team_name || teamId,
          teamShort: player?.team_short_name || teamId,
          played: 1,
          won: 0,
          lost: 0,
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

function buildTeamOption(team) {
  const id = safeText(getTeamId(team));
  const name = safeText(team?.team_name || team?.name || team?.fullName || team?.displayName);
  const short = safeText(team?.team_short_name || team?.short || team?.abbr || team?.code || team?.tag || team?.team_name || team?.name);

  return {
    id,
    name,
    short,
    playoff: PLAYOFF_TEAMS.includes(normaliseShort(short)) || PLAYOFF_TEAMS.includes(normaliseShort(name)) || PLAYOFF_TEAMS.includes(normaliseShort(id)),
    aliases: [
      id,
      name,
      short,
      team?.team_id,
      team?.id,
      team?.teamId,
      team?.team_name,
      team?.name,
      team?.short,
      team?.team_short_name,
      team?.abbr,
      team?.code,
      team?.tag,
      team?.fullName,
      team?.displayName
    ].map(safeText).filter(Boolean)
  };
}

function findTeamOptionByRef(teamOptions, ref) {
  const raw = pickTeamValue(ref);
  if (!raw) return null;

  const key = normaliseKey(raw);

  return teamOptions.find(team => {
    return team.aliases.some(alias => normaliseKey(alias) === key);
  }) || null;
}

function findMapTeamRow(mapBucket, team) {
  if (!mapBucket || !team) return null;

  const candidates = [team.id, team.short, team.name, ...safeArr(team.aliases)].map(safeText).filter(Boolean);
  const directKey = candidates.find(key => mapBucket.teams?.[key]);

  if (directKey) return mapBucket.teams[directKey];

  const candidateSet = new Set(candidates.map(normaliseKey));

  return Object.values(mapBucket.teams || {}).find(row => {
    return [
      row?.teamId,
      row?.teamShort,
      row?.teamName
    ].some(value => candidateSet.has(normaliseKey(value)));
  }) || null;
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

export default function MapProfilePanel({
  db,
  dbStatus,
  density,
  densityTokens,
  is1080Compact,
  preferredTeamA = '',
  preferredTeamB = '',
  defaultTeamA = '',
  defaultTeamB = '',
  autoTeamA = '',
  autoTeamB = '',
  currentMatchTeams
}) {
  const { t: tr } = useTranslation();
  const { matchData, updateWithHistory, setPreviewScene, takeScene } = useMatchContext();
  const t = densityTokens || { panelPadding: '12px' };
  const rowH = is1080Compact ? '32px' : '36px';
  const initialCache = useMemo(() => readPanelCache(), []);

  const [mapType, setMapType] = useState(initialCache.mapType || '');
  const [mapName, setMapName] = useState(initialCache.mapName || '');
  const [teamAId, setTeamAId] = useState(initialCache.teamAId || '');
  const [teamBId, setTeamBId] = useState(initialCache.teamBId || '');

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
      .map(buildTeamOption)
      .filter(team => team.id || team.short || team.name)
      .sort((a, b) => {
        if (a.playoff !== b.playoff) return a.playoff ? -1 : 1;
        return (a.short || a.name).localeCompare(b.short || b.name);
      });
  }, [db]);

  const detectedMatchTeams = useMemo(() => {
    const rawTeamA = preferredTeamA || defaultTeamA || autoTeamA || currentMatchTeams?.teamA || extractSideTeam(matchData, 'A');
    const rawTeamB = preferredTeamB || defaultTeamB || autoTeamB || currentMatchTeams?.teamB || extractSideTeam(matchData, 'B');

    const teamA = findTeamOptionByRef(teamOptions, rawTeamA);
    const teamB = findTeamOptionByRef(teamOptions, rawTeamB);

    return {
      rawTeamA,
      rawTeamB,
      teamA,
      teamB,
      hasCurrentMatchTeams: !!teamA?.id && !!teamB?.id && teamA.id !== teamB.id
    };
  }, [preferredTeamA, preferredTeamB, defaultTeamA, defaultTeamB, autoTeamA, autoTeamB, currentMatchTeams, matchData, teamOptions]);

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
    if (dbStatus !== 'LOADED' || !detectedMatchTeams.hasCurrentMatchTeams) return;

    setTeamAId(detectedMatchTeams.teamA.id);
    setTeamBId(detectedMatchTeams.teamB.id);
  }, [dbStatus, detectedMatchTeams.hasCurrentMatchTeams, detectedMatchTeams.teamA?.id, detectedMatchTeams.teamB?.id]);

  useEffect(() => {
    writePanelCache({ mapType, mapName, teamAId, teamBId });
  }, [mapType, mapName, teamAId, teamBId]);

  useEffect(() => {
    if (!mapName) return;
    const exists = filteredMaps.some(m => m.mapName === mapName);
    if (!exists) setMapName('');
  }, [mapType, filteredMaps, mapName]);

  useEffect(() => {
    const teamA = teamOptions.find(t => t.id === teamAId) || null;
    const teamB = teamOptions.find(t => t.id === teamBId) || null;
    const mapBucket = mapProfileIndex.get(mapName) || null;
    const rowA = findMapTeamRow(mapBucket, teamA);
    const rowB = findMapTeamRow(mapBucket, teamB);

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
      rows: prev.rows.map(row => ({ ...row, valA: row.valB, valB: row.valA }))
    }));

    setTeamAId(teamBId);
    setTeamBId(teamAId);
  };

  const handleTake = () => {
    updateWithHistory('Set Map Profile Data', {
      ...matchData,
      mapProfileData: {
        ...formData,
        source: {
          mapType,
          mapName,
          teamAId,
          teamBId,
          autoMatchTeams: {
            teamA: detectedMatchTeams.teamA?.short || '',
            teamB: detectedMatchTeams.teamB?.short || '',
            rawTeamA: detectedMatchTeams.rawTeamA || '',
            rawTeamB: detectedMatchTeams.rawTeamB || ''
          }
        }
      },
      dataGraphics: {
        type: 'MAP_PROFILE',
        payload: {
          ...formData,
          source: {
            mapType,
            mapName,
            teamAId,
            teamBId
          }
        }
      }
    });

    setPreviewScene?.('MAP_PROFILE_SCENE');

    window.setTimeout(() => {
      takeScene?.('MAP_PROFILE_SCENE');
    }, 0);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: is1080Compact ? '1fr' : '360px minmax(0,1fr)', gap: 10, alignItems: 'start' }}>
      <ShellPanel title={tr('dataGraphicsPanels.common.autoFill', { defaultValue: '自动填充' })} accent density={density} bodyStyle={{ padding: t.panelPadding }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {detectedMatchTeams.hasCurrentMatchTeams && (
            <div
              style={{
                border: '1px solid rgba(244,195,32,0.24)',
                background: 'rgba(244,195,32,0.06)',
                color: COLORS.yellow,
                padding: '8px 10px',
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: '0.5px',
                lineHeight: 1.35,
                textTransform: 'uppercase'
              }}
            >
              AUTO MATCH TEAMS · {detectedMatchTeams.teamA.short} VS {detectedMatchTeams.teamB.short}
            </div>
          )}

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
                  <option key={`PRF_A_${t.id || t.short}`} value={t.id}>
                    {t.playoff ? '★ ' : ''}{t.name || t.short}
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
                  <option key={`PRF_B_${t.id || t.short}`} value={t.id}>
                    {t.playoff ? '★ ' : ''}{t.name || t.short}
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