import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useMatchContext } from '../../contexts/MatchContext';
import { COLORS, UI, panelBase } from '../../constants/styles';
import { LOGO_LIST } from '../../constants/logos';
import { ROSTER_ROLE_OPTIONS } from '../../constants/gameData';
import {
  safeText,
  getRosterHeroOptions,
  getRosterHeroImagePath,
  makeRosterPresetKey,
  cloneRosterPresetData,
  buildRosterPresetFromTeam,
  applyRosterPresetToTeamData
} from '../../utils';
import { createEditorUi } from '../../utils/editorUi';
import { ShellPanel, Field, QuickStat, SectionHint } from '../common/SharedUI';

// 引入图片处理工具
import { processImageForStorage } from '../../utils/imageHelper';

const PlayerRow = React.memo(({
  player, idx, role, isDense, isUltra, density, t, ui, compactLabel, rowInput, rowNumberInput, rowSelect, 
  rowBtn, rowOutlineBtn, denseCell, rowLabelCell, tinyGap, smallGap, controlRowHeight, subButtonHeight,
  handleRosterImageUpload, updateRosterPlayers, rosterPlayers, updatePlayerPositionXY, pos, heroOptions,
  tr 
}) => {
  if (isUltra) {
    return (
      <div style={{ ...panelBase, padding: t.panelPadding, display: 'grid', gap: smallGap, borderLeft: `2px solid ${COLORS.yellow}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: smallGap }}>
          <div style={{ color: COLORS.white, fontSize: '12px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>
            P{idx + 1}
          </div>
          <div style={{ display: 'flex', gap: tinyGap }}>
            <label style={{ ...rowBtn, backgroundColor: COLORS.yellow, color: COLORS.black, cursor: 'pointer' }}>
              {tr('rosterEditor.upload')}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleRosterImageUpload(idx, e)} />
            </label>
            <button
              style={{ ...rowOutlineBtn, borderColor: COLORS.red, color: COLORS.red }}
              onClick={() => {
                const next = [...rosterPlayers];
                next[idx] = {
                  ...next[idx],
                  heroImage: getRosterHeroImagePath(role, player.hero),
                  heroScale: 1.1,
                  heroBrightness: 0.84,
                  heroPosition: ''
                };
                updateRosterPlayers(next);
              }}
            >
              {tr('rosterEditor.reset')}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gap: smallGap }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: smallGap }}>
            <div>
              <div style={compactLabel}>{tr('rosterEditor.nickname')}</div>
              <input
                style={rowInput}
                value={player.nickname || ''}
                onChange={e => {
                  const next = [...rosterPlayers];
                  next[idx] = { ...next[idx], nickname: e.target.value };
                  updateRosterPlayers(next);
                }}
              />
            </div>
            <div>
              <div style={compactLabel}>{tr('rosterEditor.battleTag')}</div>
              <input
                style={rowInput}
                value={player.battleTag || ''}
                onChange={e => {
                  const next = [...rosterPlayers];
                  next[idx] = { ...next[idx], battleTag: e.target.value };
                  updateRosterPlayers(next);
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: smallGap }}>
            <div>
              <div style={compactLabel}>{tr('rosterEditor.role')}</div>
              <select
                style={rowSelect}
                value={role}
                onChange={e => {
                  const nextRole = e.target.value;
                  const nextHero = getRosterHeroOptions(nextRole)[0] || '';
                  const next = [...rosterPlayers];
                  next[idx] = { ...next[idx], role: nextRole, hero: nextHero, heroImage: getRosterHeroImagePath(nextRole, nextHero) };
                  updateRosterPlayers(next);
                }}
              >
                {ROSTER_ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <div style={compactLabel}>{tr('rosterEditor.hero')}</div>
              <select
                style={rowSelect}
                value={player.hero || ''}
                onChange={e => {
                  const nextHero = e.target.value;
                  const next = [...rosterPlayers];
                  next[idx] = { ...next[idx], hero: nextHero, heroImage: getRosterHeroImagePath(role, nextHero) };
                  updateRosterPlayers(next);
                }}
              >
                {heroOptions.map(hero => <option key={hero} value={hero}>{hero}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: smallGap }}>
            <div>
              <div style={compactLabel}>{tr('rosterEditor.scale')}</div>
              <input
                type="number" step="0.01" style={rowNumberInput} value={player.heroScale ?? 1.1}
                onChange={e => {
                  const next = [...rosterPlayers];
                  next[idx] = { ...next[idx], heroScale: Number(e.target.value) || 1.1 };
                  updateRosterPlayers(next);
                }}
              />
            </div>

            <div>
              <div style={compactLabel}>{tr('rosterEditor.bright')}</div>
              <input
                type="number" step="0.01" style={rowNumberInput} value={player.heroBrightness ?? 0.84}
                onChange={e => {
                  const next = [...rosterPlayers];
                  next[idx] = { ...next[idx], heroBrightness: Number(e.target.value) || 0.84 };
                  updateRosterPlayers(next);
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: smallGap }}>
            <div>
              <div style={compactLabel}>{tr('rosterEditor.posX')}</div>
              <input style={rowNumberInput} value={pos.x} onChange={e => updatePlayerPositionXY(idx, e.target.value, pos.y)} placeholder="50%" />
            </div>

            <div>
              <div style={compactLabel}>{tr('rosterEditor.posY')}</div>
              <input style={rowNumberInput} value={pos.y} onChange={e => updatePlayerPositionXY(idx, pos.x, e.target.value)} placeholder="24%" />
            </div>
          </div>

          <div>
            <div style={compactLabel}>{tr('rosterEditor.imagePath')}</div>
            <input
              style={rowInput}
              value={(player.heroImage || '').startsWith('blob:') ? tr('rosterEditor.localMemoryImage') : (player.heroImage || '')}
              onChange={e => {
                const next = [...rosterPlayers];
                next[idx] = { ...next[idx], heroImage: e.target.value };
                updateRosterPlayers(next);
              }}
              placeholder="/assets/roster/damage/tracer.jpg"
            />
          </div>
        </div>
      </div>
    );
  }

  if (isDense) {
    return (
      <div style={{ ...panelBase, padding: density === 'spacious' ? '10px' : '8px', display: 'grid', gap: smallGap, borderLeft: `2px solid ${COLORS.yellow}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: smallGap }}>
          <div style={{ color: COLORS.white, fontSize: '12px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>
            P{idx + 1}
          </div>
          <div style={{ display: 'flex', gap: tinyGap }}>
            <label style={{ ...rowBtn, backgroundColor: COLORS.yellow, color: COLORS.black, cursor: 'pointer' }}>
              {tr('rosterEditor.upload')}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleRosterImageUpload(idx, e)} />
            </label>
            <button
              style={{ ...rowOutlineBtn, borderColor: COLORS.red, color: COLORS.red }}
              onClick={() => {
                const next = [...rosterPlayers];
                next[idx] = {
                  ...next[idx], heroImage: getRosterHeroImagePath(role, player.hero), heroScale: 1.1, heroBrightness: 0.84, heroPosition: ''
                };
                updateRosterPlayers(next);
              }}
            >
              {tr('rosterEditor.reset')}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: smallGap }}>
          <div>
            <div style={compactLabel}>{tr('rosterEditor.nickname')}</div>
            <input style={rowInput} value={player.nickname || ''} onChange={e => { const next = [...rosterPlayers]; next[idx] = { ...next[idx], nickname: e.target.value }; updateRosterPlayers(next); }} />
          </div>

          <div>
            <div style={compactLabel}>{tr('rosterEditor.battleTag')}</div>
            <input style={rowInput} value={player.battleTag || ''} onChange={e => { const next = [...rosterPlayers]; next[idx] = { ...next[idx], battleTag: e.target.value }; updateRosterPlayers(next); }} />
          </div>

          <div>
            <div style={compactLabel}>{tr('rosterEditor.role')}</div>
            <select style={rowSelect} value={role} onChange={e => { const nextRole = e.target.value; const nextHero = getRosterHeroOptions(nextRole)[0] || ''; const next = [...rosterPlayers]; next[idx] = { ...next[idx], role: nextRole, hero: nextHero, heroImage: getRosterHeroImagePath(nextRole, nextHero) }; updateRosterPlayers(next); }}>
              {ROSTER_ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <div style={compactLabel}>{tr('rosterEditor.hero')}</div>
            <select style={rowSelect} value={player.hero || ''} onChange={e => { const nextHero = e.target.value; const next = [...rosterPlayers]; next[idx] = { ...next[idx], hero: nextHero, heroImage: getRosterHeroImagePath(role, nextHero) }; updateRosterPlayers(next); }}>
              {heroOptions.map(hero => <option key={hero} value={hero}>{hero}</option>)}
            </select>
          </div>

          <div>
            <div style={compactLabel}>{tr('rosterEditor.scale')}</div>
            <input type="number" step="0.01" style={rowNumberInput} value={player.heroScale ?? 1.1} onChange={e => { const next = [...rosterPlayers]; next[idx] = { ...next[idx], heroScale: Number(e.target.value) || 1.1 }; updateRosterPlayers(next); }} />
          </div>

          <div>
            <div style={compactLabel}>{tr('rosterEditor.bright')}</div>
            <input type="number" step="0.01" style={rowNumberInput} value={player.heroBrightness ?? 0.84} onChange={e => { const next = [...rosterPlayers]; next[idx] = { ...next[idx], heroBrightness: Number(e.target.value) || 0.84 }; updateRosterPlayers(next); }} />
          </div>

          <div>
            <div style={compactLabel}>{tr('rosterEditor.posX')}</div>
            <input style={rowNumberInput} value={pos.x} onChange={e => updatePlayerPositionXY(idx, e.target.value, pos.y)} placeholder="50%" />
          </div>

          <div>
            <div style={compactLabel}>{tr('rosterEditor.posY')}</div>
            <input style={rowNumberInput} value={pos.y} onChange={e => updatePlayerPositionXY(idx, pos.x, e.target.value)} placeholder="24%" />
          </div>
        </div>

        <div>
          <div style={compactLabel}>{tr('rosterEditor.imagePath')}</div>
          <input style={rowInput} value={(player.heroImage || '').startsWith('blob:') ? tr('rosterEditor.localMemoryImage') : (player.heroImage || '')} onChange={e => { const next = [...rosterPlayers]; next[idx] = { ...next[idx], heroImage: e.target.value }; updateRosterPlayers(next); }} placeholder="/assets/roster/damage/tracer.jpg" />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '56px 1.2fr 1.2fr 100px 1.35fr 74px 74px 64px 64px 1.8fr 80px', gap: tinyGap, alignItems: 'center' }}>
      <div style={rowLabelCell}>{`P${idx + 1}`}</div>

      <div style={denseCell}>
        <input style={rowInput} value={player.nickname || ''} onChange={e => { const next = [...rosterPlayers]; next[idx] = { ...next[idx], nickname: e.target.value }; updateRosterPlayers(next); }} />
      </div>

      <div style={denseCell}>
        <input style={rowInput} value={player.battleTag || ''} onChange={e => { const next = [...rosterPlayers]; next[idx] = { ...next[idx], battleTag: e.target.value }; updateRosterPlayers(next); }} />
      </div>

      <div style={denseCell}>
        <select style={rowSelect} value={role} onChange={e => { const nextRole = e.target.value; const nextHero = getRosterHeroOptions(nextRole)[0] || ''; const next = [...rosterPlayers]; next[idx] = { ...next[idx], role: nextRole, hero: nextHero, heroImage: getRosterHeroImagePath(nextRole, nextHero) }; updateRosterPlayers(next); }}>
          {ROSTER_ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div style={denseCell}>
        <select style={rowSelect} value={player.hero || ''} onChange={e => { const nextHero = e.target.value; const next = [...rosterPlayers]; next[idx] = { ...next[idx], hero: nextHero, heroImage: getRosterHeroImagePath(role, nextHero) }; updateRosterPlayers(next); }}>
          {heroOptions.map(hero => <option key={hero} value={hero}>{hero}</option>)}
        </select>
      </div>

      <div style={denseCell}>
        <input type="number" step="0.01" style={rowNumberInput} value={player.heroScale ?? 1.1} onChange={e => { const next = [...rosterPlayers]; next[idx] = { ...next[idx], heroScale: Number(e.target.value) || 1.1 }; updateRosterPlayers(next); }} />
      </div>

      <div style={denseCell}>
        <input type="number" step="0.01" style={rowNumberInput} value={player.heroBrightness ?? 0.84} onChange={e => { const next = [...rosterPlayers]; next[idx] = { ...next[idx], heroBrightness: Number(e.target.value) || 0.84 }; updateRosterPlayers(next); }} />
      </div>

      <div style={denseCell}>
        <input style={rowNumberInput} value={pos.x} onChange={e => updatePlayerPositionXY(idx, e.target.value, pos.y)} placeholder="50%" />
      </div>

      <div style={denseCell}>
        <input style={rowNumberInput} value={pos.y} onChange={e => updatePlayerPositionXY(idx, pos.x, e.target.value)} placeholder="24%" />
      </div>

      <div style={denseCell}>
        <input style={rowInput} value={(player.heroImage || '').startsWith('blob:') ? tr('rosterEditor.localMemoryImage') : (player.heroImage || '')} onChange={e => { const next = [...rosterPlayers]; next[idx] = { ...next[idx], heroImage: e.target.value }; updateRosterPlayers(next); }} placeholder="/assets/roster/damage/tracer.jpg" />
      </div>

      <div style={{ alignSelf: 'stretch', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{ ...rowBtn, flex: 1, minHeight: 0, padding: 0, fontSize: '10px', backgroundColor: COLORS.yellow, color: COLORS.black, cursor: 'pointer' }}>
          {tr('rosterEditor.upload')}
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleRosterImageUpload(idx, e)} />
        </label>

        <button
          style={{ ...rowOutlineBtn, flex: 1, minHeight: 0, padding: 0, fontSize: '10px', borderColor: COLORS.red, color: COLORS.red }}
          onClick={() => {
            const next = [...rosterPlayers];
            next[idx] = { ...next[idx], heroImage: getRosterHeroImagePath(role, player.hero), heroScale: 1.1, heroBrightness: 0.84, heroPosition: '' };
            updateRosterPlayers(next);
          }}
        >
          {tr('rosterEditor.reset')}
        </button>
      </div>
    </div>
  );
});


const RosterEditor = ({
  isDense,
  isUltra,
  blockGap,
  density = 'standard',
  densityTokens
}) => {
  const { t: tr } = useTranslation();

  const { matchData, updateData, updateWithHistory, showModal } = useMatchContext();

  const [rosterPresetModalOpen, setRosterPresetModalOpen] = useState(false);
  const [rosterPresetSaveModalOpen, setRosterPresetSaveModalOpen] = useState(false);
  const [rosterPresetForm, setRosterPresetForm] = useState({ name: '', key: '' });

  const teamTarget = matchData.rosterTeamTarget || 'A';
  const rosterPlayersKey = teamTarget === 'B' ? 'rosterPlayersB' : 'rosterPlayersA';
  const rosterStaffKey = teamTarget === 'B' ? 'rosterStaffB' : 'rosterStaffA';
  const rosterPlayers = matchData[rosterPlayersKey] || [];
  const rosterStaff = matchData[rosterStaffKey] || {
    clubName: '',
    showClubName: false,
    manager: { nickname: '', battleTag: '' },
    coaches: []
  };
  const rosterPresetLibrary = Array.isArray(matchData.rosterPresetLibrary) ? matchData.rosterPresetLibrary : [];

  const t = densityTokens || {
    panelPadding: '12px', panelPaddingLg: '14px', inputPadding: '8px 10px', inputFontSize: 12, buttonPadding: '8px 10px', buttonFontSize: 12, blockGap: 10
  };
  const ui = createEditorUi(t, density);

  const rowHeight = density === 'spacious' ? '34px' : '32px';
  const cellPadding = density === 'spacious' ? '8px' : '6px';
  const cellPaddingWide = density === 'spacious' ? '8px 10px' : '6px 8px';
  const tinyGap = '6px';
  const smallGap = '8px';
  const modalGap = '14px';

  const updateRosterPlayers = useCallback((nextPlayers) => updateData(prev => ({ ...prev, [rosterPlayersKey]: nextPlayers })), [rosterPlayersKey, updateData]);
  const updateRosterStaff = nextStaff => updateData({ ...matchData, [rosterStaffKey]: nextStaff });

  // 核心修复部分：改为异步处理并调用 processImageForStorage
  const handleRosterImageUpload = useCallback(async (idx, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      return showModal({ type: 'alert', title: tr('rosterEditor.invalidFile'), message: tr('rosterEditor.invalidFileMsg'), isDanger: true });
    }
    
    const oldImage = rosterPlayers[idx]?.heroImage;
    if (oldImage && oldImage.startsWith('blob:')) {
      URL.revokeObjectURL(oldImage);
    }
    
    try {
      const base64Image = await processImageForStorage(file);
      const next = [...rosterPlayers];
      next[idx] = { ...next[idx], heroImage: base64Image };
      updateRosterPlayers(next);
    } catch (error) {
      console.error("Image processing failed:", error);
      showModal({ type: 'alert', title: 'Error', message: 'Image processing failed, please try again.', isDanger: true });
    }
    
    e.target.value = '';
  }, [rosterPlayers, updateRosterPlayers, showModal, tr]);

  const parsePosition = value => {
    const parts = String(value || '').trim().replace(',', ' ').split(/\s+/).filter(Boolean);
    return { x: parts[0] || '', y: parts[1] || '' };
  };

  const updatePlayerPositionXY = useCallback((idx, nextX, nextY) => {
    const next = [...rosterPlayers];
    const x = String(nextX || '').trim();
    const y = String(nextY || '').trim();
    next[idx] = { ...next[idx], heroPosition: [x, y].filter(Boolean).join(' ') };
    updateRosterPlayers(next);
  }, [rosterPlayers, updateRosterPlayers]);

  const openRosterPresetPicker = () => setRosterPresetModalOpen(true);

  const openRosterPresetSaveModal = () => {
    const currentPresetData = buildRosterPresetFromTeam(matchData, teamTarget);
    const defaultName = currentPresetData.teamName || `TEAM ${teamTarget}`;
    const defaultKey = makeRosterPresetKey(defaultName);
    setRosterPresetForm({ name: defaultName, key: defaultKey });
    setRosterPresetSaveModalOpen(true);
  };

  const saveCurrentRosterAsPreset = () => {
    const name = safeText(rosterPresetForm.name);
    const key = makeRosterPresetKey(rosterPresetForm.key || rosterPresetForm.name);
    
    if (!name) return showModal({ type: 'alert', title: tr('rosterEditor.missingInfo'), message: tr('rosterEditor.emptyLabel'), isDanger: true });
    if (!key) return showModal({ type: 'alert', title: tr('rosterEditor.missingInfo'), message: tr('rosterEditor.emptyKey'), isDanger: true });

    const currentPresetData = buildRosterPresetFromTeam(matchData, teamTarget);
    const nextPreset = { key, name, data: cloneRosterPresetData(currentPresetData) };
    const library = [...rosterPresetLibrary];
    const existedIndex = library.findIndex(p => p.key === key);

    if (existedIndex >= 0) {
      showModal({
        type: 'confirm',
        title: tr('rosterEditor.overwrite'),
        message: tr('rosterEditor.overwriteMsg', { key }),
        isDanger: true,
        onConfirm: () => {
          library[existedIndex] = nextPreset;
          updateWithHistory(`Save roster preset: ${name}`, { ...matchData, rosterPresetLibrary: library });
          setRosterPresetSaveModalOpen(false);
        }
      });
      return;
    }

    library.push(nextPreset);
    updateWithHistory(`Save roster preset: ${name}`, { ...matchData, rosterPresetLibrary: library });
    setRosterPresetSaveModalOpen(false);
  };

  const applyRosterPresetToCurrentTeam = preset => {
    const nextData = applyRosterPresetToTeamData(matchData, preset?.data || {}, teamTarget);
    updateWithHistory(`Load roster preset: ${preset.name} -> TEAM ${teamTarget}`, nextData);
    setRosterPresetModalOpen(false);
  };

  const deleteRosterPreset = presetKey => {
    showModal({
      type: 'confirm',
      title: tr('rosterEditor.deletePreset'),
      message: tr('rosterEditor.deletePresetMsg', { key: presetKey }),
      isDanger: true,
      onConfirm: () => {
        updateData({ ...matchData, rosterPresetLibrary: rosterPresetLibrary.filter(p => p.key !== presetKey) });
      }
    });
  };

  const compactLabel = {
    fontSize: density === 'spacious' ? '11px' : '10px',
    fontWeight: '900', color: COLORS.faintWhite, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px', lineHeight: 1.2
  };

  const rowInput = { ...ui.input, height: rowHeight, minWidth: 0 };
  const rowNumberInput = { ...rowInput, paddingLeft: '4px', paddingRight: '2px', textAlign: 'center' };
  const rowSelect = { ...ui.select, height: rowHeight, minWidth: 0, padding: '0 8px', textOverflow: 'ellipsis' };
  
  const btnFlex = { display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const rowBtn = { ...ui.btn, height: rowHeight, minHeight: rowHeight, whiteSpace: 'nowrap', ...btnFlex };
  const rowOutlineBtn = { ...ui.outlineBtn, height: rowHeight, minHeight: rowHeight, whiteSpace: 'nowrap', ...btnFlex };
  const rowActionBtn = { ...ui.actionBtn, height: rowHeight, minHeight: rowHeight, whiteSpace: 'nowrap', ...btnFlex };

  const denseCell = { ...panelBase, padding: cellPadding, minWidth: 0 };
  const rowLabelCell = {
    ...panelBase, padding: cellPaddingWide, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: COLORS.white, fontSize: density === 'spacious' ? '12px' : '11px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase', borderLeft: `2px solid ${COLORS.yellow}`
  };

  const modalHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', borderBottom: `1px solid ${COLORS.line}`, paddingBottom: '10px', flexWrap: 'wrap' };
  const modalTitleWrapStyle = { display: 'flex', alignItems: 'center', gap: '10px' };
  const modalTitleStyle = { fontSize: density === 'spacious' ? '16px' : '15px', fontWeight: '900', color: COLORS.white, letterSpacing: '2px', textTransform: 'uppercase' };

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: isDense ? '1fr' : density === 'spacious' ? '360px minmax(0,1fr)' : '320px minmax(0,1fr)', gap: blockGap || t.blockGap, alignItems: 'start' }}>
        <ShellPanel title={tr('rosterEditor.basicSettings')} accent density={density}>
          <div style={{ display: 'grid', gap: smallGap }}>
            <div>
              <div style={compactLabel}>{tr('rosterEditor.editingTarget')}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', backgroundColor: '#111', border: UI.innerFrame }}>
                <button
                  style={{
                    border: 'none', cursor: 'pointer', height: density === 'spacious' ? '36px' : '34px', fontSize: `${t.buttonFontSize}px`, fontWeight: '900',
                    backgroundColor: teamTarget === 'A' ? COLORS.yellow : 'transparent', color: teamTarget === 'A' ? COLORS.black : COLORS.softWhite
                  }}
                  onClick={() => updateData({ ...matchData, rosterTeamTarget: 'A' })}
                >
                  {tr('rosterEditor.teamA')}
                </button>
                <button
                  style={{
                    border: 'none', cursor: 'pointer', height: density === 'spacious' ? '36px' : '34px', fontSize: `${t.buttonFontSize}px`, fontWeight: '900',
                    backgroundColor: teamTarget === 'B' ? COLORS.yellow : 'transparent', color: teamTarget === 'B' ? COLORS.black : COLORS.softWhite
                  }}
                  onClick={() => updateData({ ...matchData, rosterTeamTarget: 'B' })}
                >
                  {tr('rosterEditor.teamB')}
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tinyGap }}>
              <button style={{ ...rowOutlineBtn, width: '100%' }} onClick={openRosterPresetPicker}>{tr('rosterEditor.loadPreset')}</button>
              <button style={{ ...rowActionBtn, width: '100%' }} onClick={openRosterPresetSaveModal}>{tr('rosterEditor.savePreset')}</button>
            </div>

            <div>
              <div style={compactLabel}>{tr('rosterEditor.teamName', { target: teamTarget })}</div>
              <input
                style={rowInput}
                value={teamTarget === 'B' ? matchData.teamB : matchData.teamA}
                onChange={e => updateData({ ...matchData, [teamTarget === 'B' ? 'teamB' : 'teamA']: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 86px', gap: tinyGap, alignItems: 'end' }}>
              <div>
                <div style={compactLabel}>{tr('rosterEditor.teamLogo', { target: teamTarget })}</div>
                <select
                  style={rowSelect}
                  value={teamTarget === 'B' ? matchData.logoB : matchData.logoA}
                  onChange={e => updateData({ ...matchData, [teamTarget === 'B' ? 'logoB' : 'logoA']: e.target.value })}
                >
                  {LOGO_LIST.map(l => <option key={l.path} value={l.path}>{l.name}</option>)}
                </select>
              </div>

              <div>
                <div style={compactLabel}>{tr('rosterEditor.clubLogo')}</div>
                <button
                  style={{
                    ...rowBtn, width: '100%',
                    backgroundColor: rosterStaff.showClubName ? COLORS.yellow : '#444',
                    color: rosterStaff.showClubName ? COLORS.black : '#bbb'
                  }}
                  onClick={() => updateRosterStaff({ ...rosterStaff, showClubName: !rosterStaff.showClubName })}
                >
                  {rosterStaff.showClubName ? tr('rosterEditor.on') : tr('rosterEditor.off')}
                </button>
              </div>
            </div>

            <div>
              <div style={compactLabel}>{tr('rosterEditor.clubName')}</div>
              <input
                style={rowInput}
                value={rosterStaff.clubName || ''}
                onChange={e => updateRosterStaff({ ...rosterStaff, clubName: e.target.value })}
                placeholder={tr('rosterEditor.clubNamePlaceholder')}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tinyGap }}>
              <div>
                <div style={compactLabel}>{tr('rosterEditor.managerNickname')}</div>
                <input
                  style={rowInput}
                  value={rosterStaff.manager?.nickname || ''}
                  onChange={e => updateRosterStaff({ ...rosterStaff, manager: { ...rosterStaff.manager, nickname: e.target.value } })}
                />
              </div>
              <div>
                <div style={compactLabel}>{tr('rosterEditor.managerBattleTag')}</div>
                <input
                  style={rowInput}
                  value={rosterStaff.manager?.battleTag || ''}
                  onChange={e => updateRosterStaff({ ...rosterStaff, manager: { ...rosterStaff.manager, battleTag: e.target.value } })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tinyGap }}>
              <div>
                <div style={compactLabel}>{tr('rosterEditor.coachNickname')}</div>
                <input
                  style={rowInput}
                  value={rosterStaff.coaches?.[0]?.nickname || ''}
                  onChange={e => {
                    const next = [...(rosterStaff.coaches || [])];
                    next[0] = { ...(next[0] || { nickname: '', battleTag: '' }), nickname: e.target.value };
                    updateRosterStaff({ ...rosterStaff, coaches: next });
                  }}
                  placeholder={tr('rosterEditor.coachNicknamePlaceholder')}
                />
              </div>
              <div>
                <div style={compactLabel}>{tr('rosterEditor.coachBattleTag')}</div>
                <input
                  style={rowInput}
                  value={rosterStaff.coaches?.[0]?.battleTag || ''}
                  onChange={e => {
                    const next = [...(rosterStaff.coaches || [])];
                    next[0] = { ...(next[0] || { nickname: '', battleTag: '' }), battleTag: e.target.value };
                    updateRosterStaff({ ...rosterStaff, coaches: next });
                  }}
                  placeholder={tr('rosterEditor.optional')}
                />
              </div>
            </div>

            
            <div style={{ marginTop: '4px' }}>
               <button 
                 style={{...rowActionBtn, width: '100%', backgroundColor: COLORS.red, color: COLORS.white, border: `1px solid ${COLORS.red}`}}
                 onClick={() => {
                   updateWithHistory(`TAKE ROSTER TEAM ${teamTarget}`, {
                     ...matchData,
                     liveRosterTeam: teamTarget, 
                     globalScene: 'ROSTER'       
                   });
                 }}
               >
                 {tr('rosterEditor.takeToBroadcast')}
               </button>
            </div>
          </div>
        </ShellPanel>

        <ShellPanel title={tr('rosterEditor.rosterPlayers')} accent density={density}>
          <div style={{ display: 'grid', gap: tinyGap }}>
            {!isUltra && !isDense && (
              <div style={{ display: 'grid', gridTemplateColumns: '56px 1.2fr 1.2fr 100px 1.35fr 74px 74px 64px 64px 1.8fr 80px', gap: tinyGap, alignItems: 'end' }}>
                {[
                  'P', tr('rosterEditor.nickname'), tr('rosterEditor.battleTag'), tr('rosterEditor.role'), 
                  tr('rosterEditor.hero'), tr('rosterEditor.scale'), tr('rosterEditor.bright'), 
                  tr('rosterEditor.posX'), tr('rosterEditor.posY'), tr('rosterEditor.imagePath'), tr('rosterEditor.actions')
                ].map((label, i) => (
                  <div
                    key={i}
                    style={{
                      color: COLORS.faintWhite, fontSize: '10px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase', padding: i === 0 ? '0 0 0 4px' : 0
                    }}
                  >
                    {label}
                  </div>
                ))}
              </div>
            )}

            <div style={{ maxHeight: density === 'spacious' ? '620px' : '560px', minHeight: 0, overflowY: 'auto', overflowX: 'hidden', paddingRight: tinyGap, display: 'grid', gap: tinyGap }}>
              {rosterPlayers.map((player, idx) => {
                const role = player.role || 'DAMAGE';
                const heroOptions = getRosterHeroOptions(role);
                const pos = parsePosition(player.heroPosition);
                
                return (
                  <PlayerRow 
                    key={`${player.nickname || 'p'}-${idx}`} 
                    player={player} idx={idx} role={role} 
                    isDense={isDense} isUltra={isUltra} density={density} t={t} ui={ui} 
                    compactLabel={compactLabel} rowInput={rowInput} rowNumberInput={rowNumberInput} rowSelect={rowSelect} 
                    rowBtn={rowBtn} rowOutlineBtn={rowOutlineBtn} denseCell={denseCell} rowLabelCell={rowLabelCell} 
                    tinyGap={tinyGap} smallGap={smallGap} controlRowHeight={rowHeight} subButtonHeight={rowHeight}
                    handleRosterImageUpload={handleRosterImageUpload} updateRosterPlayers={updateRosterPlayers} 
                    rosterPlayers={rosterPlayers} updatePlayerPositionXY={updatePlayerPositionXY} pos={pos} heroOptions={heroOptions}
                    tr={tr} 
                  />
                )
              })}
            </div>

            <div style={{ display: 'flex', gap: smallGap, flexWrap: 'wrap', marginTop: '4px' }}>
              <button
                style={{ ...rowBtn, backgroundColor: COLORS.yellow, color: COLORS.black }}
                onClick={() => {
                  if (rosterPlayers.length >= 7) return showModal({ type: 'alert', title: tr('rosterEditor.limitMax'), message: tr('rosterEditor.maxPlayers'), isDanger: true });
                  updateRosterPlayers([
                    ...rosterPlayers,
                    {
                      nickname: `PLAYER${rosterPlayers.length + 1}`,
                      battleTag: '',
                      role: 'DAMAGE',
                      hero: 'tracer',
                      heroImage: getRosterHeroImagePath('DAMAGE', 'tracer'),
                      heroScale: 1.1,
                      heroBrightness: 0.84,
                      heroPosition: ''
                    }
                  ]);
                }}
              >
                {tr('rosterEditor.addPlayer')}
              </button>

              <button
                style={{ ...rowOutlineBtn, borderColor: COLORS.red, color: COLORS.red }}
                onClick={() => {
                  if (rosterPlayers.length <= 5) return showModal({ type: 'alert', title: tr('rosterEditor.limitMin'), message: tr('rosterEditor.minPlayers'), isDanger: true });
                  
                  const lastPlayer = rosterPlayers[rosterPlayers.length - 1];
                  if (lastPlayer.heroImage && lastPlayer.heroImage.startsWith('blob:')) {
                    URL.revokeObjectURL(lastPlayer.heroImage);
                  }
                  
                  updateRosterPlayers(rosterPlayers.slice(0, -1));
                }}
              >
                {tr('rosterEditor.removeLast')}
              </button>
            </div>
          </div>
        </ShellPanel>
      </div>

      {rosterPresetModalOpen && (
        <div
          onClick={() => setRosterPresetModalOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: isUltra ? '12px' : '24px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: density === 'spacious' ? 'min(980px, 100%)' : 'min(880px, 100%)', maxHeight: '84vh', ...panelBase, border: `2px solid ${COLORS.yellow}`, overflow: 'hidden' }}
          >
            <div style={{ position: 'relative', zIndex: 1, padding: t.panelPaddingLg, display: 'grid', gap: modalGap }}>
              <div style={modalHeaderStyle}>
                <div style={modalTitleWrapStyle}>
                  <div style={{ width: '8px', height: '8px', background: COLORS.yellow }} />
                  <span style={modalTitleStyle}>{tr('rosterEditor.loadRosterPreset')}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: smallGap, flexWrap: 'wrap' }}>
                  <span style={{ color: COLORS.faintWhite, fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    {tr('rosterEditor.targeting', { target: matchData.rosterTeamTarget || 'A' })}
                  </span>
                  <button style={{ ...rowOutlineBtn, borderColor: COLORS.red, color: COLORS.red }} onClick={() => setRosterPresetModalOpen(false)}>
                    {tr('rosterEditor.close')}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '10px', maxHeight: '62vh', overflowY: 'auto', paddingRight: '4px' }}>
                {(matchData.rosterPresetLibrary || []).map((preset, idx) => (
                  <div key={preset.key || idx} style={{ ...panelBase, padding: t.panelPadding, borderLeft: `3px solid ${COLORS.yellow}` }}>
                    <div style={{ display: 'grid', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ color: COLORS.white, fontWeight: '900', fontSize: density === 'spacious' ? '15px' : '14px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                            {preset.name}
                          </div>
                          <div style={{ color: COLORS.faintWhite, fontSize: '10px', marginTop: '5px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                            KEY // {preset.key}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: tinyGap, flexWrap: 'wrap' }}>
                          <button style={{ ...rowBtn, backgroundColor: COLORS.yellow, color: COLORS.black }} onClick={() => applyRosterPresetToCurrentTeam(preset)}>
                            {tr('rosterEditor.applyToTeam', { target: matchData.rosterTeamTarget || 'A' })}
                          </button>

                          <button style={{ ...rowOutlineBtn, borderColor: COLORS.red, color: COLORS.red }} onClick={() => deleteRosterPreset(preset.key)}>
                            {tr('rosterEditor.delete')}
                          </button>
                        </div>
                      </div>

                      <div style={{ color: COLORS.softWhite, fontSize: density === 'spacious' ? '12px' : '11px', lineHeight: 1.6 }}>
                        {tr('rosterEditor.team')}: {preset.data?.teamName || '—'}　|　{tr('rosterEditor.club')}: {preset.data?.clubName || '—'}
                      </div>

                      <div style={{ color: COLORS.faintWhite, fontSize: density === 'spacious' ? '12px' : '11px', lineHeight: 1.6, wordBreak: 'break-word' }}>
                        {(preset.data?.players || []).map(p => p.nickname || p.battleTag || 'PLAYER').join(' / ') || tr('rosterEditor.noPlayers')}
                      </div>
                    </div>
                  </div>
                ))}

                {!((matchData.rosterPresetLibrary || []).length) && (
                  <div style={{ ...panelBase, padding: '22px 16px', textAlign: 'center', color: COLORS.faintWhite, border: `1px dashed ${COLORS.lineStrong}` }}>
                    {tr('rosterEditor.noPresetsSaved')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {rosterPresetSaveModalOpen && (
        <div
          onClick={() => setRosterPresetSaveModalOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 10001, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: isUltra ? '12px' : '24px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: density === 'spacious' ? 'min(620px, 100%)' : 'min(560px, 100%)', ...panelBase, border: `2px solid ${COLORS.yellow}`, overflow: 'hidden' }}
          >
            <div style={{ position: 'relative', zIndex: 1, padding: t.panelPaddingLg, display: 'grid', gap: modalGap }}>
              <div style={modalHeaderStyle}>
                <div style={modalTitleWrapStyle}>
                  <div style={{ width: '8px', height: '8px', background: COLORS.yellow }} />
                  <span style={modalTitleStyle}>{tr('rosterEditor.saveRosterPreset')}</span>
                </div>
                <button style={{ ...rowOutlineBtn, borderColor: COLORS.red, color: COLORS.red }} onClick={() => setRosterPresetSaveModalOpen(false)}>
                  {tr('rosterEditor.close')}
                </button>
              </div>

              <QuickStat label={tr('rosterEditor.sourceData')} value={`TEAM ${matchData.rosterTeamTarget || 'A'}`} valueColor={COLORS.yellow} compact density={density} />

              <Field label={tr('rosterEditor.presetLabel')} density={density}>
                <input
                  style={ui.input}
                  value={rosterPresetForm.name}
                  onChange={e => setRosterPresetForm(prev => ({ ...prev, name: e.target.value, key: makeRosterPresetKey(e.target.value) }))}
                  placeholder="FRIES ESPORTS"
                />
              </Field>

              <Field label={tr('rosterEditor.presetKey')} density={density}>
                <input
                  style={ui.input}
                  value={rosterPresetForm.key}
                  onChange={e => setRosterPresetForm(prev => ({ ...prev, key: makeRosterPresetKey(e.target.value) }))}
                  placeholder="FRIES_ESPORTS"
                />
              </Field>

              <SectionHint
                text={tr('rosterEditor.saveHint')}
                density={density}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: smallGap }}>
                <button style={{ ...rowOutlineBtn, width: '100%' }} onClick={() => setRosterPresetSaveModalOpen(false)}>
                  {tr('rosterEditor.cancel')}
                </button>
                <button style={{ ...rowActionBtn, width: '100%' }} onClick={saveCurrentRosterAsPreset}>
                  {tr('rosterEditor.confirmSave')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RosterEditor;