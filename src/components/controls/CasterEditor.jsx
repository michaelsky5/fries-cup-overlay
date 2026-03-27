import React, { useCallback, useMemo } from 'react';
import { useMatchContext } from '../../contexts/MatchContext';
import { ShellPanel, Field } from '../common/SharedUI';
import { COLORS, panelBase } from '../../constants/styles';
import { createEditorUi } from '../../utils/editorUi';

// 如果你之前加了 imageHelper，可以保留 import。如果纯用路径法，这行甚至可以不要，我这里先帮你保留以防万一你想混用。
// import { processImageForStorage } from '../../utils/imageHelper'; 

const CasterRow = React.memo(({
  caster, idx, rowH, gap, t, ui, density, isUltra, isDense, compactInput, slotTitleStyle, metaLabelStyle,
  removeCaster, updateCasterField, handleCasterAvatarUpload, clearCasterAvatar, renderAvatarThumb
}) => {
  return (
    <div
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

        {/* 🚀 核心替换：把单纯的显示变成“路径输入框 + 上传按钮”双擎驱动 */}
        <Field label="Avatar Path or Upload" density={density}>
          {isUltra ? (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `${rowH}px minmax(0,1fr)`,
                  gap: gap,
                  alignItems: 'center',
                  minWidth: 0,
                  marginBottom: gap
                }}
              >
                {renderAvatarThumb(caster)}
                <input
                  style={{ ...compactInput, fontFamily: 'monospace', letterSpacing: '0.5px' }}
                  value={caster.avatar || ''}
                  onChange={e => updateCasterField(idx, 'avatar', e.target.value)}
                  placeholder="/assets/casters/alice.png"
                />
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
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `${rowH}px minmax(0,1fr) auto auto`,
                gap: gap,
                alignItems: 'center',
                minWidth: 0
              }}
            >
              {renderAvatarThumb(caster)}

              <input
                style={{ ...compactInput, fontFamily: 'monospace', letterSpacing: '0.5px' }}
                value={caster.avatar || ''}
                onChange={e => updateCasterField(idx, 'avatar', e.target.value)}
                placeholder="/assets/casters/alice.png"
              />

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
                  padding: density === 'spacious' ? '0 16px' : '0 12px'
                }}
              >
                Upload
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
          )}
        </Field>
      </div>
    </div>
  );
});

export default function CasterEditor({
  density = 'standard',
  densityTokens,
  isDense = false,
  isUltra = false
}) {
  const { matchData, updateData } = useMatchContext();
  const casters = Array.isArray(matchData.casters) ? matchData.casters : [];

  const t = useMemo(() => densityTokens || {
    blockGap: 10,
    panelPadding: '12px 14px',
    panelPaddingLg: '14px 16px',
    buttonFontSize: 12
  }, [densityTokens]);

  const ui = useMemo(() => createEditorUi(densityTokens, density), [densityTokens, density]);

  const rowH = density === 'spacious' ? 40 : 36;
  const gap = density === 'spacious' ? 10 : 8;

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

  const removeCaster = useCallback((idx) => {
    if (casters.length <= 1) return alert('At least 1 caster must remain.');
    
    const casterToRemove = casters[idx];
    // 清理可能存在的本地 Blob 内存泄漏
    if (casterToRemove?.avatar && casterToRemove.avatar.startsWith('blob:')) {
      URL.revokeObjectURL(casterToRemove.avatar);
    }

    const next = [...casters];
    next.splice(idx, 1);
    updateData({ ...matchData, casters: next });
  }, [casters, matchData, updateData]);

  const updateCasterField = useCallback((idx, key, value) => {
    const next = [...casters];
    next[idx] = { ...next[idx], [key]: value };
    updateData({ ...matchData, casters: next });
  }, [casters, matchData, updateData]);

  const handleCasterAvatarUpload = useCallback(async (idx, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return alert('Please upload an image file.');
    
    // 如果你没有引入 imageHelper 的 base64 压缩，这部分会走原本的 blob 逻辑。
    // 因为你现在更倾向于手填绝对路径，点 Upload 的备用逻辑就可以保持为 blob 或 base64。
    const oldAvatar = casters[idx]?.avatar;
    if (oldAvatar && oldAvatar.startsWith('blob:')) {
      URL.revokeObjectURL(oldAvatar);
    }

    const objectUrl = URL.createObjectURL(file);
    updateCasterField(idx, 'avatar', objectUrl);
    
    e.target.value = '';
  }, [casters, updateCasterField]);

  const clearCasterAvatar = useCallback((idx) => {
    const oldAvatar = casters[idx]?.avatar;
    if (oldAvatar && oldAvatar.startsWith('blob:')) {
      URL.revokeObjectURL(oldAvatar);
    }
    updateCasterField(idx, 'avatar', '');
  }, [casters, updateCasterField]);

  const renderAvatarThumb = useCallback((caster) => {
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
            // 加入 onError 保护，如果填错路径显示默认图标
            onError={(e) => {
               const fb = '/assets/logos/OW.png';
               if (!e.target.src.includes(fb)) e.target.src = fb;
               else e.target.style.display = 'none';
            }}
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
  }, [rowH]);

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
            <CasterRow
              key={idx}
              caster={caster}
              idx={idx}
              rowH={rowH}
              gap={gap}
              t={t}
              ui={ui}
              density={density}
              isUltra={isUltra}
              isDense={isDense}
              compactInput={compactInput}
              slotTitleStyle={slotTitleStyle}
              metaLabelStyle={metaLabelStyle}
              removeCaster={removeCaster}
              updateCasterField={updateCasterField}
              handleCasterAvatarUpload={handleCasterAvatarUpload}
              clearCasterAvatar={clearCasterAvatar}
              renderAvatarThumb={renderAvatarThumb}
            />
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