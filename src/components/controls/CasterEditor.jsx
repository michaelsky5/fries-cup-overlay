import React from 'react';
import { useMatchContext } from '../../contexts/MatchContext';
import { ShellPanel, Field } from '../common/SharedUI';
import { COLORS, panelBase } from '../../constants/styles';
import { createEditorUi } from '../../utils/editorUi';

export default function CasterEditor({
  density = 'standard',
  densityTokens,
  isDense = false,
  isUltra = false
}) {
  const { matchData, updateData } = useMatchContext();
  const casters = Array.isArray(matchData.casters) ? matchData.casters : [];

  const t = densityTokens || {
    blockGap: 10,
    panelPadding: '12px 14px',
    panelPaddingLg: '14px 16px',
    buttonFontSize: 12
  };

  const ui = createEditorUi(densityTokens, density);

  const rowH = density === 'spacious' ? 40 : 36;
  const gap = density === 'spacious' ? 10 : 8;
  const titleGap = density === 'spacious' ? 12 : 10;

  const compactInput = {
    ...ui.input,
    minHeight: rowH,
    height: rowH,
    boxSizing: 'border-box',
    paddingTop: 0,
    paddingBottom: 0,
    fontSize: density === 'spacious' ? '13px' : '12px'
  };

  const metaLabelStyle = {
    fontSize: '10px',
    fontWeight: 900,
    color: COLORS.faintWhite,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    lineHeight: 1
  };

  const slotTitleStyle = {
    fontSize: density === 'spacious' ? '14px' : '13px',
    fontWeight: 900,
    color: COLORS.white,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    lineHeight: 1.1
  };

  const addCaster = () => {
    if (casters.length >= 4) return alert('You can add up to 4 casters only.');
    updateData({
      ...matchData,
      casters: [
        ...casters,
        {
          id: `CASTER_${casters.length + 1}`,
          title: 'COMMENTATOR',
          label: '',
          social: '',
          avatar: ''
        }
      ]
    });
  };

  const removeCaster = idx => {
    if (casters.length <= 1) return alert('At least 1 caster must remain.');
    const next = [...casters];
    next.splice(idx, 1);
    updateData({ ...matchData, casters: next });
  };

  const updateCasterField = (idx, key, value) => {
    const next = [...casters];
    next[idx] = { ...next[idx], [key]: value };
    updateData({ ...matchData, casters: next });
  };

  const handleCasterAvatarUpload = (idx, e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return alert('Please upload an image file.');
    const reader = new FileReader();
    reader.onload = () => updateCasterField(idx, 'avatar', reader.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const clearCasterAvatar = idx => updateCasterField(idx, 'avatar', '');

  const renderAvatarThumb = caster => {
    if (caster.avatar) {
      return (
        <div
          style={{
            width: rowH,
            height: rowH,
            border: `1px solid ${COLORS.lineStrong}`,
            background: '#111',
            overflow: 'hidden',
            flexShrink: 0
          }}
        >
          <img
            src={caster.avatar}
            alt="avatar"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      );
    }

    return (
      <div
        style={{
          width: rowH,
          height: rowH,
          border: `1px solid ${COLORS.line}`,
          background: 'rgba(255,255,255,0.025)',
          color: COLORS.faintWhite,
          fontSize: '9px',
          fontWeight: 900,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        N/A
      </div>
    );
  };

  return (
    <div style={{ display: 'grid', gap: t.blockGap }}>
      <ShellPanel
        title="Caster Editor"
        accent
        density={density}
        bodyStyle={{ padding: t.panelPaddingLg }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isUltra ? '1fr' : isDense ? '1fr' : '1fr 1fr',
            gap: t.blockGap
          }}
        >
          {casters.map((caster, idx) => (
            <div
              key={idx}
              style={{
                ...panelBase,
                padding: t.panelPadding,
                display: 'grid',
                gap: gap,
                alignContent: 'start',
                borderTop: `2px solid ${COLORS.yellow}`,
                minWidth: 0
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: gap,
                  alignItems: 'start',
                  paddingBottom: gap,
                  borderBottom: `1px solid ${COLORS.line}`
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={slotTitleStyle}>Caster {idx + 1}</div>
                  <div style={{ ...metaLabelStyle, marginTop: '4px' }}>Broadcast Slot</div>
                </div>

                <button
                  style={{
                    ...ui.outlineBtn,
                    minHeight: rowH,
                    height: rowH,
                    boxSizing: 'border-box',
                    padding: density === 'spacious' ? '0 12px' : '0 10px',
                    borderColor: 'rgba(255,77,77,0.6)',
                    color: '#ff5a5a',
                    fontWeight: 900,
                    whiteSpace: 'nowrap'
                  }}
                  onClick={() => removeCaster(idx)}
                >
                  Remove
                </button>
              </div>

              <div style={{ display: 'grid', gap: gap }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isDense ? '1fr' : '1fr 1fr',
                    gap: gap
                  }}
                >
                  <Field label="Display Name" density={density}>
                    <input
                      style={compactInput}
                      value={caster.id || ''}
                      onChange={e => updateCasterField(idx, 'id', e.target.value)}
                      placeholder="e.g. Commentator"
                    />
                  </Field>

                  <Field label="Role Title" density={density}>
                    <input
                      style={compactInput}
                      value={caster.title || ''}
                      onChange={e => updateCasterField(idx, 'title', e.target.value)}
                      placeholder="e.g. Commentator"
                    />
                  </Field>
                </div>

                <Field label="Social Handle" density={density}>
                  <input
                    style={compactInput}
                    value={caster.social || ''}
                    onChange={e => updateCasterField(idx, 'social', e.target.value)}
                    placeholder="e.g. @Ghost_Official"
                  />
                </Field>

                <Field label="Avatar" density={density}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isUltra
                        ? '1fr'
                        : `${rowH}px minmax(96px,auto) minmax(0,1fr) auto`,
                      gap: gap,
                      alignItems: 'center',
                      minWidth: 0
                    }}
                  >
                    {isUltra ? (
                      <>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: `${rowH}px minmax(0,1fr)`,
                            gap: gap,
                            alignItems: 'center',
                            minWidth: 0
                          }}
                        >
                          {renderAvatarThumb(caster)}

                          <div
                            style={{
                              minHeight: rowH,
                              height: rowH,
                              border: `1px solid ${COLORS.line}`,
                              background: 'rgba(255,255,255,0.02)',
                              padding: '0 12px',
                              display: 'flex',
                              alignItems: 'center',
                              color: caster.avatar ? COLORS.softWhite : COLORS.faintWhite,
                              fontSize: density === 'spacious' ? '12px' : '11px',
                              fontWeight: 700,
                              boxSizing: 'border-box'
                            }}
                          >
                            {caster.avatar ? 'Avatar Loaded' : 'No Avatar'}
                          </div>
                        </div>

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: caster.avatar ? '1fr auto' : '1fr',
                            gap: gap
                          }}
                        >
                          <label
                            style={{
                              ...ui.actionBtn,
                              minHeight: rowH,
                              height: rowH,
                              boxSizing: 'border-box',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              textAlign: 'center',
                              fontWeight: 900,
                              width: '100%'
                            }}
                          >
                            Upload Image
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={e => handleCasterAvatarUpload(idx, e)}
                            />
                          </label>

                          {caster.avatar && (
                            <button
                              style={{
                                ...ui.outlineBtn,
                                minHeight: rowH,
                                height: rowH,
                                boxSizing: 'border-box',
                                padding: density === 'spacious' ? '0 12px' : '0 10px',
                                whiteSpace: 'nowrap'
                              }}
                              onClick={() => clearCasterAvatar(idx)}
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        {renderAvatarThumb(caster)}

                        <div
                          style={{
                            minHeight: rowH,
                            height: rowH,
                            border: `1px solid ${COLORS.line}`,
                            background: 'rgba(255,255,255,0.02)',
                            padding: '0 10px',
                            display: 'flex',
                            alignItems: 'center',
                            color: caster.avatar ? COLORS.softWhite : COLORS.faintWhite,
                            fontSize: density === 'spacious' ? '12px' : '11px',
                            fontWeight: 700,
                            boxSizing: 'border-box',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {caster.avatar ? 'Avatar Loaded' : 'No Avatar'}
                        </div>

                        <label
                          style={{
                            ...ui.actionBtn,
                            minHeight: rowH,
                            height: rowH,
                            boxSizing: 'border-box',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            textAlign: 'center',
                            fontWeight: 900,
                            width: '100%'
                          }}
                        >
                          Upload Image
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={e => handleCasterAvatarUpload(idx, e)}
                          />
                        </label>

                        {caster.avatar ? (
                          <button
                            style={{
                              ...ui.outlineBtn,
                              minHeight: rowH,
                              height: rowH,
                              boxSizing: 'border-box',
                              padding: density === 'spacious' ? '0 12px' : '0 10px',
                              whiteSpace: 'nowrap'
                            }}
                            onClick={() => clearCasterAvatar(idx)}
                          >
                            Clear
                          </button>
                        ) : (
                          <div style={{ minHeight: rowH, height: rowH }} />
                        )}
                      </>
                    )}
                  </div>
                </Field>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: t.blockGap }}>
          <button
            style={{
              ...ui.actionBtn,
              width: '100%',
              minHeight: density === 'spacious' ? '40px' : '36px',
              height: density === 'spacious' ? '40px' : '36px',
              boxSizing: 'border-box',
              fontWeight: 900
            }}
            onClick={addCaster}
          >
            + Add Caster ({casters.length}/4)
          </button>
        </div>
      </ShellPanel>
    </div>
  );
}