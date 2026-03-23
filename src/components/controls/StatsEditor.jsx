import React from 'react';
import { useMatchContext } from '../../contexts/MatchContext';
import { COLORS, UI, panelBase } from '../../constants/styles';
import { ShellPanel, Field, SectionHint } from '../common/SharedUI';
import { createEditorUi } from '../../utils/editorUi';

export default function StatsEditor({
  isUltra = false,
  density = 'standard',
  densityTokens
}) {
  const { matchData, updateData } = useMatchContext();

  const t = densityTokens || {
    blockGap: 10,
    panelPadding: '12px 14px',
    panelPaddingLg: '14px 16px',
    buttonPadding: '8px 10px',
    buttonFontSize: 12
  };

  const ui = createEditorUi(densityTokens, density);

  const rowH = density === 'spacious' ? 40 : 36;
  const gap = density === 'spacious' ? 10 : 8;
  const leftColWidth = density === 'spacious' ? '400px' : '370px';

  const statsVisibility = matchData.statsTemplateVisibility || {};
  const statsTemplateData = matchData.statsTemplateData || {};

  const controlInput = {
    ...ui.input,
    minHeight: rowH,
    height: rowH,
    boxSizing: 'border-box',
    paddingTop: 0,
    paddingBottom: 0,
    fontSize: density === 'spacious' ? '13px' : '12px'
  };

  const numberInputStyle = {
    ...controlInput,
    textAlign: 'center',
    paddingLeft: '6px',
    paddingRight: '6px',
    fontFamily: 'monospace',
    fontWeight: 900,
    fontSize: density === 'spacious' ? '18px' : '16px',
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${COLORS.line}`,
    color: COLORS.white
  };

  const actionBtn = {
    ...ui.actionBtn,
    minHeight: rowH,
    height: rowH,
    boxSizing: 'border-box',
    fontWeight: 900
  };

  const outlineBtn = {
    ...ui.outlineBtn,
    minHeight: rowH,
    height: rowH,
    boxSizing: 'border-box',
    fontWeight: 900
  };

  const modeBtn = active => ({
    border: 'none',
    cursor: 'pointer',
    minHeight: rowH,
    height: rowH,
    fontWeight: 900,
    fontSize: `${t.buttonFontSize}px`,
    backgroundColor: active ? COLORS.yellow : 'transparent',
    color: active ? COLORS.black : COLORS.softWhite,
    transition: 'background-color 0.2s, color 0.2s'
  });

  const handleStatsImageUpload = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return alert('Please upload an image file.');
    updateData({ ...matchData, statsImageTempUrl: URL.createObjectURL(file) });
    e.target.value = '';
  };

  const clearStatsTempImage = () => {
    if (matchData.statsImageTempUrl) URL.revokeObjectURL(matchData.statsImageTempUrl);
    updateData({ ...matchData, statsImageTempUrl: '' });
  };

  const toggleVisibility = visKey => {
    const current = statsVisibility[visKey] ?? true;
    updateData({
      ...matchData,
      statsTemplateVisibility: {
        ...statsVisibility,
        [visKey]: !current
      }
    });
  };

  const setStatValue = (key, value) => {
    updateData({
      ...matchData,
      statsTemplateData: {
        ...(matchData.statsTemplateData || {}),
        [key]: value
      }
    });
  };

  const statRows = [
    ['elims', 'Total Elims', 'elimsA', 'elimsB'],
    ['assists', 'Total Assists', 'assistsA', 'assistsB'],
    ['deaths', 'Total Deaths', 'deathsA', 'deathsB'],
    ['damage', 'Total Damage', 'damageA', 'damageB'],
    ['healing', 'Total Healing', 'healingA', 'healingB'],
    ['mitigated', 'Total Mitigated', 'mitigatedA', 'mitigatedB']
  ];

  const gridTemplateConfig = isUltra ? '48px 1fr 1fr' : '48px 190px 1fr 1fr';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: isUltra ? '1fr' : `${leftColWidth} minmax(0,1fr)`,
        gap: t.blockGap,
        alignItems: 'stretch'
      }}
    >
      <ShellPanel title="Stats Output Mode" accent density={density}>
        <div style={{ display: 'grid', gap }}>
          <Field label="Display Mode" density={density}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isUltra ? '1fr' : '1fr 1fr',
                backgroundColor: '#111',
                border: UI.innerFrame
              }}
            >
              <button
                style={modeBtn(matchData.statsMode === 'IMAGE')}
                onClick={() => updateData({ ...matchData, statsMode: 'IMAGE' })}
              >
                Image Upload
              </button>

              <button
                style={modeBtn(matchData.statsMode === 'TEMPLATE')}
                onClick={() => updateData({ ...matchData, statsMode: 'TEMPLATE' })}
              >
                Data Template
              </button>
            </div>
          </Field>

          <div
            style={{
              ...panelBase,
              padding: t.panelPadding,
              borderLeft: `3px solid ${matchData.statsMode === 'IMAGE' ? COLORS.yellow : 'rgba(255,255,255,0.08)'}`,
              display: 'grid',
              gap,
              alignContent: 'start'
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap,
                alignItems: 'center',
                paddingBottom: gap,
                borderBottom: `1px solid ${COLORS.line}`
              }}
            >
              <div>
                <div
                  style={{
                    color: COLORS.white,
                    fontWeight: 900,
                    fontSize: density === 'spacious' ? '13px' : '12px',
                    letterSpacing: '1px',
                    textTransform: 'uppercase'
                  }}
                >
                  Image Source
                </div>
                <div
                  style={{
                    color: COLORS.faintWhite,
                    fontSize: '10px',
                    marginTop: '4px',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase'
                  }}
                >
                  Image Mode
                </div>
              </div>

              <div
                style={{
                  minHeight: rowH,
                  height: rowH,
                  minWidth: '64px',
                  padding: '0 10px',
                  border: `1px solid ${matchData.statsImageTempUrl ? 'rgba(244,195,32,0.35)' : COLORS.line}`,
                  background: matchData.statsImageTempUrl ? 'rgba(244,195,32,0.14)' : 'rgba(255,255,255,0.02)',
                  color: matchData.statsImageTempUrl ? COLORS.yellow : COLORS.faintWhite,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 900,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  boxSizing: 'border-box',
                  whiteSpace: 'nowrap'
                }}
              >
                {matchData.statsImageTempUrl ? 'Temp' : 'Path'}
              </div>
            </div>

            <Field label="Image Path" density={density}>
              <input
                style={{ ...controlInput, fontWeight: 700 }}
                value={matchData.statsImagePath || ''}
                onChange={e => updateData({ ...matchData, statsImagePath: e.target.value })}
                placeholder="/assets/screenshots/scoreboard.png"
              />
            </Field>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isUltra ? '1fr' : '1fr 1fr',
                gap
              }}
            >
              <label
                style={{
                  ...actionBtn,
                  backgroundColor: COLORS.yellow,
                  color: COLORS.black,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  textAlign: 'center',
                  width: '100%'
                }}
              >
                Upload Image
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleStatsImageUpload} />
              </label>

              <button
                style={{
                  ...outlineBtn,
                  borderColor: COLORS.yellow,
                  color: COLORS.yellow
                }}
                onClick={() => updateData({ ...matchData, statsImagePath: '/assets/screenshots/scoreboard.png' })}
              >
                Default Path
              </button>
            </div>

            <button
              style={{
                ...outlineBtn,
                borderColor: COLORS.red,
                color: COLORS.red
              }}
              onClick={clearStatsTempImage}
            >
              Clear Temp Upload
            </button>

            <SectionHint
              text="Use a project image path or upload a temporary screenshot. Temporary uploads only persist for the current session."
              density={density}
            />
          </div>
        </div>
      </ShellPanel>

      <ShellPanel title="Template Data Input" accent density={density}>
        <div style={{ display: 'grid', gap }}>
          <div
            style={{
              ...panelBase,
              padding: t.panelPadding,
              display: 'grid',
              gap
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: gridTemplateConfig,
                gap,
                alignItems: 'center',
                paddingBottom: gap,
                borderBottom: `1px solid ${COLORS.line}`
              }}
            >
              <div
                style={{
                  color: COLORS.faintWhite,
                  fontSize: '10px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  textAlign: 'center',
                  letterSpacing: '0.12em'
                }}
              >
                Vis
              </div>

              {!isUltra && (
                <div
                  style={{
                    color: COLORS.faintWhite,
                    fontSize: '10px',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em'
                  }}
                >
                  Stat
                </div>
              )}

              <div
                style={{
                  textAlign: 'center',
                  color: COLORS.yellow,
                  fontWeight: 900,
                  fontSize: density === 'spacious' ? '15px' : '14px',
                  textTransform: 'uppercase',
                  minWidth: 0
                }}
              >
                {matchData.teamA || 'Team A'}
              </div>

              <div
                style={{
                  textAlign: 'center',
                  color: COLORS.yellow,
                  fontWeight: 900,
                  fontSize: density === 'spacious' ? '15px' : '14px',
                  textTransform: 'uppercase',
                  minWidth: 0
                }}
              >
                {matchData.teamB || 'Team B'}
              </div>
            </div>

            <div style={{ display: 'grid', gap }}>
              {statRows.map(([visKey, label, aKey, bKey]) => {
                const isVisible = statsVisibility[visKey] ?? true;

                return (
                  <div
                    key={visKey}
                    style={{
                      ...panelBase,
                      padding: t.panelPadding,
                      borderLeft: `3px solid ${isVisible ? COLORS.yellow : 'rgba(255,255,255,0.06)'}`,
                      opacity: isVisible ? 1 : 0.5,
                      transition: 'opacity 0.2s, border-color 0.2s'
                    }}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: gridTemplateConfig,
                        gap,
                        alignItems: 'center'
                      }}
                    >
                      <button
                        style={{
                          ...outlineBtn,
                          width: '100%',
                          padding: 0,
                          fontSize: '10px',
                          letterSpacing: '0.08em',
                          backgroundColor: isVisible ? COLORS.yellow : 'rgba(255,255,255,0.02)',
                          color: isVisible ? COLORS.black : COLORS.faintWhite,
                          border: `1px solid ${isVisible ? COLORS.yellow : COLORS.line}`,
                          boxShadow: 'none'
                        }}
                        onClick={() => toggleVisibility(visKey)}
                      >
                        {isVisible ? 'ON' : 'OFF'}
                      </button>

                      {!isUltra && (
                        <div
                          style={{
                            color: COLORS.white,
                            fontSize: density === 'spacious' ? '14px' : '13px',
                            fontWeight: 900,
                            letterSpacing: '0.4px',
                            textTransform: 'uppercase'
                          }}
                        >
                          {label}
                        </div>
                      )}

                      <div style={{ display: 'grid', gap: '4px' }}>
                        {isUltra && (
                          <div
                            style={{
                              color: COLORS.white,
                              fontSize: '10px',
                              fontWeight: 900,
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase'
                            }}
                          >
                            {label}
                          </div>
                        )}
                        <input
                          type="number"
                          style={numberInputStyle}
                          value={statsTemplateData[aKey] || ''}
                          onChange={e => setStatValue(aKey, e.target.value)}
                          disabled={!isVisible}
                        />
                      </div>

                      <input
                        type="number"
                        style={numberInputStyle}
                        value={statsTemplateData[bKey] || ''}
                        onChange={e => setStatValue(bKey, e.target.value)}
                        disabled={!isVisible}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <SectionHint
            text="Template mode automatically syncs scores, logos, and team names from Live. Use the VIS toggle to show or hide specific rows."
            density={density}
          />
        </div>
      </ShellPanel>
    </div>
  );
}