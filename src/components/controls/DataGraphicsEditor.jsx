import React, { useMemo, useState } from 'react';
import { ShellPanel } from '../common/SharedUI';
import { COLORS } from '../../constants/styles';

import PlayerSpotlightPanel from './graphics/PlayerSpotlightPanel';
import LowerThirdsPanel from './graphics/LowerThirdsPanel';
import PlayerComparisonPanel from './graphics/PlayerComparisonPanel';
import TeamComparisonPanel from './graphics/TeamComparisonPanel';
import LeaderboardPanel from './graphics/LeaderboardPanel';
import MapPoolPanel from './graphics/MapPoolPanel';
import MapProfilePanel from './graphics/MapProfilePanel';

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

const EMPTY_DB = { players: [], teams: [], matches: [], player_totals: [], meta: null };

const GRAPHIC_TYPES = [
  { key: 'PLAYER_SPOTLIGHT', label: '选手聚焦' },
  { key: 'LOWER_THIRDS', label: '局内数据条' },
  { key: 'PLAYER_COMPARISON', label: '选手对位' },
  { key: 'TEAM_COMPARISON', label: '队伍对比' },
  { key: 'LEADERBOARD', label: '榜单快照' },
  { key: 'MAP_POOL', label: '地图池分析' },
  { key: 'MAP_PROFILE', label: '单图资料卡' }
];

const ROUTE_COMPONENTS = {
  PLAYER_SPOTLIGHT: PlayerSpotlightPanel,
  LOWER_THIRDS: LowerThirdsPanel,
  PLAYER_COMPARISON: PlayerComparisonPanel,
  TEAM_COMPARISON: TeamComparisonPanel,
  LEADERBOARD: LeaderboardPanel,
  MAP_POOL: MapPoolPanel,
  MAP_PROFILE: MapProfilePanel
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
  const t = densityTokens || { panelPadding: '12px' };
  const controlRowHeight = is1080Compact ? '36px' : '40px';

  const [db, setDb] = useState(EMPTY_DB);
  const [dbUrl, setDbUrl] = useState('https://stats.fries-cup.com/data/friescup_db.json');
  const [dbStatus, setDbStatus] = useState('UNLOADED');
  const [graphicType, setGraphicType] = useState('PLAYER_SPOTLIGHT');

  const handleLoadDb = async () => {
    try {
      setDbStatus('LOADING');
      const res = await fetch(dbUrl, { cache: 'no-store' });
      if (!res.ok) throw new Error(`DB_LOAD_FAILED: ${res.status}`);
      const data = await res.json();
      setDb(data || EMPTY_DB);
      setDbStatus('LOADED');
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
        setDb(parsed || EMPTY_DB);
        setDbStatus('LOADED');
        setDbUrl('LOCAL_FILE_IMPORTED');
      } catch (err) {
        console.error('[SYS_ERR] JSON Parse Failed:', err);
        setDbStatus('ERROR');
      }
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  const panelEnv = useMemo(
    () => ({ db, dbStatus, density, densityTokens, is1080Compact }),
    [db, dbStatus, density, densityTokens, is1080Compact]
  );

  const ActivePanel = ROUTE_COMPONENTS[graphicType] || PlayerSpotlightPanel;

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
          title="全局导航"
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
              placeholder="数据源地址"
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
                {dbStatus === 'LOADING' ? '加载中' : dbStatus === 'LOADED' ? '已同步' : '抓取数据'}
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
                导入 JSON
                <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileUpload} />
              </label>
            </div>

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
                {dbStatus === 'ERROR' ? '数据库加载失败，请检查链接或重新导入 JSON。' : '数据库未加载，请先抓取或导入数据。'}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {GRAPHIC_TYPES.map(tab => (
                <button key={tab.key} style={railNavItemStyle(graphicType === tab.key)} onClick={() => setGraphicType(tab.key)}>
                  {tab.label}
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