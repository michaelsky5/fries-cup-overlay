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

const TEAM_LOGOS = import.meta.glob('../../../assets/logos/*.png', {
  eager: true,
  import: 'default'
});

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

const safeText = v => String(v ?? '').trim();
const unique = arr => [...new Set(arr.filter(Boolean).map(String))];

function toNum(value) {
  const raw = safeText(value).replace(/,/g, '').replace(/%/g, '');
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function normalizeCategory(value) {
  const raw = safeText(value).toUpperCase();
  if (raw === 'SUPPORT') return 'SUP';
  if (raw === 'DAMAGE') return 'DPS';
  if (raw === 'TANK') return 'TANK';
  if (raw === 'DPS') return 'DPS';
  if (raw === 'SUP') return 'SUP';
  return 'OVERALL';
}

function isReverseMetric(label) {
  const text = safeText(label).toLowerCase();
  return (
    text.includes('死亡') ||
    text.includes('阵亡') ||
    text.includes('death') ||
    text.includes('deaths') ||
    text.includes('dth')
  );
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

function getTeamLogoSources(team) {
  return unique([
    team.logoImage,
    team.teamLogo,
    ...(Array.isArray(team.logoImages) ? team.logoImages : []),
    getLogoAssetByName(team.name),
    getLogoAssetByName(team.fullName)
  ]);
}

function getTeamPlateMode(team) {
  const key = safeText(team?.name || team?.fullName).toUpperCase();
  return TEAM_LOGO_PLATE[key] || 'dark';
}

function getTeamLogoPlate(team) {
  const mode = getTeamPlateMode(team);

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

function normalizeMetricLabel(label) {
  return safeText(label)
    .replace(' / 10分', ' / 10 MIN')
    .replace('/10分', '/10 MIN')
    .replace('每10分钟', '/ 10 MIN');
}

function getValueFontSize(value) {
  const len = safeText(value).length;
  if (len >= 9) return 25;
  if (len >= 8) return 27;
  if (len >= 7) return 29;
  if (len >= 6) return 32;
  return 36;
}

function getAdvantageVisualWidth(a, b) {
  const numA = toNum(a);
  const numB = toNum(b);
  const max = Math.max(Math.abs(numA), Math.abs(numB), 1);
  const diff = Math.abs(numA - numB);

  if (!diff) return 50;

  const raw = (diff / max) * 100;
  return Math.min(92, Math.max(56, 56 + raw * 2.2));
}

function VsText({ size = 118, shadow = '0 0 34px rgba(244,195,32,0.28)' }) {
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

function TopBar({ activeCategory }) {
  const category = normalizeCategory(activeCategory);

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
          TEAM COMPARISON // {category}
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
          TEAM DUEL
        </div>
      </div>
    </div>
  );
}

function Header({ title, subtitle, currentTabInfo, categoryTabs, activeCategory, metricCount }) {
  return (
    <div
      style={{
        height: 104,
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) 280px',
        gap: 28,
        alignItems: 'end',
        borderBottom: `3px solid ${COLORS.yellow}`,
        paddingBottom: 14,
        boxSizing: 'border-box'
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            color: COLORS.yellow,
            fontSize: 14,
            fontWeight: 900,
            letterSpacing: 4,
            textTransform: 'uppercase',
            marginBottom: 8
          }}
        >
          {safeText(subtitle) || 'TEAM HEAD TO HEAD'}
        </div>

        <div
          style={{
            color: COLORS.white,
            fontSize: 58,
            fontWeight: 950,
            letterSpacing: 1,
            lineHeight: 0.92,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {safeText(title) || '队伍比较'}
        </div>
      </div>

      <div
        style={{
          justifySelf: 'end',
          width: 280,
          border: UI.frame,
          background: 'rgba(255,255,255,0.018)',
          padding: '12px 14px',
          boxSizing: 'border-box'
        }}
      >
        <div
          style={{
            color: COLORS.faintWhite,
            fontSize: 8,
            fontWeight: 950,
            letterSpacing: 1.7,
            textTransform: 'uppercase',
            marginBottom: 7
          }}
        >
          MATCHUP CATEGORY
        </div>

        <div
          style={{
            color: COLORS.yellow,
            fontSize: 23,
            fontWeight: 950,
            letterSpacing: 1.3,
            lineHeight: 1,
            textTransform: 'uppercase'
          }}
        >
          {currentTabInfo.label}
        </div>

        <div
          style={{
            marginTop: 9,
            paddingTop: 9,
            borderTop: UI.frame,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12
          }}
        >
          <div
            style={{
              color: COLORS.faintWhite,
              fontSize: 8,
              fontWeight: 900,
              letterSpacing: 1.3,
              textTransform: 'uppercase'
            }}
          >
            {metricCount} METRICS
          </div>

          <div style={{ display: 'flex', gap: 7 }}>
            {categoryTabs.map(tab => (
              <div
                key={tab.id}
                style={{
                  width: 28,
                  height: 4,
                  background: normalizeCategory(activeCategory) === tab.id ? COLORS.yellow : 'rgba(255,255,255,0.12)',
                  boxShadow: normalizeCategory(activeCategory) === tab.id ? '0 0 10px rgba(244,195,32,0.32)' : 'none'
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamLogoIcon({ team, size = 74, accent = false }) {
  const sources = useMemo(() => getTeamLogoSources(team), [team]);
  const plate = getTeamLogoPlate(team);
  const label = safeText(team.name || team.fullName || 'TEAM');

  return (
    <div
      style={{
        width: size,
        height: size,
        border: accent ? `1px solid ${COLORS.yellow}` : UI.frameStrong,
        background: 'rgba(0,0,0,0.42)',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: accent ? '0 0 0 1px rgba(244,195,32,0.12)' : 'none'
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: Math.max(5, Math.round(size * 0.08)),
          background: plate.innerBg,
          border: plate.innerBorder,
          boxSizing: 'border-box',
          zIndex: 1
        }}
      />

      <ImageWithFallback
        sources={sources}
        alt=""
        style={{
          position: 'relative',
          zIndex: 2,
          width: '68%',
          height: '68%',
          objectFit: 'contain',
          objectPosition: 'center',
          opacity: plate.imgOpacity,
          filter: plate.imgFilter
        }}
        fallback={
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              color: plate.mode === 'yellow' ? COLORS.black : COLORS.yellow,
              fontSize: size >= 80 ? 20 : 13,
              fontWeight: 950,
              letterSpacing: 1.2,
              textTransform: 'uppercase'
            }}
          >
            {label.slice(0, 3)}
          </div>
        }
      />
    </div>
  );
}

function TeamLogoWatermark({ team, side = 'left' }) {
  const sources = useMemo(() => getTeamLogoSources(team), [team]);
  const right = side === 'right';

  return (
    <ImageWithFallback
      sources={sources}
      alt=""
      style={{
        position: 'absolute',

        // 核心：往 VS 中心靠
        // 左队靠右，右队靠左
        [right ? 'left' : 'right']: '20%',

        top: '4%',
        width: '64%',
        height: '88%',

        objectFit: 'contain',
        objectPosition: right ? 'left center' : 'right center',

        // 原来 0.15 太淡；这里是“降低透明度”，也就是提高可见度
        opacity: 0.24,

        filter: 'grayscale(1) contrast(1.28) brightness(1.18)',
        mixBlendMode: 'screen',
        pointerEvents: 'none',
        zIndex: 1
      }}
    />
  );
}

function TeamPosterSide({ team, side = 'left' }) {
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
      <TeamLogoWatermark team={team} side={side} />

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
          top: 28,
          [right ? 'right' : 'left']: 40,
          zIndex: 5,
          display: 'flex',
          flexDirection: right ? 'row-reverse' : 'row',
          gap: 10,
          alignItems: 'center'
        }}
      >
        <div
          style={{
            padding: '7px 12px',
            background: COLORS.yellow,
            color: COLORS.black,
            fontSize: 11,
            fontWeight: 950,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            lineHeight: 1
          }}
        >
          {right ? 'TEAM B' : 'TEAM A'}
        </div>

        <div
          style={{
            padding: '7px 12px',
            border: UI.frameStrong,
            color: COLORS.softWhite,
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: 1.3,
            textTransform: 'uppercase',
            lineHeight: 1,
            background: 'rgba(0,0,0,0.28)'
          }}
        >
          {safeText(team.maps) || '0'} MAPS
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          zIndex: 5,
          [right ? 'right' : 'left']: 40,
          bottom: 34,
          width: 610,
          textAlign: right ? 'right' : 'left'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: right ? 'row-reverse' : 'row',
            alignItems: 'center',
            gap: 16,
            marginBottom: 14
          }}
        >
          <TeamLogoIcon team={team} size={76} accent />

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                color: COLORS.yellow,
                fontSize: 11,
                fontWeight: 950,
                letterSpacing: 2.2,
                textTransform: 'uppercase',
                marginBottom: 7
              }}
            >
              {right ? 'TEAM B' : 'TEAM A'}
            </div>

            <div
              style={{
                color: COLORS.softWhite,
                fontSize: 13,
                fontWeight: 900,
                letterSpacing: 1.3,
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {safeText(team.fullName) || 'UNKNOWN TEAM'}
            </div>
          </div>
        </div>

        <div
          style={{
            color: COLORS.white,
            fontSize: 82,
            fontWeight: 950,
            lineHeight: 0.88,
            letterSpacing: -2.4,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {safeText(team.name) || '-'}
        </div>

        <div
          style={{
            marginTop: 13,
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
          PLAYED TIME {safeText(team.time) || '-'}
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

function PosterVsCore({ activeCategory }) {
  const category = normalizeCategory(activeCategory);

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 280,
        height: 280,
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
          width: 190,
          height: 430,
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
          width: 210,
          height: 210,
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
            fontSize: 10,
            fontWeight: 950,
            letterSpacing: 2.4,
            textTransform: 'uppercase',
            marginBottom: 10
          }}
        >
          TEAM TO TEAM
        </div>

        <VsText size={118} />

        <div
          style={{
            color: COLORS.softWhite,
            fontSize: 11,
            fontWeight: 950,
            letterSpacing: 2,
            textTransform: 'uppercase',
            marginTop: 14
          }}
        >
          {category}
        </div>
      </div>
    </div>
  );
}

function TeamDuelStage({ teamA, teamB, activeCategory }) {
  return (
    <div
      style={{
        height: 430,
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
        boxShadow: UI.yellowGlow,
        flexShrink: 0
      }}
    >
      <TeamPosterSide team={teamA} side="left" />
      <TeamPosterSide team={teamB} side="right" />
      <PosterVsCore activeCategory={activeCategory} />

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: -70,
          width: 2,
          height: '134%',
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
  const label = normalizeMetricLabel(metric.label);
  const sizeA = getValueFontSize(metric.a);
  const sizeB = getValueFontSize(metric.b);
  const visualWidth = getAdvantageVisualWidth(metric.a, metric.b);
  const leadText = isAWin ? 'TEAM A ADVANTAGE' : isBWin ? 'TEAM B ADVANTAGE' : 'EVEN MATCH';

  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        minHeight: 0,
        border: UI.frame,
        background: 'rgba(255,255,255,0.026)',
        overflow: 'hidden',
        padding: '12px 16px 11px',
        boxSizing: 'border-box'
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: 3,
          width: `${pctA}%`,
          background: isAWin ? COLORS.yellow : 'rgba(255,255,255,0.16)'
        }}
      />

      <div
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          height: 3,
          width: `${pctB}%`,
          background: isBWin ? COLORS.yellow : 'rgba(255,255,255,0.16)'
        }}
      />

      <div
        style={{
          height: '100%',
          display: 'grid',
          gridTemplateRows: 'minmax(0, 1fr) 34px',
          gap: 10
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1fr) 122px minmax(0,1fr)',
            alignItems: 'center',
            gap: 12,
            minHeight: 0
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                color: isAWin ? COLORS.yellow : COLORS.white,
                fontSize: sizeA,
                fontWeight: 950,
                lineHeight: 1,
                letterSpacing: -1,
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
                marginTop: 7,
                color: isAWin ? COLORS.yellow : COLORS.faintWhite,
                fontSize: 9,
                fontWeight: 950,
                letterSpacing: 1.4,
                textTransform: 'uppercase'
              }}
            >
              TEAM A
            </div>
          </div>

          <div style={{ minWidth: 0, textAlign: 'center' }}>
            <div
              style={{
                color: COLORS.softWhite,
                fontSize: 11,
                fontWeight: 950,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {label || '-'}
            </div>

            <div
              style={{
                width: 22,
                height: 2,
                background: 'rgba(255,255,255,0.18)',
                margin: '9px auto 0'
              }}
            />
          </div>

          <div style={{ minWidth: 0, textAlign: 'right' }}>
            <div
              style={{
                color: isBWin ? COLORS.yellow : COLORS.white,
                fontSize: sizeB,
                fontWeight: 950,
                lineHeight: 1,
                letterSpacing: -1,
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
                marginTop: 7,
                color: isBWin ? COLORS.yellow : COLORS.faintWhite,
                fontSize: 9,
                fontWeight: 950,
                letterSpacing: 1.4,
                textTransform: 'uppercase'
              }}
            >
              TEAM B
            </div>
          </div>
        </div>

        <div
          style={{
            position: 'relative',
            minHeight: 34,
            borderTop: UI.frame
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 16,
              height: 8,
              background: 'rgba(255,255,255,0.075)'
            }}
          />

          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 11,
              width: 1,
              height: 18,
              background: 'rgba(255,255,255,0.25)',
              zIndex: 3
            }}
          />

          <div
            style={{
              position: 'absolute',
              right: '50%',
              top: 16,
              width: isAWin ? `${visualWidth / 2}%` : '18%',
              height: 8,
              background: isAWin ? `linear-gradient(90deg, rgba(244,195,32,0.2), ${COLORS.yellow})` : 'rgba(255,255,255,0.13)',
              boxShadow: isAWin ? '0 0 14px rgba(244,195,32,0.28)' : 'none',
              zIndex: 2
            }}
          />

          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 16,
              width: isBWin ? `${visualWidth / 2}%` : '18%',
              height: 8,
              background: isBWin ? `linear-gradient(270deg, rgba(244,195,32,0.2), ${COLORS.yellow})` : 'rgba(255,255,255,0.13)',
              boxShadow: isBWin ? '0 0 14px rgba(244,195,32,0.28)' : 'none',
              zIndex: 2
            }}
          />

          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              transform: 'translateX(-50%)',
              color: isAWin || isBWin ? COLORS.softWhite : COLORS.faintWhite,
              fontSize: 8,
              fontWeight: 950,
              letterSpacing: 1.4,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap'
            }}
          >
            {leadText}
          </div>
        </div>
      </div>
    </div>
  );
}

function PosterMetricStrip({ metrics }) {
  const displayMetrics = metrics.length
    ? metrics.slice(0, 6)
    : [
        { label: 'ELIM / 10 MIN', a: '0', b: '0' },
        { label: 'DMG / 10 MIN', a: '0', b: '0' },
        { label: 'HEAL / 10 MIN', a: '0', b: '0' },
        { label: 'DTH / 10 MIN', a: '0', b: '0' },
        { label: 'AST / 10 MIN', a: '0', b: '0' },
        { label: 'MIT / 10 MIN', a: '0', b: '0' }
      ];

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gridAutoRows: 'minmax(84px, 1fr)',
        gap: 10
      }}
    >
      {displayMetrics.map((metric, idx) => (
        <PosterMetricCard key={`team_metric_${idx}`} metric={metric} />
      ))}
    </div>
  );
}

export default function TeamComparisonScene({ matchData = {} }) {
  const data = matchData.teamComparisonData || {};
  const activeCategory = normalizeCategory(data.activeCategory || 'OVERALL');

  const categoryTabs = [
    { id: 'OVERALL', label: 'OVERALL', zh: '整体数据' },
    { id: 'TANK', label: 'TANK', zh: '坦克对位' },
    { id: 'DPS', label: 'DAMAGE', zh: '输出对位' },
    { id: 'SUP', label: 'SUPPORT', zh: '辅助对位' }
  ];

  const overallMetrics = Array.isArray(data.overallMetrics) ? data.overallMetrics : [];
  const roleMetrics = data.roleMetrics || { TANK: [], DPS: [], SUP: [] };

  let currentMetrics = [];

  if (activeCategory === 'TANK') currentMetrics = roleMetrics.TANK || [];
  else if (activeCategory === 'DPS') currentMetrics = roleMetrics.DPS || [];
  else if (activeCategory === 'SUP') currentMetrics = roleMetrics.SUP || [];
  else currentMetrics = overallMetrics || [];

  const currentTabInfo = categoryTabs.find(tab => tab.id === activeCategory) || categoryTabs[0];

  const teamA = {
    name: safeText(data.nameA) || 'TEAM A',
    fullName: safeText(data.fullNameA) || 'UNKNOWN TEAM',
    maps: safeText(data.mapsA) || '0',
    time: safeText(data.timeA) || '-',
    logoImage: safeText(data.logoImageA) || safeText(data.teamLogoA) || '',
    logoImages: Array.isArray(data.logoImagesA) ? data.logoImagesA : []
  };

  const teamB = {
    name: safeText(data.nameB) || 'TEAM B',
    fullName: safeText(data.fullNameB) || 'UNKNOWN TEAM',
    maps: safeText(data.mapsB) || '0',
    time: safeText(data.timeB) || '-',
    logoImage: safeText(data.logoImageB) || safeText(data.teamLogoB) || '',
    logoImages: Array.isArray(data.logoImagesB) ? data.logoImagesB : []
  };

  const title = safeText(data.title) || '队伍比较';
  const subtitle = safeText(data.subtitle) || 'TEAM HEAD TO HEAD';

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
      <TopBar activeCategory={activeCategory} />

      <div
        style={{
          position: 'absolute',
          top: 84,
          left: 118,
          right: 118,
          bottom: 64,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}
      >
        <Header
          title={title}
          subtitle={subtitle}
          currentTabInfo={currentTabInfo}
          categoryTabs={categoryTabs}
          activeCategory={activeCategory}
          metricCount={Math.min(currentMetrics.length || 6, 6)}
        />

        <TeamDuelStage teamA={teamA} teamB={teamB} activeCategory={activeCategory} />

        <PosterMetricStrip metrics={currentMetrics} />
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
        FRIES_CUP_DATA_ENGINE // TEAM_COMPARISON_POSTER // {safeText(data.generatedAt) || 'FCUP 2026'}
      </div>
    </div>
  );
}