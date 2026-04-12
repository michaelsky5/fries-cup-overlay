import React from 'react';
// 🚀 引入 i18n
import { useTranslation } from 'react-i18next';
import { COLORS, UI } from '../../constants/styles';
import { LOGO_LIST } from '../../constants/logos';
import { createEditorUi } from '../../utils/editorUi';
import { ShellPanel, Field, SectionHint } from '../common/SharedUI';

const rowStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' };

const TextInput = ({ value, onChange, placeholder = '', ui }) => (
  <input
    value={value || ''}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    style={{ ...ui.input, width: '100%', boxSizing: 'border-box' }}
  />
);

const SelectInput = ({ value, onChange, children, ui }) => (
  <select
    value={value || ''}
    onChange={e => onChange(e.target.value)}
    style={{ ...ui.input, width: '100%', boxSizing: 'border-box', cursor: 'pointer' }}
  >
    {children}
  </select>
);

const ToggleBtn = ({ active, onClick, children, ui }) => (
  <button
    onClick={onClick}
    style={{
      ...ui.btn,
      minHeight: '38px',
      background: active ? COLORS.yellow : '#111',
      color: active ? COLORS.black : COLORS.softWhite,
      border: UI.outerFrame,
      fontWeight: 900,
      letterSpacing: '1px',
      textTransform: 'uppercase',
      cursor: 'pointer'
    }}
  >
    {children}
  </button>
);

function buildTeamOptions(matchData) {
  const map = new Map();

  const rosterLibrary = Array.isArray(matchData.rosterPresetLibrary) ? matchData.rosterPresetLibrary : [];
  rosterLibrary.forEach(team => {
    const key = String(team?.key || team?.name || '').trim();
    if (!key) return;
    const teamName = String(team?.name || team?.key || '').trim();
    const logoPath = team?.data?.logo || team?.data?.logoPath || team?.data?.teamLogo || '';
    map.set(key, {
      key,
      label: teamName && teamName !== key ? `${teamName} [${key}]` : key,
      teamName: teamName || key,
      logoPath
    });
  });

  const legacyPresets = Array.isArray(matchData.teamPresets) ? matchData.teamPresets : [];
  legacyPresets.forEach(team => {
    const key = String(team?.shortName || team?.fullName || '').trim();
    if (!key || map.has(key)) return;
    const teamName = String(team?.fullName || team?.shortName || '').trim();
    const logoPath = team?.logoPath || '';
    map.set(key, {
      key,
      label: teamName && team?.shortName ? `${teamName} [${team.shortName}]` : teamName || key,
      teamName: teamName || key,
      logoPath
    });
  });

  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
}

function ensureLogoValue(currentValue) {
  const raw = String(currentValue || '').trim();
  if (!raw) return '';
  const exists = LOGO_LIST.some(l => l.path === raw);
  return exists ? raw : raw;
}

function CoverModePanel({ coverMode, setField, ui, density, tr }) {
  return (
    <ShellPanel
      title={tr('coverEditor.coverMode')}
      accent
      density={density}
      bodyStyle={{ padding: density === 'spacious' ? '14px' : '12px' }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <ToggleBtn active={coverMode === 'GENERIC'} onClick={() => setField('coverMode', 'GENERIC')} ui={ui}>
          {tr('coverEditor.generic')}
        </ToggleBtn>
        <ToggleBtn active={coverMode === 'MATCH'} onClick={() => setField('coverMode', 'MATCH')} ui={ui}>
          {tr('coverEditor.match')}
        </ToggleBtn>
      </div>
    </ShellPanel>
  );
}

function BrandingPanel({ matchData, setField, ui, density, tr }) {
  return (
    <ShellPanel
      title={tr('coverEditor.branding')}
      accent
      density={density}
      bodyStyle={{ padding: density === 'spacious' ? '14px' : '12px' }}
    >
      <div style={{ display: 'grid', gap: '12px' }}>
        <div style={rowStyle}>
          <Field label={tr('coverEditor.mainTitle')}>
            <TextInput value={matchData.titleMain} onChange={v => setField('titleMain', v)} placeholder="FRIES CUP" ui={ui} />
          </Field>
          <Field label={tr('coverEditor.year')}>
            <TextInput value={matchData.topLeftYear} onChange={v => setField('topLeftYear', v)} placeholder="2026" ui={ui} />
          </Field>
        </div>

        <div style={rowStyle}>
          <Field label={tr('coverEditor.subTitleEn')}>
            <TextInput value={matchData.titleSubEn} onChange={v => setField('titleSubEn', v)} placeholder="ACADEMY" ui={ui} />
          </Field>
          <Field label={tr('coverEditor.subTitleCn')}>
            <TextInput value={matchData.titleSubCn} onChange={v => setField('titleSubCn', v)} placeholder="薯条杯学院赛" ui={ui} />
          </Field>
        </div>
      </div>
    </ShellPanel>
  );
}

function GenericPanel({ matchData, setField, ui, density, tr }) {
  return (
    <ShellPanel
      title={tr('coverEditor.genericCover')}
      accent
      density={density}
      bodyStyle={{ padding: density === 'spacious' ? '14px' : '12px' }}
    >
      <div style={{ display: 'grid', gap: '12px' }}>
        <div style={rowStyle}>
          <Field label={tr('coverEditor.phaseMainEn')}>
            <TextInput
              value={matchData.phaseMainEn}
              onChange={v => setField('phaseMainEn', v)}
              placeholder="OPEN QUALIFIER"
              ui={ui}
            />
          </Field>
          <Field label={tr('coverEditor.phaseMainCn')}>
            <TextInput
              value={matchData.phaseMainCn}
              onChange={v => setField('phaseMainCn', v)}
              placeholder="公开预选赛"
              ui={ui}
            />
          </Field>
        </div>

        <div style={rowStyle}>
          <Field label={tr('coverEditor.casterLabelEn')}>
            <TextInput
              value={matchData.coverCasterLabelEn}
              onChange={v => setField('coverCasterLabelEn', v)}
              placeholder="CASTERS"
              ui={ui}
            />
          </Field>
          <Field label={tr('coverEditor.casterLabelCn')}>
            <TextInput
              value={matchData.coverCasterLabelCn}
              onChange={v => setField('coverCasterLabelCn', v)}
              placeholder="解说"
              ui={ui}
            />
          </Field>
        </div>

        <div style={rowStyle}>
          <Field label={tr('coverEditor.adminLabelEn')}>
            <TextInput
              value={matchData.coverAdminLabelEn}
              onChange={v => setField('coverAdminLabelEn', v)}
              placeholder="ADMIN"
              ui={ui}
            />
          </Field>
          <Field label={tr('coverEditor.adminLabelCn')}>
            <TextInput
              value={matchData.coverAdminLabelCn}
              onChange={v => setField('coverAdminLabelCn', v)}
              placeholder="赛管"
              ui={ui}
            />
          </Field>
        </div>

        <div style={rowStyle}>
          <Field label={tr('coverEditor.coverCasters')}>
            <TextInput
              value={matchData.coverCasters}
              onChange={v => setField('coverCasters', v)}
              placeholder="AAA / BBB"
              ui={ui}
            />
          </Field>
          <Field label={tr('coverEditor.coverAdmins')}>
            <TextInput
              value={matchData.coverAdmins}
              onChange={v => setField('coverAdmins', v)}
              placeholder="CCC / DDD"
              ui={ui}
            />
          </Field>
        </div>
      </div>
    </ShellPanel>
  );
}

function MatchPanel({ matchData, updateData, setField, ui, density, teamOptions, tr }) {
  const applyTeamPreset = (side, presetKey) => {
    const preset = teamOptions.find(t => t.key === presetKey);
    const rawLogo = preset?.logoPath || '';
    const matchedLogo = LOGO_LIST.find(l => l.path === rawLogo)?.path || rawLogo || (LOGO_LIST[0]?.path || '');

    const patch = side === 'A'
      ? {
          coverTeamPresetA: presetKey,
          teamA: preset?.teamName || matchData.teamA,
          logoA: matchedLogo
        }
      : {
          coverTeamPresetB: presetKey,
          teamB: preset?.teamName || matchData.teamB,
          logoB: matchedLogo
        };

    updateData({ ...matchData, ...patch });
  };

  const logoAValue = ensureLogoValue(matchData.logoA);
  const logoBValue = ensureLogoValue(matchData.logoB);

  return (
    <ShellPanel
      title={tr('coverEditor.matchCover')}
      accent
      density={density}
      bodyStyle={{ padding: density === 'spacious' ? '14px' : '12px' }}
    >
      <div style={{ display: 'grid', gap: '12px' }}>
        <div style={rowStyle}>
          <Field label={tr('coverEditor.presetTeamA')}>
            <SelectInput
              value={matchData.coverTeamPresetA || ''}
              onChange={v => applyTeamPreset('A', v)}
              ui={ui}
            >
              <option value="">{tr('coverEditor.selectPresetA')}</option>
              {teamOptions.map(option => (
                <option key={`A-${option.key}`} value={option.key}>
                  {option.label}
                </option>
              ))}
            </SelectInput>
          </Field>

          <Field label={tr('coverEditor.presetTeamB')}>
            <SelectInput
              value={matchData.coverTeamPresetB || ''}
              onChange={v => applyTeamPreset('B', v)}
              ui={ui}
            >
              <option value="">{tr('coverEditor.selectPresetB')}</option>
              {teamOptions.map(option => (
                <option key={`B-${option.key}`} value={option.key}>
                  {option.label}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>

        <div style={rowStyle}>
          <Field label={tr('coverEditor.teamA')}>
            <TextInput value={matchData.teamA} onChange={v => setField('teamA', v)} placeholder="TEAM A" ui={ui} />
          </Field>
          <Field label={tr('coverEditor.teamB')}>
            <TextInput value={matchData.teamB} onChange={v => setField('teamB', v)} placeholder="TEAM B" ui={ui} />
          </Field>
        </div>

        <div style={rowStyle}>
          <Field label={tr('coverEditor.logoA')}>
            <SelectInput value={logoAValue} onChange={v => setField('logoA', v)} ui={ui}>
              {!LOGO_LIST.some(l => l.path === logoAValue) && logoAValue ? (
                <option value={logoAValue}>{logoAValue}</option>
              ) : null}
              <option value="">{tr('coverEditor.selectLogoA')}</option>
              {LOGO_LIST.map(l => (
                <option key={`logo-a-${l.path}`} value={l.path}>
                  {l.name}
                </option>
              ))}
            </SelectInput>
          </Field>

          <Field label={tr('coverEditor.logoB')}>
            <SelectInput value={logoBValue} onChange={v => setField('logoB', v)} ui={ui}>
              {!LOGO_LIST.some(l => l.path === logoBValue) && logoBValue ? (
                <option value={logoBValue}>{logoBValue}</option>
              ) : null}
              <option value="">{tr('coverEditor.selectLogoB')}</option>
              {LOGO_LIST.map(l => (
                <option key={`logo-b-${l.path}`} value={l.path}>
                  {l.name}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>

        <div style={rowStyle}>
          <Field label={tr('coverEditor.round')}>
            <TextInput value={matchData.roundLabel} onChange={v => setField('roundLabel', v)} placeholder="ROUND 01" ui={ui} />
          </Field>
          <Field label={tr('coverEditor.stage')}>
            <TextInput value={matchData.matchStage} onChange={v => setField('matchStage', v)} placeholder="OPEN QUALIFIER" ui={ui} />
          </Field>
        </div>

        <div style={rowStyle}>
          <Field label={tr('coverEditor.time')}>
            <TextInput value={matchData.matchTime} onChange={v => setField('matchTime', v)} placeholder="19:30 CST" ui={ui} />
          </Field>
          <Field label={tr('coverEditor.format')}>
            <TextInput value={matchData.matchFormat} onChange={v => setField('matchFormat', v)} placeholder="BO3" ui={ui} />
          </Field>
        </div>

        <div style={rowStyle}>
          <Field label={tr('coverEditor.casterLabel')}>
            <TextInput value={matchData.casterLabel} onChange={v => setField('casterLabel', v)} placeholder="CASTER" ui={ui} />
          </Field>
          <Field label={tr('coverEditor.casterNames')}>
            <TextInput value={matchData.casterNames} onChange={v => setField('casterNames', v)} placeholder="A / B" ui={ui} />
          </Field>
        </div>

        <SectionHint
          density={density}
          text={
            teamOptions.length
              ? tr('coverEditor.teamPresetHint')
              : tr('coverEditor.noPresetHint')
          }
        />
      </div>
    </ShellPanel>
  );
}

export default function CoverEditor({
  density = 'standard',
  densityTokens,
  matchData,
  updateData,
  blockGap = 12,
  onExport,      
  isExporting    
}) {
  // 🚀 初始化翻译钩子
  const { t: tr } = useTranslation();

  const ui = createEditorUi(densityTokens, density);
  const coverMode = (matchData.coverMode || 'GENERIC').toUpperCase();
  const setField = (key, value) => updateData({ ...matchData, [key]: value });

  const teamOptions = buildTeamOptions(matchData);
  // ✅ 获取当前画幅比例，默认为 16:9
  const currentRatio = matchData.aspectRatio || '16:9';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '420px minmax(0, 1fr)',
        gap: blockGap,
        alignItems: 'start'
      }}
    >
      {/* 左列：通用设置 + 导出面板 */}
      <div style={{ display: 'grid', gap: blockGap }}>
        <CoverModePanel coverMode={coverMode} setField={setField} ui={ui} density={density} tr={tr} />
        <BrandingPanel matchData={matchData} setField={setField} ui={ui} density={density} tr={tr} />

        {/* ✅ 新增的导出与画幅设置区域 */}
        {onExport && (
          <ShellPanel
            title={tr('coverEditor.exportSettings') || 'EXPORT SETTINGS'}
            accent
            density={density}
            bodyStyle={{ padding: density === 'spacious' ? '14px' : '12px', display: 'grid', gap: '12px' }}
          >
            {/* 画幅比例切换器 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <ToggleBtn active={currentRatio === '16:9'} onClick={() => setField('aspectRatio', '16:9')} ui={ui}>
                16:9 
              </ToggleBtn>
              <ToggleBtn active={currentRatio === '4:3'} onClick={() => setField('aspectRatio', '4:3')} ui={ui}>
                4:3 
              </ToggleBtn>
            </div>

            {/* 导出按钮 */}
            <button
              onClick={onExport}
              disabled={isExporting}
              style={{
                ...ui.btn,
                minHeight: '44px',
                background: COLORS.yellow,
                color: COLORS.black,
                border: UI.outerFrame,
                fontWeight: 900,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                cursor: isExporting ? 'wait' : 'pointer',
                opacity: isExporting ? 0.7 : 1,
                marginTop: '4px',
                boxShadow: isExporting ? 'none' : '0 4px 14px rgba(244,195,32,0.25)',
                transition: 'all 0.2s ease'
              }}
            >
              {isExporting ? tr('coverEditor.generating') : tr('coverEditor.exportBtn')}
            </button>
          </ShellPanel>
        )}
      </div>

      {/* 右列：对应模式的详细表单 */}
      {coverMode === 'GENERIC' ? (
        <GenericPanel matchData={matchData} setField={setField} ui={ui} density={density} tr={tr} />
      ) : (
        <MatchPanel
          matchData={matchData}
          updateData={updateData}
          setField={setField}
          ui={ui}
          density={density}
          teamOptions={teamOptions}
          tr={tr}
        />
      )}
    </div>
  );
}