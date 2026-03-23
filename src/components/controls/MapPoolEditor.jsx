import React, { useMemo, useState } from 'react';
import { useMatchContext } from '../../contexts/MatchContext';
import { ShellPanel, Field, SectionHint, TogglePill } from '../common/SharedUI';
import { COLORS, panelBase } from '../../constants/styles';
import { MAP_DATA } from '../../constants/gameData';
import { createEditorUi } from '../../utils/editorUi';

const CANONICAL_MAP_TYPES = ['CONTROL', 'ESCORT', 'HYBRID', 'PUSH', 'FLASHPOINT', 'CLASH'];

const MAP_TYPE_META = {
  CONTROL: { label: 'CONTROL' },
  ESCORT: { label: 'ESCORT' },
  HYBRID: { label: 'HYBRID' },
  PUSH: { label: 'PUSH' },
  FLASHPOINT: { label: 'FLASHPOINT' },
  CLASH: { label: 'CLASH' }
};

const DEFAULT_EVENT_MAP_POOL = {
  CONTROL: ['ILIOS', 'LIJIANG TOWER', 'BUSAN'],
  ESCORT: ['DORADO', 'ROUTE 66', 'HAVANA'],
  HYBRID: ["KING'S ROW", 'EICHENWALDE', 'BLIZZARD WORLD'],
  PUSH: ['COLOSSEO', 'NEW QUEEN STREET'],
  FLASHPOINT: ['SURAVASA', 'NEW JUNK CITY', 'ATLIS'],
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

export default function MapPoolEditor({
  density = 'standard',
  densityTokens,
  isDense = false,
  isUltra = false
}) {
  // 🌟 加入了 updateWithHistory 来防手抖
  const { matchData, updateData, updateWithHistory } = useMatchContext();
  const [mapEditTab, setMapEditTab] = useState('MATCH');

  const t = densityTokens || {
    blockGap: 10,
    panelPadding: '12px 14px',
    buttonFontSize: 12,
    buttonPadding: '9px 12px'
  };

  const ui = createEditorUi(densityTokens, density);

  const compactGrid = isDense;
  const ultraGrid = isUltra;
  const rowGap = density === 'spacious' ? 10 : 8;
  const stepButtonHeight = density === 'spacious' ? '40px' : '36px';

  const formatLength =
    matchData.matchFormat === 'BO7' ? 7 :
    matchData.matchFormat === 'BO5' ? 5 : 3;

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
      merged[normalizeMapTypeKey(key)] = dedupeList(value);
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
    const pool = dedupeList(eventMapPool[canonical] || []);
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
      winner: raw.winner || ''
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
    padding: '0 6px'
  };

  const consoleSelectStyle = {
    ...ui.select,
    minHeight: stepButtonHeight,
    height: stepButtonHeight,
    boxSizing: 'border-box',
    minWidth: 0,
    width: '100%',
    paddingLeft: '14px',
    paddingRight: '40px',
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
    outline: 'none' // 防止浏览器焦点默认高亮导致样式突兀
  };

  // 🌟 将所有可能造成破坏性修改的操作加入 History

  const setCurrentMapSafe = nextMap => {
    const clamped = Math.max(1, Math.min(formatLength, nextMap));
    updateWithHistory(`Change Current Map to ${clamped}`, { ...matchData, currentMap: clamped });
  };

  const updateMap = (index, key, value) => {
    const newLineup = [...displayMaps];
    const prev = { ...newLineup[index] };

    if (key === 'type') {
      const nextType = normalizeMapTypeKey(value);
      const nextPool = getPoolMapsForType(nextType);
      newLineup[index] = {
        ...prev,
        type: nextType,
        name: nextPool[0] || '',
        winner: prev.winner || ''
      };
    } else {
      newLineup[index] = { ...prev, [key]: value };
    }

    updateWithHistory(`Update Map ${index + 1} ${key}`, { ...matchData, mapLineup: newLineup });
  };

  const updateEventPoolSlot = (type, slotIndex, mapName) => {
    const canonical = normalizeMapTypeKey(type);
    const nextPool = { ...eventMapPool, [canonical]: [...(eventMapPool[canonical] || [])] };
    nextPool[canonical][slotIndex] = mapName;

    const normalizedPool = {};
    CANONICAL_MAP_TYPES.forEach(k => {
      normalizedPool[k] = dedupeList(nextPool[k] || []);
    });

    const nextLineup = displayMaps.map(map => {
      const mapType = normalizeMapTypeKey(map.type);
      if (mapType !== canonical) return map;
      const validNames = normalizedPool[canonical] || [];
      return {
        ...map,
        name: validNames.includes(map.name) ? map.name : (validNames[0] || '')
      };
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
      enabledMapTypes: {
        ...enabledMapTypes,
        [canonical]: enabled
      }
    });
  };

  const renderInlineSelect = ({ labelLines, value, onChange, children, selectStyle }) => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: density === 'spacious' ? '96px minmax(0,1fr)' : '90px minmax(0,1fr)',
        gap: rowGap,
        alignItems: 'stretch',
        minWidth: 0
      }}
    >
      <div style={inlineLabelBoxStyle}>
        {Array.isArray(labelLines)
          ? labelLines.map((line, idx) => <div key={idx}>{line}</div>)
          : <div>{labelLines}</div>}
      </div>

      <select
        style={{
          ...consoleSelectStyle,
          ...selectStyle
        }}
        value={value}
        onChange={onChange}
      >
        {children}
      </select>
    </div>
  );

  const winnerOptions = [
    <option key="" value="">No Result</option>,
    <option key="A" value="A">{matchData.teamA || 'Team A'}</option>,
    <option key="B" value="B">{matchData.teamB || 'Team B'}</option>
  ];

  const activeOverviewTypes = CANONICAL_MAP_TYPES.filter(type => enabledMapTypes[type] !== false && eventMapPool[type]?.length);
  const disabledOverviewTypes = CANONICAL_MAP_TYPES.filter(type => enabledMapTypes[type] === false);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: compactGrid ? '1fr' : density === 'spacious' ? '380px minmax(0,1fr)' : '350px minmax(0,1fr)',
        gap: t.blockGap,
        alignItems: 'stretch'
      }}
    >
      <ShellPanel title="Global Map Settings" accent density={density}>
        <div
          style={{
            display: 'grid',
            gap: rowGap + 2,
            height: '100%',
            alignContent: 'start'
          }}
        >
          <Field label="Event Info" density={density}>
            <input
              style={{
                ...ui.input,
                minHeight: stepButtonHeight,
                height: stepButtonHeight,
                boxSizing: 'border-box'
              }}
              value={matchData.info || ''}
              onChange={e => updateData({ ...matchData, info: e.target.value })}
              placeholder="Enter match or event info"
            />
          </Field>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: ultraGrid ? '1fr' : '1fr 1fr',
              gap: rowGap,
              alignItems: 'stretch'
            }}
          >
            <Field label="Match Format" density={density}>
              <select
                style={consoleSelectStyle}
                value={matchData.matchFormat || 'BO3'}
                onChange={e =>
                  // 🌟 核心赛制改变，必须进入历史记录
                  updateWithHistory(`Change Format to ${e.target.value}`, {
                    ...matchData,
                    matchFormat: e.target.value,
                    currentMap: 1
                  })
                }
              >
                <option value="BO3">BO3</option>
                <option value="BO5">BO5</option>
                <option value="BO7">BO7</option>
              </select>
            </Field>

            <Field label="Current Map" density={density}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1.35fr 1fr',
                  gap: rowGap,
                  alignItems: 'stretch'
                }}
              >
                <button
                  style={{ ...ui.outlineBtn, ...stepBtnBase }}
                  onClick={() => setCurrentMapSafe((matchData.currentMap || 1) - 1)}
                >
                  −
                </button>

                <div
                  style={{
                    ...ui.input,
                    minHeight: stepButtonHeight,
                    height: stepButtonHeight,
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    color: COLORS.yellow,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    boxSizing: 'border-box'
                  }}
                >
                  {matchData.currentMap || 1}
                </div>

                <button
                  style={{ ...ui.actionBtn, ...stepBtnBase }}
                  onClick={() => setCurrentMapSafe((matchData.currentMap || 1) + 1)}
                >
                  +
                </button>
              </div>
            </Field>
          </div>

          <div
            style={{
              ...panelBase,
              padding: t.panelPadding,
              display: 'grid',
              gap: rowGap + 2,
              alignContent: 'start',
              minHeight: density === 'spacious' ? '220px' : '200px'
            }}
          >
            <div
              style={{
                fontSize: '11px',
                color: COLORS.white,
                fontWeight: 900,
                letterSpacing: '1.2px',
                textTransform: 'uppercase'
              }}
            >
              Map Pool Output
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                backgroundColor: '#111',
                border: `1px solid ${COLORS.line}`
              }}
            >
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
                Match Sequence
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
                Full Pool
              </button>
            </div>

            <TogglePill
              density={density}
              active={!!matchData.showOverviewCurrent}
              onClick={() => updateData({ ...matchData, showOverviewCurrent: !matchData.showOverviewCurrent })}
              onText="Highlight On"
              offText="Highlight Off"
              onColor={COLORS.yellow}
              offColor="#555"
            />

            <SectionHint
              text="Overview mode can highlight the current map. Match Sequence follows the BO3 / BO5 / BO7 flow."
              density={density}
            />
          </div>
        </div>
      </ShellPanel>

      <ShellPanel
        title="Map Data Editor"
        density={density}
        right={
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button style={tabBtnStyle(mapEditTab === 'MATCH')} onClick={() => setMapEditTab('MATCH')}>
              Match Sequence
            </button>
            <button style={tabBtnStyle(mapEditTab === 'OVERVIEW')} onClick={() => setMapEditTab('OVERVIEW')}>
              Full Pool
            </button>
          </div>
        }
        accent
      >
        {mapEditTab === 'MATCH' && (
          <div style={{ display: 'grid', gap: rowGap + 2 }}>
            {displayMaps.map((mapInfo, idx) => {
              const isCurrent = (matchData.currentMap || 1) === idx + 1;
              const mapNameOptions = getPoolMapsForType(mapInfo.type);

              return (
                <div
                  key={idx}
                  style={{
                    ...panelBase,
                    padding: t.panelPadding,
                    display: 'grid',
                    gridTemplateColumns: ultraGrid
                      ? '1fr'
                      : isDense
                        ? 'minmax(78px,auto) 1fr'
                        : density === 'spacious'
                          ? 'minmax(90px,auto) 1.55fr 1.85fr 1.2fr'
                          : 'minmax(84px,auto) 1.45fr 1.75fr 1.15fr',
                    gap: rowGap,
                    alignItems: 'center',
                    borderLeft: `3px solid ${isCurrent ? COLORS.yellow : 'transparent'}`,
                    backgroundColor: isCurrent ? 'rgba(244,195,32,0.05)' : undefined,
                    boxShadow: isCurrent ? 'inset 0 0 0 1px rgba(244,195,32,0.10)' : undefined
                  }}
                >
                  <div style={{ paddingBottom: 0, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: density === 'spacious' ? '15px' : '14px',
                        fontWeight: 900,
                        color: isCurrent ? COLORS.yellow : COLORS.softWhite,
                        letterSpacing: '0.06em'
                      }}
                    >
                      MAP {idx + 1}
                    </div>

                    <div
                      style={{
                        fontSize: '10px',
                        fontWeight: 900,
                        color: isCurrent ? COLORS.yellow : COLORS.faintWhite,
                        marginTop: '4px',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase'
                      }}
                    >
                      {isCurrent ? 'Current' : 'Ready'}
                    </div>
                  </div>

                  {ultraGrid ? (
                    <div
                      style={{
                        display: 'grid',
                        gap: rowGap,
                        gridTemplateColumns: '1.15fr 1.45fr 1.05fr',
                        minWidth: 0
                      }}
                    >
                      {renderInlineSelect({
                        labelLines: ['MAP', 'TYPE'],
                        value: mapInfo.type,
                        onChange: e => updateMap(idx, 'type', e.target.value),
                        children: CANONICAL_MAP_TYPES.filter(type => enabledMapTypes[type] !== false).map(type => (
                          <option key={type} value={type}>{MAP_TYPE_META[type]?.label || type}</option>
                        ))
                      })}

                      {renderInlineSelect({
                        labelLines: ['MAP', 'NAME'],
                        value: mapInfo.name,
                        onChange: e => updateMap(idx, 'name', e.target.value),
                        children: mapNameOptions.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))
                      })}

                      {renderInlineSelect({
                        labelLines: ['WINNER'],
                        value: mapInfo.winner || '',
                        onChange: e => updateMap(idx, 'winner', e.target.value),
                        children: winnerOptions
                      })}
                    </div>
                  ) : (
                    <>
                      {renderInlineSelect({
                        labelLines: ['MAP', 'TYPE'],
                        value: mapInfo.type,
                        onChange: e => updateMap(idx, 'type', e.target.value),
                        children: CANONICAL_MAP_TYPES.filter(type => enabledMapTypes[type] !== false).map(type => (
                          <option key={type} value={type}>{MAP_TYPE_META[type]?.label || type}</option>
                        ))
                      })}

                      {renderInlineSelect({
                        labelLines: ['MAP', 'NAME'],
                        value: mapInfo.name,
                        onChange: e => updateMap(idx, 'name', e.target.value),
                        children: mapNameOptions.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))
                      })}

                      {!isDense && renderInlineSelect({
                        labelLines: ['WINNER'],
                        value: mapInfo.winner || '',
                        onChange: e => updateMap(idx, 'winner', e.target.value),
                        children: winnerOptions
                      })}
                    </>
                  )}

                  {!ultraGrid && isDense && (
                    <div style={{ gridColumn: '1 / -1', display: 'grid', gap: rowGap }}>
                      {renderInlineSelect({
                        labelLines: ['WINNER'],
                        value: mapInfo.winner || '',
                        onChange: e => updateMap(idx, 'winner', e.target.value),
                        children: winnerOptions
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {mapEditTab === 'OVERVIEW' && (
          <div style={{ display: 'grid', gap: rowGap + 2, height: '100%', alignContent: 'start' }}>
            <SectionHint
              text="Configure the event-wide pool here. Match Sequence map names will only use the maps selected below."
              density={density}
            />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: compactGrid ? '1fr' : '1fr 1fr',
                gap: rowGap + 2,
                alignItems: 'stretch'
              }}
            >
              {activeOverviewTypes.map(type => {
                const allOptions = getAllMapsForType(type);
                const slots = eventMapPool[type] || [];
                const slotCount = slots.length || 0;

                return (
                  <div
                    key={type}
                    style={{
                      ...panelBase,
                      padding: t.panelPadding,
                      borderLeft: `3px solid ${COLORS.yellow}`,
                      display: 'grid',
                      gap: rowGap + 2,
                      height: '100%',
                      alignContent: 'start'
                    }}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        gap: rowGap,
                        alignItems: 'start',
                        paddingBottom: rowGap,
                        borderBottom: `1px solid ${COLORS.line}`
                      }}
                    >
                      <div>
                        <div
                          style={{
                            color: COLORS.white,
                            fontSize: density === 'spacious' ? '13px' : '12px',
                            fontWeight: 900,
                            lineHeight: 1.2,
                            textTransform: 'uppercase'
                          }}
                        >
                          {MAP_TYPE_META[type]?.label || type}
                        </div>
                        <div
                          style={{
                            color: COLORS.faintWhite,
                            fontSize: '10px',
                            marginTop: '4px',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase'
                          }}
                        >
                          {slotCount} Slots
                        </div>
                      </div>

                      <button
                        style={{
                          ...ui.outlineBtn,
                          minHeight: stepButtonHeight,
                          height: stepButtonHeight,
                          boxSizing: 'border-box'
                        }}
                        onClick={() => toggleMapTypeEnabled(type, false)}
                      >
                        Disable
                      </button>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: slotCount <= 2 ? 'repeat(2, minmax(0,1fr))' : 'repeat(3, minmax(0,1fr))',
                        gap: rowGap
                      }}
                    >
                      {slots.map((mapName, idx) => (
                        <select
                          key={`${type}-${idx}`}
                          style={consoleSelectStyle}
                          value={mapName}
                          onChange={e => updateEventPoolSlot(type, idx, e.target.value)}
                        >
                          {allOptions.map(name => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                ...panelBase,
                padding: t.panelPadding,
                border: `1px dashed ${COLORS.lineStrong}`,
                display: 'grid',
                gap: rowGap
              }}
            >
              <div
                style={{
                  color: COLORS.faintWhite,
                  fontSize: '10px',
                  fontWeight: 900,
                  letterSpacing: '1.4px',
                  textTransform: 'uppercase'
                }}
              >
                Disabled Map Types
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {disabledOverviewTypes.map(type => (
                  <button
                    key={type}
                    style={{
                      ...ui.softOutlineBtn,
                      minHeight: stepButtonHeight,
                      height: stepButtonHeight,
                      boxSizing: 'border-box'
                    }}
                    onClick={() => toggleMapTypeEnabled(type, true)}
                  >
                    Enable {MAP_TYPE_META[type]?.label || type}
                  </button>
                ))}

                {disabledOverviewTypes.length === 0 && (
                  <div style={{ color: COLORS.faintWhite, fontSize: '11px' }}>
                    No disabled map types
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </ShellPanel>
    </div>
  );
}