import React, { useEffect, useMemo, useState } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer
} from 'recharts';

const COLORS = {
  black: '#2a2a2a', yellow: '#f4c320', white: '#ffffff',
  deepBlack: '#101010', panel: '#141414', panel2: '#1a1a1a',
  line: 'rgba(255,255,255,0.08)', lineStrong: 'rgba(255,255,255,0.18)',
  softWhite: 'rgba(255,255,255,0.72)', faintWhite: 'rgba(255,255,255,0.26)'
};

const UI = {
  outerFrame: `1px solid ${COLORS.lineStrong}`,
  innerFrame: `1px solid ${COLORS.line}`,
  panelShadow: '0 10px 24px rgba(0,0,0,0.22)',
  hardShadow: '0 18px 40px rgba(0,0,0,0.28)',
  yellowGlow: '0 0 0 1px rgba(244,195,32,0.16), 0 0 18px rgba(244,195,32,0.08)'
};

const HERO_SLUG_MAP = {
  'd.va': ['dva'],
  dva: ['dva'],
  'd va': ['dva'],
  'd-va': ['dva'],
  'd_va': ['dva'],
  doomfist: ['doomfist'],
  '末日铁拳': ['doomfist'],
  hazard: ['hazard'],
  '骇灾': ['hazard'],
  junkerqueen: ['junker_queen', 'junker-queen', 'junkerqueen'],
  'junker queen': ['junker_queen', 'junker-queen', 'junkerqueen'],
  junker_queen: ['junker_queen', 'junker-queen', 'junkerqueen'],
  'junker-queen': ['junker_queen', 'junker-queen', 'junkerqueen'],
  '渣客女王': ['junker_queen', 'junker-queen', 'junkerqueen'],
  mauga: ['mauga'],
  '毛加': ['mauga'],
  orisa: ['orisa'],
  '奥丽莎': ['orisa'],
  '奥莉莎': ['orisa'],
  ramattra: ['ramattra'],
  '拉玛刹': ['ramattra'],
  '拉玛特拉': ['ramattra'],
  reinhardt: ['reinhardt'],
  '莱因哈特': ['reinhardt'],
  roadhog: ['roadhog'],
  '路霸': ['roadhog'],
  sigma: ['sigma'],
  '西格玛': ['sigma'],
  winston: ['winston'],
  '温斯顿': ['winston'],
  wreckingball: ['wrecking_ball', 'wrecking-ball', 'wreckingball'],
  'wrecking ball': ['wrecking_ball', 'wrecking-ball', 'wreckingball'],
  wrecking_ball: ['wrecking_ball', 'wrecking-ball', 'wreckingball'],
  'wrecking-ball': ['wrecking_ball', 'wrecking-ball', 'wreckingball'],
  '破坏球': ['wrecking_ball', 'wrecking-ball', 'wreckingball'],
  zarya: ['zarya'],
  '查莉娅': ['zarya'],
  '查丽娅': ['zarya'],

  ashe: ['ashe'],
  '艾什': ['ashe'],
  bastion: ['bastion'],
  '堡垒': ['bastion'],
  cassidy: ['cassidy'],
  '卡西迪': ['cassidy'],
  echo: ['echo'],
  '回声': ['echo'],
  genji: ['genji'],
  '源氏': ['genji'],
  hanzo: ['hanzo'],
  '半藏': ['hanzo'],
  junkrat: ['junkrat'],
  '狂鼠': ['junkrat'],
  mei: ['mei'],
  '小美': ['mei'],
  '美': ['mei'],
  pharah: ['pharah'],
  '法老之鹰': ['pharah'],
  reaper: ['reaper'],
  '死神': ['reaper'],
  sojourn: ['sojourn'],
  '索杰恩': ['sojourn'],
  '索洁恩': ['sojourn'],
  soldier76: ['soldier_76', 'soldier-76', 'soldier76'],
  'soldier 76': ['soldier_76', 'soldier-76', 'soldier76'],
  soldier_76: ['soldier_76', 'soldier-76', 'soldier76'],
  'soldier-76': ['soldier_76', 'soldier-76', 'soldier76'],
  '士兵76': ['soldier_76', 'soldier-76', 'soldier76'],
  '士兵 76': ['soldier_76', 'soldier-76', 'soldier76'],
  '士兵：76': ['soldier_76', 'soldier-76', 'soldier76'],
  '士兵:76': ['soldier_76', 'soldier-76', 'soldier76'],
  sombra: ['sombra'],
  '黑影': ['sombra'],
  symmetra: ['symmetra'],
  '秩序之光': ['symmetra'],
  torbjorn: ['torbjorn'],
  '托比昂': ['torbjorn'],
  tracer: ['tracer'],
  '猎空': ['tracer'],
  venture: ['venture'],
  '探奇': ['venture'],
  widowmaker: ['widowmaker'],
  '黑百合': ['widowmaker'],

  ana: ['ana'],
  '安娜': ['ana'],
  baptiste: ['baptiste'],
  '巴蒂斯特': ['baptiste'],
  brigitte: ['brigitte'],
  '布丽吉塔': ['brigitte'],
  '布里吉塔': ['brigitte'],
  illari: ['illari'],
  '伊拉锐': ['illari'],
  '伊拉里': ['illari'],
  juno: ['juno'],
  '朱诺': ['juno'],
  kiriko: ['kiriko'],
  '雾子': ['kiriko'],
  lifeweaver: ['lifeweaver'],
  '生命之梭': ['lifeweaver'],
  lucio: ['lucio'],
  'lúcio': ['lucio'],
  '卢西奥': ['lucio'],
  '卢西欧': ['lucio'],
  mercy: ['mercy'],
  '天使': ['mercy'],
  moira: ['moira'],
  '莫伊拉': ['moira'],
  zenyatta: ['zenyatta'],
  '禅雅塔': ['zenyatta'],
  jetpackcat: ['jetpack_cat', 'jetpack-cat', 'jetpackcat'],
  'jetpack cat': ['jetpack_cat', 'jetpack-cat', 'jetpackcat'],
  jetpack_cat: ['jetpack_cat', 'jetpack-cat', 'jetpackcat'],
  'jetpack-cat': ['jetpack_cat', 'jetpack-cat', 'jetpackcat'],
  '喷气猫': ['jetpack_cat', 'jetpack-cat', 'jetpackcat']
};

const HERO_ROLE_MAP = {
  dva: 'tank',
  doomfist: 'tank',
  hazard: 'tank',
  junker_queen: 'tank',
  mauga: 'tank',
  orisa: 'tank',
  ramattra: 'tank',
  reinhardt: 'tank',
  roadhog: 'tank',
  sigma: 'tank',
  winston: 'tank',
  wrecking_ball: 'tank',
  zarya: 'tank',

  ashe: 'damage',
  bastion: 'damage',
  cassidy: 'damage',
  echo: 'damage',
  genji: 'damage',
  hanzo: 'damage',
  junkrat: 'damage',
  mei: 'damage',
  pharah: 'damage',
  reaper: 'damage',
  sojourn: 'damage',
  soldier_76: 'damage',
  sombra: 'damage',
  symmetra: 'damage',
  torbjorn: 'damage',
  tracer: 'damage',
  venture: 'damage',
  widowmaker: 'damage',

  ana: 'support',
  baptiste: 'support',
  brigitte: 'support',
  illari: 'support',
  juno: 'support',
  kiriko: 'support',
  lifeweaver: 'support',
  lucio: 'support',
  mercy: 'support',
  moira: 'support',
  zenyatta: 'support',
  jetpack_cat: 'support'
};

const safeText = v => String(v ?? '').trim();
const unique = arr => [...new Set(arr.filter(Boolean).map(String))];

function normalizeHeroKey(value) {
  return safeText(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[：:]/g, ' ')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugifyHeroName(value) {
  const raw = safeText(value);
  if (!raw || raw === '-') return [];

  const rawKey = raw.toLowerCase().trim();
  const normalized = normalizeHeroKey(raw);
  const compactNormalized = normalized.replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '');

  if (Array.isArray(HERO_SLUG_MAP[raw])) return HERO_SLUG_MAP[raw];
  if (Array.isArray(HERO_SLUG_MAP[rawKey])) return HERO_SLUG_MAP[rawKey];
  if (Array.isArray(HERO_SLUG_MAP[normalized])) return HERO_SLUG_MAP[normalized];
  if (Array.isArray(HERO_SLUG_MAP[compactNormalized])) return HERO_SLUG_MAP[compactNormalized];

  const asciiBase = normalized.replace(/[^a-z0-9]+/g, ' ').trim();
  const underscore = asciiBase.replace(/\s+/g, '_').replace(/^_+|_+$/g, '');
  const hyphen = asciiBase.replace(/\s+/g, '-').replace(/^-+|-+$/g, '');
  const compact = asciiBase.replace(/\s+/g, '');

  return unique([underscore, hyphen, compact]);
}

function getPrimaryHeroRole(hero) {
  const slugs = slugifyHeroName(hero);
  return slugs.map(slug => HERO_ROLE_MAP[slug]).find(Boolean) || '';
}

function getRoleFolders(role, hero = '') {
  const r = safeText(role).toUpperCase();
  const text = safeText(role).toLowerCase();
  const heroRole = getPrimaryHeroRole(hero);

  let roleFolder = '';
  if (r === 'TANK' || r === '重装' || text === 'tank') roleFolder = 'tank';
  else if (r === 'SUP' || r === 'SUPPORT' || r === '辅助' || r === '支援' || text === 'support') roleFolder = 'support';
  else if (r === 'DPS' || r === 'DAMAGE' || r === '输出' || text === 'damage' || text === 'dps') roleFolder = 'damage';

  return unique([roleFolder, heroRole, 'tank', 'damage', 'support']);
}

function inferHeroImages(hero, role) {
  const slugs = slugifyHeroName(hero);
  const folders = getRoleFolders(role, hero);
  return slugs.flatMap(slug => folders.map(folder => `/assets/heroes/${folder}/${slug}.png`));
}

function inferRosterImages(hero, role) {
  const slugs = slugifyHeroName(hero);
  const folders = getRoleFolders(role, hero);
  return slugs.flatMap(slug => folders.map(folder => `/assets/roster/${folder}/${slug}.png`));
}

function getMainHeroSources(hero, role) {
  return unique([
    ...inferRosterImages(hero, role),
    ...inferHeroImages(hero, role)
  ]);
}

function getHeroPoolSources(hero, role) {
  return unique([
    ...inferHeroImages(hero, role),
    ...inferRosterImages(hero, role)
  ]);
}

function ImageWithFallback({ sources = [], alt = '', style = {}, fallback = null }) {
  const sourceKey = Array.isArray(sources) ? sources.join('|') : String(sources ?? '');
  const cleanSources = useMemo(() => unique(Array.isArray(sources) ? sources : [sources]), [sourceKey]);
  const [idx, setIdx] = useState(0);
  const src = cleanSources[idx];

  useEffect(() => setIdx(0), [sourceKey]);

  if (!src) return fallback;

  return (
    <img
      src={src}
      alt={alt}
      style={style}
      onError={() => {
        if (idx < cleanSources.length - 1) setIdx(idx + 1);
        else setIdx(cleanSources.length);
      }}
    />
  );
}

export default function PlayerSpotlightScene({ matchData = {} }) {
  const data = matchData.playerSpotlightData || {};

  const {
    cardTag = 'FOCUS PLAYER',
    displayName = 'UNKNOWN',
    battletag,
    teamShort = 'TBD',
    dataRole = 'FLEX',
    styleTag = '均衡型选手',
    styleDesc = '整体能力分布较为均衡。',
    playTime = '0m',
    signatureHero = '',
    topHeroes = '',
    metrics = [],
    radarData = []
  } = data;

  const heroList = useMemo(() => {
    return safeText(topHeroes).split('/').map(h => h.trim()).filter(h => h && h !== '-').slice(0, 3);
  }, [topHeroes]);

  const mainHero = signatureHero || heroList[0];
  const mainHeroSources = useMemo(() => getMainHeroSources(mainHero, dataRole), [mainHero, dataRole]);

  return (
    <div style={{ width: '1920px', height: '1080px', position: 'relative', overflow: 'hidden', backgroundColor: COLORS.black, fontFamily: '"HarmonyOS Sans SC", sans-serif' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.014) 1px, transparent 1px)', backgroundSize: '120px 120px', opacity: 0.18, pointerEvents: 'none' }} />
      
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '44px', background: 'rgba(255,255,255,0.02)', borderBottom: `1px solid ${COLORS.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', boxSizing: 'border-box', backdropFilter: 'blur(4px)', zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '10px', height: '10px', background: COLORS.yellow, boxShadow: '0 0 12px rgba(244,195,32,0.28)' }} />
          <span style={{ fontSize: '12px', fontWeight: '900', letterSpacing: '2px', color: COLORS.softWhite }}>FCUP_DATA_SYS // PLAYER_SPOTLIGHT_V4</span>
        </div>
        <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '2px', color: 'rgba(255,255,255,0.38)' }}>SIGNAL_READY // 1080P_MASTER</div>
      </div>

      <div style={{ position: 'absolute', top: '100px', left: '80px', right: '80px', bottom: '80px', display: 'flex', gap: '30px' }}>
        
        <div style={{ width: '640px', height: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ flex: 1, border: `2px solid ${COLORS.yellow}`, background: COLORS.deepBlack, position: 'relative', boxShadow: UI.hardShadow, overflow: 'hidden' }}>
            
            {mainHero && (
              <ImageWithFallback
                sources={mainHeroSources}
                alt={mainHero}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', opacity: 0.5, filter: 'contrast(1.2) grayscale(0.2)' }}
              />
            )}

            <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 120px rgba(0,0,0,0.8)', background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.95) 100%)' }} />
            
            <div style={{ position: 'absolute', top: '20px', right: '-20px', fontSize: '140px', fontWeight: '900', color: 'rgba(255,255,255,0.06)', textTransform: 'uppercase', lineHeight: 0.8, pointerEvents: 'none' }}>
              {teamShort}
            </div>
            
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '50px', zIndex: 5 }}>
              <div style={{ display: 'inline-flex', padding: '6px 14px', background: COLORS.yellow, color: COLORS.black, fontSize: '18px', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '20px', boxShadow: UI.yellowGlow }}>{cardTag}</div>
              <div style={{ fontSize: '86px', fontWeight: '900', color: COLORS.white, lineHeight: 0.9, textTransform: 'uppercase', letterSpacing: '1px' }}>{displayName}</div>
              {battletag && <div style={{ fontSize: '24px', fontWeight: '900', color: COLORS.yellow, letterSpacing: '2px', textTransform: 'uppercase', marginTop: '15px', opacity: 0.8 }}>{battletag}</div>}
              <div style={{ width: '120px', height: '6px', background: COLORS.yellow, marginTop: '30px' }} />
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: UI.outerFrame, padding: '25px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', color: COLORS.yellow, fontWeight: '900', letterSpacing: '2px', marginBottom: '4px' }}>CURRENT_TEAM</div>
              <div style={{ fontSize: '32px', color: COLORS.white, fontWeight: '900' }}>{teamShort}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: COLORS.yellow, fontWeight: '900', letterSpacing: '2px', marginBottom: '4px' }}>DATA_ROLE</div>
              <div style={{ fontSize: '32px', color: COLORS.white, fontWeight: '900' }}>{dataRole}</div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '20px' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: UI.outerFrame, padding: '25px', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: COLORS.faintWhite, fontWeight: '900', letterSpacing: '2px', marginBottom: '10px' }}>TIME PLAYED</div>
              <div style={{ fontSize: '38px', color: COLORS.yellow, fontWeight: '900', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{playTime}</div>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.02)', border: UI.outerFrame, padding: '20px 30px', position: 'relative' }}>
              <div style={{ fontSize: '14px', color: COLORS.faintWhite, fontWeight: '900', letterSpacing: '2px', marginBottom: '15px' }}>HERO POOL</div>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                {heroList.map((hero, idx) => {
                  const heroSources = getHeroPoolSources(hero, dataRole);

                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '80px', height: '80px', background: 'rgba(0,0,0,0.4)', border: `1px solid ${idx === 0 ? COLORS.yellow : COLORS.line}`, padding: '4px' }}>
                        <ImageWithFallback
                          sources={heroSources}
                          alt={hero}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          fallback={<div style={{ width: '100%', height: '100%', background: '#333' }} />}
                        />
                      </div>
                      <div style={{ fontSize: '11px', color: idx === 0 ? COLORS.yellow : COLORS.white, fontWeight: '900', textTransform: 'uppercase' }}>{hero}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', minHeight: 0 }}>
            
            <div style={{ background: 'rgba(0,0,0,0.2)', border: UI.outerFrame, position: 'relative', padding: '20px' }}>
              <div style={{ position: 'absolute', top: '15px', left: '20px', fontSize: '12px', fontWeight: '900', color: COLORS.yellow, letterSpacing: '2px' }}>RADAR MODEL</div>
              <div style={{ position: 'absolute', top: '15px', right: '20px', fontSize: '11px', fontWeight: '900', color: COLORS.faintWhite, letterSpacing: '1px', display: 'flex', gap: '15px' }}>
                <span><span style={{ color: COLORS.yellow }}>■</span> PLAYER</span>
                <span><span style={{ color: 'rgba(255,255,255,0.4)' }}>■</span> ROLE AVG</span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="55%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.15)" gridType="polygon" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 900, dy: 4 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  
                  <Radar
                    name="Avg"
                    dataKey="avgScore"
                    stroke="rgba(255,255,255,0.42)"
                    fill="rgba(255,255,255,0.05)"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                  />
                  
                  <Radar
                    name="Player"
                    dataKey="score"
                    stroke={COLORS.yellow}
                    fill={COLORS.yellow}
                    fillOpacity={0.35}
                    strokeWidth={3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ flex: 1, background: `linear-gradient(135deg, rgba(244,195,32,0.1) 0%, transparent 100%)`, border: `1px solid ${COLORS.yellow}`, padding: '30px', position: 'relative' }}>
                <div style={{ fontSize: '14px', color: COLORS.yellow, fontWeight: '900', letterSpacing: '2px', marginBottom: '15px' }}>PLAYSTYLE PROFILE</div>
                <div style={{ fontSize: '42px', color: COLORS.white, fontWeight: '900', marginBottom: '15px', textTransform: 'uppercase' }}>{styleTag}</div>
                <div style={{ fontSize: '18px', color: COLORS.softWhite, fontWeight: '700', lineHeight: 1.6 }}>{styleDesc}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: UI.outerFrame, padding: '20px' }}>
                 <div style={{ fontSize: '12px', color: COLORS.faintWhite, fontWeight: '900', letterSpacing: '2px', marginBottom: '8px' }}>SIGNATURE_HERO</div>
                 <div style={{ fontSize: '28px', color: COLORS.white, fontWeight: '900', textTransform: 'uppercase' }}>{signatureHero || heroList[0] || 'N/A'}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px' }}>
            {metrics.map((m, idx) => {
              const rank = parseInt(m.rank) || 1;
              const total = parseInt(m.total) || 1;
              const percentile = total > 1 ? Math.round(((total - rank) / (total - 1)) * 100) : 100;
              const isFirst = rank === 1 && total > 1;

              return (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: UI.innerFrame, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '3px', background: 'rgba(255,255,255,0.06)' }}>
                    <div style={{ width: `${percentile}%`, height: '100%', background: COLORS.yellow, transition: 'width 0.5s ease-out' }} />
                  </div>
                  
                  <div style={{ padding: '18px 16px 12px' }}>
                    <div style={{ fontSize: '11px', color: COLORS.faintWhite, fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>
                      {m.label}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '38px', color: COLORS.white, fontWeight: '900', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{m.value || '0'}</div>
                      {isFirst && <div style={{ fontSize: '12px', color: COLORS.black, background: COLORS.yellow, padding: '2px 6px', fontWeight: '900' }}>TOP 1</div>}
                    </div>
                  </div>
                  
                  <div style={{ marginTop: 'auto', background: 'rgba(0,0,0,0.4)', padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: 800 }}>同职责排名</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                      <span style={{ fontSize: '14px', color: COLORS.white, fontWeight: 900 }}>NO.{rank}</span>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: 800 }}>/ {total}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '30px', left: '80px', right: '80px', height: '1px', background: COLORS.lineStrong }} />
      <div style={{ position: 'absolute', bottom: '15px', left: '80px', color: 'rgba(255,255,255,0.2)', fontSize: '10px', fontWeight: '900', letterSpacing: '1px' }}>
        FRIES_CUP_DATA_ENGINE // ANALYTICS_CORE_V4 // {new Date().getFullYear()}
      </div>
    </div>
  );
}