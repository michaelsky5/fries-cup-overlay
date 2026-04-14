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

const ROLE_SLOTS = { TANK: 1, DPS: 2, SUP: 2 };

function normalizeRole(role) {
  const r = toText(role).trim().toUpperCase();
  if (r === 'SUPPORT' || r === 'SUP') return 'SUP';
  if (r === 'DAMAGE' || r === 'DPS') return 'DPS';
  if (r === 'TANK') return 'TANK';
  return '';
}

function getTeamId(team) {
  return team?.team_id || team?.id || '';
}

function getMapKeyFromLog(log, idx) {
  const matchId = log?.matchId || log?.match_id || log?.matchDisplayName || log?.match_display_name || 'MATCH';
  const mapOrder = log?.mapOrder ?? log?.map_order ?? idx;
  return `${matchId}__${mapOrder}`;
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

function getDefaultOverallMetrics() {
  return [
    createMetricRow('全队击杀 / 10分'),
    createMetricRow('全队助攻 / 10分'),
    createMetricRow('全队死亡 / 10分'),
    createMetricRow('全队伤害 / 10分'),
    createMetricRow('全队治疗 / 10分'),
    createMetricRow('全队承伤 / 10分')
  ];
}

function getDefaultRoleMetrics() {
  return {
    TANK: [
      createMetricRow('击杀 / 10分'),
      createMetricRow('助攻 / 10分'),
      createMetricRow('死亡 / 10分'),
      createMetricRow('伤害 / 10分'),
      createMetricRow('治疗 / 10分'),
      createMetricRow('承伤 / 10分')
    ],
    DPS: [
      createMetricRow('击杀 / 10分'),
      createMetricRow('助攻 / 10分'),
      createMetricRow('死亡 / 10分'),
      createMetricRow('伤害 / 10分'),
      createMetricRow('治疗 / 10分'),
      createMetricRow('承伤 / 10分')
    ],
    SUP: [
      createMetricRow('击杀 / 10分'),
      createMetricRow('助攻 / 10分'),
      createMetricRow('死亡 / 10分'),
      createMetricRow('伤害 / 10分'),
      createMetricRow('治疗 / 10分'),
      createMetricRow('承伤 / 10分')
    ]
  };
}

function createTeamRow(team) {
  return {
    teamId: toText(getTeamId(team)),
    teamName: toText(team?.team_name || team?.name || ''),
    teamShort: toText(team?.team_short_name || team?.short || team?.team_name || ''),
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

function finalizeTeamRow(team) {
  const mapsPlayed = team.mapsSet.size;
  const teamEquivalentMinutes = team.overallRawPlayerMinutes > 0 ? team.overallRawPlayerMinutes / 5 : 0;

  return {
    teamId: toText(team.teamId),
    teamName: toText(team.teamName),
    teamShort: toText(team.teamShort),
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

function buildTeamAnalytics(db) {
  const teamMap = new Map();
  const rosterPlayers = safeArr(db?.players);
  const totalRows = safeArr(db?.player_totals);

  safeArr(db?.teams).forEach(team => {
    const id = getTeamId(team);
    if (!id) return;
    teamMap.set(id, createTeamRow(team));
  });

  rosterPlayers.forEach(player => {
    const teamId = getTeamId(player) || player?.team_short_name || '';
    if (!teamId) return;

    if (!teamMap.has(teamId)) {
      teamMap.set(teamId, createTeamRow({
        team_id: teamId,
        team_name: player?.team_name || player?.team_short_name || '',
        team_short_name: player?.team_short_name || player?.team_name || ''
      }));
    }

    const teamRow = teamMap.get(teamId);
    const logs = safeArr(player?.match_logs).filter(log => toNum(log?.playtimeMinutes) > 0);

    logs.forEach((log, idx) => {
      const role = normalizeRole(log?.role || player?.role);
      if (!role || !teamRow.roleBuckets[role]) return;

      const totals = {
        elims: toNum(log?.totals?.elims),
        assists: toNum(log?.totals?.assists),
        deaths: toNum(log?.totals?.deaths),
        damage: toNum(log?.totals?.damage),
        healing: toNum(log?.totals?.healing),
        mitigation: toNum(log?.totals?.blocked)
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

  if (!hasLogData && totalRows.length) {
    totalRows.forEach((row, idx) => {
      const teamId = row?.team_id || row?.team_short_name || `team_${idx}`;
      const role = normalizeRole(row?.role);
      if (!role || !ROLE_SLOTS[role]) return;

      if (!teamMap.has(teamId)) {
        teamMap.set(teamId, createTeamRow({
          team_id: teamId,
          team_name: row?.team_name || row?.team_short_name || '',
          team_short_name: row?.team_short_name || row?.team_name || ''
        }));
      }

      const teamRow = teamMap.get(teamId);
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

  return Array.from(teamMap.values()).map(finalizeTeamRow).sort((a, b) => toText(a.teamShort).localeCompare(toText(b.teamShort)));
}

function buildTeamPreset(teamA, teamB) {
  const roleRows = role => [
    createMetricRow('击杀 / 10分', teamA?.roles?.[role]?.elimsPer10 || '0.0', teamB?.roles?.[role]?.elimsPer10 || '0.0'),
    createMetricRow('助攻 / 10分', teamA?.roles?.[role]?.assistsPer10 || '0.0', teamB?.roles?.[role]?.assistsPer10 || '0.0'),
    createMetricRow('死亡 / 10分', teamA?.roles?.[role]?.deathsPer10 || '0.0', teamB?.roles?.[role]?.deathsPer10 || '0.0'),
    createMetricRow('伤害 / 10分', teamA?.roles?.[role]?.damagePer10 || '0.0', teamB?.roles?.[role]?.damagePer10 || '0.0'),
    createMetricRow('治疗 / 10分', teamA?.roles?.[role]?.healingPer10 || '0.0', teamB?.roles?.[role]?.healingPer10 || '0.0'),
    createMetricRow('承伤 / 10分', teamA?.roles?.[role]?.mitigationPer10 || '0.0', teamB?.roles?.[role]?.mitigationPer10 || '0.0')
  ];

  return {
    nameA: teamA?.teamShort || teamA?.teamName || '',
    nameB: teamB?.teamShort || teamB?.teamName || '',
    mapsA: String(teamA?.mapsPlayed || 0),
    mapsB: String(teamB?.mapsPlayed || 0),
    timeA: teamA?.playTime || '-',
    timeB: teamB?.playTime || '-',
    overallMetrics: [
      createMetricRow('全队击杀 / 10分', teamA?.overall?.elimsPer10 || '0.0', teamB?.overall?.elimsPer10 || '0.0'),
      createMetricRow('全队助攻 / 10分', teamA?.overall?.assistsPer10 || '0.0', teamB?.overall?.assistsPer10 || '0.0'),
      createMetricRow('全队死亡 / 10分', teamA?.overall?.deathsPer10 || '0.0', teamB?.overall?.deathsPer10 || '0.0'),
      createMetricRow('全队伤害 / 10分', teamA?.overall?.damagePer10 || '0.0', teamB?.overall?.damagePer10 || '0.0'),
      createMetricRow('全队治疗 / 10分', teamA?.overall?.healingPer10 || '0.0', teamB?.overall?.healingPer10 || '0.0'),
      createMetricRow('全队承伤 / 10分', teamA?.overall?.mitigationPer10 || '0.0', teamB?.overall?.mitigationPer10 || '0.0')
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

export default function TeamComparisonPanel({ db, dbStatus, density, densityTokens, is1080Compact }) {
  const { matchData, updateWithHistory, setPreviewScene } = useMatchContext();
  const t = densityTokens || { panelPadding: '12px' };
  const rowH = is1080Compact ? '34px' : '38px';

  const [teamAId, setTeamAId] = useState('');
  const [teamBId, setTeamBId] = useState('');
  const [expandedRoles, setExpandedRoles] = useState({ TANK: false, DPS: false, SUP: false });

  const [formData, setFormData] = useState({
    nameA: '',
    nameB: '',
    mapsA: '0',
    mapsB: '0',
    timeA: '-',
    timeB: '-',
    overallMetrics: getDefaultOverallMetrics(),
    roleMetrics: getDefaultRoleMetrics()
  });

  const teamPool = useMemo(() => buildTeamAnalytics(db), [db]);
  const selectedTeamA = useMemo(() => teamPool.find(t => t.teamId === teamAId) || null, [teamPool, teamAId]);
  const selectedTeamB = useMemo(() => teamPool.find(t => t.teamId === teamBId) || null, [teamPool, teamBId]);

  useEffect(() => {
    if (!selectedTeamA && !selectedTeamB) return;
    setFormData(buildTeamPreset(selectedTeamA, selectedTeamB));
  }, [selectedTeamA, selectedTeamB]);

  const autoTopTwo = () => {
    const sorted = [...teamPool].sort(
      (a, b) => parseFloat(b?.overall?.damagePer10 || 0) - parseFloat(a?.overall?.damagePer10 || 0)
    );
    if (sorted[0]) setTeamAId(sorted[0].teamId);
    if (sorted[1]) setTeamBId(sorted[1].teamId);
  };

  const swapSides = () => {
    setFormData(prev => ({
      ...prev,
      nameA: prev.nameB,
      nameB: prev.nameA,
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
      ...formData,
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

    updateWithHistory('Take Team Comparison', {
      ...matchData,
      teamComparisonData: payload,
      dataGraphics: { type: 'TEAM_COMPARISON', payload },
      globalScene: 'TEAM_COMPARISON_SCENE'
    });

    if (setPreviewScene) setPreviewScene('TEAM_COMPARISON_SCENE');
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '360px minmax(0,1fr)', gap: 10, alignItems: 'start' }}>
      <ShellPanel title="自动填充" accent density={density} bodyStyle={{ padding: t.panelPadding }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button style={UI.chip(false)} onClick={autoTopTwo}>自动前二</button>
            <button style={UI.chip(false)} onClick={swapSides}>交换左右</button>
          </div>

          <div>
            <div style={labelStyle}>左侧队伍</div>
            <select
              style={{ ...UI.select, height: rowH, color: COLORS.yellow }}
              value={teamAId}
              onChange={e => setTeamAId(e.target.value)}
              disabled={dbStatus !== 'LOADED'}
            >
              <option value="">-- 选择队伍 A --</option>
              {teamPool.map(team => (
                <option key={`TA_${team.teamId}`} value={team.teamId}>
                  {team.teamName}
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
              <option value="">-- 选择队伍 B --</option>
              {teamPool.map(team => (
                <option key={`TB_${team.teamId}`} value={team.teamId}>
                  {team.teamName}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={sourceCardStyle}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.46)', fontWeight: 800 }}>左侧来源</div>
              <div style={{ fontSize: 18, color: COLORS.white, fontWeight: 900, lineHeight: 1.1 }}>
                {selectedTeamA?.teamShort || '待选择'}
              </div>
              <div style={{ fontSize: 11, color: COLORS.yellow, fontWeight: 800 }}>
                {selectedTeamA ? `${selectedTeamA.mapsPlayed} 图 · ${selectedTeamA.playTime}` : '-'}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.56)', fontWeight: 700 }}>
                {selectedTeamA ? `全队伤害 / 10分 ${selectedTeamA.overall.damagePer10}` : '暂无数据'}
              </div>
            </div>

            <div style={sourceCardStyle}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.46)', fontWeight: 800 }}>右侧来源</div>
              <div style={{ fontSize: 18, color: COLORS.white, fontWeight: 900, lineHeight: 1.1 }}>
                {selectedTeamB?.teamShort || '待选择'}
              </div>
              <div style={{ fontSize: 11, color: COLORS.yellow, fontWeight: 800 }}>
                {selectedTeamB ? `${selectedTeamB.mapsPlayed} 图 · ${selectedTeamB.playTime}` : '-'}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.56)', fontWeight: 700 }}>
                {selectedTeamB ? `全队伤害 / 10分 ${selectedTeamB.overall.damagePer10}` : '暂无数据'}
              </div>
            </div>
          </div>
        </div>
      </ShellPanel>

      <ShellPanel title="资料编辑" accent density={density} bodyStyle={{ padding: t.panelPadding }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: COLORS.yellow, letterSpacing: '0.4px' }}>
            团队整体数据
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
            {[
              { key: 'TANK', title: '坦克'},
              { key: 'DPS', title: '输出'},
              { key: 'SUP', title: '辅助'}
            ].map(section => (
              <div key={section.key} style={roleSectionStyle}>
                <button
                  type="button"
                  style={collapseHeadStyle}
                  onClick={() => toggleRole(section.key)}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: COLORS.yellow, letterSpacing: '0.4px' }}>
                      {section.title}
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.46)', fontWeight: 700 }}>
                      {section.summary}
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
            推送队伍对比
          </button>
        </div>
      </ShellPanel>
    </div>
  );
}