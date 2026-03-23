import React, { useState, useEffect } from 'react';
import { useMatchContext } from '../../contexts/MatchContext';
import { COLORS, UI, panelBase } from '../../constants/styles';
import { LOGO_LIST } from '../../constants/logos';
import { ShellPanel, Field } from '../common/SharedUI';
import { createEditorUi } from '../../utils/editorUi';

export default function CountdownEditor({
  isDense = false,
  isUltra = false,
  density = 'standard',
  densityTokens
}) {
  // 🌟 引入 updateWithHistory 保护核心操作
  const { matchData, updateData, updateWithHistory } = useMatchContext();

  const t = densityTokens || {
    blockGap: 10,
    panelPadding: '12px 14px',
    panelPaddingLg: '14px 16px',
    inputPadding: '8px 10px',
    inputFontSize: 12,
    buttonPadding: '8px 10px',
    buttonFontSize: 12
  };

  const ui = createEditorUi(densityTokens, density);

  const leftColWidth = density === 'spacious' ? '400px' : '370px';
  const rowH = density === 'spacious' ? 40 : 36;
  const gap = density === 'spacious' ? 10 : 8;

  // 🌟 修复：使用 React 状态管理时间输入框，彻底消灭 getElementById
  const [localMins, setLocalMins] = useState(Math.floor((matchData.countdownSeconds ?? 600) / 60));
  const [localSecs, setLocalSecs] = useState((matchData.countdownSeconds ?? 600) % 60);

  // 如果外部修改了时间（例如重置），同步回局部状态
  useEffect(() => {
    setLocalMins(Math.floor((matchData.countdownSeconds ?? 600) / 60));
    setLocalSecs((matchData.countdownSeconds ?? 600) % 60);
  }, [matchData.countdownSeconds]);

  const controlInput = {
    ...ui.input,
    minHeight: rowH,
    height: rowH,
    boxSizing: 'border-box',
    paddingTop: 0,
    paddingBottom: 0,
    fontSize: density === 'spacious' ? '13px' : '12px'
  };

  const controlSelect = {
    ...ui.select,
    minHeight: rowH,
    height: rowH,
    boxSizing: 'border-box',
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: '12px',
    paddingRight: '34px',
    fontSize: density === 'spacious' ? '13px' : '12px',
    lineHeight: 'normal',
    minWidth: 0,
    textOverflow: 'ellipsis'
  };

  const btnFlex = { display: 'flex', alignItems: 'center', justifyContent: 'center' };

  const actionBtn = {
    ...ui.actionBtn,
    minHeight: rowH,
    height: rowH,
    boxSizing: 'border-box',
    fontWeight: 900,
    ...btnFlex
  };

  const outlineBtn = {
    ...ui.outlineBtn,
    minHeight: rowH,
    height: rowH,
    boxSizing: 'border-box',
    fontWeight: 900,
    ...btnFlex
  };

  const softOutlineBtn = {
    ...ui.softOutlineBtn,
    minHeight: rowH,
    height: rowH,
    boxSizing: 'border-box',
    fontWeight: 900,
    ...btnFlex
  };

  // 🌟 将所有可能导致赛程错乱的操作接入 History
  const setUpcomingMatchField = (index, key, value) => {
    const newList = [...(matchData.upcomingMatches || [])];
    newList[index] = { ...newList[index], [key]: value };
    // 高频输入的文本框我们用普通 updateData 防止历史记录爆炸
    updateData({ ...matchData, upcomingMatches: newList });
  };

  const addUpcomingMatch = () => {
    const currentList = matchData.upcomingMatches || [];
    if (currentList.length >= 4) return alert('You can add up to 4 upcoming matches.');
    
    updateWithHistory('Add Upcoming Match', {
      ...matchData,
      upcomingMatches: [
        ...currentList,
        {
          teamA: 'TEAM A',
          teamB: 'TEAM B',
          logoA: LOGO_LIST[0]?.path || '',
          logoB: LOGO_LIST[0]?.path || '',
          logoBgA: COLORS.mainDark,
          logoBgB: COLORS.mainDark,
          time: '',
          stage: '',
          scoreA: '',
          scoreB: ''
        }
      ]
    });
  };

  const removeUpcomingMatch = index => {
    const newList = [...(matchData.upcomingMatches || [])];
    newList.splice(index, 1);
    updateWithHistory(`Remove Upcoming Match ${index + 1}`, { ...matchData, upcomingMatches: newList });
  };

  // 🌟 终极修复：下发绝对时间戳
  const applyCountdownTime = () => {
    const mins = Math.max(0, parseInt(localMins, 10) || 0);
    const secs = Math.max(0, Math.min(59, parseInt(localSecs, 10) || 0));
    const totalSeconds = mins * 60 + secs;
    
    // 计算出具体的结束时间（当前时间 + 倒计时秒数）
    const absoluteTargetTime = Date.now() + totalSeconds * 1000;
    
    updateWithHistory(`Set Countdown to ${mins}m ${secs}s`, { 
      ...matchData, 
      countdownSeconds: totalSeconds, // 保留用于输入框状态回显
      targetTimestamp: absoluteTargetTime // 真正发给推流画面的“军令”
    });
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: isDense ? '1fr' : `${leftColWidth} minmax(0,1fr)`,
        gap: t.blockGap,
        alignItems: 'stretch'
      }}
    >
      <ShellPanel title="Countdown Text & Timer" accent density={density}>
        <div style={{ display: 'grid', gap }}>
          <Field label="Main Title" density={density}>
            <input
              style={controlInput}
              value={matchData.infoCupName || ''}
              onChange={e => updateData({ ...matchData, infoCupName: e.target.value })}
              placeholder="e.g. FRIES CUP"
            />
          </Field>

          <Field label="Subtitle" density={density}>
            <input
              style={controlInput}
              value={matchData.infoSubtitle || ''}
              onChange={e => updateData({ ...matchData, infoSubtitle: e.target.value })}
              placeholder="e.g. OPEN QUALIFIER // ROUND 1"
            />
          </Field>

          <Field label="Bottom Status" density={density}>
            <input
              style={controlInput}
              value={matchData.matchStageDescription || ''}
              onChange={e => updateData({ ...matchData, matchStageDescription: e.target.value })}
              placeholder="e.g. STREAM STARTING SOON"
            />
          </Field>

          <Field label="Screen Mode" density={density}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isUltra ? '1fr' : '1fr 1fr',
                backgroundColor: '#111',
                border: UI.innerFrame
              }}
            >
              <button
                style={{
                  border: 'none',
                  cursor: 'pointer',
                  minHeight: rowH,
                  height: rowH,
                  fontWeight: 900,
                  fontSize: `${t.buttonFontSize}px`,
                  backgroundColor: matchData.countdownMode === 'FULL' || !matchData.countdownMode ? COLORS.yellow : 'transparent',
                  color: matchData.countdownMode === 'FULL' || !matchData.countdownMode ? COLORS.black : COLORS.softWhite
                }}
                onClick={() => updateData({ ...matchData, countdownMode: 'FULL' })}
              >
                Full
              </button>

              <button
                style={{
                  border: 'none',
                  cursor: 'pointer',
                  minHeight: rowH,
                  height: rowH,
                  fontWeight: 900,
                  fontSize: `${t.buttonFontSize}px`,
                  backgroundColor: matchData.countdownMode === 'VIDEO' ? COLORS.yellow : 'transparent',
                  color: matchData.countdownMode === 'VIDEO' ? COLORS.black : COLORS.softWhite
                }}
                onClick={() => updateData({ ...matchData, countdownMode: 'VIDEO' })}
              >
                Video
              </button>
            </div>
          </Field>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isUltra ? '1fr' : '1fr 1fr',
              gap
            }}
          >
            <Field label="Minutes" density={density}>
              <input
                type="number"
                min="0"
                style={{ ...controlInput, textAlign: 'center' }}
                value={localMins}
                onChange={e => setLocalMins(e.target.value)}
              />
            </Field>

            <Field label="Seconds" density={density}>
              <input
                type="number"
                min="0"
                max="59"
                style={{ ...controlInput, textAlign: 'center' }}
                value={localSecs}
                onChange={e => setLocalSecs(e.target.value)}
              />
            </Field>
          </div>

          <button
            style={{ ...actionBtn, backgroundColor: COLORS.yellow, color: COLORS.black }}
            onClick={applyCountdownTime}
          >
            Apply & Reset Countdown
          </button>
        </div>
      </ShellPanel>

      <ShellPanel
        title="Schedule Board Editor"
        density={density}
        right={
          <button
            style={{ ...actionBtn, backgroundColor: COLORS.yellow, color: COLORS.black, padding: density === 'spacious' ? '0 14px' : '0 12px' }}
            onClick={addUpcomingMatch}
          >
            + Add Match
          </button>
        }
        accent
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isDense ? '1fr' : '1fr 1fr',
            gap
          }}
        >
          {(matchData.upcomingMatches || []).map((m, i) => (
            <div
              key={i}
              style={{
                ...panelBase,
                padding: t.panelPadding,
                borderLeft: `3px solid ${COLORS.yellow}`,
                display: 'grid',
                gap,
                alignContent: 'start',
                minWidth: 0
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
                      fontSize: density === 'spacious' ? '13px' : '12px',
                      fontWeight: 900,
                      color: COLORS.white,
                      letterSpacing: '1px',
                      textTransform: 'uppercase'
                    }}
                  >
                    Match {i + 1}
                  </div>
                  <div
                    style={{
                      fontSize: '10px',
                      fontWeight: 900,
                      color: COLORS.faintWhite,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      marginTop: '4px'
                    }}
                  >
                    Schedule Slot
                  </div>
                </div>

                <button
                  style={{ ...softOutlineBtn, borderColor: '#c0392b', color: '#c0392b', padding: density === 'spacious' ? '0 12px' : '0 10px' }}
                  onClick={() => removeUpcomingMatch(i)}
                >
                  Remove
                </button>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isUltra ? '1fr 1fr' : '88px minmax(0,1fr) 80px 80px',
                  gap
                }}
              >
                <Field label="Time" density={density}>
                  <input
                    style={controlInput}
                    value={m.time || ''}
                    onChange={e => setUpcomingMatchField(i, 'time', e.target.value)}
                    placeholder="19:30"
                  />
                </Field>

                <Field label="Stage" density={density}>
                  <input
                    style={controlInput}
                    value={m.stage || ''}
                    onChange={e => setUpcomingMatchField(i, 'stage', e.target.value)}
                    placeholder="OPEN QUALIFIER"
                  />
                </Field>

                <Field label="Score A" density={density}>
                  <input
                    style={{ ...controlInput, textAlign: 'center', fontWeight: 900 }}
                    value={m.scoreA ?? ''}
                    onChange={e => setUpcomingMatchField(i, 'scoreA', e.target.value)}
                    placeholder="0"
                  />
                </Field>

                <Field label="Score B" density={density}>
                  <input
                    style={{ ...controlInput, textAlign: 'center', fontWeight: 900 }}
                    value={m.scoreB ?? ''}
                    onChange={e => setUpcomingMatchField(i, 'scoreB', e.target.value)}
                    placeholder="0"
                  />
                </Field>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap
                }}
              >
                <Field label="Team A" density={density}>
                  <input
                    style={{ ...controlInput, fontWeight: 900 }}
                    value={m.teamA || ''}
                    onChange={e => setUpcomingMatchField(i, 'teamA', e.target.value)}
                    placeholder="TEAM A"
                  />
                </Field>

                <Field label="Team B" density={density}>
                  <input
                    style={{ ...controlInput, fontWeight: 900 }}
                    value={m.teamB || ''}
                    onChange={e => setUpcomingMatchField(i, 'teamB', e.target.value)}
                    placeholder="TEAM B"
                  />
                </Field>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isUltra ? '1fr 96px' : '1.15fr 96px 1.15fr 96px',
                  gap
                }}
              >
                <Field label="Logo A" density={density}>
                  <select
                    style={controlSelect}
                    value={m.logoA}
                    onChange={e => setUpcomingMatchField(i, 'logoA', e.target.value)}
                  >
                    {LOGO_LIST.map(l => <option key={l.path} value={l.path}>{l.name}</option>)}
                  </select>
                </Field>

                <Field label="BG A" density={density}>
                  <select
                    style={controlSelect}
                    value={m.logoBgA}
                    onChange={e => setUpcomingMatchField(i, 'logoBgA', e.target.value)}
                  >
                    <option value={COLORS.mainDark}>Dark</option>
                    <option value={COLORS.white}>White</option>
                  </select>
                </Field>

                {!isUltra && (
                  <>
                    <Field label="Logo B" density={density}>
                      <select
                        style={controlSelect}
                        value={m.logoB}
                        onChange={e => setUpcomingMatchField(i, 'logoB', e.target.value)}
                      >
                        {LOGO_LIST.map(l => <option key={l.path} value={l.path}>{l.name}</option>)}
                      </select>
                    </Field>

                    <Field label="BG B" density={density}>
                      <select
                        style={controlSelect}
                        value={m.logoBgB}
                        onChange={e => setUpcomingMatchField(i, 'logoBgB', e.target.value)}
                      >
                        <option value={COLORS.mainDark}>Dark</option>
                        <option value={COLORS.white}>White</option>
                      </select>
                    </Field>
                  </>
                )}
              </div>

              {isUltra && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 84px',
                    gap
                  }}
                >
                  <Field label="Logo B" density={density}>
                    <select
                      style={controlSelect}
                      value={m.logoB}
                      onChange={e => setUpcomingMatchField(i, 'logoB', e.target.value)}
                    >
                      {LOGO_LIST.map(l => <option key={l.path} value={l.path}>{l.name}</option>)}
                    </select>
                  </Field>

                  <Field label="BG B" density={density}>
                    <select
                      style={controlSelect}
                      value={m.logoBgB}
                      onChange={e => setUpcomingMatchField(i, 'logoBgB', e.target.value)}
                    >
                      <option value={COLORS.mainDark}>Dark</option>
                      <option value={COLORS.white}>White</option>
                    </select>
                  </Field>
                </div>
              )}
            </div>
          ))}

          {(matchData.upcomingMatches || []).length === 0 && (
            <div
              style={{
                ...panelBase,
                padding: t.panelPaddingLg,
                border: `1px dashed ${COLORS.lineStrong}`,
                gridColumn: '1 / -1',
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  color: COLORS.white,
                  fontWeight: 900,
                  fontSize: density === 'spacious' ? '16px' : '15px',
                  letterSpacing: '1px',
                  textTransform: 'uppercase'
                }}
              >
                No Upcoming Matches
              </div>
              <div
                style={{
                  color: COLORS.faintWhite,
                  fontSize: density === 'spacious' ? '12px' : '11px',
                  marginTop: '8px',
                  lineHeight: 1.6
                }}
              >
                Add up to 4 schedule items for the countdown board.
              </div>
            </div>
          )}
        </div>
      </ShellPanel>
    </div>
  );
}