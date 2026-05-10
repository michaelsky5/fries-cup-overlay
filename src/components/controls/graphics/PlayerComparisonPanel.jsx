import React, { useEffect, useMemo, useState } from 'react';
import { useMatchContext } from '../../../contexts/MatchContext';
import { ShellPanel } from '../../common/SharedUI';
import { COLORS, labelStyle } from '../../../constants/styles';

const PLAYOFF_TEAMS = ['NGP', 'TNS', 'YOU', 'ZS', 'HYW', 'SPC', 'XCFN.G', 'FG'];
const PLAYER_COMPARISON_CACHE_KEY = 'FCUP_DATA_GRAPHICS_PLAYER_COMPARISON_PANEL_V1';

const UI = {
  input: {
    width: '100%',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.14)',
    color: COLORS.white,
    outline: 'none',
    boxSizing: 'border-box',
    textAlign: 'center',
    fontWeight: 900,
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
    transition: 'all 0.2s ease'
  },
  chip: active => ({
    border: active ? `1px solid ${COLORS.yellow}` : '1px solid rgba(255,255,255,0.12)',
    background: active ? 'rgba(244,195,32,0.12)' : 'rgba(255,255,255,0.04)',
    color: active ? COLORS.yellow : COLORS.white,
    cursor: 'pointer',
    fontWeight: 900,
    fontSize: 11,
    minHeight: 34,
    padding: '0 10px'
  })
};

const safeArr = v => Array.isArray(v) ? v : [];
const toNum = v => Number.isFinite(Number(v)) ? Number(v) : 0;
const safeText = v => String(v ?? '').trim();
const normaliseKey = v => safeText(v).toLowerCase();
const normaliseShort = v => safeText(v).toUpperCase();

function readPanelCache() {
  try {
    const raw = localStorage.getItem(PLAYER_COMPARISON_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writePanelCache(payload) {
  try {
    localStorage.setItem(PLAYER_COMPARISON_CACHE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('[SYS_WARN] PlayerComparison cache write failed:', err);
  }
}

function getSafeId(p, idx) {
  return p?.player_id || p?.id || p?.nickname || `p_${idx}`;
}

function getBattleTag(player) {
  return player?.battletag || player?.battle_tag || player?.battleTag || player?.player_name || '';
}

function getDisplayName(player) {
  return player?.display_name || player?.nickname || getBattleTag(player) || 'Unknown';
}

function getPlayerTeamId(player) {
  return player?.team_id || player?.team_short_name || '';
}

function formatPlayerOptionLabel(player) {
  const display = getDisplayName(player);
  const battletag = getBattleTag(player);
  const team = player?.team_short_name || '-';

  if (battletag && battletag !== display) return `${display} · ${battletag} [${team}]`;
  return `${display} [${team}]`;
}

function parseTopHeroes(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') return value.split('/').map(v => v.trim()).filter(Boolean);
  return [];
}

function formatHeroFileName(heroName) {
  if (!heroName || typeof heroName !== 'string') return '';

  return heroName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\./g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
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

function buildTeamOption(team) {
  const id = safeText(team?.team_id || team?.id || team?.teamId || team?.team_short_name);
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

  return teamOptions.find(team => team.aliases.some(alias => normaliseKey(alias) === key)) || null;
}

function teamMatchesRefSet(team, refSet) {
  return team.aliases.some(alias => refSet.has(normaliseShort(alias)));
}

function playerMatchesTeamScope(player, refSet) {
  const values = [
    player?.team_id,
    player?.team_name,
    player?.team_short_name,
    player?.short,
    player?.team
  ].map(normaliseShort).filter(Boolean);

  return values.some(value => PLAYOFF_TEAMS.includes(value) || refSet.has(value));
}

function roleMatches(playerRole, targetRole) {
  const r = String(playerRole || '').toUpperCase();
  const target = String(targetRole || '').toUpperCase();

  if (target === 'SUP') return r === 'SUP' || r === 'SUPPORT';
  if (target === 'DPS') return r === 'DPS' || r === 'DAMAGE';
  return r === target;
}

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
      if (hero && hero !== '-') heroCount[hero] = (heroCount[hero] || 0) + 1;
    });

    const topHeroes = Object.entries(heroCount)
      .sort((a, b) => b[1] - a[1])
      .map(([hero]) => hero);

    const per10 = value => totalMinutes > 0 ? (value / totalMinutes) * 10 : 0;
    const kd = totalDth > 0 ? totalElim / totalDth : totalElim;

    return {
      player_id: player?.player_id || `fallback_${idx}`,
      team_id: player?.team_id || '',
      team_name: player?.team_name || '',
      display_name: player?.display_name || player?.nickname || player?.player_name || 'Unknown',
      nickname: player?.nickname || '',
      team_short_name: player?.team_short_name || '',
      role: player?.role || 'FLEX',
      battletag: player?.battletag || player?.battle_tag || player?.battleTag || player?.player_name || '',
      maps_played: logs.length,
      top_3_heroes: topHeroes,
      most_played_hero: topHeroes[0] || '',
      avg_elim: per10(totalElim),
      avg_ast: per10(totalAst),
      avg_dth: per10(totalDth),
      avg_dmg: per10(totalDmg),
      avg_heal: per10(totalHeal),
      avg_block: per10(totalBlock),
      total_elim: totalElim,
      total_dth: totalDth,
      kdr: kd
    };
  });
}

function getRoleSortKey(role) {
  if (role === 'TANK') return 'avg_block';
  if (role === 'SUP') return 'avg_heal';
  return 'avg_dmg';
}

function getComparisonPreset(playerA, playerB) {
  const roleA = String(playerA?.role || '').toUpperCase();
  const roleB = String(playerB?.role || '').toUpperCase();

  if (roleA && roleA === roleB) {
    if (roleA === 'TANK') {
      return {
        key: 'TANK',
        label: '坦位对位',
        metrics: [
          { label: '击杀 / 10分', key: 'avg_elim', dec: 1 },
          { label: '助攻 / 10分', key: 'avg_ast', dec: 1 },
          { label: '死亡 / 10分', key: 'avg_dth', dec: 1 },
          { label: '伤害 / 10分', key: 'avg_dmg', dec: 0 },
          { label: '承伤 / 10分', key: 'avg_block', dec: 0 }
        ]
      };
    }

    if (roleA === 'SUP' || roleA === 'SUPPORT') {
      return {
        key: 'SUP',
        label: '辅助对位',
        metrics: [
          { label: '击杀 / 10分', key: 'avg_elim', dec: 1 },
          { label: '助攻 / 10分', key: 'avg_ast', dec: 1 },
          { label: '死亡 / 10分', key: 'avg_dth', dec: 1 },
          { label: '治疗 / 10分', key: 'avg_heal', dec: 0 },
          { label: 'K / D', key: 'kdr', dec: 2 }
        ]
      };
    }
  }

  return {
    key: 'DPS',
    label: '输出对位',
    metrics: [
      { label: '击杀 / 10分', key: 'avg_elim', dec: 1 },
      { label: '助攻 / 10分', key: 'avg_ast', dec: 1 },
      { label: '死亡 / 10分', key: 'avg_dth', dec: 1 },
      { label: '伤害 / 10分', key: 'avg_dmg', dec: 0 },
      { label: 'K / D', key: 'kdr', dec: 2 }
    ]
  };
}

const compactCardStyle = {
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.025)',
  padding: '10px 12px',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  minHeight: 82
};

const liveEditorStyle = {
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.025)',
  padding: '12px',
  display: 'flex',
  flexDirection: 'column',
  gap: 8
};

export default function PlayerComparisonPanel({
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
  const { matchData, updateWithHistory, setPreviewScene, takeScene } = useMatchContext();
  const t = densityTokens || { panelPadding: '12px' };
  const rowH = is1080Compact ? '32px' : '36px';
  const initialCache = useMemo(() => readPanelCache(), []);

  const [teamAId, setTeamAId] = useState(initialCache.teamAId || '');
  const [teamBId, setTeamBId] = useState(initialCache.teamBId || '');
  const [playerAId, setPlayerAId] = useState(initialCache.playerAId || '');
  const [playerBId, setPlayerBId] = useState(initialCache.playerBId || '');
  const [presetKey, setPresetKey] = useState(initialCache.presetKey || 'DPS');

  const [formData, setFormData] = useState({
    nameA: initialCache.formData?.nameA || '',
    teamA: initialCache.formData?.teamA || '',
    nameB: initialCache.formData?.nameB || '',
    teamB: initialCache.formData?.teamB || '',
    metrics: initialCache.formData?.metrics || [
      { label: '击杀 / 10分', a: '', b: '' },
      { label: '助攻 / 10分', a: '', b: '' },
      { label: '死亡 / 10分', a: '', b: '' },
      { label: '伤害 / 10分', a: '', b: '' },
      { label: 'K / D', a: '', b: '' }
    ]
  });

  const autoTeamRefs = useMemo(() => {
    const rawTeamA = preferredTeamA || defaultTeamA || autoTeamA || currentMatchTeams?.teamA || extractSideTeam(matchData, 'A');
    const rawTeamB = preferredTeamB || defaultTeamB || autoTeamB || currentMatchTeams?.teamB || extractSideTeam(matchData, 'B');

    return {
      rawTeamA,
      rawTeamB
    };
  }, [
    preferredTeamA,
    preferredTeamB,
    defaultTeamA,
    defaultTeamB,
    autoTeamA,
    autoTeamB,
    currentMatchTeams,
    matchData
  ]);

  const rawCurrentTeamSet = useMemo(() => {
    return new Set([autoTeamRefs.rawTeamA, autoTeamRefs.rawTeamB].map(normaliseShort).filter(Boolean));
  }, [autoTeamRefs]);

  const rawPlayerSource = useMemo(() => {
    const source = safeArr(db?.player_totals).length
      ? safeArr(db.player_totals).map(p => ({
          ...p,
          battletag: p?.battletag || p?.battle_tag || p?.battleTag || p?.player_name || '',
          kdr: toNum(p.total_dth) > 0 ? toNum(p.total_elim) / toNum(p.total_dth) : toNum(p.total_elim),
          top_3_heroes: parseTopHeroes(p.top_3_heroes)
        }))
      : buildFallbackPlayerTotals(db?.players);

    return source;
  }, [db]);

  const teamOptions = useMemo(() => {
    const map = new Map();

    safeArr(db?.teams).forEach(team => {
      const option = buildTeamOption(team);
      if (!option.id && !option.short) return;

      const shouldInclude = option.playoff || teamMatchesRefSet(option, rawCurrentTeamSet);
      if (!shouldInclude) return;

      map.set(option.id || option.short, option);
    });

    if (!map.size) {
      rawPlayerSource.forEach((player, idx) => {
        const option = buildTeamOption({
          team_id: getPlayerTeamId(player) || `team_${idx}`,
          team_name: player?.team_name || player?.team_short_name || '未知队伍',
          team_short_name: player?.team_short_name || player?.team_name || '未知'
        });

        const shouldInclude = option.playoff || teamMatchesRefSet(option, rawCurrentTeamSet);
        if (shouldInclude && !map.has(option.id || option.short)) map.set(option.id || option.short, option);
      });
    }

    return Array.from(map.values()).sort((a, b) => {
      if (a.playoff !== b.playoff) return a.playoff ? -1 : 1;
      return (a.short || a.name).localeCompare(b.short || b.name);
    });
  }, [db, rawPlayerSource, rawCurrentTeamSet]);

  const detectedMatchTeams = useMemo(() => {
    const teamA = findTeamOptionByRef(teamOptions, autoTeamRefs.rawTeamA);
    const teamB = findTeamOptionByRef(teamOptions, autoTeamRefs.rawTeamB);

    return {
      rawTeamA: autoTeamRefs.rawTeamA,
      rawTeamB: autoTeamRefs.rawTeamB,
      teamA,
      teamB,
      hasCurrentMatchTeams: !!teamA?.id && !!teamB?.id && teamA.id !== teamB.id
    };
  }, [teamOptions, autoTeamRefs]);

  const activeTeamScopeSet = useMemo(() => {
    const values = [
      detectedMatchTeams.rawTeamA,
      detectedMatchTeams.rawTeamB,
      detectedMatchTeams.teamA?.id,
      detectedMatchTeams.teamA?.short,
      detectedMatchTeams.teamA?.name,
      detectedMatchTeams.teamB?.id,
      detectedMatchTeams.teamB?.short,
      detectedMatchTeams.teamB?.name
    ].map(normaliseShort).filter(Boolean);

    return new Set(values);
  }, [detectedMatchTeams]);

  const playerPool = useMemo(() => {
    return [...rawPlayerSource]
      .filter(player => playerMatchesTeamScope(player, activeTeamScopeSet))
      .sort((a, b) => {
        const teamA = a?.team_short_name || '';
        const teamB = b?.team_short_name || '';

        if (teamA !== teamB) return teamA.localeCompare(teamB);

        const nameA = getDisplayName(a);
        const nameB = getDisplayName(b);

        return nameA.localeCompare(nameB);
      });
  }, [rawPlayerSource, activeTeamScopeSet]);

  const filteredPlayersA = useMemo(
    () => playerPool.filter(player =>
      !teamAId ||
      getPlayerTeamId(player) === teamAId ||
      normaliseShort(player?.team_short_name) === normaliseShort(teamAId)
    ),
    [playerPool, teamAId]
  );

  const filteredPlayersB = useMemo(
    () => playerPool.filter(player =>
      !teamBId ||
      getPlayerTeamId(player) === teamBId ||
      normaliseShort(player?.team_short_name) === normaliseShort(teamBId)
    ),
    [playerPool, teamBId]
  );

  useEffect(() => {
    if (dbStatus !== 'LOADED' || !detectedMatchTeams.hasCurrentMatchTeams) return;

    setTeamAId(detectedMatchTeams.teamA.id);
    setTeamBId(detectedMatchTeams.teamB.id);
  }, [
    dbStatus,
    detectedMatchTeams.hasCurrentMatchTeams,
    detectedMatchTeams.teamA?.id,
    detectedMatchTeams.teamB?.id
  ]);

  useEffect(() => {
    if (dbStatus !== 'LOADED') return;

    if (teamAId && !teamOptions.some(team => team.id === teamAId)) {
      setTeamAId('');
      setPlayerAId('');
    }

    if (teamBId && !teamOptions.some(team => team.id === teamBId)) {
      setTeamBId('');
      setPlayerBId('');
    }
  }, [dbStatus, teamOptions, teamAId, teamBId]);

  useEffect(() => {
    if (playerAId && !filteredPlayersA.some((p, idx) => getSafeId(p, idx) === playerAId)) setPlayerAId('');
  }, [playerAId, filteredPlayersA]);

  useEffect(() => {
    if (playerBId && !filteredPlayersB.some((p, idx) => getSafeId(p, idx) === playerBId)) setPlayerBId('');
  }, [playerBId, filteredPlayersB]);

  useEffect(() => {
    writePanelCache({
      teamAId,
      teamBId,
      playerAId,
      playerBId,
      presetKey,
      formData
    });
  }, [
    teamAId,
    teamBId,
    playerAId,
    playerBId,
    presetKey,
    formData
  ]);

  const selectedPlayerA = useMemo(
    () => playerPool.find((p, idx) => getSafeId(p, idx) === playerAId) || null,
    [playerPool, playerAId]
  );

  const selectedPlayerB = useMemo(
    () => playerPool.find((p, idx) => getSafeId(p, idx) === playerBId) || null,
    [playerPool, playerBId]
  );

  const applyPlayersToForm = (pA, pB) => {
    const preset = getComparisonPreset(pA, pB);
    setPresetKey(preset.key);

    setFormData(prev => ({
      ...prev,
      nameA: pA ? getDisplayName(pA) : prev.nameA,
      teamA: pA?.team_short_name || prev.teamA,
      nameB: pB ? getDisplayName(pB) : prev.nameB,
      teamB: pB?.team_short_name || prev.teamB,
      metrics: preset.metrics.map(metric => ({
        label: metric.label,
        a: pA ? toNum(pA[metric.key]).toFixed(metric.dec) : '',
        b: pB ? toNum(pB[metric.key]).toFixed(metric.dec) : ''
      }))
    }));
  };

  useEffect(() => {
    if (!selectedPlayerA && !selectedPlayerB) return;
    applyPlayersToForm(selectedPlayerA, selectedPlayerB);
  }, [selectedPlayerA, selectedPlayerB]);

  const autoFillByRole = role => {
    const sortKey = getRoleSortKey(role);

    if (teamAId && teamBId) {
      const left = filteredPlayersA
        .filter(p => roleMatches(p?.role, role))
        .sort((a, b) => toNum(b[sortKey]) - toNum(a[sortKey]))[0];

      const right = filteredPlayersB
        .filter(p => roleMatches(p?.role, role))
        .sort((a, b) => toNum(b[sortKey]) - toNum(a[sortKey]))[0];

      if (left) setPlayerAId(getSafeId(left, 0));
      if (right) setPlayerBId(getSafeId(right, 0));
      return;
    }

    const pool = playerPool
      .filter(p => roleMatches(p?.role, role))
      .sort((a, b) => toNum(b[sortKey]) - toNum(a[sortKey]));

    if (pool[0]) {
      setPlayerAId(getSafeId(pool[0], 0));
      setTeamAId(getPlayerTeamId(pool[0]));
    }

    if (pool[1]) {
      setPlayerBId(getSafeId(pool[1], 1));
      setTeamBId(getPlayerTeamId(pool[1]));
    }
  };

  const swapSides = () => {
    setFormData(prev => ({
      ...prev,
      nameA: prev.nameB,
      teamA: prev.teamB,
      nameB: prev.nameA,
      teamB: prev.teamA,
      metrics: prev.metrics.map(row => ({
        ...row,
        a: row.b,
        b: row.a
      }))
    }));

    setTeamAId(teamBId);
    setTeamBId(teamAId);
    setPlayerAId(playerBId);
    setPlayerBId(playerAId);
  };

  const updateMetric = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      metrics: prev.metrics.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    }));
  };

  const handleTake = () => {
    const rawHeroA = selectedPlayerA?.most_played_hero || (Array.isArray(selectedPlayerA?.top_3_heroes) ? selectedPlayerA.top_3_heroes[0] : '');
    const rawHeroB = selectedPlayerB?.most_played_hero || (Array.isArray(selectedPlayerB?.top_3_heroes) ? selectedPlayerB.top_3_heroes[0] : '');

    const heroA = formatHeroFileName(rawHeroA);
    const heroB = formatHeroFileName(rawHeroB);

    const payload = {
      teamAId,
      teamBId,
      playerAId,
      playerBId,
      presetKey,
      nameA: formData.nameA,
      teamA: formData.teamA,
      nameB: formData.nameB,
      teamB: formData.teamB,
      battletagA: selectedPlayerA ? getBattleTag(selectedPlayerA) : '',
      battletagB: selectedPlayerB ? getBattleTag(selectedPlayerB) : '',
      heroA,
      heroB,
      roleA: selectedPlayerA?.role || 'FLEX',
      roleB: selectedPlayerB?.role || 'FLEX',
      metrics: formData.metrics,
      autoMatchTeams: {
        teamA: detectedMatchTeams.teamA?.short || '',
        teamB: detectedMatchTeams.teamB?.short || '',
        rawTeamA: detectedMatchTeams.rawTeamA || '',
        rawTeamB: detectedMatchTeams.rawTeamB || ''
      },
      stat1Label: formData.metrics[0]?.label || '',
      stat1A: formData.metrics[0]?.a || '',
      stat1B: formData.metrics[0]?.b || '',
      stat2Label: formData.metrics[1]?.label || '',
      stat2A: formData.metrics[1]?.a || '',
      stat2B: formData.metrics[1]?.b || '',
      stat3Label: formData.metrics[2]?.label || '',
      stat3A: formData.metrics[2]?.a || '',
      stat3B: formData.metrics[2]?.b || '',
      stat4Label: formData.metrics[3]?.label || '',
      stat4A: formData.metrics[3]?.a || '',
      stat4B: formData.metrics[3]?.b || '',
      stat5Label: formData.metrics[4]?.label || '',
      stat5A: formData.metrics[4]?.a || '',
      stat5B: formData.metrics[4]?.b || ''
    };

    updateWithHistory('Set Player Comparison Data', {
      ...matchData,
      playerComparisonData: payload,
      dataGraphics: {
        type: 'PLAYER_COMPARISON',
        payload
      }
    });

    setPreviewScene?.('H2H_SCENE');

    window.setTimeout(() => {
      takeScene?.('H2H_SCENE');
    }, 0);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: is1080Compact ? '1fr' : '360px minmax(0,1fr)', gap: 10, alignItems: 'start' }}>
      <ShellPanel title="自动填充" accent density={density} bodyStyle={{ padding: t.panelPadding }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <div style={labelStyle}>左侧队伍</div>
              <select
                style={{ ...UI.select, height: rowH, color: COLORS.yellow }}
                value={teamAId}
                onChange={e => setTeamAId(e.target.value)}
                disabled={dbStatus !== 'LOADED'}
              >
                <option value="">-- 先选队伍 A --</option>
                {teamOptions.map(team => (
                  <option key={`TA_${team.id || team.short}`} value={team.id}>
                    {team.playoff ? '★ ' : ''}{team.short}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div style={labelStyle}>右侧队伍</div>
              <select
                style={{ ...UI.select, height: rowH, color: COLORS.yellow }}
                value={teamBId}
                onChange={e => setTeamBId(e.target.value)}
                disabled={dbStatus !== 'LOADED'}
              >
                <option value="">-- 先选队伍 B --</option>
                {teamOptions.map(team => (
                  <option key={`TB_${team.id || team.short}`} value={team.id}>
                    {team.playoff ? '★ ' : ''}{team.short}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button style={UI.chip(presetKey === 'TANK')} onClick={() => autoFillByRole('TANK')}>坦位对位</button>
            <button style={UI.chip(presetKey === 'DPS')} onClick={() => autoFillByRole('DPS')}>输出对位</button>
            <button style={UI.chip(presetKey === 'SUP')} onClick={() => autoFillByRole('SUP')}>辅助对位</button>
            <button style={UI.chip(false)} onClick={swapSides}>交换左右</button>
          </div>

          <div>
            <div style={labelStyle}>左侧选手</div>
            <select
              style={{ ...UI.select, height: rowH, color: COLORS.yellow }}
              value={playerAId}
              onChange={e => setPlayerAId(e.target.value)}
              disabled={dbStatus !== 'LOADED'}
            >
              <option value="">-- 再选选手 A --</option>
              {filteredPlayersA.map((p, idx) => (
                <option key={`A_${getSafeId(p, idx)}`} value={getSafeId(p, idx)}>
                  {formatPlayerOptionLabel(p)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={labelStyle}>右侧选手</div>
            <select
              style={{ ...UI.select, height: rowH, color: COLORS.yellow }}
              value={playerBId}
              onChange={e => setPlayerBId(e.target.value)}
              disabled={dbStatus !== 'LOADED'}
            >
              <option value="">-- 再选选手 B --</option>
              {filteredPlayersB.map((p, idx) => (
                <option key={`B_${getSafeId(p, idx)}`} value={getSafeId(p, idx)}>
                  {formatPlayerOptionLabel(p)}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={compactCardStyle}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.46)', fontWeight: 800 }}>左侧来源</div>
              <div style={{ fontSize: 16, color: COLORS.white, fontWeight: 900, lineHeight: 1.1, wordBreak: 'break-word' }}>
                {getDisplayName(selectedPlayerA) || '待选择'}
              </div>
              <div style={{ fontSize: 11, color: COLORS.yellow, fontWeight: 800 }}>
                {selectedPlayerA ? `${selectedPlayerA.team_short_name || '-'} · ${selectedPlayerA.role || '-'}` : '-'}
              </div>
              {!!getBattleTag(selectedPlayerA) && getBattleTag(selectedPlayerA) !== getDisplayName(selectedPlayerA) && (
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.58)', fontWeight: 700 }}>
                  {getBattleTag(selectedPlayerA)}
                </div>
              )}
            </div>

            <div style={compactCardStyle}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.46)', fontWeight: 800 }}>右侧来源</div>
              <div style={{ fontSize: 16, color: COLORS.white, fontWeight: 900, lineHeight: 1.1, wordBreak: 'break-word' }}>
                {getDisplayName(selectedPlayerB) || '待选择'}
              </div>
              <div style={{ fontSize: 11, color: COLORS.yellow, fontWeight: 800 }}>
                {selectedPlayerB ? `${selectedPlayerB.team_short_name || '-'} · ${selectedPlayerB.role || '-'}` : '-'}
              </div>
              {!!getBattleTag(selectedPlayerB) && getBattleTag(selectedPlayerB) !== getDisplayName(selectedPlayerB) && (
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.58)', fontWeight: 700 }}>
                  {getBattleTag(selectedPlayerB)}
                </div>
              )}
            </div>
          </div>
        </div>
      </ShellPanel>

      <ShellPanel title="手动覆写与预览" accent density={density} bodyStyle={{ padding: t.panelPadding }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
          <div style={liveEditorStyle}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1fr', gap: 8, alignItems: 'center' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 800 }}>左侧姓名</div>
                <input
                  style={{ ...UI.input, height: 44, fontSize: 18, textAlign: 'left', padding: '0 12px' }}
                  value={formData.nameA}
                  onChange={e => setFormData({ ...formData, nameA: e.target.value })}
                  placeholder="左侧姓名"
                />
                <input
                  style={{ ...UI.input, height: 30, fontSize: 12, textAlign: 'left', padding: '0 12px', color: COLORS.yellow, marginTop: 6 }}
                  value={formData.teamA}
                  onChange={e => setFormData({ ...formData, teamA: e.target.value })}
                  placeholder="左侧队伍"
                />
              </div>

              <div style={{ textAlign: 'center', color: COLORS.yellow, fontWeight: 900, fontSize: 18 }}>VS</div>

              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 800, textAlign: 'right' }}>右侧姓名</div>
                <input
                  style={{ ...UI.input, height: 44, fontSize: 18, textAlign: 'right', padding: '0 12px' }}
                  value={formData.nameB}
                  onChange={e => setFormData({ ...formData, nameB: e.target.value })}
                  placeholder="右侧姓名"
                />
                <input
                  style={{ ...UI.input, height: 30, fontSize: 12, textAlign: 'right', padding: '0 12px', color: COLORS.yellow, marginTop: 6 }}
                  value={formData.teamB}
                  onChange={e => setFormData({ ...formData, teamB: e.target.value })}
                  placeholder="右侧队伍"
                />
              </div>
            </div>

            {formData.metrics.map((row, idx) => (
              <div key={`row_${idx}`} style={{ display: 'grid', gridTemplateColumns: '1fr 180px 1fr', gap: 4 }}>
                <input
                  style={{ ...UI.input, height: rowH, color: COLORS.yellow }}
                  value={row.a}
                  onChange={e => updateMetric(idx, 'a', e.target.value)}
                />
                <input
                  style={{ ...UI.input, height: rowH, fontSize: 11, backgroundColor: 'rgba(255,255,255,0.05)' }}
                  value={row.label}
                  onChange={e => updateMetric(idx, 'label', e.target.value)}
                />
                <input
                  style={{ ...UI.input, height: rowH, color: COLORS.yellow }}
                  value={row.b}
                  onChange={e => updateMetric(idx, 'b', e.target.value)}
                />
              </div>
            ))}
          </div>

          <button
            style={{
              ...UI.btn,
              height: 44,
              backgroundColor: COLORS.yellow,
              color: COLORS.black,
              fontWeight: 900,
              letterSpacing: '1px',
              fontSize: 13
            }}
            onClick={handleTake}
          >
            推送对位图文
          </button>
        </div>
      </ShellPanel>
    </div>
  );
}