import React, { forwardRef } from 'react';

const COLORS = {
  black: '#2a2a2a',
  yellow: '#f4c320',
  white: '#ffffff',
  line: 'rgba(255,255,255,0.08)',
  lineStrong: 'rgba(255,255,255,0.18)',
  softWhite: 'rgba(255,255,255,0.72)',
  faintWhite: 'rgba(255,255,255,0.26)'
};

const UI = {
  outerFrame: `1px solid ${COLORS.lineStrong}`,
  panelShadow: '0 10px 24px rgba(0,0,0,0.22)',
  hardShadow: '0 18px 40px rgba(0,0,0,0.28)',
  yellowGlow: '0 0 0 1px rgba(244,195,32,0.16), 0 0 18px rgba(244,195,32,0.08)',
  insetLine: 'inset 0 0 0 1px rgba(255,255,255,0.04)'
};

const safe = v => (v === undefined || v === null ? '' : String(v));
const up = v => safe(v).toUpperCase();

const DEFAULT_DATA = {
  coverMode: 'GENERIC', // GENERIC | MATCH

  // 固定品牌层
  titleMain: 'FRIES CUP',
  titleSubEn: 'ACADEMY',
  titleSubCn: '薯条杯学院赛',

  // 顶部 / 底部
  topLeftLabel: 'FCUP',
  topLeftYear: '2026',
  topRightLabelGeneric: 'BROADCAST // STANDBY',
  topRightLabelMatch: 'MATCH // READY',
  footerLeft: 'FRIES CUP LIVE ROOM',
  footerCenter: 'FRIES-CUP.COM',
  footerRight: 'LIVE COVER SYSTEM',

  // 通用封面可编辑阶段
  genericWatermark: 'BROADCAST',
  phaseMainEn: 'OPEN QUALIFIER',
  phaseMainCn: '公开预选赛',
  phaseSubEn: 'SWISS STAGE',
  phaseSubCn: '瑞士轮',

  // 通用封面右侧信息
  coverCasters: 'AAA / BBB',
  coverAdmins: 'CCC / DDD',

  // 对阵封面
  teamA: 'TEAM A',
  teamB: 'TEAM B',
  logoA: '',
  logoB: '',
  matchStage: 'OPEN QUALIFIER',
  roundLabel: 'ROUND 01',
  matchTime: '19:30 CST',
  casterLabel: 'CASTER',
  casterNames: 'A / B',
  matchFormat: 'BO3',
  matchWatermark: 'MATCHDAY',

  showLogos: true,
  showFooterCenter: true
};

function TopBar({ data, isMatch }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '44px',
        background: 'rgba(255,255,255,0.02)',
        borderBottom: `1px solid ${COLORS.line}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 30px',
        boxSizing: 'border-box',
        backdropFilter: 'blur(4px)',
        zIndex: 30
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '10px', height: '10px', background: COLORS.yellow, boxShadow: '0 0 12px rgba(244,195,32,0.28)' }} />
        <span style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '2px', color: COLORS.softWhite, textTransform: 'uppercase' }}>
          {safe(data.topLeftLabel) || 'FCUP'}
        </span>
        <span style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '2px', color: 'rgba(255,255,255,0.32)' }}>
          //
        </span>
        <span style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '2px', color: COLORS.softWhite }}>
          {safe(data.topLeftYear) || '2026'}
        </span>
      </div>

      <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', color: 'rgba(255,255,255,0.38)' }}>
        {isMatch ? (safe(data.topRightLabelMatch) || 'MATCH // READY') : (safe(data.topRightLabelGeneric) || 'BROADCAST // STANDBY')}
      </div>
    </div>
  );
}

function FrameShell({ children }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: '96px 120px 92px',
        border: UI.outerFrame,
        boxShadow: `${UI.hardShadow}, ${UI.insetLine}`,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.018) 0%, rgba(255,255,255,0.008) 100%)',
        overflow: 'hidden'
      }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.01) 0 1px, transparent 1px 24px)', opacity: 0.22, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: `linear-gradient(90deg, ${COLORS.yellow} 0%, rgba(244,195,32,0.28) 100%)`, boxShadow: UI.yellowGlow }} />

      <div style={{ position: 'absolute', top: '28px', left: '28px', width: '18px', height: '18px', borderTop: `2px solid ${COLORS.yellow}`, borderLeft: `2px solid ${COLORS.yellow}` }} />
      <div style={{ position: 'absolute', top: '28px', right: '28px', width: '18px', height: '18px', borderTop: `2px solid rgba(255,255,255,0.10)`, borderRight: `2px solid rgba(255,255,255,0.10)` }} />
      <div style={{ position: 'absolute', bottom: '28px', left: '28px', width: '18px', height: '18px', borderBottom: `2px solid rgba(255,255,255,0.10)`, borderLeft: `2px solid rgba(255,255,255,0.10)` }} />
      <div style={{ position: 'absolute', bottom: '28px', right: '28px', width: '18px', height: '18px', borderBottom: `2px solid ${COLORS.yellow}`, borderRight: `2px solid ${COLORS.yellow}` }} />

      {children}
    </div>
  );
}

function Watermark({ text, size = 220, x = 0, y = 0 }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          fontSize: `${size}px`,
          fontWeight: 900,
          letterSpacing: '8px',
          color: 'transparent',
          WebkitTextStroke: '1px rgba(255,255,255,0.08)',
          textTransform: 'uppercase',
          lineHeight: 0.9,
          transform: `translate(${x}px, ${y}px)`,
          whiteSpace: 'nowrap',
          userSelect: 'none'
        }}
      >
        {up(text || 'BROADCAST')}
      </div>
    </div>
  );
}

function GenericInfoPanel({ data }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: UI.outerFrame,
        boxShadow: `${UI.panelShadow}, ${UI.insetLine}`,
        padding: '24px 26px',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '250px',
        display: 'grid',
        gridTemplateRows: '1fr 1fr'
      }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.014) 0 1px, transparent 1px 22px)', opacity: 0.38, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
      <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: '3px', background: `linear-gradient(90deg, ${COLORS.yellow} 0%, rgba(244,195,32,0.10) 100%)`, transform: 'translateY(-1px)' }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontSize: '12px', fontWeight: 900, color: COLORS.faintWhite, letterSpacing: '2px', textTransform: 'uppercase' }}>
          {`${safe(data.coverCasterLabelEn) || 'CASTERS'} // ${safe(data.coverCasterLabelCn) || '解说'}`}
        </div>
        <div style={{ marginTop: '12px', fontSize: '26px', fontWeight: 900, color: COLORS.white, lineHeight: 1.08, letterSpacing: '1px', wordBreak: 'break-word' }}>
          {safe(data.coverCasters) || 'AAA / BBB'}
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontSize: '12px', fontWeight: 900, color: COLORS.faintWhite, letterSpacing: '2px', textTransform: 'uppercase' }}>
          {`${safe(data.coverAdminLabelEn) || 'ADMIN'} // ${safe(data.coverAdminLabelCn) || '赛管'}`}
        </div>
        <div style={{ marginTop: '12px', fontSize: '26px', fontWeight: 900, color: COLORS.white, lineHeight: 1.08, letterSpacing: '1px', wordBreak: 'break-word' }}>
          {safe(data.coverAdmins) || 'CCC / DDD'}
        </div>
      </div>
    </div>
  );
}

function GenericCover({ data }) {
  return (
    <>
      <Watermark text={safe(data.genericWatermark) || 'BROADCAST'} />

      <div
        style={{
          position: 'absolute',
          left: '64px',
          right: '64px',
          top: '190px',
          bottom: '160px',
          display: 'grid',
          gridTemplateColumns: 'minmax(760px, 1fr) 390px',
          gap: '42px',
          zIndex: 10,
          alignItems: 'center'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
          <div style={{ fontSize: '112px', fontWeight: 900, color: COLORS.white, lineHeight: 0.92, letterSpacing: '2px', textTransform: 'uppercase' }}>
            {safe(data.titleMain) || 'FRIES CUP'}
          </div>

          <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ width: '10px', height: '10px', background: COLORS.yellow }} />
            <span style={{ fontSize: '24px', fontWeight: 900, color: COLORS.yellow, letterSpacing: '2.6px', textTransform: 'uppercase' }}>
              {safe(data.titleSubEn) || 'ACADEMY'}
            </span>
            <span style={{ fontSize: '16px', fontWeight: 900, color: COLORS.yellow, letterSpacing: '2px' }}>
              //
            </span>
            <span style={{ fontSize: '24px', fontWeight: 900, color: COLORS.yellow, letterSpacing: '1px' }}>
              {safe(data.titleSubCn) || '薯条杯学院赛'}
            </span>
          </div>

          <div
            style={{
              width: '620px',
              height: '8px',
              marginTop: '24px',
              background: `linear-gradient(90deg, ${COLORS.yellow} 0%, rgba(244,195,32,0.16) 100%)`,
              border: '1px solid rgba(244,195,32,0.18)',
              boxShadow: UI.yellowGlow,
              position: 'relative'
            }}
          >
            <div style={{ position: 'absolute', right: '-1px', top: '-1px', width: '38px', height: '8px', background: COLORS.yellow, opacity: 0.16 }} />
          </div>

          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '18px', fontWeight: 900, color: COLORS.softWhite, letterSpacing: '2px', textTransform: 'uppercase' }}>
              {safe(data.phaseMainEn) || 'OPEN QUALIFIER'}
            </span>
            <span style={{ fontSize: '13px', fontWeight: 900, color: 'rgba(255,255,255,0.34)', letterSpacing: '2px' }}>
              //
            </span>
            <span style={{ fontSize: '18px', fontWeight: 900, color: COLORS.softWhite, letterSpacing: '0.8px' }}>
              {safe(data.phaseMainCn) || '公开预选赛'}
            </span>
          </div>
        </div>

        <div style={{ alignSelf: 'center' }}>
          <GenericInfoPanel data={data} />
        </div>
      </div>
    </>
  );
}

function TeamLogoBox({ logo, alt, align = 'left' }) {
  return (
    <div
      style={{
        width: '178px',
        height: '178px',
        background: 'rgba(255,255,255,0.03)',
        border: UI.outerFrame,
        boxShadow: `${UI.panelShadow}, ${UI.insetLine}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '18px',
          [align]: '18px',
          width: '18px',
          height: '18px',
          borderTop: `2px solid ${COLORS.yellow}`,
          ...(align === 'left' ? { borderLeft: `2px solid ${COLORS.yellow}` } : { borderRight: `2px solid ${COLORS.yellow}` })
        }}
      />
      {logo ? (
        <img src={logo} alt={alt} style={{ width: '74%', height: '74%', objectFit: 'contain', display: 'block' }} />
      ) : (
        <div style={{ fontSize: '20px', fontWeight: 900, color: COLORS.softWhite, letterSpacing: '2px', textTransform: 'uppercase' }}>LOGO</div>
      )}
    </div>
  );
}

function MatchCover({ data }) {
  return (
    <>
      <Watermark text={safe(data.matchWatermark) || 'MATCHDAY'} size={240} x={0} y={0} />

      <div
        style={{
          position: 'absolute',
          top: '170px',
          left: '64px',
          right: '64px',
          bottom: '160px',
          zIndex: 10,
          display: 'grid',
          gridTemplateRows: 'auto auto 1fr auto',
          gap: '22px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ background: COLORS.yellow, color: COLORS.black, padding: '8px 16px', fontSize: '13px', fontWeight: 900, letterSpacing: '1.8px', textTransform: 'uppercase', boxShadow: UI.yellowGlow }}>
            {safe(data.roundLabel) || 'ROUND 01'}
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: UI.outerFrame, boxShadow: `${UI.panelShadow}, ${UI.insetLine}`, padding: '8px 16px', fontSize: '13px', fontWeight: 900, color: COLORS.softWhite, letterSpacing: '1.8px', textTransform: 'uppercase' }}>
            {safe(data.matchStage) || 'OPEN QUALIFIER'}
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: UI.outerFrame, boxShadow: `${UI.panelShadow}, ${UI.insetLine}`, padding: '8px 16px', fontSize: '13px', fontWeight: 900, color: COLORS.softWhite, letterSpacing: '1.8px', textTransform: 'uppercase' }}>
            {safe(data.matchFormat) || 'BO3'}
          </div>
        </div>

        <div
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.012) 100%)',
            border: UI.outerFrame,
            boxShadow: `${UI.hardShadow}, ${UI.insetLine}`,
            minHeight: '360px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.014) 0 1px, transparent 1px 22px)', opacity: 0.42, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: `linear-gradient(90deg, ${COLORS.yellow} 0%, rgba(244,195,32,0.16) 100%)` }} />

          <div
            style={{
              position: 'relative',
              zIndex: 1,
              height: '100%',
              display: 'grid',
              gridTemplateColumns: data.showLogos === false ? '1fr 180px 1fr' : '220px 1fr 180px 1fr 220px',
              alignItems: 'center',
              padding: '48px 42px'
            }}
          >
            {data.showLogos !== false && <TeamLogoBox logo={safe(data.logoA)} alt={safe(data.teamA)} align="left" />}

            <div style={{ minWidth: 0, paddingRight: data.showLogos === false ? '26px' : '28px', display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ textAlign: 'right', minWidth: 0 }}>
                <div style={{ fontSize: '16px', fontWeight: 900, color: COLORS.faintWhite, letterSpacing: '2px', textTransform: 'uppercase' }}>TEAM A</div>
                <div style={{ marginTop: '12px', fontSize: '72px', fontWeight: 900, color: COLORS.white, lineHeight: 0.92, letterSpacing: '1px', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {safe(data.teamA) || 'TEAM A'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  width: '148px',
                  height: '148px',
                  background: COLORS.yellow,
                  color: COLORS.black,
                  borderLeft: `2px solid ${COLORS.black}`,
                  borderRight: `2px solid ${COLORS.black}`,
                  boxShadow: UI.yellowGlow,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}
              >
                <div style={{ position: 'absolute', inset: '10px', border: '1px solid rgba(0,0,0,0.12)' }} />
                <span style={{ position: 'relative', zIndex: 1, fontSize: '38px', fontWeight: 900, letterSpacing: '3px', textTransform: 'uppercase' }}>VS</span>
              </div>
            </div>

            <div style={{ minWidth: 0, paddingLeft: data.showLogos === false ? '26px' : '28px', display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ textAlign: 'left', minWidth: 0 }}>
                <div style={{ fontSize: '16px', fontWeight: 900, color: COLORS.faintWhite, letterSpacing: '2px', textTransform: 'uppercase' }}>TEAM B</div>
                <div style={{ marginTop: '12px', fontSize: '72px', fontWeight: 900, color: COLORS.white, lineHeight: 0.92, letterSpacing: '1px', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {safe(data.teamB) || 'TEAM B'}
                </div>
              </div>
            </div>

            {data.showLogos !== false && <TeamLogoBox logo={safe(data.logoB)} alt={safe(data.teamB)} align="right" />}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <InfoCard label="TIME" value={safe(data.matchTime) || '19:30 CST'} highlight />
          <InfoCard label={safe(data.casterLabel) || 'CASTER'} value={safe(data.casterNames) || 'A / B'} />
          <InfoCard label="SERIES" value={`${safe(data.roundLabel) || 'ROUND 01'} // ${safe(data.matchStage) || 'OPEN QUALIFIER'}`} />
        </div>
      </div>
    </>
  );
}

function InfoCard({ label, value, highlight = false }) {
  return (
    <div
      style={{
        background: highlight ? 'linear-gradient(180deg, rgba(244,195,32,0.16) 0%, rgba(244,195,32,0.08) 100%)' : 'rgba(255,255,255,0.03)',
        border: highlight ? '1px solid rgba(244,195,32,0.22)' : UI.outerFrame,
        boxShadow: `${UI.panelShadow}, ${UI.insetLine}`,
        padding: '18px 20px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.012) 0 1px, transparent 1px 22px)', opacity: 0.45, pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 1, fontSize: '11px', fontWeight: 900, color: highlight ? 'rgba(244,195,32,0.82)' : COLORS.faintWhite, letterSpacing: '2px', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ position: 'relative', zIndex: 1, marginTop: '10px', fontSize: '26px', fontWeight: 900, color: COLORS.white, letterSpacing: '1px', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {value}
      </div>
    </div>
  );
}

function BottomBar({ data, isMatch }) {
  const left = safe(data.footerLeft) || 'FRIES CUP LIVE ROOM';
  const center = safe(data.footerCenter) || 'FRIES-CUP.COM';
  const right = isMatch ? `${safe(data.matchTime) || '19:30 CST'}${safe(data.matchFormat) ? ` // ${safe(data.matchFormat)}` : ''}` : (safe(data.footerRight) || 'LIVE COVER SYSTEM');

  return (
    <>
      <div style={{ position: 'absolute', left: '64px', right: '64px', bottom: '70px', height: '2px', background: 'rgba(255,255,255,0.08)', zIndex: 12 }} />
      <div
        style={{
          position: 'absolute',
          left: '64px',
          right: '64px',
          bottom: '42px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '20px',
          zIndex: 12
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 900, color: 'rgba(255,255,255,0.26)', letterSpacing: '1.8px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          {left}
        </span>

        {data.showFooterCenter !== false && (
          <span style={{ fontSize: '11px', fontWeight: 900, color: COLORS.yellow, letterSpacing: '1.8px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            {center}
          </span>
        )}

        <span style={{ fontSize: '11px', fontWeight: 900, color: 'rgba(255,255,255,0.26)', letterSpacing: '1.8px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          {right}
        </span>
      </div>
    </>
  );
}

// 重点：使用 forwardRef 包裹并透传 ref
const BroadcastCoverScene = forwardRef(({ matchData = {} }, ref) => {
  const data = { ...DEFAULT_DATA, ...matchData };
  const isMatch = safe(data.coverMode).toUpperCase() === 'MATCH';

  return (
    <div
      ref={ref} // 👈 ref 挂载在这里
      style={{
        width: '1920px',
        height: '1080px',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: COLORS.black,
        fontFamily: '"HarmonyOS Sans SC", "Microsoft YaHei", sans-serif',
        backgroundImage: `
          radial-gradient(circle at center, rgba(42,42,42,0.90) 0%, rgba(42,42,42,0.98) 100%),
          linear-gradient(180deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0) 100%)
        `
      }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.012) 0 1px, transparent 1px 40px)', opacity: 0.18, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: '70px', top: '70px', width: '520px', height: '520px', border: '1px solid rgba(244,195,32,0.07)', transform: 'rotate(45deg)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: '-120px', bottom: '-120px', width: '460px', height: '460px', border: '1px solid rgba(255,255,255,0.03)', transform: 'rotate(45deg)', pointerEvents: 'none' }} />

      <TopBar data={data} isMatch={isMatch} />
      <FrameShell>{isMatch ? <MatchCover data={data} /> : <GenericCover data={data} />}</FrameShell>
      <BottomBar data={data} isMatch={isMatch} />
    </div>
  );
});

export default BroadcastCoverScene;