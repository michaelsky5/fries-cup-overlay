import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMatchContext } from '../../../contexts/MatchContext';
import { ShellPanel } from '../../common/SharedUI';
import { COLORS, labelStyle } from '../../../constants/styles';

const TEAM_LOGO_MODULES = import.meta.glob('../../../assets/logos/*.{png,jpg,jpeg,webp,svg}', {
  eager: true,
  import: 'default'
});

const normalizeLogoKey = value =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\.(png|jpg|jpeg|webp|svg)$/i, '')
    .replace(/[^a-z0-9]/g, '');

const TEAM_LOGO_BY_KEY = Object.entries(TEAM_LOGO_MODULES).reduce((acc, [path, url]) => {
  const filename = path.split('/').pop() || '';
  const key = normalizeLogoKey(filename);
  if (key) acc[key] = url;
  return acc;
}, {});

const getTeamLogoFromAssets = teamShort => {
  const key = normalizeLogoKey(teamShort);
  return key ? TEAM_LOGO_BY_KEY[key] || '' : '';
};

const PLAYOFF_TEAMS = ['NGP', 'TNS', 'YOU', 'ZS', 'HYW', 'SPC', 'XCFN.G', 'FG'];
const PLAYOFF_TEAM_SET = new Set(PLAYOFF_TEAMS.map(v => String(v).trim().toUpperCase()));
const TEAM_COMPARISON_CACHE_KEY = 'FCUP_DATA_GRAPHICS_TEAM_COMPARISON_PANEL_V1';

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
    padding: '0 6px',
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
const toNum = v => (Number.isFinite(Number(v)) ? Number(v) : 0);
const toText = v => (v === null || v === undefined ? '' : String(v));
const cleanText = v => toText(v).trim();
const normalizeCompareKey = v => cleanText(v).toLowerCase();
const normalizeShort = v => cleanText(v).toUpperCase();

const isUnknownName = v => {
  const text = cleanText(v).toLowerCase();
  return !text || text === 'unknown' || text === 'unknown team' || text === 'team unknown';
};

const ROLE_SLOTS = { TANK: 1, DPS: 2, SUP: 2 };
const TC_I18N = 'dataGraphicsPanels.teamComparison';

const OUTPUT_CATEGORIES = [
  { key: 'OVERALL', labelKey: `${TC_I18N}.outputCategories.overall` },
  { key: 'TANK', labelKey: `${TC_I18N}.outputCategories.tank` },
  { key: 'DPS', labelKey: `${TC_I18N}.outputCategories.dps` },
  { key: 'SUP', labelKey: `${TC_I18N}.outputCategories.sup` }
];

const ROLE_SECTIONS = [
  { key: 'TANK', titleKey: `${TC_I18N}.roles.tank`, summaryKey: `${TC_I18N}.roles.tankSummary` },
  { key: 'DPS', titleKey: `${TC_I18N}.roles.dps`, summaryKey: `${TC_I18N}.roles.dpsSummary` },
  { key: 'SUP', titleKey: `${TC_I18N}.roles.sup`, summaryKey: `${TC_I18N}.roles.supSummary` }
];

const tc = (tr, key, options) => tr(`${TC_I18N}.${key}`, options);

function readPanelCache() {
  try {
    const raw = localStorage.getItem(TEAM_COMPARISON_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writePanelCache(payload) {
  try {
    localStorage.setItem(TEAM_COMPARISON_CACHE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('[SYS_WARN] TeamComparison cache write failed:', err);
  }
}

function pickTeamValue(value) {
  if (!value) return '';
  if (typeof value === 'string' || typeof value === 'number') return cleanText(value);

  return cleanText(
    value.team_short_name ||
    value.teamShortName ||
    value.teamShort ||
    value.shortName ||
    value.short ||
    value.abbr ||
    value.code ||
    value.tag ||
    value.id ||
    value.team_id ||
    value.teamId ||
    value.team_name ||
    value.teamName ||
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

function teamMatchesRef(team, ref) {
  const raw = pickTeamValue(ref);
  if (!raw || !team) return false;

  const target = normalizeCompareKey(raw);
  return [
    team.teamId,
    team.teamName,
    team.teamShort,
    team.nameA,
    team.shortA
  ].some(value => normalizeCompareKey(value) === target);
}

function teamMatchesRefSet(team, refSet) {
  if (!team || !refSet?.size) return false;

  return [
    team.teamId,
    team.teamName,
    team.teamShort
  ].some(value => refSet.has(normalizeShort(value)));
}

function findTeamByRef(teamPool, ref) {
  return teamPool.find(team => teamMatchesRef(team, ref)) || null;
}

function normalizeRole(role) {
  const r = cleanText(role).toUpperCase();
  if (r === 'SUPPORT' || r === 'SUP') return 'SUP';
  if (r === 'DAMAGE' || r === 'DPS') return 'DPS';
  if (r === 'TANK') return 'TANK';
  return '';
}

function getEntityTeamId(entity) {
  return cleanText(entity?.team_id || entity?.teamId || entity?.id || '');
}

function getEntityTeamShort(entity) {
  return cleanText(
    entity?.team_short_name ||
    entity?.teamShortName ||
    entity?.teamShort ||
    entity?.shortName ||
    entity?.short ||
    entity?.abbr ||
    entity?.tag ||
    ''
  );
}

function getEntityTeamName(entity) {
  const candidates = [
    entity?.team_name,
    entity?.teamName,
    entity?.team_full_name,
    entity?.teamFullName,
    entity?.full_name,
    entity?.fullName,
    entity?.name,
    entity?.team_club,
    entity?.teamClub,
    entity?.clubName,
    entity?.club_name
  ];

  return cleanText(candidates.find(v => !isUnknownName(v)) || '');
}

function buildTeamRegistry(teams = []) {
  const byId = new Map();
  const byShort = new Map();

  safeArr(teams).forEach(team => {
    const teamId = getEntityTeamId(team);
    const teamShort = getEntityTeamShort(team);
    const teamName = getEntityTeamName(team);

    if (!teamId && !teamShort) return;

    const meta = {
      teamId: teamId || teamShort,
      teamName: teamName || teamShort || teamId,
      teamShort: teamShort || teamName || teamId,
      teamLogo: getTeamLogoFromAssets(teamShort) || cleanText(team?.team_logo || team?.teamLogo || team?.logo || '')
    };

    if (meta.teamId) byId.set(meta.teamId, meta);
    if (meta.teamShort) byShort.set(meta.teamShort.toUpperCase(), meta);
  });

  return { byId, byShort };
}

function resolveTeamMeta(entity, registry) {
  const rawId = getEntityTeamId(entity);
  const rawShort = getEntityTeamShort(entity);
  const rawName = getEntityTeamName(entity);

  const officialById = rawId ? registry.byId.get(rawId) : null;
  const officialByShort = rawShort ? registry.byShort.get(rawShort.toUpperCase()) : null;
  const official = officialById || officialByShort || null;

  const teamId = official?.teamId || rawId || rawShort || rawName;
  const teamShort = official?.teamShort || rawShort || rawId || rawName;
  const teamName = official?.teamName || rawName || rawShort || rawId;

  return {
    teamId: cleanText(teamId),
    teamName: cleanText(teamName),
    teamShort: cleanText(teamShort),
    teamLogo: getTeamLogoFromAssets(teamShort) || cleanText(official?.teamLogo || entity?.team_logo || entity?.teamLogo || entity?.logo || '')
  };
}

function getMapKeyFromLog(log, idx) {
  const matchId = log?.matchId || log?.match_id || log?.rawMatchId || log?.raw_match_id || log?.matchDisplayName || log?.match_display_name || 'MATCH';
  const mapOrder = log?.mapOrder ?? log?.map_order ?? idx;
  return `${matchId}__${mapOrder}`;
}

function getPlayerLogs(player) {
  if (Array.isArray(player?.match_logs) && player.match_logs.length) return player.match_logs;
  return [...safeArr(player?.live_match_logs), ...safeArr(player?.historical_match_logs)];
}

function formatTimePlayed(rawTimeMins) {
  const mins = Math.round(Number(rawTimeMins || 0));
  if (!mins) return '-';
  if (mins < 60) return `${mins}m`;

  const h = Math.floor(mins / 60);
  const m = mins % 60;

  if (!m) return `${h}h`;
  return `${h}h ${m}m`;
}

function emptyTotals() {
  return {
    elims: 0,
    assists: 0,
    deaths: 0,
    damage: 0,
    healing: 0,
    mitigation: 0
  };
}

function addTotals(target, source) {
  target.elims += toNum(source?.elims);
  target.assists += toNum(source?.assists);
  target.deaths += toNum(source?.deaths);
  target.damage += toNum(source?.damage);
  target.healing += toNum(source?.healing);
  target.mitigation += toNum(source?.mitigation);
}

function per10(total, rawPlayerMinutes, slotCount) {
  if (!rawPlayerMinutes || !slotCount) return '0.0';
  return ((toNum(total) / rawPlayerMinutes) * slotCount * 10).toFixed(1);
}

function createMetricRow(label, a = '0.0', b = '0.0') {
  return { label, a: toText(a), b: toText(b) };
}

function getDefaultOverallMetrics(tr) {
  return [
    createMetricRow(tc(tr, 'metrics.overallElimsPer10')),
    createMetricRow(tc(tr, 'metrics.overallAssistsPer10')),
    createMetricRow(tc(tr, 'metrics.overallDeathsPer10')),
    createMetricRow(tc(tr, 'metrics.overallDamagePer10')),
    createMetricRow(tc(tr, 'metrics.overallHealingPer10')),
    createMetricRow(tc(tr, 'metrics.overallMitigationPer10'))
  ];
}

function getDefaultRoleMetricRows(tr) {
  return [
    createMetricRow(tc(tr, 'metrics.elimsPer10')),
    createMetricRow(tc(tr, 'metrics.assistsPer10')),
    createMetricRow(tc(tr, 'metrics.deathsPer10')),
    createMetricRow(tc(tr, 'metrics.damagePer10')),
    createMetricRow(tc(tr, 'metrics.healingPer10')),
    createMetricRow(tc(tr, 'metrics.mitigationPer10'))
  ];
}

function getDefaultRoleMetrics(tr) {
  return {
    TANK: getDefaultRoleMetricRows(tr),
    DPS: getDefaultRoleMetricRows(tr),
    SUP: getDefaultRoleMetricRows(tr)
  };
}

function relabelRows(currentRows, defaultRows) {
  return defaultRows.map((row, idx) => ({
    ...row,
    a: safeArr(currentRows)[idx]?.a ?? row.a,
    b: safeArr(currentRows)[idx]?.b ?? row.b
  }));
}

function relabelRoleMetrics(currentRoleMetrics, defaultRoleMetrics) {
  return {
    TANK: relabelRows(currentRoleMetrics?.TANK, defaultRoleMetrics.TANK),
    DPS: relabelRows(currentRoleMetrics?.DPS, defaultRoleMetrics.DPS),
    SUP: relabelRows(currentRoleMetrics?.SUP, defaultRoleMetrics.SUP)
  };
}

function createTeamRow(meta) {
  const teamId = cleanText(meta?.teamId || meta?.team_id || meta?.id || meta?.teamShort || meta?.team_short_name);
  const teamShort = cleanText(meta?.teamShort || meta?.team_short_name || meta?.short || meta?.teamName || meta?.team_name);
  const teamName = cleanText(meta?.teamName || meta?.team_name || meta?.name || teamShort || teamId);

  return {
    teamId,
    teamName,
    teamShort,
    teamLogo: cleanText(meta?.teamLogo || meta?.team_logo || ''),
    mapsSet: new Set(),
    overallRawPlayerMinutes: 0,
    overallTotals: emptyTotals(),
    roleBuckets: {
      TANK: { rawPlayerMinutes: 0, totals: emptyTotals() },
      DPS: { rawPlayerMinutes: 0, totals: emptyTotals() },
      SUP: { rawPlayerMinutes: 0, totals: emptyTotals() }
    }
  };
}

function mergeTeamIdentity(teamRow, meta) {
  if (!teamRow || !meta) return;
  if (meta.teamId) teamRow.teamId = meta.teamId;
  if (meta.teamShort) teamRow.teamShort = meta.teamShort;
  if (meta.teamName && !isUnknownName(meta.teamName)) teamRow.teamName = meta.teamName;
  if (meta.teamLogo) teamRow.teamLogo = meta.teamLogo;
}

function finalizeTeamRow(team) {
  const mapsPlayed = team.mapsSet.size;
  const teamEquivalentMinutes = team.overallRawPlayerMinutes > 0 ? team.overallRawPlayerMinutes / 5 : 0;

  return {
    teamId: cleanText(team.teamId),
    teamName: cleanText(team.teamName || team.teamShort || team.teamId),
    teamShort: cleanText(team.teamShort || team.teamName || team.teamId),
    teamLogo: cleanText(team.teamLogo),
    mapsPlayed,
    playTime: formatTimePlayed(teamEquivalentMinutes),
    overall: {
      elimsPer10: per10(team.overallTotals.elims, team.overallRawPlayerMinutes, 5),
      assistsPer10: per10(team.overallTotals.assists, team.overallRawPlayerMinutes, 5),
      deathsPer10: per10(team.overallTotals.deaths, team.overallRawPlayerMinutes, 5),
      damagePer10: per10(team.overallTotals.damage, team.overallRawPlayerMinutes, 5),
      healingPer10: per10(team.overallTotals.healing, team.overallRawPlayerMinutes, 5),
      mitigationPer10: per10(team.overallTotals.mitigation, team.overallRawPlayerMinutes, 5)
    },
    roles: {
      TANK: {
        elimsPer10: per10(team.roleBuckets.TANK.totals.elims, team.roleBuckets.TANK.rawPlayerMinutes, ROLE_SLOTS.TANK),
        assistsPer10: per10(team.roleBuckets.TANK.totals.assists, team.roleBuckets.TANK.rawPlayerMinutes, ROLE_SLOTS.TANK),
        deathsPer10: per10(team.roleBuckets.TANK.totals.deaths, team.roleBuckets.TANK.rawPlayerMinutes, ROLE_SLOTS.TANK),
        damagePer10: per10(team.roleBuckets.TANK.totals.damage, team.roleBuckets.TANK.rawPlayerMinutes, ROLE_SLOTS.TANK),
        healingPer10: per10(team.roleBuckets.TANK.totals.healing, team.roleBuckets.TANK.rawPlayerMinutes, ROLE_SLOTS.TANK),
        mitigationPer10: per10(team.roleBuckets.TANK.totals.mitigation, team.roleBuckets.TANK.rawPlayerMinutes, ROLE_SLOTS.TANK)
      },
      DPS: {
        elimsPer10: per10(team.roleBuckets.DPS.totals.elims, team.roleBuckets.DPS.rawPlayerMinutes, ROLE_SLOTS.DPS),
        assistsPer10: per10(team.roleBuckets.DPS.totals.assists, team.roleBuckets.DPS.rawPlayerMinutes, ROLE_SLOTS.DPS),
        deathsPer10: per10(team.roleBuckets.DPS.totals.deaths, team.roleBuckets.DPS.rawPlayerMinutes, ROLE_SLOTS.DPS),
        damagePer10: per10(team.roleBuckets.DPS.totals.damage, team.roleBuckets.DPS.rawPlayerMinutes, ROLE_SLOTS.DPS),
        healingPer10: per10(team.roleBuckets.DPS.totals.healing, team.roleBuckets.DPS.rawPlayerMinutes, ROLE_SLOTS.DPS),
        mitigationPer10: per10(team.roleBuckets.DPS.totals.mitigation, team.roleBuckets.DPS.rawPlayerMinutes, ROLE_SLOTS.DPS)
      },
      SUP: {
        elimsPer10: per10(team.roleBuckets.SUP.totals.elims, team.roleBuckets.SUP.rawPlayerMinutes, ROLE_SLOTS.SUP),
        assistsPer10: per10(team.roleBuckets.SUP.totals.assists, team.roleBuckets.SUP.rawPlayerMinutes, ROLE_SLOTS.SUP),
        deathsPer10: per10(team.roleBuckets.SUP.totals.deaths, team.roleBuckets.SUP.rawPlayerMinutes, ROLE_SLOTS.SUP),
        damagePer10: per10(team.roleBuckets.SUP.totals.damage, team.roleBuckets.SUP.rawPlayerMinutes, ROLE_SLOTS.SUP),
        healingPer10: per10(team.roleBuckets.SUP.totals.healing, team.roleBuckets.SUP.rawPlayerMinutes, ROLE_SLOTS.SUP),
        mitigationPer10: per10(team.roleBuckets.SUP.totals.mitigation, team.roleBuckets.SUP.rawPlayerMinutes, ROLE_SLOTS.SUP)
      }
    }
  };
}

function buildTeamAnalytics(db, extraTeamSet = new Set()) {
  const teamMap = new Map();
  const registry = buildTeamRegistry(db?.teams);

  safeArr(db?.teams).forEach(team => {
    const meta = resolveTeamMeta(team, registry);
    if (!meta.teamId) return;
    teamMap.set(meta.teamId, createTeamRow(meta));
  });

  safeArr(db?.players).forEach(player => {
    const meta = resolveTeamMeta(player, registry);
    if (!meta.teamId) return;

    if (!teamMap.has(meta.teamId)) teamMap.set(meta.teamId, createTeamRow(meta));

    const teamRow = teamMap.get(meta.teamId);
    mergeTeamIdentity(teamRow, meta);

    const logs = getPlayerLogs(player).filter(log => toNum(log?.playtimeMinutes) > 0);

    logs.forEach((log, idx) => {
      const role = normalizeRole(log?.role || player?.role);
      if (!role || !teamRow.roleBuckets[role]) return;

      const totals = {
        elims: toNum(log?.totals?.elims),
        assists: toNum(log?.totals?.assists),
        deaths: toNum(log?.totals?.deaths),
        damage: toNum(log?.totals?.damage),
        healing: toNum(log?.totals?.healing),
        mitigation: toNum(log?.totals?.blocked ?? log?.totals?.mitigation)
      };

      const minutes = toNum(log?.playtimeMinutes);

      teamRow.mapsSet.add(getMapKeyFromLog(log, idx));
      teamRow.overallRawPlayerMinutes += minutes;
      addTotals(teamRow.overallTotals, totals);

      teamRow.roleBuckets[role].rawPlayerMinutes += minutes;
      addTotals(teamRow.roleBuckets[role].totals, totals);
    });
  });

  const hasLogData = Array.from(teamMap.values()).some(team => team.overallRawPlayerMinutes > 0);

  if (!hasLogData && safeArr(db?.player_totals).length) {
    safeArr(db?.player_totals).forEach((row, idx) => {
      const meta = resolveTeamMeta(row, registry);
      const teamId = meta.teamId || row?.team_id || row?.team_short_name || `team_${idx}`;
      const role = normalizeRole(row?.role);

      if (!role || !ROLE_SLOTS[role]) return;

      if (!teamMap.has(teamId)) teamMap.set(teamId, createTeamRow({ ...meta, teamId }));

      const teamRow = teamMap.get(teamId);
      mergeTeamIdentity(teamRow, meta);

      const minutes = Math.max(1, toNum(row?.raw_time_mins));
      const totals = {
        elims: (toNum(row?.avg_elim) * minutes) / 10,
        assists: (toNum(row?.avg_ast) * minutes) / 10,
        deaths: (toNum(row?.avg_dth) * minutes) / 10,
        damage: (toNum(row?.avg_dmg) * minutes) / 10,
        healing: (toNum(row?.avg_heal) * minutes) / 10,
        mitigation: (toNum(row?.avg_block) * minutes) / 10
      };

      teamRow.mapsSet.add(`${teamId}_${role}_${idx}`);
      teamRow.overallRawPlayerMinutes += minutes;
      addTotals(teamRow.overallTotals, totals);

      teamRow.roleBuckets[role].rawPlayerMinutes += minutes;
      addTotals(teamRow.roleBuckets[role].totals, totals);
    });
  }

  return Array.from(teamMap.values())
    .map(finalizeTeamRow)
    .filter(team => {
      const keys = [team.teamShort, team.teamId, team.teamName].map(normalizeShort).filter(Boolean);
      return keys.some(key => PLAYOFF_TEAM_SET.has(key) || extraTeamSet.has(key));
    })
    .sort((a, b) => cleanText(a.teamShort).localeCompare(cleanText(b.teamShort)));
}

function buildTeamPreset(teamA, teamB, tr, currentMatchData = {}) {
  const roleRows = role => [
    createMetricRow(tc(tr, 'metrics.elimsPer10'), teamA?.roles?.[role]?.elimsPer10 || '0.0', teamB?.roles?.[role]?.elimsPer10 || '0.0'),
    createMetricRow(tc(tr, 'metrics.assistsPer10'), teamA?.roles?.[role]?.assistsPer10 || '0.0', teamB?.roles?.[role]?.assistsPer10 || '0.0'),
    createMetricRow(tc(tr, 'metrics.deathsPer10'), teamA?.roles?.[role]?.deathsPer10 || '0.0', teamB?.roles?.[role]?.deathsPer10 || '0.0'),
    createMetricRow(tc(tr, 'metrics.damagePer10'), teamA?.roles?.[role]?.damagePer10 || '0.0', teamB?.roles?.[role]?.damagePer10 || '0.0'),
    createMetricRow(tc(tr, 'metrics.healingPer10'), teamA?.roles?.[role]?.healingPer10 || '0.0', teamB?.roles?.[role]?.healingPer10 || '0.0'),
    createMetricRow(tc(tr, 'metrics.mitigationPer10'), teamA?.roles?.[role]?.mitigationPer10 || '0.0', teamB?.roles?.[role]?.mitigationPer10 || '0.0')
  ];

  const shortA = teamA?.teamShort || '';
  const shortB = teamB?.teamShort || '';
  const fullNameA = teamA?.teamName || shortA || '';
  const fullNameB = teamB?.teamName || shortB || '';

  const logoA = getTeamLogoFromAssets(shortA) || teamA?.teamLogo || currentMatchData.logoA || '';
  const logoB = getTeamLogoFromAssets(shortB) || teamB?.teamLogo || currentMatchData.logoB || '';

  return {
    nameA: shortA,
    nameB: shortB,

    fullNameA,
    fullNameB,
    teamAName: fullNameA,
    teamBName: fullNameB,
    teamNameA: fullNameA,
    teamNameB: fullNameB,
    teamFullNameA: fullNameA,
    teamFullNameB: fullNameB,

    shortA,
    shortB,
    teamShortA: shortA,
    teamShortB: shortB,

    logoA,
    logoB,
    teamLogoA: logoA,
    teamLogoB: logoB,
    logoPathA: logoA,
    logoPathB: logoB,

    mapsA: String(teamA?.mapsPlayed || 0),
    mapsB: String(teamB?.mapsPlayed || 0),
    timeA: teamA?.playTime || '-',
    timeB: teamB?.playTime || '-',

    overallMetrics: [
      createMetricRow(tc(tr, 'metrics.overallElimsPer10'), teamA?.overall?.elimsPer10 || '0.0', teamB?.overall?.elimsPer10 || '0.0'),
      createMetricRow(tc(tr, 'metrics.overallAssistsPer10'), teamA?.overall?.assistsPer10 || '0.0', teamB?.overall?.assistsPer10 || '0.0'),
      createMetricRow(tc(tr, 'metrics.overallDeathsPer10'), teamA?.overall?.deathsPer10 || '0.0', teamB?.overall?.deathsPer10 || '0.0'),
      createMetricRow(tc(tr, 'metrics.overallDamagePer10'), teamA?.overall?.damagePer10 || '0.0', teamB?.overall?.damagePer10 || '0.0'),
      createMetricRow(tc(tr, 'metrics.overallHealingPer10'), teamA?.overall?.healingPer10 || '0.0', teamB?.overall?.healingPer10 || '0.0'),
      createMetricRow(tc(tr, 'metrics.overallMitigationPer10'), teamA?.overall?.mitigationPer10 || '0.0', teamB?.overall?.mitigationPer10 || '0.0')
    ],

    roleMetrics: {
      TANK: roleRows('TANK'),
      DPS: roleRows('DPS'),
      SUP: roleRows('SUP')
    }
  };
}

function getSafeRoleMetrics(roleMetrics, key) {
  return safeArr(roleMetrics?.[key]);
}

const sourceCardStyle = {
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.025)',
  padding: '10px 12px',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  minHeight: 88
};

const overallCardStyle = {
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.03)',
  padding: '10px',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  minHeight: 90
};

const roleSectionStyle = {
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.025)',
  padding: '10px',
  display: 'flex',
  flexDirection: 'column',
  gap: 8
};

const collapseHeadStyle = {
  width: '100%',
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.03)',
  color: COLORS.white,
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  alignItems: 'center',
  padding: '10px 12px',
  cursor: 'pointer'
};

const sourceTeamNameStyle = {
  fontSize: 13,
  color: COLORS.white,
  fontWeight: 900,
  lineHeight: 1.15,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
};

const sourceTeamShortStyle = {
  fontSize: 18,
  color: COLORS.yellow,
  fontWeight: 900,
  letterSpacing: '0.8px',
  lineHeight: 1
};

export default function TeamComparisonPanel({
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
  const { t: tr, i18n } = useTranslation();
  const { matchData, updateWithHistory, setPreviewScene, takeScene } = useMatchContext();

  const t = densityTokens || { panelPadding: '12px' };
  const rowH = is1080Compact ? '34px' : '38px';
  const initialCache = useMemo(() => readPanelCache(), []);

  const [teamAId, setTeamAId] = useState(initialCache.teamAId || '');
  const [teamBId, setTeamBId] = useState(initialCache.teamBId || '');
  const [activeCategory, setActiveCategory] = useState(initialCache.activeCategory || 'OVERALL');
  const [expandedRoles, setExpandedRoles] = useState(initialCache.expandedRoles || { TANK: false, DPS: false, SUP: false });

  const languageKey = i18n.resolvedLanguage || i18n.language;

  const [formData, setFormData] = useState(() => ({
    nameA: initialCache.formData?.nameA || '',
    nameB: initialCache.formData?.nameB || '',

    fullNameA: initialCache.formData?.fullNameA || '',
    fullNameB: initialCache.formData?.fullNameB || '',
    teamAName: initialCache.formData?.teamAName || '',
    teamBName: initialCache.formData?.teamBName || '',
    teamNameA: initialCache.formData?.teamNameA || '',
    teamNameB: initialCache.formData?.teamNameB || '',
    teamFullNameA: initialCache.formData?.teamFullNameA || '',
    teamFullNameB: initialCache.formData?.teamFullNameB || '',

    shortA: initialCache.formData?.shortA || '',
    shortB: initialCache.formData?.shortB || '',
    teamShortA: initialCache.formData?.teamShortA || '',
    teamShortB: initialCache.formData?.teamShortB || '',

    logoA: initialCache.formData?.logoA || matchData.logoA || '',
    logoB: initialCache.formData?.logoB || matchData.logoB || '',
    teamLogoA: initialCache.formData?.teamLogoA || matchData.logoA || '',
    teamLogoB: initialCache.formData?.teamLogoB || matchData.logoB || '',
    logoPathA: initialCache.formData?.logoPathA || matchData.logoA || '',
    logoPathB: initialCache.formData?.logoPathB || matchData.logoB || '',

    mapsA: initialCache.formData?.mapsA || '0',
    mapsB: initialCache.formData?.mapsB || '0',
    timeA: initialCache.formData?.timeA || '-',
    timeB: initialCache.formData?.timeB || '-',

    overallMetrics: initialCache.formData?.overallMetrics || getDefaultOverallMetrics(tr),
    roleMetrics: initialCache.formData?.roleMetrics || getDefaultRoleMetrics(tr)
  }));

  const autoTeamRefs = useMemo(() => {
    const rawTeamA = preferredTeamA || defaultTeamA || autoTeamA || currentMatchTeams?.teamA || extractSideTeam(matchData, 'A');
    const rawTeamB = preferredTeamB || defaultTeamB || autoTeamB || currentMatchTeams?.teamB || extractSideTeam(matchData, 'B');

    return { rawTeamA, rawTeamB };
  }, [preferredTeamA, preferredTeamB, defaultTeamA, defaultTeamB, autoTeamA, autoTeamB, currentMatchTeams, matchData]);

  const extraTeamSet = useMemo(() => {
    return new Set([autoTeamRefs.rawTeamA, autoTeamRefs.rawTeamB].map(normalizeShort).filter(Boolean));
  }, [autoTeamRefs]);

  const teamPool = useMemo(() => buildTeamAnalytics(db, extraTeamSet), [db, extraTeamSet]);

  const detectedMatchTeams = useMemo(() => {
    const teamA = findTeamByRef(teamPool, autoTeamRefs.rawTeamA);
    const teamB = findTeamByRef(teamPool, autoTeamRefs.rawTeamB);

    return {
      rawTeamA: autoTeamRefs.rawTeamA,
      rawTeamB: autoTeamRefs.rawTeamB,
      teamA,
      teamB,
      hasCurrentMatchTeams: !!teamA?.teamId && !!teamB?.teamId && teamA.teamId !== teamB.teamId
    };
  }, [teamPool, autoTeamRefs]);

  const selectedTeamA = useMemo(() => teamPool.find(t => t.teamId === teamAId) || null, [teamPool, teamAId]);
  const selectedTeamB = useMemo(() => teamPool.find(t => t.teamId === teamBId) || null, [teamPool, teamBId]);

  useEffect(() => {
    if (dbStatus !== 'LOADED' || !detectedMatchTeams.hasCurrentMatchTeams) return;

    setTeamAId(detectedMatchTeams.teamA.teamId);
    setTeamBId(detectedMatchTeams.teamB.teamId);
  }, [dbStatus, detectedMatchTeams.hasCurrentMatchTeams, detectedMatchTeams.teamA?.teamId, detectedMatchTeams.teamB?.teamId]);

  useEffect(() => {
    if (dbStatus !== 'LOADED') return;

    if (teamAId && !teamPool.some(team => team.teamId === teamAId)) setTeamAId('');
    if (teamBId && !teamPool.some(team => team.teamId === teamBId)) setTeamBId('');
  }, [dbStatus, teamPool, teamAId, teamBId]);

  useEffect(() => {
    const defaultOverallMetrics = getDefaultOverallMetrics(tr);
    const defaultRoleMetrics = getDefaultRoleMetrics(tr);

    if (selectedTeamA || selectedTeamB) {
      setFormData(buildTeamPreset(selectedTeamA, selectedTeamB, tr, matchData));
      return;
    }

    setFormData(prev => ({
      ...prev,
      logoA: prev.logoA || matchData.logoA || '',
      logoB: prev.logoB || matchData.logoB || '',
      teamLogoA: prev.teamLogoA || matchData.logoA || '',
      teamLogoB: prev.teamLogoB || matchData.logoB || '',
      logoPathA: prev.logoPathA || matchData.logoA || '',
      logoPathB: prev.logoPathB || matchData.logoB || '',
      overallMetrics: relabelRows(prev.overallMetrics, defaultOverallMetrics),
      roleMetrics: relabelRoleMetrics(prev.roleMetrics, defaultRoleMetrics)
    }));
  }, [selectedTeamA, selectedTeamB, languageKey, tr, matchData.logoA, matchData.logoB]);

  useEffect(() => {
    writePanelCache({
      teamAId,
      teamBId,
      activeCategory,
      expandedRoles,
      formData
    });
  }, [teamAId, teamBId, activeCategory, expandedRoles, formData]);

  const autoTopTwo = () => {
    const sorted = [...teamPool].sort(
      (a, b) => parseFloat(b?.overall?.damagePer10 || 0) - parseFloat(a?.overall?.damagePer10 || 0)
    );

    if (sorted[0]) setTeamAId(sorted[0].teamId);
    if (sorted[1]) setTeamBId(sorted[1].teamId);
  };

  const applyCurrentMatchTeams = () => {
    if (!detectedMatchTeams.hasCurrentMatchTeams) return;
    setTeamAId(detectedMatchTeams.teamA.teamId);
    setTeamBId(detectedMatchTeams.teamB.teamId);
  };

  const swapSides = () => {
    setFormData(prev => ({
      ...prev,

      nameA: prev.nameB,
      nameB: prev.nameA,

      fullNameA: prev.fullNameB,
      fullNameB: prev.fullNameA,
      teamAName: prev.teamBName,
      teamBName: prev.teamAName,
      teamNameA: prev.teamNameB,
      teamNameB: prev.teamNameA,
      teamFullNameA: prev.teamFullNameB,
      teamFullNameB: prev.teamFullNameA,

      shortA: prev.shortB,
      shortB: prev.shortA,
      teamShortA: prev.teamShortB,
      teamShortB: prev.teamShortA,

      logoA: prev.logoB,
      logoB: prev.logoA,
      teamLogoA: prev.teamLogoB,
      teamLogoB: prev.teamLogoA,
      logoPathA: prev.logoPathB,
      logoPathB: prev.logoPathA,

      mapsA: prev.mapsB,
      mapsB: prev.mapsA,
      timeA: prev.timeB,
      timeB: prev.timeA,

      overallMetrics: safeArr(prev.overallMetrics).map(row => ({ ...row, a: row.b, b: row.a })),
      roleMetrics: {
        TANK: getSafeRoleMetrics(prev.roleMetrics, 'TANK').map(row => ({ ...row, a: row.b, b: row.a })),
        DPS: getSafeRoleMetrics(prev.roleMetrics, 'DPS').map(row => ({ ...row, a: row.b, b: row.a })),
        SUP: getSafeRoleMetrics(prev.roleMetrics, 'SUP').map(row => ({ ...row, a: row.b, b: row.a }))
      }
    }));

    setTeamAId(teamBId);
    setTeamBId(teamAId);
  };

  const updateOverallMetric = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      overallMetrics: safeArr(prev.overallMetrics).map((row, i) => (i === index ? { ...row, [field]: value } : row))
    }));
  };

  const updateRoleMetric = (role, index, field, value) => {
    setFormData(prev => ({
      ...prev,
      roleMetrics: {
        ...prev.roleMetrics,
        [role]: getSafeRoleMetrics(prev.roleMetrics, role).map((row, i) => (i === index ? { ...row, [field]: value } : row))
      }
    }));
  };

  const toggleRole = role => {
    setExpandedRoles(prev => ({ ...prev, [role]: !prev[role] }));
  };

  const handleTake = () => {
    const overallRows = safeArr(formData.overallMetrics);

    const payload = {
      teamAId,
      teamBId,
      activeCategory,
      scenePage: activeCategory,
      outputCategory: activeCategory,
      category: activeCategory,

      ...formData,

      nameA: formData.nameA || formData.teamShortA || '',
      nameB: formData.nameB || formData.teamShortB || '',

      shortA: formData.shortA || formData.nameA || '',
      shortB: formData.shortB || formData.nameB || '',
      teamShortA: formData.teamShortA || formData.shortA || formData.nameA || '',
      teamShortB: formData.teamShortB || formData.shortB || formData.nameB || '',

      fullNameA: formData.fullNameA || formData.teamAName || formData.nameA || '',
      fullNameB: formData.fullNameB || formData.teamBName || formData.nameB || '',
      teamAName: formData.teamAName || formData.fullNameA || formData.nameA || '',
      teamBName: formData.teamBName || formData.fullNameB || formData.nameB || '',
      teamNameA: formData.teamNameA || formData.fullNameA || formData.nameA || '',
      teamNameB: formData.teamNameB || formData.fullNameB || formData.nameB || '',
      teamFullNameA: formData.teamFullNameA || formData.fullNameA || formData.nameA || '',
      teamFullNameB: formData.teamFullNameB || formData.fullNameB || formData.nameB || '',

      logoA: formData.logoA || matchData.logoA || '',
      logoB: formData.logoB || matchData.logoB || '',
      teamLogoA: formData.teamLogoA || formData.logoA || matchData.logoA || '',
      teamLogoB: formData.teamLogoB || formData.logoB || matchData.logoB || '',
      logoPathA: formData.logoPathA || formData.logoA || matchData.logoA || '',
      logoPathB: formData.logoPathB || formData.logoB || matchData.logoB || '',

      autoMatchTeams: {
        teamA: detectedMatchTeams.teamA?.teamShort || '',
        teamB: detectedMatchTeams.teamB?.teamShort || '',
        rawTeamA: detectedMatchTeams.rawTeamA || '',
        rawTeamB: detectedMatchTeams.rawTeamB || ''
      },

      stat1Label: overallRows[0]?.label || '',
      stat1A: overallRows[0]?.a || '',
      stat1B: overallRows[0]?.b || '',
      stat2Label: overallRows[1]?.label || '',
      stat2A: overallRows[1]?.a || '',
      stat2B: overallRows[1]?.b || '',
      stat3Label: overallRows[2]?.label || '',
      stat3A: overallRows[2]?.a || '',
      stat3B: overallRows[2]?.b || '',
      stat4Label: overallRows[3]?.label || '',
      stat4A: overallRows[3]?.a || '',
      stat4B: overallRows[3]?.b || '',
      stat5Label: overallRows[4]?.label || '',
      stat5A: overallRows[4]?.a || '',
      stat5B: overallRows[4]?.b || '',
      stat6Label: overallRows[5]?.label || '',
      stat6A: overallRows[5]?.a || '',
      stat6B: overallRows[5]?.b || ''
    };

    updateWithHistory('Set Team Comparison Data', {
      ...matchData,
      teamComparisonData: payload,
      dataGraphics: {
        type: 'TEAM_COMPARISON',
        payload
      }
    });

    setPreviewScene?.('TEAM_COMPARISON_SCENE');

    window.setTimeout(() => {
      takeScene?.('TEAM_COMPARISON_SCENE');
    }, 0);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: is1080Compact ? '1fr' : '360px minmax(0,1fr)', gap: 10, alignItems: 'start' }}>
      <ShellPanel title={tc(tr, 'panels.autoFill')} accent density={density} bodyStyle={{ padding: t.panelPadding }}>
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
              AUTO MATCH TEAMS · {detectedMatchTeams.teamA.teamShort} VS {detectedMatchTeams.teamB.teamShort}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: detectedMatchTeams.hasCurrentMatchTeams ? '1fr 1fr' : '1fr 1fr', gap: 8 }}>
            <button style={UI.chip(false)} onClick={detectedMatchTeams.hasCurrentMatchTeams ? applyCurrentMatchTeams : autoTopTwo}>
              {detectedMatchTeams.hasCurrentMatchTeams ? '当前比赛双方' : tc(tr, 'actions.autoTopTwo')}
            </button>
            <button style={UI.chip(false)} onClick={swapSides}>
              {tc(tr, 'actions.swapSides')}
            </button>
          </div>

          <div>
            <div style={labelStyle}>{tc(tr, 'outputCategory')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 6 }}>
              {OUTPUT_CATEGORIES.map(item => (
                <button
                  key={item.key}
                  type="button"
                  style={{ ...UI.chip(activeCategory === item.key), minHeight: 42, padding: '0 6px' }}
                  onClick={() => setActiveCategory(item.key)}
                >
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 2, lineHeight: 1.05 }}>
                    <span>{tr(item.labelKey)}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={labelStyle}>{tc(tr, 'labels.leftTeam')}</div>
            <select
              style={{ ...UI.select, height: rowH, color: COLORS.yellow }}
              value={teamAId}
              onChange={e => setTeamAId(e.target.value)}
              disabled={dbStatus !== 'LOADED'}
            >
              <option value="">{tc(tr, 'placeholders.selectTeamA')}</option>
              {teamPool.map(team => (
                <option key={`TA_${team.teamId}`} value={team.teamId}>
                  {teamMatchesRefSet(team, extraTeamSet) ? '★ ' : ''}{team.teamShort ? `${team.teamShort} · ${team.teamName}` : team.teamName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={labelStyle}>{tc(tr, 'labels.rightTeam')}</div>
            <select
              style={{ ...UI.select, height: rowH, color: COLORS.yellow }}
              value={teamBId}
              onChange={e => setTeamBId(e.target.value)}
              disabled={dbStatus !== 'LOADED'}
            >
              <option value="">{tc(tr, 'placeholders.selectTeamB')}</option>
              {teamPool.map(team => (
                <option key={`TB_${team.teamId}`} value={team.teamId}>
                  {teamMatchesRefSet(team, extraTeamSet) ? '★ ' : ''}{team.teamShort ? `${team.teamShort} · ${team.teamName}` : team.teamName}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={sourceCardStyle}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.46)', fontWeight: 800 }}>
                {tc(tr, 'labels.leftSource')}
              </div>
              <div style={sourceTeamShortStyle}>
                {selectedTeamA?.teamShort || tc(tr, 'source.pending')}
              </div>
              <div style={sourceTeamNameStyle} title={selectedTeamA?.teamName || ''}>
                {selectedTeamA?.teamName || '-'}
              </div>
              <div style={{ fontSize: 11, color: COLORS.yellow, fontWeight: 800 }}>
                {selectedTeamA ? tc(tr, 'source.mapsAndTime', { maps: selectedTeamA.mapsPlayed, time: selectedTeamA.playTime }) : '-'}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.56)', fontWeight: 700 }}>
                {selectedTeamA ? tc(tr, 'source.teamDamagePer10', { value: selectedTeamA.overall.damagePer10 }) : tc(tr, 'source.noData')}
              </div>
            </div>

            <div style={sourceCardStyle}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.46)', fontWeight: 800 }}>
                {tc(tr, 'labels.rightSource')}
              </div>
              <div style={sourceTeamShortStyle}>
                {selectedTeamB?.teamShort || tc(tr, 'source.pending')}
              </div>
              <div style={sourceTeamNameStyle} title={selectedTeamB?.teamName || ''}>
                {selectedTeamB?.teamName || '-'}
              </div>
              <div style={{ fontSize: 11, color: COLORS.yellow, fontWeight: 800 }}>
                {selectedTeamB ? tc(tr, 'source.mapsAndTime', { maps: selectedTeamB.mapsPlayed, time: selectedTeamB.playTime }) : '-'}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.56)', fontWeight: 700 }}>
                {selectedTeamB ? tc(tr, 'source.teamDamagePer10', { value: selectedTeamB.overall.damagePer10 }) : tc(tr, 'source.noData')}
              </div>
            </div>
          </div>
        </div>
      </ShellPanel>

      <ShellPanel title={tc(tr, 'panels.dataEditor')} accent density={density} bodyStyle={{ padding: t.panelPadding }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: COLORS.yellow, letterSpacing: '0.4px' }}>
            {tc(tr, 'labels.teamOverall')}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 10 }}>
            {safeArr(formData.overallMetrics).map((row, idx) => (
              <div key={`overall_${idx}`} style={overallCardStyle}>
                <input
                  style={{ ...UI.input, height: 28, fontSize: 10, backgroundColor: 'rgba(255,255,255,0.05)' }}
                  value={row.label}
                  onChange={e => updateOverallMetric(idx, 'label', e.target.value)}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input
                    style={{ ...UI.input, height: 34, color: COLORS.yellow, fontSize: 15 }}
                    value={row.a}
                    onChange={e => updateOverallMetric(idx, 'a', e.target.value)}
                  />
                  <input
                    style={{ ...UI.input, height: 34, color: COLORS.yellow, fontSize: 15 }}
                    value={row.b}
                    onChange={e => updateOverallMetric(idx, 'b', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
            {ROLE_SECTIONS.map(section => (
              <div key={section.key} style={roleSectionStyle}>
                <button type="button" style={collapseHeadStyle} onClick={() => toggleRole(section.key)}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: COLORS.yellow, letterSpacing: '0.4px' }}>
                      {tr(section.titleKey)}
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.46)', fontWeight: 700 }}>
                      {tr(section.summaryKey)}
                    </div>
                  </div>

                  <div style={{ color: COLORS.yellow, fontWeight: 900, fontSize: 16 }}>
                    {expandedRoles[section.key] ? '−' : '+'}
                  </div>
                </button>

                {expandedRoles[section.key] && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 4 }}>
                    {getSafeRoleMetrics(formData.roleMetrics, section.key).map((row, idx) => (
                      <div
                        key={`${section.key}_${idx}`}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'minmax(110px,1fr) 132px minmax(110px,1fr)',
                          gap: 6
                        }}
                      >
                        <input
                          style={{ ...UI.input, height: 32, color: COLORS.yellow, fontSize: 14 }}
                          value={row.a}
                          onChange={e => updateRoleMetric(section.key, idx, 'a', e.target.value)}
                        />
                        <input
                          style={{ ...UI.input, height: 32, fontSize: 10, backgroundColor: 'rgba(255,255,255,0.05)' }}
                          value={row.label}
                          onChange={e => updateRoleMetric(section.key, idx, 'label', e.target.value)}
                        />
                        <input
                          style={{ ...UI.input, height: 32, color: COLORS.yellow, fontSize: 14 }}
                          value={row.b}
                          onChange={e => updateRoleMetric(section.key, idx, 'b', e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                )}
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
            {tc(tr, 'actions.take')}
          </button>
        </div>
      </ShellPanel>
    </div>
  );
}