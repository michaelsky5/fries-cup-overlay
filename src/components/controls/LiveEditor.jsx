import React, { useState } from 'react';
import { useMatchContext } from '../../contexts/MatchContext';
import { ShellPanel, Field } from '../common/SharedUI';
import { COLORS, labelStyle, panelBase } from '../../constants/styles';
import { LOGO_LIST } from '../../constants/logos';
import { HERO_DATA } from '../../constants/gameData';
import { createEditorUi } from '../../utils/editorUi';

export default function LiveEditor({
  handleSwapTeams,
  isDense,
  isUltra,
  isShort,
  density = 'standard',
  densityTokens
}) {
  const { matchData, updateData, updateWithHistory, setPreviewScene } = useMatchContext();

  const t = densityTokens || {
    panelPadding: '12px',
    inputPadding: '8px 10px',
    inputFontSize: 12,
    buttonPadding: '8px 10px',
    buttonFontSize: 12,
    blockGap: 10
  };

  const ui = createEditorUi(densityTokens, density);
  const is1080Compact = isShort || isDense || density === 'compact' || density === 'ultra';
  const library = matchData.rosterPresetLibrary || [];

  const [selectedPresetA, setSelectedPresetA] = useState('');
  const [selectedPresetB, setSelectedPresetB] = useState('');

  const livePanelBodyPadding = is1080Compact ? '10px 12px' : density === 'spacious' ? '14px 16px' : t.panelPadding;
  const rootGap = is1080Compact ? 8 : t.blockGap;
  const liveMainGap = is1080Compact ? 10 : t.blockGap;
  const stackGap = is1080Compact ? '7px' : density === 'spacious' ? '10px' : '9px';
  const innerGap = is1080Compact ? '6px' : '8px';
  const tightGap = is1080Compact ? '4px' : '6px';
  const sectionTopGap = is1080Compact ? '6px' : '8px';

  const sectionTitleStyle = {
    fontSize: is1080Compact ? '10px' : '11px',
    color: COLORS.softWhite,
    fontWeight: '900',
    letterSpacing: is1080Compact ? '1.6px' : '2px',
    textTransform: 'uppercase'
  };

  const compactBtnPad = is1080Compact ? '6px 8px' : undefined;
  const compactInputPad = is1080Compact ? '7px 8px' : t.inputPadding;
  const subButtonHeight = is1080Compact ? 24 : density === 'spacious' ? 32 : density === 'ultra' ? 28 : 30;
  const playerCols = isUltra ? 'repeat(2, minmax(0,1fr))' : 'repeat(5, minmax(0,1fr))';

  const liveMainTemplate = isUltra ? '1fr' : is1080Compact ? 'minmax(0,1fr) 250px minmax(0,1fr)' : density === 'spacious' ? 'minmax(320px,1fr) 320px minmax(320px,1fr)' : 'minmax(0,1fr) 280px minmax(0,1fr)';

  const getBanInfo = bans => {
    const currentBan = bans?.[0] || 'damage/tbd';
    return {
      role: currentBan.includes('/') ? currentBan.split('/')[0] : 'damage',
      hero: currentBan.includes('/') ? currentBan.split('/')[1] : 'tbd'
    };
  };

  const banA = getBanInfo(matchData.bansA);
  const banB = getBanInfo(matchData.bansB);

  // ==========================================
  // 🐛 修复 1：正确读取当前地图的数据来判断 ATK/DEF
  // ==========================================
  const currentMapIdx = Math.max(0, (matchData.currentMap || 1) - 1);
  const currentMapData = matchData.mapLineup?.[currentMapIdx] || {};
  
  const rawMapType = currentMapData.type || matchData.currentMapType || matchData.mapType || '';
  const currentMapType = rawMapType.split(' ')[0].toLowerCase();
  const showSideControl = ['hybrid', 'escort', 'payload'].includes(currentMapType);

  // 优先读取 mapLineup 里的 attackSide，退化读取根目录的 attackSide
  const attackSide = currentMapData.attackSide || matchData.attackSide || '';
  const sideLeftLabel = attackSide === 'A' ? 'ATK' : 'DEF';
  const sideRightLabel = attackSide === 'B' ? 'ATK' : 'DEF';

  const toggleAttackDefense = () => {
    const nextSide = attackSide === 'A' ? 'B' : 'A';
    
    // 必须要对 mapLineup 数组进行不可变更新，HUD 才能监听到
    const nextMapLineup = [...(matchData.mapLineup || [])];
    if (nextMapLineup[currentMapIdx]) {
      nextMapLineup[currentMapIdx] = {
        ...nextMapLineup[currentMapIdx],
        attackSide: nextSide
      };
    }

    updateWithHistory('Toggle side status', {
      ...matchData,
      attackSide: nextSide, // 同步更新外层以防万一
      mapLineup: nextMapLineup // 更新核心的地图数组
    });
  };
  // ==========================================

  const loadTeamFromLibrary = (side, presetKey) => {
    if (!presetKey) return;
    const preset = library.find(p => p.key === presetKey);
    if (!preset) return;

    const isA = side === 'A';
    const tData = preset.data;
    const top5Players = (tData.players || []).slice(0, 5).map(p => p.nickname || p.battleTag || '');
    while (top5Players.length < 5) top5Players.push('');

    const savedLogo = tData.logo || tData.logoPath || tData.teamLogo;
    const isLogoValid = LOGO_LIST.some(l => l.path === savedLogo);
    const finalLogo = isLogoValid ? savedLogo : (LOGO_LIST[0]?.path || '');

    updateWithHistory(`Load team ${side}: ${preset.name}`, {
      ...matchData,
      [isA ? 'teamA' : 'teamB']: tData.teamName || preset.name,
      [isA ? 'logoA' : 'logoB']: finalLogo,
      [isA ? 'playersA' : 'playersB']: top5Players,
      [isA ? 'rosterPlayersA' : 'rosterPlayersB']: tData.players || [],
      [isA ? 'rosterStaffA' : 'rosterStaffB']: {
        clubName: tData.clubName || '',
        showClubName: true,
        manager: tData.manager || { nickname: '', battleTag: '' },
        coaches: tData.coaches || []
      }
    });
  };

  const controlRowHeight = is1080Compact ? '40px' : '44px';

  const getRosterOptionsForSide = side => {
    const roster = side === 'A' ? (matchData.rosterPlayersA || []) : (matchData.rosterPlayersB || []);
    return roster
      .filter(p => (p?.nickname || '').trim())
      .map((p, idx) => ({
        value: p.nickname, label: p.nickname, battleTag: p.battleTag || '', role: p.role || '', hero: p.hero || '', idx
      }));
  };

  // ==========================================
  // 🐛 修复 2：将内部组件改成普通的渲染函数，解决输入框闪断失焦的问题
  // ==========================================
  const renderTeamControl = (side) => {
    const isA = side === 'A';
    const teamName = isA ? matchData.teamA : matchData.teamB;
    const logo = isA ? matchData.logoA : matchData.logoB;
    const logoBg = isA ? matchData.logoBgA : matchData.logoBgB;
    const players = isA ? matchData.playersA : matchData.playersB;
    const subIndex = isA ? matchData.subIndexA : matchData.subIndexB;
    const banInfo = isA ? banA : banB;

    const sideLabel = isA ? sideLeftLabel : sideRightLabel;
    const sideActive = isA ? attackSide === 'A' : attackSide === 'B';
    const banOrderLabel = isA ? (matchData.banOrderMode === 'B_FIRST' ? 'A SECOND' : 'A FIRST') : (matchData.banOrderMode === 'B_FIRST' ? 'B FIRST' : 'B SECOND');
    const banPanelOpacity = matchData.showBans ? 1 : 0.58;

    return (
      <ShellPanel title={`Team ${side} Control`} accent density={density} style={{ height: '100%' }} bodyStyle={{ padding: livePanelBodyPadding, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'grid', gap: stackGap, height: '100%' }}>
          
          <div style={{ display: 'grid', gap: '5px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: isUltra ? '1fr' : showSideControl ? 'minmax(0,1fr) 116px 132px' : 'minmax(0,1fr) 132px', gap: innerGap, alignItems: 'end' }}>
              <div style={{ ...labelStyle, marginBottom: 0, fontSize: is1080Compact ? '10px' : labelStyle.fontSize }}>TEAM PRESET</div>
              {!isUltra && showSideControl && <div style={{ ...labelStyle, marginBottom: 0, fontSize: is1080Compact ? '10px' : labelStyle.fontSize, textAlign: 'center' }}>SIDE STATUS</div>}
              {!isUltra && <div style={{ ...labelStyle, marginBottom: 0, fontSize: is1080Compact ? '10px' : labelStyle.fontSize, textAlign: 'center' }}>WINNER</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isUltra ? '1fr' : showSideControl ? 'minmax(0,1fr) 116px 132px' : 'minmax(0,1fr) 132px', gap: innerGap, alignItems: 'center' }}>
              <select style={{ ...ui.select, padding: compactInputPad, minWidth: 0, height: controlRowHeight, color: library.length ? COLORS.yellow : COLORS.softWhite, borderColor: 'rgba(255,255,255,0.14)', fontWeight: '900' }} value={isA ? selectedPresetA : selectedPresetB} disabled={!library.length} onChange={e => {
                const next = e.target.value;
                if (isA) setSelectedPresetA(next); else setSelectedPresetB(next);
                if (next) loadTeamFromLibrary(side, next);
              }}>
                <option value="" style={{ color: COLORS.white }}>{library.length ? '-- LOAD AND REPLACE CURRENT TEAM --' : '-- NO TEAM PRESETS --'}</option>
                {library.map(p => <option key={p.key} value={p.key} style={{ color: COLORS.black }}>{p.name}</option>)}
              </select>

              {!isUltra && showSideControl && (
                <button style={{ ...ui.outlineBtn, padding: compactBtnPad || ui.outlineBtn.padding, height: controlRowHeight, minHeight: controlRowHeight, fontSize: is1080Compact ? '11px' : undefined, backgroundColor: sideActive ? 'rgba(244,195,32,0.16)' : 'rgba(255,255,255,0.04)', color: sideActive ? COLORS.yellow : COLORS.softWhite, borderColor: sideActive ? COLORS.yellow : 'rgba(255,255,255,0.14)', fontWeight: '900', width: '100%', whiteSpace: 'nowrap' }} onClick={toggleAttackDefense}>
                  {sideLabel}
                </button>
              )}

              {/* 🎯 修改点：非 Ultra 模式下的 TEAM WIN 按钮 */}
              {!isUltra && (
                <button style={{ ...ui.actionBtn, padding: compactBtnPad || ui.actionBtn.padding, height: controlRowHeight, minHeight: controlRowHeight, fontSize: is1080Compact ? '11px' : undefined, fontWeight: '900', width: '100%', whiteSpace: 'nowrap' }} onClick={() => {
                  updateWithHistory(`Set Team ${side} as winner and TAKE`, { 
                    ...matchData, 
                    globalScene: 'WINNER', // 强制主画面切过去
                    winnerScene: { ...(matchData.winnerScene || {}), winner: side, title: 'WINNER' } 
                  });
                  setPreviewScene?.('WINNER'); // 让 Preview 保持同步
                }}>
                  {isA ? 'TEAM A WIN' : 'TEAM B WIN'}
                </button>
              )}
            </div>

            {isUltra && (
              <div style={{ display: 'grid', gridTemplateColumns: showSideControl ? '1fr 1fr' : '1fr', gap: innerGap }}>
                {showSideControl && (
                  <button style={{ ...ui.outlineBtn, padding: compactBtnPad || ui.outlineBtn.padding, height: controlRowHeight, minHeight: controlRowHeight, fontSize: is1080Compact ? '11px' : undefined, backgroundColor: sideActive ? 'rgba(244,195,32,0.16)' : 'rgba(255,255,255,0.04)', color: sideActive ? COLORS.yellow : COLORS.softWhite, borderColor: sideActive ? COLORS.yellow : 'rgba(255,255,255,0.14)', fontWeight: '900', width: '100%', whiteSpace: 'nowrap' }} onClick={toggleAttackDefense}>
                    {sideLabel}
                  </button>
                )}
                {/* 🎯 修改点：Ultra 模式下的 TEAM WIN 按钮 */}
                <button style={{ ...ui.actionBtn, padding: compactBtnPad || ui.actionBtn.padding, height: controlRowHeight, minHeight: controlRowHeight, fontSize: is1080Compact ? '11px' : undefined, fontWeight: '900', width: '100%', whiteSpace: 'nowrap' }} onClick={() => {
                  updateWithHistory(`Set Team ${side} as winner and TAKE`, { 
                    ...matchData, 
                    globalScene: 'WINNER', // 强制主画面切过去
                    winnerScene: { ...(matchData.winnerScene || {}), winner: side, title: 'WINNER' } 
                  });
                  setPreviewScene?.('WINNER'); // 让 Preview 保持同步
                }}>
                  {isA ? 'TEAM A WIN' : 'TEAM B WIN'}
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gap: '5px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: isUltra ? '1fr' : '1.4fr 1fr 96px', gap: innerGap, alignItems: 'end' }}>
              <div style={{ ...labelStyle, marginBottom: 0, fontSize: is1080Compact ? '10px' : labelStyle.fontSize }}>TEAM NAME</div>
              {!isUltra && <div style={{ ...labelStyle, marginBottom: 0, fontSize: is1080Compact ? '10px' : labelStyle.fontSize }}>LOGO</div>}
              {!isUltra && <div style={{ ...labelStyle, marginBottom: 0, fontSize: is1080Compact ? '10px' : labelStyle.fontSize }}>LOGO BG</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isUltra ? '1fr' : '1.4fr 1fr 96px', gap: innerGap, alignItems: 'center' }}>
              <input style={{ ...ui.input, padding: compactInputPad, height: controlRowHeight, fontSize: is1080Compact ? '14px' : density === 'spacious' ? '17px' : '16px', fontWeight: '900' }} value={teamName} onChange={e => updateData(prev => ({ ...prev, [isA ? 'teamA' : 'teamB']: e.target.value }))} />
              
              {!isUltra && (
                <select style={{ ...ui.select, padding: compactInputPad, height: controlRowHeight }} value={logo} onChange={e => updateData(prev => ({ ...prev, [isA ? 'logoA' : 'logoB']: e.target.value }))}>
                  {LOGO_LIST.map(l => <option key={l.path} value={l.path}>{l.name}</option>)}
                </select>
              )}

              {!isUltra && (
                <select style={{ ...ui.select, padding: compactInputPad, height: controlRowHeight }} value={logoBg} onChange={e => updateData(prev => ({ ...prev, [isA ? 'logoBgA' : 'logoBgB']: e.target.value }))}>
                  <option value={COLORS.mainDark}>DARK</option>
                  <option value={COLORS.white}>LIGHT</option>
                </select>
              )}
            </div>

            {isUltra && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 92px', gap: innerGap }}>
                <Field label="LOGO" density={density}>
                  <select style={{ ...ui.select, padding: compactInputPad, height: controlRowHeight }} value={logo} onChange={e => updateData(prev => ({ ...prev, [isA ? 'logoA' : 'logoB']: e.target.value }))}>
                    {LOGO_LIST.map(l => <option key={l.path} value={l.path}>{l.name}</option>)}
                  </select>
                </Field>

                <Field label="LOGO BG" density={density}>
                  <select style={{ ...ui.select, padding: compactInputPad, height: controlRowHeight }} value={logoBg} onChange={e => updateData(prev => ({ ...prev, [isA ? 'logoBgA' : 'logoBgB']: e.target.value }))}>
                    <option value={COLORS.mainDark}>DARK</option>
                    <option value={COLORS.white}>LIGHT</option>
                  </select>
                </Field>
              </div>
            )}
          </div>

          <div style={{ backgroundColor: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.18)', padding: is1080Compact ? '8px 10px' : t.panelPadding, display: 'grid', gap: '5px', opacity: banPanelOpacity }}>
            <div style={{ display: 'grid', gridTemplateColumns: isUltra ? '1fr' : '110px 120px 1fr 1fr', gap: innerGap, alignItems: 'center' }}>
              <div style={{ ...labelStyle, marginBottom: 0, color: '#ff7d7d', fontSize: is1080Compact ? '10px' : labelStyle.fontSize }}>BAN SLOT</div>
              {!isUltra && (
                <>
                  <button style={{ ...ui.outlineBtn, padding: compactBtnPad || ui.outlineBtn.padding, height: controlRowHeight, minHeight: controlRowHeight, fontSize: is1080Compact ? '11px' : undefined, backgroundColor: 'rgba(255,255,255,0.04)', color: COLORS.softWhite, borderColor: 'rgba(255,255,255,0.14)', fontWeight: '900', whiteSpace: 'nowrap' }} onClick={() => updateWithHistory(matchData.banOrderMode === 'B_FIRST' ? 'Set ban order A first' : 'Set ban order B first', { ...matchData, banOrderMode: matchData.banOrderMode === 'B_FIRST' ? 'A_FIRST' : 'B_FIRST' })}>
                    {banOrderLabel}
                  </button>
                  <select style={{ ...ui.select, padding: compactInputPad, height: controlRowHeight }} value={banInfo.role} onChange={e => updateData(prev => ({ ...prev, [isA ? 'bansA' : 'bansB']: [`${e.target.value}/tbd`] }))}>
                    <option value="tank">TANK</option>
                    <option value="damage">DPS</option>
                    <option value="support">SUP</option>
                  </select>
                  <select style={{ ...ui.select, padding: compactInputPad, height: controlRowHeight }} value={banInfo.hero} onChange={e => updateData(prev => ({ ...prev, [isA ? 'bansA' : 'bansB']: [`${banInfo.role}/${e.target.value}`] }))}>
                    <option value="tbd">TBD</option>
                    {HERO_DATA[banInfo.role].map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </>
              )}
            </div>

            {isUltra && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: innerGap }}>
                <button style={{ ...ui.outlineBtn, padding: compactBtnPad || ui.outlineBtn.padding, height: controlRowHeight, minHeight: controlRowHeight, fontSize: is1080Compact ? '11px' : undefined, backgroundColor: 'rgba(255,255,255,0.04)', color: COLORS.softWhite, borderColor: 'rgba(255,255,255,0.14)', fontWeight: '900', whiteSpace: 'nowrap' }} onClick={() => updateWithHistory(matchData.banOrderMode === 'B_FIRST' ? 'Set ban order A first' : 'Set ban order B first', { ...matchData, banOrderMode: matchData.banOrderMode === 'B_FIRST' ? 'A_FIRST' : 'B_FIRST' })}>
                  {banOrderLabel}
                </button>
                <select style={{ ...ui.select, padding: compactInputPad, height: controlRowHeight }} value={banInfo.role} onChange={e => updateData(prev => ({ ...prev, [isA ? 'bansA' : 'bansB']: [`${e.target.value}/tbd`] }))}>
                  <option value="tank">TANK</option>
                  <option value="damage">DPS</option>
                  <option value="support">SUP</option>
                </select>
                <select style={{ ...ui.select, padding: compactInputPad, height: controlRowHeight }} value={banInfo.hero} onChange={e => updateData(prev => ({ ...prev, [isA ? 'bansA' : 'bansB']: [`${banInfo.role}/${e.target.value}`] }))}>
                  <option value="tbd">TBD</option>
                  {HERO_DATA[banInfo.role].map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            )}
          </div>

          <Field label="PLAYER STATUS" density={density}>
            <div style={{ display: 'grid', gridTemplateColumns: playerCols, gap: tightGap }}>
              {players.map((p, i) => {
                const rosterOptions = getRosterOptionsForSide(side);
                const currentValue = p || '';
                return (
                  <div key={i} style={{ display: 'grid', gridTemplateRows: `${controlRowHeight} ${subButtonHeight}px`, gap: is1080Compact ? '3px' : '4px' }}>
                    <select style={{ ...ui.select, textAlign: 'center', padding: is1080Compact ? '6px 5px' : density === 'ultra' ? '7px 6px' : t.inputPadding, fontSize: is1080Compact ? '11px' : `${t.inputFontSize}px`, height: controlRowHeight }} value={currentValue} onChange={e => {
                      const newP = [...players];
                      newP[i] = e.target.value;
                      updateData(prev => ({ ...prev, [isA ? 'playersA' : 'playersB']: newP }));
                    }}>
                      <option value="">-- SELECT --</option>
                      {rosterOptions.map(opt => <option key={`${opt.value}-${opt.idx}`} value={opt.value}>{opt.label}</option>)}
                    </select>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tightGap }}>
                      <button style={{ ...ui.outlineBtn, padding: is1080Compact ? '0 4px' : density === 'ultra' ? '0 6px' : '0 8px', minHeight: `${subButtonHeight}px`, fontSize: is1080Compact ? '10px' : `${t.buttonFontSize}px`, whiteSpace: 'nowrap' }} onClick={() => updateWithHistory(`Trigger key player ${currentValue || `P${i + 1}`}`, { ...matchData, keyPlayerTriggerAt: Date.now(), keyPlayerSide: side, keyPlayerName: currentValue || `P${i + 1}` })}>
                        KEY
                      </button>
                      <button style={{ ...ui.outlineBtn, padding: is1080Compact ? '0 4px' : density === 'ultra' ? '0 6px' : '0 8px', backgroundColor: subIndex === i ? COLORS.yellow : 'transparent', color: subIndex === i ? COLORS.black : COLORS.softWhite, minHeight: `${subButtonHeight}px`, fontSize: is1080Compact ? '10px' : `${t.buttonFontSize}px`, whiteSpace: 'nowrap' }} onClick={() => updateWithHistory(subIndex === i ? `Clear TEAM ${side} sub status` : `TEAM ${side} sub in ${currentValue || `P${i + 1}`}`, { ...matchData, [isA ? 'subIndexA' : 'subIndexB']: subIndex === i ? null : i })}>
                        {subIndex === i ? 'IN' : 'SUB'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Field>

        </div>
      </ShellPanel>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: rootGap }}>
      <div style={{ display: 'grid', gridTemplateColumns: liveMainTemplate, gap: liveMainGap, alignItems: 'stretch' }}>
        
        {/* 用函数调用的方式渲染，避免焦点丢失 */}
        {renderTeamControl('A')}

        <ShellPanel title="Live Core Control" accent density={density} style={{ height: '100%' }} bodyStyle={{ padding: livePanelBodyPadding, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: stackGap, height: '100%' }}>
            
            <div style={{ ...panelBase, padding: is1080Compact ? '10px' : t.panelPadding, borderTop: `2px solid ${COLORS.yellow}` }}>
              <div style={sectionTitleStyle}>Score Control</div>
              <div style={{ marginTop: sectionTopGap, display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: innerGap }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: is1080Compact ? '24px' : density === 'spacious' ? '36px' : '32px', fontWeight: '900', color: COLORS.white, lineHeight: 1 }}>{matchData.scoreA}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginTop: sectionTopGap }}>
                    <button style={{ ...ui.outlineBtn, padding: is1080Compact ? '5px 0' : '7px 0', fontSize: is1080Compact ? '11px' : undefined }} onClick={() => updateWithHistory('TEAM A -1', { ...matchData, scoreA: Math.max(0, matchData.scoreA - 1) })}>-1</button>
                    <button style={{ ...ui.actionBtn, padding: is1080Compact ? '5px 0' : '7px 0', fontSize: is1080Compact ? '11px' : undefined }} onClick={() => updateWithHistory('TEAM A +1', { ...matchData, scoreA: matchData.scoreA + 1 })}>+1</button>
                  </div>
                </div>
                <div style={{ fontSize: is1080Compact ? '13px' : density === 'spacious' ? '16px' : '15px', fontWeight: '900', color: COLORS.yellow, letterSpacing: is1080Compact ? '1px' : '2px' }}>VS</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: is1080Compact ? '24px' : density === 'spacious' ? '36px' : '32px', fontWeight: '900', color: COLORS.white, lineHeight: 1 }}>{matchData.scoreB}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginTop: sectionTopGap }}>
                    <button style={{ ...ui.outlineBtn, padding: is1080Compact ? '5px 0' : '7px 0', fontSize: is1080Compact ? '11px' : undefined }} onClick={() => updateWithHistory('TEAM B -1', { ...matchData, scoreB: Math.max(0, matchData.scoreB - 1) })}>-1</button>
                    <button style={{ ...ui.actionBtn, padding: is1080Compact ? '5px 0' : '7px 0', fontSize: is1080Compact ? '11px' : undefined }} onClick={() => updateWithHistory('TEAM B +1', { ...matchData, scoreB: matchData.scoreB + 1 })}>+1</button>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ ...panelBase, padding: is1080Compact ? '9px 10px' : t.panelPadding, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'grid', gap: is1080Compact ? '10px' : '12px', height: '100%', alignContent: 'space-between' }}>
                <div>
                  <div style={sectionTitleStyle}>Voice Comms</div>
                  <div style={{ marginTop: sectionTopGap, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: tightGap, width: '100%' }}>
                    <button style={{ ...ui.outlineBtn, padding: compactBtnPad || ui.outlineBtn.padding, minHeight: is1080Compact ? '34px' : '38px', fontSize: is1080Compact ? '11px' : undefined, backgroundColor: matchData.activeComms === 'A' ? COLORS.yellow : 'transparent', color: matchData.activeComms === 'A' ? COLORS.black : COLORS.softWhite, borderColor: matchData.activeComms === 'A' ? COLORS.yellow : 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }} onClick={() => updateData(prev => ({ ...prev, activeComms: 'A' }))}>LEFT</button>
                    <button style={{ ...ui.outlineBtn, padding: compactBtnPad || ui.outlineBtn.padding, minHeight: is1080Compact ? '34px' : '38px', fontSize: is1080Compact ? '11px' : undefined, backgroundColor: matchData.activeComms === null ? 'rgba(255,255,255,0.08)' : 'transparent', color: matchData.activeComms === null ? COLORS.white : COLORS.softWhite, borderColor: matchData.activeComms === null ? COLORS.yellow : 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }} onClick={() => updateData(prev => ({ ...prev, activeComms: null }))}>OFF</button>
                    <button style={{ ...ui.outlineBtn, padding: compactBtnPad || ui.outlineBtn.padding, minHeight: is1080Compact ? '34px' : '38px', fontSize: is1080Compact ? '11px' : undefined, backgroundColor: matchData.activeComms === 'B' ? COLORS.yellow : 'transparent', color: matchData.activeComms === 'B' ? COLORS.black : COLORS.softWhite, borderColor: matchData.activeComms === 'B' ? COLORS.yellow : 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }} onClick={() => updateData(prev => ({ ...prev, activeComms: 'B' }))}>RIGHT</button>
                  </div>
                </div>

                <div>
                  <div style={sectionTitleStyle}>Live Triggers</div>
                  <div style={{ marginTop: sectionTopGap, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tightGap, width: '100%' }}>
                    <button style={{ ...ui.outlineBtn, backgroundColor: matchData.beginInfoEnabled ? COLORS.yellow : 'transparent', color: matchData.beginInfoEnabled ? COLORS.black : COLORS.softWhite }} onClick={() => updateWithHistory(matchData.beginInfoEnabled ? 'Disable begin info on LIVE switch' : 'Enable begin info on LIVE switch', { ...matchData, beginInfoEnabled: !matchData.beginInfoEnabled })}>AUTO BEGIN</button>
                    <button style={{ ...ui.outlineBtn, padding: compactBtnPad || ui.outlineBtn.padding, minHeight: is1080Compact ? '38px' : '42px', fontSize: is1080Compact ? '11px' : undefined, backgroundColor: matchData.showPlayers ? 'rgba(244,195,32,0.16)' : 'transparent', color: matchData.showPlayers ? COLORS.yellow : COLORS.softWhite, borderColor: matchData.showPlayers ? COLORS.yellow : 'rgba(255,255,255,0.14)', whiteSpace: 'nowrap' }} onClick={() => updateData(prev => ({ ...prev, showPlayers: !prev.showPlayers }))}>NAME INFO</button>
                    <button style={{ ...ui.outlineBtn, padding: compactBtnPad || ui.outlineBtn.padding, minHeight: is1080Compact ? '38px' : '42px', fontSize: is1080Compact ? '11px' : undefined, backgroundColor: matchData.showBans ? 'rgba(255,77,77,0.16)' : 'transparent', color: matchData.showBans ? '#ff8f8f' : COLORS.softWhite, borderColor: matchData.showBans ? COLORS.banRed : 'rgba(255,255,255,0.14)', whiteSpace: 'nowrap' }} onClick={() => updateWithHistory(matchData.showBans ? 'Disable ban mode' : 'Enable ban mode', { ...matchData, showBans: !matchData.showBans, showBanPhase: !matchData.showBans ? matchData.showBanPhase : false })}>BAN MODE</button>
                    <button style={{ ...ui.btn, backgroundColor: 'rgba(255,77,77,0.92)', color: '#fff', padding: compactBtnPad || ui.btn.padding, minHeight: is1080Compact ? '38px' : '42px', fontSize: is1080Compact ? '11px' : undefined, border: `1px solid ${COLORS.banRed}`, whiteSpace: 'nowrap' }} onClick={() => updateWithHistory(matchData.showBanPhase ? 'Close ban phase' : 'Open ban phase', { ...matchData, showBanPhase: !matchData.showBanPhase, heroBanTriggerAt: !matchData.showBanPhase ? Date.now() : matchData.heroBanTriggerAt })}>
                      {matchData.showBanPhase ? 'CLOSE BAN' : 'BAN PHASE'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </ShellPanel>

        {/* 同样用函数调用的方式渲染 */}
        {renderTeamControl('B')}
      </div>

      <ShellPanel title="Ticker Control" accent bodyStyle={{ padding: is1080Compact ? '10px 12px' : t.panelPadding }} density={density}>
        <div style={{ display: 'grid', gridTemplateColumns: isUltra ? '1fr' : is1080Compact ? '120px 120px 1fr' : isDense ? '1fr' : density === 'spacious' ? '150px 150px 1fr' : '130px 130px 1fr', gap: is1080Compact ? '8px' : '10px', alignItems: 'center' }}>
          <select style={{ ...ui.select, padding: compactInputPad }} value={matchData.tickerMode || 'INFINITE'} onChange={e => updateData(prev => ({ ...prev, tickerMode: e.target.value }))}>
            <option value="INFINITE">LOOP</option>
            <option value="ONCE">ONCE</option>
          </select>
          <button style={{ ...ui.btn, backgroundColor: matchData.showTicker ? '#e74c3c' : '#2ecc71', padding: compactBtnPad || ui.btn.padding, fontSize: is1080Compact ? '11px' : undefined }} onClick={() => updateData(prev => ({ ...prev, showTicker: !prev.showTicker }))}>
            {matchData.showTicker ? 'TICKER OFF' : 'TICKER ON'}
          </button>
          <input style={{ ...ui.input, padding: compactInputPad }} value={matchData.tickerText ?? ''} onChange={e => updateData(prev => ({ ...prev, tickerText: e.target.value }))} placeholder="Enter ticker text..." />
        </div>
      </ShellPanel>
    </div>
  );
}