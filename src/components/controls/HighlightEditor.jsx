import React, { useMemo } from 'react';
import { useMatchContext } from '../../contexts/MatchContext';
import { useOBS } from '../../contexts/OBSContext'; 
import { COLORS, panelBase } from '../../constants/styles';
import { ShellPanel, Field, SectionHint } from '../common/SharedUI';
import { createEditorUi } from '../../utils/editorUi';

// 🚀 优化：抽离单行并加上 React.memo，避免增删列表时引起整个大面板的无谓重绘
const HighlightPlaylistItem = React.memo(({ 
  path, idx, item, isActive, isLast, rowH, gap, t, ui, actionBtn, outlineBtn, 
  handlePlayNow, movePlaylistItem, removeFromPlaylist 
}) => (
  <div
    style={{
      ...panelBase,
      padding: t.panelPadding,
      borderLeft: `3px solid ${isActive ? COLORS.yellow : 'rgba(255,255,255,0.08)'}`,
      minWidth: 0
    }}
  >
    <div style={{ display: 'grid', gap }}>
      <div style={{ display: 'grid', gridTemplateColumns: '34px minmax(0,1fr)', gap, alignItems: 'start' }}>
        <div
          style={{
            minHeight: rowH, height: rowH,
            border: `1px solid ${COLORS.line}`,
            background: isActive ? 'rgba(244,195,32,0.14)' : 'rgba(255,255,255,0.02)',
            color: isActive ? COLORS.yellow : COLORS.softWhite,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 900, boxSizing: 'border-box'
          }}
        >
          {idx + 1}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: COLORS.white, fontSize: '12px', fontWeight: 900, wordBreak: 'break-word' }}>
            {item ? item.name : 'Unregistered Highlight'}
          </div>
          <div style={{ color: COLORS.faintWhite, fontSize: '10px', marginTop: '4px', wordBreak: 'break-all' }}>
            {path}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <button
          style={{
            ...actionBtn,
            backgroundColor: isActive ? 'rgba(244,195,32,0.2)' : COLORS.yellow,
            color: isActive ? COLORS.yellow : COLORS.black,
            border: isActive ? `1px solid ${COLORS.yellow}` : 'none',
            padding: '0 12px', transition: 'all 0.2s'
          }}
          onClick={() => handlePlayNow(path)}
        >
          {isActive ? '▶ PLAYING' : '▶ PLAY NOW'}
        </button>

        <button style={{ ...outlineBtn, padding: '0 10px' }} onClick={() => movePlaylistItem(idx, -1)} disabled={idx === 0}>
          ↑
        </button>

        <button style={{ ...outlineBtn, padding: '0 10px' }} onClick={() => movePlaylistItem(idx, 1)} disabled={isLast}>
          ↓
        </button>

        <button
          style={{ ...outlineBtn, borderColor: 'transparent', color: COLORS.red, padding: '0 12px' }}
          onClick={() => removeFromPlaylist(idx)}
        >
          DEL
        </button>
      </div>
    </div>
  </div>
));

export default function HighlightEditor({
  density = 'standard',
  densityTokens,
  isDense = false,
  isUltra = false
}) {
  const { matchData, updateData } = useMatchContext();
  const { obsStatus, playHighlight } = useOBS(); 

  // 🚀 优化：使用 useMemo 缓存环境配置
  const t = useMemo(() => densityTokens || {
    blockGap: 10, panelPadding: '12px 14px', panelPaddingLg: '14px 16px', buttonFontSize: 12
  }, [densityTokens]);

  const ui = useMemo(() => createEditorUi(densityTokens, density), [densityTokens, density]);

  const rowH = density === 'spacious' ? 40 : 36;
  const gap = density === 'spacious' ? 10 : 8;
  const leftColWidth = density === 'spacious' ? '390px' : '360px';

  const highlightLibrary = Array.isArray(matchData.highlightLibrary) ? matchData.highlightLibrary : [];
  const highlightPlaylist = Array.isArray(matchData.highlightPlaylist) ? matchData.highlightPlaylist : [];

  const controlInput = { ...ui.input, minHeight: rowH, height: rowH, boxSizing: 'border-box', paddingTop: 0, paddingBottom: 0, fontSize: density === 'spacious' ? '13px' : '12px' };
  const actionBtn = { ...ui.actionBtn, minHeight: rowH, height: rowH, boxSizing: 'border-box', fontWeight: 900 };
  const outlineBtn = { ...ui.outlineBtn, minHeight: rowH, height: rowH, boxSizing: 'border-box', fontWeight: 900 };
  const softBtn = { ...ui.btn, minHeight: rowH, height: rowH, boxSizing: 'border-box', fontWeight: 900 };

  const handlePlayNow = async (path) => {
    updateData({ ...matchData, activeHighlightPath: path });
    if (obsStatus === 'connected' && typeof playHighlight === 'function') {
      try {
        await playHighlight('ReplaySource', path, 'ReplayScene');
      } catch (error) {
        console.error('Failed to trigger OBS play command:', error);
      }
    } else {
      console.log(`[OBS OFF] UI State updated for path: ${path}`);
    }
  };

  const fetchLatestReplay = () => {
    alert('OBS WebSocket Integration Pending: 稍后将支持自动拉取最新回放文件并生成时间戳命名。');
  };

  const addHighlight = () => {
    const name = window.prompt('Enter highlight display name:');
    if (!name) return;
    const path = window.prompt('Enter highlight file path:', '/assets/highlights/');
    if (!path) return;
    updateData({ ...matchData, highlightLibrary: [...highlightLibrary, { name, path }] });
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
    updateData({ ...matchData, highlightPlaylist: [...highlightPlaylist, path] });
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

  const clearPlaylist = () => {
    if (highlightPlaylist.length === 0) return;
    if (!window.confirm('Clear all items from the playback queue?')) return;
    updateData({ ...matchData, highlightPlaylist: [] });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isUltra ? '1fr' : `${leftColWidth} minmax(0,1fr)`, gap: t.blockGap, alignItems: 'stretch' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: isDense ? '1fr' : '1fr 1fr', gap }}>
            <button
              style={{ ...softBtn, backgroundColor: matchData.highlightMuted ? COLORS.red : COLORS.green, color: '#fff' }}
              onClick={() => updateData({ ...matchData, highlightMuted: !matchData.highlightMuted })}
            >
              {matchData.highlightMuted ? 'Muted' : 'Audio On'}
            </button>
            <button
              style={{ ...outlineBtn, borderColor: COLORS.yellow, color: COLORS.yellow }}
              onClick={() => updateData({ ...matchData, activeHighlightPath: '' })}
            >
              Clear Active
            </button>
          </div>

          <SectionHint text="Manage the highlight scene source path, library assets, and playback playlist here." density={density} />

          <div style={{ ...panelBase, padding: t.panelPadding, borderLeft: `3px solid ${COLORS.yellow}`, display: 'grid', gap, alignContent: 'start' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap, alignItems: 'center', paddingBottom: gap, borderBottom: `1px solid ${COLORS.line}` }}>
              <div>
                <div style={{ color: COLORS.white, fontWeight: 900, fontSize: density === 'spacious' ? '13px' : '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>Playlist</div>
                <div style={{ color: COLORS.faintWhite, fontSize: '10px', marginTop: '4px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Playback Queue</div>
              </div>

              <button
                style={{ ...outlineBtn, borderColor: 'transparent', color: COLORS.red, minHeight: 24, height: 24, padding: '0 8px', fontSize: '10px', letterSpacing: '0.5px', display: highlightPlaylist.length > 0 ? 'flex' : 'none' }}
                onClick={clearPlaylist}
              >
                CLEAR QUEUE
              </button>

              <div style={{ minHeight: rowH, height: rowH, minWidth: '52px', padding: '0 10px', border: `1px solid ${COLORS.line}`, background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.softWhite, fontWeight: 900, fontSize: '12px', boxSizing: 'border-box' }}>
                {highlightPlaylist.length}
              </div>
            </div>

            <div style={{ display: 'grid', gap }}>
              {highlightPlaylist.map((path, idx) => (
                <HighlightPlaylistItem
                  key={`${path}-${idx}`} // 使用 path+idx 作为 key，防止乱序
                  path={path}
                  idx={idx}
                  item={highlightLibrary.find(v => v.path === path)}
                  isActive={matchData.activeHighlightPath === path}
                  isLast={idx === highlightPlaylist.length - 1}
                  rowH={rowH}
                  gap={gap}
                  t={t}
                  ui={ui}
                  actionBtn={actionBtn}
                  outlineBtn={outlineBtn}
                  handlePlayNow={handlePlayNow}
                  movePlaylistItem={movePlaylistItem}
                  removeFromPlaylist={removeFromPlaylist}
                />
              ))}

              {highlightPlaylist.length === 0 && (
                <div style={{ color: COLORS.faintWhite, textAlign: 'center', padding: '18px 10px', border: `1px dashed ${COLORS.lineStrong}`, fontSize: density === 'spacious' ? '12px' : '11px' }}>
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
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={{ ...softBtn, backgroundColor: 'rgba(244,195,32,0.15)', color: COLORS.yellow, border: `1px solid ${COLORS.yellow}`, padding: density === 'spacious' ? '0 14px' : '0 12px' }} onClick={fetchLatestReplay}>
              Fetch Latest
            </button>
            <button style={{ ...softBtn, backgroundColor: COLORS.blue, color: '#fff', padding: density === 'spacious' ? '0 14px' : '0 12px' }} onClick={addHighlight}>
              + Manual Add
            </button>
          </div>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: isDense ? '1fr' : '1fr 1fr', gap }}>
          {highlightLibrary.map((v, i) => {
            const isInPlaylist = highlightPlaylist.includes(v.path);
            const isActive = matchData.activeHighlightPath === v.path;

            return (
              <div key={`${v.path}-${i}`} style={{ ...panelBase, padding: t.panelPadding, borderLeft: isActive ? `3px solid ${COLORS.yellow}` : `3px solid transparent`, minWidth: 0 }}>
                <div style={{ display: 'grid', gap }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap, alignItems: 'start' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: COLORS.white, fontWeight: 900, fontSize: density === 'spacious' ? '12px' : '11px', wordBreak: 'break-word' }}>{v.name}</div>
                      <div style={{ color: COLORS.faintWhite, fontSize: '10px', marginTop: '4px', wordBreak: 'break-all' }}>{v.path}</div>
                    </div>
                    <div style={{ minHeight: rowH, height: rowH, minWidth: '56px', padding: '0 10px', border: `1px solid ${isActive ? 'rgba(244,195,32,0.35)' : COLORS.line}`, background: isActive ? 'rgba(244,195,32,0.14)' : 'rgba(255,255,255,0.02)', color: isActive ? COLORS.yellow : COLORS.faintWhite, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', boxSizing: 'border-box', whiteSpace: 'nowrap' }}>
                      {isActive ? 'Live' : 'Idle'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button style={{ ...actionBtn, backgroundColor: isActive ? 'rgba(244,195,32,0.2)' : COLORS.red, color: isActive ? COLORS.yellow : '#fff', border: isActive ? `1px solid ${COLORS.yellow}` : 'none', padding: density === 'spacious' ? '0 12px' : '0 10px' }} onClick={() => handlePlayNow(v.path)}>
                      {isActive ? '▶ PLAYING' : '▶ PLAY NOW'}
                    </button>
                    <button style={{ ...softBtn, backgroundColor: isInPlaylist ? '#555' : COLORS.green, color: isInPlaylist ? '#bbb' : '#fff', padding: density === 'spacious' ? '0 12px' : '0 10px' }} disabled={isInPlaylist} onClick={() => addToPlaylist(v.path)}>
                      {isInPlaylist ? 'In Queue' : 'Add to Queue'}
                    </button>
                    <button style={{ ...outlineBtn, borderColor: COLORS.red, color: COLORS.red, padding: density === 'spacious' ? '0 12px' : '0 10px' }} onClick={() => deleteHighlight(i)}>
                      DEL
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {highlightLibrary.length === 0 && <div style={{ color: COLORS.faintWhite, textAlign: 'center', padding: '20px 10px', border: `1px dashed ${COLORS.lineStrong}`, gridColumn: '1 / -1', fontSize: density === 'spacious' ? '12px' : '11px' }}>No highlight assets registered</div>}
        </div>
      </ShellPanel>
    </div>
  );
}