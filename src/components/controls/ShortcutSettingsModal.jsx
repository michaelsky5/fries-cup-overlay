import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { COLORS, panelBase } from '../../constants/styles';

export const DEFAULT_SHORTCUTS = {
  // =========================
  // 全局与控制
  // =========================
  TAKE: { code: 'Space', altKey: false, ctrlKey: false, shiftKey: false, label: 'Space' },
  SWAP_TEAMS: { code: 'KeyS', altKey: true, ctrlKey: false, shiftKey: false, label: 'Alt + S' },
  UNDO: { code: 'KeyZ', altKey: false, ctrlKey: true, shiftKey: false, label: 'Ctrl + Z' },
  TOGGLE_LOCK: { code: 'KeyL', altKey: false, ctrlKey: true, shiftKey: true, label: 'Ctrl + Shift + L' },
  OPEN_SHORTCUTS: { code: 'Slash', altKey: false, ctrlKey: true, shiftKey: false, label: 'Ctrl + /' },

  // =========================
  // 计分与判胜 (纯逻辑绑定，不涉物理方位)
  // =========================
  SCORE_A_UP: { code: 'Digit1', altKey: true, ctrlKey: false, shiftKey: false, label: 'Alt + 1' },
  SCORE_A_DOWN: { code: 'Digit1', altKey: true, ctrlKey: false, shiftKey: true, label: 'Alt + Shift + 1' },
  SCORE_B_UP: { code: 'Digit2', altKey: true, ctrlKey: false, shiftKey: false, label: 'Alt + 2' },
  SCORE_B_DOWN: { code: 'Digit2', altKey: true, ctrlKey: false, shiftKey: true, label: 'Alt + Shift + 2' },
  SET_WINNER_A: { code: 'KeyA', altKey: true, ctrlKey: false, shiftKey: true, label: 'Alt + Shift + A' },
  SET_WINNER_B: { code: 'KeyD', altKey: true, ctrlKey: false, shiftKey: true, label: 'Alt + Shift + D' },
  CLEAR_WINNER: { code: 'Backspace', altKey: true, ctrlKey: false, shiftKey: false, label: 'Alt + Backspace' },

  // =========================
  // 对局流程
  // =========================
  NEXT_MAP: { code: 'ArrowRight', altKey: true, ctrlKey: false, shiftKey: false, label: 'Alt + →' },
  PREV_MAP: { code: 'ArrowLeft', altKey: true, ctrlKey: false, shiftKey: false, label: 'Alt + ←' },
  RESET_SERIES_SCORE: null,
  TOGGLE_AUTO_BEGIN: { code: 'KeyM', altKey: true, ctrlKey: false, shiftKey: false, label: 'Alt + M' },

  // =========================
  // 视觉与包装
  // =========================
  TOGGLE_TICKER: { code: 'KeyT', altKey: true, ctrlKey: false, shiftKey: false, label: 'Alt + T' },
  TOGGLE_NAMES: { code: 'KeyN', altKey: true, ctrlKey: false, shiftKey: false, label: 'Alt + N' },
  TOGGLE_BANS: { code: 'KeyB', altKey: true, ctrlKey: false, shiftKey: false, label: 'Alt + B' },
  TOGGLE_VOICE: { code: 'KeyV', altKey: true, ctrlKey: false, shiftKey: false, label: 'Alt + V' },
  HUD_ON: null,
  HUD_OFF: null,
  VOICE_TO_A: null,
  VOICE_TO_B: null,
  VOICE_OFF: null,

  // =========================
  // 画面盲切（高频默认）
  // =========================
  DIRECT_CUT_LIVE: { code: 'F1', altKey: false, ctrlKey: false, shiftKey: false, label: 'F1' },
  DIRECT_CUT_CASTER: { code: 'F2', altKey: false, ctrlKey: false, shiftKey: false, label: 'F2' },
  DIRECT_CUT_MAP_POOL: { code: 'F3', altKey: false, ctrlKey: false, shiftKey: false, label: 'F3' },
  DIRECT_CUT_ROSTER: { code: 'F4', altKey: false, ctrlKey: false, shiftKey: false, label: 'F4' },
  DIRECT_CUT_WINNER: { code: 'F9', altKey: false, ctrlKey: false, shiftKey: false, label: 'F9' },

  // =========================
  // 画面盲切（进阶预留）
  // =========================
  DIRECT_CUT_STATS: null,
  DIRECT_CUT_COUNTDOWN: null,
  DIRECT_CUT_HIGHLIGHT: null,
  DIRECT_CUT_VIDEO: null,
  DIRECT_CUT_COVER: null,

  // =========================
  // 组合动作（强实战价值）
  // =========================
  SET_WINNER_A_AND_CUT: null,
  SET_WINNER_B_AND_CUT: null
};

function getReadableKeyName(code) {
  const MAP = {
    Space: 'Space',
    Backspace: 'Backspace',
    Delete: 'Delete',
    Escape: 'Esc',
    Enter: 'Enter',
    Tab: 'Tab',
    Slash: '/',
    Minus: '-',
    Equal: '=',
    Comma: ',',
    Period: '.',
    Semicolon: ';',
    Quote: "'",
    BracketLeft: '[',
    BracketRight: ']',
    Backslash: '\\',
    Backquote: '`',
    ArrowLeft: '←',
    ArrowRight: '→',
    ArrowUp: '↑',
    ArrowDown: '↓'
  };

  if (MAP[code]) return MAP[code];
  if (code.startsWith('Key')) return code.replace('Key', '');
  if (code.startsWith('Digit')) return code.replace('Digit', '');
  if (code.startsWith('Numpad')) return code.replace('Numpad', 'Num ');
  return code;
}

function buildShortcutLabel({ code, ctrlKey, altKey, shiftKey }) {
  const isMac = typeof window !== 'undefined' && 
                (navigator.platform.toUpperCase().indexOf('MAC') >= 0 || 
                 /Mac|iPod|iPhone|iPad/.test(navigator.userAgent));

  const parts = [];
  if (ctrlKey) parts.push(isMac ? 'Cmd' : 'Ctrl');
  if (altKey) parts.push(isMac ? 'Option' : 'Alt');
  if (shiftKey) parts.push('Shift');
  parts.push(getReadableKeyName(code));
  return parts.join(' + ');
}

function ShortcutRow({ action, shortcut, isRecording, onToggleRecord, tr }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) 148px 60px',
        gap: '8px',
        alignItems: 'center',
        minWidth: 0,
        padding: '8px 10px',
        background: isRecording ? 'rgba(244,195,32,0.08)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${isRecording ? COLORS.yellow : COLORS.line}`,
        borderRadius: '2px'
      }}
    >
      <div
        style={{
          minWidth: 0,
          color: COLORS.softWhite,
          fontSize: '12px',
          fontWeight: 900,
          lineHeight: 1.25,
          letterSpacing: '0.2px'
        }}
      >
        {action.name}
      </div>

      <div
        style={{
          height: '30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 8px',
          background: isRecording ? COLORS.yellow : '#0a0a0a',
          color: isRecording ? COLORS.black : shortcut ? COLORS.yellow : COLORS.faintWhite,
          fontSize: '11px',
          fontWeight: 900,
          border: `1px solid ${COLORS.lineStrong}`,
          letterSpacing: '0.4px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        {isRecording
          ? tr('shortcuts.pressAnyKey')
          : shortcut?.label || tr('shortcuts.unbound')}
      </div>

      <button
        style={{
          height: '30px',
          background: 'transparent',
          border: '1px solid #555',
          color: isRecording ? COLORS.yellow : '#aaa',
          padding: '0 8px',
          fontSize: '10px',
          cursor: 'pointer',
          fontWeight: 900,
          letterSpacing: '0.4px'
        }}
        onClick={onToggleRecord}
      >
        {isRecording ? tr('shortcuts.cancel') : tr('shortcuts.edit')}
      </button>
    </div>
  );
}

function SectionBlock({ title, actions, currentShortcuts, recordingAction, setRecordingAction, tr }) {
  return (
    <section style={{ display: 'grid', gap: '8px' }}>
      <div style={{ display: 'grid', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '6px', height: '6px', background: COLORS.yellow, flex: '0 0 auto' }} />
          <div
            style={{
              fontSize: '11px',
              color: COLORS.faintWhite,
              fontWeight: 900,
              letterSpacing: '1.2px',
              textTransform: 'uppercase'
            }}
          >
            {title}
          </div>
        </div>
        <div style={{ height: '1px', background: COLORS.line }} />
      </div>

      <div style={{ display: 'grid', gap: '8px' }}>
        {actions.map(action => {
          const isRecording = recordingAction === action.id;
          const shortcut = currentShortcuts[action.id];
          return (
            <ShortcutRow
              key={action.id}
              action={action}
              shortcut={shortcut}
              isRecording={isRecording}
              onToggleRecord={() => setRecordingAction(isRecording ? null : action.id)}
              tr={tr}
            />
          );
        })}
      </div>
    </section>
  );
}

export default function ShortcutSettingsModal({ onClose, matchData, updateData }) {
  const { t: tr } = useTranslation();
  const [recordingAction, setRecordingAction] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const currentShortcuts = useMemo(
    () => ({ ...DEFAULT_SHORTCUTS, ...(matchData?.shortcuts || {}) }),
    [matchData]
  );

  const LEFT_SECTIONS = useMemo(
    () => [
      {
        title: tr('shortcuts.groupGlobal'),
        actions: [
          { id: 'TAKE', name: tr('shortcuts.take') },
          { id: 'SWAP_TEAMS', name: tr('shortcuts.swapTeams') },
          { id: 'UNDO', name: tr('shortcuts.undo') },
          { id: 'TOGGLE_LOCK', name: tr('shortcuts.toggleLock') },
          { id: 'OPEN_SHORTCUTS', name: tr('shortcuts.openShortcuts') }
        ]
      },
      {
        title: tr('shortcuts.groupScore'),
        actions: [
          { id: 'SCORE_A_UP', name: tr('shortcuts.scoreAUp') },
          { id: 'SCORE_A_DOWN', name: tr('shortcuts.scoreADown') },
          { id: 'SCORE_B_UP', name: tr('shortcuts.scoreBUp') },
          { id: 'SCORE_B_DOWN', name: tr('shortcuts.scoreBDown') },
          { id: 'SET_WINNER_A', name: tr('shortcuts.setWinnerA') },
          { id: 'SET_WINNER_B', name: tr('shortcuts.setWinnerB') },
          { id: 'CLEAR_WINNER', name: tr('shortcuts.clearWinner') }
        ]
      },
      {
        title: tr('shortcuts.groupFlow'),
        actions: [
          { id: 'NEXT_MAP', name: tr('shortcuts.nextMap') },
          { id: 'PREV_MAP', name: tr('shortcuts.prevMap') },
          { id: 'RESET_SERIES_SCORE', name: tr('shortcuts.resetSeriesScore') },
          { id: 'TOGGLE_AUTO_BEGIN', name: tr('shortcuts.toggleAutoBegin') }
        ]
      }
    ],
    [tr]
  );

  const RIGHT_PRIMARY_SECTIONS = useMemo(
    () => [
      {
        title: tr('shortcuts.groupHUD'),
        actions: [
          { id: 'TOGGLE_TICKER', name: tr('shortcuts.toggleTicker') },
          { id: 'TOGGLE_NAMES', name: tr('shortcuts.toggleNames') },
          { id: 'TOGGLE_BANS', name: tr('shortcuts.toggleBans') },
          { id: 'TOGGLE_VOICE', name: tr('shortcuts.toggleVoice') }
        ]
      },
      {
        title: tr('shortcuts.groupCutsPrimary'),
        actions: [
          { id: 'DIRECT_CUT_LIVE', name: tr('shortcuts.cutLive') },
          { id: 'DIRECT_CUT_CASTER', name: tr('shortcuts.cutCaster') },
          { id: 'DIRECT_CUT_MAP_POOL', name: tr('shortcuts.cutMap') },
          { id: 'DIRECT_CUT_ROSTER', name: tr('shortcuts.cutRoster') },
          { id: 'DIRECT_CUT_WINNER', name: tr('shortcuts.cutWinner') }
        ]
      }
    ],
    [tr]
  );

  const ADVANCED_ACTIONS = useMemo(
    () => [
      { id: 'HUD_ON', name: tr('shortcuts.hudOn') },
      { id: 'HUD_OFF', name: tr('shortcuts.hudOff') },
      { id: 'VOICE_TO_A', name: tr('shortcuts.voiceToA') },
      { id: 'VOICE_TO_B', name: tr('shortcuts.voiceToB') },
      { id: 'VOICE_OFF', name: tr('shortcuts.voiceOff') },
      { id: 'DIRECT_CUT_STATS', name: tr('shortcuts.cutStats') },
      { id: 'DIRECT_CUT_COUNTDOWN', name: tr('shortcuts.cutCountdown') },
      { id: 'DIRECT_CUT_HIGHLIGHT', name: tr('shortcuts.cutHighlight') },
      { id: 'DIRECT_CUT_VIDEO', name: tr('shortcuts.cutVideo') },
      { id: 'DIRECT_CUT_COVER', name: tr('shortcuts.cutCover') },
      { id: 'SET_WINNER_A_AND_CUT', name: tr('shortcuts.setWinnerAAndCut') },
      { id: 'SET_WINNER_B_AND_CUT', name: tr('shortcuts.setWinnerBAndCut') }
    ],
    [tr]
  );

  useEffect(() => {
    document.body.classList.add('fc-modal-open');
    return () => document.body.classList.remove('fc-modal-open');
  }, []);

  useEffect(() => {
    if (!recordingAction) return;

    const handleKeyDown = e => {
      e.preventDefault();
      e.stopPropagation();

      if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return;

      if (e.key === 'Escape') {
        setRecordingAction(null);
        return;
      }

      if (e.key === 'Backspace' || e.key === 'Delete') {
        const nextShortcuts = { ...currentShortcuts, [recordingAction]: null };
        updateData({ ...matchData, shortcuts: nextShortcuts });
        setRecordingAction(null);
        return;
      }

      const isCtrl = e.ctrlKey || e.metaKey;
      const isAlt = e.altKey;
      const isShift = e.shiftKey;
      const code = e.code;

      const newShortcut = {
        code,
        altKey: isAlt,
        ctrlKey: isCtrl,
        shiftKey: isShift,
        label: buildShortcutLabel({
          code,
          altKey: isAlt,
          ctrlKey: isCtrl,
          shiftKey: isShift
        })
      };

      const nextShortcuts = { ...currentShortcuts };

      Object.keys(nextShortcuts).forEach(key => {
        const s = nextShortcuts[key];
        if (!s) return;
        if (
          s.code === code &&
          s.altKey === isAlt &&
          s.ctrlKey === isCtrl &&
          s.shiftKey === isShift
        ) {
          nextShortcuts[key] = null;
        }
      });

      nextShortcuts[recordingAction] = newShortcut;
      updateData({ ...matchData, shortcuts: nextShortcuts });
      setRecordingAction(null);
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [recordingAction, currentShortcuts, matchData, updateData]);

  const handleResetDefaults = () => {
    updateData({ ...matchData, shortcuts: { ...DEFAULT_SHORTCUTS } });
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.88)',
        zIndex: 10000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '18px'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(1320px, 100%)',
          ...panelBase,
          border: `2px solid ${COLORS.yellow}`,
          overflow: 'hidden',
          boxShadow: '0 0 0 1px rgba(244,195,32,0.06) inset'
        }}
      >
        <div style={{ padding: '16px 18px 12px', display: 'grid', gap: '14px' }}>
          <div
            style={{
              display: 'grid',
              gap: '12px',
              paddingBottom: '12px',
              borderBottom: `1px solid ${COLORS.lineStrong}`
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
              <div style={{ display: 'grid', gap: '6px', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '9px', height: '9px', background: COLORS.yellow, flex: '0 0 auto' }} />
                  <span
                    style={{
                      fontSize: '15px',
                      fontWeight: 900,
                      color: COLORS.white,
                      letterSpacing: '1.6px'
                    }}
                  >
                    {tr('shortcuts.modalTitle')}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    color: COLORS.faintWhite,
                    lineHeight: 1.5
                  }}
                >
                  {tr('shortcuts.modalDesc')}
                </span>
              </div>

              <button
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: COLORS.red,
                  fontWeight: 900,
                  cursor: 'pointer',
                  fontSize: '12px',
                  letterSpacing: '1px',
                  padding: 0,
                  flex: '0 0 auto'
                }}
                onClick={onClose}
              >
                {tr('shortcuts.close')}
              </button>
            </div>
          </div>

          <div
            style={{
              maxHeight: '74vh',
              overflowY: 'auto',
              paddingRight: '6px'
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(520px, 1fr))',
                gap: '24px',
                alignItems: 'start'
              }}
            >
              <div style={{ display: 'grid', gap: '18px', minWidth: 0 }}>
                {LEFT_SECTIONS.map(section => (
                  <SectionBlock
                    key={section.title}
                    title={section.title}
                    actions={section.actions}
                    currentShortcuts={currentShortcuts}
                    recordingAction={recordingAction}
                    setRecordingAction={setRecordingAction}
                    tr={tr}
                  />
                ))}
              </div>

              <div style={{ display: 'grid', gap: '18px', minWidth: 0 }}>
                {RIGHT_PRIMARY_SECTIONS.map(section => (
                  <SectionBlock
                    key={section.title}
                    title={section.title}
                    actions={section.actions}
                    currentShortcuts={currentShortcuts}
                    recordingAction={recordingAction}
                    setRecordingAction={setRecordingAction}
                    tr={tr}
                  />
                ))}

                <section style={{ display: 'grid', gap: '10px' }}>
                  <button
                    onClick={() => setShowAdvanced(v => !v)}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: `1px solid ${showAdvanced ? COLORS.yellow : COLORS.line}`,
                      color: showAdvanced ? COLORS.yellow : COLORS.softWhite,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      padding: '10px 12px',
                      fontWeight: 900,
                      fontSize: '11px',
                      letterSpacing: '1px',
                      textTransform: 'uppercase'
                    }}
                  >
                    <span>{tr('shortcuts.advancedGroup')}</span>
                    <span style={{ color: showAdvanced ? COLORS.yellow : COLORS.faintWhite }}>
                      {showAdvanced ? '−' : '+'}
                    </span>
                  </button>

                  {showAdvanced && (
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {ADVANCED_ACTIONS.map(action => {
                        const isRecording = recordingAction === action.id;
                        const shortcut = currentShortcuts[action.id];
                        return (
                          <ShortcutRow
                            key={action.id}
                            action={action}
                            shortcut={shortcut}
                            isRecording={isRecording}
                            onToggleRecord={() => setRecordingAction(isRecording ? null : action.id)}
                            tr={tr}
                          />
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: `1px solid ${COLORS.lineStrong}` }}>
            <button
              style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '12px', fontWeight: 900 }}
              onClick={handleResetDefaults}
            >
              {tr('shortcuts.resetDefault')}
            </button>
            <button
              style={{ background: COLORS.yellow, color: COLORS.black, border: 'none', padding: '8px 24px', fontWeight: 900, fontSize: '13px', cursor: 'pointer' }}
              onClick={onClose}
            >
              {tr('shortcuts.done')}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}