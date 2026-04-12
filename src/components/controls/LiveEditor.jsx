import React, { useState, useMemo, useCallback } from 'react';
// 🚀 引入 i18n
import { useTranslation } from 'react-i18next';
import { useMatchContext } from '../../contexts/MatchContext';
import { ShellPanel, Field } from '../common/SharedUI';
import { COLORS, labelStyle, panelBase } from '../../constants/styles';
import { LOGO_LIST } from '../../constants/logos';
import { HERO_DATA } from '../../constants/gameData';
import { createEditorUi } from '../../utils/editorUi';
import { needsAttackDefense } from '../../constants/gameData';

const TeamControlPanel = React.memo(({
  side, matchData, updateData, updateWithHistory, setPreviewScene,
  selectedPreset, setSelectedPreset, library, showSideControl, attackSide,
  sideLeftLabel, sideRightLabel, toggleAttackDefense, banInfo, getRosterOptionsForSide,
  onSetMapWinner,
  isA, isUltra, is1080Compact, density, ui, t, compactInputPad, controlRowHeight, stackGap, innerGap, tightGap, compactBtnPad, playerCols, subButtonHeight, livePanelBodyPadding,
  tr // 🚀 接收翻译函数
}) => {
  const teamName = isA ? matchData.teamA : matchData.teamB;
  const teamShort = isA ? matchData.teamShortA : matchData.teamShortB;
  const logo = isA ? matchData.logoA : matchData.logoB;
  const logoBg = isA ? matchData.logoBgA : matchData.logoBgB;
  const players = isA ? matchData.playersA : matchData.playersB;
  const subIndex = isA ? matchData.subIndexA : matchData.subIndexB;

  const sideLabel = isA ? sideLeftLabel : sideRightLabel;
  const sideActive = isA ? attackSide === 'A' : attackSide === 'B';
  const banOrderLabel = isA 
    ? (matchData.banOrderMode === 'B_FIRST' ? tr('liveEditor.aSecond') : tr('liveEditor.aFirst')) 
    : (matchData.banOrderMode === 'B_FIRST' ? tr('liveEditor.bFirst') : tr('liveEditor.bSecond'));
  const banPanelOpacity = matchData.showBans ? 1 : 0.58;

  const buildFallbackShort = name =>
    String(name || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(v => v[0])
      .join('')
      .slice(0, 4)
      .toUpperCase() || '';

  const loadTeamFromLibrary = (side, presetKey) => {
    if (!presetKey) return;
    const preset = library.find(p => p.key === presetKey);
    if (!preset) return;
    const tData = preset.data;
    const top5Players = (tData.players || []).slice(0, 5).map(p => p.nickname || p.battleTag || '');
    while (top5Players.length < 5) top5Players.push('');
    const savedLogo = tData.logo || tData.logoPath || tData.teamLogo;
    const isLogoValid = LOGO_LIST.some(l => l.path === savedLogo);
    const finalLogo = isLogoValid ? savedLogo : (LOGO_LIST[0]?.path || '');

    updateWithHistory(`Load team ${side}: ${preset.name}`, {
      ...matchData,
      [isA ? 'teamA' : 'teamB']: tData.teamName || preset.name,
      [isA ? 'teamShortA' : 'teamShortB']: tData.teamShort || tData.shortName || buildFallbackShort(tData.teamName || preset.name),
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

  return (
    <ShellPanel title={tr('liveEditor.teamControl', { side })} accent density={density} style={{ height: '100%' }} bodyStyle={{ padding: livePanelBodyPadding, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'grid', gap: stackGap, height: '100%' }}>
        <div style={{ display: 'grid', gap: '5px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isUltra ? '1fr' : showSideControl ? 'minmax(0,1fr) 116px 132px' : 'minmax(0,1fr) 132px', gap: innerGap, alignItems: 'end' }}>
            <div style={{ ...labelStyle, marginBottom: 0, fontSize: is1080Compact ? '10px' : labelStyle.fontSize }}>{tr('liveEditor.teamPreset')}</div>
            {!isUltra && showSideControl && <div style={{ ...labelStyle, marginBottom: 0, fontSize: is1080Compact ? '10px' : labelStyle.fontSize, textAlign: 'center' }}>{tr('liveEditor.sideStatus')}</div>}
            {!isUltra && <div style={{ ...labelStyle, marginBottom: 0, fontSize: is1080Compact ? '10px' : labelStyle.fontSize, textAlign: 'center' }}>{tr('liveEditor.winner')}</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isUltra ? '1fr' : showSideControl ? 'minmax(0,1fr) 116px 132px' : 'minmax(0,1fr) 132px', gap: innerGap, alignItems: 'center' }}>
            <select style={{ ...ui.select, padding: compactInputPad, minWidth: 0, height: controlRowHeight, color: library.length ? COLORS.yellow : COLORS.softWhite, borderColor: 'rgba(255,255,255,0.14)', fontWeight: '900' }} value={selectedPreset} disabled={!library.length} onChange={e => {
              const next = e.target.value;
              setSelectedPreset(next);
              if (next) loadTeamFromLibrary(side, next);
            }}>
              <option value="" style={{ color: COLORS.white }}>{library.length ? tr('liveEditor.loadReplace') : tr('liveEditor.noPresets')}</option>
              {library.map(p => <option key={p.key} value={p.key} style={{ color: COLORS.black }}>{p.name}</option>)}
            </select>

            {!isUltra && showSideControl && (
              <button style={{ ...ui.outlineBtn, padding: compactBtnPad || ui.outlineBtn.padding, height: controlRowHeight, minHeight: controlRowHeight, fontSize: is1080Compact ? '11px' : undefined, backgroundColor: sideActive ? 'rgba(244,195,32,0.16)' : 'rgba(255,255,255,0.04)', color: sideActive ? COLORS.yellow : COLORS.softWhite, borderColor: sideActive ? COLORS.yellow : 'rgba(255,255,255,0.14)', fontWeight: '900', width: '100%', whiteSpace: 'nowrap' }} onClick={toggleAttackDefense}>
                {sideLabel}
              </button>
            )}

            {!isUltra && (
              <button
                style={{ ...ui.actionBtn, padding: compactBtnPad || ui.actionBtn.padding, height: controlRowHeight, minHeight: controlRowHeight, fontSize: is1080Compact ? '11px' : undefined, fontWeight: '900', width: '100%', whiteSpace: 'nowrap' }}
                onClick={() => onSetMapWinner?.(side)}
              >
                {isA ? tr('liveEditor.teamAWin') : tr('liveEditor.teamBWin')}
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
              <button
                style={{ ...ui.actionBtn, padding: compactBtnPad || ui.actionBtn.padding, height: controlRowHeight, minHeight: controlRowHeight, fontSize: is1080Compact ? '11px' : undefined, fontWeight: '900', width: '100%', whiteSpace: 'nowrap' }}
                onClick={() => onSetMapWinner?.(side)}
              >
                {isA ? tr('liveEditor.teamAWin') : tr('liveEditor.teamBWin')}
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gap: '5px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isUltra ? '1fr' : '1.2fr 88px 1fr 96px', gap: innerGap, alignItems: 'end' }}>
            <div style={{ ...labelStyle, marginBottom: 0, fontSize: is1080Compact ? '10px' : labelStyle.fontSize }}>{tr('liveEditor.teamName')}</div>
            {!isUltra && <div style={{ ...labelStyle, marginBottom: 0, fontSize: is1080Compact ? '10px' : labelStyle.fontSize }}>{tr('liveEditor.short')}</div>}
            {!isUltra && <div style={{ ...labelStyle, marginBottom: 0, fontSize: is1080Compact ? '10px' : labelStyle.fontSize }}>{tr('liveEditor.logo')}</div>}
            {!isUltra && <div style={{ ...labelStyle, marginBottom: 0, fontSize: is1080Compact ? '10px' : labelStyle.fontSize }}>{tr('liveEditor.logoBg')}</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isUltra ? '1fr' : '1.2fr 88px 1fr 96px', gap: innerGap, alignItems: 'center' }}>
            <input
              style={{ ...ui.input, padding: compactInputPad, height: controlRowHeight, fontSize: is1080Compact ? '14px' : density === 'spacious' ? '17px' : '16px', fontWeight: '900' }}
              value={teamName}
              onChange={e => updateData(prev => ({ ...prev, [isA ? 'teamA' : 'teamB']: e.target.value }))}
            />

            {!isUltra && (
              <input
                style={{ ...ui.input, padding: compactInputPad, height: controlRowHeight, textTransform: 'uppercase', fontWeight: '900', textAlign: 'center' }}
                value={teamShort || ''}
                maxLength={4}
                onChange={e => updateData(prev => ({ ...prev, [isA ? 'teamShortA' : 'teamShortB']: e.target.value.toUpperCase().slice(0, 4) }))}
                placeholder={tr('liveEditor.tagPlaceholder')}
              />
            )}

            {!isUltra && (
              <select style={{ ...ui.select, padding: compactInputPad, height: controlRowHeight }} value={logo} onChange={e => updateData(prev => ({ ...prev, [isA ? 'logoA' : 'logoB']: e.target.value }))}>
                {LOGO_LIST.map((l, index) => <option key={`${l.path}-${index}`} value={l.path}>{l.name}</option>)}
              </select>
            )}

            {!isUltra && (
              <select style={{ ...ui.select, padding: compactInputPad, height: controlRowHeight }} value={logoBg} onChange={e => updateData(prev => ({ ...prev, [isA ? 'logoBgA' : 'logoBgB']: e.target.value }))}>
                <option value={COLORS.mainDark}>{tr('liveEditor.dark')}</option>
                <option value={COLORS.white}>{tr('liveEditor.light')}</option>
              </select>
            )}
          </div>

          {isUltra && (
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 92px', gap: innerGap }}>
              <Field label={tr('liveEditor.short')} density={density}>
                <input
                  style={{ ...ui.input, padding: compactInputPad, height: controlRowHeight, textTransform: 'uppercase', fontWeight: '900', textAlign: 'center' }}
                  value={teamShort || ''}
                  maxLength={4}
                  onChange={e => updateData(prev => ({ ...prev, [isA ? 'teamShortA' : 'teamShortB']: e.target.value.toUpperCase().slice(0, 4) }))}
                  placeholder={tr('liveEditor.tagPlaceholder')}
                />
              </Field>

              <Field label={tr('liveEditor.logo')} density={density}>
                <select style={{ ...ui.select, padding: compactInputPad, height: controlRowHeight }} value={logo} onChange={e => updateData(prev => ({ ...prev, [isA ? 'logoA' : 'logoB']: e.target.value }))}>
                  {LOGO_LIST.map((l, index) => <option key={`${l.path}-${index}`} value={l.path}>{l.name}</option>)}
                </select>
              </Field>

              <Field label={tr('liveEditor.logoBg')} density={density}>
                <select style={{ ...ui.select, padding: compactInputPad, height: controlRowHeight }} value={logoBg} onChange={e => updateData(prev => ({ ...prev, [isA ? 'logoBgA' : 'logoBgB']: e.target.value }))}>
                  <option value={COLORS.mainDark}>{tr('liveEditor.dark')}</option>
                  <option value={COLORS.white}>{tr('liveEditor.light')}</option>
                </select>
              </Field>
            </div>
          )}
        </div>

        <div style={{ backgroundColor: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.18)', padding: is1080Compact ? '8px 10px' : t.panelPadding, display: 'grid', gap: '5px', opacity: banPanelOpacity }}>
          <div style={{ display: 'grid', gridTemplateColumns: isUltra ? '1fr' : '110px 120px 1fr 1fr', gap: innerGap, alignItems: 'center' }}>
            <div style={{ ...labelStyle, marginBottom: 0, color: '#ff7d7d', fontSize: is1080Compact ? '10px' : labelStyle.fontSize }}>{tr('liveEditor.banSlot')}</div>
            {!isUltra && (
              <>
                <button style={{ ...ui.outlineBtn, padding: compactBtnPad || ui.outlineBtn.padding, height: controlRowHeight, minHeight: controlRowHeight, fontSize: is1080Compact ? '11px' : undefined, backgroundColor: 'rgba(255,255,255,0.04)', color: COLORS.softWhite, borderColor: 'rgba(255,255,255,0.14)', fontWeight: '900', whiteSpace: 'nowrap' }} onClick={() => updateWithHistory(matchData.banOrderMode === 'B_FIRST' ? 'Set ban order A first' : 'Set ban order B first', { ...matchData, banOrderMode: matchData.banOrderMode === 'B_FIRST' ? 'A_FIRST' : 'B_FIRST' })}>
                  {banOrderLabel}
                </button>
                <select style={{ ...ui.select, padding: compactInputPad, height: controlRowHeight }} value={banInfo.role} onChange={e => updateData(prev => ({ ...prev, [isA ? 'bansA' : 'bansB']: [`${e.target.value}/tbd`] }))}>
                  <option value="tank">{tr('liveEditor.tank')}</option>
                  <option value="damage">{tr('liveEditor.dps')}</option>
                  <option value="support">{tr('liveEditor.sup')}</option>
                </select>
                <select style={{ ...ui.select, padding: compactInputPad, height: controlRowHeight }} value={banInfo.hero} onChange={e => updateData(prev => ({ ...prev, [isA ? 'bansA' : 'bansB']: [`${banInfo.role}/${e.target.value}`] }))}>
                  <option value="tbd">{tr('liveEditor.tbd')}</option>
                  {HERO_DATA[banInfo.role]?.map(h => <option key={h} value={h}>{h}</option>)}
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
                <option value="tank">{tr('liveEditor.tank')}</option>
                <option value="damage">{tr('liveEditor.dps')}</option>
                <option value="support">{tr('liveEditor.sup')}</option>
              </select>
              <select style={{ ...ui.select, padding: compactInputPad, height: controlRowHeight }} value={banInfo.hero} onChange={e => updateData(prev => ({ ...prev, [isA ? 'bansA' : 'bansB']: [`${banInfo.role}/${e.target.value}`] }))}>
                <option value="tbd">{tr('liveEditor.tbd')}</option>
                {HERO_DATA[banInfo.role]?.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          )}
        </div>

        <Field label={tr('liveEditor.playerStatus')} density={density}>
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
                    <option value="">{tr('liveEditor.select')}</option>
                    {rosterOptions.map(opt => <option key={`${opt.value}-${opt.idx}`} value={opt.value}>{opt.label}</option>)}
                  </select>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tightGap }}>
                    <button style={{ ...ui.outlineBtn, padding: is1080Compact ? '0 4px' : density === 'ultra' ? '0 6px' : '0 8px', minHeight: `${subButtonHeight}px`, fontSize: is1080Compact ? '10px' : `${t.buttonFontSize}px`, whiteSpace: 'nowrap' }} onClick={() => updateWithHistory(`Trigger key player ${currentValue || `P${i + 1}`}`, { ...matchData, keyPlayerTriggerAt: Date.now(), keyPlayerSide: side, keyPlayerName: currentValue || `P${i + 1}` })}>
                      {tr('liveEditor.key')}
                    </button>
                    <button style={{ ...ui.outlineBtn, padding: is1080Compact ? '0 4px' : density === 'ultra' ? '0 6px' : '0 8px', backgroundColor: subIndex === i ? COLORS.yellow : 'transparent', color: subIndex === i ? COLORS.black : COLORS.softWhite, minHeight: `${subButtonHeight}px`, fontSize: is1080Compact ? '10px' : `${t.buttonFontSize}px`, whiteSpace: 'nowrap' }} onClick={() => updateWithHistory(subIndex === i ? `Clear TEAM ${side} sub status` : `TEAM ${side} sub in ${currentValue || `P${i + 1}`}`, { ...matchData, [isA ? 'subIndexA' : 'subIndexB']: subIndex === i ? null : i })}>
                      {subIndex === i ? tr('liveEditor.in') : tr('liveEditor.sub')}
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
});

export default function LiveEditor({
  isDense, isUltra, isShort, density = 'standard', densityTokens
}) {
  // 🚀 初始化翻译钩子
  const { t: tr } = useTranslation();
  const { matchData, updateData, updateWithHistory, setPreviewScene } = useMatchContext();

  const t = densityTokens || {
    panelPadding: '12px', inputPadding: '8px 10px', inputFontSize: 12, buttonPadding: '8px 10px', buttonFontSize: 12, blockGap: 10
  };
  const ui = createEditorUi(densityTokens, density);

  const is1080Compact = isShort || isDense || density === 'compact' || density === 'ultra';
  const library = matchData.rosterPresetLibrary || [];

  const [selectedPresetA, setSelectedPresetA] = useState('');
  const [selectedPresetB, setSelectedPresetB] = useState('');
  
  const [resetConfirm, setResetConfirm] = useState(false);

  const livePanelBodyPadding = is1080Compact ? '10px 12px' : density === 'spacious' ? '14px 16px' : t.panelPadding;
  const rootGap = is1080Compact ? 8 : t.blockGap;
  const liveMainGap = is1080Compact ? 10 : t.blockGap;
  const stackGap = is1080Compact ? '7px' : density === 'spacious' ? '10px' : '9px';
  const innerGap = is1080Compact ? '6px' : '8px';
  const tightGap = is1080Compact ? '4px' : '6px';
  const sectionTopGap = is1080Compact ? '6px' : '8px';

  const sectionTitleStyle = {
    fontSize: is1080Compact ? '10px' : '11px', color: COLORS.softWhite, fontWeight: '900', letterSpacing: is1080Compact ? '1.6px' : '2px', textTransform: 'uppercase'
  };

  const compactBtnPad = is1080Compact ? '6px 8px' : undefined;
  const compactInputPad = is1080Compact ? '7px 8px' : t.inputPadding;
  const subButtonHeight = is1080Compact ? 24 : density === 'spacious' ? 32 : density === 'ultra' ? 28 : 30;
  const playerCols = isUltra ? 'repeat(2, minmax(0,1fr))' : 'repeat(5, minmax(0,1fr))';
  const liveMainTemplate = isUltra ? '1fr' : is1080Compact ? 'minmax(0,1fr) 250px minmax(0,1fr)' : density === 'spacious' ? 'minmax(320px,1fr) 320px minmax(320px,1fr)' : 'minmax(0,1fr) 280px minmax(0,1fr)';

  const getBanInfo = useCallback(bans => {
    const currentBan = bans?.[0] || 'damage/tbd';
    return { role: currentBan.includes('/') ? currentBan.split('/')[0] : 'damage', hero: currentBan.includes('/') ? currentBan.split('/')[1] : 'tbd' };
  }, []);

  const banA = getBanInfo(matchData.bansA);
  const banB = getBanInfo(matchData.bansB);

  const currentMapIdx = Math.max(0, (matchData.currentMap || 1) - 1);
  const currentMapData = matchData.mapLineup?.[currentMapIdx] || {};
  const currentMapModeKey = (currentMapData.type || matchData.mapType || '').split(' ')[0].toUpperCase();
  const showSideControl = needsAttackDefense(currentMapModeKey);

  const attackSide = currentMapData.attackSide || matchData.attackSide || '';
  const sideLeftLabel = attackSide === 'A' ? tr('liveEditor.atk') : tr('liveEditor.def');
  const sideRightLabel = attackSide === 'B' ? tr('liveEditor.atk') : tr('liveEditor.def');

  const toggleAttackDefense = useCallback(() => {
    const nextSide = attackSide === 'A' ? 'B' : 'A';
    const nextMapLineup = [...(matchData.mapLineup || [])];
    if (nextMapLineup[currentMapIdx]) {
      nextMapLineup[currentMapIdx] = { ...nextMapLineup[currentMapIdx], attackSide: nextSide };
    }
    updateWithHistory('Toggle side status', {
      ...matchData, attackSide: nextSide, mapLineup: nextMapLineup
    });
  }, [attackSide, currentMapIdx, matchData, updateWithHistory]);

  const controlRowHeight = is1080Compact ? '40px' : '44px';

  const getRosterOptionsForSide = useCallback(side => {
    const roster = side === 'A' ? (matchData.rosterPlayersA || []) : (matchData.rosterPlayersB || []);
    return roster
      .filter(p => (p?.nickname || '').trim())
      .map((p, idx) => ({ value: p.nickname, label: p.nickname, idx }));
  }, [matchData.rosterPlayersA, matchData.rosterPlayersB]);

  const settleCurrentMapWinner = useCallback((winnerSide) => {
    const nextWinner = winnerSide === 'B' ? 'B' : 'A';

    const nextMapLineup = [...(matchData.mapLineup || [])];
    while (nextMapLineup.length <= currentMapIdx) nextMapLineup.push({});

    const prevMap = nextMapLineup[currentMapIdx] || {};

    nextMapLineup[currentMapIdx] = {
      ...prevMap,
      winner: nextWinner,
      winnerSide: nextWinner,
      bansA: Array.isArray(matchData.bansA) ? [...matchData.bansA] : [],
      bansB: Array.isArray(matchData.bansB) ? [...matchData.bansB] : [],
      banOrderMode: matchData.banOrderMode || 'A_FIRST',
      attackSide: prevMap.attackSide || currentMapData.attackSide || matchData.attackSide || ''
    };

    const nextScoreA = nextMapLineup.reduce((sum, m) => {
      const side = String(m?.winnerSide || m?.winner || '').trim().toUpperCase();
      return side === 'A' ? sum + 1 : sum;
    }, 0);

    const nextScoreB = nextMapLineup.reduce((sum, m) => {
      const side = String(m?.winnerSide || m?.winner || '').trim().toUpperCase();
      return side === 'B' ? sum + 1 : sum;
    }, 0);

    updateWithHistory(`Set Team ${nextWinner} as winner and TAKE`, {
      ...matchData,
      scoreA: nextScoreA,
      scoreB: nextScoreB,
      mapLineup: nextMapLineup,
      globalScene: 'WINNER',
      winnerScene: {
        ...(matchData.winnerScene || {}),
        winner: nextWinner,
        title: 'WINNER'
      }
    });

    setPreviewScene?.('WINNER');
  }, [
    matchData,
    currentMapIdx,
    currentMapData.attackSide,
    updateWithHistory,
    setPreviewScene
  ]);

  const handleResetMatch = useCallback(() => {
    if (!resetConfirm) {
      setResetConfirm(true);
      setTimeout(() => setResetConfirm(false), 3000);
      return;
    }

    const clearedMapLineup = (matchData.mapLineup || []).map(m => ({
      ...m,
      winner: '',
      winnerSide: '',
      bansA: [],
      bansB: []
    }));
    
    updateWithHistory('Reset Match Scores and Map Data', {
      ...matchData,
      scoreA: 0,
      scoreB: 0,
      currentMap: 1, 
      mapLineup: clearedMapLineup,
      bansA: [], 
      bansB: []
    });
    setResetConfirm(false);
  }, [matchData, updateWithHistory, resetConfirm]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: rootGap }}>
      <div style={{ display: 'grid', gridTemplateColumns: liveMainTemplate, gap: liveMainGap, alignItems: 'stretch' }}>

        <TeamControlPanel
          side="A" isA={true} matchData={matchData} updateData={updateData} updateWithHistory={updateWithHistory} setPreviewScene={setPreviewScene}
          selectedPreset={selectedPresetA} setSelectedPreset={setSelectedPresetA} library={library} showSideControl={showSideControl}
          attackSide={attackSide} sideLeftLabel={sideLeftLabel} sideRightLabel={sideRightLabel} toggleAttackDefense={toggleAttackDefense}
          banInfo={banA} getRosterOptionsForSide={getRosterOptionsForSide} onSetMapWinner={settleCurrentMapWinner} isUltra={isUltra} is1080Compact={is1080Compact} density={density}
          ui={ui} t={t} compactInputPad={compactInputPad} controlRowHeight={controlRowHeight} stackGap={stackGap} innerGap={innerGap}
          tightGap={tightGap} compactBtnPad={compactBtnPad} playerCols={playerCols} subButtonHeight={subButtonHeight} livePanelBodyPadding={livePanelBodyPadding}
          tr={tr}
        />

        <ShellPanel title={tr('liveEditor.liveCoreControl')} accent density={density} style={{ height: '100%' }} bodyStyle={{ padding: livePanelBodyPadding, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: stackGap, height: '100%' }}>
            <div style={{ ...panelBase, padding: is1080Compact ? '10px' : t.panelPadding, borderTop: `2px solid ${COLORS.yellow}` }}>
              <div style={sectionTitleStyle}>{tr('liveEditor.scoreControl')}</div>
              
              <div style={{ marginTop: sectionTopGap, display: 'grid', gridTemplateColumns: '1fr auto 1fr', rowGap: sectionTopGap, columnGap: innerGap, alignItems: 'center' }}>
                
                <div style={{ textAlign: 'center', fontSize: is1080Compact ? '24px' : density === 'spacious' ? '36px' : '32px', fontWeight: '900', color: COLORS.white, lineHeight: 1 }}>{matchData.scoreA}</div>
                <div style={{ textAlign: 'center', fontSize: is1080Compact ? '13px' : density === 'spacious' ? '16px' : '15px', fontWeight: '900', color: COLORS.yellow, letterSpacing: is1080Compact ? '1px' : '2px', lineHeight: 1 }}>{tr('liveEditor.vs')}</div>
                <div style={{ textAlign: 'center', fontSize: is1080Compact ? '24px' : density === 'spacious' ? '36px' : '32px', fontWeight: '900', color: COLORS.white, lineHeight: 1 }}>{matchData.scoreB}</div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                  <button style={{ ...ui.outlineBtn, padding: is1080Compact ? '5px 0' : '7px 0', fontSize: is1080Compact ? '11px' : undefined }} onClick={() => updateWithHistory('TEAM A -1', { ...matchData, scoreA: Math.max(0, matchData.scoreA - 1) })}>-1</button>
                  <button style={{ ...ui.actionBtn, padding: is1080Compact ? '5px 0' : '7px 0', fontSize: is1080Compact ? '11px' : undefined }} onClick={() => updateWithHistory('TEAM A +1', { ...matchData, scoreA: matchData.scoreA + 1 })}>+1</button>
                </div>
                
                <button 
                  style={{ 
                    ...ui.outlineBtn, 
                    padding: is1080Compact ? '5px 10px' : '7px 14px', 
                    fontSize: is1080Compact ? '10px' : '11px', 
                    backgroundColor: resetConfirm ? 'rgba(255,77,77,0.92)' : 'rgba(255,77,77,0.08)', 
                    color: resetConfirm ? '#fff' : '#ff7d7d', 
                    border: '1px solid rgba(255,77,77,0.3)',
                    fontWeight: '900',
                    width: '100%',
                    height: '100%',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease'
                  }} 
                  onClick={handleResetMatch}
                >
                  {resetConfirm ? tr('liveEditor.sure') : tr('liveEditor.reset')}
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                  <button style={{ ...ui.outlineBtn, padding: is1080Compact ? '5px 0' : '7px 0', fontSize: is1080Compact ? '11px' : undefined }} onClick={() => updateWithHistory('TEAM B -1', { ...matchData, scoreB: Math.max(0, matchData.scoreB - 1) })}>-1</button>
                  <button style={{ ...ui.actionBtn, padding: is1080Compact ? '5px 0' : '7px 0', fontSize: is1080Compact ? '11px' : undefined }} onClick={() => updateWithHistory('TEAM B +1', { ...matchData, scoreB: matchData.scoreB + 1 })}>+1</button>
                </div>
              </div>
            </div>

            <div style={{ ...panelBase, padding: is1080Compact ? '9px 10px' : t.panelPadding, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'grid', gap: is1080Compact ? '10px' : '12px', height: '100%', alignContent: 'space-between' }}>
                <div>
                  <div style={sectionTitleStyle}>{tr('liveEditor.voiceComms')}</div>
                  <div style={{ marginTop: sectionTopGap, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: tightGap, width: '100%' }}>
                    <button style={{ ...ui.outlineBtn, padding: compactBtnPad || ui.outlineBtn.padding, minHeight: is1080Compact ? '34px' : '38px', fontSize: is1080Compact ? '11px' : undefined, backgroundColor: matchData.activeComms === 'A' ? COLORS.yellow : 'transparent', color: matchData.activeComms === 'A' ? COLORS.black : COLORS.softWhite, borderColor: matchData.activeComms === 'A' ? COLORS.yellow : 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }} onClick={() => updateData(prev => ({ ...prev, activeComms: 'A' }))}>{tr('liveEditor.left')}</button>
                    <button style={{ ...ui.outlineBtn, padding: compactBtnPad || ui.outlineBtn.padding, minHeight: is1080Compact ? '34px' : '38px', fontSize: is1080Compact ? '11px' : undefined, backgroundColor: matchData.activeComms === null ? 'rgba(255,255,255,0.08)' : 'transparent', color: matchData.activeComms === null ? COLORS.white : COLORS.softWhite, borderColor: matchData.activeComms === null ? COLORS.yellow : 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }} onClick={() => updateData(prev => ({ ...prev, activeComms: null }))}>{tr('liveEditor.off')}</button>
                    <button style={{ ...ui.outlineBtn, padding: compactBtnPad || ui.outlineBtn.padding, minHeight: is1080Compact ? '34px' : '38px', fontSize: is1080Compact ? '11px' : undefined, backgroundColor: matchData.activeComms === 'B' ? COLORS.yellow : 'transparent', color: matchData.activeComms === 'B' ? COLORS.black : COLORS.softWhite, borderColor: matchData.activeComms === 'B' ? COLORS.yellow : 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }} onClick={() => updateData(prev => ({ ...prev, activeComms: 'B' }))}>{tr('liveEditor.right')}</button>
                  </div>
                </div>

                <div>
                  <div style={sectionTitleStyle}>{tr('liveEditor.liveTriggers')}</div>
                  <div style={{ marginTop: sectionTopGap, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tightGap, width: '100%' }}>
                    <button
                      style={{
                        ...ui.outlineBtn,
                        backgroundColor: matchData.beginInfoEnabled ? COLORS.yellow : 'transparent',
                        color: matchData.beginInfoEnabled ? COLORS.black : COLORS.softWhite,
                        padding: compactBtnPad || ui.outlineBtn.padding,
                        minHeight: is1080Compact ? '38px' : '42px',
                        fontSize: is1080Compact ? '11px' : undefined
                      }}
                      onClick={() => updateWithHistory(matchData.beginInfoEnabled ? 'Disable Auto Begin' : 'Enable Auto Begin', { ...matchData, beginInfoEnabled: !matchData.beginInfoEnabled })}
                    >
                      {tr('liveEditor.autoBegin')}
                    </button>

                    <button style={{ ...ui.outlineBtn, padding: compactBtnPad || ui.outlineBtn.padding, minHeight: is1080Compact ? '38px' : '42px', fontSize: is1080Compact ? '11px' : undefined, backgroundColor: matchData.showPlayers ? 'rgba(244,195,32,0.16)' : 'transparent', color: matchData.showPlayers ? COLORS.yellow : COLORS.softWhite, borderColor: matchData.showPlayers ? COLORS.yellow : 'rgba(255,255,255,0.14)', whiteSpace: 'nowrap' }} onClick={() => updateData(prev => ({ ...prev, showPlayers: !prev.showPlayers }))}>{tr('liveEditor.nameInfo')}</button>

                    <button style={{ ...ui.outlineBtn, padding: compactBtnPad || ui.outlineBtn.padding, minHeight: is1080Compact ? '38px' : '42px', fontSize: is1080Compact ? '11px' : undefined, backgroundColor: matchData.showBans ? 'rgba(255,77,77,0.16)' : 'transparent', color: matchData.showBans ? '#ff8f8f' : COLORS.softWhite, borderColor: matchData.showBans ? COLORS.banRed : 'rgba(255,255,255,0.14)', whiteSpace: 'nowrap' }} onClick={() => updateWithHistory(matchData.showBans ? 'Disable ban mode' : 'Enable ban mode', { ...matchData, showBans: !matchData.showBans, showBanPhase: !matchData.showBans ? matchData.showBanPhase : false })}>{tr('liveEditor.banMode')}</button>

                    <button style={{ ...ui.btn, backgroundColor: 'rgba(255,77,77,0.92)', color: '#fff', padding: compactBtnPad || ui.btn.padding, minHeight: is1080Compact ? '38px' : '42px', fontSize: is1080Compact ? '11px' : undefined, border: `1px solid ${COLORS.banRed}`, whiteSpace: 'nowrap' }} onClick={() => updateWithHistory(matchData.showBanPhase ? 'Close ban phase' : 'Open ban phase', { ...matchData, showBanPhase: !matchData.showBanPhase, heroBanTriggerAt: !matchData.showBanPhase ? Date.now() : matchData.heroBanTriggerAt })}>
                      {matchData.showBanPhase ? tr('liveEditor.closeBan') : tr('liveEditor.banPhase')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ShellPanel>

        <TeamControlPanel
          side="B" isA={false} matchData={matchData} updateData={updateData} updateWithHistory={updateWithHistory} setPreviewScene={setPreviewScene}
          selectedPreset={selectedPresetB} setSelectedPreset={setSelectedPresetB} library={library} showSideControl={showSideControl}
          attackSide={attackSide} sideLeftLabel={sideLeftLabel} sideRightLabel={sideRightLabel} toggleAttackDefense={toggleAttackDefense}
          banInfo={banB} getRosterOptionsForSide={getRosterOptionsForSide} onSetMapWinner={settleCurrentMapWinner} isUltra={isUltra} is1080Compact={is1080Compact} density={density}
          ui={ui} t={t} compactInputPad={compactInputPad} controlRowHeight={controlRowHeight} stackGap={stackGap} innerGap={innerGap}
          tightGap={tightGap} compactBtnPad={compactBtnPad} playerCols={playerCols} subButtonHeight={subButtonHeight} livePanelBodyPadding={livePanelBodyPadding}
          tr={tr}
        />
      </div>

      <ShellPanel title={tr('liveEditor.tickerControl')} accent bodyStyle={{ padding: is1080Compact ? '10px 12px' : t.panelPadding }} density={density}>
        <div style={{ display: 'grid', gridTemplateColumns: isUltra ? '1fr' : is1080Compact ? '120px 120px 1fr' : isDense ? '1fr' : density === 'spacious' ? '150px 150px 1fr' : '130px 130px 1fr', gap: is1080Compact ? '8px' : '10px', alignItems: 'center' }}>
          <select style={{ ...ui.select, padding: compactInputPad }} value={matchData.tickerMode || 'INFINITE'} onChange={e => updateData(prev => ({ ...prev, tickerMode: e.target.value }))}>
            <option value="INFINITE">{tr('liveEditor.loop')}</option>
            <option value="ONCE">{tr('liveEditor.once')}</option>
          </select>
          <button style={{ ...ui.btn, backgroundColor: matchData.showTicker ? '#e74c3c' : '#2ecc71', padding: compactBtnPad || ui.btn.padding, fontSize: is1080Compact ? '11px' : undefined }} onClick={() => updateData(prev => ({ ...prev, showTicker: !prev.showTicker }))}>
            {matchData.showTicker ? tr('liveEditor.tickerOff') : tr('liveEditor.tickerOn')}
          </button>
          <input style={{ ...ui.input, padding: compactInputPad }} value={matchData.tickerText ?? ''} onChange={e => updateData(prev => ({ ...prev, tickerText: e.target.value }))} placeholder={tr('liveEditor.tickerPlaceholder')} />
        </div>
      </ShellPanel>
    </div>
  );
}