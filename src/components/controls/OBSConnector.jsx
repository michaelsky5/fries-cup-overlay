import React, { useState, useEffect } from 'react';
// 🚀 引入 i18n
import { useTranslation } from 'react-i18next';
import { useOBS } from '../../contexts/OBSContext';
import { useMatchContext } from '../../contexts/MatchContext'; 

const COLORS = { 
  black: '#2a2a2a', 
  yellow: '#f4c320', 
  green: '#2ecc71', 
  red: '#ff4d4d', 
  line: 'rgba(255,255,255,0.18)',
  faintWhite: 'rgba(255,255,255,0.45)'
};

export default function OBSConnector() {
  // 🚀 初始化翻译钩子
  const { t } = useTranslation();

  const { obsStatus, obsConfig, connectOBS, disconnectOBS } = useOBS();
  const { showModal } = useMatchContext(); 
  const [url, setUrl] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (obsConfig) {
      setUrl(obsConfig.url || 'ws://127.0.0.1:4455');
      setPassword(obsConfig.password || '');
    }
  }, [obsConfig]);

  const handleConnect = () => {
    connectOBS(url, password);
  };

  const handleShowHelp = () => {
    showModal({
      type: 'alert',
      title: t('obsConnector.guideTitle'),
      maxWidth: '680px',
      message: t('obsConnector.guideText')
    });
  };

  const statusColor = 
    obsStatus === 'connected' ? COLORS.green :
    obsStatus === 'error' ? COLORS.red : 
    obsStatus === 'connecting' ? COLORS.yellow : COLORS.faintWhite;

  const controlHeight = '26px';

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '10px',
      color: '#fff',
      fontFamily: '"HarmonyOS Sans SC", sans-serif'
    }}>
      {/* 状态指示灯 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ 
          width: 8, 
          height: 8, 
          backgroundColor: statusColor, 
          boxShadow: obsStatus !== 'disconnected' ? `0 0 8px ${statusColor}` : 'none' 
        }} />
        <span style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', color: obsStatus === 'disconnected' ? COLORS.faintWhite : '#fff' }}>
          {t('obsConnector.status', { status: obsStatus })}
        </span>
      </div>

      {obsStatus === 'connected' ? (
        <>
          <div style={{ fontSize: '10px', color: COLORS.faintWhite, maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: '4px' }}>
            {url}
          </div>
          <button 
            onClick={disconnectOBS}
            style={{ 
              height: controlHeight,
              background: 'transparent', 
              border: `1px solid ${COLORS.red}`, 
              color: COLORS.red, 
              padding: '0 10px', 
              fontSize: '10px',
              fontWeight: 900, 
              letterSpacing: '0.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255, 77, 77, 0.1)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            {t('obsConnector.disconnect')}
          </button>
        </>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input 
            value={url} 
            onChange={(e) => setUrl(e.target.value)} 
            placeholder="ws://IP:PORT"
            style={{ 
              height: controlHeight,
              background: 'rgba(0,0,0,0.2)', 
              border: `1px solid ${COLORS.line}`, 
              color: '#fff', 
              padding: '0 8px', 
              fontSize: '11px', 
              width: '120px',
              boxSizing: 'border-box',
              outline: 'none',
              fontFamily: 'inherit'
            }}
            onFocus={(e) => e.target.style.borderColor = COLORS.yellow}
            onBlur={(e) => e.target.style.borderColor = COLORS.line}
          />
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder={t('obsConnector.passwordPlaceholder')}
            style={{ 
              height: controlHeight,
              background: 'rgba(0,0,0,0.2)', 
              border: `1px solid ${COLORS.line}`, 
              color: '#fff', 
              padding: '0 8px', 
              fontSize: '11px', 
              width: '80px',
              boxSizing: 'border-box',
              outline: 'none',
              fontFamily: 'inherit'
            }}
            onFocus={(e) => e.target.style.borderColor = COLORS.yellow}
            onBlur={(e) => e.target.style.borderColor = COLORS.line}
          />
          <button 
            onClick={handleConnect}
            disabled={obsStatus === 'connecting'}
            style={{ 
              height: controlHeight,
              background: 'transparent', 
              border: `1px solid ${COLORS.yellow}`, 
              color: COLORS.yellow, 
              padding: '0 12px', 
              fontSize: '11px',
              fontWeight: 900, 
              letterSpacing: '0.5px',
              cursor: obsStatus === 'connecting' ? 'not-allowed' : 'pointer', 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
              opacity: obsStatus === 'connecting' ? 0.5 : 1,
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => { if(obsStatus !== 'connecting') e.currentTarget.style.background = 'rgba(244, 195, 32, 0.1)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            {obsStatus === 'connecting' ? t('obsConnector.connecting') : t('obsConnector.connect')}
          </button>

          <button 
            onClick={handleShowHelp}
            style={{ 
              height: controlHeight,
              width: controlHeight,
              background: 'transparent', 
              border: `1px solid ${COLORS.line}`, 
              color: COLORS.faintWhite, 
              fontSize: '12px',
              fontWeight: 900, 
              cursor: 'pointer', 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { 
              e.currentTarget.style.color = '#fff'; 
              e.currentTarget.style.borderColor = '#fff';
            }}
            onMouseOut={(e) => { 
              e.currentTarget.style.color = COLORS.faintWhite; 
              e.currentTarget.style.borderColor = COLORS.line;
            }}
            title="Connection Guide"
          >
            ?
          </button>
        </div>
      )}
    </div>
  );
}