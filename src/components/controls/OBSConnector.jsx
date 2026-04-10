import React, { useState, useEffect } from 'react';
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
      title: 'WEBSOCKET CONNECTION GUIDE',
      maxWidth: '680px', // 🚀 传给 Modal：让这个弹窗展开到 680px 宽
      message: `[ ENGLISH ]

To remote control your OBS from another device (e.g., iPad), follow these 3 steps:

STEP 1: ENABLE OBS ACCESS
In OBS, go to [Tools] -> [WebSocket Server Settings]. 
Check [Enable WebSocket server] and [Enable authentication]. 
Set a simple password (e.g., 123456).

STEP 2: ADD TO OBS
Add a [Browser] source in OBS (1920x1080).
Enter this EXACT URL (replace with your password) so the overlay auto-connects:
https://console.fries-cup.com/?pwd=YOUR_PASSWORD#overlay

STEP 3: CONNECT REMOTE
Ensure your iPad is on the same WiFi as the OBS PC. 
Open https://console.fries-cup.com/ on the iPad. 
Enter the OBS PC's local IP (e.g., 192.168.1.x) and the password above. 
Click CONNECT.

---------------------------------------------------

[ 中文说明 ]

为了让外部设备（如平板）能遥控 OBS 画面，请按以下 3 步操作：

第一步：开启 OBS 接口
在 OBS 菜单栏点击 [工具] -> [WebSocket 服务器设置]。
勾选 [启用 WebSocket 服务器] 和 [启用身份验证]，并设置一个密码（如 123456）。

第二步：植入直播画面
在 OBS 中添加一个 [浏览器] 源，宽度 1920，高度 1080。
网址必须这样填（用于让画面底层自动建立连接）：
https://console.fries-cup.com/?pwd=你的密码#overlay

第三步：连接遥控台
确保你的平板与 OBS 电脑在同一个 WiFi 下。
在平板浏览器中打开 https://console.fries-cup.com/。
在上方输入 OBS 电脑的局域网 IP（如 192.168.1.x）和刚才的密码。
点击 CONNECT 即可。`
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
          OBS: {obsStatus}
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
            DISCONNECT
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
            placeholder="Password"
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
            {obsStatus === 'connecting' ? '...' : 'CONNECT'}
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