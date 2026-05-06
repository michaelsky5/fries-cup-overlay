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

const safeText = v => String(v ?? '').trim();

function unique(arr) {
  return [...new Set(arr.filter(Boolean).map(String))];
}

function toNum(value) {
  const raw = safeText(value).replace(/,/g, '').replace(/%/g, '');
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

const MAP_DICTIONARY = {
  busan: 'Control/Busan',
  '釜山': 'Control/Busan',
  ilios: 'Control/Ilios',
  '伊利奥斯': 'Control/Ilios',
  'lijiang tower': 'Control/Lijiang_Tower',
  lijiang_tower: 'Control/Lijiang_Tower',
  '漓江塔': 'Control/Lijiang_Tower',
  nepal: 'Control/Nepal',
  '尼泊尔': 'Control/Nepal',
  oasis: 'Control/Oasis',
  '绿洲城': 'Control/Oasis',
  samoa: 'Control/Samoa',
  '萨摩亚': 'Control/Samoa',
  'antarctic peninsula': 'Control/Antarctic_Peninsula',
  '南极半岛': 'Control/Antarctic_Peninsula',

  'circuit royal': 'Escort/Circuit_Royal',
  circuit_royal: 'Escort/Circuit_Royal',
  '皇家赛道': 'Escort/Circuit_Royal',
  dorado: 'Escort/Dorado',
  '多拉多': 'Escort/Dorado',
  havana: 'Escort/Havana',
  '哈瓦那': 'Escort/Havana',
  junkertown: 'Escort/Junkertown',
  '渣客镇': 'Escort/Junkertown',
  rialto: 'Escort/Rialto',
  '里阿尔托': 'Escort/Rialto',
  'route 66': 'Escort/Route_66',
  route_66: 'Escort/Route_66',
  '66号公路': 'Escort/Route_66',
  'shambali monastery': 'Escort/Shambali',
  shambali: 'Escort/Shambali',
  '香巴里寺院': 'Escort/Shambali',
  'watchpoint: gibraltar': 'Escort/Watchpoint_Gibraltar',
  'watchpoint gibraltar': 'Escort/Watchpoint_Gibraltar',
  watchpoint_gibraltar: 'Escort/Watchpoint_Gibraltar',
  '监测站：直布罗陀': 'Escort/Watchpoint_Gibraltar',

  atlis: 'Flashpoint/Atlis',
  hanaoka: 'Flashpoint/Atlis',
  '花冈': 'Flashpoint/Atlis',
  'new junk city': 'Flashpoint/New_Junk_City',
  new_junk_city: 'Flashpoint/New_Junk_City',
  '新渣客城': 'Flashpoint/New_Junk_City',
  suravasa: 'Flashpoint/Suravasa',
  '苏拉瓦萨': 'Flashpoint/Suravasa',

  'blizzard world': 'Hybrid/Blizzard_World',
  blizzard_world: 'Hybrid/Blizzard_World',
  '暴雪世界': 'Hybrid/Blizzard_World',
  eichenwalde: 'Hybrid/Eichenwalde',
  '艾兴瓦尔德': 'Hybrid/Eichenwalde',
  hollywood: 'Hybrid/Hollywood',
  '好莱坞': 'Hybrid/Hollywood',
  "king's row": 'Hybrid/Kings_Row',
  'kings row': 'Hybrid/Kings_Row',
  kings_row: 'Hybrid/Kings_Row',
  '国王大道': 'Hybrid/Kings_Row',
  midtown: 'Hybrid/Midtown',
  '中城': 'Hybrid/Midtown',
  numbani: 'Hybrid/Numbani',
  '努巴尼': 'Hybrid/Numbani',
  'paraíso': 'Hybrid/Paraíso',
  paraiso: 'Hybrid/Paraíso',
  '帕拉伊索': 'Hybrid/Paraíso',

  colosseo: 'Push/Colosseo',
  '斗兽场': 'Push/Colosseo',
  'esperança': 'Push/Esperanca',
  esperanca: 'Push/Esperanca',
  '埃斯佩兰萨': 'Push/Esperanca',
  'new queen street': 'Push/New_Queen_Street',
  new_queen_street: 'Push/New_Queen_Street',
  '新皇后街': 'Push/New_Queen_Street',
  runasapi: 'Push/Runasapi',
  '鲁纳萨皮': 'Push/Runasapi'
};

function formatMapPath(mapType, mapName) {
  if (!mapName) return '';

  const lookupKey = String(mapName).toLowerCase().trim();
  if (MAP_DICTIONARY[lookupKey]) return `/assets/maps/${MAP_DICTIONARY[lookupKey]}.jpg`;

  let folder = 'Unknown';
  const typeRaw = String(mapType).toLowerCase();

  if (typeRaw.includes('control') || typeRaw.includes('控制')) folder = 'Control';
  else if (typeRaw.includes('escort') || typeRaw.includes('护送')) folder = 'Escort';
  else if (typeRaw.includes('flashpoint') || typeRaw.includes('闪击')) folder = 'Flashpoint';
  else if (typeRaw.includes('hybrid') || typeRaw.includes('混合')) folder = 'Hybrid';
  else if (typeRaw.includes('push') || typeRaw.includes('推进')) folder = 'Push';
  else folder = String(mapType).trim().charAt(0).toUpperCase() + String(mapType).trim().slice(1).toLowerCase();

  const file = String(mapName)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[:.']/g, '')
    .trim()
    .replace(/\s+/g, '_');

  return `/assets/maps/${folder}/${file}.jpg`;
}

function normalizeMetricLabel(label) {
  return safeText(label)
    .replace(' / 10分', ' / 10 MIN')
    .replace('/10分', '/10 MIN')
    .replace('每10分钟', '/ 10 MIN');
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

  if (numA === numB) {
    return {
      isAWin: false,
      isBWin: false,
      pctA: numA > 0 ? 50 : 2,
      pctB: numB > 0 ? 50 : 2
    };
  }

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

function ImageWithFallback({ src, alt = '', style = {}, fallback = null }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  if (!src || failed) return fallback;

  return <img src={src} alt={alt} onError={() => setFailed(true)} style={style} />;
}

function Background({ mapBgPath, mapName }) {
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, backgroundColor: COLORS.black, zIndex: 0 }} />

      <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        <ImageWithFallback
          src={mapBgPath}
          alt={mapName}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            opacity: 0.28,
            filter: 'grayscale(0.4) contrast(1.15) brightness(0.88)'
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(16,16,16,0.96) 0%, rgba(42,42,42,0.72) 44%, rgba(16,16,16,0.92) 100%)'
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(180deg, rgba(255,255,255,0.024) 1px, transparent 1px)
            `,
            backgroundSize: '96px 96px',
            opacity: 0.18
          }}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          left: -150,
          top: 130,
          width: 540,
          height: 540,
          border: '1px solid rgba(244,195,32,0.08)',
          transform: 'rotate(45deg)',
          zIndex: 2
        }}
      />

      <div
        style={{
          position: 'absolute',
          right: -160,
          bottom: -130,
          width: 620,
          height: 620,
          border: '1px solid rgba(255,255,255,0.045)',
          transform: 'rotate(45deg)',
          zIndex: 2
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

function TopBar({ mapType }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 46,
        borderBottom: UI.frame,
        background: 'rgba(16,16,16,0.74)',
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
          MAP PROFILE // {safeText(mapType) || 'MODE'}
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
          PER 10 MIN
        </div>
      </div>
    </div>
  );
}

function Header({ title, subtitle, mapType, globalPlays }) {
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
          {safeText(subtitle) || 'MAP DATA SNAPSHOT'}
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
          {safeText(title) || '地图数据'}
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
          MAP CATEGORY
        </div>

        <div
          style={{
            color: COLORS.yellow,
            fontSize: 23,
            fontWeight: 950,
            letterSpacing: 1.3,
            lineHeight: 1,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {safeText(mapType) || 'MODE'}
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
            TOTAL PLAYS
          </div>

          <div
            style={{
              color: COLORS.softWhite,
              fontSize: 12,
              fontWeight: 950,
              letterSpacing: 1.4,
              textTransform: 'uppercase'
            }}
          >
            {safeText(globalPlays) || '0'}
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamBlock({ side = 'left', team, fullName, record }) {
  const right = side === 'right';

  return (
    <div
      style={{
        position: 'absolute',
        [right ? 'right' : 'left']: 40,
        bottom: 38,
        width: 520,
        zIndex: 5,
        textAlign: right ? 'right' : 'left'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: right ? 'flex-end' : 'flex-start',
          gap: 10,
          marginBottom: 16
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
          RECORD {safeText(record) || '0-0'}
        </div>
      </div>

      <div
        style={{
          color: COLORS.white,
          fontSize: 86,
          fontWeight: 950,
          lineHeight: 0.88,
          letterSpacing: -2.4,
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        {safeText(team) || (right ? 'TEAM B' : 'TEAM A')}
      </div>

      <div
        style={{
          marginTop: 14,
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
        {safeText(fullName) || 'UNKNOWN TEAM'}
      </div>
    </div>
  );
}

function MapPosterStage({ mapName, mapType, globalPlays, teamA, teamB, fullNameA, fullNameB, recordA, recordB, mapBgPath }) {
  return (
    <div
      style={{
        height: 430,
        position: 'relative',
        border: UI.frameStrong,
        background: COLORS.deepBlack,
        overflow: 'hidden',
        boxShadow: UI.yellowGlow,
        flexShrink: 0
      }}
    >
      <ImageWithFallback
        src={mapBgPath}
        alt={mapName}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          opacity: 0.5,
          filter: 'grayscale(0.25) contrast(1.2) brightness(0.88)',
          zIndex: 1
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, rgba(16,16,16,0.96) 0%, rgba(16,16,16,0.58) 32%, rgba(16,16,16,0.4) 50%, rgba(16,16,16,0.58) 68%, rgba(16,16,16,0.96) 100%)',
          zIndex: 2
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(16,16,16,0.92) 0%, rgba(16,16,16,0.28) 42%, rgba(16,16,16,0.86) 100%)',
          zIndex: 2
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 8,
          background: COLORS.yellow,
          zIndex: 6
        }}
      />

      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 8,
          background: COLORS.yellow,
          zIndex: 6
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: -72,
          width: 2,
          height: '134%',
          background: COLORS.yellow,
          transform: 'rotate(13deg)',
          boxShadow: '0 0 28px rgba(244,195,32,0.28)',
          zIndex: 7
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 610,
          height: 300,
          zIndex: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          pointerEvents: 'none'
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 250,
            height: 250,
            border: '1px solid rgba(244,195,32,0.32)',
            background: 'rgba(16,16,16,0.54)',
            transform: 'rotate(45deg)',
            boxShadow: '0 0 0 1px rgba(244,195,32,0.08), 0 20px 60px rgba(0,0,0,0.38)'
          }}
        />

        <div style={{ position: 'relative', zIndex: 2 }}>
          <div
            style={{
              display: 'inline-block',
              marginBottom: 14,
              padding: '7px 14px',
              background: COLORS.yellow,
              color: COLORS.black,
              fontSize: 12,
              fontWeight: 950,
              letterSpacing: 2,
              textTransform: 'uppercase',
              lineHeight: 1
            }}
          >
            {safeText(mapType) || 'MODE'}
          </div>

          <div
            style={{
              color: COLORS.white,
              fontSize: 76,
              fontWeight: 950,
              lineHeight: 0.9,
              letterSpacing: -2.2,
              textTransform: 'uppercase',
              textShadow: '0 0 34px rgba(0,0,0,0.72)',
              whiteSpace: 'nowrap',
              maxWidth: 720,
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {safeText(mapName) || 'UNKNOWN MAP'}
          </div>

          <div
            style={{
              marginTop: 18,
              color: COLORS.softWhite,
              fontSize: 11,
              fontWeight: 950,
              letterSpacing: 2.2,
              textTransform: 'uppercase'
            }}
          >
            MAP PROFILE <span style={{ color: COLORS.faintWhite, margin: '0 10px' }}>//</span>
            TOTAL PLAYS <span style={{ color: COLORS.yellow }}>{safeText(globalPlays) || '0'}</span>
          </div>
        </div>
      </div>

      <TeamBlock side="left" team={teamA} fullName={fullNameA} record={recordA} />
      <TeamBlock side="right" team={teamB} fullName={fullNameB} record={recordB} />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          opacity: 0.16,
          zIndex: 4,
          pointerEvents: 'none'
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 26,
          bottom: 18,
          color: 'rgba(255,255,255,0.18)',
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          zIndex: 20
        }}
      >
        MAP_STAGE // TEAM_A_PROFILE
      </div>

      <div
        style={{
          position: 'absolute',
          right: 26,
          bottom: 18,
          color: 'rgba(255,255,255,0.18)',
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          zIndex: 20
        }}
      >
        TEAM_B_PROFILE // MAP_READY
      </div>
    </div>
  );
}

function MetricCard({ metric }) {
  const label = normalizeMetricLabel(metric.label);
  const valA = safeText(metric.valA ?? metric.a);
  const valB = safeText(metric.valB ?? metric.b);
  const { isAWin, isBWin, pctA, pctB } = getComparisonState(label, valA, valB);
  const sizeA = getValueFontSize(valA);
  const sizeB = getValueFontSize(valB);
  const visualWidth = getAdvantageVisualWidth(valA, valB);
  const leadText = isAWin ? 'TEAM A ADVANTAGE' : isBWin ? 'TEAM B ADVANTAGE' : 'EVEN MATCH';

  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        minHeight: 0,
        border: UI.frame,
        background: 'rgba(255,255,255,0.03)',
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
          gridTemplateRows: 'minmax(0,1fr) 34px',
          gap: 10
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1fr) 132px minmax(0,1fr)',
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
              {valA || '0'}
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
              {valB || '0'}
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
              background: isAWin
                ? `linear-gradient(90deg, rgba(244,195,32,0.2), ${COLORS.yellow})`
                : 'rgba(255,255,255,0.13)',
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
              background: isBWin
                ? `linear-gradient(270deg, rgba(244,195,32,0.2), ${COLORS.yellow})`
                : 'rgba(255,255,255,0.13)',
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

function MetricMatrix({ rows }) {
  const displayRows = rows.length
    ? rows.slice(0, 6)
    : [
        { label: 'ELIM / 10 MIN', valA: '0', valB: '0' },
        { label: 'DMG / 10 MIN', valA: '0', valB: '0' },
        { label: 'HEAL / 10 MIN', valA: '0', valB: '0' },
        { label: 'DTH / 10 MIN', valA: '0', valB: '0' },
        { label: 'AST / 10 MIN', valA: '0', valB: '0' },
        { label: 'MIT / 10 MIN', valA: '0', valB: '0' }
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
      {displayRows.map((metric, idx) => (
        <MetricCard key={`map_profile_metric_${idx}`} metric={metric} />
      ))}
    </div>
  );
}

export default function MapProfileScene({ matchData = {} }) {
  const data = matchData.mapProfileData || {};

  const mapName = safeText(data.mapName) || 'UNKNOWN MAP';
  const mapType = safeText(data.mapType) || 'MODE';
  const globalPlays = safeText(data.globalPlays) || '0';

  const teamA = safeText(data.teamA) || 'TEAM A';
  const teamB = safeText(data.teamB) || 'TEAM B';
  const fullNameA = safeText(data.fullNameA) || 'UNKNOWN TEAM';
  const fullNameB = safeText(data.fullNameB) || 'UNKNOWN TEAM';
  const recordA = safeText(data.recordA) || '0-0';
  const recordB = safeText(data.recordB) || '0-0';
  const rows = Array.isArray(data.rows) ? data.rows : [];

  const title = safeText(data.title) || '地图数据';
  const subtitle = safeText(data.subtitle) || 'MAP DATA SNAPSHOT';
  const mapBgPath = formatMapPath(mapType, mapName);

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
      <Background mapBgPath={mapBgPath} mapName={mapName} />
      <TopBar mapType={mapType} />

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
        <Header title={title} subtitle={subtitle} mapType={mapType} globalPlays={globalPlays} />

        <MapPosterStage
          mapName={mapName}
          mapType={mapType}
          globalPlays={globalPlays}
          teamA={teamA}
          teamB={teamB}
          fullNameA={fullNameA}
          fullNameB={fullNameB}
          recordA={recordA}
          recordB={recordB}
          mapBgPath={mapBgPath}
        />

        <MetricMatrix rows={rows} />
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
        FRIES_CUP_DATA_ENGINE // MAP_PROFILE_POSTER // {safeText(data.generatedAt) || 'FCUP 2026'}
      </div>
    </div>
  );
}