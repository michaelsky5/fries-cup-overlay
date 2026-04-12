import React, { useState, useEffect, useRef } from 'react';
// 🚀 1. 引入 i18n
import { useTranslation } from 'react-i18next';
import { COLORS, panelBase, inputStyle, actionBtn, outlineBtn } from '../../constants/styles';

export default function FriesModal({ config, onClose }) {
  // 🚀 2. 初始化 t 函数
  const { t } = useTranslation();

  // 🚀 3. 在解构时注入翻译后的默认标题
  const { 
    isOpen, 
    type = 'alert', 
    title = t('common.systemMessage'), 
    message = '', 
    placeholder = '', 
    isDanger = false, 
    onConfirm, 
    maxWidth 
  } = config;
  
  const [inputValue, setInputValue] = useState('');
  
  const inputValueRef = useRef('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputValueRef.current = inputValue;
  }, [inputValue]);

  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      inputValueRef.current = '';
      document.body.classList.add('fc-modal-open'); 
      
      if (type === 'prompt') {
        const timer = setTimeout(() => inputRef.current?.focus(), 50);
        return () => clearTimeout(timer);
      }
    } else {
      document.body.classList.remove('fc-modal-open');
    }
    
    return () => document.body.classList.remove('fc-modal-open');
  }, [isOpen, type]);

  useEffect(() => {
    if (!isOpen) return;

    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        if (onConfirm) onConfirm(type === 'prompt' ? inputValueRef.current : true);
        onClose();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, type, onConfirm, onClose]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) onConfirm(type === 'prompt' ? inputValue : true);
    onClose();
  };

  const themeColor = isDanger ? COLORS.red : COLORS.yellow;

  return (
    <div 
      style={{ 
        position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', 
        background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(6px)', animation: 'modalBackdropFade 0.2s ease-out forwards'
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes modalBackdropFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalPop { 
          from { opacity: 0; transform: translateY(2vh) scale(0.96); } 
          to { opacity: 1; transform: translateY(0) scale(1); } 
        }
      `}</style>

      <div 
        style={{ 
          ...panelBase, 
          width: maxWidth || '460px', 
          maxWidth: '90%', 
          padding: '0', 
          border: `1px solid ${themeColor}`, boxShadow: `0 0 30px rgba(${isDanger ? '255,77,77' : '244,195,32'}, 0.15)`, 
          overflow: 'hidden', animation: 'modalPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ backgroundColor: themeColor, color: COLORS.black, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '8px', height: '8px', backgroundColor: COLORS.black }} />
          <span style={{ fontSize: '14px', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase' }}>{title}</span>
        </div>

        <div style={{ padding: '20px 24px', display: 'grid', gap: '16px' }}>
          {message && (
            <div style={{ color: COLORS.white, fontSize: '14px', lineHeight: 1.6, fontWeight: '800', whiteSpace: 'pre-wrap' }}>
              {message}
            </div>
          )}

          {type === 'prompt' && (
            <input 
              ref={inputRef}
              style={{ ...inputStyle, padding: '12px 14px', fontSize: '14px', borderColor: themeColor, color: COLORS.white }}
              placeholder={placeholder}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
            />
          )}

          <div style={{ display: 'grid', gridTemplateColumns: type === 'alert' ? '1fr' : '1fr 1fr', gap: '12px', marginTop: '8px' }}>
            {type !== 'alert' && (
              <button 
                style={{ ...outlineBtn, padding: '10px', fontSize: '13px', fontWeight: '900', display: 'flex', justifyContent: 'center', alignItems: 'center' }} 
                onClick={onClose}
              >
                {/* 🚀 4. 替换取消按钮 */}
                {t('common.cancel')}
              </button>
            )}
            <button 
              style={{ ...actionBtn, padding: '10px', fontSize: '13px', backgroundColor: themeColor, color: COLORS.black, fontWeight: '900', display: 'flex', justifyContent: 'center', alignItems: 'center' }} 
              onClick={handleConfirm}
            >
              {/* 🚀 5. 替换确认按钮 */}
              {t('common.confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}