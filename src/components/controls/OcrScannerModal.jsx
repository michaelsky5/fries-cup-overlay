import React, { useState, useRef, useEffect } from 'react';
import Tesseract from 'tesseract.js';
// 🚀 引入 i18n
import { useTranslation } from 'react-i18next';
import { COLORS, UI } from '../../constants/styles';

const createEmptyStats = () => ({ elim: '', ast: '', dth: '', dmg: '', heal: '', block: '' });
const createEmptyTeamStats = () => Array(5).fill(null).map(createEmptyStats);
const onlyDigits = value => value.replace(/[^\d]/g, '');

export default function OcrScannerModal({ onClose, onApplyData, teamA, teamB, initialImage }) {
  // 🚀 初始化翻译钩子
  const { t } = useTranslation();

  const [originalImage, setOriginalImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ status: t('ocrScanner.status.ready'), pct: 0 });
  const [previewZones, setPreviewZones] = useState([]);
  const [isSwapped, setIsSwapped] = useState(false);
  
  const [extractedData, setExtractedData] = useState({ teamA: createEmptyTeamStats(), teamB: createEmptyTeamStats() });
  const [rowSnippets, setRowSnippets] = useState({ teamA: [], teamB: [] });
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);
  const workerRef = useRef(null);

  // 1. 自动读取外部传进来的图片
  useEffect(() => {
    if (initialImage) {
      setOriginalImage(initialImage);
      setProgress({ status: t('ocrScanner.status.cacheLoaded'), pct: 100 });
    }
  }, [initialImage, t]);

  const handleImageFile = (file) => {
    if (!file) return;
    setOriginalImage(prev => {
      // 避免误删外部传进来的 initialImage blob
      if (prev && prev.startsWith('blob:') && prev !== initialImage) {
        URL.revokeObjectURL(prev);
      }
      return URL.createObjectURL(file);
    });
    setPreviewZones([]);
    setRowSnippets({ teamA: [], teamB: [] });
    setIsSwapped(false);
    setProgress({ status: t('ocrScanner.status.imageLoaded'), pct: 0 });
    setExtractedData({ teamA: createEmptyTeamStats(), teamB: createEmptyTeamStats() });
  };

  useEffect(() => {
    const onKeyDown = e => { if (e.key === 'Escape') onClose?.(); };
    const onPaste = e => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          handleImageFile(items[i].getAsFile());
          break;
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('paste', onPaste);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('paste', onPaste);
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [onClose]);

  const handleImageUpload = e => { handleImageFile(e.target.files?.[0]); e.target.value = null; };
  const handleDragOver = e => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = e => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = e => { e.preventDefault(); setIsDragging(false); const file = e.dataTransfer.files?.[0]; if (file && file.type.startsWith('image/')) handleImageFile(file); };

  const processImageForMacroStats = imgObj => {
    const zones = [];
    const createZone = (xPct, yPct, wPct, hPct, options) => {
      const { scale = 4, lumaThreshold = 165 } = options;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const w = imgObj.width * (wPct / 100);
      const h = imgObj.height * (hPct / 100);
      canvas.width = w * scale; canvas.height = h * scale;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(imgObj, imgObj.width * (xPct / 100), imgObj.height * (yPct / 100), w, h, 0, 0, canvas.width, canvas.height);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        let color = 255;
        const luma = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        if (luma > lumaThreshold) color = 0;
        data[i] = data[i + 1] = data[i + 2] = color; data[i + 3] = 255;
      }
      ctx.putImageData(imgData, 0, 0);
      return { dataUrl: canvas.toDataURL() };
    };

    const extractRowSnippets = (xPct, yPct, wPct, hPct) => {
      const snips = [];
      const w = imgObj.width * (wPct / 100); const h = imgObj.height * (hPct / 100);
      const rowH = h / 5; const startX = imgObj.width * (xPct / 100); const startY = imgObj.height * (yPct / 100);
      for (let i = 0; i < 5; i++) {
        const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = rowH;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imgObj, startX, startY + i * rowH, w, rowH, 0, 0, w, rowH);
        snips.push(canvas.toDataURL());
      }
      return snips;
    };

    zones.push(createZone(49, 18.5, 26.2, 28.5, {}));
    zones.push(createZone(49, 55.5, 26.2, 28.5, {}));
    setRowSnippets({ teamA: extractRowSnippets(49, 18.5, 26.2, 28.5), teamB: extractRowSnippets(49, 55.5, 26.2, 28.5) });
    return zones;
  };

  const allocateMacroData = (topText, bottomText) => {
    const parseStatsBlock = textStr => {
      const parsed = [];
      const rawLines = (textStr || '').split('\n');
      const validLines = rawLines.map(line => {
        const cleanLine = line.replace(/[oOqQdDcC]/g, '0').replace(/[zZsS]/g, '2').replace(/[hHnN]/g, '11').replace(/[lIi|]/g, '1').replace(/,/g, '');
        return cleanLine.match(/\d+/g) || [];
      }).filter(nums => nums.length >= 3);

      for (let i = 0; i < 5; i++) {
        if (i < validLines.length) {
          let nums = validLines[i];
          if (nums.length > 6) nums = nums.slice(-6);
          const parsedRow = ['', '', '', '', '', ''];
          let currentSlot = 0;
          for (const numStr of nums) {
            if (currentSlot >= 6) break;
            if (numStr.length >= 3 && currentSlot < 3) currentSlot = 3;
            parsedRow[currentSlot] = numStr; currentSlot++;
          }
          parsed.push(parsedRow);
        } else {
          parsed.push(['', '', '', '', '', '']);
        }
      }
      return parsed;
    };
    setExtractedData({
      teamA: parseStatsBlock(topText).map(s => ({ elim: s[0], ast: s[1], dth: s[2], dmg: s[3], heal: s[4], block: s[5] })),
      teamB: parseStatsBlock(bottomText).map(s => ({ elim: s[0], ast: s[1], dth: s[2], dmg: s[3], heal: s[4], block: s[5] }))
    });
  };

  const runMacroStatsOCR = async () => {
    if (!originalImage) return;
    setIsProcessing(true); setProgress({ status: t('ocrScanner.status.preProcessing'), pct: 10 });
    const img = new Image();
    img.onload = async () => {
      const macroZones = processImageForMacroStats(img);
      setPreviewZones(macroZones);
      try {
        setProgress({ status: t('ocrScanner.status.initTesseract'), pct: 30 });
        const worker = await Tesseract.createWorker('eng', 1, {
          logger: m => setProgress({ status: (m.status || 'PROCESSING').toUpperCase(), pct: Math.max(30, m.progress ? Math.round(m.progress * 100) : 0) })
        });
        workerRef.current = worker;
        await worker.setParameters({ tessedit_char_whitelist: '0123456789,.: oOlIi|zZsSqQdDhHnNcC ', tessedit_pageseg_mode: '6' });
        const [topResult, bottomResult] = await Promise.all([worker.recognize(macroZones[0].dataUrl), worker.recognize(macroZones[1].dataUrl)]);
        allocateMacroData(topResult.data.text, bottomResult.data.text);
        setProgress({ status: t('ocrScanner.status.extractionComplete'), pct: 100 });
        await worker.terminate(); workerRef.current = null;
      } catch (e) {
        setProgress({ status: t('ocrScanner.status.failed'), pct: 0 });
      } finally { setIsProcessing(false); }
    };
    img.src = originalImage;
  };

  const handleStatChange = (teamKey, index, field, value) => {
    setExtractedData(prev => ({ ...prev, [teamKey]: prev[teamKey].map((row, i) => i === index ? { ...row, [field]: onlyDigits(value) } : row) }));
  };

  const handleSwapTeams = () => {
    setIsSwapped(prev => !prev);
    setExtractedData(prev => ({ teamA: prev.teamB.map(r => ({ ...r })), teamB: prev.teamA.map(r => ({ ...r })) }));
    setRowSnippets(prev => ({ teamA: [...prev.teamB], teamB: [...prev.teamA] }));
  };

  // -------------------- UI 渲染部分 --------------------
  const gridTemplate = '24px 0.8fr 0.8fr 0.8fr 1.4fr 1.4fr 1.1fr';
  
  const getInputClass = (field) => {
    let bg = COLORS.panel;
    let color = COLORS.white;
    if (field === 'dmg') { bg = 'rgba(248,113,113,0.1)'; color = '#fca5a5'; }
    if (field === 'heal') { bg = 'rgba(74,222,128,0.1)'; color = '#86efac'; }
    if (field === 'block') { bg = 'rgba(96,165,250,0.1)'; color = '#93c5fd'; }
    return { background: bg, color };
  };

  const renderStatsTable = (teamKey, title, teamName) => (
    <div style={{ flex: 1, minWidth: 0, background: '#111', border: UI.innerFrame, padding: '12px' }}>
      <div style={{ marginBottom: '12px', color: COLORS.white, fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase' }}>
        <span style={{ color: COLORS.yellow }}>[{title}]</span> {teamName || tr('ocrScanner.unregistered')}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: gridTemplate, gap: '6px', marginBottom: '6px', fontSize: '10px', color: COLORS.faintWhite, textAlign: 'center', fontWeight: 900 }}>
        <div>{tr('ocrScanner.colNum')}</div>
        <div>{tr('ocrScanner.colElim')}</div>
        <div>{tr('ocrScanner.colAst')}</div>
        <div>{tr('ocrScanner.colDth')}</div>
        <div style={{color: '#f87171'}}>{tr('ocrScanner.colDmg')}</div>
        <div style={{color: '#4ade80'}}>{tr('ocrScanner.colHeal')}</div>
        <div style={{color: '#60a5fa'}}>{tr('ocrScanner.colMit')}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {extractedData[teamKey].map((row, i) => (
          <div key={`${teamKey}-${i}`} style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'grid', gridTemplateColumns: gridTemplate, gap: '6px', alignItems: 'center' }}>
              <div style={{ fontSize: '11px', color: COLORS.softWhite, fontWeight: 900, textAlign: 'center' }}>P{i + 1}</div>
              {['elim', 'ast', 'dth', 'dmg', 'heal', 'block'].map(field => {
                const styleConfig = getInputClass(field);
                return (
                  <input
                    key={field}
                    value={row[field]}
                    onChange={e => handleStatChange(teamKey, i, field, e.target.value)}
                    onFocus={e => e.target.select()}
                    style={{
                      width: '100%', boxSizing: 'border-box', padding: '6px 0', textAlign: 'center', 
                      border: `1px solid ${COLORS.lineStrong}`, outline: 'none',
                      fontFamily: 'monospace', fontSize: '13px', fontWeight: 900,
                      background: styleConfig.background, color: styleConfig.color,
                      transition: 'border-color 0.2s'
                    }}
                    onMouseOver={e => e.target.style.borderColor = COLORS.yellow}
                    onMouseOut={e => e.target.style.borderColor = COLORS.lineStrong}
                  />
                )
              })}
            </div>
            
            {/* 切片对比：精准的像素级核对区 */}
            {rowSnippets[teamKey]?.[i] && (
              <div style={{ display: 'flex', paddingLeft: '30px' }}>
                <div style={{
                  flex: 1, height: '34px',
                  backgroundImage: `url(${rowSnippets[teamKey][i]})`,
                  backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat',
                  border: `1px solid ${COLORS.lineStrong}`, borderTop: 'none',
                  filter: 'brightness(1.2) contrast(1.15)'
                }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backdropFilter: 'blur(8px)' }}>
      <div style={{ width: '100%', maxWidth: '1120px', maxHeight: 'calc(100vh - 48px)', background: COLORS.panel, border: `1px solid ${COLORS.lineStrong}`, boxShadow: UI.panelShadow, display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${COLORS.lineStrong}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '2px', color: COLORS.softWhite, textTransform: 'uppercase' }}>{tr('ocrScanner.titleSub')}</div>
            <div style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '1px', color: COLORS.white, textTransform: 'uppercase', margin: 0 }}>{tr('ocrScanner.titleMain')}</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: COLORS.faintWhite, fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>{tr('ocrScanner.close')}</button>
        </div>
        
        {/* Workspace */}
        <div style={{ display: 'flex', gap: '24px', padding: '24px', minHeight: 0, height: '600px' }}>
          
          {/* 左侧：上传与处理 */}
          <div style={{ flex: '0 0 320px', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: 0 }}>
            <div 
              onClick={() => fileInputRef.current?.click()} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
              style={{ flex: 1, minHeight: 0, border: `1px dashed ${isDragging ? COLORS.yellow : COLORS.lineStrong}`, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
            >
              {originalImage ? (
                <img src={originalImage} style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.52 }} alt="source" />
              ) : (
                <span style={{ color: COLORS.softWhite, fontSize: '12px', fontWeight: 800, textAlign: 'center', padding: '0 20px', whiteSpace: 'pre-wrap' }}>
                  {tr('ocrScanner.uploadHint')}
                </span>
              )}
              {isProcessing && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'rgba(255,255,255,0.08)' }}>
                  <div style={{ height: '100%', background: COLORS.yellow, width: `${progress.pct}%`, transition: 'width 0.2s', boxShadow: '0 0 12px rgba(244,195,32,0.5)' }} />
                </div>
              )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />
            
            <button 
              onClick={runMacroStatsOCR} 
              disabled={!originalImage || isProcessing} 
              style={{ height: '44px', background: (!originalImage || isProcessing) ? 'rgba(255,255,255,0.05)' : COLORS.yellow, color: (!originalImage || isProcessing) ? COLORS.faintWhite : COLORS.black, border: `1px solid ${(!originalImage || isProcessing) ? COLORS.lineStrong : COLORS.yellow}`, fontWeight: 900, fontSize: '13px', letterSpacing: '1px', cursor: (!originalImage || isProcessing) ? 'not-allowed' : 'pointer' }}
            >
              {isProcessing ? tr('ocrScanner.scanning') : tr('ocrScanner.extractBtn')}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: COLORS.softWhite, fontFamily: 'monospace', fontWeight: 800 }}>
              <span>{progress.status}</span>
              <span>{progress.pct}%</span>
            </div>
            {previewZones.length > 0 && (
              <div style={{ fontSize: '10px', color: COLORS.faintWhite, letterSpacing: '2px', textTransform: 'uppercase' }}>{tr('ocrScanner.zonesDetected')}</div>
            )}
          </div>

          {/* 右侧：数据核对区 */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '12px', minHeight: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={handleSwapTeams} disabled={!originalImage} 
                style={{ height: '34px', padding: '0 16px', background: 'transparent', border: `1px solid ${COLORS.lineStrong}`, color: COLORS.white, fontSize: '11px', fontWeight: 900, cursor: !originalImage ? 'not-allowed' : 'pointer', opacity: !originalImage ? 0.3 : 1 }}
              >
                {tr('ocrScanner.swapBtn')}
              </button>
            </div>
            
            <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: '12px', overflowY: 'auto' }}>
              {renderStatsTable('teamA', isSwapped ? 'BOTTOM' : 'TOP', teamA)}
              {renderStatsTable('teamB', isSwapped ? 'TOP' : 'BOTTOM', teamB)}
            </div>

            <button 
              onClick={() => { onApplyData(extractedData); onClose(); }} disabled={!originalImage} 
              style={{ height: '44px', background: '#111', color: COLORS.white, border: `1px solid ${COLORS.lineStrong}`, fontWeight: 900, fontSize: '13px', letterSpacing: '1px', cursor: !originalImage ? 'not-allowed' : 'pointer', opacity: !originalImage ? 0.3 : 1, transition: 'border-color 0.2s' }}
              onMouseOver={e => { if(originalImage) e.target.style.borderColor = COLORS.blue; }}
              onMouseOut={e => { if(originalImage) e.target.style.borderColor = COLORS.lineStrong; }}
            >
              {tr('ocrScanner.applyBtn')}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}