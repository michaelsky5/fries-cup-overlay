import React, { useEffect, useState } from 'react';
// 🚀 引入 i18n
import { useTranslation } from 'react-i18next';
import { useMatchContext } from '../../contexts/MatchContext';
import { COLORS, UI, panelBase } from '../../constants/styles';
import { ShellPanel, Field, SectionHint } from '../common/SharedUI';
import { createEditorUi } from '../../utils/editorUi';

// 引入刚刚写好的 OCR 弹窗组件
import OcrScannerModal from './OcrScannerModal';
// 🌟 1. 引入你的自定义工业风弹窗
import FriesModal from '../common/FriesModal';

// 引入图片处理工具，用于生成 OBS 可读取的 Base64
import { processImageForStorage } from '../../utils/imageHelper';

const PRO_DEFAULTS = {
  cropW: 1000,
  cropH: 320,
  cropX: 460,
  cropY1: 195,
  cropY2: 600,
  cropScale: 100
};

export default function StatsEditor({ isUltra = false, density = 'standard', densityTokens }) {
  // 🚀 初始化翻译钩子
  const { t: tr } = useTranslation();

  const { matchData, updateData } = useMatchContext();

  // 控制 OCR 弹窗的开关
  const [showOcrModal, setShowOcrModal] = useState(false);
  
  // 🌟 2. 控制自定义警告弹窗的开关与配置
  const [modalConfig, setModalConfig] = useState({ isOpen: false });

  const t = densityTokens || {
    blockGap: 10,
    panelPadding: '12px 14px',
    panelPaddingLg: '14px 16px',
    buttonPadding: '8px 10px',
    buttonFontSize: 12
  };

  const ui = createEditorUi(densityTokens, density);

  const rowH = density === 'spacious' ? 40 : 36;
  const gap = density === 'spacious' ? 10 : 8;
  const leftColWidth = density === 'spacious' ? '400px' : '370px';

  const statsVisibility = matchData.statsTemplateVisibility || {};
  const statsTemplateData = matchData.statsTemplateData || {};
  const statsTheme = matchData.statsTheme || 'CLASSIC';

  const controlInput = {
    ...ui.input,
    minHeight: rowH,
    height: rowH,
    boxSizing: 'border-box',
    paddingTop: 0,
    paddingBottom: 0,
    fontSize: density === 'spacious' ? '13px' : '12px'
  };

  const numberInputStyle = {
    ...controlInput,
    textAlign: 'center',
    paddingLeft: '6px',
    paddingRight: '6px',
    fontFamily: 'monospace',
    fontWeight: 900,
    fontSize: density === 'spacious' ? '18px' : '16px',
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${COLORS.line}`,
    color: COLORS.white
  };

  const actionBtn = {
    ...ui.actionBtn,
    minHeight: rowH,
    height: rowH,
    boxSizing: 'border-box',
    fontWeight: 900
  };

  const outlineBtn = {
    ...ui.outlineBtn,
    minHeight: rowH,
    height: rowH,
    boxSizing: 'border-box',
    fontWeight: 900
  };

  const modeBtn = active => ({
    border: 'none',
    cursor: 'pointer',
    minHeight: rowH,
    height: rowH,
    fontWeight: 900,
    fontSize: `${t.buttonFontSize}px`,
    backgroundColor: active ? COLORS.yellow : 'transparent',
    color: active ? COLORS.black : COLORS.softWhite,
    transition: 'background-color 0.2s, color 0.2s'
  });

  // 核心修复：改为异步处理并调用 processImageForStorage
  const processImageFile = async (file) => {
    if (!file.type.startsWith('image/')) {
      alert(tr('statsEditor.invalidImage'));
      return;
    }

    if (matchData.statsImageTempUrl && matchData.statsImageTempUrl.startsWith('blob:')) {
      URL.revokeObjectURL(matchData.statsImageTempUrl);
    }

    try {
      const base64Image = await processImageForStorage(file);
      updateData({
        ...matchData,
        statsImageTempUrl: base64Image,
        statsMode: 'IMAGE'
      });
    } catch (error) {
      console.error("图片处理失败:", error);
      alert("图片处理失败，请重试！");
    }
  };

  const handleStatsImageUpload = e => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
    e.target.value = '';
  };

  useEffect(() => {
    const handlePaste = e => {
      if (document.activeElement.tagName === 'INPUT' && document.activeElement.type !== 'file') return;

      const items = (e.clipboardData || e.originalEvent.clipboardData).items;
      for (let index in items) {
        const item = items[index];
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) processImageFile(file);
          break;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [matchData, updateData]);

  // 修复：只撤销 blob 链接，防止误伤 base64
  const clearStatsTempImage = () => {
    if (matchData.statsImageTempUrl && matchData.statsImageTempUrl.startsWith('blob:')) {
      URL.revokeObjectURL(matchData.statsImageTempUrl);
    }
    updateData({ ...matchData, statsImageTempUrl: '' });
  };

  const toggleVisibility = visKey => {
    const current = statsVisibility[visKey] ?? true;
    updateData({
      ...matchData,
      statsTemplateVisibility: { ...statsVisibility, [visKey]: !current }
    });
  };

  const setStatValue = (key, value) => {
    updateData({
      ...matchData,
      statsTemplateData: { ...(matchData.statsTemplateData || {}), [key]: value }
    });
  };

  const updateCrop = (key, val) => updateData({ ...matchData, [key]: Number(val) });

  const resetProDefaults = () => updateData({ ...matchData, ...PRO_DEFAULTS });

  const swapProTeams = () => {
    updateData({
      ...matchData,
      teamA: matchData.teamB || '',
      teamB: matchData.teamA || '',
      teamShortA: matchData.teamShortB || '',
      teamShortB: matchData.teamShortA || '',
      logoA: matchData.logoB || '',
      logoB: matchData.logoA || '',
      logoBgA: matchData.logoBgB || '',
      logoBgB: matchData.logoBgA || '',
      scoreA: matchData.scoreB ?? '',
      scoreB: matchData.scoreA ?? ''
    });
  };

  const handleApplyOcrData = (extractedData) => {
    const calcSum = (teamArr, key) => teamArr.reduce((acc, player) => acc + (Number(player[key]) || 0), 0);

    const newTemplateData = {
      elimsA: calcSum(extractedData.teamA, 'elim'),
      assistsA: calcSum(extractedData.teamA, 'ast'),
      deathsA: calcSum(extractedData.teamA, 'dth'),
      damageA: calcSum(extractedData.teamA, 'dmg'),
      healingA: calcSum(extractedData.teamA, 'heal'),
      mitigatedA: calcSum(extractedData.teamA, 'block'),

      elimsB: calcSum(extractedData.teamB, 'elim'),
      assistsB: calcSum(extractedData.teamB, 'ast'),
      deathsB: calcSum(extractedData.teamB, 'dth'),
      damageB: calcSum(extractedData.teamB, 'dmg'),
      healingB: calcSum(extractedData.teamB, 'heal'),
      mitigatedB: calcSum(extractedData.teamB, 'block'),
    };

    updateData({
      ...matchData,
      statsTemplateData: { ...(matchData.statsTemplateData || {}), ...newTemplateData }
    });
  };

  // 🌟 3. 改写一键清空：拉起你的自定义工业风警告弹窗
  const clearAllStats = () => {
    setModalConfig({
      isOpen: true,
      type: 'confirm',
      isDanger: true, // 启用红色警告样式
      title: tr('statsEditor.warningResetTitle'),
      message: tr('statsEditor.warningResetMsg'),
      maxWidth: '420px',
      onConfirm: () => {
        updateData({
          ...matchData,
          statsTemplateData: {} // 将数据直接重置为空
        });
      }
    });
  };

  const statRows = [
    ['elims', tr('statsEditor.totalElims'), 'elimsA', 'elimsB'],
    ['assists', tr('statsEditor.totalAssists'), 'assistsA', 'assistsB'],
    ['deaths', tr('statsEditor.totalDeaths'), 'deathsA', 'deathsB'],
    ['damage', tr('statsEditor.totalDamage'), 'damageA', 'damageB'],
    ['healing', tr('statsEditor.totalHealing'), 'healingA', 'healingB'],
    ['mitigated', tr('statsEditor.totalMitigated'), 'mitigatedA', 'mitigatedB']
  ];

  const gridTemplateConfig = isUltra ? '48px 1fr 1fr' : '48px 190px 1fr 1fr';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isUltra ? '1fr' : `${leftColWidth} minmax(0,1fr)`, gap: t.blockGap, alignItems: 'stretch' }}>
      
      {/* 渲染自定义弹窗 */}
      <FriesModal 
        config={modalConfig} 
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))} 
      />

      {/* 渲染 OCR 弹窗 */}
      {showOcrModal && (
        <OcrScannerModal 
          onClose={() => setShowOcrModal(false)}
          onApplyData={handleApplyOcrData}
          teamA={matchData.teamA}
          teamB={matchData.teamB}
          initialImage={matchData.statsImageTempUrl} 
        />
      )}

      <ShellPanel title={tr('statsEditor.title')} accent density={density}>
        <div style={{ display: 'grid', gap }}>
          <Field label={tr('statsEditor.displayMode')} density={density}>
            <div style={{ display: 'grid', gridTemplateColumns: isUltra ? '1fr' : '1fr 1fr', backgroundColor: '#111', border: UI.innerFrame }}>
              <button style={modeBtn(matchData.statsMode === 'IMAGE')} onClick={() => updateData({ ...matchData, statsMode: 'IMAGE' })}>
                {tr('statsEditor.imageUpload')}
              </button>
              <button style={modeBtn(matchData.statsMode === 'TEMPLATE')} onClick={() => updateData({ ...matchData, statsMode: 'TEMPLATE', statsTheme: 'CLASSIC' })}>
                {tr('statsEditor.dataTemplate')}
              </button>
            </div>
          </Field>

          <Field label={tr('statsEditor.displayTheme')} density={density}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', backgroundColor: '#111', border: UI.innerFrame }}>
              <button
                style={modeBtn(statsTheme === 'CLASSIC')}
                onClick={() => updateData({ ...matchData, statsTheme: 'CLASSIC' })}
              >
                {tr('statsEditor.classicTheme')}
              </button>
              <button
                style={modeBtn(statsTheme === 'PRO')}
                onClick={() => updateData({ ...matchData, statsTheme: 'PRO', statsMode: 'IMAGE' })}
              >
                {tr('statsEditor.proTheme')}
              </button>
            </div>
          </Field>

          <div style={{ ...panelBase, padding: t.panelPadding, borderLeft: `3px solid ${matchData.statsMode === 'IMAGE' ? COLORS.yellow : 'rgba(255,255,255,0.08)'}`, display: 'grid', gap, alignContent: 'start' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap, alignItems: 'center', paddingBottom: gap, borderBottom: `1px solid ${COLORS.line}` }}>
              <div>
                <div style={{ color: COLORS.white, fontWeight: 900, fontSize: density === 'spacious' ? '13px' : '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  {tr('statsEditor.imageSource')}
                </div>
                <div style={{ color: COLORS.faintWhite, fontSize: '10px', marginTop: '4px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  {tr('statsEditor.imageMode')}
                </div>
              </div>
              <div style={{ minHeight: rowH, height: rowH, minWidth: '64px', padding: '0 10px', border: `1px solid ${matchData.statsImageTempUrl ? 'rgba(244,195,32,0.35)' : COLORS.line}`, background: matchData.statsImageTempUrl ? 'rgba(244,195,32,0.14)' : 'rgba(255,255,255,0.02)', color: matchData.statsImageTempUrl ? COLORS.yellow : COLORS.faintWhite, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', boxSizing: 'border-box', whiteSpace: 'nowrap' }}>
                {matchData.statsImageTempUrl ? tr('statsEditor.temp') : tr('statsEditor.path')}
              </div>
            </div>

            <Field label={tr('statsEditor.imagePathLabel')} density={density}>
              <input
                style={{ ...controlInput, fontWeight: 700 }}
                value={matchData.statsImagePath || ''}
                onChange={e => updateData({ ...matchData, statsImagePath: e.target.value })}
                placeholder="/assets/screenshots/placeholder.png"
              />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: isUltra ? '1fr' : '1fr 1fr', gap }}>
              <label style={{ ...actionBtn, backgroundColor: COLORS.yellow, color: COLORS.black, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', textAlign: 'center', width: '100%' }}>
                {tr('statsEditor.uploadPasted')}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleStatsImageUpload} />
              </label>
              <button
                style={{ ...outlineBtn, borderColor: COLORS.yellow, color: COLORS.yellow }}
                onClick={() => updateData({ ...matchData, statsImagePath: '/assets/screenshots/placeholder.png' })}
              >
                {tr('statsEditor.defaultPath')}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isUltra ? '1fr' : '1fr 1fr', gap }}>
              <button style={{ ...outlineBtn, borderColor: COLORS.red, color: COLORS.red }} onClick={clearStatsTempImage}>
                {tr('statsEditor.clearUpload')}
              </button>
              <button style={{ ...outlineBtn, borderColor: COLORS.yellow, color: COLORS.yellow }} onClick={swapProTeams}>
                {tr('statsEditor.swapTeam')}
              </button>
            </div>

            {statsTheme === 'PRO' && (
              <div style={{ marginTop: '4px', paddingTop: gap, borderTop: `1px dashed ${COLORS.lineStrong}`, display: 'grid', gap }}>
                <div style={{ display: 'grid', gridTemplateColumns: isUltra ? '1fr' : '1fr auto', gap, alignItems: 'center' }}>
                  <div style={{ fontSize: '11px', color: COLORS.yellow, fontWeight: 900, textTransform: 'uppercase' }}>
                    {tr('statsEditor.proMaskCalib')}
                  </div>
                  {!isUltra && (
                    <button style={{ ...outlineBtn, minHeight: rowH, height: rowH, borderColor: COLORS.lineStrong, color: COLORS.white }} onClick={resetProDefaults}>
                      {tr('statsEditor.resetProDefaults')}
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                  <Field label={tr('statsEditor.width')} density={density}>
                    <input type="number" style={controlInput} value={matchData.cropW ?? PRO_DEFAULTS.cropW} onChange={e => updateCrop('cropW', e.target.value)} />
                  </Field>
                  <Field label={tr('statsEditor.height')} density={density}>
                    <input type="number" style={controlInput} value={matchData.cropH ?? PRO_DEFAULTS.cropH} onChange={e => updateCrop('cropH', e.target.value)} />
                  </Field>
                  <Field label={tr('statsEditor.xOffset')} density={density}>
                    <input type="number" style={controlInput} value={matchData.cropX ?? PRO_DEFAULTS.cropX} onChange={e => updateCrop('cropX', e.target.value)} />
                  </Field>
                  <Field label={tr('statsEditor.upperY')} density={density}>
                    <input type="number" style={controlInput} value={matchData.cropY1 ?? PRO_DEFAULTS.cropY1} onChange={e => updateCrop('cropY1', e.target.value)} />
                  </Field>
                  <Field label={tr('statsEditor.lowerY')} density={density}>
                    <input type="number" style={controlInput} value={matchData.cropY2 ?? PRO_DEFAULTS.cropY2} onChange={e => updateCrop('cropY2', e.target.value)} />
                  </Field>
                  <Field label={tr('statsEditor.scalePct')} density={density}>
                    <input type="number" style={controlInput} value={matchData.cropScale ?? PRO_DEFAULTS.cropScale} onChange={e => updateCrop('cropScale', e.target.value)} />
                  </Field>
                </div>

                {isUltra && (
                  <button style={{ ...outlineBtn, minHeight: rowH, height: rowH, borderColor: COLORS.lineStrong, color: COLORS.white }} onClick={resetProDefaults}>
                    {tr('statsEditor.resetProDefaults')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </ShellPanel>

      <ShellPanel title={tr('statsEditor.templateDataInput')} accent density={density}>
        <div style={{ display: 'grid', gap }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap }}>
            <button 
              style={{ ...actionBtn, backgroundColor: COLORS.yellow, color: COLORS.black, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
              onClick={() => setShowOcrModal(true)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7V4h3M20 7V4h-3M4 17v3h3M20 17v3h-3M9 12h6M12 9v6"/></svg>
              {tr('statsEditor.launchOcr')}
            </button>
            <button
              style={{ ...outlineBtn, borderColor: COLORS.red, color: COLORS.red, padding: '0 16px' }}
              onClick={clearAllStats}
              title="Clear All Data"
            >
              {tr('statsEditor.resetData')}
            </button>
          </div>

          <div style={{ ...panelBase, padding: t.panelPadding, display: 'grid', gap }}>
            <div style={{ display: 'grid', gridTemplateColumns: gridTemplateConfig, gap, alignItems: 'center', paddingBottom: gap, borderBottom: `1px solid ${COLORS.line}` }}>
              <div style={{ color: COLORS.faintWhite, fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', textAlign: 'center', letterSpacing: '0.12em' }}>
                {tr('statsEditor.vis')}
              </div>
              {!isUltra && (
                <div style={{ color: COLORS.faintWhite, fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  {tr('statsEditor.stat')}
                </div>
              )}
              <div style={{ textAlign: 'center', color: COLORS.yellow, fontWeight: 900, fontSize: density === 'spacious' ? '15px' : '14px', textTransform: 'uppercase', minWidth: 0 }}>
                {matchData.teamA || tr('statsEditor.teamA')}
              </div>
              <div style={{ textAlign: 'center', color: COLORS.yellow, fontWeight: 900, fontSize: density === 'spacious' ? '15px' : '14px', textTransform: 'uppercase', minWidth: 0 }}>
                {matchData.teamB || tr('statsEditor.teamB')}
              </div>
            </div>

            <div style={{ display: 'grid', gap }}>
              {statRows.map(([visKey, label, aKey, bKey]) => {
                const isVisible = statsVisibility[visKey] ?? true;
                return (
                  <div key={visKey} style={{ ...panelBase, padding: t.panelPadding, borderLeft: `3px solid ${isVisible ? COLORS.yellow : 'rgba(255,255,255,0.06)'}`, opacity: isVisible ? 1 : 0.5, transition: 'opacity 0.2s, border-color 0.2s' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: gridTemplateConfig, gap, alignItems: 'center' }}>
                      <button
                        style={{ ...outlineBtn, width: '100%', padding: 0, fontSize: '10px', letterSpacing: '0.08em', backgroundColor: isVisible ? COLORS.yellow : 'rgba(255,255,255,0.02)', color: isVisible ? COLORS.black : COLORS.faintWhite, border: `1px solid ${isVisible ? COLORS.yellow : COLORS.line}`, boxShadow: 'none' }}
                        onClick={() => toggleVisibility(visKey)}
                      >
                        {isVisible ? tr('statsEditor.on') : tr('statsEditor.off')}
                      </button>

                      {!isUltra && (
                        <div style={{ color: COLORS.white, fontSize: density === 'spacious' ? '14px' : '13px', fontWeight: 900, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                          {label}
                        </div>
                      )}

                      <div style={{ display: 'grid', gap: '4px' }}>
                        {isUltra && (
                          <div style={{ color: COLORS.white, fontSize: '10px', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                            {label}
                          </div>
                        )}
                        <input type="number" style={numberInputStyle} value={statsTemplateData[aKey] || ''} onChange={e => setStatValue(aKey, e.target.value)} disabled={!isVisible} />
                      </div>

                      <input type="number" style={numberInputStyle} value={statsTemplateData[bKey] || ''} onChange={e => setStatValue(bKey, e.target.value)} disabled={!isVisible} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <SectionHint
            text={tr('statsEditor.hint')}
            density={density}
          />
        </div>
      </ShellPanel>
    </div>
  );
}