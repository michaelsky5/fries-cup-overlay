import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShellPanel } from '../common/SharedUI';
import { COLORS } from '../../constants/styles';

// 🌟 只导入季后赛模式保留的核心数据面板
import PlayerSpotlightPanel from './graphics/PlayerSpotlightPanel';
import PlayerComparisonPanel from './graphics/PlayerComparisonPanel';
import TeamComparisonPanel from './graphics/TeamComparisonPanel';
import LeaderboardPanel from './graphics/LeaderboardPanel';
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

// 🌟 导航栏裁剪：只保留季后赛所需的 5 个核心入口
const GRAPHIC_TYPES = [
  { key: 'PLAYER_SPOTLIGHT', labelKey: 'dataGraphicsEditor.tabs.playerSpotlight' },
  { key: 'PLAYER_COMPARISON', labelKey: 'dataGraphicsEditor.tabs.playerComparison' },
  { key: 'TEAM_COMPARISON', labelKey: 'dataGraphicsEditor.tabs.teamComparison' },
  { key: 'MAP_PROFILE', labelKey: 'dataGraphicsEditor.tabs.mapProfile' },
  { key: 'LEADERBOARD', labelKey: 'dataGraphicsEditor.tabs.leaderboard' }
];

// 🌟 路由映射同步更新
const ROUTE_COMPONENTS = {
  PLAYER_SPOTLIGHT: PlayerSpotlightPanel,
  PLAYER_COMPARISON: PlayerComparisonPanel,
  TEAM_COMPARISON: TeamComparisonPanel,
  MAP_PROFILE: MapProfilePanel,
  LEADERBOARD: LeaderboardPanel
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
    () => ({ db, dbStatus, density, densityTokens, is1080Compact }),
    [db, dbStatus, density, densityTokens, is1080Compact]
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