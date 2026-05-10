import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShellPanel } from '../common/SharedUI';
import { COLORS } from '../../constants/styles';
import { useMatchContext } from '../../contexts/MatchContext';

import PlayerSpotlightPanel from './graphics/PlayerSpotlightPanel';
import PlayerComparisonPanel from './graphics/PlayerComparisonPanel';
import TeamComparisonPanel from './graphics/TeamComparisonPanel';
import LeaderboardPanel from './graphics/LeaderboardPanel';
import MapProfilePanel from './graphics/MapProfilePanel';

const DEFAULT_DB_URL = 'https://stats.fries-cup.com/data/friescup_db.json';
const DB_CACHE_KEY = 'FCUP_DATA_GRAPHICS_DB_CACHE_V1';
const DB_URL_CACHE_KEY = 'FCUP_DATA_GRAPHICS_DB_URL_V1';
const GRAPHIC_TYPE_CACHE_KEY = 'FCUP_DATA_GRAPHICS_TYPE_V1';

const EMPTY_DB = { players: [], teams: [], matches: [], player_totals: [], meta: null };

const UI = {
  input: {
    width: '100%',
    background: 'transparent',
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
    transition: 'all 0.2s ease',
    textTransform: 'uppercase'
  }
};

const GRAPHIC_TYPES = [
  { key: 'PLAYER_SPOTLIGHT', labelKey: 'dataGraphicsEditor.tabs.playerSpotlight' },
  { key: 'PLAYER_COMPARISON', labelKey: 'dataGraphicsEditor.tabs.playerComparison' },
  { key: 'TEAM_COMPARISON', labelKey: 'dataGraphicsEditor.tabs.teamComparison' },
  { key: 'MAP_PROFILE', labelKey: 'dataGraphicsEditor.tabs.mapProfile' },
  { key: 'LEADERBOARD', labelKey: 'dataGraphicsEditor.tabs.leaderboard' }
];

const ROUTE_COMPONENTS = {
  PLAYER_SPOTLIGHT: PlayerSpotlightPanel,
  PLAYER_COMPARISON: PlayerComparisonPanel,
  TEAM_COMPARISON: TeamComparisonPanel,
  MAP_PROFILE: MapProfilePanel,
  LEADERBOARD: LeaderboardPanel
};

const safeReadStorage = key => {
  try { return localStorage.getItem(key); } catch { return null; }
};

const safeWriteStorage = (key, value) => {
  try { localStorage.setItem(key, value); } catch (err) { console.warn(`[SYS_WARN] localStorage write failed: ${key}`, err); }
};

const readCachedDb = () => {
  try {
    const raw = safeReadStorage(DB_CACHE_KEY);
    if (!raw) return EMPTY_DB;
    const payload = JSON.parse(raw);
    return payload?.db || EMPTY_DB;
  } catch (err) {
    console.warn('[SYS_WARN] DB cache parse failed:', err);
    return EMPTY_DB;
  }
};

const hasCachedDb = () => {
  try {
    const raw = safeReadStorage(DB_CACHE_KEY);
    if (!raw) return false;
    const payload = JSON.parse(raw);
    return !!payload?.db;
  } catch { return false; }
};

const cacheDb = (db, source = '') => {
  safeWriteStorage(DB_CACHE_KEY, JSON.stringify({ db: db || EMPTY_DB, source, cachedAt: Date.now() }));
};

const normalizeTeamText = value => String(value ?? '').trim();

const pickTeamValue = value => {
  if (!value) return '';
  if (typeof value === 'string' || typeof value === 'number') return normalizeTeamText(value);

  return normalizeTeamText(
    value.abbr ||
    value.short ||
    value.shortName ||
    value.code ||
    value.tag ||
    value.id ||
    value.teamId ||
    value.name ||
    value.fullName ||
    value.displayName
  );
};

const extractSideTeam = (matchData, side) => {
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
};

const resolveDbTeamValue = (rawTeam, db) => {
  const raw = normalizeTeamText(rawTeam);
  if (!raw) return '';

  const rawLower = raw.toLowerCase();
  const teams = Array.isArray(db?.teams) ? db.teams : [];

  const matched = teams.find(team => {
    const fields = [
      team.abbr,
      team.short,
      team.shortName,
      team.code,
      team.tag,
      team.id,
      team.teamId,
      team.name,
      team.fullName,
      team.displayName
    ];

    return fields.some(field => normalizeTeamText(field).toLowerCase() === rawLower);
  });

  return pickTeamValue(matched) || raw;
};

const railNavItemStyle = active => ({
  ...UI.btn,
  width: '100%',
  minHeight: 42,
  padding: '0 12px',
  background: active ? 'rgba(244,195,32,0.12)' : 'rgba(255,255,255,0.03)',
  color: active ? COLORS.yellow : COLORS.white,
  border: active ? `1px solid ${COLORS.yellow}` : '1px solid rgba(255,255,255,0.12)',
  justifyContent: 'flex-start',
  fontSize: 13,
  fontWeight: 900,
  letterSpacing: '0.4px'
});

export default function DataGraphicsEditor({ is1080Compact, density, densityTokens }) {
  const { t: tr } = useTranslation();
  const { matchData } = useMatchContext();

  const t = densityTokens || { panelPadding: '12px' };
  const controlRowHeight = is1080Compact ? '36px' : '40px';

  const [db, setDb] = useState(() => readCachedDb());
  const [dbUrl, setDbUrl] = useState(() => safeReadStorage(DB_URL_CACHE_KEY) || DEFAULT_DB_URL);
  const [dbStatus, setDbStatus] = useState(() => hasCachedDb() ? 'LOADED' : 'UNLOADED');
  const [graphicType, setGraphicTypeState] = useState(() => {
    const cachedType = safeReadStorage(GRAPHIC_TYPE_CACHE_KEY);
    return GRAPHIC_TYPES.some(item => item.key === cachedType) ? cachedType : 'PLAYER_SPOTLIGHT';
  });

  const currentMatchTeams = useMemo(() => {
    const rawTeamA = extractSideTeam(matchData, 'A');
    const rawTeamB = extractSideTeam(matchData, 'B');
    const teamA = resolveDbTeamValue(rawTeamA, db);
    const teamB = resolveDbTeamValue(rawTeamB, db);

    return {
      teamA,
      teamB,
      rawTeamA,
      rawTeamB,
      hasCurrentMatchTeams: !!teamA && !!teamB
    };
  }, [matchData, db]);

  const setGraphicType = key => {
    setGraphicTypeState(key);
    safeWriteStorage(GRAPHIC_TYPE_CACHE_KEY, key);
  };

  const commitDb = (nextDb, source = '') => {
    const safeDb = nextDb || EMPTY_DB;
    setDb(safeDb);
    setDbStatus('LOADED');
    cacheDb(safeDb, source);
  };

  const handleLoadDb = async () => {
    try {
      setDbStatus('LOADING');
      const res = await fetch(dbUrl, { cache: 'no-store' });
      if (!res.ok) throw new Error(`DB_LOAD_FAILED: ${res.status}`);
      const data = await res.json();

      commitDb(data || EMPTY_DB, dbUrl);
      safeWriteStorage(DB_URL_CACHE_KEY, dbUrl);
    } catch (err) {
      console.error('[SYS_ERR] DB Load Failed:', err);
      setDbStatus('ERROR');
    }
  };

  const handleFileUpload = e => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = event => {
      try {
        const parsed = JSON.parse(event.target.result);
        commitDb(parsed || EMPTY_DB, file.name);
        setDbUrl(tr('dataGraphicsEditor.localFileImported'));
      } catch (err) {
        console.error('[SYS_ERR] JSON Parse Failed:', err);
        setDbStatus('ERROR');
      }
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  const panelEnv = useMemo(
    () => ({
      db,
      dbStatus,
      density,
      densityTokens,
      is1080Compact,

      // 给涉及双方队伍的图文面板使用
      preferredTeamA: currentMatchTeams.teamA,
      preferredTeamB: currentMatchTeams.teamB,
      defaultTeamA: currentMatchTeams.teamA,
      defaultTeamB: currentMatchTeams.teamB,
      autoTeamA: currentMatchTeams.teamA,
      autoTeamB: currentMatchTeams.teamB,
      currentMatchTeams,
      autoPreferCurrentMatch: currentMatchTeams.hasCurrentMatchTeams
    }),
    [db, dbStatus, density, densityTokens, is1080Compact, currentMatchTeams]
  );

  const ActivePanel = ROUTE_COMPONENTS[graphicType] || PlayerSpotlightPanel;

  const loadButtonText = dbStatus === 'LOADING'
    ? tr('dataGraphicsEditor.loading')
    : dbStatus === 'LOADED'
      ? tr('dataGraphicsEditor.synced')
      : tr('dataGraphicsEditor.fetchData');

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '300px minmax(0, 1fr)',
        gap: 10,
        alignItems: 'start'
      }}
    >
      <div style={{ position: 'sticky', top: 10, alignSelf: 'start' }}>
        <ShellPanel
          title={tr('dataGraphicsEditor.globalNav')}
          accent
          density={density}
          bodyStyle={{ padding: t.panelPadding }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              style={{
                ...UI.input,
                height: controlRowHeight,
                padding: '0 12px',
                fontSize: 12,
                fontWeight: 700,
                fontFamily: 'monospace'
              }}
              value={dbUrl}
              onChange={e => setDbUrl(e.target.value)}
              placeholder={tr('dataGraphicsEditor.dataSourcePlaceholder')}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                style={{
                  ...UI.btn,
                  height: controlRowHeight,
                  backgroundColor: dbStatus === 'LOADED' ? '#2ecc71' : COLORS.yellow,
                  color: dbStatus === 'LOADED' ? '#fff' : COLORS.black,
                  fontWeight: 900,
                  letterSpacing: '1px',
                  fontSize: '12px',
                  border: dbStatus === 'LOADED' ? '1px solid #2ecc71' : `1px solid ${COLORS.yellow}`
                }}
                onClick={handleLoadDb}
              >
                {loadButtonText}
              </button>

              <label
                style={{
                  ...UI.btn,
                  height: controlRowHeight,
                  backgroundColor: 'transparent',
                  color: COLORS.white,
                  border: '1px solid rgba(255,255,255,0.2)',
                  fontWeight: 900,
                  letterSpacing: '1px',
                  fontSize: '12px'
                }}
              >
                {tr('dataGraphicsEditor.importJson')}
                <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileUpload} />
              </label>
            </div>

            {currentMatchTeams.hasCurrentMatchTeams && (
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
                AUTO MATCH TEAMS · {currentMatchTeams.teamA} VS {currentMatchTeams.teamB}
              </div>
            )}

            {(dbStatus === 'ERROR' || dbStatus === 'UNLOADED') && (
              <div
                style={{
                  border: `1px solid ${dbStatus === 'ERROR' ? 'rgba(255,77,77,0.32)' : 'rgba(255,255,255,0.12)'}`,
                  background: dbStatus === 'ERROR' ? 'rgba(255,77,77,0.06)' : 'rgba(255,255,255,0.025)',
                  color: dbStatus === 'ERROR' ? COLORS.red : 'rgba(255,255,255,0.7)',
                  padding: '9px 12px',
                  fontSize: 11,
                  fontWeight: 800,
                  lineHeight: 1.4
                }}
              >
                {dbStatus === 'ERROR' ? tr('dataGraphicsEditor.loadError') : tr('dataGraphicsEditor.unloadedHint')}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {GRAPHIC_TYPES.map(tab => (
                <button key={tab.key} style={railNavItemStyle(graphicType === tab.key)} onClick={() => setGraphicType(tab.key)}>
                  {tr(tab.labelKey)}
                </button>
              ))}
            </div>
          </div>
        </ShellPanel>
      </div>

      <div style={{ minWidth: 0 }}>
        <ActivePanel {...panelEnv} />
      </div>
    </div>
  );
}