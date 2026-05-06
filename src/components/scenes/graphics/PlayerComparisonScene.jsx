import React, { useEffect, useMemo, useState } from 'react';

const COLORS = {
  black: '#2a2a2a',
  yellow: '#f4c320',
  white: '#ffffff',
  deepBlack: '#101010',
  panel: '#141414',
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
  '探奇': ['venture'],
  widowmaker: ['widowmaker'],
  ana: ['ana'],
  baptiste: ['baptiste'],
  brigitte: ['brigitte'],
  illari: ['illari'],
  juno: ['juno'],
  kiriko: ['kiriko'],
  lifeweaver: ['lifeweaver'],
  lucio: ['lucio'],
  'lúcio': ['lucio'],
  mercy: ['mercy'],
  moira: ['moira'],
  zenyatta: ['zenyatta'],
  jetpackcat: ['jetpack_cat', 'jetpack-cat', 'jetpackcat'],
  'jetpack cat': ['jetpack_cat', 'jetpack-cat', 'jetpackcat']
};

const safeText = v => String(v ?? '').trim();
const unique = arr => [...new Set(arr.filter(Boolean).map(String))];

function toNum(value) {
  const raw = safeText(value).replace(/,/g, '').replace(/%/g, '');
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function slugifyHeroName(value) {
  const raw = safeText(value);
  if (!raw) return [];

  const lower = raw.toLowerCase().replace(/_/g, ' ').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();

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

function inferHeroImages(hero, role) {
  const slugs = slugifyHeroName(hero);
  const folders = roleFolders(role);
  return slugs.flatMap(slug => folders.map(folder => `/assets/heroes/${folder}/${slug}.png`));
}

function inferRosterImages(hero, role) {
  const slugs = slugifyHeroName(hero);
  const folders = roleFolders(role);
  return slugs.flatMap(slug => folders.map(folder => `/assets/roster/${folder}/${slug}.png`));
}

function getHeroIconSources(player) {
  return unique([
    ...(Array.isArray(player.heroImages) ? player.heroImages : []),
    player.heroImage,
    ...inferHeroImages(player.hero, player.role),
    ...(Array.isArray(player.rosterImages) ? player.rosterImages : []),
    player.rosterImage,
    ...inferRosterImages(player.hero, player.role)
  ]);
}

function getHeroBackgroundSources(player) {
  return unique([
    ...(Array.isArray(player.rosterImages) ? player.rosterImages : []),
    player.rosterImage,
    ...inferRosterImages(player.hero, player.role),
    ...(Array.isArray(player.heroImages) ? player.heroImages : []),
    player.heroImage,
    ...inferHeroImages(player.hero, player.role)
  ]);
}

function isReverseMetric(label) {
  const text = safeText(label).toLowerCase();
  return text.includes('死亡') || text.includes('阵亡') || text.includes('death') || text.includes('deaths') || text.includes('dth');
}

function getComparisonState(label, valA, valB) {
  const numA = toNum(valA);
  const numB = toNum(valB);
  const reverse = isReverseMetric(label);

  if (numA === numB) return { isAWin: false, isBWin: false, pctA: numA > 0 ? 50 : 2, pctB: numB > 0 ? 50 : 2 };

  const maxVal = Math.max(numA, numB) || 1;

  if (reverse) {
    return {
      isAWin: numA < numB,
      isBWin: numB < numA,
      pctA: Math.max(4, ((maxVal - numA) / maxVal) * 100),
      pctB: Math.max(4, ((maxVal - numB) / maxVal) * 100)
    };
  }

  return {
    isAWin: numA > numB,
    isBWin: numB > numA,
    pctA: Math.max(4, (numA / maxVal) * 100),
    pctB: Math.max(4, (numB / maxVal) * 100)
  };
}

function VsText({ size = 132, shadow = '0 0 34px rgba(244,195,32,0.28)' }) {
  const offset = Math.round(size * -0.06);
  const spacing = Math.round(size * -0.038);

  return (
    <div
      style={{
        height: Math.round(size * 0.82),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <span
        style={{
          display: 'inline-block',
          color: COLORS.yellow,
          fontSize: size,
          fontWeight: 950,
          lineHeight: 0.78,
          fontStyle: 'normal',
          letterSpacing: spacing,
          transform: `translateX(${offset}px) skewX(-10deg)`,
          transformOrigin: 'center center',
          textShadow: shadow
        }}
      >
        VS
      </span>
    </div>
  );
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

function TopBar({ presetKey }) {
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
          PLAYER COMPARISON // {safeText(presetKey) || 'H2H'}
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
          DUEL POSTER
        </div>
      </div>
    </div>
  );
}

function Header({ title, subtitle, presetKey }) {
  return (
    <div
      style={{
        height: 126,
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) 260px',
        gap: 28,
        alignItems: 'end',
        borderBottom: `3px solid ${COLORS.yellow}`,
        paddingBottom: 16,
        boxSizing: 'border-box'
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            color: COLORS.yellow,
            fontSize: 16,
            fontWeight: 900,
            letterSpacing: 4,
            textTransform: 'uppercase',
            marginBottom: 10
          }}
        >
          {safeText(subtitle) || 'PLAYER HEAD TO HEAD'}
        </div>

        <div
          style={{
            color: COLORS.white,
            fontSize: 68,
            fontWeight: 950,
            letterSpacing: 1,
            lineHeight: 0.92,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {safeText(title) || '选手对位'}
        </div>
      </div>

      <div
        style={{
          justifySelf: 'end',
          width: 260,
          border: UI.frame,
          background: 'rgba(255,255,255,0.018)',
          padding: '14px 16px',
          boxSizing: 'border-box'
        }}
      >
        <div
          style={{
            color: COLORS.faintWhite,
            fontSize: 9,
            fontWeight: 950,
            letterSpacing: 1.8,
            textTransform: 'uppercase',
            marginBottom: 8
          }}
        >
          MATCHUP TYPE
        </div>

        <div
          style={{
            color: COLORS.yellow,
            fontSize: 26,
            fontWeight: 950,
            letterSpacing: 1.4,
            lineHeight: 1,
            textTransform: 'uppercase'
          }}
        >
          {safeText(presetKey) || 'H2H'}
        </div>

        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: UI.frame,
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            color: COLORS.faintWhite,
            fontSize: 9,
            fontWeight: 900,
            letterSpacing: 1.4,
            textTransform: 'uppercase'
          }}
        >
          <span>PLAYER H2H</span>
          <span>5 METRICS</span>
        </div>
      </div>
    </div>
  );
}

function ImageWithFallback({ sources = [], alt = '', style = {}, fallback = null }) {
  const cleanSources = useMemo(() => unique(sources), [sources.join('|')]);
  const [idx, setIdx] = useState(0);
  const src = cleanSources[idx];

  useEffect(() => setIdx(0), [cleanSources.join('|')]);

  if (!src) return fallback;

  return (
    <img
      src={src}
      alt={alt}
      onError={() => {
        if (idx < cleanSources.length - 1) setIdx(idx + 1);
        else setIdx(cleanSources.length);
      }}
      style={style}
    />
  );
}

function HeroThumb({ player, size = 78, accent = false }) {
  const sources = useMemo(() => getHeroIconSources(player), [player]);
  const label = safeText(player.hero) || safeText(player.role) || 'HERO';

  return (
    <div
      style={{
        width: size,
        height: size,
        border: accent ? `1px solid ${COLORS.yellow}` : UI.frameStrong,
        background: 'rgba(0,0,0,0.34)',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0
      }}
    >
      <ImageWithFallback
        sources={sources}
        alt=""
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          opacity: accent ? 0.92 : 0.74,
          filter: accent ? 'grayscale(0.2) contrast(1.08)' : 'grayscale(0.72) contrast(1.12)'
        }}
        fallback={
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: accent ? COLORS.yellow : COLORS.faintWhite,
              fontSize: size >= 60 ? 18 : 12,
              fontWeight: 950,
              letterSpacing: 1.2,
              textTransform: 'uppercase'
            }}
          >
            {label.slice(0, 3)}
          </div>
        }
      />

      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: accent ? 4 : 3,
          height: '100%',
          background: accent ? COLORS.yellow : 'rgba(255,255,255,0.22)'
        }}
      />
    </div>
  );
}

function PosterHeroImage({ player, side = 'left' }) {
  const sources = useMemo(() => getHeroBackgroundSources(player), [player]);
  const right = side === 'right';
  const cropPosition = '38% center';

  return (
    <ImageWithFallback
      sources={sources}
      alt=""
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: cropPosition,
        transform: right ? 'scaleX(-1) scale(1.28)' : 'scale(1.28)',
        transformOrigin: 'center center',
        opacity: 0.42,
        filter: 'grayscale(0.72) contrast(1.22) brightness(0.96)',
        mixBlendMode: 'screen',
        pointerEvents: 'none',
        zIndex: 1,
        WebkitMaskImage: right
          ? 'linear-gradient(270deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.48) 22%, rgba(0,0,0,0.9) 54%, #000 100%)'
          : 'linear-gradient(90deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.48) 22%, rgba(0,0,0,0.9) 54%, #000 100%)',
        maskImage: right
          ? 'linear-gradient(270deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.48) 22%, rgba(0,0,0,0.9) 54%, #000 100%)'
          : 'linear-gradient(90deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.48) 22%, rgba(0,0,0,0.9) 54%, #000 100%)'
      }}
    />
  );
}

function PosterPlayerSide({ player, side = 'left' }) {
  const right = side === 'right';

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        [right ? 'right' : 'left']: 0,
        width: '52%',
        overflow: 'hidden',
        clipPath: right ? 'polygon(11% 0, 100% 0, 100% 100%, 0 100%)' : 'polygon(0 0, 89% 0, 100% 100%, 0 100%)',
        background: right
          ? 'linear-gradient(270deg, rgba(20,20,20,0.98), rgba(16,16,16,0.72))'
          : 'linear-gradient(90deg, rgba(20,20,20,0.98), rgba(16,16,16,0.72))',
        zIndex: 2
      }}
    >
      <PosterHeroImage player={player} side={side} />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: right
            ? 'linear-gradient(270deg, rgba(16,16,16,0.98) 0%, rgba(16,16,16,0.74) 42%, rgba(16,16,16,0.32) 100%)'
            : 'linear-gradient(90deg, rgba(16,16,16,0.98) 0%, rgba(16,16,16,0.74) 42%, rgba(16,16,16,0.32) 100%)',
          zIndex: 2
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 38,
          [right ? 'right' : 'left']: 44,
          zIndex: 5,
          display: 'flex',
          flexDirection: right ? 'row-reverse' : 'row',
          gap: 10,
          alignItems: 'center'
        }}
      >
        <div
          style={{
            padding: '8px 13px',
            background: COLORS.yellow,
            color: COLORS.black,
            fontSize: 12,
            fontWeight: 950,
            letterSpacing: 1.6,
            textTransform: 'uppercase',
            lineHeight: 1
          }}
        >
          {safeText(player.team) || 'TEAM'}
        </div>

        <div
          style={{
            padding: '8px 13px',
            border: UI.frameStrong,
            color: COLORS.softWhite,
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
            lineHeight: 1,
            background: 'rgba(0,0,0,0.28)'
          }}
        >
          {safeText(player.role) || 'ROLE'}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          zIndex: 5,
          [right ? 'right' : 'left']: 44,
          bottom: 42,
          width: 560,
          textAlign: right ? 'right' : 'left'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: right ? 'row-reverse' : 'row',
            alignItems: 'center',
            gap: 18,
            marginBottom: 18
          }}
        >
          <HeroThumb player={player} size={84} accent />

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                color: COLORS.yellow,
                fontSize: 12,
                fontWeight: 950,
                letterSpacing: 2.4,
                textTransform: 'uppercase',
                marginBottom: 8
              }}
            >
              {right ? 'PLAYER B' : 'PLAYER A'}
            </div>

            <div
              style={{
                color: COLORS.softWhite,
                fontSize: 14,
                fontWeight: 900,
                letterSpacing: 1.4,
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {safeText(player.hero) || 'SIGNATURE HERO'}
            </div>
          </div>
        </div>

        <div
          style={{
            color: COLORS.white,
            fontSize: 76,
            fontWeight: 950,
            lineHeight: 0.88,
            letterSpacing: -2.6,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {safeText(player.name) || '-'}
        </div>

        <div
          style={{
            marginTop: 14,
            color: COLORS.softWhite,
            fontSize: 17,
            fontWeight: 900,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            opacity: player.battletag ? 1 : 0.36
          }}
        >
          {safeText(player.battletag) || 'BATTLETAG N/A'}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          [right ? 'right' : 'left']: 0,
          top: 0,
          bottom: 0,
          width: 8,
          background: COLORS.yellow,
          zIndex: 6
        }}
      />
    </div>
  );
}

function PosterVsCore({ presetKey }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 310,
        height: 310,
        zIndex: 15,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none'
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 210,
          height: 520,
          background: 'linear-gradient(180deg, rgba(244,195,32,0), rgba(244,195,32,0.18), rgba(244,195,32,0))',
          transform: 'rotate(13deg)',
          borderLeft: '2px solid rgba(244,195,32,0.6)',
          borderRight: '1px solid rgba(244,195,32,0.22)',
          boxShadow: '0 0 42px rgba(244,195,32,0.16)'
        }}
      />

      <div
        style={{
          position: 'absolute',
          width: 238,
          height: 238,
          border: '1px solid rgba(244,195,32,0.34)',
          background: 'rgba(16,16,16,0.76)',
          transform: 'rotate(45deg)',
          boxShadow: '0 0 0 1px rgba(244,195,32,0.08), 0 20px 60px rgba(0,0,0,0.42)'
        }}
      />

      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
        <div
          style={{
            color: COLORS.faintWhite,
            fontSize: 11,
            fontWeight: 950,
            letterSpacing: 2.6,
            textTransform: 'uppercase',
            marginBottom: 10
          }}
        >
          HEAD TO HEAD
        </div>

        <VsText size={132} />

        <div
          style={{
            color: COLORS.softWhite,
            fontSize: 12,
            fontWeight: 950,
            letterSpacing: 2.2,
            textTransform: 'uppercase',
            marginTop: 15
          }}
        >
          {safeText(presetKey) || 'STAT COMPARISON'}
        </div>
      </div>
    </div>
  );
}

function DuelPosterStage({ playerA, playerB, presetKey }) {
  return (
    <div
      style={{
        height: 548,
        position: 'relative',
        border: UI.frameStrong,
        background: `
          linear-gradient(105deg,
            rgba(16,16,16,0.98) 0%,
            rgba(16,16,16,0.94) 42%,
            rgba(244,195,32,0.13) 49%,
            rgba(16,16,16,0.94) 56%,
            rgba(16,16,16,0.98) 100%
          )
        `,
        overflow: 'hidden',
        boxShadow: UI.yellowGlow
      }}
    >
      <PosterPlayerSide player={playerA} side="left" />
      <PosterPlayerSide player={playerB} side="right" />
      <PosterVsCore presetKey={presetKey} />

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: -80,
          width: 2,
          height: '130%',
          background: COLORS.yellow,
          transform: 'rotate(13deg)',
          boxShadow: '0 0 28px rgba(244,195,32,0.28)',
          zIndex: 14
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          opacity: 0.16,
          zIndex: 3,
          pointerEvents: 'none'
        }}
      />
    </div>
  );
}

function PosterMetricCard({ metric }) {
  const { isAWin, isBWin, pctA, pctB } = getComparisonState(metric.label, metric.a, metric.b);

  return (
    <div
      style={{
        position: 'relative',
        minHeight: 148,
        border: UI.frame,
        background: 'rgba(255,255,255,0.026)',
        overflow: 'hidden',
        padding: '18px 18px 16px',
        boxSizing: 'border-box'
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: 4,
          width: `${pctA}%`,
          background: isAWin ? COLORS.yellow : 'rgba(255,255,255,0.18)'
        }}
      />

      <div
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          height: 4,
          width: `${pctB}%`,
          background: isBWin ? COLORS.yellow : 'rgba(255,255,255,0.18)'
        }}
      />

      <div
        style={{
          color: COLORS.faintWhite,
          fontSize: 10,
          fontWeight: 950,
          letterSpacing: 1.7,
          textTransform: 'uppercase',
          marginBottom: 14,
          textAlign: 'center',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        {safeText(metric.label) || '-'}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 38px 1fr',
          alignItems: 'center',
          gap: 10
        }}
      >
        <div style={{ textAlign: 'left' }}>
          <div
            style={{
              color: isAWin ? COLORS.yellow : COLORS.white,
              fontSize: 36,
              fontWeight: 950,
              lineHeight: 0.9,
              letterSpacing: -1.2,
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {safeText(metric.a) || '0'}
          </div>

          <div
            style={{
              marginTop: 9,
              color: isAWin ? COLORS.yellow : COLORS.faintWhite,
              fontSize: 9,
              fontWeight: 950,
              letterSpacing: 1.4,
              textTransform: 'uppercase'
            }}
          >
            PLAYER A
          </div>
        </div>

        <div
          style={{
            color: 'rgba(255,255,255,0.18)',
            fontSize: 18,
            fontWeight: 950,
            textAlign: 'center'
          }}
        >
          //
        </div>

        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              color: isBWin ? COLORS.yellow : COLORS.white,
              fontSize: 36,
              fontWeight: 950,
              lineHeight: 0.9,
              letterSpacing: -1.2,
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {safeText(metric.b) || '0'}
          </div>

          <div
            style={{
              marginTop: 9,
              color: isBWin ? COLORS.yellow : COLORS.faintWhite,
              fontSize: 9,
              fontWeight: 950,
              letterSpacing: 1.4,
              textTransform: 'uppercase'
            }}
          >
            PLAYER B
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          height: 1,
          background: 'rgba(255,255,255,0.08)'
        }}
      />

      <div
        style={{
          marginTop: 10,
          color: isAWin || isBWin ? COLORS.softWhite : COLORS.faintWhite,
          fontSize: 9,
          fontWeight: 900,
          letterSpacing: 1.4,
          textTransform: 'uppercase',
          textAlign: 'center'
        }}
      >
        {isAWin ? 'A ADVANTAGE' : isBWin ? 'B ADVANTAGE' : 'EVEN'}
      </div>
    </div>
  );
}

function PosterMetricStrip({ metrics }) {
  const displayMetrics = metrics.length
    ? metrics.slice(0, 5)
    : [
        { label: 'DMG / 10 MIN', a: '0', b: '0' },
        { label: 'ELIM / 10 MIN', a: '0', b: '0' },
        { label: 'AST / 10 MIN', a: '0', b: '0' },
        { label: 'DTH / 10 MIN', a: '0', b: '0' },
        { label: 'HERO POOL', a: '0', b: '0' }
      ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${displayMetrics.length}, minmax(0, 1fr))`,
        gap: 10,
        minHeight: 148
      }}
    >
      {displayMetrics.map((metric, idx) => (
        <PosterMetricCard key={`poster_metric_${idx}`} metric={metric} />
      ))}
    </div>
  );
}

export default function PlayerComparisonScene({ matchData = {} }) {
  const data = matchData.playerComparisonData || {};

  const playerA = {
    name: safeText(data.nameA) || 'PLAYER A',
    team: safeText(data.teamA) || safeText(data.teamShortA) || 'TEAM A',
    battletag: safeText(data.battletagA) || safeText(data.battleTagA) || safeText(data.battle_tagA) || '',
    hero: safeText(data.heroA) || safeText(data.heroNameA) || safeText(data.signatureHeroA) || '',
    role: safeText(data.roleA) || 'DPS',
    heroImage: safeText(data.heroImageA) || '',
    heroImages: Array.isArray(data.heroImagesA) ? data.heroImagesA : [],
    rosterImage: safeText(data.rosterImageA) || '',
    rosterImages: Array.isArray(data.rosterImagesA) ? data.rosterImagesA : []
  };

  const playerB = {
    name: safeText(data.nameB) || 'PLAYER B',
    team: safeText(data.teamB) || safeText(data.teamShortB) || 'TEAM B',
    battletag: safeText(data.battletagB) || safeText(data.battleTagB) || safeText(data.battle_tagB) || '',
    hero: safeText(data.heroB) || safeText(data.heroNameB) || safeText(data.signatureHeroB) || '',
    role: safeText(data.roleB) || 'DPS',
    heroImage: safeText(data.heroImageB) || '',
    heroImages: Array.isArray(data.heroImagesB) ? data.heroImagesB : [],
    rosterImage: safeText(data.rosterImageB) || '',
    rosterImages: Array.isArray(data.rosterImagesB) ? data.rosterImagesB : []
  };

  const presetKey = safeText(data.presetKey) || 'H2H';
  const title = safeText(data.title) || '选手对位';
  const subtitle = safeText(data.subtitle) || 'PLAYER HEAD TO HEAD';

  const metrics = [
    { label: safeText(data.stat1Label), a: safeText(data.stat1A), b: safeText(data.stat1B) },
    { label: safeText(data.stat2Label), a: safeText(data.stat2A), b: safeText(data.stat2B) },
    { label: safeText(data.stat3Label), a: safeText(data.stat3A), b: safeText(data.stat3B) },
    { label: safeText(data.stat4Label), a: safeText(data.stat4A), b: safeText(data.stat4B) },
    { label: safeText(data.stat5Label), a: safeText(data.stat5A), b: safeText(data.stat5B) }
  ].filter(m => m.label);

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
      <TopBar presetKey={presetKey} />

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
          gap: 22
        }}
      >
        <Header title={title} subtitle={subtitle} presetKey={presetKey} />
        <DuelPosterStage playerA={playerA} playerB={playerB} presetKey={presetKey} />
        <PosterMetricStrip metrics={metrics} />
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
        FRIES_CUP_DATA_ENGINE // PLAYER_COMPARISON_POSTER // {safeText(data.generatedAt) || 'FCUP 2026'}
      </div>
    </div>
  );
}