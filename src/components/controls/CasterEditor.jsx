import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useMatchContext } from '../../contexts/MatchContext';
import { ShellPanel, Field } from '../common/SharedUI';
import { COLORS, panelBase } from '../../constants/styles';
import { createEditorUi } from '../../utils/editorUi';
import { processImageForStorage } from '../../utils/imageHelper';

const DEFAULT_INTERVIEW_BOX = {
  teamSide: 'A',
  playerIndex: '',
  speakerMode: 'PLAYER',
  title: 'POST-MATCH INTERVIEW',
  subtitle: 'VOICE INTERVIEW',
  status: 'VOICE CONNECTED',
  manualTeamName: '',
  manualPlayerName: '',
  manualPlayerRole: ''
};

const safeText = value => String(value ?? '').trim();

const getAvatarFileName = value => {
  const text = safeText(value);
  if (!text) return '';

  try {
    const clean = text.split('?')[0].split('#')[0];
    return decodeURIComponent(clean.split('/').filter(Boolean).pop() || '');
  } catch {
    return text.split('/').filter(Boolean).pop() || '';
  }
};

const formatAvatarLabel = fileName => {
  const name = safeText(fileName).replace(/\.[^/.]+$/, '');
  if (!name) return '';
  return name.replace(/[-_]/g, ' ').toUpperCase();
};

const casterAvatarModules = import.meta.glob('../../assets/casters/*.{png,jpg,jpeg,webp,gif}', {
  eager: true,
  query: '?url',
  import: 'default'
});

const AUTO_CASTER_AVATARS = Object.entries(casterAvatarModules)
  .map(([path, url]) => {
    const fileName = path.split('/').pop() || '';
    const label = formatAvatarLabel(fileName);

    return {
      label: label || 'CASTER AVATAR',
      value: url
    };
  })
  .sort((a, b) => a.label.localeCompare(b.label));

const MANUAL_CASTER_AVATARS = [];

const CUSTOM_AVATAR_VALUE = '__CUSTOM_AVATAR__';

const isSelectableAvatarPath = value => {
  const text = safeText(value);
  if (!text) return false;
  if (text.startsWith('data:')) return false;
  if (text.startsWith('blob:')) return false;
  return true;
};

const normalizeAvatarOption = (item, idx) => {
  if (!item) return null;

  if (typeof item === 'string') {
    const value = safeText(item);
    if (!value) return null;

    return {
      label: formatAvatarLabel(getAvatarFileName(value)) || `AVATAR ${idx + 1}`,
      value
    };
  }

  const value = safeText(item.value || item.url || item.src || item.path || item.avatar);
  if (!value) return null;

  return {
    label:
      safeText(item.label || item.name || item.title || item.id) ||
      formatAvatarLabel(getAvatarFileName(value)) ||
      `AVATAR ${idx + 1}`,
    value
  };
};

const uniqueAvatarOptions = rawOptions => {
  const seen = new Set();

  return rawOptions
    .map((item, idx) => normalizeAvatarOption(item, idx))
    .filter(option => option && isSelectableAvatarPath(option.value))
    .filter(option => {
      if (seen.has(option.value)) return false;
      seen.add(option.value);
      return true;
    });
};

const getAvatarSelectValue = (avatar, avatarOptions) => {
  const value = safeText(avatar);
  if (!value) return '';
  return avatarOptions.some(option => option.value === value) ? value : CUSTOM_AVATAR_VALUE;
};

const getPlayerName = player =>
  safeText(player?.nickname) ||
  safeText(player?.battleTag) ||
  safeText(player?.id) ||
  safeText(player?.name) ||
  safeText(player?.playerName) ||
  '';

const getPlayerRole = player =>
  safeText(player?.role) ||
  safeText(player?.position) ||
  safeText(player?.playerRole) ||
  '';

const CasterRow = React.memo(({
  caster,
  idx,
  rowH,
  gap,
  ui,
  density,
  isUltra,
  isDense,
  compactInput,
  compactSelect,
  slotTitleStyle,
  metaLabelStyle,
  avatarOptions,
  removeCaster,
  updateCasterField,
  applyCasterAvatarPreset,
  handleCasterAvatarUpload,
  clearCasterAvatar,
  renderAvatarThumb,
  tr,
  tx
}) => {
  const btnH = Math.max(rowH, 34);
  const avatarSelectValue = getAvatarSelectValue(caster.avatar, avatarOptions);
  const hasPresetOptions = avatarOptions.length > 0;

  const cellLabel = {
    fontSize: '10px',
    fontWeight: 900,
    color: COLORS.faintWhite,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    marginBottom: '5px',
    lineHeight: 1
  };

  const miniBtn = {
    ...ui.outlineBtn,
    minHeight: btnH,
    height: btnH,
    boxSizing: 'border-box',
    padding: density === 'spacious' ? '0 12px' : '0 10px',
    fontSize: density === 'spacious' ? '12px' : '11px',
    fontWeight: 900,
    whiteSpace: 'nowrap'
  };

  return (
    <div
      style={{
        ...panelBase,
        padding: density === 'spacious' ? '12px 14px' : '10px 12px',
        borderLeft: `3px solid ${COLORS.yellow}`,
        minWidth: 0
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isUltra
            ? '1fr'
            : isDense
              ? '82px 1fr 1fr'
              : '86px 1fr 1fr 1fr minmax(150px,0.9fr) minmax(240px,1.55fr) auto auto auto',
          gap,
          alignItems: 'end'
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ ...slotTitleStyle, fontSize: '12px' }}>
            {tr('casterEditor.caster', { num: idx + 1 })}
          </div>
          <div style={{ ...metaLabelStyle, marginTop: '5px' }}>
            {tr('casterEditor.slot')} #{String(idx + 1).padStart(2, '0')}
          </div>
        </div>

        <Field label={tr('casterEditor.displayName')} density={density}>
          <input
            style={compactInput}
            value={caster.id || ''}
            onChange={e => updateCasterField(idx, 'id', e.target.value)}
            placeholder={tr('casterEditor.placeholderName')}
          />
        </Field>

        <Field label={tr('casterEditor.roleTitle')} density={density}>
          <input
            style={compactInput}
            value={caster.title || ''}
            onChange={e => updateCasterField(idx, 'title', e.target.value)}
            placeholder={tr('casterEditor.placeholderTitle')}
          />
        </Field>

        <Field label={tr('casterEditor.socialHandle')} density={density}>
          <input
            style={compactInput}
            value={caster.social || ''}
            onChange={e => updateCasterField(idx, 'social', e.target.value)}
            placeholder="@caster"
          />
        </Field>

        <Field label={tx('casterEditor.avatarPreset', '头像预设 / PRESET')} density={density}>
          <select
            style={{
              ...compactSelect,
              opacity: hasPresetOptions || caster.avatar ? 1 : 0.55,
              cursor: hasPresetOptions ? 'pointer' : 'default'
            }}
            value={avatarSelectValue}
            onChange={e => applyCasterAvatarPreset(idx, e.target.value)}
          >
            <option value="">
              {hasPresetOptions
                ? tx('casterEditor.chooseAvatar', '选择头像')
                : tx('casterEditor.noAvatarPreset', '暂无预设')}
            </option>

            {avatarSelectValue === CUSTOM_AVATAR_VALUE && (
              <option value={CUSTOM_AVATAR_VALUE}>
                {tx('casterEditor.customAvatar', '当前自定义')}
              </option>
            )}

            {avatarOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <div style={{ minWidth: 0 }}>
          <div style={cellLabel}>{tr('casterEditor.avatarPath')}</div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `${rowH}px minmax(0,1fr)`,
              gap,
              alignItems: 'center',
              minWidth: 0
            }}
          >
            {renderAvatarThumb(caster)}

            <input
              style={{ ...compactInput, fontFamily: 'monospace', letterSpacing: '0.3px' }}
              value={caster.avatar || ''}
              onChange={e => updateCasterField(idx, 'avatar', e.target.value)}
              placeholder="/assets/casters/name.png"
            />
          </div>
        </div>

        <label
          style={{
            ...ui.actionBtn,
            minHeight: btnH,
            height: btnH,
            boxSizing: 'border-box',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            textAlign: 'center',
            fontWeight: 900,
            padding: density === 'spacious' ? '0 14px' : '0 12px',
            whiteSpace: 'nowrap'
          }}
        >
          {tr('casterEditor.upload')}

          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => handleCasterAvatarUpload(idx, e)}
          />
        </label>

        <button
          style={{
            ...miniBtn,
            opacity: caster.avatar ? 1 : 0.45,
            cursor: caster.avatar ? 'pointer' : 'not-allowed'
          }}
          disabled={!caster.avatar}
          onClick={() => clearCasterAvatar(idx)}
        >
          {tr('casterEditor.clear')}
        </button>

        <button
          style={{
            ...miniBtn,
            borderColor: 'rgba(255,77,77,0.6)',
            color: '#ff5a5a'
          }}
          onClick={() => removeCaster(idx)}
        >
          {tr('casterEditor.remove')}
        </button>
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
  const { t: tr } = useTranslation();
  const { matchData, updateData } = useMatchContext();

  const casters = Array.isArray(matchData.casters) ? matchData.casters : [];
  const interviewBox = { ...DEFAULT_INTERVIEW_BOX, ...(matchData.interviewBox || {}) };
  const speakerMode = interviewBox.speakerMode || 'PLAYER';

  const tx = useCallback((key, fallback, options) => {
    const value = tr(key, options);
    return value === key ? fallback : value;
  }, [tr]);

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

  const compactSelect = {
    ...ui.select,
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

  const avatarOptions = useMemo(() => {
    const fromMatchData = Array.isArray(matchData.casterAvatarOptions)
      ? matchData.casterAvatarOptions
      : [];

    const fromCurrentCasters = casters
      .filter(caster => isSelectableAvatarPath(caster?.avatar))
      .map((caster, idx) => ({
        label:
          safeText(caster?.id || caster?.title) ||
          formatAvatarLabel(getAvatarFileName(caster.avatar)) ||
          `CASTER ${idx + 1}`,
        value: caster.avatar
      }));

    return uniqueAvatarOptions([
      ...AUTO_CASTER_AVATARS,
      ...MANUAL_CASTER_AVATARS,
      ...fromMatchData,
      ...fromCurrentCasters
    ]);
  }, [matchData.casterAvatarOptions, casters]);

  const rosterTeams = useMemo(() => {
    const buildTeam = side => {
      const isA = side === 'A';
      const teamName = safeText(isA ? matchData.teamA : matchData.teamB);
      const teamShort = safeText(isA ? matchData.teamShortA : matchData.teamShortB);

      const rosterPlayers = Array.isArray(isA ? matchData.rosterPlayersA : matchData.rosterPlayersB)
        ? (isA ? matchData.rosterPlayersA : matchData.rosterPlayersB)
        : [];

      const livePlayers = Array.isArray(isA ? matchData.playersA : matchData.playersB)
        ? (isA ? matchData.playersA : matchData.playersB)
        : [];

      return {
        side,
        teamName,
        teamShort,
        label: `${side} / ${teamShort || teamName || tr('casterEditor.fallbackTeamSide', { side })}`,
        rosterPlayers,
        livePlayers
      };
    };

    return [buildTeam('A'), buildTeam('B')];
  }, [
    matchData.teamA,
    matchData.teamB,
    matchData.teamShortA,
    matchData.teamShortB,
    matchData.rosterPlayersA,
    matchData.rosterPlayersB,
    matchData.playersA,
    matchData.playersB,
    tr
  ]);

  const selectedTeam = useMemo(() => {
    return rosterTeams.find(t => t.side === interviewBox.teamSide) || rosterTeams[0];
  }, [rosterTeams, interviewBox.teamSide]);

  const playerOptions = useMemo(() => {
    const rosterPlayers = selectedTeam?.rosterPlayers || [];
    const livePlayers = selectedTeam?.livePlayers || [];

    const normalized = rosterPlayers.map((player, idx) => {
      const name = getPlayerName(player) || safeText(livePlayers[idx]) || tr('casterEditor.fallbackPlayerIndexed', { num: idx + 1 });
      const role = getPlayerRole(player);
      const hero = safeText(player?.hero);

      return {
        idx,
        name,
        role,
        hero,
        label: [name, role, hero].filter(Boolean).join(' / ')
      };
    });

    if (normalized.length) return normalized;

    return livePlayers
      .map((name, idx) => ({
        idx,
        name: safeText(name) || tr('casterEditor.fallbackPlayerIndexed', { num: idx + 1 }),
        role: '',
        hero: '',
        label: safeText(name) || tr('casterEditor.fallbackPlayerIndexed', { num: idx + 1 })
      }))
      .filter(p => p.name);
  }, [selectedTeam, tr]);

  const selectedPlayerIndexValue =
    interviewBox.playerIndex === 0 || interviewBox.playerIndex
      ? String(interviewBox.playerIndex)
      : '';

  const selectedPlayer = useMemo(() => {
    if (selectedPlayerIndexValue === '') return null;
    return playerOptions.find(p => String(p.idx) === selectedPlayerIndexValue) || null;
  }, [playerOptions, selectedPlayerIndexValue]);

  const previewTeamName =
    safeText(interviewBox.manualTeamName) ||
    selectedTeam?.teamShort ||
    selectedTeam?.teamName ||
    tr('casterEditor.fallbackTeamName');

  const previewPlayerName =
    safeText(interviewBox.manualPlayerName) ||
    (speakerMode === 'TEAM'
      ? `${previewTeamName} ${tr('casterEditor.teamTag')}`
      : speakerMode === 'REPRESENTATIVE'
        ? `${previewTeamName} ${tr('casterEditor.repTag')}`
        : selectedPlayer?.name || tr('casterEditor.fallbackPlayerName'));

  const previewPlayerRole =
    safeText(interviewBox.manualPlayerRole) ||
    (speakerMode === 'TEAM'
      ? tr('casterEditor.teamStatement')
      : speakerMode === 'REPRESENTATIVE'
        ? tr('casterEditor.teamRepresentative')
        : selectedPlayer?.role || tr('casterEditor.fallbackPlayerRole'));

  const updateRootField = useCallback((key, value) => {
    updateData(prev => ({ ...prev, [key]: value }));
  }, [updateData]);

  const updateInterviewField = useCallback((key, value) => {
    updateData(prev => ({
      ...prev,
      interviewBox: {
        ...DEFAULT_INTERVIEW_BOX,
        ...(prev.interviewBox || {}),
        [key]: value
      }
    }));
  }, [updateData]);

  const changeInterviewTeam = useCallback((side) => {
    updateData(prev => ({
      ...prev,
      interviewBox: {
        ...DEFAULT_INTERVIEW_BOX,
        ...(prev.interviewBox || {}),
        teamSide: side,
        playerIndex: ''
      }
    }));
  }, [updateData]);

  const clearInterviewManual = useCallback(() => {
    updateData(prev => ({
      ...prev,
      interviewBox: {
        ...DEFAULT_INTERVIEW_BOX,
        ...(prev.interviewBox || {}),
        manualTeamName: '',
        manualPlayerName: '',
        manualPlayerRole: ''
      }
    }));
  }, [updateData]);

  const addCaster = () => {
    if (casters.length >= 4) return alert(tr('casterEditor.maxWarning'));

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
    if (casters.length <= 1) return alert(tr('casterEditor.minWarning'));

    const casterToRemove = casters[idx];
    if (casterToRemove?.avatar && casterToRemove.avatar.startsWith('blob:')) {
      URL.revokeObjectURL(casterToRemove.avatar);
    }

    const next = [...casters];
    next.splice(idx, 1);

    updateData({ ...matchData, casters: next });
  }, [casters, matchData, updateData, tr]);

  const updateCasterField = useCallback((idx, key, value) => {
    const next = [...casters];
    next[idx] = { ...next[idx], [key]: value };
    updateData({ ...matchData, casters: next });
  }, [casters, matchData, updateData]);

  const applyCasterAvatarPreset = useCallback((idx, value) => {
    if (!value || value === CUSTOM_AVATAR_VALUE) return;
    updateCasterField(idx, 'avatar', value);
  }, [updateCasterField]);

  const handleCasterAvatarUpload = useCallback(async (idx, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return alert(tr('casterEditor.imageWarning'));

    const oldAvatar = casters[idx]?.avatar;
    if (oldAvatar && oldAvatar.startsWith('blob:')) URL.revokeObjectURL(oldAvatar);

    try {
      const base64Image = await processImageForStorage(file);
      updateCasterField(idx, 'avatar', base64Image);
    } catch (error) {
      console.error('[SYS_ERR] Image Process Failed:', error);
      alert(tr('casterEditor.imageProcessFailed'));
    }

    e.target.value = '';
  }, [casters, updateCasterField, tr]);

  const clearCasterAvatar = useCallback((idx) => {
    const oldAvatar = casters[idx]?.avatar;
    if (oldAvatar && oldAvatar.startsWith('blob:')) URL.revokeObjectURL(oldAvatar);
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
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block'
            }}
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
        {tr('casterEditor.noAvatar')}
      </div>
    );
  }, [rowH, tr]);

  return (
    <div style={{ display: 'grid', gap: t.blockGap }}>
      <ShellPanel
        title={tr('casterEditor.title')}
        accent
        density={density}
        bodyStyle={{ padding: density === 'spacious' ? '12px 14px' : '10px 12px' }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: density === 'spacious' ? 10 : 8
          }}
        >
          {casters.map((caster, idx) => (
            <CasterRow
              key={idx}
              caster={caster}
              idx={idx}
              rowH={rowH}
              gap={gap}
              ui={ui}
              density={density}
              isUltra={isUltra}
              isDense={isDense}
              compactInput={compactInput}
              compactSelect={compactSelect}
              slotTitleStyle={slotTitleStyle}
              metaLabelStyle={metaLabelStyle}
              avatarOptions={avatarOptions}
              removeCaster={removeCaster}
              updateCasterField={updateCasterField}
              applyCasterAvatarPreset={applyCasterAvatarPreset}
              handleCasterAvatarUpload={handleCasterAvatarUpload}
              clearCasterAvatar={clearCasterAvatar}
              renderAvatarThumb={renderAvatarThumb}
              tr={tr}
              tx={tx}
            />
          ))}
        </div>

        <div style={{ marginTop: density === 'spacious' ? 10 : 8 }}>
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
            {tr('casterEditor.addCaster', { count: casters.length, max: 4 })}
          </button>
        </div>
      </ShellPanel>

      <ShellPanel
        title={tr('casterEditor.interviewBoxTitle')}
        accent
        density={density}
        bodyStyle={{ padding: density === 'spacious' ? '12px 14px' : '10px 12px' }}
      >
        <div style={{ display: 'grid', gap: density === 'spacious' ? 10 : 8 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isUltra
                ? '1fr'
                : isDense
                  ? '110px 150px 1fr'
                  : '110px 150px 1fr 1.35fr 1fr 1fr 1fr',
              gap,
              alignItems: 'end'
            }}
          >
            <Field label={tr('casterEditor.displayToggle')} density={density}>
              <button
                style={{
                  ...(matchData.showInterviewBox ? ui.actionBtn : ui.outlineBtn),
                  minHeight: rowH,
                  height: rowH,
                  boxSizing: 'border-box',
                  width: '100%',
                  fontWeight: 900
                }}
                onClick={() => updateRootField('showInterviewBox', !Boolean(matchData.showInterviewBox))}
              >
                {matchData.showInterviewBox ? tr('casterEditor.on') : tr('casterEditor.off')}
              </button>
            </Field>

            <Field label={tr('casterEditor.speakerMode')} density={density}>
              <select
                style={compactSelect}
                value={speakerMode}
                onChange={e => updateInterviewField('speakerMode', e.target.value)}
              >
                <option value="PLAYER">{tr('casterEditor.speakerPlayer')}</option>
                <option value="REPRESENTATIVE">{tr('casterEditor.speakerRepresentative')}</option>
                <option value="TEAM">{tr('casterEditor.speakerTeam')}</option>
              </select>
            </Field>

            <Field label={tr('casterEditor.interviewTeam')} density={density}>
              <select
                style={compactSelect}
                value={interviewBox.teamSide || 'A'}
                onChange={e => changeInterviewTeam(e.target.value)}
              >
                {rosterTeams.map(team => (
                  <option key={team.side} value={team.side}>
                    {team.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label={tr('casterEditor.interviewTarget')} density={density}>
              <select
                style={{
                  ...compactSelect,
                  opacity: speakerMode === 'PLAYER' ? 1 : 0.45,
                  cursor: speakerMode === 'PLAYER' ? 'pointer' : 'not-allowed'
                }}
                disabled={speakerMode !== 'PLAYER'}
                value={selectedPlayerIndexValue}
                onChange={e => updateInterviewField('playerIndex', e.target.value === '' ? '' : Number(e.target.value))}
              >
                <option value="">{tr('casterEditor.autoManual')}</option>

                {playerOptions.map(player => (
                  <option key={`${player.idx}-${player.name}`} value={String(player.idx)}>
                    {player.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label={tr('casterEditor.interviewTitle')} density={density}>
              <input
                style={compactInput}
                value={interviewBox.title || ''}
                onChange={e => updateInterviewField('title', e.target.value)}
                placeholder="POST-MATCH INTERVIEW"
              />
            </Field>

            <Field label={tr('casterEditor.interviewSubtitle')} density={density}>
              <input
                style={compactInput}
                value={interviewBox.subtitle || ''}
                onChange={e => updateInterviewField('subtitle', e.target.value)}
                placeholder="VOICE INTERVIEW"
              />
            </Field>

            <Field label={tr('casterEditor.interviewStatus')} density={density}>
              <input
                style={compactInput}
                value={interviewBox.status || ''}
                onChange={e => updateInterviewField('status', e.target.value)}
                placeholder="VOICE CONNECTED"
              />
            </Field>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isUltra
                ? '1fr'
                : isDense
                  ? '1fr 1fr'
                  : '1fr 1fr 1fr 120px',
              gap,
              alignItems: 'end'
            }}
          >
            <Field label={tr('casterEditor.manualTeam')} density={density}>
              <input
                style={compactInput}
                value={interviewBox.manualTeamName || ''}
                onChange={e => updateInterviewField('manualTeamName', e.target.value)}
                placeholder={selectedTeam?.teamShort || selectedTeam?.teamName || tr('casterEditor.fallbackTeamName')}
              />
            </Field>

            <Field label={tr('casterEditor.manualPlayer')} density={density}>
              <input
                style={compactInput}
                value={interviewBox.manualPlayerName || ''}
                onChange={e => updateInterviewField('manualPlayerName', e.target.value)}
                placeholder={
                  speakerMode === 'TEAM'
                    ? `${previewTeamName} ${tr('casterEditor.teamTag')}`
                    : speakerMode === 'REPRESENTATIVE'
                      ? `${previewTeamName} ${tr('casterEditor.repTag')}`
                      : selectedPlayer?.name || tr('casterEditor.fallbackPlayerName')
                }
              />
            </Field>

            <Field label={tr('casterEditor.manualRole')} density={density}>
              <input
                style={compactInput}
                value={interviewBox.manualPlayerRole || ''}
                onChange={e => updateInterviewField('manualPlayerRole', e.target.value)}
                placeholder={
                  speakerMode === 'TEAM'
                    ? tr('casterEditor.teamStatement')
                    : speakerMode === 'REPRESENTATIVE'
                      ? tr('casterEditor.teamRepresentative')
                      : selectedPlayer?.role || tr('casterEditor.fallbackPlayerRole')
                }
              />
            </Field>

            <button
              style={{
                ...ui.outlineBtn,
                minHeight: rowH,
                height: rowH,
                boxSizing: 'border-box',
                fontWeight: 900,
                whiteSpace: 'nowrap'
              }}
              onClick={clearInterviewManual}
            >
              {tr('casterEditor.clearOverride')}
            </button>
          </div>

          <div
            style={{
              border: `1px solid ${COLORS.line}`,
              borderLeft: `3px solid ${COLORS.yellow}`,
              background: 'rgba(255,255,255,0.025)',
              minHeight: rowH,
              display: 'grid',
              gridTemplateColumns: '86px 1fr auto',
              gap,
              alignItems: 'center',
              padding: '0 12px',
              boxSizing: 'border-box'
            }}
          >
            <div
              style={{
                fontSize: '10px',
                fontWeight: 900,
                color: COLORS.faintWhite,
                letterSpacing: '0.16em',
                textTransform: 'uppercase'
              }}
            >
              {tr('casterEditor.preview')}
            </div>

            <div
              style={{
                minWidth: 0,
                fontSize: density === 'spacious' ? '14px' : '13px',
                fontWeight: 900,
                color: COLORS.white,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {previewTeamName} / {previewPlayerName} / {previewPlayerRole}
            </div>

            <div
              style={{
                fontSize: '10px',
                fontWeight: 900,
                color: matchData.showInterviewBox ? COLORS.yellow : COLORS.faintWhite,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap'
              }}
            >
              {matchData.showInterviewBox ? tr('casterEditor.visible') : tr('casterEditor.hidden')}
            </div>
          </div>
        </div>
      </ShellPanel>
    </div>
  );
}