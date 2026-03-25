import React from 'react';
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

function CoverModePanel({ coverMode, setField, ui, density }) {
  return (
    <ShellPanel
      title="Cover Mode"
      accent
      density={density}
      bodyStyle={{ padding: density === 'spacious' ? '14px' : '12px' }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <ToggleBtn active={coverMode === 'GENERIC'} onClick={() => setField('coverMode', 'GENERIC')} ui={ui}>
          Generic
        </ToggleBtn>
        <ToggleBtn active={coverMode === 'MATCH'} onClick={() => setField('coverMode', 'MATCH')} ui={ui}>
          Match
        </ToggleBtn>
      </div>
      <SectionHint
        density={density}
        text="GENERIC 用于通用直播间封面；MATCH 用于具体对阵封面。"
        style={{ marginTop: '10px' }}
      />
    </ShellPanel>
  );
}

function BrandingPanel({ matchData, setField, ui, density }) {
  return (
    <ShellPanel
      title="Branding"
      accent
      density={density}
      bodyStyle={{ padding: density === 'spacious' ? '14px' : '12px' }}
    >
      <div style={{ display: 'grid', gap: '12px' }}>
        <div style={rowStyle}>
          <Field label="Main Title">
            <TextInput value={matchData.titleMain} onChange={v => setField('titleMain', v)} placeholder="FRIES CUP" ui={ui} />
          </Field>
          <Field label="Year">
            <TextInput value={matchData.topLeftYear} onChange={v => setField('topLeftYear', v)} placeholder="2026" ui={ui} />
          </Field>
        </div>

        <div style={rowStyle}>
          <Field label="Sub Title EN">
            <TextInput value={matchData.titleSubEn} onChange={v => setField('titleSubEn', v)} placeholder="ACADEMY" ui={ui} />
          </Field>
          <Field label="Sub Title CN">
            <TextInput value={matchData.titleSubCn} onChange={v => setField('titleSubCn', v)} placeholder="薯条杯学院赛" ui={ui} />
          </Field>
        </div>

        <SectionHint
          density={density}
          text="顶栏左侧标签固定为 FCUP，右上状态文案使用场景默认值，不在这里单独编辑。"
        />
      </div>
    </ShellPanel>
  );
}

function GenericPanel({ matchData, setField, ui, density }) {
  return (
    <ShellPanel
      title="Generic Cover"
      accent
      density={density}
      bodyStyle={{ padding: density === 'spacious' ? '14px' : '12px' }}
    >
      <div style={{ display: 'grid', gap: '12px' }}>
        <div style={rowStyle}>
          <Field label="Phase Main EN">
            <TextInput
              value={matchData.phaseMainEn}
              onChange={v => setField('phaseMainEn', v)}
              placeholder="OPEN QUALIFIER"
              ui={ui}
            />
          </Field>
          <Field label="Phase Main CN">
            <TextInput
              value={matchData.phaseMainCn}
              onChange={v => setField('phaseMainCn', v)}
              placeholder="公开预选赛"
              ui={ui}
            />
          </Field>
        </div>

        <div style={rowStyle}>
          <Field label="Caster Label EN">
            <TextInput
              value={matchData.coverCasterLabelEn}
              onChange={v => setField('coverCasterLabelEn', v)}
              placeholder="CASTERS"
              ui={ui}
            />
          </Field>
          <Field label="Caster Label CN">
            <TextInput
              value={matchData.coverCasterLabelCn}
              onChange={v => setField('coverCasterLabelCn', v)}
              placeholder="解说"
              ui={ui}
            />
          </Field>
        </div>

        <div style={rowStyle}>
          <Field label="Admin Label EN">
            <TextInput
              value={matchData.coverAdminLabelEn}
              onChange={v => setField('coverAdminLabelEn', v)}
              placeholder="ADMIN"
              ui={ui}
            />
          </Field>
          <Field label="Admin Label CN">
            <TextInput
              value={matchData.coverAdminLabelCn}
              onChange={v => setField('coverAdminLabelCn', v)}
              placeholder="赛管"
              ui={ui}
            />
          </Field>
        </div>

        <div style={rowStyle}>
          <Field label="Cover Casters">
            <TextInput
              value={matchData.coverCasters}
              onChange={v => setField('coverCasters', v)}
              placeholder="AAA / BBB"
              ui={ui}
            />
          </Field>
          <Field label="Cover Admins">
            <TextInput
              value={matchData.coverAdmins}
              onChange={v => setField('coverAdmins', v)}
              placeholder="CCC / DDD"
              ui={ui}
            />
          </Field>
        </div>

        <SectionHint
          density={density}
          text="当前通用封面只显示公开预选赛这一层，不显示瑞士轮 / LCQ 等子阶段。"
        />
      </div>
    </ShellPanel>
  );
}

function MatchPanel({ matchData, updateData, setField, ui, density, teamOptions }) {
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
      title="Match Cover"
      accent
      density={density}
      bodyStyle={{ padding: density === 'spacious' ? '14px' : '12px' }}
    >
      <div style={{ display: 'grid', gap: '12px' }}>
        <div style={rowStyle}>
          <Field label="Preset for Team A">
            <SelectInput
              value={matchData.coverTeamPresetA || ''}
              onChange={v => applyTeamPreset('A', v)}
              ui={ui}
            >
              <option value="">Select Team A Preset</option>
              {teamOptions.map(option => (
                <option key={`A-${option.key}`} value={option.key}>
                  {option.label}
                </option>
              ))}
            </SelectInput>
          </Field>

          <Field label="Preset for Team B">
            <SelectInput
              value={matchData.coverTeamPresetB || ''}
              onChange={v => applyTeamPreset('B', v)}
              ui={ui}
            >
              <option value="">Select Team B Preset</option>
              {teamOptions.map(option => (
                <option key={`B-${option.key}`} value={option.key}>
                  {option.label}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>

        <div style={rowStyle}>
          <Field label="Team A">
            <TextInput value={matchData.teamA} onChange={v => setField('teamA', v)} placeholder="TEAM A" ui={ui} />
          </Field>
          <Field label="Team B">
            <TextInput value={matchData.teamB} onChange={v => setField('teamB', v)} placeholder="TEAM B" ui={ui} />
          </Field>
        </div>

        <div style={rowStyle}>
          <Field label="Logo A">
            <SelectInput value={logoAValue} onChange={v => setField('logoA', v)} ui={ui}>
              {!LOGO_LIST.some(l => l.path === logoAValue) && logoAValue ? (
                <option value={logoAValue}>{logoAValue}</option>
              ) : null}
              <option value="">Select Logo A</option>
              {LOGO_LIST.map(l => (
                <option key={`logo-a-${l.path}`} value={l.path}>
                  {l.name}
                </option>
              ))}
            </SelectInput>
          </Field>

          <Field label="Logo B">
            <SelectInput value={logoBValue} onChange={v => setField('logoB', v)} ui={ui}>
              {!LOGO_LIST.some(l => l.path === logoBValue) && logoBValue ? (
                <option value={logoBValue}>{logoBValue}</option>
              ) : null}
              <option value="">Select Logo B</option>
              {LOGO_LIST.map(l => (
                <option key={`logo-b-${l.path}`} value={l.path}>
                  {l.name}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>

        <div style={rowStyle}>
          <Field label="Round">
            <TextInput value={matchData.roundLabel} onChange={v => setField('roundLabel', v)} placeholder="ROUND 01" ui={ui} />
          </Field>
          <Field label="Stage">
            <TextInput value={matchData.matchStage} onChange={v => setField('matchStage', v)} placeholder="OPEN QUALIFIER" ui={ui} />
          </Field>
        </div>

        <div style={rowStyle}>
          <Field label="Time">
            <TextInput value={matchData.matchTime} onChange={v => setField('matchTime', v)} placeholder="19:30 CST" ui={ui} />
          </Field>
          <Field label="Format">
            <TextInput value={matchData.matchFormat} onChange={v => setField('matchFormat', v)} placeholder="BO3" ui={ui} />
          </Field>
        </div>

        <div style={rowStyle}>
          <Field label="Caster Label">
            <TextInput value={matchData.casterLabel} onChange={v => setField('casterLabel', v)} placeholder="CASTER" ui={ui} />
          </Field>
          <Field label="Caster Names">
            <TextInput value={matchData.casterNames} onChange={v => setField('casterNames', v)} placeholder="A / B" ui={ui} />
          </Field>
        </div>

        <SectionHint
          density={density}
          text={
            teamOptions.length
              ? '选择队伍预设后会自动带入队名和 logo。LOGO 也可以单独从已有 LOGO_LIST 中下拉选择。'
              : '当前没有可用队伍预设。请先在 TEAM DB 导入 rosterPresetLibrary，或在默认数据里配置 teamPresets。'
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
  blockGap = 12
}) {
  const ui = createEditorUi(densityTokens, density);
  const coverMode = (matchData.coverMode || 'GENERIC').toUpperCase();
  const setField = (key, value) => updateData({ ...matchData, [key]: value });

  const teamOptions = buildTeamOptions(matchData);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '420px minmax(0, 1fr)',
        gap: blockGap,
        alignItems: 'start'
      }}
    >
      <div style={{ display: 'grid', gap: blockGap }}>
        <CoverModePanel coverMode={coverMode} setField={setField} ui={ui} density={density} />
        <BrandingPanel matchData={matchData} setField={setField} ui={ui} density={density} />
      </div>

      {coverMode === 'GENERIC' ? (
        <GenericPanel matchData={matchData} setField={setField} ui={ui} density={density} />
      ) : (
        <MatchPanel
          matchData={matchData}
          updateData={updateData}
          setField={setField}
          ui={ui}
          density={density}
          teamOptions={teamOptions}
        />
      )}
    </div>
  );
}