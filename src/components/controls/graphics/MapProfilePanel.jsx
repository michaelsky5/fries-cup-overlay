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

// 🌟 修复 1：极致严谨的时钟字符串解析器
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

// 🌟 修复 2：支持多级嵌套的数据穿透抓取
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

// 🌟 修复 3：无死角的选手时间解析 (防0，防格式错乱)
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

// 🌟 核心引擎重构：精准算出【队伍真实比赛时长】
function sumStats(rawStats, fallbackMapMinutes = 0) {
  const result = { elims: 0, assists: 0, deaths: 0, damage: 0, healing: 0, mitigation: 0, teamMapMinutes: 0 };
  if (!rawStats) return result;

  // 判定是否是字典聚合物（直接是队伍总数据）
  if (rawStats.elims !== undefined || rawStats.damage !== undefined || rawStats.eliminations !== undefined) {
    result.elims = readStat(rawStats, ['eliminations', 'elims', 'elim', 'kills']);
    result.assists = readStat(rawStats, ['assists', 'ast']);
    result.deaths = readStat(rawStats, ['deaths', 'dth', 'death']);
    result.damage = readStat(rawStats, ['damage', 'dmg']);
    result.healing = readStat(rawStats, ['healing', 'heal']);
    result.mitigation = readStat(rawStats, ['mitigation', 'blocked', 'block']);
    // 队伍对象的时长，就是这张图打的时长
    result.teamMapMinutes = extractMapMinutes(rawStats) || fallbackMapMinutes;
  } else {
    // 处理选手数组
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
    // 如果没有地图宏观时长，就用 5个选手的总时间 / 5，反推出地图时长
    result.teamMapMinutes = fallbackMapMinutes > 0 ? fallbackMapMinutes : (totalPlayerMins / 5);
  }

  return result;
}

function formatPct(won, played) {
  if (!played) return '0%';
  return `${((won / played) * 100).toFixed(1)}%`;
}

// 🌟 修复 4：团队 Per 10 公式纠正！去除了倍增漏洞！
function formatPer10(total, teamMapMinutes, digits = 1) {
  if (!teamMapMinutes || teamMapMinutes <= 0) return digits > 0 ? '0.0' : '0';
  // 【正确公式】: 团队总数据 / 地图时长 * 10
  return ((toNum(total) / teamMapMinutes) * 10).toFixed(digits);
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
            teamMapMinutes: 0,
            _rawPlayerSum: 0 
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
        row.teamMapMinutes += stats.teamMapMinutes; // 累加队伍在这张图打过的总分钟数
      });
    });
  });

  // 阶段 2：降级兜底 - 从选手个人的 match_logs 反向拼凑地图数据
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
          teamMapMinutes: 0,
          _rawPlayerSum: 0 
        };
      }

      const row = bucket.teams[teamId];

      // 仅在主阶段解析失败时，才用这种粗暴的拼凑法
      if (row.teamMapMinutes <= 0 || row._isFallback) {
        row._isFallback = true;
        row.totals.elims += readStat(log, ['elims', 'eliminations', 'kills']);
        row.totals.assists += readStat(log, ['assists', 'ast']);
        row.totals.deaths += readStat(log, ['deaths', 'dth']);
        row.totals.damage += readStat(log, ['damage', 'dmg']);
        row.totals.healing += readStat(log, ['healing', 'heal']);
        row.totals.mitigation += readStat(log, ['blocked', 'mitigation']);
        row._rawPlayerSum += extractPlayerMinutes(log);
        row.teamMapMinutes = row._rawPlayerSum / 5; // 动态折算回队伍时长
      }
    });
  });

  return mapIndex;
}

function createDefaultRows() {
  return [
    { label: '地图胜率', valA: '0%', valB: '0%' },
    { label: '击杀 / 10分', valA: '0.0', valB: '0.0' },
    { label: '助攻 / 10分', valA: '0.0', valB: '0.0' },
    { label: '死亡 / 10分', valA: '0.0', valB: '0.0' },
    { label: '伤害 / 10分', valA: '0', valB: '0' },
    { label: '治疗 / 10分', valA: '0', valB: '0' }
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
  const { matchData, updateWithHistory, setPreviewScene, takeScene } = useMatchContext();
  const t = densityTokens || { panelPadding: '12px' };
  const rowH = is1080Compact ? '32px' : '36px';

  const [mapType, setMapType] = useState('');
  const [mapName, setMapName] = useState('');
  const [teamAId, setTeamAId] = useState('');
  const [teamBId, setTeamBId] = useState('');

  const [formData, setFormData] = useState({
    mapName: '地图名称',
    mapType: '模式',
    globalPlays: '0',
    teamA: '队伍 A',
    teamB: '队伍 B',
    recordA: '0-0',
    recordB: '0-0',
    rows: createDefaultRows()
  });

  const teamOptions = useMemo(() => {
    return safeArr(db?.teams).map(team => ({
      id: getTeamId(team),
      name: team?.team_name || '',
      short: team?.team_short_name || ''
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
      mapName: mapBucket?.mapName || mapName || '地图名称',
      mapType: mapBucket?.mapType || mapType || '模式',
      globalPlays: mapBucket ? String(mapBucket.globalPlays) : '0',
      teamA: teamA?.short || '队伍 A',
      teamB: teamB?.short || '队伍 B',
      recordA: rowA ? `${rowA.won}-${rowA.lost}` : '0-0',
      recordB: rowB ? `${rowB.won}-${rowB.lost}` : '0-0',
      rows: [
        { label: '地图胜率', valA: rowA ? formatPct(rowA.won, rowA.played) : '0%', valB: rowB ? formatPct(rowB.won, rowB.played) : '0%' },
        // 🌟 正确调用新版 formatPer10，传入 teamMapMinutes，不带 slotCount 杂质
        { label: '击杀 / 10分', valA: rowA ? formatPer10(rowA.totals.elims, rowA.teamMapMinutes, 1) : '0.0', valB: rowB ? formatPer10(rowB.totals.elims, rowB.teamMapMinutes, 1) : '0.0' },
        { label: '助攻 / 10分', valA: rowA ? formatPer10(rowA.totals.assists, rowA.teamMapMinutes, 1) : '0.0', valB: rowB ? formatPer10(rowB.totals.assists, rowB.teamMapMinutes, 1) : '0.0' },
        { label: '死亡 / 10分', valA: rowA ? formatPer10(rowA.totals.deaths, rowA.teamMapMinutes, 1) : '0.0', valB: rowB ? formatPer10(rowB.totals.deaths, rowB.teamMapMinutes, 1) : '0.0' },
        { label: '伤害 / 10分', valA: rowA ? formatPer10(rowA.totals.damage, rowA.teamMapMinutes, 0) : '0', valB: rowB ? formatPer10(rowB.totals.damage, rowB.teamMapMinutes, 0) : '0' },
        { label: '治疗 / 10分', valA: rowA ? formatPer10(rowA.totals.healing, rowA.teamMapMinutes, 0) : '0', valB: rowB ? formatPer10(rowB.totals.healing, rowB.teamMapMinutes, 0) : '0' }
      ]
    });
  }, [mapType, mapName, teamAId, teamBId, teamOptions, mapProfileIndex]);

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
      <ShellPanel title="自动填充" accent density={density} bodyStyle={{ padding: t.panelPadding }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <div style={labelStyle}>目标类型</div>
            <select
              style={{ ...UI.select, height: rowH, color: COLORS.yellow }}
              value={mapType}
              onChange={e => setMapType(e.target.value)}
              disabled={dbStatus !== 'LOADED'}
            >
              <option value="">-- 选择类型 --</option>
              {mapTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={labelStyle}>目标地图</div>
            <select
              style={{ ...UI.select, height: rowH, color: COLORS.yellow }}
              value={mapName}
              onChange={e => setMapName(e.target.value)}
              disabled={dbStatus !== 'LOADED'}
            >
              <option value="">-- 选择地图 --</option>
              {filteredMaps.map(m => (
                <option key={m.mapName} value={m.mapName}>
                  {m.mapName}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <div style={labelStyle}>左侧队伍</div>
              <select
                style={{ ...UI.select, height: rowH }}
                value={teamAId}
                onChange={e => setTeamAId(e.target.value)}
                disabled={dbStatus !== 'LOADED'}
              >
                <option value="">-- 选择队伍 A --</option>
                {teamOptions.map(t => (
                  <option key={`PRF_A_${t.id}`} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div style={labelStyle}>右侧队伍</div>
              <select
                style={{ ...UI.select, height: rowH }}
                value={teamBId}
                onChange={e => setTeamBId(e.target.value)}
                disabled={dbStatus !== 'LOADED'}
              >
                <option value="">-- 选择队伍 B --</option>
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
            交换左右
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={sourceCardStyle}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.46)', fontWeight: 800 }}>左侧来源</div>
              <div style={{ fontSize: 18, color: COLORS.white, fontWeight: 900, lineHeight: 1.1 }}>
                {formData.teamA}
              </div>
              <div style={{ fontSize: 11, color: COLORS.yellow, fontWeight: 800 }}>
                战绩 {formData.recordA}
              </div>
            </div>

            <div style={sourceCardStyle}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.46)', fontWeight: 800 }}>右侧来源</div>
              <div style={{ fontSize: 18, color: COLORS.white, fontWeight: 900, lineHeight: 1.1 }}>
                {formData.teamB}
              </div>
              <div style={{ fontSize: 11, color: COLORS.yellow, fontWeight: 800 }}>
                战绩 {formData.recordB}
              </div>
            </div>
          </div>
        </div>
      </ShellPanel>

      <ShellPanel title="资料编辑" accent density={density} bodyStyle={{ padding: t.panelPadding }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: 8 }}>
              <input
                style={{ ...UI.input, height: 34, fontSize: 16 }}
                value={formData.teamA}
                onChange={e => setFormData({ ...formData, teamA: e.target.value })}
                placeholder="队伍 A"
              />
              <input
                style={{ ...UI.input, height: 34, fontSize: 13 }}
                value={formData.recordA}
                onChange={e => setFormData({ ...formData, recordA: e.target.value })}
                placeholder="0-0"
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: 8 }}>
              <input
                style={{ ...UI.input, height: 34, fontSize: 16 }}
                value={formData.teamB}
                onChange={e => setFormData({ ...formData, teamB: e.target.value })}
                placeholder="队伍 B"
              />
              <input
                style={{ ...UI.input, height: 34, fontSize: 13 }}
                value={formData.recordB}
                onChange={e => setFormData({ ...formData, recordB: e.target.value })}
                placeholder="0-0"
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
            推送单图资料卡
          </button>
        </div>
      </ShellPanel>
    </div>
  );
}