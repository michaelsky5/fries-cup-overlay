const logoModules = import.meta.glob('/src/assets/logos/*.{png,jpg,jpeg,webp,svg}', {
  eager: true,
  import: 'default'
});

const LOGO_ALIASES = {
  NGP: ['Never Get Point'],
  TNS: ['Team New Star'],
  YOU: ['可爱小鱿4277'],
  ZS: ['ZWU Spark'],
  HYW: ['何意味3', 'Elysium 极乐空间'],
  SPC: ['Spark Crew'],
  XCFNG: ['XCFN.G', 'XCFN-G', 'XCFN_G', 'XCFN Green', 'XCFN.Green', 'XCFN'],
  FG: ['家和万事兴', 'Super Clam']
};

const TBD_TOKENS = ['TBD', '待定', 'UNKNOWN', 'DEFAULT', 'PLACEHOLDER'];

export const getLogoFileStem = value => {
  const cleanPath = String(value || '').split(/[?#]/)[0];
  const fileName = cleanPath.split('/').pop() || '';
  return fileName.replace(/\.[a-z0-9]+$/i, '');
};

export const normalizeLogoKey = value =>
  String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[?#].*$/g, '')
    .replace(/\.[A-Z0-9]+$/i, '')
    .replace(/[^A-Z0-9\u4E00-\u9FA5]+/g, '');

export const isTbdLogoKey = value => {
  const text = normalizeLogoKey(value);
  const stem = normalizeLogoKey(getLogoFileStem(value));

  return TBD_TOKENS.some(token => {
    const normalizedToken = normalizeLogoKey(token);
    return (
      text === normalizedToken ||
      stem === normalizedToken ||
      text.endsWith(normalizedToken) ||
      stem.startsWith(normalizedToken)
    );
  });
};

const createLogoTokens = logo => {
  const baseTokens = [
    logo.name,
    logo.path,
    logo.sourcePath,
    getLogoFileStem(logo.path),
    getLogoFileStem(logo.sourcePath)
  ];

  const normalizedName = normalizeLogoKey(logo.name);
  const aliasTokens = LOGO_ALIASES[normalizedName] || [];

  return [...new Set([...baseTokens, ...aliasTokens].map(normalizeLogoKey).filter(Boolean))];
};

const scannedLogos = Object.entries(logoModules)
  .map(([sourcePath, path]) => {
    const name = getLogoFileStem(sourcePath);

    return {
      name,
      path,
      sourcePath,
      logoKey: normalizeLogoKey(name)
    };
  })
  .filter(logo => logo.path && !isTbdLogoKey(logo.name))
  .sort((a, b) => a.name.localeCompare(b.name))
  .map(logo => ({
    ...logo,
    tokens: createLogoTokens(logo)
  }));

export const LOGO_LIST = [
  {
    name: 'TBD',
    path: '',
    sourcePath: '',
    logoKey: 'TBD',
    tokens: ['TBD']
  },
  ...scannedLogos
];

const REAL_LOGOS = LOGO_LIST.filter(logo => logo.path && !isTbdLogoKey(logo.name));

const isLogoNameMatch = (logoToken, targetToken) => {
  if (!logoToken || !targetToken) return false;
  if (logoToken === targetToken) return true;

  if (targetToken.length <= 2 || logoToken.length <= 2) {
    return logoToken === `${targetToken}LOGO` || logoToken.startsWith(`${targetToken}LOGO`);
  }

  return logoToken.includes(targetToken) || targetToken.includes(logoToken);
};

export const findLogoByName = name => {
  const target = normalizeLogoKey(name);
  if (!target || isTbdLogoKey(target)) return null;

  return REAL_LOGOS.find(logo => logo.tokens.some(token => token === target)) || null;
};

export const resolveLogoFromCandidates = (candidates = [], fallback = '') => {
  const list = Array.isArray(candidates) ? candidates : [candidates];
  const rawCandidates = list.map(value => String(value || '').trim()).filter(Boolean);

  if (!rawCandidates.length) return fallback;

  const directMatch = REAL_LOGOS.find(logo =>
    rawCandidates.some(value => value === logo.path || value === logo.sourcePath)
  );

  if (directMatch?.path) return directMatch.path;

  const targets = rawCandidates
    .flatMap(value => [value, getLogoFileStem(value)])
    .map(normalizeLogoKey)
    .filter(Boolean)
    .filter(value => !isTbdLogoKey(value));

  if (!targets.length) return fallback;

  const exactMatch = REAL_LOGOS.find(logo =>
    targets.some(target => logo.tokens.some(token => token === target))
  );

  if (exactMatch?.path) return exactMatch.path;

  const partialMatch = REAL_LOGOS.find(logo =>
    targets.some(target => logo.tokens.some(token => isLogoNameMatch(token, target)))
  );

  return partialMatch?.path || fallback;
};

export const resolveLogoPath = (value, contextOrFallback = {}, fallback = '') => {
  const isFallbackString = typeof contextOrFallback === 'string';
  const context = isFallbackString ? {} : (contextOrFallback || {});
  const finalFallback = isFallbackString ? contextOrFallback : fallback;

  const data = context.data || context;

  return resolveLogoFromCandidates([
    value,
    data.logoKey,
    data.teamShortName,
    data.teamCode,
    data.key,
    context.key,
    context.name,
    data.teamName,
    data.clubName,
    data.logo,
    data.logoPath,
    data.teamLogo,
    data.logoUrl,
    data.teamLogoPath,
    data.team_logo,
    data.team_short_name,
    data.team_name,
    data.team_club
  ], finalFallback);
};

export const resolveTeamLogoPath = (teamOrPreset = {}, fallback = '') => {
  const data = teamOrPreset.data || teamOrPreset;

  return resolveLogoFromCandidates([
    data.logoKey,
    data.logo,
    data.logoPath,
    data.teamLogo,
    data.logoUrl,
    data.teamLogoPath,
    data.team_logo,
    teamOrPreset.key,
    teamOrPreset.name,
    data.teamShortName,
    data.teamCode,
    data.teamName,
    data.clubName,
    data.team_short_name,
    data.team_name,
    data.team_club
  ], fallback);
};

export const DEFAULT_LOGO = LOGO_LIST[0];