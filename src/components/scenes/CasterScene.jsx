import React, { useMemo } from 'react';

const COLORS = {
  black: '#2a2a2a',
  yellow: '#f4c320',
  white: '#ffffff',
  darkGray: '#1a1a1a',
  dimGray: '#555555',
  panel: '#101010',
  panel2: '#161616',
  line: 'rgba(255,255,255,0.08)',
  lineStrong: 'rgba(255,255,255,0.18)',
  softWhite: 'rgba(255,255,255,0.72)',
  shadow: 'rgba(0,0,0,0.35)',
  faintWhite: 'rgba(255,255,255,0.26)'
};

const UI = {
  outerFrame: `1px solid ${COLORS.lineStrong}`,
  innerFrame: `1px solid ${COLORS.line}`,
  hardShadow: '0 18px 40px rgba(0,0,0,0.28)',
  panelShadow: '0 10px 24px rgba(0,0,0,0.22)',
  yellowGlow: '0 0 0 1px rgba(244,195,32,0.16), 0 0 18px rgba(244,195,32,0.08)',
  insetLine: 'inset 0 0 0 1px rgba(255,255,255,0.04)'
};

const panelBase = {
  background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)',
  border: UI.outerFrame,
  boxShadow: `${UI.panelShadow}, ${UI.insetLine}`,
  position: 'relative',
  overflow: 'hidden'
};

const CASTER_KEYFRAMES = `
  @keyframes slideUpBounce {
    0% { opacity: 0; transform: translateY(100px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes lineGrow {
    0% { width: 0; opacity: 0; }
    100% { width: 100%; opacity: 1; }
  }
  @keyframes staffFadeIn {
    0% { opacity: 0; transform: translateY(28px); }
    100% { opacity: 1; transform: translateY(0); }
  }
`;

const CasterCard = React.memo(({ caster, delay, index, compact = false, multiMode = false }) => {
  // 🚀 核心修复：将 caster.id 的优先级提到最高，强制对齐编辑器里修改的 "Display Name" 字段
  const displayName = caster?.id || caster?.label || `CASTER ${index + 1}`;
  const displayTitle = caster?.title || 'COMMENTATOR';
  // 🚀 同步修复：社交账号如果没有填，默认占位符也跟着 id 走
  const displaySocial = caster?.social || `@${(caster?.id || `caster${index + 1}`).replace(/\s+/g, '_')}`;
  
  const avatarKey = caster?.id || 'COMMENTATOR';
  const imgPath = caster?.avatar || `/assets/casters/${avatarKey}.jpg`;

  if (multiMode) {
    return (
      <div
        style={{
          width: '320px',
          height: '520px',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)',
          border: '1px solid rgba(244,195,32,0.88)',
          boxShadow: `${UI.hardShadow}, ${UI.yellowGlow}`,
          position: 'relative',
          overflow: 'hidden',
          opacity: 0,
          transform: 'translateY(40px)',
          willChange: 'transform, opacity', 
          animation: `slideUpBounce 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${delay}s forwards`
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.012) 0 1px, transparent 1px 22px)',
            pointerEvents: 'none',
            zIndex: 1,
            opacity: 0.28
          }}
        />

        <div
          style={{
            position: 'relative',
            height: '340px',
            overflow: 'hidden',
            borderBottom: '1px solid rgba(255,255,255,0.08)'
          }}
        >
          <img
            src={imgPath}
            onError={e => { 
              const fallback = '/assets/logos/OW.png';
              if (!e.target.src.includes(fallback)) {
                e.target.src = fallback;
              } else {
                e.target.style.display = 'none';
              }
            }}
            alt={displayName}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'grayscale(10%) contrast(1.04) brightness(0.92)'
            }}
          />
          <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 40px rgba(0,0,0,0.16)' }} />
          <div style={{ position: 'absolute', top: '14px', left: '14px', width: '14px', height: '14px', borderTop: `2px solid ${COLORS.yellow}`, borderLeft: `2px solid ${COLORS.yellow}` }} />
          <div style={{ position: 'absolute', bottom: '14px', right: '14px', width: '18px', height: '18px', backgroundColor: COLORS.white, opacity: 0.95 }} />
        </div>

        <div
          style={{
            position: 'relative',
            zIndex: 2,
            flex: 1,
            padding: '16px 18px 14px 18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.018) 38%, rgba(0,0,0,0.16) 100%)'
          }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 22px)', opacity: 0.4, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '14px', right: '14px', width: '22px', height: '2px', background: 'rgba(244,195,32,0.55)' }} />
          <div style={{ position: 'absolute', left: '18px', right: '18px', bottom: '42px', height: '1px', background: 'rgba(255,255,255,0.08)' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
              <div style={{ width: '7px', height: '7px', backgroundColor: COLORS.yellow }} />
              <div style={{ fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.68)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                {displayTitle}
              </div>
            </div>

            <div style={{ fontSize: '28px', fontWeight: '900', color: COLORS.white, lineHeight: '0.94', textTransform: 'uppercase', letterSpacing: '0.3px', wordBreak: 'break-word' }}>
              {displayName}
            </div>
          </div>

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '7px' }}>
            <div style={{ width: '7px', height: '7px', backgroundColor: COLORS.yellow }} />
            <span style={{ fontSize: '14px', fontWeight: '900', color: 'rgba(255,255,255,0.78)', letterSpacing: '0.4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {displaySocial}
            </span>
          </div>
        </div>
      </div>
    );
  }

  const cardW = compact ? 360 : 500;
  const cardH = compact ? 360 : 500;
  const nameSize = compact ? 40 : 54;
  const socialSize = compact ? 14 : 18;
  const titleSize = compact ? 10 : 12;
  const footerPad = compact ? '14px 18px 16px 18px' : '18px 24px 20px 24px';
  const numberSize = compact ? 180 : 300;
  const numberTop = compact ? '-80px' : '-140px';
  const numberLeft = compact ? '-36px' : '-70px';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        opacity: 0,
        transform: 'translateY(100px)',
        position: 'relative',
        willChange: 'transform, opacity',
        animation: `slideUpBounce 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${delay}s forwards`
      }}
    >
      <div
        style={{
          position: 'absolute', top: numberTop, left: numberLeft, fontSize: `${numberSize}px`, fontWeight: '900', color: 'transparent',
          WebkitTextStroke: '2px rgba(255,255,255,0.035)', zIndex: 0, fontFamily: '"HarmonyOS Sans SC", sans-serif', pointerEvents: 'none', letterSpacing: '-8px'
        }}
      >
        {String(index + 1).padStart(2, '0')}
      </div>

      <div style={{ width: `${cardW}px`, height: `${cardH}px`, border: `2px solid ${COLORS.yellow}`, backgroundColor: '#111', boxSizing: 'border-box', overflow: 'hidden', position: 'relative', zIndex: 2, boxShadow: `${UI.hardShadow}, ${UI.yellowGlow}` }}>
        <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.012) 0 1px, transparent 1px 22px)', pointerEvents: 'none', zIndex: 2 }} />
        <img
          src={imgPath}
          onError={e => { 
            const fallback = '/assets/logos/OW.png';
            if (!e.target.src.includes(fallback)) e.target.src = fallback;
            else e.target.style.display = 'none';
          }}
          alt={displayName}
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(10%) contrast(1.04) brightness(0.92)' }}
        />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', boxShadow: 'inset 0 0 80px rgba(0,0,0,0.16), inset 0 0 0 1px rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', top: '16px', left: '16px', width: compact ? '16px' : '20px', height: compact ? '16px' : '20px', borderTop: `2px solid ${COLORS.yellow}`, borderLeft: `2px solid ${COLORS.yellow}`, zIndex: 3 }} />
        <div style={{ position: 'absolute', bottom: '16px', right: '16px', width: compact ? '20px' : '26px', height: compact ? '20px' : '26px', backgroundColor: COLORS.white, zIndex: 3 }} />
      </div>

      <div style={{ minWidth: `${cardW}px`, width: 'max-content', background: `linear-gradient(180deg, ${COLORS.yellow} 0%, #e8b91b 100%)`, padding: footerPad, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderTop: `2px solid ${COLORS.black}`, borderLeft: `2px solid ${COLORS.yellow}`, borderRight: `2px solid ${COLORS.yellow}`, borderBottom: `2px solid ${COLORS.yellow}`, zIndex: 2, boxShadow: `${UI.hardShadow}, ${UI.yellowGlow}`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg, rgba(42,42,42,0.05) 0 1px, transparent 1px 22px)', pointerEvents: 'none', opacity: 0.4 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: compact ? '6px' : '8px', position: 'relative', zIndex: 1 }}>
          <div style={{ width: compact ? '6px' : '8px', height: compact ? '6px' : '8px', backgroundColor: COLORS.black }} />
          <div style={{ fontSize: `${titleSize}px`, fontWeight: '900', color: 'rgba(42,42,42,0.72)', letterSpacing: compact ? '1.5px' : '2px', textTransform: 'uppercase' }}>
            {displayTitle}
          </div>
        </div>

        <div style={{ fontSize: `${nameSize}px`, fontWeight: '900', color: COLORS.black, textTransform: 'uppercase', lineHeight: '0.96', whiteSpace: 'nowrap', letterSpacing: '0.5px', position: 'relative', zIndex: 1 }}>
          {displayName}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: compact ? '8px' : '10px', marginTop: compact ? '10px' : '14px', position: 'relative', zIndex: 1 }}>
          <div style={{ width: compact ? '8px' : '10px', height: compact ? '8px' : '10px', backgroundColor: COLORS.black }} />
          <span style={{ fontSize: `${socialSize}px`, fontWeight: '900', color: 'rgba(42,42,42,0.84)', letterSpacing: '0.8px' }}>
            {displaySocial}
          </span>
        </div>
      </div>
    </div>
  );
});

const StaffRow = React.memo(({ role, name, delay, index }) => (
  <div
    style={{
      ...panelBase,
      padding: '18px 20px',
      borderLeft: `3px solid ${COLORS.yellow}`,
      opacity: 0,
      transform: 'translateY(28px)',
      willChange: 'transform, opacity', 
      animation: `staffFadeIn 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s forwards`
    }}
  >
    <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.012) 0 1px, transparent 1px 22px)', pointerEvents: 'none', opacity: 0.12 }} />
    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: '16px', alignItems: 'center', position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '12px', height: '12px', background: COLORS.yellow }} />
        <span style={{ fontSize: '16px', fontWeight: '900', color: COLORS.softWhite, letterSpacing: '1px', textTransform: 'uppercase' }}>
          {role || 'STAFF'}
        </span>
      </div>
      <div style={{ fontSize: '34px', fontWeight: '900', color: COLORS.white, lineHeight: 1, letterSpacing: '0.4px' }}>
        {name || '—'}
      </div>
      <div style={{ fontSize: '12px', fontWeight: '900', color: COLORS.faintWhite, letterSpacing: '1.8px', textTransform: 'uppercase' }}>
        #{String(index + 1).padStart(2, '0')}
      </div>
    </div>
  </div>
));

export default function CasterScene({ matchData = {} }) {
  const displayMode = matchData.casterDisplayMode || 'CASTERS';
  const staffTitle = matchData.staffTitle || 'SPECIAL THANKS';
  const staffSubtitle = matchData.staffSubtitle || 'EVENT STAFF';
  
  const staffMembers = useMemo(() => 
    (matchData.staffMembers || []).filter(m => (m.role || '').trim() || (m.name || '').trim()), 
  [matchData.staffMembers]);

  const casters = useMemo(() => {
    const castersFromArray = Array.isArray(matchData.casters) ? matchData.casters : [];
    const castersFromLegacy = [
      { id: matchData.caster1 || '', label: matchData.caster1Label || '', title: matchData.caster1Title || 'COMMENTATOR', social: matchData.caster1Social || '', avatar: matchData.caster1Avatar || '' },
      { id: matchData.caster2 || '', label: matchData.caster2Label || '', title: matchData.caster2Title || 'COMMENTATOR', social: matchData.caster2Social || '', avatar: matchData.caster2Avatar || '' }
    ];

    const normalizeCaster = c => ({
      id: String(c?.id ?? c?.name ?? c?.caster ?? c?.casterId ?? c?.displayName ?? c?.casterName ?? '').trim(),
      label: String(c?.label ?? '').trim(),
      slotLabel: String(c?.slotLabel ?? '').trim(),
      title: String(c?.title ?? c?.role ?? c?.position ?? 'COMMENTATOR').trim(),
      social: String(c?.social ?? c?.handle ?? c?.username ?? '').trim(),
      avatar: String(c?.avatar ?? c?.avatarPath ?? c?.image ?? c?.img ?? c?.photo ?? '').trim()
    });

    const normalizedArray = castersFromArray.map(normalizeCaster).filter(c => c.id || c.label || c.social || c.avatar);
    const normalizedLegacy = castersFromLegacy.map(normalizeCaster).filter(c => c.id || c.label || c.social || c.avatar);
    return normalizedArray.length ? normalizedArray : normalizedLegacy;
  }, [matchData.casters, matchData.caster1, matchData.caster2, matchData.caster1Label, matchData.caster2Label, matchData.caster1Title, matchData.caster2Title, matchData.caster1Social, matchData.caster2Social, matchData.caster1Avatar, matchData.caster2Avatar]);

  const casterCount = casters.length;
  const isGridMode = casterCount >= 3;

  return (
    <div style={{ width: '1920px', height: '1080px', backgroundColor: COLORS.black, position: 'relative', overflow: 'hidden', fontFamily: '"HarmonyOS Sans SC", sans-serif' }}>
      <style>{CASTER_KEYFRAMES}</style>

      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.014) 1px, transparent 1px)', backgroundSize: '120px 120px, 120px 120px', opacity: 0.24 }} />
      <div style={{ position: 'absolute', left: '70px', top: '70px', width: '520px', height: '520px', border: '1px solid rgba(244,195,32,0.06)', transform: 'rotate(45deg)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: '-120px', bottom: '-120px', width: '460px', height: '460px', border: '1px solid rgba(255,255,255,0.03)', transform: 'rotate(45deg)', pointerEvents: 'none' }} />

      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '44px', background: 'rgba(255,255,255,0.02)', borderBottom: `1px solid ${COLORS.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', boxSizing: 'border-box', backdropFilter: 'blur(4px)', zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '10px', height: '10px', background: COLORS.yellow, boxShadow: '0 0 12px rgba(244,195,32,0.28)' }} />
          <span style={{ fontSize: '12px', fontWeight: '900', letterSpacing: '2px', color: COLORS.softWhite }}>
            FCUP_CASTER_INTERFACE
          </span>
        </div>
        <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '2px', color: 'rgba(255,255,255,0.38)' }}>
          {displayMode === 'STAFF' ? 'STAFF_THANKS // STABLE' : 'CASTER_CARD // STABLE'}
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '220px', left: 0, height: '2px', backgroundColor: 'rgba(255,255,255,0.07)', willChange: 'width, opacity', animation: 'lineGrow 1.5s ease-out forwards' }} />
      <div style={{ position: 'absolute', bottom: '60px', left: '80px', opacity: 1, zIndex: 10 }}>
        <div style={{ width: '44px', height: '2px', backgroundColor: COLORS.yellow, marginBottom: '10px' }} />
        <div style={{ color: 'rgba(255,255,255,0.26)', fontSize: '11px', fontWeight: '900', letterSpacing: '1.8px', textTransform: 'uppercase' }}>
          CASTER_SYS // 1920.1080.FCUP
        </div>
      </div>

      {displayMode === 'CASTERS' && (
        <div style={{ position: 'absolute', top: '60px', left: '80px', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ width: '35px', height: '35px', backgroundColor: COLORS.yellow, boxShadow: '0 0 16px rgba(244,195,32,0.18)' }} />
            <span style={{ fontSize: '36px', fontWeight: '900', color: COLORS.white, letterSpacing: '5px', textTransform: 'uppercase' }}>
              FRIES CUP
            </span>
          </div>
          <div style={{ width: '420px', height: '8px', background: `linear-gradient(90deg, ${COLORS.yellow} 0%, rgba(244,195,32,0.14) 100%)`, border: '1px solid rgba(244,195,32,0.16)', boxShadow: UI.yellowGlow, marginTop: '10px' }} />
          <span style={{ fontSize: '16px', fontWeight: '900', color: 'rgba(255,255,255,0.58)', marginTop: '12px', letterSpacing: '2.4px' }}>
            {matchData.info || ''}
          </span>
        </div>
      )}

      {displayMode === 'CASTERS' && casterCount > 0 && !isGridMode && (
        <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: casterCount === 1 ? '0' : '140px', zIndex: 5, position: 'relative' }}>
          {casters.map((caster, idx) => (
            <CasterCard key={caster.id || idx} caster={caster} delay={0.35 + idx * 0.18} index={idx} compact={false} />
          ))}
        </div>
      )}

      {displayMode === 'CASTERS' && casterCount > 0 && isGridMode && (
        <div style={{ position: 'absolute', top: casterCount === 4 ? '205px' : '200px', left: casterCount === 4 ? '70px' : '120px', right: casterCount === 4 ? '70px' : '120px', bottom: '120px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: casterCount === 4 ? '34px' : '42px', zIndex: 5 }}>
          {casters.map((caster, idx) => (
            <CasterCard key={caster.id || idx} caster={caster} delay={0.22 + idx * 0.08} index={idx} compact multiMode />
          ))}
        </div>
      )}

      {displayMode === 'CASTERS' && casterCount === 0 && (
        <div style={{ position: 'absolute', top: '210px', left: '50%', transform: 'translateX(-50%)', width: '900px', ...panelBase, borderTop: `2px solid ${COLORS.yellow}`, padding: '30px 36px', textAlign: 'center', zIndex: 5 }}>
          <div style={{ color: COLORS.white, fontSize: '28px', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase' }}>No Casters Loaded</div>
          <div style={{ color: COLORS.faintWhite, fontSize: '14px', marginTop: '12px', lineHeight: 1.7 }}>Please add at least one caster in the control panel.</div>
        </div>
      )}

      {displayMode === 'STAFF' && (
        <div style={{ position: 'absolute', top: '110px', left: '80px', right: '80px', bottom: '110px', display: 'grid', gridTemplateRows: 'auto 1fr', gap: '28px', zIndex: 5 }}>
          <div style={{ ...panelBase, borderTop: `2px solid ${COLORS.yellow}`, padding: '26px 30px' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.012) 0 1px, transparent 1px 22px)', pointerEvents: 'none', opacity: 0.12 }} />
            <div style={{ position: 'relative', zIndex: 1, display: 'grid', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '12px', height: '12px', background: COLORS.yellow }} />
                <span style={{ fontSize: '16px', fontWeight: '900', color: COLORS.softWhite, letterSpacing: '3px', textTransform: 'uppercase' }}>Staff Appreciation</span>
              </div>
              <div style={{ fontSize: '64px', fontWeight: '900', color: COLORS.white, lineHeight: 1, letterSpacing: '1px', textTransform: 'uppercase' }}>{staffTitle}</div>
              <div style={{ fontSize: '22px', fontWeight: '900', color: COLORS.yellow, letterSpacing: '2px' }}>{staffSubtitle}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: staffMembers.length > 5 ? '1fr 1fr' : '1fr', gap: '14px', alignContent: 'start' }}>
            {staffMembers.map((member, idx) => (
              <StaffRow key={`${member.name}-${idx}`} role={member.role} name={member.name} delay={0.18 + idx * 0.08} index={idx} />
            ))}

            {!staffMembers.length && (
              <div style={{ ...panelBase, padding: '24px 28px', border: `1px dashed ${COLORS.lineStrong}`, textAlign: 'center' }}>
                <div style={{ color: COLORS.white, fontWeight: '900', fontSize: '18px', letterSpacing: '2px', textTransform: 'uppercase' }}>No Staff Members</div>
                <div style={{ color: COLORS.faintWhite, fontSize: '13px', marginTop: '10px', lineHeight: 1.6 }}>Please add staff members in the control panel.</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}