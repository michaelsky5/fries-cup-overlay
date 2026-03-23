import React from 'react';
import { useMatchContext } from '../../contexts/MatchContext';
import { COLORS, panelBase } from '../../constants/styles';
import { ShellPanel, Field, SectionHint } from '../common/SharedUI';
import { createEditorUi } from '../../utils/editorUi';

export default function HighlightEditor({
  density = 'standard',
  densityTokens,
  isDense = false,
  isUltra = false
}) {
  const { matchData, updateData } = useMatchContext();

  const t = densityTokens || {
    blockGap: 10,
    panelPadding: '12px 14px',
    panelPaddingLg: '14px 16px',
    buttonFontSize: 12
  };

  const ui = createEditorUi(densityTokens, density);

  const rowH = density === 'spacious' ? 40 : 36;
  const gap = density === 'spacious' ? 10 : 8;
  const leftColWidth = density === 'spacious' ? '390px' : '360px';

  const highlightLibrary = Array.isArray(matchData.highlightLibrary) ? matchData.highlightLibrary : [];
  const highlightPlaylist = Array.isArray(matchData.highlightPlaylist) ? matchData.highlightPlaylist : [];

  const controlInput = {
    ...ui.input,
    minHeight: rowH,
    height: rowH,
    boxSizing: 'border-box',
    paddingTop: 0,
    paddingBottom: 0,
    fontSize: density === 'spacious' ? '13px' : '12px'
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

  const softBtn = {
    ...ui.btn,
    minHeight: rowH,
    height: rowH,
    boxSizing: 'border-box',
    fontWeight: 900
  };

  const addHighlight = () => {
    const name = window.prompt('Enter highlight display name:');
    if (!name) return;
    const path = window.prompt('Enter highlight file path:', '/assets/highlights/');
    if (!path) return;

    updateData({
      ...matchData,
      highlightLibrary: [...highlightLibrary, { name, path }]
    });
  };

  const deleteHighlight = index => {
    const item = highlightLibrary[index];
    if (!item) return;
    if (!window.confirm(`Delete [${item.name}] from library?`)) return;

    updateData({
      ...matchData,
      highlightLibrary: highlightLibrary.filter((_, i) => i !== index),
      highlightPlaylist: highlightPlaylist.filter(p => p !== item.path),
      activeHighlightPath: matchData.activeHighlightPath === item.path ? '' : matchData.activeHighlightPath
    });
  };

  const addToPlaylist = path => {
    if (highlightPlaylist.includes(path)) return;
    updateData({
      ...matchData,
      highlightPlaylist: [...highlightPlaylist, path]
    });
  };

  const removeFromPlaylist = idx => {
    const next = [...highlightPlaylist];
    next.splice(idx, 1);
    updateData({ ...matchData, highlightPlaylist: next });
  };

  const movePlaylistItem = (idx, direction) => {
    const next = [...highlightPlaylist];
    const target = idx + direction;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    updateData({ ...matchData, highlightPlaylist: next });
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: isUltra ? '1fr' : `${leftColWidth} minmax(0,1fr)`,
        gap: t.blockGap,
        alignItems: 'stretch'
      }}
    >
      <ShellPanel title="Highlight Status" accent density={density}>
        <div style={{ display: 'grid', gap }}>
          <Field label="Active Highlight Path" density={density}>
            <input
              style={controlInput}
              value={matchData.activeHighlightPath || ''}
              onChange={e => updateData({ ...matchData, activeHighlightPath: e.target.value })}
              placeholder="/assets/highlights/hl1.mp4"
            />
          </Field>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isDense ? '1fr' : '1fr 1fr',
              gap
            }}
          >
            <button
              style={{
                ...softBtn,
                backgroundColor: matchData.highlightMuted ? COLORS.red : COLORS.green,
                color: '#fff'
              }}
              onClick={() => updateData({ ...matchData, highlightMuted: !matchData.highlightMuted })}
            >
              {matchData.highlightMuted ? 'Muted' : 'Audio On'}
            </button>

            <button
              style={{
                ...outlineBtn,
                borderColor: COLORS.yellow,
                color: COLORS.yellow
              }}
              onClick={() => updateData({ ...matchData, activeHighlightPath: '' })}
            >
              Clear Active
            </button>
          </div>

          <SectionHint
            text="Manage the highlight scene source path, library assets, and playback playlist here."
            density={density}
          />

          <div
            style={{
              ...panelBase,
              padding: t.panelPadding,
              borderLeft: `3px solid ${COLORS.yellow}`,
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
                  Playlist
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
                  Playback Queue
                </div>
              </div>

              <div
                style={{
                  minHeight: rowH,
                  height: rowH,
                  minWidth: '52px',
                  padding: '0 10px',
                  border: `1px solid ${COLORS.line}`,
                  background: 'rgba(255,255,255,0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: COLORS.softWhite,
                  fontWeight: 900,
                  fontSize: '12px',
                  boxSizing: 'border-box'
                }}
              >
                {highlightPlaylist.length}
              </div>
            </div>

            <div style={{ display: 'grid', gap }}>
              {highlightPlaylist.map((path, idx) => {
                const item = highlightLibrary.find(v => v.path === path);
                const isActive = matchData.activeHighlightPath === path;

                return (
                  <div
                    key={`${path}-${idx}`}
                    style={{
                      ...panelBase,
                      padding: t.panelPadding,
                      borderLeft: `3px solid ${isActive ? COLORS.yellow : 'rgba(255,255,255,0.08)'}`,
                      minWidth: 0
                    }}
                  >
                    <div style={{ display: 'grid', gap }}>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '34px minmax(0,1fr)',
                          gap,
                          alignItems: 'start'
                        }}
                      >
                        <div
                          style={{
                            minHeight: rowH,
                            height: rowH,
                            border: `1px solid ${COLORS.line}`,
                            background: isActive ? 'rgba(244,195,32,0.14)' : 'rgba(255,255,255,0.02)',
                            color: isActive ? COLORS.yellow : COLORS.softWhite,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 900,
                            boxSizing: 'border-box'
                          }}
                        >
                          {idx + 1}
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              color: COLORS.white,
                              fontSize: density === 'spacious' ? '12px' : '11px',
                              fontWeight: 900,
                              wordBreak: 'break-word'
                            }}
                          >
                            {item ? item.name : 'Unregistered Highlight'}
                          </div>
                          <div
                            style={{
                              color: COLORS.faintWhite,
                              fontSize: '10px',
                              marginTop: '4px',
                              wordBreak: 'break-all'
                            }}
                          >
                            {path}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          style={{
                            ...actionBtn,
                            backgroundColor: isActive ? '#6f5a12' : COLORS.yellow,
                            color: isActive ? COLORS.softWhite : COLORS.black,
                            padding: density === 'spacious' ? '0 12px' : '0 10px'
                          }}
                          onClick={() => updateData({ ...matchData, activeVideoPath: path })}
                        >
                          {isActive ? 'PLAYING' : 'PLAYNOW'}
                        </button>

                        <button
                          style={{ ...outlineBtn, padding: density === 'spacious' ? '0 10px' : '0 8px' }}
                          onClick={() => movePlaylistItem(idx, -1)}
                          disabled={idx === 0}
                        >
                          ↑
                        </button>

                        <button
                          style={{ ...outlineBtn, padding: density === 'spacious' ? '0 10px' : '0 8px' }}
                          onClick={() => movePlaylistItem(idx, 1)}
                          disabled={idx === highlightPlaylist.length - 1}
                        >
                          ↓
                        </button>

                        <button
                          style={{
                            ...outlineBtn,
                            borderColor: COLORS.red,
                            color: COLORS.red,
                            padding: density === 'spacious' ? '0 12px' : '0 10px'
                          }}
                          onClick={() => removeFromPlaylist(idx)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {highlightPlaylist.length === 0 && (
                <div
                  style={{
                    color: COLORS.faintWhite,
                    textAlign: 'center',
                    padding: '18px 10px',
                    border: `1px dashed ${COLORS.lineStrong}`,
                    fontSize: density === 'spacious' ? '12px' : '11px'
                  }}
                >
                  Playlist is empty
                </div>
              )}
            </div>
          </div>
        </div>
      </ShellPanel>

      <ShellPanel
        title="Highlight Library"
        accent
        density={density}
        right={
          <button
            style={{
              ...softBtn,
              backgroundColor: COLORS.blue,
              color: '#fff',
              padding: density === 'spacious' ? '0 14px' : '0 12px'
            }}
            onClick={addHighlight}
          >
            + Register
          </button>
        }
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isDense ? '1fr' : '1fr 1fr',
            gap
          }}
        >
          {highlightLibrary.map((v, i) => {
            const isInPlaylist = highlightPlaylist.includes(v.path);
            const isActive = matchData.activeHighlightPath === v.path;

            return (
              <div
                key={`${v.path}-${i}`}
                style={{
                  ...panelBase,
                  padding: t.panelPadding,
                  borderLeft: isActive ? `3px solid ${COLORS.yellow}` : `3px solid transparent`,
                  minWidth: 0
                }}
              >
                <div style={{ display: 'grid', gap }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap,
                      alignItems: 'start'
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          color: COLORS.white,
                          fontWeight: 900,
                          fontSize: density === 'spacious' ? '12px' : '11px',
                          wordBreak: 'break-word'
                        }}
                      >
                        {v.name}
                      </div>
                      <div
                        style={{
                          color: COLORS.faintWhite,
                          fontSize: '10px',
                          marginTop: '4px',
                          wordBreak: 'break-all'
                        }}
                      >
                        {v.path}
                      </div>
                    </div>

                    <div
                      style={{
                        minHeight: rowH,
                        height: rowH,
                        minWidth: '56px',
                        padding: '0 10px',
                        border: `1px solid ${isActive ? 'rgba(244,195,32,0.35)' : COLORS.line}`,
                        background: isActive ? 'rgba(244,195,32,0.14)' : 'rgba(255,255,255,0.02)',
                        color: isActive ? COLORS.yellow : COLORS.faintWhite,
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
                      {isActive ? 'Live' : 'Idle'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button
                      style={{
                        ...actionBtn,
                        backgroundColor: COLORS.red,
                        color: '#fff',
                        padding: density === 'spacious' ? '0 12px' : '0 10px'
                      }}
                      onClick={() => updateData({ ...matchData, activeHighlightPath: v.path })}
                    >
                      Play Now
                    </button>

                    <button
                      style={{
                        ...softBtn,
                        backgroundColor: isInPlaylist ? '#555' : COLORS.green,
                        color: isInPlaylist ? '#bbb' : '#fff',
                        padding: density === 'spacious' ? '0 12px' : '0 10px'
                      }}
                      disabled={isInPlaylist}
                      onClick={() => addToPlaylist(v.path)}
                    >
                      {isInPlaylist ? 'In Queue' : 'Add to Queue'}
                    </button>

                    <button
                      style={{
                        ...outlineBtn,
                        borderColor: COLORS.red,
                        color: COLORS.red,
                        padding: density === 'spacious' ? '0 12px' : '0 10px'
                      }}
                      onClick={() => deleteHighlight(i)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {highlightLibrary.length === 0 && (
            <div
              style={{
                color: COLORS.faintWhite,
                textAlign: 'center',
                padding: '20px 10px',
                border: `1px dashed ${COLORS.lineStrong}`,
                gridColumn: '1 / -1',
                fontSize: density === 'spacious' ? '12px' : '11px'
              }}
            >
              No highlight assets registered
            </div>
          )}
        </div>
      </ShellPanel>
    </div>
  );
}