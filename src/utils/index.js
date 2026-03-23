import { HERO_DATA } from '../constants/gameData';

export const safeText = v => String(v ?? '').trim();

export const formatTime = (seconds) => {
  if (!seconds || Number.isNaN(seconds)) return '00:00';
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export const getRosterHeroOptions = role => {
  if (role === 'TANK') return HERO_DATA.tank;
  if (role === 'DAMAGE') return HERO_DATA.damage;
  if (role === 'SUPPORT') return HERO_DATA.support;
  return [];
};

export const getRosterHeroImagePath = (role, hero) => {
  if (!hero) return '/assets/roster/placeholder.png';
  if (HERO_DATA.tank.includes(hero)) return `/assets/roster/tank/${hero}.png`;
  if (HERO_DATA.damage.includes(hero)) return `/assets/roster/damage/${hero}.png`;
  if (HERO_DATA.support.includes(hero)) return `/assets/roster/support/${hero}.png`;
  return '/assets/roster/placeholder.png';
};

export const normalizeRosterPlayer = p => {
  const role = ['TANK', 'DAMAGE', 'SUPPORT'].includes(safeText(p?.role).toUpperCase()) ? safeText(p?.role).toUpperCase() : 'DAMAGE';
  const heroOptions = getRosterHeroOptions(role);
  const hero = safeText(p?.hero) || heroOptions[0] || '';
  return {
    nickname: safeText(p?.nickname),
    battleTag: safeText(p?.battleTag),
    role,
    hero,
    heroImage: safeText(p?.heroImage) || getRosterHeroImagePath(role, hero),
    heroPosition: safeText(p?.heroPosition),
    heroScale: Number(p?.heroScale) || 1.1,
    heroBrightness: Number(p?.heroBrightness) || 0.84
  };
};

export const normalizeRosterStaffMember = p => ({
  nickname: safeText(p?.nickname),
  battleTag: safeText(p?.battleTag)
});

export const makeRosterPresetKey = name =>
  safeText(name).toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'ROSTER_PRESET';

export const cloneRosterPresetData = presetData => ({
  teamName: safeText(presetData?.teamName),
  // 🚀 核心修复：同时兼容老版 teamLogo 和新版 logo，统一输出为 logo
  logo: safeText(presetData?.logo || presetData?.teamLogo),
  clubName: safeText(presetData?.clubName),
  manager: normalizeRosterStaffMember(presetData?.manager),
  coaches: Array.isArray(presetData?.coaches) ? presetData.coaches.map(normalizeRosterStaffMember).filter(c => c.nickname || c.battleTag) : [],
  players: Array.isArray(presetData?.players) ? presetData.players.map(normalizeRosterPlayer).filter(p => ['TANK', 'DAMAGE', 'SUPPORT'].includes(p.role)).slice(0, 7) : []
});

export const buildRosterPresetFromTeam = (data, teamTarget = 'A') => {
  const isB = teamTarget === 'B';
  const playersKey = isB ? 'rosterPlayersB' : 'rosterPlayersA';
  const staffKey = isB ? 'rosterStaffB' : 'rosterStaffA';
  return {
    teamName: safeText(isB ? data.teamB : data.teamA) || `TEAM ${teamTarget}`,
    // 🚀 核心修复：保存时统一使用 logo 键名，与组件保持一致
    logo: isB ? data.logoB : data.logoA,
    clubName: safeText(data?.[staffKey]?.clubName),
    manager: normalizeRosterStaffMember(data?.[staffKey]?.manager),
    coaches: Array.isArray(data?.[staffKey]?.coaches) ? data[staffKey].coaches.map(normalizeRosterStaffMember).filter(c => c.nickname || c.battleTag) : [],
    players: (data?.[playersKey] || []).map(normalizeRosterPlayer).filter(p => ['TANK', 'DAMAGE', 'SUPPORT'].includes(p.role)).slice(0, 7)
  };
};

export const applyRosterPresetToTeamData = (data, presetData, teamTarget = 'A') => {
  const isB = teamTarget === 'B';
  const playersKey = isB ? 'rosterPlayersB' : 'rosterPlayersA';
  const staffKey = isB ? 'rosterStaffB' : 'rosterStaffA';
  const teamKey = isB ? 'teamB' : 'teamA';
  const logoKey = isB ? 'logoB' : 'logoA';

  return {
    ...data,
    [teamKey]: safeText(presetData?.teamName) || data[teamKey],
    // 🚀 核心修复：读取时兼容 logo 和 teamLogo
    [logoKey]: safeText(presetData?.logo || presetData?.teamLogo) || data[logoKey],
    [playersKey]: Array.isArray(presetData?.players) ? presetData.players.map(normalizeRosterPlayer).slice(0, 7) : data[playersKey],
    [staffKey]: {
      clubName: safeText(presetData?.clubName),
      showClubName: !!safeText(presetData?.clubName),
      manager: normalizeRosterStaffMember(presetData?.manager),
      coaches: Array.isArray(presetData?.coaches) ? presetData.coaches.map(normalizeRosterStaffMember).filter(c => c.nickname || c.battleTag) : []
    },
    rosterPresetKey: ''
  };
};

export const normalizeCasterItem = (c = {}) => ({
  id: String(c?.id ?? c?.name ?? c?.caster ?? c?.casterId ?? c?.displayName ?? c?.casterName ?? '').trim(),
  title: String(c?.title ?? c?.role ?? c?.position ?? 'COMMENTATOR').trim(),
  label: String(c?.label ?? '').trim(),
  social: String(c?.social ?? c?.handle ?? c?.username ?? '').trim(),
  avatar: String(c?.avatar ?? c?.avatarPath ?? c?.image ?? c?.img ?? c?.photo ?? '').trim()
});

export const getSafeCasters = (data = {}) => {
  if (Array.isArray(data.casters) && data.casters.length) {
    return data.casters.map(normalizeCasterItem);
  }
  const legacy = [
    { id: data.caster1 || 'ALICE', title: data.caster1Title || 'COMMENTATOR', social: data.caster1Social || '', avatar: data.caster1Avatar || '' },
    { id: data.caster2 || 'BOB', title: data.caster2Title || 'COMMENTATOR', social: data.caster2Social || '', avatar: data.caster2Avatar || '' }
  ].map(normalizeCasterItem);
  return legacy;
};