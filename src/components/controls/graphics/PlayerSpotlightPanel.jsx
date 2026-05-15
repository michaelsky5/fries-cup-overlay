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
    fontFamily: '"HarmonyOS Sans SC", sans-serif'
  },
  select: {
    width: '100%',
    background: '#1a1a1a',
    border: '1px solid rgba(255,255,255,0.14)',
    color: COLORS.white,
    outline: 'none',
    boxSizing: 'border-box'
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
    minHeight: 32,
    padding: '0 10px'
  })
};

const safeArr = v => Array.isArray(v) ? v : [];
const toNum = v => Number.isFinite(Number(v)) ? Number(v) : 0;

function isInTeamScope(shortName, scope) {
  if (scope === 'ALL') return true;
  return PLAYOFF_TEAMS.includes(String(shortName || '').trim());
}

function normalizeRole(role) {
  const r = String(role || '').toUpperCase();
  if (r === 'SUPPORT' || r === 'SUP') return 'SUP';
  if (r === 'DAMAGE' || r === 'DPS') return 'DPS';
  if (r === 'TANK') return 'TANK';
  return r || 'FLEX';
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

function getPlayerTeamShort(player) {
  return player?.team_short_name || player?.teamName || player?.team_name || player?.team_id || '';
}

function isPlayerInTeam(player, teamId) {
  if (!teamId) return true;

  const candidates = [
    player?.team_id,
    player?.team_short_name,
    player?.teamName,
    player?.team_name
  ].filter(Boolean).map(String);

  return candidates.includes(String(teamId));
}

function formatPlayerOptionLabel(player) {
  const display = getDisplayName(player);
  const battletag = getBattleTag(player);
  const team = player?.team_short_name || '-';
  if (battletag && battletag !== display) return `${display} · ${battletag} [${team}]`;
  return `${display} [${team}]`;
}

function formatTimePlayed(rawTimeMins, fallbackText) {
  if (fallbackText) return fallbackText;
  const mins = Math.round(Number(rawTimeMins || 0));
  if (!mins) return '-';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (!m) return `${h}h`;
  return `${h}h ${m}m`;
}

function getMapKeyFromLog(log, idx) {
  const matchId = log?.matchId || log?.match_id || log?.matchDisplayName || log?.match_display_name || 'MATCH';
  const mapOrder = log?.mapOrder ?? log?.map_order ?? idx;
  return `${matchId}__${mapOrder}`;
}

function parseTopHeroes(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') return value.split(/[\/,，、]/).map(v => v.trim()).filter(Boolean);
  return [];
}

// Fallback aggregator：保留给旧数据结构 / 缺失 player_totals 时使用。
// 当前主流程不直接调用，但作为数据兼容兜底函数保留更稳。
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
    const mapSet = new Set();

    logs.forEach((log, logIdx) => {
      totalMinutes += toNum(log?.playtimeMinutes);
      totalElim += toNum(log?.totals?.elims);
      totalAst += toNum(log?.totals?.assists);
      totalDth += toNum(log?.totals?.deaths);
      totalDmg += toNum(log?.totals?.damage);
      totalHeal += toNum(log?.totals?.healing);
      totalBlock += toNum(log?.totals?.blocked);
      mapSet.add(getMapKeyFromLog(log, logIdx));

      const hero = typeof log?.hero === 'string' ? log.hero.trim() : '';
      if (hero) heroCount[hero] = (heroCount[hero] || 0) + 1;
    });

    const per10 = value => (totalMinutes > 0 ? (value / totalMinutes) * 10 : 0);
    const topHeroes = Object.entries(heroCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([hero]) => hero);
    const kd = totalDth > 0 ? totalElim / totalDth : totalElim;

    return {
      player_id: player?.player_id || `fallback_${idx}`,
      team_id: player?.team_id || '',
      team_name: player?.team_name || '',
      display_name: player?.display_name || player?.nickname || player?.player_name || 'Unknown',
      nickname: player?.nickname || '',
      battletag: player?.battletag || player?.battle_tag || player?.battleTag || player?.player_name || '',
      team_short_name: player?.team_short_name || '',
      registered_role: normalizeRole(player?.role),
      role: normalizeRole(player?.role),
      maps_played: mapSet.size,
      raw_time_mins: totalMinutes,
      total_time_played: formatTimePlayed(totalMinutes),
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

function buildRoleScopedEntries(db) {
  const rosterPlayers = safeArr(db?.players);
  const entries = [];
  const seen = new Set();

  rosterPlayers.forEach((player, playerIdx) => {
    const logs = safeArr(player?.match_logs).filter(log => toNum(log?.playtimeMinutes) > 0);
    const groups = new Map();

    logs.forEach((log, logIdx) => {
      const role = normalizeRole(log?.role || player?.role);

      if (!groups.has(role)) {
        groups.set(role, {
          player_id: player?.player_id || `p_${playerIdx}`,
          team_id: player?.team_id || player?.team_short_name || '',
          team_name: player?.team_name || '',
          team_short_name: player?.team_short_name || '',
          display_name: player?.display_name || player?.nickname || player?.player_name || 'Unknown',
          nickname: player?.nickname || '',
          battletag: player?.battletag || player?.battle_tag || player?.battleTag || player?.player_name || '',
          registered_role: normalizeRole(player?.role),
          role,
          raw_time_mins: 0,
          total_elim: 0,
          total_ast: 0,
          total_dth: 0,
          total_dmg: 0,
          total_heal: 0,
          total_block: 0,
          heroCount: {},
          mapSet: new Set()
        });
      }

      const group = groups.get(role);
      group.raw_time_mins += toNum(log?.playtimeMinutes);
      group.total_elim += toNum(log?.totals?.elims);
      group.total_ast += toNum(log?.totals?.assists);
      group.total_dth += toNum(log?.totals?.deaths);
      group.total_dmg += toNum(log?.totals?.damage);
      group.total_heal += toNum(log?.totals?.healing);
      group.total_block += toNum(log?.totals?.blocked);
      group.mapSet.add(getMapKeyFromLog(log, logIdx));

      const hero = typeof log?.hero === 'string' ? log.hero.trim() : '';
      if (hero) group.heroCount[hero] = (group.heroCount[hero] || 0) + 1;
    });

    groups.forEach(group => {
      const key = `${group.player_id}__${group.role}`;
      if (seen.has(key)) return;
      seen.add(key);

      const topHeroes = Object.entries(group.heroCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([hero]) => hero);
      const per10 = value => (group.raw_time_mins > 0 ? (value / group.raw_time_mins) * 10 : 0);
      const kdr = group.total_dth > 0 ? group.total_elim / group.total_dth : group.total_elim;

      entries.push({
        player_id: group.player_id,
        team_id: group.team_id,
        team_name: group.team_name,
        team_short_name: group.team_short_name,
        display_name: group.display_name,
        nickname: group.nickname,
        battletag: group.battletag,
        registered_role: group.registered_role,
        role: group.role,
        maps_played: group.mapSet.size,
        raw_time_mins: group.raw_time_mins,
        total_time_played: formatTimePlayed(group.raw_time_mins),
        top_3_heroes: topHeroes,
        most_played_hero: topHeroes[0] || '',
        avg_elim: per10(group.total_elim),
        avg_ast: per10(group.total_ast),
        avg_dth: per10(group.total_dth),
        avg_dmg: per10(group.total_dmg),
        avg_heal: per10(group.total_heal),
        avg_block: per10(group.total_block),
        total_elim: group.total_elim,
        total_dth: group.total_dth,
        kdr
      });
    });
  });

  safeArr(db?.player_totals).forEach((row, idx) => {
    const pid = row?.player_id || row?.id || row?.nickname || `pt_${idx}`;
    const role = normalizeRole(row?.role);
    const key = `${pid}__${role}`;
    if (seen.has(key)) return;
    seen.add(key);

    const topHeroes = parseTopHeroes(row?.top_3_heroes);
    const roster = rosterPlayers.find(p => String(p?.player_id) === String(pid));

    entries.push({
      player_id: pid,
      team_id: row?.team_id || roster?.team_id || row?.team_short_name || roster?.team_short_name || '',
      team_name: row?.team_name || roster?.team_name || '',
      team_short_name: row?.team_short_name || roster?.team_short_name || '',
      display_name: row?.display_name || row?.nickname || roster?.display_name || roster?.nickname || row?.player_name || 'Unknown',
      nickname: row?.nickname || roster?.nickname || '',
      battletag: row?.battletag || row?.battle_tag || row?.battleTag || row?.player_name || roster?.player_name || '',
      registered_role: normalizeRole(roster?.role || row?.role),
      role,
      maps_played: toNum(row?.maps_played),
      raw_time_mins: toNum(row?.raw_time_mins),
      total_time_played: row?.total_time_played || formatTimePlayed(row?.raw_time_mins),
      top_3_heroes: topHeroes,
      most_played_hero: row?.most_played_hero || topHeroes[0] || '',
      avg_elim: toNum(row?.avg_elim),
      avg_ast: toNum(row?.avg_ast),
      avg_dth: toNum(row?.avg_dth),
      avg_dmg: toNum(row?.avg_dmg),
      avg_heal: toNum(row?.avg_heal),
      avg_block: toNum(row?.avg_block),
      total_elim: toNum(row?.total_elim),
      total_dth: toNum(row?.total_dth),
      kdr: toNum(row?.kdr) || (toNum(row?.total_dth) > 0 ? toNum(row?.total_elim) / toNum(row?.total_dth) : toNum(row?.total_elim))
    });
  });

  return entries.sort((a, b) => {
    const teamA = a?.team_short_name || '';
    const teamB = b?.team_short_name || '';
    if (teamA !== teamB) return teamA.localeCompare(teamB);

    const nameA = getDisplayName(a);
    const nameB = getDisplayName(b);
    if (nameA !== nameB) return nameA.localeCompare(nameB);

    return (b?.raw_time_mins || 0) - (a?.raw_time_mins || 0);
  });
}

function buildRoleBench(roleEntries) {
  const groups = new Map();

  roleEntries.forEach(entry => {
    const role = normalizeRole(entry?.role);
    if (!groups.has(role)) groups.set(role, []);
    groups.get(role).push(entry);
  });

  const result = new Map();

  groups.forEach((pool, role) => {
    const max = { dmg: 1, heal: 1, mit: 1, elim: 1, ast: 1, dth: 1, kdr: 1 };
    const sum = { dmg: 0, heal: 0, mit: 0, elim: 0, ast: 0, dth: 0, kdr: 0 };
    let validCount = 0;

    pool.forEach(p => {
      if (toNum(p.raw_time_mins) > 0 || toNum(p.maps_played) > 0) {
        validCount++;
        max.dmg = Math.max(max.dmg, toNum(p.avg_dmg));
        max.heal = Math.max(max.heal, toNum(p.avg_heal));
        max.mit = Math.max(max.mit, toNum(p.avg_block));
        max.elim = Math.max(max.elim, toNum(p.avg_elim));
        max.ast = Math.max(max.ast, toNum(p.avg_ast));
        max.dth = Math.max(max.dth, toNum(p.avg_dth));
        max.kdr = Math.max(max.kdr, toNum(p.kdr));

        sum.dmg += toNum(p.avg_dmg);
        sum.heal += toNum(p.avg_heal);
        sum.mit += toNum(p.avg_block);
        sum.elim += toNum(p.avg_elim);
        sum.ast += toNum(p.avg_ast);
        sum.dth += toNum(p.avg_dth);
        sum.kdr += toNum(p.kdr);
      }
    });

    const avg = {
      dmg: validCount > 0 ? sum.dmg / validCount : 0,
      heal: validCount > 0 ? sum.heal / validCount : 0,
      mit: validCount > 0 ? sum.mit / validCount : 0,
      elim: validCount > 0 ? sum.elim / validCount : 0,
      ast: validCount > 0 ? sum.ast / validCount : 0,
      dth: validCount > 0 ? sum.dth / validCount : 0,
      kdr: validCount > 0 ? sum.kdr / validCount : 0
    };

    const getRank = (entry, key, asc = false) => {
      if (!entry || pool.length <= 1) return 1;

      const sorted = [...pool].sort((a, b) => {
        const av = toNum(a[key]);
        const bv = toNum(b[key]);
        return asc ? av - bv : bv - av;
      });

      const r = sorted.findIndex(p => String(p.player_id) === String(entry.player_id)) + 1;
      return r > 0 ? r : pool.length;
    };

    const getPercentile = (entry, key, asc = false) => {
      const rank = getRank(entry, key, asc);
      if (pool.length <= 1) return 100;
      return Math.round(((pool.length - rank) / (pool.length - 1)) * 100);
    };

    result.set(role, { pool, max, avg, getRank, getPercentile, total: pool.length });
  });

  return result;
}

function buildStyleProfile(roleEntry, roleBenchMap, tr) {
  const tt = (key, fallback) => (typeof tr === 'function' ? tr(key, { defaultValue: fallback }) : fallback);
  if (!roleEntry) return { tag: tt('dataGraphicsPanels.playerSpotlight.stylePending', '待分析'), desc: tt('dataGraphicsPanels.playerSpotlight.descPending', '等待载入选手数据。') };

  const role = normalizeRole(roleEntry?.role);
  const bench = roleBenchMap.get(role);
  if (!bench) return { tag: tt('dataGraphicsPanels.playerSpotlight.styleBalancedPlayer', '均衡型选手'), desc: tt('dataGraphicsPanels.playerSpotlight.descBalanced', '整体能力分布较为均衡。') };

  const dmg = bench.getPercentile(roleEntry, 'avg_dmg');
  const heal = bench.getPercentile(roleEntry, 'avg_heal');
  const mit = bench.getPercentile(roleEntry, 'avg_block');
  const elim = bench.getPercentile(roleEntry, 'avg_elim');
  const survive = bench.getPercentile(roleEntry, 'avg_dth', true);

  if (role === 'DPS') {
    if (dmg >= 80 && elim >= 80) return { tag: tt('dataGraphicsPanels.playerSpotlight.styleDpsPressure', '高压进攻核心'), desc: tt('dataGraphicsPanels.playerSpotlight.descDpsPressure', '高伤害与高击杀并存，是典型的前压型输出点。') };
    if (survive >= 75 && dmg >= 65) return { tag: tt('dataGraphicsPanels.playerSpotlight.styleDpsStable', '稳定压制输出'), desc: tt('dataGraphicsPanels.playerSpotlight.descDpsStable', '能维持稳定生存，同时持续制造火力压力。') };
    return { tag: tt('dataGraphicsPanels.playerSpotlight.styleDpsMobile', '机动火力点'), desc: tt('dataGraphicsPanels.playerSpotlight.descDpsMobile', '更偏灵活转线与局部终结，打法机动。') };
  }

  if (role === 'TANK') {
    if (mit >= 80 && survive >= 70) return { tag: tt('dataGraphicsPanels.playerSpotlight.styleTankPressure', '前线承压核心'), desc: tt('dataGraphicsPanels.playerSpotlight.descTankPressure', '承担大量前线压力，是队伍正面框架。') };
    if (dmg >= 75) return { tag: tt('dataGraphicsPanels.playerSpotlight.styleTankPush', '推进型前排'), desc: tt('dataGraphicsPanels.playerSpotlight.descTankPush', '更擅长用主动推进和输出施压来打开空间。') };
    return { tag: tt('dataGraphicsPanels.playerSpotlight.styleTankBalanced', '均衡前线'), desc: tt('dataGraphicsPanels.playerSpotlight.descTankBalanced', '综合能力分布均衡，承担稳定前排职责。') };
  }

  if (role === 'SUP') {
    if (heal >= 80 && survive >= 70) return { tag: tt('dataGraphicsPanels.playerSpotlight.styleSupStable', '稳定后排支援'), desc: tt('dataGraphicsPanels.playerSpotlight.descSupStable', '以后排续航与稳定存活构成团队支撑。') };
    if (heal >= 65 && elim >= 60) return { tag: tt('dataGraphicsPanels.playerSpotlight.styleSupAggressive', '进攻型支援'), desc: tt('dataGraphicsPanels.playerSpotlight.descSupAggressive', '在保证功能性的同时，具备更主动的火力倾向。') };
    return { tag: tt('dataGraphicsPanels.playerSpotlight.styleSupPivot', '团队支点'), desc: tt('dataGraphicsPanels.playerSpotlight.descSupPivot', '更偏向团队协同与节奏支援。') };
  }

  return { tag: tt('dataGraphicsPanels.playerSpotlight.styleBalancedPlayer', '均衡型选手'), desc: tt('dataGraphicsPanels.playerSpotlight.descBalanced', '整体能力分布较为均衡。') };
}

function buildFiveStats(roleEntry, roleBenchMap, tr) {
  const tt = (key, fallback) => (typeof tr === 'function' ? tr(key, { defaultValue: fallback }) : fallback);
  const role = normalizeRole(roleEntry?.role);
  const bench = roleBenchMap.get(role);

  const createMetric = (label, key, dec = 1, asc = false) => {
    const val = toNum(roleEntry?.[key]);
    let avg = 0;
    let max = 1;
    let rank = 1;
    let total = 1;

    if (bench) {
      const bKey = key.replace('avg_', '');
      avg = bench.avg[bKey] || 0;
      max = bench.max[bKey] || 1;
      rank = bench.getRank(roleEntry, key, asc);
      total = bench.total;
    }

    return { label, value: val.toFixed(dec), avg: avg.toFixed(dec), max: max.toFixed(dec), rank, total };
  };

  if (role === 'SUP') {
    return [
      createMetric(tt('dataGraphicsPanels.metrics.healPer10', '治疗 / 10分'), 'avg_heal', 0),
      createMetric(tt('dataGraphicsPanels.metrics.astPer10', '助攻 / 10分'), 'avg_ast', 1),
      createMetric(tt('dataGraphicsPanels.metrics.elimPer10', '击杀 / 10分'), 'avg_elim', 1),
      createMetric(tt('dataGraphicsPanels.metrics.dthPer10', '死亡 / 10分'), 'avg_dth', 1, true),
      createMetric(tt('dataGraphicsPanels.metrics.dmgPer10', '伤害 / 10分'), 'avg_dmg', 0)
    ];
  }

  if (role === 'TANK') {
    return [
      createMetric(tt('dataGraphicsPanels.metrics.elimPer10', '击杀 / 10分'), 'avg_elim', 1),
      createMetric(tt('dataGraphicsPanels.metrics.astPer10', '助攻 / 10分'), 'avg_ast', 1),
      createMetric(tt('dataGraphicsPanels.metrics.dthPer10', '死亡 / 10分'), 'avg_dth', 1, true),
      createMetric(tt('dataGraphicsPanels.metrics.dmgPer10', '伤害 / 10分'), 'avg_dmg', 0),
      createMetric(tt('dataGraphicsPanels.metrics.mitPer10', '承伤 / 10分'), 'avg_block', 0)
    ];
  }

  return [
    createMetric(tt('dataGraphicsPanels.metrics.elimPer10', '击杀 / 10分'), 'avg_elim', 1),
    createMetric(tt('dataGraphicsPanels.metrics.astPer10', '助攻 / 10分'), 'avg_ast', 1),
    createMetric(tt('dataGraphicsPanels.metrics.dthPer10', '死亡 / 10分'), 'avg_dth', 1, true),
    createMetric(tt('dataGraphicsPanels.metrics.dmgPer10', '伤害 / 10分'), 'avg_dmg', 0),
    createMetric(tt('dataGraphicsPanels.metrics.kd', 'K / D'), 'kdr', 2)
  ];
}

function buildSpotlightPreset(rosterPlayer, roleEntry, roleBenchMap, tr) {
  const tt = (key, fallback) => (typeof tr === 'function' ? tr(key, { defaultValue: fallback }) : fallback);
  const style = buildStyleProfile(roleEntry, roleBenchMap, tr);
  const heroPool = Array.isArray(roleEntry?.top_3_heroes) ? roleEntry.top_3_heroes.filter(Boolean).join(' / ') : '';
  const metrics = buildFiveStats(roleEntry, roleBenchMap, tr);

  let radarData = [];
  const role = normalizeRole(roleEntry?.role);
  const bench = roleBenchMap.get(role);

  if (bench) {
    const getScore = (val, maxVal) => {
      const v = toNum(val);
      const m = toNum(maxVal) || 1;
      return Math.min(100, Math.max(0, (v / m) * 100)) || 0;
    };

    const getSurvScore = (dth, maxDth) => {
      const d = toNum(dth);
      const m = toNum(maxDth) || 1;
      if (d <= 0 && toNum(roleEntry?.raw_time_mins) > 0) return 100;
      if (toNum(roleEntry?.raw_time_mins) === 0) return 0;
      return Math.min(100, Math.max(0, 100 - (d / m) * 100)) || 0;
    };

    radarData = [
      { subject: tt('dataGraphicsPanels.radar.damage', '伤害'), score: getScore(roleEntry?.avg_dmg, bench.max.dmg), avgScore: getScore(bench.avg.dmg, bench.max.dmg), fullMark: 100 },
      { subject: tt('dataGraphicsPanels.radar.elim', '击杀'), score: getScore(roleEntry?.avg_elim, bench.max.elim), avgScore: getScore(bench.avg.elim, bench.max.elim), fullMark: 100 },
      { subject: tt('dataGraphicsPanels.radar.ast', '助攻'), score: getScore(roleEntry?.avg_ast, bench.max.ast), avgScore: getScore(bench.avg.ast, bench.max.ast), fullMark: 100 },
      { subject: tt('dataGraphicsPanels.radar.heal', '治疗'), score: getScore(roleEntry?.avg_heal, bench.max.heal), avgScore: getScore(bench.avg.heal, bench.max.heal), fullMark: 100 },
      { subject: tt('dataGraphicsPanels.radar.mit', '阻挡'), score: getScore(roleEntry?.avg_block, bench.max.mit), avgScore: getScore(bench.avg.mit, bench.max.mit), fullMark: 100 },
      { subject: tt('dataGraphicsPanels.radar.survival', '生存'), score: getSurvScore(roleEntry?.avg_dth, bench.max.dth), avgScore: getSurvScore(bench.avg.dth, bench.max.dth), fullMark: 100 }
    ];
  }

  return {
    cardTag: tr('dataGraphicsPanels.playerSpotlight.focusPlayer', { defaultValue: '焦点选手' }),
    displayName: getDisplayName(rosterPlayer || roleEntry),
    battletag: getBattleTag(rosterPlayer || roleEntry),
    teamShort: rosterPlayer?.team_short_name || roleEntry?.team_short_name || '',
    registeredRole: normalizeRole(rosterPlayer?.role || rosterPlayer?.registered_role || roleEntry?.registered_role),
    dataRole: normalizeRole(roleEntry?.role || rosterPlayer?.role),
    mapsPlayed: String(roleEntry?.maps_played || 0),
    playTime: formatTimePlayed(roleEntry?.raw_time_mins, roleEntry?.total_time_played),
    styleTag: style.tag,
    styleDesc: style.desc,
    heroPool,
    signatureHero: roleEntry?.most_played_hero || '',
    topHeroes: heroPool,
    metrics,
    radarData
  };
}

const compactCardStyle = {
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.025)',
  padding: '9px 10px',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  minHeight: 86
};

const editorBlockStyle = {
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.025)',
  padding: '9px 10px',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  minWidth: 0
};

const fieldLabelStyle = {
  ...labelStyle,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
};

const metaCellStyle = {
  minWidth: 0
};

const metricCardStyle = {
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.03)',
  padding: 8,
  display: 'grid',
  gridTemplateRows: '18px 30px 36px',
  gap: 6,
  minWidth: 0
};

const sectionTitleStyle = {
  color: 'rgba(255,255,255,0.42)',
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: 1.2,
  textTransform: 'uppercase',
  lineHeight: 1
};

function Field({ label, children }) {
  return (
    <div style={metaCellStyle}>
      <div style={fieldLabelStyle}>{label}</div>
      {children}
    </div>
  );
}

export default function PlayerSpotlightPanel({ db, dbStatus, density, densityTokens, is1080Compact }) {
  const { t: tr } = useTranslation();
  const { matchData, updateWithHistory, setPreviewScene, takeScene } = useMatchContext();
  const t = densityTokens || { panelPadding: '12px' };
  const rowH = is1080Compact ? '30px' : '32px';

  const [teamScope, setTeamScope] = useState('PLAYOFF');
  const [teamId, setTeamId] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [selectedDataRole, setSelectedDataRole] = useState('');

  const [formData, setFormData] = useState({
    cardTag: tr('dataGraphicsPanels.playerSpotlight.focusPlayer', { defaultValue: '焦点选手' }),
    displayName: '',
    battletag: '',
    teamShort: '',
    registeredRole: '',
    dataRole: '',
    mapsPlayed: '',
    playTime: '',
    styleTag: '',
    styleDesc: '',
    heroPool: '',
    signatureHero: '',
    topHeroes: '',
    metrics: [
      { label: tr('dataGraphicsPanels.metrics.elimPer10', { defaultValue: '击杀 / 10分' }), value: '', avg: '', max: '', rank: '', total: '' },
      { label: tr('dataGraphicsPanels.metrics.astPer10', { defaultValue: '助攻 / 10分' }), value: '', avg: '', max: '', rank: '', total: '' },
      { label: tr('dataGraphicsPanels.metrics.dthPer10', { defaultValue: '死亡 / 10分' }), value: '', avg: '', max: '', rank: '', total: '' },
      { label: tr('dataGraphicsPanels.metrics.dmgPer10', { defaultValue: '伤害 / 10分' }), value: '', avg: '', max: '', rank: '', total: '' },
      { label: tr('dataGraphicsPanels.metrics.kd', { defaultValue: 'K / D' }), value: '', avg: '', max: '', rank: '', total: '' }
    ],
    radarData: []
  });

  const rosterPlayers = useMemo(() => {
    const base = safeArr(db?.players).filter(p => isInTeamScope(getPlayerTeamShort(p), teamScope));
    if (base.length) return base;

    const seen = new Set();

    return safeArr(db?.player_totals).reduce((acc, row, idx) => {
      const shortName = row?.team_short_name || '';
      if (!isInTeamScope(shortName, teamScope)) return acc;

      const pid = row?.player_id || row?.id || row?.nickname || `pt_${idx}`;
      if (seen.has(pid)) return acc;
      seen.add(pid);

      acc.push({
        player_id: pid,
        display_name: row?.display_name || row?.nickname || row?.player_name || 'Unknown',
        nickname: row?.nickname || '',
        player_name: row?.player_name || '',
        battletag: row?.battletag || row?.battle_tag || row?.battleTag || row?.player_name || '',
        team_id: row?.team_id || row?.team_short_name || '',
        team_name: row?.team_name || '',
        team_short_name: shortName,
        role: normalizeRole(row?.role)
      });

      return acc;
    }, []);
  }, [db, teamScope]);

  const roleScopedEntries = useMemo(() => buildRoleScopedEntries(db), [db]);
  const roleBenchMap = useMemo(() => buildRoleBench(roleScopedEntries), [roleScopedEntries]);

  const teamOptions = useMemo(() => {
    const map = new Map();

    safeArr(db?.teams).forEach(team => {
      const id = team?.team_id || team?.id || team?.team_short_name || '';
      const short = team?.team_short_name || team?.short || team?.team_name || tr('dataGraphicsPanels.common.unknown', { defaultValue: '未知' });

      if (!id || !isInTeamScope(short, teamScope)) return;

      map.set(id, {
        id,
        name: team?.team_name || team?.name || team?.team_short_name || tr('dataGraphicsPanels.common.unknownTeam', { defaultValue: '未知队伍' }),
        short
      });
    });

    rosterPlayers.forEach((player, idx) => {
      const id = getPlayerTeamId(player) || `team_${idx}`;
      const short = player?.team_short_name || player?.team_name || tr('dataGraphicsPanels.common.unknown', { defaultValue: '未知' });

      if (!map.has(id) && isInTeamScope(short, teamScope)) {
        map.set(id, {
          id,
          name: player?.team_name || player?.team_short_name || tr('dataGraphicsPanels.common.unknownTeam', { defaultValue: '未知队伍' }),
          short
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.short.localeCompare(b.short));
  }, [db, rosterPlayers, teamScope, tr]);

  const filteredPlayers = useMemo(
    () => rosterPlayers.filter(player => isPlayerInTeam(player, teamId)),
    [rosterPlayers, teamId]
  );

  useEffect(() => {
    if (teamId && !teamOptions.some(team => String(team.id) === String(teamId))) {
      setTeamId('');
      setSelectedPlayerId('');
      setSelectedDataRole('');
    }
  }, [teamScope, teamOptions, teamId]);

  useEffect(() => {
    if (selectedPlayerId && !filteredPlayers.some((p, idx) => getSafeId(p, idx) === selectedPlayerId)) {
      setSelectedPlayerId('');
      setSelectedDataRole('');
    }
  }, [selectedPlayerId, filteredPlayers]);

  const activeRosterPlayer = useMemo(
    () => rosterPlayers.find((p, idx) => getSafeId(p, idx) === selectedPlayerId) || null,
    [rosterPlayers, selectedPlayerId]
  );

  const roleEntriesForPlayer = useMemo(() => {
    if (!activeRosterPlayer) return [];

    const entries = roleScopedEntries
      .filter(entry => String(entry.player_id) === String(activeRosterPlayer.player_id))
      .sort((a, b) => {
        const reg = normalizeRole(activeRosterPlayer.role);
        const aScore = (normalizeRole(a.role) === reg ? 100000 : 0) + toNum(a.raw_time_mins);
        const bScore = (normalizeRole(b.role) === reg ? 100000 : 0) + toNum(b.raw_time_mins);
        return bScore - aScore;
      });

    if (entries.length) return entries;

    return [{
      player_id: activeRosterPlayer.player_id,
      team_id: activeRosterPlayer.team_id || activeRosterPlayer.team_short_name || '',
      team_name: activeRosterPlayer.team_name || '',
      team_short_name: activeRosterPlayer.team_short_name || '',
      display_name: getDisplayName(activeRosterPlayer),
      nickname: activeRosterPlayer.nickname || '',
      battletag: getBattleTag(activeRosterPlayer),
      registered_role: normalizeRole(activeRosterPlayer.role),
      role: normalizeRole(activeRosterPlayer.role),
      maps_played: 0,
      raw_time_mins: 0,
      total_time_played: '-',
      top_3_heroes: [],
      most_played_hero: '',
      avg_elim: 0,
      avg_ast: 0,
      avg_dth: 0,
      avg_dmg: 0,
      avg_heal: 0,
      avg_block: 0,
      total_elim: 0,
      total_dth: 0,
      kdr: 0
    }];
  }, [activeRosterPlayer, roleScopedEntries]);

  useEffect(() => {
    if (!activeRosterPlayer) {
      setSelectedDataRole('');
      return;
    }

    const registered = normalizeRole(activeRosterPlayer.role);
    const available = roleEntriesForPlayer.map(entry => normalizeRole(entry.role));
    const preferred = available.includes(registered) ? registered : (available[0] || '');

    setSelectedDataRole(prev => (available.includes(prev) ? prev : preferred));
  }, [activeRosterPlayer, roleEntriesForPlayer]);

  const activeRoleEntry = useMemo(
    () => roleEntriesForPlayer.find(entry => normalizeRole(entry.role) === normalizeRole(selectedDataRole)) || roleEntriesForPlayer[0] || null,
    [roleEntriesForPlayer, selectedDataRole]
  );

  useEffect(() => {
    if (!activeRosterPlayer || !activeRoleEntry) return;
    setFormData(buildSpotlightPreset(activeRosterPlayer, activeRoleEntry, roleBenchMap, tr));
  }, [activeRosterPlayer, activeRoleEntry, roleBenchMap, tr]);

  const handleScopeChange = scope => {
    setTeamScope(scope);
    setTeamId('');
    setSelectedPlayerId('');
    setSelectedDataRole('');
  };

  const applyQuickPreset = type => {
    if (!activeRosterPlayer || !activeRoleEntry) return;

    if (type === 'RESET') {
      setFormData(buildSpotlightPreset(activeRosterPlayer, activeRoleEntry, roleBenchMap, tr));
      return;
    }

    if (type === 'MVP') {
      setFormData(prev => ({ ...prev, cardTag: tr('dataGraphicsPanels.playerSpotlight.mvp', { defaultValue: '本场 MVP' }) }));
      return;
    }

    if (type === 'FOCUS') {
      setFormData(prev => ({ ...prev, cardTag: tr('dataGraphicsPanels.playerSpotlight.focusPlayer', { defaultValue: '焦点选手' }) }));
      return;
    }

    if (type === 'STAR') {
      setFormData(prev => ({ ...prev, cardTag: tr('dataGraphicsPanels.playerSpotlight.starPlayer', { defaultValue: '明星选手' }) }));
    }
  };

  const updateMetric = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      metrics: prev.metrics.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    }));
  };

  const handleTake = () => {
    const payload = {
      teamScope,
      teamId,
      playerId: selectedPlayerId,
      dataRole: formData.dataRole,
      registeredRole: formData.registeredRole,
      ...formData
    };

    updateWithHistory('Set Player Spotlight Graphic', {
      ...matchData,
      playerSpotlightData: payload,
      dataGraphics: {
        type: 'PLAYER_SPOTLIGHT',
        payload
      }
    });

    setPreviewScene?.('MVP_SCENE');

    window.setTimeout(() => {
      takeScene?.('MVP_SCENE');
    }, 0);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '310px minmax(0,1fr)', gap: 10, alignItems: 'start' }}>
      <ShellPanel title={tr('dataGraphicsPanels.common.autoFill', { defaultValue: '自动填充' })} accent density={density} bodyStyle={{ padding: t.panelPadding }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <div>
            <div style={fieldLabelStyle}>{tr('dataGraphicsPanels.playerSpotlight.playerScope', { defaultValue: '选手范围' })}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button style={UI.chip(teamScope === 'PLAYOFF')} onClick={() => handleScopeChange('PLAYOFF')}>八强</button>
              <button style={UI.chip(teamScope === 'ALL')} onClick={() => handleScopeChange('ALL')}>全部</button>
            </div>
          </div>

          <div>
            <div style={fieldLabelStyle}>{tr('dataGraphicsPanels.playerSpotlight.selectTeamFirst', { defaultValue: '先选队伍' })}</div>
            <select
              style={{ ...UI.select, height: rowH, color: COLORS.yellow, padding: '0 10px', fontWeight: 900 }}
              value={teamId}
              onChange={e => {
                setTeamId(e.target.value);
                setSelectedPlayerId('');
                setSelectedDataRole('');
              }}
              disabled={dbStatus !== 'LOADED'}
            >
              <option value="">{tr('dataGraphicsPanels.playerSpotlight.selectTeam', { defaultValue: '-- 选择队伍 --' })}</option>
              {teamOptions.map(team => (
                <option key={`TEAM_${team.id}`} value={team.id}>{team.short}</option>
              ))}
            </select>
          </div>

          <div>
            <div style={fieldLabelStyle}>{tr('dataGraphicsPanels.playerSpotlight.selectPlayerThen', { defaultValue: '再选选手' })}</div>
            <select
              style={{ ...UI.select, height: rowH, color: COLORS.yellow, padding: '0 10px', fontWeight: 900 }}
              value={selectedPlayerId}
              onChange={e => {
                setSelectedPlayerId(e.target.value);
                setSelectedDataRole('');
              }}
              disabled={dbStatus !== 'LOADED'}
            >
              <option value="">{dbStatus === 'LOADED' ? tr('dataGraphicsPanels.playerSpotlight.selectAutofillPlayer', { defaultValue: '-- 选择要自动填充的选手 --' }) : tr('dataGraphicsPanels.common.waitingDb', { defaultValue: '-- 等待数据库 --' })}</option>
              {filteredPlayers.map((p, idx) => (
                <option key={getSafeId(p, idx)} value={getSafeId(p, idx)}>{formatPlayerOptionLabel(p)}</option>
              ))}
            </select>
          </div>

          <div>
            <div style={fieldLabelStyle}>{tr('dataGraphicsPanels.playerSpotlight.dataRole', { defaultValue: '数据职责' })}</div>
            <select
              style={{ ...UI.select, height: rowH, color: COLORS.yellow, padding: '0 10px', fontWeight: 900 }}
              value={selectedDataRole}
              onChange={e => setSelectedDataRole(e.target.value)}
              disabled={!selectedPlayerId}
            >
              <option value="">{tr('dataGraphicsPanels.playerSpotlight.selectDataRole', { defaultValue: '-- 选择数据职责 --' })}</option>
              {roleEntriesForPlayer.map(entry => {
                const role = normalizeRole(entry.role);
                return (
                  <option key={`${entry.player_id}_${role}`} value={role}>
                    {role} · {entry.maps_played || 0} {tr('dataGraphicsPanels.common.mapsUnit', { defaultValue: '图' })} · {formatTimePlayed(entry.raw_time_mins, entry.total_time_played)}
                  </option>
                );
              })}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button type="button" style={UI.chip(false)} onClick={() => applyQuickPreset('RESET')}>
              {tr('dataGraphicsPanels.common.resetPreset', { defaultValue: '重置预设' })}
            </button>
            <button type="button" style={UI.chip(formData.cardTag === tr('dataGraphicsPanels.playerSpotlight.mvp', { defaultValue: '本场 MVP' }))} onClick={() => applyQuickPreset('MVP')}>
              {tr('dataGraphicsPanels.playerSpotlight.mvp', { defaultValue: '本场 MVP' })}
            </button>
            <button type="button" style={UI.chip(formData.cardTag === tr('dataGraphicsPanels.playerSpotlight.focusPlayer', { defaultValue: '焦点选手' }))} onClick={() => applyQuickPreset('FOCUS')}>
              {tr('dataGraphicsPanels.playerSpotlight.focusPlayer', { defaultValue: '焦点选手' })}
            </button>
            <button type="button" style={UI.chip(formData.cardTag === tr('dataGraphicsPanels.playerSpotlight.starPlayer', { defaultValue: '明星选手' }))} onClick={() => applyQuickPreset('STAR')}>
              {tr('dataGraphicsPanels.playerSpotlight.starPlayer', { defaultValue: '明星选手' })}
            </button>
          </div>

          <div style={compactCardStyle}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.46)', fontWeight: 800 }}>{tr('dataGraphicsPanels.common.currentSource', { defaultValue: '当前来源' })}</div>
            <div style={{ fontSize: 17, color: COLORS.white, fontWeight: 900, lineHeight: 1.1, wordBreak: 'break-word' }}>
              {getDisplayName(activeRosterPlayer) || tr('dataGraphicsPanels.common.pendingSelect', { defaultValue: '待选择' })}
            </div>
            <div style={{ fontSize: 11, color: COLORS.yellow, fontWeight: 800 }}>
              {activeRosterPlayer ? (<>{activeRosterPlayer.team_short_name || '-'} · {tr('dataGraphicsPanels.playerSpotlight.registered', { defaultValue: '报名' })} {normalizeRole(activeRosterPlayer.role) || '-'}</>) : '-'}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.58)', fontWeight: 700 }}>
              {activeRoleEntry ? `${tr('dataGraphicsPanels.playerSpotlight.dataRole', { defaultValue: '数据职责' })} ${normalizeRole(activeRoleEntry.role)} · ${activeRoleEntry.maps_played || 0} ${tr('dataGraphicsPanels.common.mapsUnit', { defaultValue: '图' })}` : tr('dataGraphicsPanels.playerSpotlight.noDataRole', { defaultValue: '未选择数据职责' })}
            </div>
            {!!getBattleTag(activeRosterPlayer) && (
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.52)', fontWeight: 700 }}>{getBattleTag(activeRosterPlayer)}</div>
            )}
          </div>
        </div>
      </ShellPanel>

      <ShellPanel title={tr('dataGraphicsPanels.playerSpotlight.editTitle', { defaultValue: '资料卡编辑' })} accent density={density} bodyStyle={{ padding: t.panelPadding }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 9, minWidth: 0 }}>
          <div style={editorBlockStyle}>
            <div style={sectionTitleStyle}>{tr('dataGraphicsPanels.playerSpotlight.basicInfo', { defaultValue: '基础信息' })}</div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
                gap: 10,
                alignItems: 'end'
              }}
            >
              <div style={{ gridColumn: 'span 2', minWidth: 0 }}>
                <Field label={tr('dataGraphicsPanels.playerSpotlight.cardTag', { defaultValue: '卡片标签' })}>
                  <input
                    style={{ ...UI.input, height: rowH, padding: '0 10px', textAlign: 'center', color: COLORS.yellow, fontWeight: 900 }}
                    value={formData.cardTag}
                    onChange={e => setFormData({ ...formData, cardTag: e.target.value })}
                  />
                </Field>
              </div>

              <div style={{ gridColumn: 'span 6', minWidth: 0 }}>
                <Field label={tr('dataGraphicsPanels.playerSpotlight.displayName', { defaultValue: '显示名称' })}>
                  <input
                    style={{ ...UI.input, height: rowH, padding: '0 12px', textAlign: 'left', fontSize: 18, fontWeight: 900 }}
                    value={formData.displayName}
                    onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                  />
                </Field>
              </div>

              <div style={{ gridColumn: 'span 4', minWidth: 0 }}>
                <Field label={tr('dataGraphicsPanels.common.battleTag', { defaultValue: '战网名' })}>
                  <input
                    style={{ ...UI.input, height: rowH, padding: '0 10px', textAlign: 'left' }}
                    value={formData.battletag}
                    onChange={e => setFormData({ ...formData, battletag: e.target.value })}
                  />
                </Field>
              </div>

              <div style={{ gridColumn: 'span 2', minWidth: 0 }}>
                <Field label={tr('dataGraphicsPanels.common.team', { defaultValue: '队伍' })}>
                  <input
                    style={{ ...UI.input, height: rowH, padding: '0 8px', textAlign: 'center', color: COLORS.yellow, fontWeight: 900 }}
                    value={formData.teamShort}
                    onChange={e => setFormData({ ...formData, teamShort: e.target.value })}
                  />
                </Field>
              </div>

              <div style={{ gridColumn: 'span 2', minWidth: 0 }}>
                <Field label={tr('dataGraphicsPanels.playerSpotlight.registeredRole', { defaultValue: '报名职责' })}>
                  <input
                    style={{ ...UI.input, height: rowH, padding: '0 8px', textAlign: 'center', fontWeight: 900 }}
                    value={formData.registeredRole}
                    onChange={e => setFormData({ ...formData, registeredRole: e.target.value })}
                  />
                </Field>
              </div>

              <div style={{ gridColumn: 'span 2', minWidth: 0 }}>
                <Field label={tr('dataGraphicsPanels.playerSpotlight.dataRole', { defaultValue: '数据职责' })}>
                  <input
                    style={{ ...UI.input, height: rowH, padding: '0 8px', textAlign: 'center', color: COLORS.yellow, fontWeight: 900 }}
                    value={formData.dataRole}
                    onChange={e => setFormData({ ...formData, dataRole: e.target.value })}
                  />
                </Field>
              </div>

              <div style={{ gridColumn: 'span 2', minWidth: 0 }}>
                <Field label={tr('dataGraphicsPanels.playerSpotlight.mapsPlayed', { defaultValue: '地图数' })}>
                  <input
                    style={{ ...UI.input, height: rowH, padding: '0 8px', textAlign: 'center', fontWeight: 900 }}
                    value={formData.mapsPlayed}
                    onChange={e => setFormData({ ...formData, mapsPlayed: e.target.value })}
                  />
                </Field>
              </div>

              <div style={{ gridColumn: 'span 2', minWidth: 0 }}>
                <Field label={tr('dataGraphicsPanels.playerSpotlight.playTime', { defaultValue: '上场时间' })}>
                  <input
                    style={{ ...UI.input, height: rowH, padding: '0 8px', textAlign: 'center', color: COLORS.yellow, fontWeight: 900 }}
                    value={formData.playTime}
                    onChange={e => setFormData({ ...formData, playTime: e.target.value })}
                  />
                </Field>
              </div>

              <div style={{ gridColumn: 'span 2', minWidth: 0 }}>
                <Field label={tr('dataGraphicsPanels.common.status', { defaultValue: '状态' })}>
                  <div
                    style={{
                      height: rowH,
                      border: '1px solid rgba(255,255,255,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: selectedPlayerId ? 'rgba(255,255,255,0.58)' : 'rgba(255,255,255,0.28)',
                      fontSize: 10,
                      fontWeight: 900,
                      letterSpacing: 1.1,
                      boxSizing: 'border-box',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {selectedPlayerId ? tr('dataGraphicsPanels.common.ready', { defaultValue: 'READY' }) : tr('dataGraphicsPanels.common.pending', { defaultValue: 'PENDING' })}
                  </div>
                </Field>
              </div>
            </div>
          </div>

          <div style={editorBlockStyle}>
            <div style={sectionTitleStyle}>{tr('dataGraphicsPanels.playerSpotlight.styleAndHero', { defaultValue: '风格与英雄池' })}</div>

            <div style={{ display: 'grid', gridTemplateColumns: '160px minmax(0,1fr)', gap: 10 }}>
              <Field label={tr('dataGraphicsPanels.playerSpotlight.styleTag', { defaultValue: '风格标签' })}>
                <input
                  style={{ ...UI.input, height: rowH, padding: '0 10px', textAlign: 'center', color: COLORS.yellow, fontWeight: 900 }}
                  value={formData.styleTag}
                  onChange={e => setFormData({ ...formData, styleTag: e.target.value })}
                />
              </Field>

              <Field label={tr('dataGraphicsPanels.playerSpotlight.heroPool', { defaultValue: '英雄池概览' })}>
                <input
                  style={{ ...UI.input, height: rowH, padding: '0 10px', textAlign: 'left' }}
                  value={formData.heroPool}
                  onChange={e => setFormData({ ...formData, heroPool: e.target.value, topHeroes: e.target.value })}
                />
              </Field>
            </div>

            <Field label={tr('dataGraphicsPanels.playerSpotlight.styleDesc', { defaultValue: '风格描述' })}>
              <input
                style={{ ...UI.input, height: rowH, padding: '0 10px', textAlign: 'left' }}
                value={formData.styleDesc}
                onChange={e => setFormData({ ...formData, styleDesc: e.target.value })}
              />
            </Field>
          </div>

          <div style={editorBlockStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={sectionTitleStyle}>{tr('dataGraphicsPanels.playerSpotlight.metricEditor', { defaultValue: '核心数据' })}</div>
              <div style={{ color: 'rgba(255,255,255,0.32)', fontSize: 10, fontWeight: 800, letterSpacing: 1 }}>
                {formData.metrics.length} SLOTS
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 10 }}>
              {formData.metrics.map((row, idx) => (
                <div key={`metric_${idx}`} style={metricCardStyle}>
                  <div style={{ ...fieldLabelStyle, color: 'rgba(255,255,255,0.38)' }}>
                    {tr('dataGraphicsPanels.playerSpotlight.metricSlot', { defaultValue: '数据槽 {{num}}', num: idx + 1 })}
                  </div>
                  <input
                    style={{
                      ...UI.input,
                      height: 30,
                      padding: '0 7px',
                      textAlign: 'center',
                      fontSize: 11,
                      fontWeight: 900,
                      backgroundColor: 'rgba(255,255,255,0.045)'
                    }}
                    value={row.label}
                    onChange={e => updateMetric(idx, 'label', e.target.value)}
                  />
                  <input
                    style={{
                      ...UI.input,
                      height: 36,
                      padding: '0 8px',
                      textAlign: 'center',
                      color: COLORS.yellow,
                      fontSize: 20,
                      fontWeight: 900
                    }}
                    value={row.value}
                    onChange={e => updateMetric(idx, 'value', e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            style={{
              ...UI.btn,
              height: 40,
              backgroundColor: COLORS.yellow,
              color: COLORS.black,
              fontWeight: 900,
              letterSpacing: '1px',
              fontSize: 13
            }}
            onClick={handleTake}
          >
            {tr('dataGraphicsPanels.playerSpotlight.takeButton', { defaultValue: '推送选手图文' })}
          </button>
        </div>
      </ShellPanel>
    </div>
  );
}