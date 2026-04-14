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

function normalizeText(v) {
  return typeof v === 'string' ? v.trim() : '';
}

export default function MapVetoPanel({ db, dbStatus, density, densityTokens, is1080Compact }) {
  const { matchData, updateWithHistory, setPreviewScene } = useMatchContext();
  const t = densityTokens || { panelPadding: '12px' };
  const rowH = is1080Compact ? '36px' : '40px';

  const [formData, setFormData] = useState({
    teamA: 'TEAM A',
    teamB: 'TEAM B',
    ban1: '',
    ban2: '',
    pick1: '',
    pick2: '',
    decider: ''
  });

  const uniqueMaps = useMemo(() => {
    const set = new Set();
    safeArr(db?.matches).forEach(match => {
      safeArr(match?.maps).forEach(map => {
        const name = normalizeText(map?.map_name);
        if (name) set.add(name);
      });
    });
    return Array.from(set).sort();
  }, [db]);

  const autofillTeamsFromMatch = () => {
    const nextTeamA =
      matchData?.teamA?.short ||
      matchData?.team_a?.short ||
      matchData?.teamAShort ||
      matchData?.teamAName ||
      matchData?.team_a?.name ||
      formData.teamA;

    const nextTeamB =
      matchData?.teamB?.short ||
      matchData?.team_b?.short ||
      matchData?.teamBShort ||
      matchData?.teamBName ||
      matchData?.team_b?.name ||
      formData.teamB;

    setFormData(prev => ({
      ...prev,
      teamA: nextTeamA || prev.teamA,
      teamB: nextTeamB || prev.teamB
    }));
  };

  useEffect(() => {
    autofillTeamsFromMatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTake = () => {
    updateWithHistory('Take Map Veto', {
      ...matchData,
      mapVetoData: formData,
      globalScene: 'MAP_VETO_SCENE'
    });
    if (setPreviewScene) setPreviewScene('MAP_VETO_SCENE');
  };

  const clearAll = () => {
    setFormData(prev => ({
      ...prev,
      ban1: '',
      ban2: '',
      pick1: '',
      pick2: '',
      decider: ''
    }));
  };

  const swapTeams = () => {
    setFormData(prev => ({
      ...prev,
      teamA: prev.teamB,
      teamB: prev.teamA,
      ban1: prev.ban2,
      ban2: prev.ban1,
      pick1: prev.pick2,
      pick2: prev.pick1
    }));
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
      <ShellPanel title="MAP_VETO_BUILDER // 赛前 BP 构建器" accent density={density} bodyStyle={{ padding: t.panelPadding }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: '880px' }}>
          <datalist id="map-veto-map-list">
            {uniqueMaps.map(map => (
              <option key={map} value={map} />
            ))}
          </datalist>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={labelStyle}>TEAM A NAME</div>
              <input
                style={{ ...UI.input, height: rowH, color: COLORS.yellow }}
                value={formData.teamA}
                onChange={e => setFormData({ ...formData, teamA: e.target.value })}
              />
            </div>
            <div>
              <div style={labelStyle}>TEAM B NAME</div>
              <input
                style={{ ...UI.input, height: rowH, color: COLORS.yellow }}
                value={formData.teamB}
                onChange={e => setFormData({ ...formData, teamB: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              style={{
                ...UI.btn,
                height: '34px',
                padding: '0 12px',
                background: 'rgba(255,255,255,0.05)',
                color: COLORS.white,
                border: '1px solid rgba(255,255,255,0.14)',
                fontWeight: 800,
                fontSize: '11px'
              }}
              onClick={autofillTeamsFromMatch}
            >
              AUTO LOAD CURRENT MATCH
            </button>

            <button
              style={{
                ...UI.btn,
                height: '34px',
                padding: '0 12px',
                background: 'rgba(255,255,255,0.05)',
                color: COLORS.white,
                border: '1px solid rgba(255,255,255,0.14)',
                fontWeight: 800,
                fontSize: '11px'
              }}
              onClick={swapTeams}
            >
              SWAP SIDES
            </button>

            <button
              style={{
                ...UI.btn,
                height: '34px',
                padding: '0 12px',
                background: 'rgba(255,255,255,0.05)',
                color: COLORS.white,
                border: '1px solid rgba(255,255,255,0.14)',
                fontWeight: 800,
                fontSize: '11px'
              }}
              onClick={clearAll}
            >
              CLEAR MAPS
            </button>
          </div>

          <div style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', margin: '4px 0' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, alignItems: 'center' }}>
            <div style={{ ...labelStyle, color: COLORS.red, textAlign: 'right' }}>TEAM A BAN:</div>
            <input
              list="map-veto-map-list"
              style={{ ...UI.input, height: rowH }}
              value={formData.ban1}
              onChange={e => setFormData({ ...formData, ban1: e.target.value })}
              placeholder="Map Name..."
            />

            <div style={{ ...labelStyle, color: COLORS.red, textAlign: 'right' }}>TEAM B BAN:</div>
            <input
              list="map-veto-map-list"
              style={{ ...UI.input, height: rowH }}
              value={formData.ban2}
              onChange={e => setFormData({ ...formData, ban2: e.target.value })}
              placeholder="Map Name..."
            />

            <div style={{ ...labelStyle, color: '#2ecc71', textAlign: 'right' }}>TEAM A PICK:</div>
            <input
              list="map-veto-map-list"
              style={{ ...UI.input, height: rowH }}
              value={formData.pick1}
              onChange={e => setFormData({ ...formData, pick1: e.target.value })}
              placeholder="Map Name..."
            />

            <div style={{ ...labelStyle, color: '#2ecc71', textAlign: 'right' }}>TEAM B PICK:</div>
            <input
              list="map-veto-map-list"
              style={{ ...UI.input, height: rowH }}
              value={formData.pick2}
              onChange={e => setFormData({ ...formData, pick2: e.target.value })}
              placeholder="Map Name..."
            />

            <div style={{ ...labelStyle, color: COLORS.yellow, textAlign: 'right' }}>DECIDER:</div>
            <input
              list="map-veto-map-list"
              style={{ ...UI.input, height: rowH }}
              value={formData.decider}
              onChange={e => setFormData({ ...formData, decider: e.target.value })}
              placeholder="Tiebreaker Map..."
            />
          </div>

          <div
            style={{
              border: '1px solid rgba(255,255,255,0.10)',
              background: 'rgba(255,255,255,0.03)',
              padding: '12px 14px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10
            }}
          >
            <div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 800 }}>LEFT SIDE</div>
              <div style={{ fontSize: 16, color: COLORS.white, fontWeight: 900 }}>{formData.teamA}</div>
              <div style={{ fontSize: 11, color: COLORS.red, fontWeight: 800 }}>BAN: {formData.ban1 || '-'}</div>
              <div style={{ fontSize: 11, color: '#2ecc71', fontWeight: 800 }}>PICK: {formData.pick1 || '-'}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 800 }}>RIGHT SIDE</div>
              <div style={{ fontSize: 16, color: COLORS.white, fontWeight: 900 }}>{formData.teamB}</div>
              <div style={{ fontSize: 11, color: COLORS.red, fontWeight: 800 }}>BAN: {formData.ban2 || '-'}</div>
              <div style={{ fontSize: 11, color: '#2ecc71', fontWeight: 800 }}>PICK: {formData.pick2 || '-'}</div>
            </div>
            <div style={{ gridColumn: '1 / -1', borderTop: '1px dashed rgba(255,255,255,0.08)', paddingTop: 8 }}>
              <div style={{ fontSize: 11, color: COLORS.yellow, fontWeight: 900 }}>DECIDER: {formData.decider || '-'}</div>
            </div>
          </div>

          <button
            style={{ ...UI.btn, height: '48px', backgroundColor: COLORS.yellow, color: COLORS.black, fontWeight: 900 }}
            onClick={handleTake}
          >
            TAKE_VETO_BOARD // 推送 BP 展板
          </button>
        </div>
      </ShellPanel>
    </div>
  );
}