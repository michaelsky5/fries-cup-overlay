import React from 'react';
import { useMatchContext } from '../../contexts/MatchContext';
import { COLORS, panelBase } from '../../constants/styles';
import { ShellPanel, Field, SectionHint } from '../common/SharedUI';
import { createEditorUi } from '../../utils/editorUi';

export default function VideoEditor({
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

  const videoLibrary = Array.isArray(matchData.videoLibrary) ? matchData.videoLibrary : [];
  const videoPlaylist = Array.isArray(matchData.videoPlaylist) ? matchData.videoPlaylist : [];

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

  const addVideo = () => {
    const name = window.prompt('Enter video display name:');
    if (!name) return;
    const path = window.prompt('Enter video file path:', '/assets/videos/');
    if (!path) return;

    updateData({
      ...matchData,
      videoLibrary: [...videoLibrary, { name, path }]
    });
  };

  const deleteVideo = index => {
    const item = videoLibrary[index];
    if (!item) return;
    if (!window.confirm(`Delete [${item.name}] from library?`)) return;

    updateData({
      ...matchData,
      videoLibrary: videoLibrary.filter((_, i) => i !== index),
      videoPlaylist: videoPlaylist.filter(p => p !== item.path),
      activeVideoPath: matchData.activeVideoPath === item.path ? '' : matchData.activeVideoPath
    });
  };

  const addToPlaylist = path => {
    if (videoPlaylist.includes(path)) return;
    updateData({
      ...matchData,
      videoPlaylist: [...videoPlaylist, path]
    });
  };

  const removeFromPlaylist = idx => {
    const next = [...videoPlaylist];
    next.splice(idx, 1);
    updateData({ ...matchData, videoPlaylist: next });
  };

  const movePlaylistItem = (idx, direction) => {
    const next = [...videoPlaylist];
    const target = idx + direction;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    updateData({ ...matchData, videoPlaylist: next });
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
      <ShellPanel title="Video Status" accent density={density}>
        <div style={{ display: 'grid', gap }}>
          <Field label="Active Video Path" density={density}>
            <input
              style={controlInput}
              value={matchData.activeVideoPath || ''}
              onChange={e => updateData({ ...matchData, activeVideoPath: e.target.value })}
              placeholder="/assets/videos/warmup.mp4"
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
                backgroundColor: matchData.videoMuted ? COLORS.red : COLORS.green,
                color: '#fff'
              }}
              onClick={() => updateData({ ...matchData, videoMuted: !matchData.videoMuted })}
            >
              {matchData.videoMuted ? 'Muted' : 'Audio On'}
            </button>

            <button
              style={{
                ...outlineBtn,
                borderColor: COLORS.yellow,
                color: COLORS.yellow
              }}
              onClick={() => updateData({ ...matchData, activeVideoPath: '' })}
            >
              Clear Active
            </button>
          </div>

          <SectionHint
            text="Manage the video scene source path, library assets, and playback playlist here."
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
                {videoPlaylist.length}
              </div>
            </div>

            <div style={{ display: 'grid', gap }}>
              {videoPlaylist.map((path, idx) => {
                const item = videoLibrary.find(v => v.path === path);
                const isActive = matchData.activeVideoPath === path;

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
                            {item ? item.name : 'Unregistered Video'}
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
                          disabled={idx === videoPlaylist.length - 1}
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

              {videoPlaylist.length === 0 && (
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
        title="Video Library"
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
            onClick={addVideo}
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
          {videoLibrary.map((v, i) => {
            const isInPlaylist = videoPlaylist.includes(v.path);
            const isActive = matchData.activeVideoPath === v.path;

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
                      onClick={() => updateData({ ...matchData, activeVideoPath: v.path })}
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
                      onClick={() => deleteVideo(i)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {videoLibrary.length === 0 && (
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
              No video assets registered
            </div>
          )}
        </div>
      </ShellPanel>
    </div>
  );
}