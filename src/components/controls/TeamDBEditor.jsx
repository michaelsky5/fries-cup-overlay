import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMatchContext } from '../../contexts/MatchContext';
import { ShellPanel } from '../common/SharedUI';
import { COLORS, panelBase } from '../../constants/styles';
import { LOGO_LIST } from '../../constants/logos';
import { getRosterHeroOptions, getRosterHeroImagePath } from '../../utils';
import { createEditorUi } from '../../utils/editorUi';

const STATS_DB_URL = 'https://stats.fries-cup.com/data/friescup_db.json';
const PLAYOFF_TEAM_SHORT_NAMES = ['NGP', 'TNS', 'YOU', 'ZS', 'HYW', 'SPC', 'XCFN.G', 'FG'];

const PLAYOFF_LOGO_ALIASES = {
  NGP: ['NGP', 'Never Get Point'],
  TNS: ['TNS', 'Team New Star'],
  YOU: ['YOU', '可爱小鱿4277'],
  ZS: ['ZS', 'ZWU Spark'],
  HYW: ['HYW', '何意味3'],
  SPC: ['SPC', 'Spark Crew'],
  'XCFN.G': ['XCFN.G', 'XCFNG', 'XCFN Green', 'XCFN.Green', 'XCFN'],
  FG: ['FG', '家和万事兴']
};

const ROLE_ORDER = { TANK: 0, DAMAGE: 1, SUPPORT: 2 };
const ROLE_ALIAS = { TANK: 'TANK', DPS: 'DAMAGE', DAMAGE: 'DAMAGE', SUP: 'SUPPORT', SUPPORT: 'SUPPORT' };

const HERO_ALIAS = {
  dva: 'dva', 'd.va': 'dva', 'd va': 'dva', 'd-va': 'dva', d_va: 'dva',
  doomfist: 'doomfist', 末日铁拳: 'doomfist',
  domina: 'domina', 金驭: 'domina',
  hazard: 'hazard', 骇灾: 'hazard',
  'junker queen': 'junker_queen', junker_queen: 'junker_queen', 渣客女王: 'junker_queen',
  mauga: 'mauga', 毛加: 'mauga',
  orisa: 'orisa', 奥丽莎: 'orisa',
  ramattra: 'ramattra', 拉玛刹: 'ramattra',
  reinhardt: 'reinhardt', 莱因哈特: 'reinhardt',
  roadhog: 'roadhog', 路霸: 'roadhog',
  sigma: 'sigma', 西格玛: 'sigma',
  winston: 'winston', 温斯顿: 'winston',
  'wrecking ball': 'wrecking_ball', wrecking_ball: 'wrecking_ball', 破坏球: 'wrecking_ball',
  zarya: 'zarya', 查莉娅: 'zarya',

  ashe: 'ashe', 艾什: 'ashe',
  bastion: 'bastion', 堡垒: 'bastion',
  cassidy: 'cassidy', 卡西迪: 'cassidy',
  echo: 'echo', 回声: 'echo',
  freja: 'freja', 弗蕾娅: 'freja',
  genji: 'genji', 源氏: 'genji',
  hanzo: 'hanzo', 半藏: 'hanzo',
  junkrat: 'junkrat', 狂鼠: 'junkrat',
  mei: 'mei', 美: 'mei',
  pharah: 'pharah', 法老之鹰: 'pharah',
  reaper: 'reaper', 死神: 'reaper',
  sojourn: 'sojourn', 索杰恩: 'sojourn',
  'soldier 76': 'soldier_76', 'soldier: 76': 'soldier_76', soldier_76: 'soldier_76', 士兵76: 'soldier_76', '士兵：76': 'soldier_76',
  sombra: 'sombra', 黑影: 'sombra',
  symmetra: 'symmetra', 秩序之光: 'symmetra',
  torbjorn: 'torbjorn', torbjörn: 'torbjorn', 托比昂: 'torbjorn',
  tracer: 'tracer', 猎空: 'tracer',
  venture: 'venture', 探奇: 'venture',
  widowmaker: 'widowmaker', 黑百合: 'widowmaker',

  ana: 'ana', 安娜: 'ana',
  baptiste: 'baptiste', 巴蒂斯特: 'baptiste',
  brigitte: 'brigitte', 布丽吉塔: 'brigitte',
  illari: 'illari', 伊拉锐: 'illari',
  juno: 'juno', 朱诺: 'juno',
  kiriko: 'kiriko', 雾子: 'kiriko',
  lifeweaver: 'lifeweaver', 生命之梭: 'lifeweaver',
  lucio: 'lucio', lúcio: 'lucio', 卢西奥: 'lucio',
  mercy: 'mercy', 天使: 'mercy',
  moira: 'moira', 莫伊拉: 'moira',
  wuyang: 'wuyang', 无漾: 'wuyang',
  zenyatta: 'zenyatta', 禅雅塔: 'zenyatta'
};

const compactText = value =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[?#].*$/g, '')
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '');

const normalizeHeroText = value =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[：:]/g, ':')
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ');

const normalizeRole = role => ROLE_ALIAS[String(role || '').trim().toUpperCase()] || 'DAMAGE';

const splitNameAndTag = value => {
  const text = String(value || '').trim();
  if (!text) return { nickname: '', battleTag: '' };

  const tagIndex = text.indexOf('#');
  if (tagIndex < 0) return { nickname: text, battleTag: '' };

  return {
    nickname: text.slice(0, tagIndex).trim(),
    battleTag: text
  };
};

const splitCoaches = value =>
  String(value || '')
    .split(/\s{2,}|[、,，/|]+/g)
    .map(splitNameAndTag)
    .filter(item => item.nickname || item.battleTag);

const getFileStem = path => {
  const cleanPath = String(path || '').split(/[?#]/)[0];
  const fileName = cleanPath.split('/').pop() || '';
  return fileName.replace(/\.[a-z0-9]+$/i, '');
};

const isTbdLogoValue = value => {
  const text = compactText(value);
  const stem = compactText(getFileStem(value));
  const tbdTokens = ['tbd', '待定', 'unknown', 'default', 'placeholder'];

  return tbdTokens.some(token =>
    text === token ||
    stem === token ||
    text.endsWith(token) ||
    stem.startsWith(token)
  );
};

const getLogoComparableNames = item =>
  [item?.name, item?.path, getFileStem(item?.path)]
    .filter(Boolean)
    .map(compactText);

const isLogoNameMatch = (name, target) => {
  if (!name || !target) return false;
  if (name === target) return true;

  if (target.length <= 2 || name.length <= 2) {
    return name === `${target}logo` || name.startsWith(`${target}logo`);
  }

  return name.includes(target) || target.includes(name);
};

const getKnownLogoList = () =>
  LOGO_LIST.filter(item => {
    const names = getLogoComparableNames(item);
    return item?.path && !names.some(isTbdLogoValue);
  });

const findLogoFromAliases = aliases => {
  const targets = aliases.map(compactText).filter(Boolean);
  if (!targets.length) return '';

  const usableLogos = getKnownLogoList();

  const exact = usableLogos.find(item => {
    const names = getLogoComparableNames(item);
    return targets.some(target => names.some(name => name === target));
  });

  if (exact?.path) return exact.path;

  const partial = usableLogos.find(item => {
    const names = getLogoComparableNames(item);
    return targets.some(target => names.some(name => isLogoNameMatch(name, target)));
  });

  return partial?.path || '';
};

const getPresetLogoKey = preset => {
  const data = preset?.data || {};
  const directLogo = data.logo || data.logoPath || data.teamLogo || data.logoUrl || data.teamLogoPath || '';

  return (
    data.logoKey ||
    data.teamShortName ||
    data.teamCode ||
    preset?.key ||
    getFileStem(directLogo) ||
    ''
  );
};

const resolveLogoValueToKnownPath = (value, preset = {}) => {
  const raw = String(value || '').trim();
  const data = preset?.data || {};
  const logoKey = getPresetLogoKey(preset);

  const targets = [
    logoKey,
    preset?.key,
    preset?.name,
    data.teamName,
    data.teamShortName,
    data.teamCode,
    data.clubName,
    raw,
    getFileStem(raw)
  ]
    .filter(Boolean)
    .map(compactText);

  if (!targets.length) return '';

  const usableLogos = getKnownLogoList();

  const exact = usableLogos.find(item => {
    const names = getLogoComparableNames(item);
    return targets.some(target => names.some(name => name === target));
  });

  if (exact?.path) return exact.path;

  const partial = usableLogos.find(item => {
    const names = getLogoComparableNames(item);
    return targets.some(target => names.some(name => isLogoNameMatch(name, target)));
  });

  return partial?.path || '';
};

const findTeamLogoPath = team => {
  const remoteLogo = String(team?.team_logo || '').trim();
  const shortName = String(team?.team_short_name || '').trim();

  if (remoteLogo && !isTbdLogoValue(remoteLogo)) {
    const knownLogo = resolveLogoValueToKnownPath(remoteLogo, {
      key: shortName,
      name: team?.team_name,
      data: {
        logoKey: shortName,
        teamName: team?.team_name,
        teamShortName: shortName,
        teamCode: shortName,
        clubName: team?.team_club,
        logo: remoteLogo
      }
    });

    return knownLogo || remoteLogo;
  }

  const aliases = [
    ...(PLAYOFF_LOGO_ALIASES[shortName] || []),
    team?.team_short_name,
    team?.team_name,
    team?.team_club
  ].filter(Boolean);

  return findLogoFromAliases(aliases);
};

const resolveLogoFromPresetIdentity = preset => {
  const data = preset?.data || {};
  const logoKey = getPresetLogoKey(preset);

  const aliases = [
    ...(PLAYOFF_LOGO_ALIASES[logoKey] || []),
    ...(PLAYOFF_LOGO_ALIASES[preset?.key] || []),
    ...(PLAYOFF_LOGO_ALIASES[data.teamShortName] || []),
    logoKey,
    preset?.key,
    preset?.name,
    data.teamName,
    data.teamShortName,
    data.teamCode,
    data.clubName
  ].filter(Boolean);

  return findLogoFromAliases(aliases);
};

const normalizeTeamPresetForDB = preset => {
  const data = preset?.data || {};
  const logoKey = getPresetLogoKey(preset);
  const directLogo = data.logo || data.logoPath || data.teamLogo || data.logoUrl || data.teamLogoPath || '';

  const logoFromDirect = resolveLogoValueToKnownPath(directLogo, {
    ...preset,
    data: {
      ...data,
      logoKey
    }
  });

  const logo = logoFromDirect || resolveLogoFromPresetIdentity({
    ...preset,
    data: {
      ...data,
      logoKey
    }
  });

  return {
    ...preset,
    data: {
      ...data,
      logoKey,
      logo,
      logoPath: logo,
      teamLogo: logo
    }
  };
};

const normalizeTeamPresetLibraryForDB = source =>
  (Array.isArray(source) ? source : [])
    .filter(Boolean)
    .map(normalizeTeamPresetForDB);

const pickHeroKey = (rawHero, role) => {
  const options = getRosterHeroOptions(role) || [];
  if (!options.length) return '';

  const normalized = normalizeHeroText(rawHero);
  const alias = HERO_ALIAS[normalized] || HERO_ALIAS[compactText(rawHero)] || normalized.replace(/\s+/g, '_');

  if (options.includes(alias)) return alias;

  const compactAlias = compactText(alias);
  const matched = options.find(option => compactText(option) === compactAlias);

  return matched || options[0];
};

const getPlayerHeroStats = player => {
  const mainLogs = Array.isArray(player?.match_logs) && player.match_logs.length ? player.match_logs : [];
  const fallbackLogs = [
    ...(Array.isArray(player?.live_match_logs) ? player.live_match_logs : []),
    ...(Array.isArray(player?.historical_match_logs) ? player.historical_match_logs : [])
  ];

  const logs = mainLogs.length ? mainLogs : fallbackLogs;
  const heroMap = new Map();

  logs.forEach(log => {
    const hero = String(log?.hero || '').trim();
    const minutes = Number(log?.playtimeMinutes || 0);
    if (!hero || minutes <= 0) return;

    const current = heroMap.get(hero) || { hero, minutes: 0, maps: 0 };
    current.minutes += minutes;
    current.maps += 1;
    heroMap.set(hero, current);
  });

  return [...heroMap.values()].sort((a, b) => b.minutes - a.minutes || b.maps - a.maps);
};

const buildPlayerPreset = (player, index) => {
  const role = normalizeRole(player?.role);
  const heroStats = getPlayerHeroStats(player);
  const mainHero = pickHeroKey(heroStats[0]?.hero, role);
  const topHeroes = heroStats.slice(0, 3).map(item => pickHeroKey(item.hero, role)).filter(Boolean);

  const rawName = player?.player_name || player?.display_name || player?.nickname || '';
  const parsed = splitNameAndTag(rawName);
  const nickname = player?.nickname || player?.display_name || parsed.nickname || `PLAYER ${index + 1}`;

  return {
    id: player?.player_id || `player-${index + 1}`,
    nickname,
    battleTag: parsed.battleTag || rawName,
    role,
    hero: mainHero,
    topHeroes: [...new Set(topHeroes)],
    heroImage: getRosterHeroImagePath(role, mainHero),
    heroScale: 1.1,
    heroBrightness: 0.84,
    heroPosition: '',
    sourcePlayerId: player?.player_id || '',
    rank: player?.rank || '',
    status: player?.status || '',
    allowedFlex: Array.isArray(player?.allowed_flex) ? player.allowed_flex : []
  };
};

const buildPlayoffPresetsFromDb = db => {
  const teams = Array.isArray(db?.teams) ? db.teams : [];
  const players = Array.isArray(db?.players) ? db.players : [];
  const playerById = new Map(players.map(player => [player.player_id, player]));

  return PLAYOFF_TEAM_SHORT_NAMES.map(shortName => {
    const team = teams.find(item => String(item?.team_short_name || '').toUpperCase() === shortName.toUpperCase());
    if (!team) return null;

    const manager = splitNameAndTag(team.team_manager);
    const coaches = splitCoaches(team.team_coach);

    const teamPlayers = (team.player_ids || [])
      .map((playerId, index) => ({ player: playerById.get(playerId), index }))
      .filter(item => item.player)
      .map(({ player, index }) => ({ ...buildPlayerPreset(player, index), originalIndex: index }))
      .sort((a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9) || a.originalIndex - b.originalIndex)
      .map(({ originalIndex, ...player }) => player);

    const logoPath = findTeamLogoPath(team);
    const key = String(team.team_short_name || shortName).trim();
    const name = team.team_name || key;

    return normalizeTeamPresetForDB({
      key,
      name,
      data: {
        teamName: name,
        teamShortName: key,
        teamCode: key,
        logoKey: key,
        logo: logoPath,
        logoPath,
        teamLogo: logoPath,
        clubName: team.team_club || name,
        showClubName: !!team.team_club,
        manager,
        coaches,
        players: teamPlayers,
        source: 'stats.fries-cup.com',
        sourceTeamId: team.team_id || '',
        sourceUpdatedAt: db?.updated_at || ''
      }
    });
  }).filter(Boolean);
};

const getPresetLogo = preset => {
  const data = preset?.data || {};
  return data.logo || data.logoPath || data.teamLogo || '';
};

const mergePresetLibrary = (currentLibrary, incomingPresets) => {
  const next = normalizeTeamPresetLibraryForDB(currentLibrary);
  const incoming = normalizeTeamPresetLibraryForDB(incomingPresets);

  incoming.forEach(preset => {
    const existedIndex = next.findIndex(item => item.key === preset.key);

    if (existedIndex >= 0) {
      const existing = next[existedIndex];
      const incomingLogo = getPresetLogo(preset);
      const existingLogo = getPresetLogo(existing);
      const safeLogo = incomingLogo && !isTbdLogoValue(incomingLogo) ? incomingLogo : existingLogo;

      next[existedIndex] = normalizeTeamPresetForDB({
        ...existing,
        ...preset,
        data: {
          ...(existing.data || {}),
          ...(preset.data || {}),
          logoKey: preset.data?.logoKey || existing.data?.logoKey || preset.key || existing.key || '',
          logo: safeLogo || '',
          logoPath: safeLogo || '',
          teamLogo: safeLogo || ''
        }
      });
    } else {
      next.push(preset);
    }
  });

  return next;
};

export default function TeamDBEditor({
  density = 'standard',
  densityTokens,
  isDense = false,
  isUltra = false
}) {
  const { t: tr } = useTranslation();
  const { matchData, updateWithHistory, showModal } = useMatchContext();

  const [isSyncingPlayoff, setIsSyncingPlayoff] = useState(false);
  const localDbInputRef = useRef(null);

  const library = Array.isArray(matchData.rosterPresetLibrary) ? matchData.rosterPresetLibrary : [];

  const t = densityTokens || {
    blockGap: 10,
    panelPadding: '12px 14px'
  };

  const ui = createEditorUi(densityTokens, density);

  const tx = (key, fallback, options = {}) => tr(key, { defaultValue: fallback, ...options });

  const saveImportedPresets = (presets, actionLabel) => {
    const normalizedPresets = normalizeTeamPresetLibraryForDB(presets);

    if (!normalizedPresets.length) {
      showModal({
        type: 'alert',
        title: tx('teamDbEditor.playoffImportEmpty', '未找到八强队伍'),
        message: tx('teamDbEditor.playoffImportEmptyMsg', '没有在数据文件中找到 NGP / TNS / YOU / ZS / HYW / SPC / XCFN.G / FG。'),
        isDanger: true
      });
      return;
    }

    const nextLibrary = mergePresetLibrary(library, normalizedPresets);

    updateWithHistory(actionLabel, {
      ...matchData,
      rosterPresetLibrary: nextLibrary
    });

    showModal({
      type: 'alert',
      title: tx('teamDbEditor.playoffImportSuccess', '八强预设已导入'),
      message: tx('teamDbEditor.playoffImportSuccessMsg', '已同步 {{count}} 支季后赛队伍到队伍预设库。', { count: normalizedPresets.length })
    });
  };

  const importPlayoffPresetsFromStats = async () => {
    if (isSyncingPlayoff) return;
    setIsSyncingPlayoff(true);

    try {
      const response = await fetch(STATS_DB_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const db = await response.json();
      const presets = buildPlayoffPresetsFromDb(db);

      saveImportedPresets(presets, 'Sync playoff roster presets from stats DB');
    } catch (error) {
      console.error('Failed to sync playoff presets:', error);
      showModal({
        type: 'alert',
        title: tx('teamDbEditor.playoffImportFailed', '八强预设导入失败'),
        message: tx(
          'teamDbEditor.playoffImportFailedMsg',
          '无法直接读取 stats.fries-cup.com 的数据。可能是网络或 CORS 限制。请下载 friescup_db.json 后使用本地导入。'
        ),
        isDanger: true
      });
    } finally {
      setIsSyncingPlayoff(false);
    }
  };

  const importPlayoffPresetsFromLocalJson = event => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const db = JSON.parse(String(reader.result || '{}'));
        const presets = buildPlayoffPresetsFromDb(db);

        saveImportedPresets(presets, 'Import playoff roster presets from local stats DB');
      } catch (error) {
        console.error('Failed to import local playoff DB:', error);
        showModal({
          type: 'alert',
          title: tx('teamDbEditor.localPlayoffImportFailed', '本地 JSON 导入失败'),
          message: tx('teamDbEditor.localPlayoffImportFailedMsg', '文件格式不正确，请确认导入的是 friescup_db.json。'),
          isDanger: true
        });
      }
    };

    reader.readAsText(file, 'utf-8');
  };

  const exportDB = () => {
    const exportLibrary = normalizeTeamPresetLibraryForDB(library);

    navigator.clipboard
      .writeText(JSON.stringify(exportLibrary, null, 2))
      .then(() =>
        showModal({
          type: 'alert',
          title: tr('teamDbEditor.exportSuccess'),
          message: tr('teamDbEditor.exportMessage')
        })
      );
  };

  const importDB = () => {
    showModal({
      type: 'prompt',
      title: tr('teamDbEditor.importPrompt'),
      message: tr('teamDbEditor.importMessage'),
      onConfirm: data => {
        if (!data) return;

        try {
          const parsed = JSON.parse(data);
          if (!Array.isArray(parsed)) throw new Error('Invalid format');

          const normalizedParsed = normalizeTeamPresetLibraryForDB(parsed);
          const currentLib = mergePresetLibrary(library, normalizedParsed);

          updateWithHistory('Import team database', {
            ...matchData,
            rosterPresetLibrary: currentLib
          });

          showModal({
            type: 'alert',
            title: tr('teamDbEditor.importSuccess'),
            message: tr('teamDbEditor.importSuccessMsg', { count: normalizedParsed.length })
          });
        } catch (e) {
          showModal({
            type: 'alert',
            title: tr('teamDbEditor.importFailed'),
            message: tr('teamDbEditor.importFailedMsg'),
            isDanger: true
          });
        }
      }
    });
  };

  const deleteTeam = key => {
    showModal({
      type: 'confirm',
      title: tr('teamDbEditor.deleteTitle'),
      isDanger: true,
      message: tr('teamDbEditor.deleteMsg', { key }),
      onConfirm: () => {
        updateWithHistory(`Delete team: ${key}`, {
          ...matchData,
          rosterPresetLibrary: library.filter(t => t.key !== key)
        });
      }
    });
  };

  const cardMinWidth = isUltra
    ? '1fr'
    : isDense
      ? 'minmax(260px, 1fr)'
      : density === 'spacious'
        ? 'minmax(340px, 1fr)'
        : 'minmax(300px, 1fr)';

  const labelStyle = {
    fontSize: density === 'spacious' ? '11px' : '10px',
    color: COLORS.faintWhite,
    fontWeight: 900,
    letterSpacing: '1.3px',
    textTransform: 'uppercase'
  };

  const valueStyle = {
    fontSize: density === 'spacious' ? '12px' : '11px',
    color: COLORS.softWhite,
    fontWeight: 700,
    lineHeight: 1.45,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  };

  const compactButtonStyle = {
    height: density === 'spacious' ? '42px' : '38px',
    minHeight: density === 'spacious' ? '42px' : '38px',
    padding: '0 12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 900,
    fontSize: density === 'spacious' ? '12px' : '11px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap'
  };

  const yellowButtonStyle = {
    ...ui.actionBtn,
    ...compactButtonStyle,
    backgroundColor: COLORS.yellow,
    color: COLORS.black
  };

  const outlineYellowButtonStyle = {
    ...ui.outlineBtn,
    ...compactButtonStyle,
    borderColor: COLORS.yellow,
    color: COLORS.yellow
  };

  const toolbarColumns = isUltra
    ? '1fr'
    : isDense
      ? 'repeat(2, minmax(0, 1fr))'
      : 'repeat(4, minmax(0, 1fr))';

  return (
    <div style={{ display: 'grid', gap: t.blockGap }}>
      <ShellPanel title={tr('teamDbEditor.title')} accent density={density}>
        <div style={{ display: 'grid', gap: t.blockGap }}>
          <div
            style={{
              ...panelBase,
              padding: density === 'spacious' ? '12px 14px' : '10px 12px',
              borderLeft: `3px solid ${COLORS.yellow}`,
              display: 'grid',
              gap: '8px'
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isUltra ? '1fr' : 'minmax(160px, auto) minmax(0, 1fr)',
                gap: '10px',
                alignItems: 'center'
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    color: COLORS.yellow,
                    fontSize: '11px',
                    fontWeight: 900,
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                    lineHeight: 1
                  }}
                >
                  {tx('teamDbEditor.playoffSyncKicker', 'PLAYOFF SYNC')}
                </div>
              </div>

              <div
                style={{
                  color: COLORS.faintWhite,
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  textAlign: isUltra ? 'left' : 'right',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {PLAYOFF_TEAM_SHORT_NAMES.join(' / ')}
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: toolbarColumns,
                gap: '8px'
              }}
            >
              <button
                style={{
                  ...yellowButtonStyle,
                  opacity: isSyncingPlayoff ? 0.55 : 1,
                  cursor: isSyncingPlayoff ? 'not-allowed' : 'pointer'
                }}
                onClick={importPlayoffPresetsFromStats}
                disabled={isSyncingPlayoff}
              >
                {isSyncingPlayoff
                  ? tx('teamDbEditor.playoffSyncing', '同步中...')
                  : tx('teamDbEditor.importPlayoffFromStats', '数据网站导入八强')}
              </button>

              <button
                style={outlineYellowButtonStyle}
                onClick={() => localDbInputRef.current?.click()}
              >
                {tx('teamDbEditor.importPlayoffFromLocal', '本地 DB 导入')}
              </button>

              <button style={outlineYellowButtonStyle} onClick={exportDB}>
                {tr('teamDbEditor.exportBtn')}
              </button>

              <button style={yellowButtonStyle} onClick={importDB}>
                {tx('teamDbEditor.importFullDbJson', '导入总库 JSON')}
              </button>

              <input
                ref={localDbInputRef}
                type="file"
                accept="application/json,.json"
                style={{ display: 'none' }}
                onChange={importPlayoffPresetsFromLocalJson}
              />
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isUltra ? '1fr' : `repeat(auto-fill, ${cardMinWidth})`,
              gap: '12px',
              marginTop: '4px',
              alignItems: 'stretch'
            }}
          >
            {library.map(team => {
              const normalizedTeam = normalizeTeamPresetForDB(team);
              const players = normalizedTeam.data?.players || [];
              const playerNames = players
                .map(p => p.nickname || p.battleTag)
                .filter(Boolean);

              const logoValue = normalizedTeam.data?.logo || normalizedTeam.data?.logoPath || normalizedTeam.data?.teamLogo || '';
              const hasLogo = !!logoValue && !isTbdLogoValue(logoValue);

              return (
                <div
                  key={team.key}
                  style={{
                    ...panelBase,
                    padding: t.panelPadding,
                    borderLeft: `3px solid ${COLORS.yellow}`,
                    height: '100%',
                    display: 'grid',
                    gridTemplateRows: 'auto auto 1fr',
                    gap: '12px',
                    boxSizing: 'border-box'
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: '10px',
                      alignItems: 'start'
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          color: COLORS.white,
                          fontWeight: 900,
                          fontSize: density === 'spacious' ? '17px' : '16px',
                          textTransform: 'uppercase',
                          lineHeight: 1.15,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {team.name}
                      </div>

                      <div
                        style={{
                          color: COLORS.faintWhite,
                          fontSize: '11px',
                          marginTop: '5px',
                          letterSpacing: '0.04em',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {tr('teamDbEditor.key')}: {team.key}
                      </div>
                    </div>

                    <button
                      style={{
                        ...ui.outlineBtn,
                        borderColor: COLORS.red,
                        color: COLORS.red,
                        minWidth: isDense ? '68px' : '74px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '6px'
                      }}
                      onClick={() => deleteTeam(team.key)}
                    >
                      {tr('teamDbEditor.delete')}
                    </button>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isDense ? '1fr' : 'repeat(3, minmax(0, 1fr))',
                      gap: '8px'
                    }}
                  >
                    <div
                      style={{
                        border: `1px solid ${COLORS.line}`,
                        background: 'rgba(255,255,255,0.02)',
                        padding: '8px 10px',
                        display: 'grid',
                        gap: '3px',
                        minWidth: 0
                      }}
                    >
                      <div style={labelStyle}>{tr('teamDbEditor.logo')}</div>
                      <div style={valueStyle}>{hasLogo ? tr('teamDbEditor.configured') : tr('teamDbEditor.notSet')}</div>
                    </div>

                    <div
                      style={{
                        border: `1px solid ${COLORS.line}`,
                        background: 'rgba(255,255,255,0.02)',
                        padding: '8px 10px',
                        display: 'grid',
                        gap: '3px',
                        minWidth: 0
                      }}
                    >
                      <div style={labelStyle}>{tr('teamDbEditor.players')}</div>
                      <div style={valueStyle}>{players.length} {tr('teamDbEditor.registered')}</div>
                    </div>

                    <div
                      style={{
                        border: `1px solid ${COLORS.line}`,
                        background: 'rgba(255,255,255,0.02)',
                        padding: '8px 10px',
                        display: 'grid',
                        gap: '3px',
                        minWidth: 0
                      }}
                    >
                      <div style={labelStyle}>{tr('teamDbEditor.status')}</div>
                      <div style={valueStyle}>{players.length ? tr('teamDbEditor.ready') : tr('teamDbEditor.incomplete')}</div>
                    </div>
                  </div>

                  <div
                    style={{
                      border: `1px solid ${COLORS.line}`,
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)',
                      padding: '8px 10px',
                      display: 'grid',
                      alignContent: 'start',
                      gap: '8px',
                      minHeight: density === 'spacious' ? '68px' : '60px',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        ...labelStyle,
                        color: COLORS.yellow
                      }}
                    >
                      {tr('teamDbEditor.rosterPreview')}
                    </div>

                    <div
                      style={{
                        color: playerNames.length ? COLORS.softWhite : COLORS.faintWhite,
                        fontSize: density === 'spacious' ? '12px' : '11px',
                        lineHeight: 1.55,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {playerNames.join(', ') || tr('teamDbEditor.noPlayerData')}
                    </div>
                  </div>
                </div>
              );
            })}

            {library.length === 0 && (
              <div
                style={{
                  color: COLORS.faintWhite,
                  padding: density === 'spacious' ? '24px' : '20px',
                  textAlign: 'center',
                  border: `1px dashed ${COLORS.lineStrong}`,
                  gridColumn: '1 / -1'
                }}
              >
                {tr('teamDbEditor.noRecords')}
              </div>
            )}
          </div>
        </div>
      </ShellPanel>
    </div>
  );
}