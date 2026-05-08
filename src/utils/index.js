import { HERO_DATA } from '../constants/gameData';

export const safeText = v => String(v ?? '').trim();

const ROLE_ALIASES = {
  TANK: 'TANK',
  DAMAGE: 'DAMAGE',
  DPS: 'DAMAGE',
  SUPPORT: 'SUPPORT',
  SUP: 'SUPPORT'
};

const ROLE_TO_HERO_GROUP = {
  TANK: 'tank',
  DAMAGE: 'damage',
  SUPPORT: 'support'
};

const ALL_HEROES = [
  ...(HERO_DATA.tank || []),
  ...(HERO_DATA.damage || []),
  ...(HERO_DATA.support || [])
];

export const normalizeRosterRole = role => {
  const key = safeText(role).toUpperCase();
  return ROLE_ALIASES[key] || 'DAMAGE';
};

export const normalizeHeroKey = hero => {
  const value = safeText(hero);
  if (!value) return '';

  return value
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^\w]/g, '');
};

export const formatTime = seconds => {
  const n = Number(seconds);
  if (!Number.isFinite(n) || n <= 0) return '00:00';

  const total = Math.floor(n);
  const m = Math.floor(total / 60).toString().padStart(2, '0');
  const s = Math.floor(total % 60).toString().padStart(2, '0');

  return `${m}:${s}`;
};

export const getRosterHeroOptions = role => {
  const normalizedRole = normalizeRosterRole(role);
  const group = ROLE_TO_HERO_GROUP[normalizedRole];
  return group ? HERO_DATA[group] || [] : [];
};

export const getRosterHeroImagePath = (role, hero) => {
  const heroKey = normalizeHeroKey(hero);

  if (!heroKey) return '/assets/roster/placeholder.png';

  if ((HERO_DATA.tank || []).includes(heroKey)) return `/assets/roster/tank/${heroKey}.png`;
  if ((HERO_DATA.damage || []).includes(heroKey)) return `/assets/roster/damage/${heroKey}.png`;
  if ((HERO_DATA.support || []).includes(heroKey)) return `/assets/roster/support/${heroKey}.png`;

  const roleOptions = getRosterHeroOptions(role);
  const fallbackHero = roleOptions[0];

  if (fallbackHero) return getRosterHeroImagePath(role, fallbackHero);

  return '/assets/roster/placeholder.png';
};

const normalizeNumber = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const normalizeRosterPlayer = p => {
  const role = normalizeRosterRole(p?.role);
  const heroOptions = getRosterHeroOptions(role);
  const rawHero = normalizeHeroKey(p?.hero);

  const hero =
    rawHero && heroOptions.includes(rawHero)
      ? rawHero
      : heroOptions[0] || rawHero || '';

  return {
    nickname: safeText(p?.nickname),
    battleTag: safeText(p?.battleTag),
    role,
    hero,
    heroImage: safeText(p?.heroImage) || getRosterHeroImagePath(role, hero),
    heroPosition: safeText(p?.heroPosition),
    heroScale: normalizeNumber(p?.heroScale, 1.1),
    heroBrightness: normalizeNumber(p?.heroBrightness, 0.84)
  };
};

export const normalizeRosterStaffMember = p => ({
  nickname: safeText(p?.nickname),
  battleTag: safeText(p?.battleTag)
});

export const makeRosterPresetKey = name =>
  safeText(name)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'ROSTER_PRESET';

export const cloneRosterPresetData = presetData => ({
  teamName: safeText(presetData?.teamName),
  logo: safeText(presetData?.logo || presetData?.teamLogo),
  clubName: safeText(presetData?.clubName),
  manager: normalizeRosterStaffMember(presetData?.manager),
  coaches: Array.isArray(presetData?.coaches)
    ? presetData.coaches
        .map(normalizeRosterStaffMember)
        .filter(c => c.nickname || c.battleTag)
    : [],
  players: Array.isArray(presetData?.players)
    ? presetData.players
        .map(normalizeRosterPlayer)
        .filter(p => p.nickname || p.battleTag)
        .slice(0, 7)
    : []
});

export const buildRosterPresetFromTeam = (data, teamTarget = 'A') => {
  const isB = teamTarget === 'B';
  const playersKey = isB ? 'rosterPlayersB' : 'rosterPlayersA';
  const staffKey = isB ? 'rosterStaffB' : 'rosterStaffA';

  return {
    teamName: safeText(isB ? data?.teamB : data?.teamA) || `TEAM ${teamTarget}`,
    logo: safeText(isB ? data?.logoB : data?.logoA),
    clubName: safeText(data?.[staffKey]?.clubName),
    manager: normalizeRosterStaffMember(data?.[staffKey]?.manager),
    coaches: Array.isArray(data?.[staffKey]?.coaches)
      ? data[staffKey].coaches
          .map(normalizeRosterStaffMember)
          .filter(c => c.nickname || c.battleTag)
      : [],
    players: Array.isArray(data?.[playersKey])
      ? data[playersKey]
          .map(normalizeRosterPlayer)
          .filter(p => p.nickname || p.battleTag)
          .slice(0, 7)
      : []
  };
};

export const applyRosterPresetToTeamData = (data, presetData, teamTarget = 'A') => {
  const isB = teamTarget === 'B';
  const playersKey = isB ? 'rosterPlayersB' : 'rosterPlayersA';
  const staffKey = isB ? 'rosterStaffB' : 'rosterStaffA';
  const teamKey = isB ? 'teamB' : 'teamA';
  const logoKey = isB ? 'logoB' : 'logoA';

  const players = Array.isArray(presetData?.players)
    ? presetData.players
        .map(normalizeRosterPlayer)
        .filter(p => p.nickname || p.battleTag)
        .slice(0, 7)
    : data?.[playersKey];

  const logo = safeText(presetData?.logo || presetData?.teamLogo);

  return {
    ...data,
    [teamKey]: safeText(presetData?.teamName) || data?.[teamKey],
    [logoKey]: logo || data?.[logoKey],
    [playersKey]: players,
    [staffKey]: {
      clubName: safeText(presetData?.clubName),
      showClubName: !!safeText(presetData?.clubName),
      manager: normalizeRosterStaffMember(presetData?.manager),
      coaches: Array.isArray(presetData?.coaches)
        ? presetData.coaches
            .map(normalizeRosterStaffMember)
            .filter(c => c.nickname || c.battleTag)
        : []
    },
    rosterPresetKey: ''
  };
};

export const normalizeCasterItem = (c = {}) => ({
  id: safeText(c?.id ?? c?.name ?? c?.caster ?? c?.casterId ?? c?.displayName ?? c?.casterName),
  title: safeText(c?.title ?? c?.role ?? c?.position ?? 'COMMENTATOR'),
  label: safeText(c?.label),
  social: safeText(c?.social ?? c?.handle ?? c?.username),
  avatar: safeText(c?.avatar ?? c?.avatarPath ?? c?.image ?? c?.img ?? c?.photo)
});

export const getSafeCasters = (data = {}) => {
  if (Array.isArray(data.casters) && data.casters.length) {
    return data.casters.map(normalizeCasterItem);
  }

  return [
    {
      id: data.caster1 || 'ALICE',
      title: data.caster1Title || 'COMMENTATOR',
      social: data.caster1Social || '',
      avatar: data.caster1Avatar || ''
    },
    {
      id: data.caster2 || 'BOB',
      title: data.caster2Title || 'COMMENTATOR',
      social: data.caster2Social || '',
      avatar: data.caster2Avatar || ''
    }
  ].map(normalizeCasterItem);
};