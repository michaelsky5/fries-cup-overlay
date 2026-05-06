import React, { useEffect, useMemo, useState } from 'react';

const COLORS = {
  black: '#2a2a2a',
  yellow: '#f4c320',
  white: '#ffffff',
  deepBlack: '#101010',
  line: 'rgba(255,255,255,0.08)',
  lineStrong: 'rgba(255,255,255,0.18)',
  softWhite: 'rgba(255,255,255,0.72)',
  mutedWhite: 'rgba(255,255,255,0.48)',
  faintWhite: 'rgba(255,255,255,0.26)'
};

const UI = {
  frame: `1px solid ${COLORS.line}`,
  frameStrong: `1px solid ${COLORS.lineStrong}`,
  yellowFrame: `1px solid rgba(244,195,32,0.86)`,
  yellowGlow: '0 0 0 1px rgba(244,195,32,0.16), 0 0 22px rgba(244,195,32,0.07)'
};

const TEAM_LOGOS = import.meta.glob('../../../assets/logos/*.png', {
  eager: true,
  import: 'default'
});

// 队伍 Logo 小框底板模式
// light  = 白浅底，适合深色 logo
// yellow = 黄底，适合黑色简洁 logo
// dark   = 深色底，适合白色/浅色/黄色 logo
const TEAM_LOGO_PLATE = {
  SPC: 'light',
  ZS: 'light',
  NGP: 'light',
  FG: 'light',
  YOU: 'light',
  'XCFN.G': 'light',
  HYW: 'light',
  TNS: 'light',

  ASP: 'light',
  AST: 'light',
  BLG: 'dark',
  CR: 'light',
  CUG: 'light',
  CUIT: 'light',
  FFA: 'light',
  FZ: 'light',
  JDG: 'dark',
  LSG: 'dark',
  NBA: 'light',
  OL: 'dark',
  OW: 'dark',
  SC: 'dark',
  SD: 'dark',
  SK: 'dark',
  SPS: 'dark',
  'T2L.A': 'dark',
  TBD: 'dark',
  TCK: 'dark',
  TF: 'dark',
  WG: 'dark'
};

const HERO_SLUG_MAP = {
  'd.va': ['dva'],
  dva: ['dva'],

  doomfist: ['doomfist'],
  hazard: ['hazard'],
  junkerqueen: ['junker_queen', 'junker-queen', 'junkerqueen'],
  'junker queen': ['junker_queen', 'junker-queen', 'junkerqueen'],
  mauga: ['mauga'],
  orisa: ['orisa'],
  ramattra: ['ramattra'],
  reinhardt: ['reinhardt'],
  roadhog: ['roadhog'],
  sigma: ['sigma'],
  winston: ['winston'],
  wreckingball: ['wrecking_ball', 'wrecking-ball', 'wreckingball'],
  'wrecking ball': ['wrecking_ball', 'wrecking-ball', 'wreckingball'],
  zarya: ['zarya'],

  ashe: ['ashe'],
  bastion: ['bastion'],
  cassidy: ['cassidy'],
  echo: ['echo'],
  genji: ['genji'],
  hanzo: ['hanzo'],
  junkrat: ['junkrat'],
  mei: ['mei'],
  pharah: ['pharah'],
  reaper: ['reaper'],
  sojourn: ['sojourn'],
  soldier76: ['soldier_76', 'soldier-76', 'soldier76'],
  'soldier 76': ['soldier_76', 'soldier-76', 'soldier76'],
  sombra: ['sombra'],
  symmetra: ['symmetra'],
  torbjorn: ['torbjorn'],
  tracer: ['tracer'],
  venture: ['venture'],
  探奇: ['venture'],
  widowmaker: ['widowmaker'],

  ana: ['ana'],
  baptiste: ['baptiste'],
  brigitte: ['brigitte'],
  illari: ['illari'],
  juno: ['juno'],
  kiriko: ['kiriko'],
  lifeweaver: ['lifeweaver'],
  lucio: ['lucio'],
  lúcio: ['lucio'],
  mercy: ['mercy'],
  moira: ['moira'],
  zenyatta: ['zenyatta'],
  jetpackcat: ['jetpack_cat', 'jetpack-cat', 'jetpackcat'],
  'jetpack cat': ['jetpack_cat', 'jetpack-cat', 'jetpackcat']
};

const safeText = v => String(v ?? '').trim();

function formatRank(rank) {
  const n = Number(rank);
  if (!Number.isFinite(n)) return '--';
  return String(n).padStart(2, '0');
}

function unique(arr) {
  return [...new Set(arr.filter(Boolean).map(String))];
}

function isTeamBoard(boardType) {
  return safeText(boardType).toUpperCase() === 'TEAM';
}

function slugifyHeroName(value) {
  const raw = safeText(value);
  if (!raw) return [];

  const lower = raw
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (Array.isArray(HERO_SLUG_MAP[raw])) return HERO_SLUG_MAP[raw];
  if (Array.isArray(HERO_SLUG_MAP[lower])) return HERO_SLUG_MAP[lower];

  const underscore = lower.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const hyphen = lower.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const compact = lower.replace(/[^a-z0-9]+/g, '');

  return [...new Set([underscore, hyphen, compact].filter(Boolean))];
}

function roleFolders(role) {
  const r = safeText(role).toUpperCase();
  if (r === 'TANK') return ['tank'];
  if (r === 'SUP' || r === 'SUPPORT') return ['support'];
  if (r === 'DPS' || r === 'DAMAGE') return ['damage', 'dps'];
  return ['tank', 'damage', 'dps', 'support'];
}

function inferHeroImages(row) {
  const heroName = safeText(row?.heroName) || safeText(row?.hero);
  const slugs = slugifyHeroName(heroName);
  const folders = roleFolders(row?.role);
  return slugs.flatMap(slug => folders.map(folder => `/assets/heroes/${folder}/${slug}.png`));
}

function inferRosterImages(row) {
  const heroName = safeText(row?.heroName) || safeText(row?.hero);
  const slugs = slugifyHeroName(heroName);
  const folders = roleFolders(row?.role);
  return slugs.flatMap(slug => folders.map(folder => `/assets/roster/${folder}/${slug}.png`));
}

function getIconSources(row) {
  return unique([
    ...(Array.isArray(row?.heroImages) ? row.heroImages : []),
    row?.heroImage,
    ...inferHeroImages(row),

    ...(Array.isArray(row?.rosterImages) ? row.rosterImages : []),
    row?.rosterImage,
    ...inferRosterImages(row)
  ]);
}

function getBackgroundSources(row) {
  return unique([
    ...(Array.isArray(row?.rosterImages) ? row.rosterImages : []),
    row?.rosterImage,
    ...inferRosterImages(row),

    ...(Array.isArray(row?.heroImages) ? row.heroImages : []),
    row?.heroImage,
    ...inferHeroImages(row)
  ]);
}

function getLogoAssetByName(value) {
  const raw = safeText(value);
  if (!raw) return '';

  const candidates = unique([
    raw,
    raw.toUpperCase(),
    raw.replace(/\s+/g, ''),
    raw.replace(/\s+/g, '').toUpperCase()
  ]);

  const entries = Object.entries(TEAM_LOGOS);

  for (const candidate of candidates) {
    const hit = entries.find(([path]) => path.endsWith(`/logos/${candidate}.png`));
    if (hit) return hit[1];
  }

  return '';
}

function getTeamLogoSources(row) {
  const teamShort = safeText(row?.teamShort) || safeText(row?.name);
  const teamName = safeText(row?.name);

  return unique([
    row?.logoImage,
    row?.teamLogo,
    ...(Array.isArray(row?.logoImages) ? row.logoImages : []),
    getLogoAssetByName(teamShort),
    getLogoAssetByName(teamName)
  ]);
}

function getEntityIconSources(row, boardType) {
  return isTeamBoard(boardType) ? getTeamLogoSources(row) : getIconSources(row);
}

function getEntityBackgroundSources(row, boardType) {
  return isTeamBoard(boardType) ? getTeamLogoSources(row) : getBackgroundSources(row);
}

function getTeamKey(row) {
  return safeText(row?.teamShort || row?.name).toUpperCase();
}

function getTeamLogoPlate(row) {
  const key = getTeamKey(row);
  const mode = TEAM_LOGO_PLATE[key] || 'dark';

  if (mode === 'light') {
    return {
      mode,
      innerBg: 'rgba(255,255,255,0.92)',
      innerBorder: '1px solid rgba(255,255,255,0.18)',
      imgFilter: 'none',
      imgOpacity: 1
    };
  }

  if (mode === 'yellow') {
    return {
      mode,
      innerBg: COLORS.yellow,
      innerBorder: '1px solid rgba(0,0,0,0.16)',
      imgFilter: 'none',
      imgOpacity: 1
    };
  }

  return {
    mode,
    innerBg: 'rgba(0,0,0,0.34)',
    innerBorder: '1px solid rgba(255,255,255,0.14)',
    imgFilter: 'none',
    imgOpacity: 1
  };
}

function normaliseRows(rows) {
  const input = Array.isArray(rows) ? rows : [];

  return Array.from({ length: 8 }, (_, i) => {
    const row = input[i] || {};
    return {
      rank: row.rank || i + 1,
      name: safeText(row.name) || '-',
      battleTag: safeText(row.battleTag) || safeText(row.battletag) || safeText(row.battle_tag) || '',
      sub: safeText(row.sub) || '-',
      teamShort: safeText(row.teamShort) || safeText(row.team_short_name) || '',
      role: safeText(row.role) || '',
      value: safeText(row.value) || '-',

      heroName: safeText(row.heroName) || safeText(row.hero) || '',
      heroImage: safeText(row.heroImage) || '',
      heroImages: Array.isArray(row.heroImages) ? row.heroImages : [],
      rosterImage: safeText(row.rosterImage) || '',
      rosterImages: Array.isArray(row.rosterImages) ? row.rosterImages : [],

      logoImage: safeText(row.logoImage) || safeText(row.teamLogo) || '',
      logoImages: Array.isArray(row.logoImages) ? row.logoImages : []
    };
  });
}

function isEmptyRow(row) {
  return !row || row.name === '-' || row.value === '-';
}

function Background() {
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, backgroundColor: COLORS.black, zIndex: 0 }} />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px),
            linear-gradient(180deg, rgba(255,255,255,0.022) 1px, transparent 1px)
          `,
          backgroundSize: '96px 96px',
          opacity: 0.2,
          zIndex: 1
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: -150,
          top: 130,
          width: 540,
          height: 540,
          border: '1px solid rgba(244,195,32,0.07)',
          transform: 'rotate(45deg)',
          zIndex: 1
        }}
      />

      <div
        style={{
          position: 'absolute',
          right: -160,
          bottom: -130,
          width: 620,
          height: 620,
          border: '1px solid rgba(255,255,255,0.04)',
          transform: 'rotate(45deg)',
          zIndex: 1
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 84,
          right: 84,
          bottom: 34,
          height: 1,
          background: COLORS.lineStrong,
          zIndex: 3
        }}
      />
    </>
  );
}

function TopBar({ boardType, metricLabel }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 46,
        borderBottom: UI.frame,
        background: 'rgba(16,16,16,0.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 34px',
        boxSizing: 'border-box',
        zIndex: 20
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 10, height: 10, background: COLORS.yellow }} />
        <div
          style={{
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: 2.2,
            color: COLORS.softWhite,
            textTransform: 'uppercase'
          }}
        >
          FRIES CUP // DATA REPORT
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: 2,
            color: COLORS.faintWhite,
            textTransform: 'uppercase'
          }}
        >
          TOP 8 // {safeText(metricLabel) || 'PRIMARY METRIC'}
        </div>

        <div
          style={{
            padding: '6px 12px',
            border: UI.frameStrong,
            color: COLORS.yellow,
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: 2,
            textTransform: 'uppercase'
          }}
        >
          {safeText(boardType) || 'PLAYER'}
        </div>
      </div>
    </div>
  );
}

function Header({ title, subtitle, boardType, metricLabel }) {
  return (
    <div
      style={{
        height: 158,
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) 300px',
        gap: 28,
        alignItems: 'end',
        borderBottom: `3px solid ${COLORS.yellow}`,
        paddingBottom: 20,
        boxSizing: 'border-box'
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            color: COLORS.yellow,
            fontSize: 17,
            fontWeight: 900,
            letterSpacing: 4,
            textTransform: 'uppercase',
            marginBottom: 12
          }}
        >
          {safeText(subtitle) || 'PLAYOFF DATA SNAPSHOT'}
        </div>

        <div
          style={{
            color: COLORS.white,
            fontSize: 74,
            fontWeight: 950,
            letterSpacing: 1,
            lineHeight: 0.92,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {safeText(title) || 'LEADERBOARD'}
        </div>
      </div>

      <div
        style={{
          justifySelf: 'end',
          width: '100%',
          border: UI.frame,
          background: 'rgba(255,255,255,0.025)',
          padding: '16px 18px',
          boxSizing: 'border-box'
        }}
      >
        <div
          style={{
            color: COLORS.faintWhite,
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: 1.8,
            marginBottom: 7,
            textTransform: 'uppercase'
          }}
        >
          {safeText(boardType) || 'PLAYER'} LEADERBOARD
        </div>

        <div
          style={{
            color: COLORS.yellow,
            fontSize: 22,
            fontWeight: 950,
            letterSpacing: 1.4,
            lineHeight: 1,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {safeText(metricLabel) || 'PRIMARY METRIC'}
        </div>

        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: UI.frame,
            color: COLORS.faintWhite,
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: 1.6,
            textTransform: 'uppercase'
          }}
        >
          RANKING SNAPSHOT
        </div>
      </div>
    </div>
  );
}

function ArtworkBackground({ row, boardType }) {
  const sources = useMemo(() => getEntityBackgroundSources(row, boardType), [row, boardType]);
  const [idx, setIdx] = useState(0);
  const src = sources[idx];
  const team = isTeamBoard(boardType);

  useEffect(() => setIdx(0), [sources.join('|')]);

  if (!src) return null;

  return (
    <>
      <img
        src={src}
        alt=""
        onError={() => {
          if (idx < sources.length - 1) setIdx(idx + 1);
          else setIdx(sources.length);
        }}
        style={{
          position: 'absolute',
          ...(team
            ? {
                right: -140,
                top: 30,
                width: 620,
                height: 620,
                objectFit: 'contain',
                objectPosition: 'right center',
                opacity: 0.14,
                filter: 'grayscale(1) contrast(1.18) brightness(1.08)',
                transform: 'none',
                transformOrigin: 'center'
              }
            : {
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: '38% center',
                transform: 'scale(1.18)',
                transformOrigin: '38% center',
                opacity: 0.24,
                filter: 'grayscale(1) contrast(1.35) brightness(1.05)'
              }),
          mixBlendMode: 'screen',
          pointerEvents: 'none',
          zIndex: 1,
          WebkitMaskImage: team
            ? 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.16) 22%, rgba(0,0,0,0.72) 48%, #000 100%)'
            : 'linear-gradient(90deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.42) 26%, rgba(0,0,0,0.86) 52%, #000 100%)',
          maskImage: team
            ? 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.16) 22%, rgba(0,0,0,0.72) 48%, #000 100%)'
            : 'linear-gradient(90deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.42) 26%, rgba(0,0,0,0.86) 52%, #000 100%)'
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: team
            ? 'linear-gradient(90deg, rgba(16,16,16,0.98) 0%, rgba(16,16,16,0.94) 42%, rgba(16,16,16,0.62) 70%, rgba(16,16,16,0.26) 100%)'
            : 'linear-gradient(90deg, rgba(16,16,16,0.96) 0%, rgba(16,16,16,0.9) 34%, rgba(16,16,16,0.56) 64%, rgba(16,16,16,0.22) 100%)',
          zIndex: 2,
          pointerEvents: 'none'
        }}
      />
    </>
  );
}

function EntityThumb({ row, size = 56, accent = false, boardType = 'PLAYER' }) {
  const sources = useMemo(() => getEntityIconSources(row, boardType), [row, boardType]);
  const [idx, setIdx] = useState(0);
  const src = sources[idx];
  const team = isTeamBoard(boardType);
  const plate = team ? getTeamLogoPlate(row) : null;

  useEffect(() => setIdx(0), [sources.join('|')]);

  const label = team
    ? safeText(row?.teamShort) || safeText(row?.name) || 'TEAM'
    : safeText(row?.heroName) || safeText(row?.role) || 'HERO';

  return (
    <div
      style={{
        width: size,
        height: size,
        border: accent ? `1px solid ${COLORS.yellow}` : UI.frameStrong,
        background: team ? 'rgba(0,0,0,0.42)' : 'rgba(0,0,0,0.38)',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: accent ? '0 0 0 1px rgba(244,195,32,0.1)' : 'none'
      }}
    >
      {team ? (
        <div
          style={{
            position: 'absolute',
            inset: Math.max(4, Math.round(size * 0.08)),
            background: plate.innerBg,
            border: plate.innerBorder,
            boxSizing: 'border-box',
            zIndex: 1
          }}
        />
      ) : null}

      {src ? (
        <img
          src={src}
          alt=""
          onError={() => {
            if (idx < sources.length - 1) setIdx(idx + 1);
            else setIdx(sources.length);
          }}
          style={{
            position: 'relative',
            zIndex: 2,
            width: team ? '68%' : '100%',
            height: team ? '68%' : '100%',
            objectFit: team ? 'contain' : 'cover',
            objectPosition: 'center',
            opacity: team ? plate.imgOpacity : accent ? 0.92 : 0.74,
            filter: team
              ? plate.imgFilter
              : accent
                ? 'grayscale(0.25) contrast(1.08)'
                : 'grayscale(0.72) contrast(1.12)'
          }}
        />
      ) : (
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: team
              ? plate.mode === 'yellow'
                ? COLORS.black
                : COLORS.yellow
              : accent
                ? COLORS.yellow
                : COLORS.faintWhite,
            fontSize: size >= 60 ? 18 : 12,
            fontWeight: 950,
            letterSpacing: 1.2,
            textTransform: 'uppercase'
          }}
        >
          {label.slice(0, 3)}
        </div>
      )}

      {!team ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: accent ? 4 : 3,
            height: '100%',
            background: accent ? COLORS.yellow : 'rgba(255,255,255,0.22)',
            zIndex: 3
          }}
        />
      ) : null}
    </div>
  );
}

function RankBlock({ rank, large = false }) {
  return (
    <div
      style={{
        width: large ? 112 : 58,
        height: large ? 112 : 54,
        background: Number(rank) === 1 ? COLORS.yellow : 'rgba(255,255,255,0.045)',
        border: Number(rank) === 1 ? `1px solid ${COLORS.yellow}` : UI.frameStrong,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
    >
      <span
        style={{
          color: Number(rank) === 1 ? COLORS.black : COLORS.white,
          fontSize: large ? 48 : 24,
          fontWeight: 950,
          fontStyle: 'italic',
          letterSpacing: -1,
          fontVariantNumeric: 'tabular-nums'
        }}
      >
        {formatRank(rank)}
      </span>
    </div>
  );
}

function IdentityBlock({
  row,
  boardType = 'PLAYER',
  nameSize = 30,
  tagSize = 10,
  subSize = 11,
  accent = false,
  showSub = true
}) {
  const empty = isEmptyRow(row);
  const team = isTeamBoard(boardType);

  return (
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          color: empty ? COLORS.mutedWhite : COLORS.white,
          fontSize: nameSize,
          fontWeight: 950,
          lineHeight: 1,
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        {safeText(row.name) || '-'}
      </div>

      {!team ? (
        <div
          style={{
            marginTop: Math.max(4, Math.round(nameSize * 0.16)),
            color: COLORS.softWhite,
            fontSize: tagSize,
            fontWeight: 900,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            opacity: row.battleTag ? 1 : 0.32
          }}
        >
          {safeText(row.battleTag) || 'BATTLETAG N/A'}
        </div>
      ) : null}

      {showSub ? (
        <div
          style={{
            marginTop: team ? Math.max(6, Math.round(nameSize * 0.18)) : Math.max(5, Math.round(nameSize * 0.18)),
            color: accent ? COLORS.yellow : COLORS.faintWhite,
            fontSize: subSize,
            fontWeight: 900,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {safeText(row.sub) || '-'}
        </div>
      ) : null}
    </div>
  );
}

function ValueBlock({ row, metricLabel, valueSize = 42, showMetric = true, accent = false }) {
  return (
    <div style={{ textAlign: 'right', minWidth: 0 }}>
      <div
        style={{
          color: COLORS.white,
          fontSize: valueSize,
          fontWeight: 950,
          letterSpacing: -1.5,
          lineHeight: 0.92,
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap'
        }}
      >
        {safeText(row.value) || '-'}
      </div>

      {showMetric ? (
        <div
          style={{
            marginTop: 8,
            color: accent ? COLORS.yellow : COLORS.faintWhite,
            fontSize: 9,
            fontWeight: 900,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {safeText(metricLabel) || 'METRIC'}
        </div>
      ) : null}
    </div>
  );
}

function HeroCard({ row, metricLabel, boardType }) {
  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        border: UI.yellowFrame,
        background: 'rgba(16,16,16,0.64)',
        boxShadow: UI.yellowGlow,
        overflow: 'hidden'
      }}
    >
      <ArtworkBackground row={row} boardType={boardType} />

      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 10, background: COLORS.yellow, zIndex: 5 }} />

      <div
        style={{
          position: 'absolute',
          right: -42,
          top: -56,
          color: 'rgba(244,195,32,0.07)',
          fontSize: 300,
          lineHeight: 1,
          fontWeight: 950,
          fontStyle: 'italic',
          letterSpacing: -20,
          zIndex: 3
        }}
      >
        01
      </div>

      <div
        style={{
          position: 'relative',
          zIndex: 6,
          height: '100%',
          padding: '42px 48px 42px 58px',
          boxSizing: 'border-box',
          display: 'grid',
          gridTemplateRows: 'auto minmax(0,1fr) auto',
          gap: 28
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}>
          <RankBlock rank={row.rank || 1} large />
          <div
            style={{
              color: COLORS.yellow,
              fontSize: 13,
              fontWeight: 950,
              letterSpacing: 2.4,
              textTransform: 'uppercase',
              paddingTop: 8
            }}
          >
            TOP PERFORMER
          </div>
        </div>

        <div
          style={{
            alignSelf: 'end',
            display: 'grid',
            gridTemplateColumns: '78px minmax(0,1fr)',
            gap: 18,
            maxWidth: 470
          }}
        >
          <EntityThumb row={row} size={78} accent boardType={boardType} />
          <IdentityBlock row={row} boardType={boardType} nameSize={48} tagSize={13} subSize={15} accent />
        </div>

        <div>
          <div
            style={{
              color: COLORS.white,
              fontSize: 92,
              fontWeight: 950,
              letterSpacing: -4,
              lineHeight: 0.86,
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap'
            }}
          >
            {safeText(row.value) || '-'}
          </div>

          <div
            style={{
              marginTop: 14,
              color: COLORS.yellow,
              fontSize: 16,
              fontWeight: 900,
              letterSpacing: 2.4,
              textTransform: 'uppercase'
            }}
          >
            {safeText(metricLabel) || 'PRIMARY METRIC'}
          </div>
        </div>
      </div>
    </div>
  );
}

function PodiumCard({ row, metricLabel, rank, boardType }) {
  return (
    <div
      style={{
        minHeight: 138,
        border: rank === 2 ? UI.frameStrong : UI.frame,
        background: rank === 2 ? 'rgba(255,255,255,0.055)' : 'rgba(255,255,255,0.032)',
        padding: '18px 22px',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 5,
          height: '100%',
          background: rank === 2 ? 'rgba(255,255,255,0.62)' : 'rgba(255,255,255,0.32)',
          zIndex: 2
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 3,
          height: '100%',
          display: 'grid',
          gridTemplateColumns: '62px 74px minmax(0,1fr) 160px',
          gap: 18,
          alignItems: 'center'
        }}
      >
        <RankBlock rank={row.rank} />
        <EntityThumb row={row} size={74} accent={rank === 2} boardType={boardType} />
        <IdentityBlock row={row} boardType={boardType} nameSize={30} tagSize={10} subSize={11} accent={rank === 2} />
        <ValueBlock row={row} metricLabel={metricLabel} valueSize={42} showMetric />
      </div>
    </div>
  );
}

function ListRow({ row, index, boardType }) {
  const empty = isEmptyRow(row);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '54px 50px minmax(0,1fr) 124px 142px',
        alignItems: 'center',
        height: '100%',
        minHeight: 0,
        border: UI.frame,
        background: index % 2 === 0 ? 'rgba(255,255,255,0.026)' : 'rgba(255,255,255,0.038)',
        overflow: 'hidden',
        paddingRight: 16,
        boxSizing: 'border-box'
      }}
    >
      <div
        style={{
          height: '100%',
          borderRight: UI.frame,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <span
          style={{
            color: empty ? COLORS.faintWhite : COLORS.white,
            fontSize: 20,
            fontWeight: 950,
            fontStyle: 'italic',
            fontVariantNumeric: 'tabular-nums'
          }}
        >
          {formatRank(row.rank)}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <EntityThumb row={row} size={44} boardType={boardType} />
      </div>

      <div style={{ minWidth: 0, padding: '0 14px 0 8px', boxSizing: 'border-box' }}>
        <IdentityBlock row={row} boardType={boardType} nameSize={20} tagSize={8} subSize={0} showSub={false} />
      </div>

      <div
        style={{
          color: COLORS.faintWhite,
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          paddingRight: 12,
          boxSizing: 'border-box'
        }}
      >
        {safeText(row.sub) || '-'}
      </div>

      <ValueBlock row={row} metricLabel="" valueSize={32} showMetric={false} />
    </div>
  );
}

function LeaderboardBody({ rows, metricLabel, boardType }) {
  const top = rows[0];
  const second = rows[1];
  const third = rows[2];
  const rest = rows.slice(3, 8);

  return (
    <div
      style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '690px minmax(0,1fr)',
        gap: 24,
        minHeight: 0
      }}
    >
      <HeroCard row={top} metricLabel={metricLabel} boardType={boardType} />

      <div
        style={{
          display: 'grid',
          gridTemplateRows: '138px 138px minmax(0,1fr)',
          gap: 16,
          minHeight: 0
        }}
      >
        <PodiumCard row={second} metricLabel={metricLabel} rank={2} boardType={boardType} />
        <PodiumCard row={third} metricLabel={metricLabel} rank={3} boardType={boardType} />

        <div
          style={{
            display: 'grid',
            gridTemplateRows: 'repeat(5, minmax(0, 1fr))',
            gap: 8,
            minHeight: 0
          }}
        >
          {rest.map((row, idx) => (
            <ListRow key={`lb_row_${idx}`} row={row} index={idx} boardType={boardType} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LeaderboardScene({ matchData = {} }) {
  const data = matchData.leaderboardData || {};

  const title = safeText(data.title) || 'LEADERBOARD';
  const subtitle = safeText(data.subtitle) || 'PLAYOFF DATA SNAPSHOT';
  const boardType = safeText(data.boardType || 'PLAYER').toUpperCase();
  const metricLabel = safeText(data.metricLabel) || safeText(data.metric) || 'PRIMARY METRIC';
  const rows = normaliseRows(data.rows);

  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: COLORS.black,
        fontFamily: '"HarmonyOS Sans SC", "Noto Sans SC", Arial, sans-serif'
      }}
    >
      <Background />
      <TopBar boardType={boardType} metricLabel={metricLabel} />

      <div
        style={{
          position: 'absolute',
          top: 88,
          left: 118,
          right: 118,
          bottom: 68,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 26
        }}
      >
        <Header title={title} subtitle={subtitle} boardType={boardType} metricLabel={metricLabel} />
        <LeaderboardBody rows={rows} metricLabel={metricLabel} boardType={boardType} />
      </div>

      <div
        style={{
          position: 'absolute',
          left: 82,
          bottom: 14,
          zIndex: 20,
          color: 'rgba(255,255,255,0.24)',
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: 1.4,
          textTransform: 'uppercase'
        }}
      >
        FRIES_CUP_DATA_ENGINE // LEADERBOARD_ANALYTICS // {safeText(data.generatedAt) || 'FCUP 2026'}
      </div>
    </div>
  );
}