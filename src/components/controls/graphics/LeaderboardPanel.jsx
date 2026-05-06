import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMatchContext } from '../../../contexts/MatchContext';
import { ShellPanel } from '../../common/SharedUI';
import { COLORS, labelStyle } from '../../../constants/styles';

const PLAYOFF_TEAMS = ['NGP', 'TNS', 'YOU', 'ZS', 'HYW', 'SPC', 'XCFN.G', 'FG'];

const PLAYER_METRICS = [
  { key: 'avg_dmg', labelKey: 'dataGraphicsPanels.metrics.dmgPer10', label: '伤害 / 10分', titleKey: 'dataGraphicsPanels.leaderboard.playerDmgTitle', title: '选手伤害榜', subtitleKey: 'dataGraphicsPanels.leaderboard.playerSubtitle', subtitle: '季后赛选手数据快照', metricLabel: 'DMG / 10 MIN', dec: 0 },
  { key: 'avg_elim', labelKey: 'dataGraphicsPanels.metrics.elimPer10', label: '击杀 / 10分', titleKey: 'dataGraphicsPanels.leaderboard.playerElimTitle', title: '选手击杀榜', subtitleKey: 'dataGraphicsPanels.leaderboard.playerSubtitle', subtitle: '季后赛选手数据快照', metricLabel: 'ELIM / 10 MIN', dec: 1 },
  { key: 'avg_ast', labelKey: 'dataGraphicsPanels.metrics.astPer10', label: '助攻 / 10分', titleKey: 'dataGraphicsPanels.leaderboard.playerAstTitle', title: '选手助攻榜', subtitleKey: 'dataGraphicsPanels.leaderboard.playerSubtitle', subtitle: '季后赛选手数据快照', metricLabel: 'AST / 10 MIN', dec: 1 },
  { key: 'avg_heal', labelKey: 'dataGraphicsPanels.metrics.healPer10', label: '治疗 / 10分', titleKey: 'dataGraphicsPanels.leaderboard.playerHealTitle', title: '选手治疗榜', subtitleKey: 'dataGraphicsPanels.leaderboard.playerSubtitle', subtitle: '季后赛选手数据快照', metricLabel: 'HEAL / 10 MIN', dec: 0 },
  { key: 'avg_block', labelKey: 'dataGraphicsPanels.metrics.mitPer10', label: '承伤 / 10分', titleKey: 'dataGraphicsPanels.leaderboard.playerMitTitle', title: '选手承伤榜', subtitleKey: 'dataGraphicsPanels.leaderboard.playerSubtitle', subtitle: '季后赛选手数据快照', metricLabel: 'MIT / 10 MIN', dec: 0 }
];

const TEAM_METRICS = [
  { key: 'match_win_rate', labelKey: 'dataGraphicsPanels.metrics.matchWinRate', label: '大场胜率', titleKey: 'dataGraphicsPanels.leaderboard.teamMatchWinTitle', title: '队伍大场胜率榜', subtitleKey: 'dataGraphicsPanels.leaderboard.teamSubtitle', subtitle: '季后赛队伍数据快照', metricLabel: 'MATCH WIN RATE', dec: 1, suffix: '%' },
  { key: 'map_win_rate', labelKey: 'dataGraphicsPanels.metrics.mapWinRate', label: '小局胜率', titleKey: 'dataGraphicsPanels.leaderboard.teamMapWinTitle', title: '队伍小局胜率榜', subtitleKey: 'dataGraphicsPanels.leaderboard.teamSubtitle', subtitle: '季后赛队伍数据快照', metricLabel: 'MAP WIN RATE', dec: 1, suffix: '%' },
  { key: 'avg_dmg', labelKey: 'dataGraphicsPanels.metrics.dmgPer10', label: '伤害 / 10分', titleKey: 'dataGraphicsPanels.leaderboard.teamDmgTitle', title: '队伍伤害榜', subtitleKey: 'dataGraphicsPanels.leaderboard.teamSubtitle', subtitle: '季后赛队伍数据快照', metricLabel: 'TEAM DMG / 10 MIN', dec: 0 },
  { key: 'avg_elim', labelKey: 'dataGraphicsPanels.metrics.elimPer10', label: '击杀 / 10分', titleKey: 'dataGraphicsPanels.leaderboard.teamElimTitle', title: '队伍击杀榜', subtitleKey: 'dataGraphicsPanels.leaderboard.teamSubtitle', subtitle: '季后赛队伍数据快照', metricLabel: 'TEAM ELIM / 10 MIN', dec: 1 },
  { key: 'avg_heal', labelKey: 'dataGraphicsPanels.metrics.healPer10', label: '治疗 / 10分', titleKey: 'dataGraphicsPanels.leaderboard.teamHealTitle', title: '队伍治疗榜', subtitleKey: 'dataGraphicsPanels.leaderboard.teamSubtitle', subtitle: '季后赛队伍数据快照', metricLabel: 'TEAM HEAL / 10 MIN', dec: 0 },
  { key: 'avg_block', labelKey: 'dataGraphicsPanels.metrics.mitPer10', label: '承伤 / 10分', titleKey: 'dataGraphicsPanels.leaderboard.teamMitTitle', title: '队伍承伤榜', subtitleKey: 'dataGraphicsPanels.leaderboard.teamSubtitle', subtitle: '季后赛队伍数据快照', metricLabel: 'TEAM MIT / 10 MIN', dec: 0 }
];

const HERO_SLUG_MAP = {
  'd.va': 'dva',
  dva: 'dva',
  doomfist: 'doomfist',
  hazard: 'hazard',
  junkerqueen: 'junker-queen',
  'junker queen': 'junker-queen',
  mauga: 'mauga',
  orisa: 'orisa',
  ramattra: 'ramattra',
  reinhardt: 'reinhardt',
  roadhog: 'roadhog',
  sigma: 'sigma',
  winston: 'winston',
  wreckingball: 'wrecking-ball',
  'wrecking ball': 'wrecking-ball',
  zarya: 'zarya',
  ashe: 'ashe',
  bastion: 'bastion',
  cassidy: 'cassidy',
  echo: 'echo',
  genji: 'genji',
  hanzo: 'hanzo',
  junkrat: 'junkrat',
  mei: 'mei',
  pharah: 'pharah',
  reaper: 'reaper',
  sojourn: 'sojourn',
  soldier76: 'soldier-76',
  'soldier 76': 'soldier-76',
  sombra: 'sombra',
  symmetra: 'symmetra',
  torbjorn: 'torbjorn',
  tracer: 'tracer',
  venture: 'venture',
  widowmaker: 'widowmaker',
  ana: 'ana',
  baptiste: 'baptiste',
  brigitte: 'brigitte',
  illari: 'illari',
  juno: 'juno',
  kiriko: 'kiriko',
  lifeweaver: 'lifeweaver',
  lucio: 'lucio',
  mercy: 'mercy',
  moira: 'moira',
  zenyatta: 'zenyatta',
  探奇: 'venture'
};

const UI = {
  input: {
    width: '100%',
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(255,255,255,0.14)',
    color: COLORS.white,
    outline: 'none',
    boxSizing: 'border-box',
    padding: '0 10px',
    fontWeight: 900
  },
  chip: active => ({
    border: active ? `1px solid ${COLORS.yellow}` : '1px solid rgba(255,255,255,0.12)',
    background: active ? 'rgba(244,195,32,0.13)' : 'rgba(255,255,255,0.04)',
    color: active ? COLORS.yellow : COLORS.white,
    cursor: 'pointer',
    fontWeight: 900,
    fontSize: 11,
    minHeight: 34,
    padding: '0 10px',
    width: '100%',
    letterSpacing: '0.4px'
  }),
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

const cardStyle = {
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.025)',
  padding: '12px',
  display: 'flex',
  flexDirection: 'column',
  gap: 8
};

const safeArr = v => Array.isArray(v) ? v : [];
const toNum = v => (Number.isFinite(Number(v)) ? Number(v) : 0);
const safeText = v => String(v ?? '').trim();
const normaliseShort = v => safeText(v).toUpperCase();

function slugifyHeroName(value) {
  const raw = safeText(value);
  if (!raw) return '';

  const lower = raw.toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  if (HERO_SLUG_MAP[raw]) return HERO_SLUG_MAP[raw];
  if (HERO_SLUG_MAP[lower]) return HERO_SLUG_MAP[lower];

  return lower.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function roleFolders(role) {
  const r = safeText(role).toUpperCase();

  if (r === 'TANK') return ['tank'];
  if (r === 'SUP' || r === 'SUPPORT') return ['support'];
  if (r === 'DPS' || r === 'DAMAGE') return ['damage', 'dps'];

  return ['tank', 'damage', 'dps', 'support'];
}

function resolveNickname(row) {
  return safeText(row?.nickname) ||
    safeText(row?.display_name) ||
    safeText(row?.displayName) ||
    safeText(row?.name) ||
    safeText(row?.player_nickname) ||
    safeText(row?.playerNickname) ||
    safeText(row?.player_id) ||
    safeText(row?.playerId) ||
    'Unknown';
}

function resolveBattleTag(row) {
  return safeText(row?.battletag) ||
    safeText(row?.battle_tag) ||
    safeText(row?.battleTag) ||
    safeText(row?.battleTagName) ||
    safeText(row?.bnet) ||
    safeText(row?.bnet_id) ||
    safeText(row?.account) ||
    safeText(row?.player_name) ||
    safeText(row?.playerName) ||
    safeText(row?.account_name) ||
    safeText(row?.accountName) ||
    '';
}

function pickHeroName(row) {
  const direct = [
    row?.heroName,
    row?.hero,
    row?.main_hero,
    row?.mainHero,
    row?.common_hero,
    row?.commonHero,
    row?.most_played_hero,
    row?.mostPlayedHero,
    row?.signature_hero,
    row?.signatureHero,
    row?.top_hero,
    row?.topHero
  ].map(safeText).find(Boolean);

  if (direct) return direct;

  const heroRows = safeArr(row?.heroes || row?.hero_stats || row?.heroStats || row?.hero_pool || row?.heroPool);
  const firstHero = heroRows[0];

  if (typeof firstHero === 'string') return firstHero;

  return safeText(firstHero?.hero) ||
    safeText(firstHero?.heroName) ||
    safeText(firstHero?.name) ||
    safeText(firstHero?.id) ||
    '';
}

function buildArtworkCandidates(row) {
  const directHero = [
    row?.heroImage,
    row?.hero_image,
    row?.heroIcon,
    row?.hero_icon,
    row?.image,
    row?.icon
  ].map(safeText).filter(Boolean);

  const directRoster = [
    row?.rosterImage,
    row?.roster_image,
    row?.rosterArt,
    row?.roster_art,
    row?.fullImage,
    row?.full_image
  ].map(safeText).filter(Boolean);

  const heroName = pickHeroName(row);
  const slug = slugifyHeroName(heroName);
  const folders = roleFolders(row?.role);

  const heroInferred = slug ? folders.map(folder => `/assets/heroes/${folder}/${slug}.png`) : [];
  const rosterInferred = slug ? folders.map(folder => `/assets/roster/${folder}/${slug}.png`) : [];

  return {
    heroName,
    heroImages: [...new Set([...directHero, ...heroInferred])],
    rosterImages: [...new Set([...directRoster, ...rosterInferred])]
  };
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

function extractPlayerMinutes(row) {
  const targets = [row, row?.totals, row?.stats];

  for (const target of targets) {
    if (!target || typeof target !== 'object') continue;

    const minuteFields = [
      'playtimeMinutes',
      'time_played_minutes',
      'timePlayedMinutes',
      'minutes',
      'play_time_minutes',
      'duration_minutes',
      'time_minutes',
      'raw_time_mins'
    ];

    for (const key of minuteFields) {
      const n = Number(target[key]);
      if (Number.isFinite(n) && n > 0) return n;
    }

    const secondFields = [
      'playtimeSeconds',
      'time_played_seconds',
      'timePlayedSeconds',
      'seconds',
      'duration_seconds',
      'time_seconds'
    ];

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

function sumStats(rows = []) {
  return safeArr(rows).reduce(
    (acc, row) => {
      acc.elims += readStat(row, ['eliminations', 'elims', 'elim', 'kills']);
      acc.assists += readStat(row, ['assists', 'ast']);
      acc.deaths += readStat(row, ['deaths', 'dth', 'death']);
      acc.damage += readStat(row, ['damage', 'dmg']);
      acc.healing += readStat(row, ['healing', 'heal']);
      acc.mitigation += readStat(row, ['mitigation', 'blocked', 'block']);
      acc.playerMins += extractPlayerMinutes(row);
      return acc;
    },
    { elims: 0, assists: 0, deaths: 0, damage: 0, healing: 0, mitigation: 0, playerMins: 0 }
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
    const logs = safeArr(player?.match_logs);

    let totalElim = 0;
    let totalAst = 0;
    let totalDth = 0;
    let totalDmg = 0;
    let totalHeal = 0;
    let totalBlock = 0;
    let totalMinutes = 0;

    logs.forEach(log => {
      const mins = extractPlayerMinutes(log);
      if (mins <= 0) return;

      totalMinutes += mins;
      totalElim += readStat(log, ['eliminations', 'elims', 'elim', 'kills']);
      totalAst += readStat(log, ['assists', 'ast']);
      totalDth += readStat(log, ['deaths', 'dth', 'death']);
      totalDmg += readStat(log, ['damage', 'dmg']);
      totalHeal += readStat(log, ['healing', 'heal']);
      totalBlock += readStat(log, ['mitigation', 'blocked', 'block']);
    });

    const per10 = value => (totalMinutes > 0 ? (value / totalMinutes) * 10 : 0);

    return {
      ...player,
      player_id: player?.player_id || `fallback_${idx}`,
      display_name: resolveNickname(player),
      nickname: safeText(player?.nickname) || resolveNickname(player),
      battletag: resolveBattleTag(player),
      team_id: player?.team_id || '',
      team_short_name: player?.team_short_name || '',
      role: player?.role || 'FLEX',
      maps_played: logs.length,
      raw_time_mins: totalMinutes,
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
      total_block: 0,
      total_player_mins: 0
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
    const hasSeriesResult = match?.status === 'COMPLETE' || match?.status === 'COMPLETED' || scoreA !== scoreB;

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
      rowA.total_player_mins += statsA.playerMins;

      rowB.total_elim += statsB.elims;
      rowB.total_ast += statsB.assists;
      rowB.total_dth += statsB.deaths;
      rowB.total_dmg += statsB.damage;
      rowB.total_heal += statsB.healing;
      rowB.total_block += statsB.mitigation;
      rowB.total_player_mins += statsB.playerMins;
    });
  });

  const teamArr = Array.from(teamIndex.values());
  const hasMatchData = teamArr.some(t => t.total_player_mins > 0);

  if (!hasMatchData && safeArr(db?.player_totals).length) {
    safeArr(db.player_totals).forEach(row => {
      const teamId = row?.team_id || row?.team_short_name;
      if (!teamId) return;

      if (!teamIndex.has(teamId)) {
        teamIndex.set(teamId, {
          team_id: teamId,
          team_name: row?.team_name,
          team_short_name: row?.team_short_name,
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
          total_block: 0,
          total_player_mins: 0
        });
      }

      const t = teamIndex.get(teamId);
      const mins = extractPlayerMinutes(row) || Math.max(1, toNum(row?.raw_time_mins));

      t.total_player_mins += mins;
      t.total_elim += (toNum(row?.avg_elim) * mins) / 10;
      t.total_ast += (toNum(row?.avg_ast) * mins) / 10;
      t.total_dth += (toNum(row?.avg_dth) * mins) / 10;
      t.total_dmg += (toNum(row?.avg_dmg) * mins) / 10;
      t.total_heal += (toNum(row?.avg_heal) * mins) / 10;
      t.total_block += (toNum(row?.avg_block) * mins) / 10;
    });
  }

  return Array.from(teamIndex.values()).map(team => {
    const teamMins = team.total_player_mins > 0 ? team.total_player_mins / 5 : 0;
    const per10 = val => (teamMins > 0 ? (val / teamMins) * 10 : 0);

    return {
      ...team,
      match_win_rate: team.matches_played > 0 ? (team.wins / team.matches_played) * 100 : 0,
      map_win_rate: team.maps_played > 0 ? (team.maps_won / team.maps_played) * 100 : 0,
      avg_elim: per10(team.total_elim),
      avg_ast: per10(team.total_ast),
      avg_dth: per10(team.total_dth),
      avg_dmg: per10(team.total_dmg),
      avg_heal: per10(team.total_heal),
      avg_block: per10(team.total_block)
    };
  });
}

function formatValue(value, metric) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '-';
  return `${n.toFixed(metric.dec ?? 0)}${metric.suffix || ''}`;
}

function createEmptyRows(metricLabel) {
  return Array.from({ length: 8 }, (_, i) => ({
    rank: i + 1,
    name: '-',
    battleTag: '',
    sub: '-',
    value: '-',
    metricLabel,
    heroName: '',
    heroImage: '',
    heroImages: [],
    rosterImage: '',
    rosterImages: []
  }));
}

function buildRows({ source, boardType, metric, metricKey }) {
  const sorted = [...source]
    .filter(row => Number.isFinite(Number(row?.[metricKey])))
    .sort((a, b) => Number(b?.[metricKey]) - Number(a?.[metricKey]))
    .slice(0, 8);

  const rows = sorted.map((row, i) => {
    if (boardType === 'PLAYER') {
      const name = resolveNickname(row);
      const battleTag = resolveBattleTag(row);
      const teamShort = safeText(row.team_short_name) || '-';
      const role = safeText(row.role) || 'FLEX';
      const artwork = buildArtworkCandidates(row);

      return {
        rank: i + 1,
        name,
        battleTag,
        sub: [teamShort, role].filter(Boolean).join(' · '),
        teamShort,
        role,
        value: formatValue(row[metricKey], metric),
        metricLabel: metric.metricLabel,
        heroName: artwork.heroName,
        heroImage: artwork.heroImages[0] || '',
        heroImages: artwork.heroImages,
        rosterImage: artwork.rosterImages[0] || '',
        rosterImages: artwork.rosterImages
      };
    }

    return {
      rank: i + 1,
      name: safeText(row.team_short_name) || 'Unknown',
      battleTag: '',
      sub: safeText(row.team_name) || '-',
      teamShort: safeText(row.team_short_name) || '',
      role: '',
      value: formatValue(row[metricKey], metric),
      metricLabel: metric.metricLabel,
      heroName: '',
      heroImage: '',
      heroImages: [],
      rosterImage: '',
      rosterImages: []
    };
  });

  return [...rows, ...createEmptyRows(metric.metricLabel)].slice(0, 8).map((row, i) => ({ ...row, rank: i + 1 }));
}

function ChipButton({ active, onClick, children, style }) {
  return (
    <button type="button" style={{ ...UI.chip(active), ...style }} onClick={onClick}>
      {children}
    </button>
  );
}

function SectionTitle({ children, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <div style={labelStyle}>{children}</div>
      {right ? (
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.36)', fontWeight: 800 }}>
          {right}
        </div>
      ) : null}
    </div>
  );
}

export default function LeaderboardPanel({ db, dbStatus, density, densityTokens, is1080Compact }) {
  const { t: tr } = useTranslation();
  const { matchData, updateWithHistory, setPreviewScene } = useMatchContext();
  const t = densityTokens || { panelPadding: '12px' };
  const rowH = is1080Compact ? 28 : 32;

  const [boardType, setBoardType] = useState('PLAYER');
  const [metricKey, setMetricKey] = useState('avg_dmg');
  const [teamFilterMode, setTeamFilterMode] = useState('PLAYOFF_TOP8');

  const localizeMetric = metric => ({
    ...metric,
    label: tr(metric.labelKey, { defaultValue: metric.label }),
    title: tr(metric.titleKey, { defaultValue: metric.title }),
    subtitle: tr(metric.subtitleKey, { defaultValue: metric.subtitle })
  });

  const metricOptions = useMemo(
    () => (boardType === 'PLAYER' ? PLAYER_METRICS : TEAM_METRICS).map(localizeMetric),
    [boardType, tr]
  );

  const activeMetric = useMemo(() => {
    return metricOptions.find(m => m.key === metricKey) || metricOptions[0];
  }, [metricOptions, metricKey]);

  const [formData, setFormData] = useState({
    boardType: 'PLAYER',
    metricKey: 'avg_dmg',
    title: '选手伤害榜',
    subtitle: '季后赛选手数据快照',
    metricLabel: 'DMG / 10 MIN',
    rows: createEmptyRows('DMG / 10 MIN')
  });

  const allowTeam = teamShort => {
    const short = normaliseShort(teamShort);
    if (teamFilterMode === 'ALL') return true;
    return PLAYOFF_TEAMS.includes(short);
  };

  const playerPool = useMemo(() => {
    const totals = safeArr(db?.player_totals).length ? safeArr(db.player_totals) : buildFallbackPlayerTotals(db?.players);
    return totals.filter(player => allowTeam(player?.team_short_name));
  }, [db, teamFilterMode]);

  const teamPool = useMemo(() => {
    return buildTeamTotals(db).filter(team => allowTeam(team?.team_short_name));
  }, [db, teamFilterMode]);

  const generatedRows = useMemo(() => {
    const source = boardType === 'PLAYER' ? playerPool : teamPool;

    return buildRows({
      source,
      boardType,
      metric: activeMetric,
      metricKey: activeMetric.key
    });
  }, [boardType, playerPool, teamPool, activeMetric]);

  useEffect(() => {
    if (boardType === 'PLAYER' && !PLAYER_METRICS.some(m => m.key === metricKey)) setMetricKey('avg_dmg');
    if (boardType === 'TEAM' && !TEAM_METRICS.some(m => m.key === metricKey)) setMetricKey('match_win_rate');
  }, [boardType, metricKey]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      boardType,
      metricKey: activeMetric.key,
      title: activeMetric.title,
      subtitle: activeMetric.subtitle,
      metricLabel: activeMetric.metricLabel,
      rows: generatedRows
    }));
  }, [boardType, activeMetric, generatedRows]);

  const updateRow = (index, field, value) => {
    setFormData(prev => {
      const newRows = [...prev.rows];

      if (field === 'heroName') {
        const patched = { ...newRows[index], heroName: value, hero: value };
        const artwork = buildArtworkCandidates(patched);

        newRows[index] = {
          ...patched,
          heroName: value,
          heroImage: artwork.heroImages[0] || '',
          heroImages: artwork.heroImages,
          rosterImage: artwork.rosterImages[0] || '',
          rosterImages: artwork.rosterImages
        };
      } else {
        newRows[index] = { ...newRows[index], [field]: value };
      }

      return { ...prev, rows: newRows };
    });
  };

  const resetByAutoSort = () => {
    setFormData(prev => ({
      ...prev,
      boardType,
      metricKey: activeMetric.key,
      title: activeMetric.title,
      subtitle: activeMetric.subtitle,
      metricLabel: activeMetric.metricLabel,
      rows: generatedRows
    }));
  };

  const handleTake = () => {
    updateWithHistory('Take Leaderboard Snapshot', {
      ...matchData,
      leaderboardData: {
        ...formData,
        boardType,
        metricKey: activeMetric.key,
        metricLabel: formData.metricLabel || activeMetric.metricLabel,
        generatedAt: 'FCUP 2026'
      },
      globalScene: 'LEADERBOARD_SCENE'
    });

    if (setPreviewScene) setPreviewScene('LEADERBOARD_SCENE');
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: is1080Compact ? '1fr' : '360px minmax(0,1fr)',
        gap: 10,
        alignItems: 'start'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <ShellPanel title={tr('dataGraphicsPanels.leaderboard.sourceTitle', { defaultValue: '榜单来源 / SOURCE' })} accent density={density} bodyStyle={{ padding: t.panelPadding }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <SectionTitle>{tr('dataGraphicsPanels.leaderboard.boardType', { defaultValue: '榜单类型' })}</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <ChipButton active={boardType === 'PLAYER'} onClick={() => setBoardType('PLAYER')}>
                  {tr('dataGraphicsPanels.leaderboard.playerBoard', { defaultValue: '选手榜单' })}
                </ChipButton>
                <ChipButton active={boardType === 'TEAM'} onClick={() => setBoardType('TEAM')}>
                  {tr('dataGraphicsPanels.leaderboard.teamBoard', { defaultValue: '队伍榜单' })}
                </ChipButton>
              </div>
            </div>

            <div>
              <SectionTitle>{tr('dataGraphicsPanels.common.dataScope', { defaultValue: '数据范围' })}</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <ChipButton active={teamFilterMode === 'PLAYOFF_TOP8'} onClick={() => setTeamFilterMode('PLAYOFF_TOP8')}>
                  {tr('dataGraphicsPanels.common.playoffTop8', { defaultValue: '八强' })}
                </ChipButton>
                <ChipButton active={teamFilterMode === 'ALL'} onClick={() => setTeamFilterMode('ALL')}>
                  {tr('dataGraphicsPanels.common.all', { defaultValue: '全部' })}
                </ChipButton>
              </div>
            </div>
          </div>
        </ShellPanel>

        <ShellPanel title={tr('dataGraphicsPanels.leaderboard.metricTitle', { defaultValue: '统计维度 / METRIC' })} accent density={density} bodyStyle={{ padding: t.panelPadding }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
                opacity: dbStatus === 'LOADED' ? 1 : 0.36,
                pointerEvents: dbStatus === 'LOADED' ? 'auto' : 'none'
              }}
            >
              {metricOptions.map((m, idx) => (
                <ChipButton
                  key={m.key}
                  active={metricKey === m.key}
                  onClick={() => setMetricKey(m.key)}
                  style={{
                    gridColumn: metricOptions.length % 2 !== 0 && idx === metricOptions.length - 1 ? '1 / -1' : 'auto'
                  }}
                >
                  {m.label}
                </ChipButton>
              ))}
            </div>

            <div
              style={{
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(0,0,0,0.18)',
                padding: '10px 12px',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.42)', fontWeight: 800, marginBottom: 5 }}>
                {tr('dataGraphicsPanels.leaderboard.currentGenerated', { defaultValue: '当前生成' })}
              </div>

              <div
                style={{
                  color: COLORS.white,
                  fontSize: 16,
                  fontWeight: 950,
                  lineHeight: 1.1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {activeMetric?.title || tr('dataGraphicsPanels.common.unselected', { defaultValue: '未选择' })}
              </div>

              <div
                style={{
                  color: COLORS.yellow,
                  fontSize: 10,
                  fontWeight: 900,
                  letterSpacing: 1.4,
                  marginTop: 5
                }}
              >
                {activeMetric?.metricLabel || 'METRIC'}
              </div>
            </div>

            <button
              type="button"
              style={{
                ...UI.btn,
                width: '100%',
                height: 36,
                background: 'rgba(255,255,255,0.08)',
                color: COLORS.white,
                border: '1px solid rgba(255,255,255,0.12)',
                fontWeight: 900,
                fontSize: 11,
                letterSpacing: 0.8
              }}
              onClick={resetByAutoSort}
            >
              {tr('dataGraphicsPanels.leaderboard.regenerate', { defaultValue: '重新生成榜单' })}
            </button>
          </div>
        </ShellPanel>
      </div>

      <ShellPanel title={tr('dataGraphicsPanels.leaderboard.outputTitle', { defaultValue: '手动覆写与推送 / OUTPUT' })} accent density={density} bodyStyle={{ padding: t.panelPadding }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={cardStyle}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr 170px', gap: 8 }}>
              <div>
                <SectionTitle>{tr('dataGraphicsPanels.common.mainTitle', { defaultValue: '主标题' })}</SectionTitle>
                <input
                  style={{ ...UI.input, height: rowH, fontSize: 14, color: COLORS.yellow, padding: '0 12px' }}
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div>
                <SectionTitle>{tr('dataGraphicsPanels.common.subtitle', { defaultValue: '副标题' })}</SectionTitle>
                <input
                  style={{ ...UI.input, height: rowH, fontSize: 12, color: 'rgba(255,255,255,0.7)', padding: '0 12px' }}
                  value={formData.subtitle}
                  onChange={e => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                />
              </div>

              <div>
                <SectionTitle>{tr('dataGraphicsPanels.leaderboard.metricDisplay', { defaultValue: '指标显示' })}</SectionTitle>
                <input
                  style={{ ...UI.input, height: rowH, fontSize: 11, color: COLORS.white, padding: '0 12px' }}
                  value={formData.metricLabel}
                  onChange={e => setFormData(prev => ({ ...prev, metricLabel: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ borderTop: '1px dashed rgba(255,255,255,0.12)', margin: '2px 0' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {formData.rows.map((row, idx) => (
                <div
                  key={`edit_row_${idx}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '42px minmax(0,1fr) minmax(0,1fr) minmax(0,0.9fr) 104px 104px',
                    gap: 8,
                    alignItems: 'center'
                  }}
                >
                  <div
                    style={{
                      height: rowH,
                      border: idx === 0 ? `1px solid ${COLORS.yellow}` : '1px solid rgba(255,255,255,0.12)',
                      background: idx === 0 ? 'rgba(244,195,32,0.13)' : 'rgba(255,255,255,0.035)',
                      color: idx === 0 ? COLORS.yellow : COLORS.white,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 950,
                      fontSize: 13,
                      fontVariantNumeric: 'tabular-nums'
                    }}
                  >
                    #{row.rank}
                  </div>

                  <input
                    style={{ ...UI.input, height: rowH, fontSize: 12, color: idx === 0 ? COLORS.yellow : COLORS.white }}
                    value={row.name}
                    onChange={e => updateRow(idx, 'name', e.target.value)}
                    placeholder={tr('dataGraphicsPanels.common.nickname', { defaultValue: '昵称' })}
                  />

                  <input
                    style={{ ...UI.input, height: rowH, fontSize: 11, color: 'rgba(255,255,255,0.62)' }}
                    value={row.battleTag || ''}
                    onChange={e => updateRow(idx, 'battleTag', e.target.value)}
                    placeholder={tr('dataGraphicsPanels.common.battleTag', { defaultValue: '战网名' })}
                  />

                  <input
                    style={{ ...UI.input, height: rowH, fontSize: 11, color: 'rgba(255,255,255,0.64)' }}
                    value={row.sub}
                    onChange={e => updateRow(idx, 'sub', e.target.value)}
                    placeholder={tr('dataGraphicsPanels.common.teamRole', { defaultValue: '队伍 / 职责' })}
                  />

                  <input
                    style={{
                      ...UI.input,
                      height: rowH,
                      fontSize: 11,
                      color: idx <= 2 ? COLORS.yellow : 'rgba(255,255,255,0.36)',
                      opacity: idx <= 2 ? 1 : 0.38,
                      pointerEvents: idx <= 2 ? 'auto' : 'none'
                    }}
                    value={row.heroName || ''}
                    onChange={e => updateRow(idx, 'heroName', e.target.value)}
                    placeholder={tr('dataGraphicsPanels.common.hero', { defaultValue: '英雄' })}
                  />

                  <input
                    style={{
                      ...UI.input,
                      height: rowH,
                      fontSize: 12,
                      color: COLORS.yellow,
                      textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums'
                    }}
                    value={row.value}
                    onChange={e => updateRow(idx, 'value', e.target.value)}
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            style={{
              ...UI.btn,
              width: '100%',
              height: 46,
              backgroundColor: COLORS.yellow,
              color: COLORS.black || '#2a2a2a',
              fontWeight: 950,
              letterSpacing: 1.2,
              fontSize: 13
            }}
            onClick={handleTake}
          >
            {tr('dataGraphicsPanels.leaderboard.takeButton', { defaultValue: '推送榜单图文 / TAKE LEADERBOARD' })}
          </button>
        </div>
      </ShellPanel>
    </div>
  );
}