import React, { useMemo, useState } from 'react';
// 🚀 引入 i18n
import { useTranslation } from 'react-i18next';
import { useMatchContext } from '../../contexts/MatchContext';
import { ShellPanel, Field, SectionHint, TogglePill } from '../common/SharedUI';
import { COLORS, panelBase } from '../../constants/styles';
import { MAP_DATA, HERO_DATA } from '../../constants/gameData';
import { createEditorUi } from '../../utils/editorUi';

const CANONICAL_MAP_TYPES = ['CONTROL', 'ESCORT', 'HYBRID', 'PUSH', 'FLASHPOINT', 'CLASH'];

const DEFAULT_EVENT_MAP_POOL = {
  CONTROL: ['ILIOS', 'LIJIANG TOWER', 'BUSAN'],
  ESCORT: ['DORADO', 'ROUTE 66', 'HAVANA'],
  HYBRID: ["KING'S ROW", 'EICHENWALDE', 'BLIZZARD WORLD'],
  PUSH: ['COLOSSEO', 'NEW QUEEN STREET'],
  FLASHPOINT: ['SURAVASA', 'ATLIS'],
  CLASH: ['HANAOKA', 'THRONE OF ANUBIS']
};

const DEFAULT_ENABLED_MAP_TYPES = {
  CONTROL: true,
  ESCORT: true,
  HYBRID: true,
  PUSH: true,
  FLASHPOINT: true,
  CLASH: false
};

const HERO_ROLE_OPTIONS = ['tank', 'damage', 'support'];

const normalizeMapTypeKey = raw => {
  if (!raw) return 'CONTROL';
  const s = String(raw).trim().toUpperCase();
  if (s.includes('CONTROL') || s.includes('占领')) return 'CONTROL';
  if (s.includes('ESCORT') || s.includes('运载')) return 'ESCORT';
  if (s.includes('HYBRID') || s.includes('混合')) return 'HYBRID';
  if (s.includes('PUSH') || s.includes('推进')) return 'PUSH';
  if (s.includes('FLASHPOINT') || s.includes('闪点')) return 'FLASHPOINT';
  if (s.includes('CLASH') || s.includes('争锋') || s.includes('冲突')) return 'CLASH';
  return CANONICAL_MAP_TYPES.includes(s) ? s : 'CONTROL';
};

const dedupeList = list => Array.from(new Set((Array.isArray(list) ? list : []).filter(Boolean)));

const parseBanEntry = entry => {
  const raw = Array.isArray(entry) ? entry[0] : entry;
  const str = String(raw || '').trim().toLowerCase();
  if (!str) return { role: 'damage', hero: 'tbd' };
  if (!str.includes('/')) return { role: 'damage', hero: str || 'tbd' };
  const [role, hero] = str.split('/');
  return {
    role: HERO_ROLE_OPTIONS.includes(role) ? role : 'damage',
    hero: hero || 'tbd'
  };
};

const buildBanEntry = (role, hero) => `${role || 'damage'}/${hero || 'tbd'}`;

const InlineSelect = React.memo(({
  labelLines,
  value,
  onChange,
  children,
  selectStyle,
  density,
  rowGap,
  consoleSelectStyle,
  inlineLabelBoxStyle
}) => (
  <div style={{ display: 'grid', gridTemplateColumns: density === 'spacious' ? '72px minmax(0,1fr)' : '64px minmax(0,1fr)', gap: rowGap, alignItems: 'stretch', minWidth: 0 }}>
    <div style={inlineLabelBoxStyle}>
      {Array.isArray(labelLines) ? labelLines.map((line, idx) => <div key={idx}>{line}</div>) : <div>{labelLines}</div>}
    </div>
    <select style={{ ...consoleSelectStyle, ...selectStyle }} value={value} onChange={onChange}>
      {children}
    </select>
  </div>
));

export default function MapPoolEditor({ density = 'standard', densityTokens, isDense = false, isUltra = false }) {
  // 🚀 初始化翻译钩子
  const { t: tr } = useTranslation();

  const { matchData, updateData, updateWithHistory } = useMatchContext();
  const [mapEditTab, setMapEditTab] = useState('MATCH');
  const [expandedBanIndex, setExpandedBanIndex] = useState(null);

  const t = densityTokens || { blockGap: 10, panelPadding: '12px 14px', buttonFontSize: 12, buttonPadding: '9px 12px' };
  const ui = createEditorUi(densityTokens, density);

  const compactGrid = isDense;
  const ultraGrid = isUltra;
  const rowGap = density === 'spacious' ? 10 : 8;
  const stepButtonHeight = density === 'spacious' ? '40px' : '36px';
  const metaDisplayMode = String(matchData.mapMetaDisplayMode || 'RESULT').toUpperCase();
  const banDisplayMode = String(matchData.mapBanDisplayMode || 'SHOW').toUpperCase();

  const formatLength = useMemo(() => {
    const fmt = String(matchData.matchFormat || 'BO3').toUpperCase();
    if (fmt.includes('7') || fmt.includes('FT4')) return 7;
    if (fmt.includes('5') || fmt.includes('FT3')) return 5;
    const match = fmt.match(/\d+/);
    return match ? parseInt(match[0], 10) : 3;
  }, [matchData.matchFormat]);

  const safeFormatSelect = formatLength === 7 ? 'BO7' : formatLength === 5 ? 'BO5' : 'BO3';

  const mapDataResolved = useMemo(() => {
    const result = {};
    Object.entries(MAP_DATA || {}).forEach(([rawKey, value]) => {
      const canonical = normalizeMapTypeKey(rawKey);
      if (!result[canonical]) result[canonical] = [];
      result[canonical] = dedupeList([...(result[canonical] || []), ...(Array.isArray(value) ? value : [])]);
    });
    CANONICAL_MAP_TYPES.forEach(type => {
      if (!result[type]) result[type] = [];
    });
    return result;
  }, []);

  const enabledMapTypes = useMemo(() => {
    const raw = matchData.enabledMapTypes || {};
    const merged = { ...DEFAULT_ENABLED_MAP_TYPES };
    Object.entries(raw).forEach(([key, value]) => {
      merged[normalizeMapTypeKey(key)] = value;
    });
    return merged;
  }, [matchData.enabledMapTypes]);

  const eventMapPool = useMemo(() => {
    const raw = matchData.eventMapPool || {};
    const merged = { ...DEFAULT_EVENT_MAP_POOL };

    Object.entries(raw).forEach(([key, value]) => {
      const canonical = normalizeMapTypeKey(key);
      if (Array.isArray(value)) {
        const maxSlots = DEFAULT_EVENT_MAP_POOL[canonical]?.length || 3;
        merged[canonical] = value.slice(0, maxSlots);
      } else {
        merged[canonical] = [];
      }
    });

    CANONICAL_MAP_TYPES.forEach(type => {
      if (!Array.isArray(merged[type]) || !merged[type].length) {
        merged[type] = dedupeList(DEFAULT_EVENT_MAP_POOL[type] || mapDataResolved[type] || []);
      }
    });

    return merged;
  }, [matchData.eventMapPool, mapDataResolved]);

  const currentLineup = Array.isArray(matchData.mapLineup) ? matchData.mapLineup : [];

  const getAllMapsForType = type => {
    const canonical = normalizeMapTypeKey(type);
    const fromData = dedupeList(mapDataResolved[canonical] || []);
    if (fromData.length) return fromData;
    return dedupeList(DEFAULT_EVENT_MAP_POOL[canonical] || []);
  };

  const getPoolMapsForType = type => {
    const canonical = normalizeMapTypeKey(type);
    const pool = eventMapPool[canonical] || [];
    if (pool.length) return pool;
    return getAllMapsForType(canonical);
  };

  const displayMaps = Array.from({ length: formatLength }).map((_, i) => {
    const raw = currentLineup[i] || {};
    const normalizedType = normalizeMapTypeKey(raw.type || 'CONTROL');
    const typePool = getPoolMapsForType(normalizedType);
    const safeName = typePool.includes(raw.name) ? raw.name : (typePool[0] || '');

    return {
      type: normalizedType,
      name: safeName,
      scoreA: raw.scoreA ?? 0,
      scoreB: raw.scoreB ?? 0,
      picker: raw.picker || '',
      winner: raw.winner || raw.winnerSide || '',
      winnerSide: raw.winnerSide || raw.winner || '',
      bansA: Array.isArray(raw.bansA) ? raw.bansA : [],
      bansB: Array.isArray(raw.bansB) ? raw.bansB : [],
      banOrderMode: raw.banOrderMode || 'A_FIRST',
      attackSide: raw.attackSide || '',
      swapSides: !!raw.swapSides
    };
  });

  const tabBtnStyle = active => ({
    ...ui.softOutlineBtn,
    backgroundColor: active ? COLORS.yellow : 'transparent',
    color: active ? COLORS.black : COLORS.softWhite,
    minHeight: stepButtonHeight,
    height: stepButtonHeight,
    padding: density === 'spacious' ? '0 14px' : '0 12px',
    fontSize: density === 'spacious' ? '12px' : '11px',
    fontWeight: 900,
    boxSizing: 'border-box'
  });

  const stepBtnBase = {
    minHeight: stepButtonHeight,
    height: stepButtonHeight,
    padding: 0,
    fontSize: density === 'spacious' ? '18px' : '16px',
    fontWeight: 900,
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box'
  };

  const inlineLabelBoxStyle = {
    minHeight: stepButtonHeight,
    height: stepButtonHeight,
    border: `1px solid ${COLORS.line}`,
    background: 'rgba(255,255,255,0.02)',
    color: COLORS.faintWhite,
    fontSize: density === 'spacious' ? '10px' : '9px',
    fontWeight: 900,
    letterSpacing: '1.1px',
    textTransform: 'uppercase',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
    boxSizing: 'border-box',
    whiteSpace: 'nowrap',
    padding: '0 4px'
  };

  const consoleSelectStyle = {
    ...ui.select,
    minHeight: stepButtonHeight,
    height: stepButtonHeight,
    boxSizing: 'border-box',
    minWidth: 0,
    width: '100%',
    paddingLeft: '10px',
    paddingRight: '28px',
    paddingTop: 0,
    paddingBottom: 0,
    fontSize: density === 'spacious' ? '14px' : '13px',
    fontWeight: 800,
    lineHeight: 'normal',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    outline: 'none'
  };

  const currentMapSafe = Math.max(1, Math.min(formatLength, Number(matchData.currentMap) || 1));

  const setCurrentMapSafe = nextMap => {
    const clamped = Math.max(1, Math.min(formatLength, nextMap));
    updateWithHistory(`Change Current Map to ${clamped}`, { ...matchData, currentMap: clamped });
  };

  const updateMap = (index, key, value) => {
    const newLineup = Array.from({ length: formatLength }).map((_, i) => ({
      ...(currentLineup[i] || {}),
      ...(displayMaps[i] || {})
    }));

    const prev = { ...newLineup[index] };

    if (key === 'type') {
      const nextType = normalizeMapTypeKey(value);
      const nextPool = getPoolMapsForType(nextType);
      newLineup[index] = {
        ...prev,
        type: nextType,
        name: nextPool[0] || '',
        picker: prev.picker || '',
        winner: prev.winner || '',
        winnerSide: prev.winnerSide || prev.winner || '',
        bansA: Array.isArray(prev.bansA) ? [...prev.bansA] : [],
        bansB: Array.isArray(prev.bansB) ? [...prev.bansB] : [],
        banOrderMode: prev.banOrderMode || 'A_FIRST',
        attackSide: prev.attackSide || '',
        swapSides: !!prev.swapSides
      };
    } else if (key === 'winner') {
      newLineup[index] = { ...prev, winner: value, winnerSide: value };
    } else {
      newLineup[index] = { ...prev, [key]: value };
    }

    updateWithHistory(`Update Map ${index + 1} ${key}`, { ...matchData, mapLineup: newLineup });
  };

  const updateMapBanEntry = (index, side, role, hero) => {
    const newLineup = Array.from({ length: formatLength }).map((_, i) => ({
      ...(currentLineup[i] || {}),
      ...(displayMaps[i] || {})
    }));

    const prev = { ...newLineup[index] };
    const key = side === 'A' ? 'bansA' : 'bansB';

    newLineup[index] = {
      ...prev,
      [key]: [buildBanEntry(role, hero)]
    };

    updateWithHistory(`Update Map ${index + 1} ${key}`, { ...matchData, mapLineup: newLineup });
  };

  const useLiveBansForMap = index => {
    const newLineup = Array.from({ length: formatLength }).map((_, i) => ({
      ...(currentLineup[i] || {}),
      ...(displayMaps[i] || {})
    }));

    const prev = { ...newLineup[index] };

    newLineup[index] = {
      ...prev,
      bansA: Array.isArray(matchData.bansA) ? [...matchData.bansA] : [],
      bansB: Array.isArray(matchData.bansB) ? [...matchData.bansB] : [],
      banOrderMode: matchData.banOrderMode || 'A_FIRST'
    };

    updateWithHistory(`Use live bans for Map ${index + 1}`, { ...matchData, mapLineup: newLineup });
  };

  const clearMapBans = index => {
    const newLineup = Array.from({ length: formatLength }).map((_, i) => ({
      ...(currentLineup[i] || {}),
      ...(displayMaps[i] || {})
    }));

    const prev = { ...newLineup[index] };

    newLineup[index] = {
      ...prev,
      bansA: [],
      bansB: [],
      banOrderMode: 'A_FIRST'
    };

    updateWithHistory(`Clear Map ${index + 1} bans`, { ...matchData, mapLineup: newLineup });
  };

  const updateEventPoolSlot = (type, slotIndex, mapName) => {
    const canonical = normalizeMapTypeKey(type);
    const nextPool = { ...eventMapPool, [canonical]: [...(eventMapPool[canonical] || [])] };
    nextPool[canonical][slotIndex] = mapName;

    const normalizedPool = {};
    CANONICAL_MAP_TYPES.forEach(k => {
      normalizedPool[k] = nextPool[k] || [];
    });

    const nextLineup = Array.from({ length: formatLength }).map((_, i) => {
      const map = { ...(currentLineup[i] || {}), ...(displayMaps[i] || {}) };
      const mapType = normalizeMapTypeKey(map.type);
      if (mapType !== canonical) return map;
      const validNames = normalizedPool[canonical] || [];
      return { ...map, name: validNames.includes(map.name) ? map.name : (validNames[0] || '') };
    });

    updateWithHistory(`Update ${canonical} pool slot ${slotIndex + 1}`, {
      ...matchData,
      eventMapPool: normalizedPool,
      mapLineup: nextLineup
    });
  };

  const toggleMapTypeEnabled = (type, enabled) => {
    const canonical = normalizeMapTypeKey(type);
    updateWithHistory(`${enabled ? 'Enable' : 'Disable'} map type: ${canonical}`, {
      ...matchData,
      enabledMapTypes: { ...enabledMapTypes, [canonical]: enabled }
    });
  };

  const buildTeamOptionLabel = (short, full, fallbackShort) => {
    const s = (short || fallbackShort).toUpperCase();
    const f = full || '';
    return f ? `${s} - ${f}` : s;
  };

  const pickerOptions = [
    <option key="" value="">{tr('mapPoolEditor.tbd')}</option>,
    <option key="A" value="A">{buildTeamOptionLabel(matchData.teamShortA, matchData.teamA, 'TM A')}</option>,
    <option key="B" value="B">{buildTeamOptionLabel(matchData.teamShortB, matchData.teamB, 'TM B')}</option>
  ];

  const winnerOptions = [
    <option key="" value="">{tr('mapPoolEditor.tbd')}</option>,
    <option key="A" value="A">{buildTeamOptionLabel(matchData.teamShortA, matchData.teamA, 'TM A')}</option>,
    <option key="B" value="B">{buildTeamOptionLabel(matchData.teamShortB, matchData.teamB, 'TM B')}</option>
  ];

  const activeOverviewTypes = CANONICAL_MAP_TYPES.filter(type => enabledMapTypes[type] !== false && eventMapPool[type]?.length);
  const disabledOverviewTypes = CANONICAL_MAP_TYPES.filter(type => enabledMapTypes[type] === false);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: compactGrid ? '1fr' : density === 'spacious' ? '380px minmax(0,1fr)' : '350px minmax(0,1fr)', gap: t.blockGap, alignItems: 'stretch' }}>
      <ShellPanel title={tr('mapPoolEditor.globalMapSettings')} accent density={density}>
        <div style={{ display: 'grid', gap: rowGap + 2, height: '100%', alignContent: 'start' }}>
          <Field label={tr('mapPoolEditor.eventInfo')} density={density}>
            <input
              style={{ ...ui.input, minHeight: stepButtonHeight, height: stepButtonHeight, boxSizing: 'border-box' }}
              value={matchData.info || ''}
              onChange={e => updateData({ ...matchData, info: e.target.value })}
              placeholder={tr('mapPoolEditor.eventInfoPlaceholder')}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: ultraGrid ? '1fr' : '1fr 1fr', gap: rowGap, alignItems: 'stretch' }}>
            <Field label={tr('mapPoolEditor.matchFormat')} density={density}>
              <select
                style={consoleSelectStyle}
                value={safeFormatSelect}
                onChange={e => updateWithHistory(`Change Format to ${e.target.value}`, {
                  ...matchData,
                  matchFormat: e.target.value,
                  currentMap: 1
                })}
              >
                <option value="BO3">BO3</option>
                <option value="BO5">BO5</option>
                <option value="BO7">BO7</option>
              </select>
            </Field>

            <Field label={tr('mapPoolEditor.currentMap')} density={density}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.35fr 1fr', gap: rowGap, alignItems: 'stretch' }}>
                <button style={{ ...ui.outlineBtn, ...stepBtnBase }} onClick={() => setCurrentMapSafe(currentMapSafe - 1)}>−</button>
                <div style={{ ...ui.input, minHeight: stepButtonHeight, height: stepButtonHeight, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: COLORS.yellow, letterSpacing: '0.08em', textTransform: 'uppercase', boxSizing: 'border-box' }}>
                  {currentMapSafe}
                </div>
                <button style={{ ...ui.actionBtn, ...stepBtnBase }} onClick={() => setCurrentMapSafe(currentMapSafe + 1)}>+</button>
              </div>
            </Field>
          </div>

          <div style={{ ...panelBase, padding: t.panelPadding, display: 'grid', gap: rowGap + 2, alignContent: 'start' }}>
            <div style={{ fontSize: '11px', color: COLORS.white, fontWeight: 900, letterSpacing: '1.2px', textTransform: 'uppercase' }}>
              {tr('mapPoolEditor.topStatusContent')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', backgroundColor: '#111', border: `1px solid ${COLORS.line}` }}>
              <button
                style={{
                  border: 'none',
                  cursor: 'pointer',
                  minHeight: stepButtonHeight,
                  height: stepButtonHeight,
                  fontWeight: 900,
                  fontSize: `${t.buttonFontSize}px`,
                  padding: '0 10px',
                  backgroundColor: metaDisplayMode === 'CLEAN' ? COLORS.yellow : 'transparent',
                  color: metaDisplayMode === 'CLEAN' ? COLORS.black : COLORS.softWhite
                }}
                onClick={() => updateData({ ...matchData, mapMetaDisplayMode: 'CLEAN' })}
              >
                {tr('mapPoolEditor.clean')}
              </button>
              <button
                style={{
                  border: 'none',
                  cursor: 'pointer',
                  minHeight: stepButtonHeight,
                  height: stepButtonHeight,
                  fontWeight: 900,
                  fontSize: `${t.buttonFontSize}px`,
                  padding: '0 10px',
                  backgroundColor: metaDisplayMode === 'RESULT' ? COLORS.yellow : 'transparent',
                  color: metaDisplayMode === 'RESULT' ? COLORS.black : COLORS.softWhite
                }}
                onClick={() => updateData({ ...matchData, mapMetaDisplayMode: 'RESULT' })}
              >
                {tr('mapPoolEditor.result')}
              </button>
              <button
                style={{
                  border: 'none',
                  cursor: 'pointer',
                  minHeight: stepButtonHeight,
                  height: stepButtonHeight,
                  fontWeight: 900,
                  fontSize: `${t.buttonFontSize}px`,
                  padding: '0 10px',
                  backgroundColor: metaDisplayMode === 'FULL' ? COLORS.yellow : 'transparent',
                  color: metaDisplayMode === 'FULL' ? COLORS.black : COLORS.softWhite
                }}
                onClick={() => updateData({ ...matchData, mapMetaDisplayMode: 'FULL' })}
              >
                {tr('mapPoolEditor.full')}
              </button>
            </div>
          </div>

          <div style={{ ...panelBase, padding: t.panelPadding, display: 'grid', gap: rowGap + 2, alignContent: 'start' }}>
            <div style={{ fontSize: '11px', color: COLORS.white, fontWeight: 900, letterSpacing: '1.2px', textTransform: 'uppercase' }}>
              {tr('mapPoolEditor.banDisplay')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', backgroundColor: '#111', border: `1px solid ${COLORS.line}` }}>
              <button
                style={{
                  border: 'none',
                  cursor: 'pointer',
                  minHeight: stepButtonHeight,
                  height: stepButtonHeight,
                  fontWeight: 900,
                  fontSize: `${t.buttonFontSize}px`,
                  padding: '0 10px',
                  backgroundColor: banDisplayMode === 'HIDE' ? COLORS.yellow : 'transparent',
                  color: banDisplayMode === 'HIDE' ? COLORS.black : COLORS.softWhite
                }}
                onClick={() => updateData({ ...matchData, mapBanDisplayMode: 'HIDE' })}
              >
                {tr('mapPoolEditor.hide')}
              </button>
              <button
                style={{
                  border: 'none',
                  cursor: 'pointer',
                  minHeight: stepButtonHeight,
                  height: stepButtonHeight,
                  fontWeight: 900,
                  fontSize: `${t.buttonFontSize}px`,
                  padding: '0 10px',
                  backgroundColor: banDisplayMode === 'SHOW' ? COLORS.yellow : 'transparent',
                  color: banDisplayMode === 'SHOW' ? COLORS.black : COLORS.softWhite
                }}
                onClick={() => updateData({ ...matchData, mapBanDisplayMode: 'SHOW' })}
              >
                {tr('mapPoolEditor.show')}
              </button>
            </div>
          </div>

          <div style={{ ...panelBase, padding: t.panelPadding, display: 'grid', gap: rowGap + 2, alignContent: 'start' }}>
            <div style={{ fontSize: '11px', color: COLORS.white, fontWeight: 900, letterSpacing: '1.2px', textTransform: 'uppercase' }}>
              {tr('mapPoolEditor.mapPoolOutput')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', backgroundColor: '#111', border: `1px solid ${COLORS.line}` }}>
              <button
                style={{
                  border: 'none',
                  cursor: 'pointer',
                  minHeight: stepButtonHeight,
                  height: stepButtonHeight,
                  fontWeight: 900,
                  fontSize: `${t.buttonFontSize}px`,
                  padding: '0 10px',
                  backgroundColor: (matchData.mapPoolDisplayMode || 'MATCH') === 'MATCH' ? COLORS.yellow : 'transparent',
                  color: (matchData.mapPoolDisplayMode || 'MATCH') === 'MATCH' ? COLORS.black : COLORS.softWhite
                }}
                onClick={() => updateData({ ...matchData, mapPoolDisplayMode: 'MATCH' })}
              >
                {tr('mapPoolEditor.matchSequence')}
              </button>
              <button
                style={{
                  border: 'none',
                  cursor: 'pointer',
                  minHeight: stepButtonHeight,
                  height: stepButtonHeight,
                  fontWeight: 900,
                  fontSize: `${t.buttonFontSize}px`,
                  padding: '0 10px',
                  backgroundColor: matchData.mapPoolDisplayMode === 'OVERVIEW' ? COLORS.yellow : 'transparent',
                  color: matchData.mapPoolDisplayMode === 'OVERVIEW' ? COLORS.black : COLORS.softWhite
                }}
                onClick={() => updateData({ ...matchData, mapPoolDisplayMode: 'OVERVIEW' })}
              >
                {tr('mapPoolEditor.fullPool')}
              </button>
            </div>
            <TogglePill
              density={density}
              active={!!matchData.showOverviewCurrent}
              onClick={() => updateData({ ...matchData, showOverviewCurrent: !matchData.showOverviewCurrent })}
              onText={tr('mapPoolEditor.highlightOn')}
              offText={tr('mapPoolEditor.highlightOff')}
              onColor={COLORS.yellow}
              offColor="#555"
            />
          </div>
        </div>
      </ShellPanel>

      <ShellPanel
        title={tr('mapPoolEditor.mapDataEditor')}
        density={density}
        right={
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button style={tabBtnStyle(mapEditTab === 'MATCH')} onClick={() => setMapEditTab('MATCH')}>{tr('mapPoolEditor.matchSequence')}</button>
            <button style={tabBtnStyle(mapEditTab === 'OVERVIEW')} onClick={() => setMapEditTab('OVERVIEW')}>{tr('mapPoolEditor.fullPool')}</button>
          </div>
        }
        accent
      >
        {mapEditTab === 'MATCH' && (
          <div style={{ display: 'grid', gap: rowGap + 2 }}>
            {displayMaps.map((mapInfo, idx) => {
              const isCurrent = currentMapSafe === idx + 1;
              const mapNameOptions = getPoolMapsForType(mapInfo.type);
              const isExpanded = expandedBanIndex === idx;

              const parsedBanA = parseBanEntry(mapInfo.bansA?.[0]);
              const parsedBanB = parseBanEntry(mapInfo.bansB?.[0]);

              const banPanelGrid = ultraGrid
                ? '1fr'
                : compactGrid
                ? '1fr'
                : '1fr 1fr';

              return (
                <div
                  key={idx}
                  style={{
                    ...panelBase,
                    padding: t.panelPadding,
                    display: 'grid',
                    gap: rowGap,
                    borderLeft: `3px solid ${isCurrent ? COLORS.yellow : 'transparent'}`,
                    backgroundColor: isCurrent ? 'rgba(244,195,32,0.05)' : undefined,
                    boxShadow: isCurrent ? 'inset 0 0 0 1px rgba(244,195,32,0.10)' : undefined
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: ultraGrid
                        ? '1fr'
                        : isDense
                        ? 'minmax(78px,auto) 1fr'
                        : density === 'spacious'
                        ? 'minmax(84px,auto) 1fr 1.6fr 0.95fr 0.95fr auto'
                        : 'minmax(80px,auto) 1fr 1.6fr 0.95fr 0.95fr auto',
                      gap: rowGap,
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ paddingBottom: 0, minWidth: 0 }}>
                      <div style={{ fontSize: density === 'spacious' ? '15px' : '14px', fontWeight: 900, color: isCurrent ? COLORS.yellow : COLORS.softWhite, letterSpacing: '0.06em' }}>
                        {tr('mapPoolEditor.map')} {idx + 1}
                      </div>
                      <div style={{ fontSize: '10px', fontWeight: 900, color: isCurrent ? COLORS.yellow : COLORS.faintWhite, marginTop: '4px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                        {isCurrent ? tr('mapPoolEditor.current') : tr('mapPoolEditor.ready')}
                      </div>
                    </div>

                    {ultraGrid ? (
                      <div style={{ display: 'grid', gap: rowGap, gridTemplateColumns: '1.05fr 1.35fr 1fr 1fr auto', minWidth: 0 }}>
                        <InlineSelect
                          density={density}
                          rowGap={rowGap}
                          consoleSelectStyle={consoleSelectStyle}
                          inlineLabelBoxStyle={inlineLabelBoxStyle}
                          labelLines={[tr('mapPoolEditor.map'), tr('mapPoolEditor.type')]}
                          value={mapInfo.type}
                          onChange={e => updateMap(idx, 'type', e.target.value)}
                        >
                          {CANONICAL_MAP_TYPES.filter(type => enabledMapTypes[type] !== false).map(type => (
                            <option key={type} value={type}>{tr(`mapPoolEditor.mapTypes.${type}`) || type}</option>
                          ))}
                        </InlineSelect>

                        <InlineSelect
                          density={density}
                          rowGap={rowGap}
                          consoleSelectStyle={consoleSelectStyle}
                          inlineLabelBoxStyle={inlineLabelBoxStyle}
                          labelLines={[tr('mapPoolEditor.map'), tr('mapPoolEditor.name')]}
                          value={mapInfo.name}
                          onChange={e => updateMap(idx, 'name', e.target.value)}
                        >
                          {mapNameOptions.map((name, i) => <option key={`${name}-${i}`} value={name}>{name}</option>)}
                        </InlineSelect>

                        <InlineSelect
                          density={density}
                          rowGap={rowGap}
                          consoleSelectStyle={consoleSelectStyle}
                          inlineLabelBoxStyle={inlineLabelBoxStyle}
                          labelLines={[tr('mapPoolEditor.pick')]}
                          value={mapInfo.picker || ''}
                          onChange={e => updateMap(idx, 'picker', e.target.value)}
                        >
                          {pickerOptions}
                        </InlineSelect>

                        <InlineSelect
                          density={density}
                          rowGap={rowGap}
                          consoleSelectStyle={consoleSelectStyle}
                          inlineLabelBoxStyle={inlineLabelBoxStyle}
                          labelLines={[tr('mapPoolEditor.winner')]}
                          value={mapInfo.winner || ''}
                          onChange={e => updateMap(idx, 'winner', e.target.value)}
                        >
                          {winnerOptions}
                        </InlineSelect>

                        <button
                          style={{ ...ui.outlineBtn, minHeight: stepButtonHeight, height: stepButtonHeight, whiteSpace: 'nowrap' }}
                          onClick={() => setExpandedBanIndex(isExpanded ? null : idx)}
                        >
                          {isExpanded ? tr('mapPoolEditor.close') : tr('mapPoolEditor.ban')}
                        </button>
                      </div>
                    ) : (
                      <>
                        <InlineSelect
                          density={density}
                          rowGap={rowGap}
                          consoleSelectStyle={consoleSelectStyle}
                          inlineLabelBoxStyle={inlineLabelBoxStyle}
                          labelLines={[tr('mapPoolEditor.map'), tr('mapPoolEditor.type')]}
                          value={mapInfo.type}
                          onChange={e => updateMap(idx, 'type', e.target.value)}
                        >
                          {CANONICAL_MAP_TYPES.filter(type => enabledMapTypes[type] !== false).map(type => (
                            <option key={type} value={type}>{tr(`mapPoolEditor.mapTypes.${type}`) || type}</option>
                          ))}
                        </InlineSelect>

                        <InlineSelect
                          density={density}
                          rowGap={rowGap}
                          consoleSelectStyle={consoleSelectStyle}
                          inlineLabelBoxStyle={inlineLabelBoxStyle}
                          labelLines={[tr('mapPoolEditor.map'), tr('mapPoolEditor.name')]}
                          value={mapInfo.name}
                          onChange={e => updateMap(idx, 'name', e.target.value)}
                        >
                          {mapNameOptions.map((name, i) => <option key={`${name}-${i}`} value={name}>{name}</option>)}
                        </InlineSelect>

                        {!isDense && (
                          <InlineSelect
                            density={density}
                            rowGap={rowGap}
                            consoleSelectStyle={consoleSelectStyle}
                            inlineLabelBoxStyle={inlineLabelBoxStyle}
                            labelLines={[tr('mapPoolEditor.pick')]}
                            value={mapInfo.picker || ''}
                            onChange={e => updateMap(idx, 'picker', e.target.value)}
                          >
                            {pickerOptions}
                          </InlineSelect>
                        )}

                        {!isDense && (
                          <InlineSelect
                            density={density}
                            rowGap={rowGap}
                            consoleSelectStyle={consoleSelectStyle}
                            inlineLabelBoxStyle={inlineLabelBoxStyle}
                            labelLines={[tr('mapPoolEditor.winner')]}
                            value={mapInfo.winner || ''}
                            onChange={e => updateMap(idx, 'winner', e.target.value)}
                          >
                            {winnerOptions}
                          </InlineSelect>
                        )}

                        {!isDense && (
                          <button
                            style={{ ...ui.outlineBtn, minHeight: stepButtonHeight, height: stepButtonHeight, whiteSpace: 'nowrap' }}
                            onClick={() => setExpandedBanIndex(isExpanded ? null : idx)}
                          >
                            {isExpanded ? tr('mapPoolEditor.close') : tr('mapPoolEditor.ban')}
                          </button>
                        )}
                      </>
                    )}

                    {!ultraGrid && isDense && (
                      <div style={{ gridColumn: '1 / -1', display: 'grid', gap: rowGap, gridTemplateColumns: '1fr 1fr 1fr' }}>
                        <InlineSelect
                          density={density}
                          rowGap={rowGap}
                          consoleSelectStyle={consoleSelectStyle}
                          inlineLabelBoxStyle={inlineLabelBoxStyle}
                          labelLines={[tr('mapPoolEditor.pick')]}
                          value={mapInfo.picker || ''}
                          onChange={e => updateMap(idx, 'picker', e.target.value)}
                        >
                          {pickerOptions}
                        </InlineSelect>

                        <InlineSelect
                          density={density}
                          rowGap={rowGap}
                          consoleSelectStyle={consoleSelectStyle}
                          inlineLabelBoxStyle={inlineLabelBoxStyle}
                          labelLines={[tr('mapPoolEditor.winner')]}
                          value={mapInfo.winner || ''}
                          onChange={e => updateMap(idx, 'winner', e.target.value)}
                        >
                          {winnerOptions}
                        </InlineSelect>

                        <button
                          style={{ ...ui.outlineBtn, minHeight: stepButtonHeight, height: stepButtonHeight, whiteSpace: 'nowrap' }}
                          onClick={() => setExpandedBanIndex(isExpanded ? null : idx)}
                        >
                          {isExpanded ? tr('mapPoolEditor.close') : tr('mapPoolEditor.ban')}
                        </button>
                      </div>
                    )}
                  </div>

                  {isExpanded && (
                    <div
                      style={{
                        display: 'grid',
                        gap: rowGap + 2,
                        padding: density === 'spacious' ? '14px' : '12px',
                        border: `1px solid ${COLORS.lineStrong}`,
                        background: 'rgba(255,77,77,0.06)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                        <div style={{ fontSize: '11px', color: '#ff9a9a', fontWeight: 900, letterSpacing: '1.2px', textTransform: 'uppercase' }}>
                          {tr('mapPoolEditor.map')} {idx + 1} {tr('mapPoolEditor.ban')}
                        </div>
                        
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button
                            style={{ ...ui.outlineBtn, minHeight: stepButtonHeight, height: stepButtonHeight, whiteSpace: 'nowrap', color: mapInfo.banOrderMode === 'B_FIRST' ? '#a5a5a5' : COLORS.yellow, borderColor: mapInfo.banOrderMode === 'B_FIRST' ? 'rgba(255,255,255,0.14)' : COLORS.yellow }}
                            onClick={() => updateMap(idx, 'banOrderMode', mapInfo.banOrderMode === 'B_FIRST' ? 'A_FIRST' : 'B_FIRST')}
                          >
                            {tr('mapPoolEditor.order')} {mapInfo.banOrderMode === 'B_FIRST' ? tr('mapPoolEditor.bFirst') : tr('mapPoolEditor.aFirst')}
                          </button>
                          
                          <button
                            style={{ ...ui.outlineBtn, minHeight: stepButtonHeight, height: stepButtonHeight, whiteSpace: 'nowrap', color: mapInfo.swapSides ? COLORS.yellow : '#a5a5a5', borderColor: mapInfo.swapSides ? COLORS.yellow : 'rgba(255,255,255,0.14)' }}
                            onClick={() => updateMap(idx, 'swapSides', !mapInfo.swapSides)}
                          >
                            {tr('mapPoolEditor.swap')} {mapInfo.swapSides ? tr('mapPoolEditor.on') : tr('mapPoolEditor.off')}
                          </button>

                          <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.15)', margin: '0 2px' }} />

                          <button
                            style={{ ...ui.outlineBtn, minHeight: stepButtonHeight, height: stepButtonHeight, whiteSpace: 'nowrap' }}
                            onClick={() => useLiveBansForMap(idx)}
                          >
                            {tr('mapPoolEditor.useLiveBans')}
                          </button>
                          <button
                            style={{ ...ui.outlineBtn, minHeight: stepButtonHeight, height: stepButtonHeight, whiteSpace: 'nowrap', color: '#ff7d7d', borderColor: 'rgba(255,77,77,0.3)', backgroundColor: 'rgba(255,77,77,0.08)' }}
                            onClick={() => clearMapBans(idx)}
                          >
                            {tr('mapPoolEditor.clearBans')}
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: banPanelGrid, gap: rowGap + 2 }}>
                        <div style={{ ...panelBase, padding: t.panelPadding, display: 'grid', gap: rowGap }}>
                          <div style={{ fontSize: '11px', color: COLORS.white, fontWeight: 900, letterSpacing: '1.2px', textTransform: 'uppercase' }}>
                            {tr('mapPoolEditor.teamBan', { team: matchData.teamShortA || matchData.teamA || 'TEAM A' })}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: rowGap }}>
                            <select
                              style={consoleSelectStyle}
                              value={parsedBanA.role}
                              onChange={e => updateMapBanEntry(idx, 'A', e.target.value, 'tbd')}
                            >
                              {HERO_ROLE_OPTIONS.map(role => <option key={role} value={role}>{tr(`mapPoolEditor.${role === 'damage' ? 'damage' : role}`) || role.toUpperCase()}</option>)}
                            </select>

                            <select
                              style={consoleSelectStyle}
                              value={parsedBanA.hero}
                              onChange={e => updateMapBanEntry(idx, 'A', parsedBanA.role, e.target.value)}
                            >
                              <option value="tbd">{tr('mapPoolEditor.tbd')}</option>
                              {(HERO_DATA?.[parsedBanA.role] || []).map(hero => <option key={hero} value={hero}>{hero}</option>)}
                            </select>
                          </div>
                        </div>

                        <div style={{ ...panelBase, padding: t.panelPadding, display: 'grid', gap: rowGap }}>
                          <div style={{ fontSize: '11px', color: COLORS.white, fontWeight: 900, letterSpacing: '1.2px', textTransform: 'uppercase' }}>
                            {tr('mapPoolEditor.teamBan', { team: matchData.teamShortB || matchData.teamB || 'TEAM B' })}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: rowGap }}>
                            <select
                              style={consoleSelectStyle}
                              value={parsedBanB.role}
                              onChange={e => updateMapBanEntry(idx, 'B', e.target.value, 'tbd')}
                            >
                              {HERO_ROLE_OPTIONS.map(role => <option key={role} value={role}>{tr(`mapPoolEditor.${role === 'damage' ? 'damage' : role}`) || role.toUpperCase()}</option>)}
                            </select>

                            <select
                              style={consoleSelectStyle}
                              value={parsedBanB.hero}
                              onChange={e => updateMapBanEntry(idx, 'B', parsedBanB.role, e.target.value)}
                            >
                              <option value="tbd">{tr('mapPoolEditor.tbd')}</option>
                              {(HERO_DATA?.[parsedBanB.role] || []).map(hero => <option key={hero} value={hero}>{hero}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {mapEditTab === 'OVERVIEW' && (
          <div style={{ display: 'grid', gap: rowGap + 2, height: '100%', alignContent: 'start' }}>
            <div style={{ display: 'grid', gridTemplateColumns: compactGrid ? '1fr' : '1fr 1fr', gap: rowGap + 2, alignItems: 'stretch' }}>
              {activeOverviewTypes.map(type => {
                const allOptions = getAllMapsForType(type);
                const slots = eventMapPool[type] || [];
                const slotCount = slots.length || 0;

                return (
                  <div key={type} style={{ ...panelBase, padding: t.panelPadding, borderLeft: `3px solid ${COLORS.yellow}`, display: 'grid', gap: rowGap + 2, height: '100%', alignContent: 'start' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: rowGap, alignItems: 'start', paddingBottom: rowGap, borderBottom: `1px solid ${COLORS.line}` }}>
                      <div>
                        <div style={{ color: COLORS.white, fontSize: density === 'spacious' ? '13px' : '12px', fontWeight: 900, lineHeight: 1.2, textTransform: 'uppercase' }}>
                          {tr(`mapPoolEditor.mapTypes.${type}`) || type}
                        </div>
                        <div style={{ color: COLORS.faintWhite, fontSize: '10px', marginTop: '4px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                          {slotCount} {tr('mapPoolEditor.slots')}
                        </div>
                      </div>
                      <button
                        style={{ ...ui.outlineBtn, minHeight: stepButtonHeight, height: stepButtonHeight, boxSizing: 'border-box' }}
                        onClick={() => toggleMapTypeEnabled(type, false)}
                      >
                        {tr('mapPoolEditor.disable')}
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: slotCount <= 2 ? 'repeat(2, minmax(0,1fr))' : 'repeat(3, minmax(0,1fr))', gap: rowGap }}>
                      {slots.map((mapName, idx) => (
                        <select key={`${type}-${idx}`} style={consoleSelectStyle} value={mapName} onChange={e => updateEventPoolSlot(type, idx, e.target.value)}>
                          {allOptions.map(name => <option key={name} value={name}>{name}</option>)}
                        </select>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ ...panelBase, padding: t.panelPadding, border: `1px dashed ${COLORS.lineStrong}`, display: 'grid', gap: rowGap }}>
              <div style={{ color: COLORS.faintWhite, fontSize: '10px', fontWeight: 900, letterSpacing: '1.4px', textTransform: 'uppercase' }}>
                {tr('mapPoolEditor.disabledMapTypes')}
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {disabledOverviewTypes.map(type => (
                  <button
                    key={type}
                    style={{ ...ui.softOutlineBtn, minHeight: stepButtonHeight, height: stepButtonHeight, boxSizing: 'border-box' }}
                    onClick={() => toggleMapTypeEnabled(type, true)}
                  >
                    {tr('mapPoolEditor.enableMap', { type: tr(`mapPoolEditor.mapTypes.${type}`) || type })}
                  </button>
                ))}
                {disabledOverviewTypes.length === 0 && <div style={{ color: COLORS.faintWhite, fontSize: '11px' }}>{tr('mapPoolEditor.noDisabled')}</div>}
              </div>
            </div>
          </div>
        )}
      </ShellPanel>
    </div>
  );
}