import React, { useState, useEffect } from 'react';
import { useMatchContext } from '../../contexts/MatchContext';
import { ShellPanel } from '../common/SharedUI';
import { COLORS, panelBase } from '../../constants/styles';
import { createEditorUi } from '../../utils/editorUi';

export default function RightSidebar({
  previewScene,
  showRightColumn,
  density = 'standard',
  densityTokens
}) {
  const { matchData, updateData, updateWithHistory, history, videoProgress, showModal } = useMatchContext();

  const snapshots = matchData.snapshots || [];
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(matchData.autoSaveEnabled ?? true);

  const t = densityTokens || {
    panelPadding: '12px',
    buttonPadding: '10px 12px',
    buttonFontSize: 12,
    inputFontSize: 12
  };

  const ui = createEditorUi(t, density);
  const isCompactSidebar = density === 'compact' || density === 'ultra';

  useEffect(() => setAutoSaveEnabled(matchData.autoSaveEnabled ?? true), [matchData.autoSaveEnabled]);

  useEffect(() => {
    if (!autoSaveEnabled) return;
    const interval = setInterval(() => {
      updateData(prev => {
        const currentSnapshots = prev.snapshots || [];
        const newSnapshot = {
          id: Date.now(),
          time: new Date().toLocaleTimeString('en-US', { hour12: false }),
          label: `[AUTO] AUTOSAVE (MAP ${prev.currentMap || 1})`,
          data: { ...prev, snapshots: undefined }
        };
        return { ...prev, snapshots: [newSnapshot, ...currentSnapshots].slice(0, 15) };
      });
    }, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [autoSaveEnabled, updateData]);

  const cardPadding = density === 'spacious' ? '12px' : isCompactSidebar ? '8px 9px' : '10px';
  const cardTitleSize = density === 'spacious' ? '13px' : isCompactSidebar ? '11px' : '12px';
  const cardMetaSize = isCompactSidebar ? '9px' : '10px';

  const snapshotMaxHeight = showRightColumn
    ? density === 'spacious' ? '300px' : isCompactSidebar ? '210px' : '250px'
    : density === 'spacious' ? '260px' : isCompactSidebar ? '180px' : '220px';

  const logMaxHeight = showRightColumn
    ? density === 'spacious' ? '300px' : isCompactSidebar ? '220px' : '250px'
    : density === 'spacious' ? '240px' : isCompactSidebar ? '180px' : '220px';

  const sectionGap = isCompactSidebar ? '6px' : '8px';
  const buttonPad = isCompactSidebar ? '7px 8px' : undefined;

  const liveStatusHeight = density === 'spacious' ? '40px' : '36px';

  const toggleAutoSave = () => {
    const nextState = !autoSaveEnabled;
    setAutoSaveEnabled(nextState);
    updateData({ ...matchData, autoSaveEnabled: nextState });
  };

  const handleTakeSnapshot = () => {
    showModal({
      type: 'prompt',
      title: 'TAKE SNAPSHOT',
      message: 'Enter snapshot label / note:',
      placeholder: `e.g. MAP ${matchData.currentMap || 1} POST-MATCH`,
      onConfirm: val => {
        const label = val || `MAP ${matchData.currentMap || 1} MANUAL`;
        const newSnapshot = {
          id: Date.now(),
          time: new Date().toLocaleTimeString('en-US', { hour12: false }),
          label,
          data: { ...matchData, snapshots: undefined }
        };
        updateData({ ...matchData, snapshots: [newSnapshot, ...snapshots].slice(0, 15) });
      }
    });
  };

  const handleRestore = snap => {
    showModal({
      type: 'confirm',
      title: 'RESTORE SNAPSHOT',
      isDanger: true,
      message: `[DANGER] Restore [${snap.label}]?\n\nAll current unsaved values will be overwritten.`,
      onConfirm: () => updateWithHistory(`Restore Snapshot: ${snap.label}`, { ...snap.data, snapshots: matchData.snapshots })
    });
  };

  const handleDeleteSnap = id => updateData({ ...matchData, snapshots: snapshots.filter(s => s.id !== id) });

  const formatVideoProgress = () => {
    const current = Math.floor(videoProgress?.currentTime || 0);
    const total = Math.floor(videoProgress?.duration || 0);
    return `${current}s / ${total}s`;
  };

  const statusItems = [
    { label: 'Program', value: matchData.globalScene || 'LIVE', color: '#2ecc71' },
    { label: 'Preview', value: previewScene || 'LIVE', color: COLORS.yellow },
    { label: 'Ticker', value: matchData.tickerMode || 'OFF', color: COLORS.white },
    { label: 'Comms', value: matchData.activeComms || 'OFF', color: COLORS.white },
    { label: 'Video', value: formatVideoProgress(), color: COLORS.white }
  ];

  return (
    <>
      <style>{`
        .fc-custom-scroll::-webkit-scrollbar { width: 6px; }
        .fc-custom-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 4px; }
        .fc-custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 4px; }
        .fc-custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(244,195,32,0.6); }
      `}</style>

      <div style={{ display: 'grid', gap: isCompactSidebar ? '10px' : '12px' }}>
        <ShellPanel
          title="Data Snapshot & Backup"
          accent
          density={density}
          bodyStyle={{ ...ui.panelBody, padding: isCompactSidebar ? '10px' : ui.panelBody?.padding }}
        >
          <div style={{ ...ui.stack, gap: sectionGap }}>
            <div style={{ ...ui.inline2, gap: sectionGap }}>
              <button
                onClick={handleTakeSnapshot}
                style={{
                  ...ui.actionBtn,
                  backgroundColor: COLORS.yellow,
                  color: COLORS.black,
                  padding: buttonPad || ui.actionBtn.padding,
                  fontSize: isCompactSidebar ? '11px' : undefined,
                  fontWeight: '900',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  lineHeight: 1
                }}
              >
                SNAPSHOT
              </button>

              <button
                onClick={toggleAutoSave}
                style={{
                  ...ui.btn,
                  backgroundColor: autoSaveEnabled ? '#2ecc71' : '#444',
                  color: autoSaveEnabled ? '#fff' : '#888',
                  padding: buttonPad || ui.btn.padding,
                  fontSize: isCompactSidebar ? '11px' : undefined,
                  fontWeight: '900',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s, color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  lineHeight: 1
                }}
              >
                AUTOSAVE
              </button>
            </div>

            <div
              className="fc-custom-scroll"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: sectionGap,
                maxHeight: snapshotMaxHeight,
                overflowY: 'auto',
                paddingRight: '6px'
              }}
            >
              {snapshots.length ? snapshots.map(snap => (
                <div
                  key={snap.id}
                  style={{
                    ...panelBase,
                    padding: cardPadding,
                    flexShrink: 0,
                    borderLeft: snap.label.includes('[AUTO]') ? '2px solid #2ecc71' : `2px solid ${COLORS.yellow}`
                  }}
                >
                  <div style={{ marginBottom: isCompactSidebar ? '8px' : '10px' }}>
                    <div
                      style={{
                        fontSize: cardTitleSize,
                        fontWeight: '900',
                        color: COLORS.white,
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {snap.label}
                    </div>

                    <div
                      style={{
                        fontSize: cardMetaSize,
                        color: COLORS.faintWhite,
                        marginTop: '3px',
                        letterSpacing: '0.4px'
                      }}
                    >
                      {snap.time}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <button
                      onClick={() => handleRestore(snap)}
                      style={{
                        ...ui.outlineBtn,
                        color: COLORS.yellow,
                        borderColor: COLORS.yellow,
                        padding: buttonPad || ui.outlineBtn.padding,
                        fontSize: isCompactSidebar ? '11px' : undefined,
                        fontWeight: '900',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        lineHeight: 1
                      }}
                    >
                      RESTORE
                    </button>

                    <button
                      onClick={() => handleDeleteSnap(snap.id)}
                      style={{
                        ...ui.outlineBtn,
                        color: COLORS.red,
                        borderColor: 'transparent',
                        padding: buttonPad || ui.outlineBtn.padding,
                        fontSize: isCompactSidebar ? '11px' : undefined,
                        fontWeight: '900',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        lineHeight: 1
                      }}
                    >
                      DELETE
                    </button>
                  </div>
                </div>
              )) : (
                <div
                  style={{
                    ...panelBase,
                    padding: cardPadding,
                    color: COLORS.faintWhite,
                    fontSize: isCompactSidebar ? '11px' : '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px'
                  }}
                >
                  No snapshots yet.
                </div>
              )}
            </div>
          </div>
        </ShellPanel>

        <ShellPanel
          title="Live Status"
          accent
          density={density}
          bodyStyle={{ ...ui.panelBody, padding: isCompactSidebar ? '10px' : ui.panelBody?.padding }}
        >
          <div style={{ display: 'grid', gap: sectionGap }}>
            {statusItems.map(item => (
              <div
                key={item.label}
                style={{
                  ...panelBase,
                  minHeight: liveStatusHeight,
                  height: liveStatusHeight,
                  padding: '0 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxSizing: 'border-box',
                  gap: '8px'
                }}
              >
                <div
                  style={{
                    fontSize: isCompactSidebar ? '10px' : '11px',
                    fontWeight: '900',
                    color: COLORS.softWhite,
                    letterSpacing: '1.2px',
                    textTransform: 'uppercase',
                    lineHeight: 1,
                    flexShrink: 0
                  }}
                >
                  {item.label}
                </div>

                <div
                  style={{
                    fontSize: density === 'spacious' ? '15px' : '14px',
                    fontWeight: '900',
                    color: item.color,
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textTransform: 'uppercase'
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </ShellPanel>

        <ShellPanel
          title="Operation Log"
          accent
          density={density}
          bodyStyle={{ ...ui.panelBody, padding: isCompactSidebar ? '10px' : ui.panelBody?.padding }}
        >
          <div
            className="fc-custom-scroll"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: sectionGap,
              maxHeight: logMaxHeight,
              overflowY: 'auto',
              paddingRight: '6px'
            }}
          >
            {history && history.length ? history.slice().reverse().map((entry, idx) => (
              <div
                key={`${entry.time || idx}-${entry.label || idx}`}
                style={{
                  ...panelBase,
                  padding: cardPadding,
                  borderLeft: idx === 0 ? `3px solid ${COLORS.yellow}` : UI_BORDER_FALLBACK(COLORS),
                  flexShrink: 0
                }}
              >
                <div
                  style={{
                    fontSize: cardMetaSize,
                    color: COLORS.faintWhite,
                    marginBottom: '6px',
                    letterSpacing: '0.4px'
                  }}
                >
                  [{entry.time || '--:--:--'}]
                </div>

                <div
                  style={{
                    fontSize: cardTitleSize,
                    fontWeight: '900',
                    color: COLORS.white,
                    textTransform: 'uppercase',
                    lineHeight: 1.25
                  }}
                >
                  {entry.label || 'UNKNOWN ACTION'}
                </div>
              </div>
            )) : (
              <div
                style={{
                  ...panelBase,
                  padding: cardPadding,
                  color: COLORS.faintWhite,
                  fontSize: isCompactSidebar ? '11px' : '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px'
                }}
              >
                No operation logs yet.
              </div>
            )}
          </div>
        </ShellPanel>
      </div>
    </>
  );
}

function UI_BORDER_FALLBACK(COLORS_OBJ) {
  return `2px solid ${COLORS_OBJ.lineStrong || 'rgba(255,255,255,0.12)'}`;
}