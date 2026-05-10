import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useMatchContext } from '../../contexts/MatchContext';

const COLORS = {
  black: '#2a2a2a',
  yellow: '#f4c320',
  green: '#2ecc71',
  red: '#ff4d4d',
  line: 'rgba(255,255,255,0.18)',
  faintWhite: 'rgba(255,255,255,0.45)',
  softWhite: 'rgba(255,255,255,0.72)'
};

const getExplicitRoomId = () => {
  if (typeof window === 'undefined') return '';

  const url = new URL(window.location.href);

  return (
    url.searchParams.get('room') ||
    url.searchParams.get('roomId') ||
    url.searchParams.get('match') ||
    url.searchParams.get('matchId') ||
    ''
  ).trim();
};

const buildOverlayUrl = () => {
  if (typeof window === 'undefined') return '';

  const roomId = getExplicitRoomId();

  if (!roomId) return '';

  const url = new URL('/', window.location.origin);
  const currentUrl = new URL(window.location.href);
  const syncUrl = currentUrl.searchParams.get('syncUrl') || currentUrl.searchParams.get('sync') || '';

  url.searchParams.set('room', roomId);
  if (syncUrl) url.searchParams.set('syncUrl', syncUrl);
  url.hash = 'overlay';

  return url.toString();
};

export default function OBSConnector() {
  const { t } = useTranslation();
  const { showModal, programSyncServerUrl } = useMatchContext();

  const roomId = useMemo(() => getExplicitRoomId(), []);
  const overlayUrl = useMemo(() => buildOverlayUrl(), []);
  const hasRoom = !!roomId;

  const statusColor = hasRoom ? COLORS.green : COLORS.yellow;
  const statusLabel = hasRoom ? 'ROOM SYNC' : 'ROOM REQUIRED';

  const handleShowHelp = () => {
    showModal({
      type: 'alert',
      title: 'BROADCAST ROOM / OBS SETUP',
      maxWidth: '720px',
      message: hasRoom
        ? `当前已创建导播房间：${roomId}\n\nOBS 不需要连接 WebSocket。\n请在 OBS Browser Source 中使用 BROADCAST ROOM 面板生成的 OBS URL：\n\n${overlayUrl}\n\nProgram 是唯一正式播出源，Overlay 会自动跟随当前 Room 的 Program 状态。`
        : '当前还没有创建导播房间。\n\n请先点击顶部 BROADCAST ROOM，然后点击 CREATE ROOM。\n创建后复制 OBS URL 到 OBS Browser Source。\n\n未创建房间前，TAKE / 推送 / 上墙会被阻止，避免多个导播互相覆盖。'
    });
  };

  const handleCopyOverlay = () => {
    if (!overlayUrl || typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      handleShowHelp();
      return;
    }

    navigator.clipboard.writeText(overlayUrl).then(() => {
      showModal({
        type: 'alert',
        title: 'OBS URL COPIED',
        message: '已复制 OBS Overlay 地址。请把它填入 OBS Browser Source。'
      });
    }).catch(handleShowHelp);
  };

  const controlHeight = '26px';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: '#fff',
        fontFamily: '"HarmonyOS Sans SC", sans-serif'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div
          style={{
            width: 8,
            height: 8,
            backgroundColor: statusColor,
            boxShadow: `0 0 8px ${statusColor}`
          }}
        />

        <span
          style={{
            fontSize: '11px',
            fontWeight: 900,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: hasRoom ? '#fff' : COLORS.yellow
          }}
        >
          {statusLabel}
        </span>
      </div>

      {hasRoom && (
        <div
          style={{
            fontSize: '10px',
            color: COLORS.faintWhite,
            maxWidth: '130px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            paddingLeft: '2px',
            fontFamily: 'monospace'
          }}
          title={roomId}
        >
          {roomId}
        </div>
      )}

      {hasRoom && (
        <button
          type="button"
          onClick={handleCopyOverlay}
          style={{
            height: controlHeight,
            background: 'rgba(244,195,32,0.08)',
            border: `1px solid ${COLORS.yellow}`,
            color: COLORS.yellow,
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
          onMouseOver={e => { e.currentTarget.style.background = 'rgba(244,195,32,0.16)'; }}
          onMouseOut={e => { e.currentTarget.style.background = 'rgba(244,195,32,0.08)'; }}
        >
          COPY OBS
        </button>
      )}

      <button
        type="button"
        onClick={handleShowHelp}
        style={{
          height: controlHeight,
          width: controlHeight,
          background: 'transparent',
          border: `1px solid ${hasRoom ? COLORS.line : COLORS.yellow}`,
          color: hasRoom ? COLORS.faintWhite : COLORS.yellow,
          fontSize: '12px',
          fontWeight: 900,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box',
          transition: 'all 0.2s'
        }}
        onMouseOver={e => {
          e.currentTarget.style.color = '#fff';
          e.currentTarget.style.borderColor = '#fff';
        }}
        onMouseOut={e => {
          e.currentTarget.style.color = hasRoom ? COLORS.faintWhite : COLORS.yellow;
          e.currentTarget.style.borderColor = hasRoom ? COLORS.line : COLORS.yellow;
        }}
        title={t('obsConnector.guideTitle', 'Broadcast Room Guide')}
      >
        ?
      </button>

      <div
        style={{
          display: 'none'
        }}
        title={programSyncServerUrl || ''}
      />
    </div>
  );
}