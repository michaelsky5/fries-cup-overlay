import React, { useState, useEffect, useRef } from 'react';
import { COLORS, UI, panelBase, labelStyle, btnStyle, BASE_SCENE_W, BASE_SCENE_H, getDensityTokens } from '../../constants/styles';

export const ShellPanel = ({ title, right, children, accent = false, style = {}, bodyStyle = {}, density = 'standard' }) => {
  const t = getDensityTokens(density);

  return (
    <div style={{ ...panelBase, ...style, borderTop: accent ? `2px solid ${COLORS.yellow}` : UI.outerFrame }}>
      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.012) 0 1px, transparent 1px 22px)', pointerEvents: 'none', opacity: 0.14 }} />
      <div style={{ position: 'relative', zIndex: 1, padding: t.panelPadding, ...bodyStyle }}>
        {(title || right) && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: `${t.panelHeaderGap}px`,
              flexWrap: 'wrap',
              borderBottom: `1px solid ${COLORS.line}`,
              paddingBottom: density === 'ultra' ? '8px' : '10px',
              marginBottom: density === 'ultra' ? '10px' : '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div style={{ width: '8px', height: '8px', background: COLORS.yellow, flexShrink: 0 }} />
              <span
                style={{
                  fontSize: `${t.titleSize}px`,
                  fontWeight: '900',
                  color: COLORS.white,
                  letterSpacing: t.titleLetterSpacing,
                  textTransform: 'uppercase'
                }}
              >
                {title}
              </span>
            </div>
            {right}
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export const Field = ({ label, children, style = {}, density = 'standard' }) => {
  const t = getDensityTokens(density);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: density === 'ultra' ? '5px' : density === 'compact' ? '6px' : '7px',
        ...style
      }}
    >
      <label
        style={{
          ...labelStyle,
          fontSize: `${t.labelSize || 11}px`,
          letterSpacing: density === 'ultra' ? '1.2px' : '1.4px',
          marginBottom: 0
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
};

export const TogglePill = ({ active, onClick, onText, offText, onColor = COLORS.green, offColor = '#555', density = 'standard' }) => {
  const t = getDensityTokens(density);
  return (
    <button
      style={{
        ...btnStyle,
        padding: density === 'ultra' ? '7px 10px' : '8px 12px',
        fontSize: `${t.buttonFontSize}px`,
        backgroundColor: active ? onColor : offColor,
        color: active ? '#fff' : '#bbb',
        transition: 'background-color 0.2s ease, color 0.2s ease', // 🌟 添加平滑过渡
        cursor: 'pointer'
      }}
      onClick={onClick}
    >
      {active ? onText : offText}
    </button>
  );
};

export const TabButton = ({ active, onClick, label, index, compact = false, density = 'standard' }) => {
  const t = getDensityTokens(density);
  return (
    <button
      onClick={onClick}
      style={{
        padding: compact ? '10px 12px' : t.tabPadding,
        backgroundColor: active ? COLORS.yellow : COLORS.panel,
        color: active ? COLORS.black : COLORS.softWhite,
        border: UI.outerFrame,
        borderBottom: active ? `1px solid ${COLORS.yellow}` : UI.outerFrame,
        fontWeight: '900',
        fontSize: compact ? '12px' : `${t.tabFontSize}px`,
        cursor: 'pointer',
        fontFamily: '"HarmonyOS Sans SC", sans-serif',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        transition: 'all 0.2s ease' // 🌟 添加平滑过渡
      }}
    >
      {label}
      <span style={{ fontSize: '10px', marginLeft: '8px', opacity: active ? 0.7 : 0.45 }}>[{index}]</span>
    </button>
  );
};

export const QuickStat = ({ label, value, valueColor = COLORS.white, compact = false, density = 'standard' }) => {
  const t = getDensityTokens(density);
  const isCompactStat = compact && (density === 'compact' || density === 'ultra');

  // 🌟 清理难以阅读的嵌套三元运算符
  let boxPadding = t.panelPaddingLg;
  if (compact) {
    if (density === 'ultra') boxPadding = '8px 10px';
    else if (density === 'compact') boxPadding = '9px 10px';
    else boxPadding = '9px 12px';
  }

  return (
    <div
      style={{
        ...panelBase,
        padding: boxPadding,
        minWidth: 0
      }}
    >
      <div
        style={{
          fontSize: '10px',
          color: COLORS.faintWhite,
          fontWeight: '900',
          letterSpacing: '1.8px',
          textTransform: 'uppercase',
          lineHeight: 1.2
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: compact ? '4px' : '8px',
          fontSize: `${compact ? (isCompactStat ? Math.max(16, t.statValueCompact - 4) : t.statValueCompact) : t.statValue}px`,
          fontWeight: '900',
          color: valueColor,
          letterSpacing: isCompactStat ? '0.5px' : '1px',
          textTransform: 'uppercase',
          overflow: 'hidden',
          textOverflow: isCompactStat ? 'clip' : 'ellipsis',
          whiteSpace: isCompactStat ? 'normal' : 'nowrap',
          wordBreak: 'break-word',
          lineHeight: isCompactStat ? 1.05 : 1.1
        }}
      >
        {value}
      </div>
    </div>
  );
};

export const SectionHint = ({ text, density = 'standard', style = {} }) => {
  const t = getDensityTokens(density);

  return (
    <div
      style={{
        color: COLORS.faintWhite,
        fontSize: `${Math.max(10, (t.labelSize || 11) - 1)}px`,
        lineHeight: density === 'spacious' ? 1.65 : 1.55,
        ...style
      }}
    >
      {text}
    </div>
  );
};

export const MonitorFrame = ({ title, accent = COLORS.yellow, children, compact = false, density = 'standard' }) => {
  const t = getDensityTokens(density);
  return (
    <div style={{ ...panelBase, padding: compact ? '10px' : t.panelPadding, borderTop: `2px solid ${accent}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', background: accent }} />
          <span style={{ fontSize: compact ? '11px' : `${t.titleSize - 1}px`, fontWeight: '900', color: COLORS.white, letterSpacing: '2px', textTransform: 'uppercase' }}>{title}</span>
        </div>
        <span style={{ fontSize: '10px', color: COLORS.faintWhite, fontWeight: '900', letterSpacing: '1.5px', textTransform: 'uppercase' }}>16:9 Monitor</span>
      </div>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', background: '#000', overflow: 'hidden', border: UI.outerFrame, boxShadow: UI.insetLine }}>
        {children}
      </div>
    </div>
  );
};

// 🌟 神级优化：使用 useRef 直接操纵 DOM 样式，完美绕过 React Render 周期
export function AutoFitScene({ children }) {
  const viewportRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    const el = viewportRef.current;
    const contentEl = contentRef.current;
    if (!el || !contentEl) return;

    const updateScale = () => {
      const rect = el.getBoundingClientRect();
      const nextScale = Math.min(rect.width / BASE_SCENE_W, rect.height / BASE_SCENE_H);
      
      const scaledWidth = BASE_SCENE_W * nextScale;
      const scaledHeight = BASE_SCENE_H * nextScale;
      const offsetX = (rect.width - scaledWidth) / 2;
      const offsetY = (rect.height - scaledHeight) / 2;

      // 🌟 直接修改原生 DOM，浏览器 GPU 直接接管，不触发任何 React 重渲染！
      contentEl.style.transform = `scale(${nextScale})`;
      contentEl.style.left = `${offsetX}px`;
      contentEl.style.top = `${offsetY}px`;
    };

    // 初始执行一次
    updateScale();
    
    // 监听容器大小变化
    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(el);
    window.addEventListener('resize', updateScale);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  return (
    <div ref={viewportRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#000' }}>
      <div
        ref={contentRef}
        style={{
          position: 'absolute',
          width: `${BASE_SCENE_W}px`,
          height: `${BASE_SCENE_H}px`,
          transformOrigin: 'top left',
          pointerEvents: 'none',
          willChange: 'transform' // 🌟 开启硬件加速
        }}
      >
        {children}
      </div>
    </div>
  );
}