import React, { useState, useEffect, useRef } from 'react';
import { COLORS, panelBase, inputStyle, actionBtn, outlineBtn } from '../../constants/styles';

export default function FriesModal({ config, onClose }) {
  const { isOpen, type = 'alert', title = 'SYSTEM MESSAGE', message = '', placeholder = '', isDanger = false, onConfirm } = config;
  
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  // 每次打开弹窗时，清空输入框并自动聚焦
  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      if (type === 'prompt') {
        const timer = setTimeout(() => inputRef.current?.focus(), 50);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, type]);

  // 🌟 修复快捷键失效问题：使用全局事件监听接管键盘操作
  useEffect(() => {
    if (!isOpen) return;

    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        // 如果是在 prompt 模式下，按回车等同于确认输入
        if (onConfirm) onConfirm(type === 'prompt' ? inputValue : true);
        onClose();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, type, inputValue, onConfirm, onClose]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) onConfirm(type === 'prompt' ? inputValue : true);
    onClose();
  };

  // 弹窗的主题色（如果是危险操作如删除记录，显示红色）
  const themeColor = isDanger ? COLORS.red : COLORS.yellow;

  return (
    <div 
      style={{ 
        position: 'fixed', 
        inset: 0, 
        zIndex: 99999, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'rgba(0, 0, 0, 0.85)', 
        backdropFilter: 'blur(6px)',
        animation: 'modalBackdropFade 0.2s ease-out forwards'
      }}
      onClick={onClose} // 点击背景关闭
    >
      <style>{`
        @keyframes modalBackdropFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalPop {
          from { opacity: 0; transform: translateY(-8vh) scale(0.96); }
          to { opacity: 1; transform: translateY(-10vh) scale(1); }
        }
      `}</style>

      <div 
        style={{ 
          ...panelBase, 
          width: '460px', 
          maxWidth: '90%', 
          padding: '0', 
          border: `1px solid ${themeColor}`, 
          boxShadow: `0 0 30px rgba(${isDanger ? '255,77,77' : '244,195,32'}, 0.15)`, 
          overflow: 'hidden', 
          animation: 'modalPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
        }}
        onClick={e => e.stopPropagation()} // 阻止冒泡，防止点到弹窗本体时关闭
      >
        {/* 弹窗头部 */}
        <div style={{ backgroundColor: themeColor, color: COLORS.black, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '8px', height: '8px', backgroundColor: COLORS.black }} />
          <span style={{ fontSize: '14px', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase' }}>{title}</span>
        </div>

        {/* 弹窗主体 */}
        <div style={{ padding: '20px 24px', display: 'grid', gap: '16px' }}>
          {message && (
            <div style={{ color: COLORS.white, fontSize: '14px', lineHeight: 1.6, fontWeight: '800', whiteSpace: 'pre-wrap' }}>
              {message}
            </div>
          )}

          {/* Prompt 模式输入框 */}
          {type === 'prompt' && (
            <input 
              ref={inputRef}
              style={{ ...inputStyle, padding: '12px 14px', fontSize: '14px', borderColor: themeColor, color: COLORS.white }}
              placeholder={placeholder}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
            />
          )}

          {/* 按钮组 */}
          <div style={{ display: 'grid', gridTemplateColumns: type === 'alert' ? '1fr' : '1fr 1fr', gap: '12px', marginTop: '8px' }}>
            {type !== 'alert' && (
              <button 
                style={{ 
                  ...outlineBtn, 
                  padding: '10px', 
                  fontSize: '13px', 
                  fontWeight: '900',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }} 
                onClick={onClose}
              >
                CANCEL [ESC]
              </button>
            )}
            <button 
              style={{ 
                ...actionBtn, 
                padding: '10px', 
                fontSize: '13px', 
                backgroundColor: themeColor, 
                color: COLORS.black, 
                fontWeight: '900',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }} 
              onClick={handleConfirm}
            >
              CONFIRM [ENTER]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}