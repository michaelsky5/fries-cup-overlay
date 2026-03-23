import React from 'react';
import { useMatchContext } from '../../contexts/MatchContext';
import { ShellPanel, SectionHint } from '../common/SharedUI';
import { COLORS, panelBase } from '../../constants/styles';
import { createEditorUi } from '../../utils/editorUi';

export default function TeamDBEditor({
  density = 'standard',
  densityTokens,
  isDense = false,
  isUltra = false
}) {
  const { matchData, updateWithHistory, showModal } = useMatchContext();
  const library = matchData.rosterPresetLibrary || [];
  const t = densityTokens || {
    blockGap: 10,
    panelPadding: '12px 14px'
  };
  const ui = createEditorUi(densityTokens, density);

  const exportDB = () => {
    navigator.clipboard
      .writeText(JSON.stringify(library, null, 2))
      .then(() =>
        showModal({
          type: 'alert',
          title: 'EXPORT SUCCESS',
          message: 'Team database JSON has been copied to the clipboard.'
        })
      );
  };

  const importDB = () => {
    showModal({
      type: 'prompt',
      title: 'IMPORT TEAM DATABASE',
      message: 'Paste the team database JSON below. Existing records with the same KEY will be replaced.',
      onConfirm: data => {
        if (!data) return;
        try {
          const parsed = JSON.parse(data);
          if (!Array.isArray(parsed)) throw new Error('Invalid format');

          const currentLib = [...library];
          parsed.forEach(newTeam => {
            const idx = currentLib.findIndex(t => t.key === newTeam.key);
            if (idx >= 0) currentLib[idx] = newTeam;
            else currentLib.push(newTeam);
          });

          updateWithHistory('Import team database', {
            ...matchData,
            rosterPresetLibrary: currentLib
          });

          showModal({
            type: 'alert',
            title: 'IMPORT SUCCESS',
            message: `${parsed.length} team record(s) imported successfully.`
          });
        } catch (e) {
          showModal({
            type: 'alert',
            title: 'IMPORT FAILED',
            message: 'Invalid JSON format or unsupported data structure.',
            isDanger: true
          });
        }
      }
    });
  };

  const deleteTeam = key => {
    showModal({
      type: 'confirm',
      title: 'DELETE TEAM',
      isDanger: true,
      message: `Delete team [${key}] from the database permanently?`,
      onConfirm: () => {
        updateWithHistory(`Delete team: ${key}`, {
          ...matchData,
          rosterPresetLibrary: library.filter(t => t.key !== key)
        });
      }
    });
  };

  const cardMinWidth = isUltra
    ? '1fr'
    : isDense
      ? 'minmax(260px, 1fr)'
      : density === 'spacious'
        ? 'minmax(340px, 1fr)'
        : 'minmax(300px, 1fr)';

  const labelStyle = {
    fontSize: density === 'spacious' ? '11px' : '10px',
    color: COLORS.faintWhite,
    fontWeight: 900,
    letterSpacing: '1.3px',
    textTransform: 'uppercase'
  };

  const valueStyle = {
    fontSize: density === 'spacious' ? '12px' : '11px',
    color: COLORS.softWhite,
    fontWeight: 700,
    lineHeight: 1.45,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  };

  return (
    <div style={{ display: 'grid', gap: t.blockGap }}>
      <ShellPanel title="Global Team Database" accent density={density}>
        <div style={{ display: 'grid', gap: t.blockGap }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isUltra ? '1fr' : '1fr 1fr',
              gap: '10px'
            }}
          >
            <button
              style={{
                ...ui.outlineBtn,
                borderColor: COLORS.yellow,
                color: COLORS.yellow,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '900',
                padding: '12px'
              }}
              onClick={exportDB}
            >
              EXPORT TEAM DB
            </button>

            <button
              style={{
                ...ui.actionBtn,
                backgroundColor: COLORS.yellow,
                color: COLORS.black,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '900',
                padding: '12px'
              }}
              onClick={importDB}
            >
              IMPORT TEAM DB JSON
            </button>
          </div>

          <SectionHint
            text="Team records are generated from saved roster presets. Import them here, then load them directly in LIVE."
            density={density}
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isUltra ? '1fr' : `repeat(auto-fill, ${cardMinWidth})`,
              gap: '12px',
              marginTop: '4px',
              alignItems: 'stretch'
            }}
          >
            {library.map(team => {
              const players = team.data?.players || [];
              const playerNames = players
                .map(p => p.nickname || p.battleTag)
                .filter(Boolean);

              const hasLogo = !!(team.data?.logo || team.data?.logoPath || team.data?.teamLogo);

              return (
                <div
                  key={team.key}
                  style={{
                    ...panelBase,
                    padding: t.panelPadding,
                    borderLeft: `3px solid ${COLORS.yellow}`,
                    height: '100%',
                    display: 'grid',
                    gridTemplateRows: 'auto auto 1fr',
                    gap: '12px',
                    boxSizing: 'border-box'
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: '10px',
                      alignItems: 'start'
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          color: COLORS.white,
                          fontWeight: 900,
                          fontSize: density === 'spacious' ? '17px' : '16px',
                          textTransform: 'uppercase',
                          lineHeight: 1.15,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {team.name}
                      </div>

                      <div
                        style={{
                          color: COLORS.faintWhite,
                          fontSize: '11px',
                          marginTop: '5px',
                          letterSpacing: '0.04em',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        KEY: {team.key}
                      </div>
                    </div>

                    <button
                      style={{
                        ...ui.outlineBtn,
                        borderColor: COLORS.red,
                        color: COLORS.red,
                        minWidth: isDense ? '68px' : '74px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '6px'
                      }}
                      onClick={() => deleteTeam(team.key)}
                    >
                      DELETE
                    </button>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isDense ? '1fr' : 'repeat(3, minmax(0, 1fr))',
                      gap: '8px'
                    }}
                  >
                    <div
                      style={{
                        border: `1px solid ${COLORS.line}`,
                        background: 'rgba(255,255,255,0.02)',
                        padding: '8px 10px',
                        display: 'grid',
                        gap: '3px',
                        minWidth: 0
                      }}
                    >
                      <div style={labelStyle}>Logo</div>
                      <div style={valueStyle}>{hasLogo ? 'Configured' : 'Not Set'}</div>
                    </div>

                    <div
                      style={{
                        border: `1px solid ${COLORS.line}`,
                        background: 'rgba(255,255,255,0.02)',
                        padding: '8px 10px',
                        display: 'grid',
                        gap: '3px',
                        minWidth: 0
                      }}
                    >
                      <div style={labelStyle}>Players</div>
                      <div style={valueStyle}>{players.length} Registered</div>
                    </div>

                    <div
                      style={{
                        border: `1px solid ${COLORS.line}`,
                        background: 'rgba(255,255,255,0.02)',
                        padding: '8px 10px',
                        display: 'grid',
                        gap: '3px',
                        minWidth: 0
                      }}
                    >
                      <div style={labelStyle}>Status</div>
                      <div style={valueStyle}>{players.length ? 'Ready' : 'Incomplete'}</div>
                    </div>
                  </div>

                  <div
                    style={{
                      border: `1px solid ${COLORS.line}`,
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)',
                      padding: '8px 10px',
                      display: 'grid',
                      alignContent: 'start',
                      gap: '8px',
                      minHeight: density === 'spacious' ? '68px' : '60px',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        ...labelStyle,
                        color: COLORS.yellow
                      }}
                    >
                      Roster Preview
                    </div>

                    <div
                      style={{
                        color: playerNames.length ? COLORS.softWhite : COLORS.faintWhite,
                        fontSize: density === 'spacious' ? '12px' : '11px',
                        lineHeight: 1.55,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {playerNames.join(', ') || 'No player data available.'}
                    </div>
                  </div>
                </div>
              );
            })}

            {library.length === 0 && (
              <div
                style={{
                  color: COLORS.faintWhite,
                  padding: density === 'spacious' ? '24px' : '20px',
                  textAlign: 'center',
                  border: `1px dashed ${COLORS.lineStrong}`,
                  gridColumn: '1 / -1'
                }}
              >
                No team records found. Import a database or save a team preset from the Roster panel first.
              </div>
            )}
          </div>
        </div>
      </ShellPanel>
    </div>
  );
}