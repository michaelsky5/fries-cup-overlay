import React, { useEffect } from 'react';
import { COLORS } from '../../constants/styles';

export default function IntroSplashScreen({ duration = 2200, onFinish }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onFinish) onFinish();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onFinish]);

  const durationInSeconds = (duration / 1000).toFixed(2);

  return (
    <div
      aria-hidden="true"
      style={{
        minHeight: '100vh',
        background: COLORS.mainDark,
        color: COLORS.white,
        fontFamily: '"HarmonyOS Sans SC", sans-serif',
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        overflow: 'hidden',
        // 【修复 1 & 2】：移除了错误的转义符，并将动画放在最外层，确保背景和文字一起平滑淡出
        animation: `introFadeOut ${durationInSeconds}s ease forwards`
      }}
    >
      <style>{`
        @keyframes introLineIn {
          0% { opacity: 0; transform: scaleX(0.2); }
          100% { opacity: 1; transform: scaleX(1); }
        }
        @keyframes introTextIn {
          0% { opacity: 0; transform: translateY(18px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes introSubIn {
          0% { opacity: 0; transform: translateY(12px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes introFadeOut {
          0%, 78% { opacity: 1; visibility: visible; }
          100% { opacity: 0; visibility: hidden; }
        }
      `}</style>

      {/* 背景网格 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.014) 1px, transparent 1px)',
          backgroundSize: '120px 120px, 120px 120px',
          opacity: 0.1
        }}
      />

      {/* 内容容器 */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px'
          // 这里的 animation 已经移到了最外层父 div 上
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '1100px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center'
          }}
        >
          {/* 装饰线 */}
          <div
            style={{
              width: '108px',
              height: '2px',
              background: COLORS.yellow,
              marginBottom: '28px',
              transformOrigin: 'center',
              opacity: 0,
              animation: 'introLineIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) 0.12s forwards'
            }}
          />

          {/* 主标题 */}
          <div
            style={{
              fontSize: 'clamp(24px, 3vw, 38px)',
              fontWeight: 900,
              lineHeight: 1.08,
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              color: COLORS.white,
              opacity: 0,
              animation: 'introTextIn 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.28s forwards'
            }}
          >
            BUILT BY MICHAELSKY5
          </div>

          {/* 副标题 */}
          <div
            style={{
              marginTop: '12px',
              fontSize: 'clamp(11px, 1.2vw, 14px)',
              fontWeight: 700,
              lineHeight: 1.2,
              textTransform: 'uppercase',
              letterSpacing: '0.28em',
              color: COLORS.yellow,
              opacity: 0,
              animation: 'introSubIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.46s forwards'
            }}
          >
            FOR THE FRIES CUP
          </div>
        </div>
      </div>
    </div>
  );
}