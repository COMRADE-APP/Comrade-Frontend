import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Type, Image, Square, Circle, Minus, Pen, Trash2, Plus, X, Save, Eye, Code, Upload, Download, Bold, Italic, AlignLeft, AlignCenter, AlignRight, GripVertical } from 'lucide-react';
import Button from '../../components/common/Button';
import { useToast } from '../../contexts/ToastContext';
import api from '../../services/api';
import specializationsService from '../../services/specializations.service';

const PLACEHOLDERS = [
  { key: '{{learner_name}}', desc: 'Learner full name' },
  { key: '{{course_name}}', desc: 'Course/specialization name' },
  { key: '{{issuer_name}}', desc: 'Organization/issuer name' },
  { key: '{{completion_date}}', desc: 'Date of completion' },
  { key: '{{grade}}', desc: 'Grade (A, B+, Pass)' },
  { key: '{{average_score}}', desc: 'Average quiz score' },
  { key: '{{hours_completed}}', desc: 'Total hours completed' },
  { key: '{{verification_code}}', desc: 'Unique verification code' },
];

const DEMO_VALUES = {
  '{{learner_name}}': 'John Doe',
  '{{course_name}}': 'Advanced Web Development',
  '{{issuer_name}}': 'COMRADE Academy',
  '{{completion_date}}': 'June 30, 2026',
  '{{grade}}': 'A',
  '{{average_score}}': '92%',
  '{{hours_completed}}': '48 hours',
  '{{verification_code}}': 'CRT-2026-A1B2C3',
};

const BLOCK_META = {
  text: { icon: Type, label: 'Text', color: 'text-blue-600', bg: 'bg-blue-50' },
  image: { icon: Image, label: 'Image', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  logo: { icon: Image, label: 'Logo', color: 'text-amber-600', bg: 'bg-amber-50' },
  rect: { icon: Square, label: 'Rectangle', color: 'text-purple-600', bg: 'bg-purple-50' },
  circle: { icon: Circle, label: 'Circle', color: 'text-rose-600', bg: 'bg-rose-50' },
  line: { icon: Minus, label: 'Line', color: 'text-slate-600', bg: 'bg-slate-50' },
  signature: { icon: Pen, label: 'Signature', color: 'text-indigo-600', bg: 'bg-indigo-50' },
};

const BLOCK_TYPES = Object.keys(BLOCK_META);

const DEFAULT_BLOCKS = [
  { id: 'b1', type: 'rect', content: null, styles: { x: 5, y: 5, w: 287, h: 200, borderWidth: 3, borderColor: '#c9a94e', fill: 'none' } },
  { id: 'b2', type: 'rect', content: null, styles: { x: 8, y: 8, w: 281, h: 194, borderWidth: 1, borderColor: '#c9a94e', fill: 'none' } },
  { id: 'b3', type: 'text', content: 'Certificate of Completion', styles: { x: 48, y: 25, w: 200, h: 18, fontSize: 28, fontFamily: 'Times New Roman', color: '#1a1a2e', bold: true, italic: false, textAlign: 'center' } },
  { id: 'b4', type: 'text', content: 'This is proudly presented to', styles: { x: 48, y: 50, w: 200, h: 12, fontSize: 14, fontFamily: 'Times New Roman', color: '#666', bold: false, italic: false, textAlign: 'center' } },
  { id: 'b5', type: 'text', content: '{{learner_name}}', styles: { x: 48, y: 65, w: 200, h: 16, fontSize: 26, fontFamily: 'Times New Roman', color: '#c9a94e', bold: true, italic: false, textAlign: 'center' } },
  { id: 'b6', type: 'text', content: 'for successfully completing', styles: { x: 48, y: 85, w: 200, h: 12, fontSize: 14, fontFamily: 'Times New Roman', color: '#666', bold: false, italic: false, textAlign: 'center' } },
  { id: 'b7', type: 'text', content: '{{course_name}}', styles: { x: 48, y: 100, w: 200, h: 14, fontSize: 20, fontFamily: 'Times New Roman', color: '#1a1a2e', bold: true, italic: false, textAlign: 'center' } },
  { id: 'b8', type: 'text', content: 'Issued by: {{issuer_name}}  |  {{completion_date}}', styles: { x: 48, y: 130, w: 200, h: 10, fontSize: 11, fontFamily: 'Times New Roman', color: '#666', bold: false, italic: false, textAlign: 'center' } },
  { id: 'b9', type: 'text', content: 'Grade: {{grade}}  |  Score: {{average_score}}%', styles: { x: 48, y: 143, w: 200, h: 10, fontSize: 11, fontFamily: 'Times New Roman', color: '#666', bold: false, italic: false, textAlign: 'center' } },
  { id: 'b10', type: 'text', content: 'Verification: {{verification_code}}', styles: { x: 48, y: 175, w: 200, h: 10, fontSize: 9, fontFamily: 'Times New Roman', color: '#999', bold: false, italic: false, textAlign: 'center' } },
];

const FONTS = ['Times New Roman', 'Georgia', 'serif', 'Arial', 'Helvetica', 'sans-serif', 'Courier New', 'monospace'];

const generateId = () => 'b' + Date.now() + Math.random().toString(36).slice(2, 6);

const fillDemoValues = (text) => text.replace(/\{\{(\w+)\}\}/g, (m) => DEMO_VALUES[m] || m);

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const blocksToHtml = (blocks) => {
  const inner = blocks.map((b) => {
    const s = b.styles;
    switch (b.type) {
      case 'text':
        return `<div style="position:absolute;left:${s.x}mm;top:${s.y}mm;width:${s.w}mm;font-size:${s.fontSize}pt;font-family:${s.fontFamily};color:${s.color};font-weight:${s.bold ? 'bold' : 'normal'};font-style:${s.italic ? 'italic' : 'normal'};text-align:${s.textAlign}">${b.content || ''}</div>`;
      case 'image':
      case 'logo':
        return b.content ? `<img src="${b.content}" style="position:absolute;left:${s.x}mm;top:${s.y}mm;width:${s.w}mm;height:${s.h}mm;object-fit:contain" />` : '';
      case 'rect':
        return `<div style="position:absolute;left:${s.x}mm;top:${s.y}mm;width:${s.w}mm;height:${s.h}mm;border:${s.borderWidth || 1}px solid ${s.borderColor || '#000'};background:${s.fill || 'none'}"></div>`;
      case 'circle':
        return `<div style="position:absolute;left:${s.x}mm;top:${s.y}mm;width:${(s.r || 15) * 2}mm;height:${(s.r || 15) * 2}mm;border-radius:50%;border:${s.borderWidth || 1}px solid ${s.borderColor || '#000'};background:${s.fill || 'none'}"></div>`;
      case 'line':
        return `<div style="position:absolute;left:${s.x}mm;top:${s.y}mm;width:${s.w}mm;height:${s.strokeWidth || 1}px;background:${s.strokeColor || '#000'}"></div>`;
      case 'signature':
        return b.content ? `<img src="${b.content}" style="position:absolute;left:${s.x}mm;top:${s.y}mm;width:${s.w}mm;height:${s.h}mm;object-fit:contain" />` : '';
      default:
        return '';
    }
  }).join('\n');
  return `<!DOCTYPE html>
<html>
<head>
<style>
  @page { size: A4 landscape; margin: 0; }
  body { margin:0; padding:0; width:297mm; height:210mm; background:#faf6f0; display:flex; align-items:center; justify-content:center; }
  .certificate { position:relative; width:287mm; height:200mm; background:white; overflow:hidden; }
</style>
</head>
<body>
<div class="certificate">
${inner}
</div>
</body>
</html>`;
};

const htmlToBlocks = (html) => {
  const match = html.match(/<!-- certificate-blocks:([\s\S]*?)-->/);
  if (match) {
    try { return JSON.parse(match[1]); } catch (e) {}
  }
  return null;
};

const wrapTemplate = (html) => {
  if (!html || html.trim().startsWith('<!DOCTYPE')) return html || '';
  return `<!DOCTYPE html>
<html>
<head>
<style>
  @page { size: A4 landscape; margin: 0; }
  body { margin:0; padding:0; width:297mm; height:210mm; background:#faf6f0; display:flex; align-items:center; justify-content:center; }
  .certificate { position:relative; width:287mm; height:200mm; background:white; overflow:hidden; }
</style>
</head>
<body>
<div class="certificate">
${html}
</div>
</body>
</html>`;
};

const SignaturePad = ({ onSave, onClose }) => {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [color, setColor] = useState('#1a1a2e');
  const [lineWidth, setLineWidth] = useState(2);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
  }, []);

  const getPos = (e) => {
    const c = canvasRef.current;
    const rect = c.getBoundingClientRect();
    const x = (e.clientX || (e.touches?.[0]?.clientX || 0)) - rect.left;
    const y = (e.clientY || (e.touches?.[0]?.clientY || 0)) - rect.top;
    return { x, y };
  };

  const startDraw = (e) => {
    drawing.current = true;
    const { x, y } = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!drawing.current) return;
    const { x, y } = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDraw = () => { drawing.current = false; };
  const clear = () => {
    const c = canvasRef.current;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
  };

  const save = () => {
    onSave(canvasRef.current.toDataURL('image/png'));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="bg-elevated border border-theme rounded-2xl shadow-2xl p-5 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-primary mb-3">Draw Signature</h3>
        <canvas ref={canvasRef} width={500} height={150}
          className="w-full border border-theme rounded-lg bg-white touch-none cursor-crosshair"
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} />
        <div className="flex items-center gap-3 mt-3">
          <label className="flex items-center gap-1.5 text-xs text-secondary"><span>Color</span><input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-7 h-7 rounded border border-theme cursor-pointer p-0.5" /></label>
          <label className="flex items-center gap-1.5 text-xs text-secondary"><span>Width</span><input type="range" min={1} max={6} step={0.5} value={lineWidth} onChange={e => setLineWidth(parseFloat(e.target.value))} className="w-20" /></label>
          <button onClick={clear} className="text-xs px-2 py-1 rounded-lg border border-theme text-secondary hover:text-primary">Clear</button>
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={save}>Use Signature</Button>
        </div>
      </div>
    </div>
  );
};

const getDefaultForType = (type) => {
  const s = { x: 50, y: 50, w: 80, h: 20 };
  switch (type) {
    case 'text': return { id: generateId(), type, content: 'Double-click to edit', styles: { ...s, w: 180, fontSize: 18, fontFamily: 'Times New Roman', color: '#1a1a2e', bold: false, italic: false, textAlign: 'center' } };
    case 'image': case 'logo': return { id: generateId(), type, content: null, styles: { ...s, w: 40, h: 40 } };
    case 'rect': return { id: generateId(), type, content: null, styles: { ...s, w: 100, h: 60, borderWidth: 2, borderColor: '#c9a94e', fill: 'none' } };
    case 'circle': return { id: generateId(), type, content: null, styles: { x: 130, y: 90, r: 20, borderWidth: 2, borderColor: '#c9a94e', fill: 'none' } };
    case 'line': return { id: generateId(), type, content: null, styles: { x: 50, y: 100, w: 100, strokeWidth: 2, strokeColor: '#c9a94e' } };
    case 'signature': return { id: generateId(), type, content: null, styles: { x: 100, y: 140, w: 60, h: 25 } };
    default: return { id: generateId(), type: 'text', content: 'New block', styles: { ...s, w: 180, fontSize: 14, fontFamily: 'Times New Roman', color: '#1a1a2e', bold: false, italic: false, textAlign: 'left' } };
  }
};

const PropertyPanel = ({ block, onChange, onChangeContent, onDelete, onInsertPlaceholder, onRequestSignature }) => {
  if (!block) return <div className="p-4 text-xs text-tertiary text-center mt-8">Click a block on the canvas to edit its properties</div>;
  const s = block.styles;
  const meta = BLOCK_META[block.type] || BLOCK_META.text;

  const set = (field, value) => onChange(block.id, { [field]: value });

  const num = (field) => (
    <input type="number" value={s[field] || 0} onChange={e => set(field, parseFloat(e.target.value) || 0)}
      className="w-full rounded-lg border border-theme bg-background px-2 py-1 text-xs" min={0} step={0.5} />
  );

  return (
    <div className="p-3 space-y-3 overflow-y-auto max-h-full">
      <div className="flex items-center gap-2 pb-2 border-b border-theme">
        <div className={`w-6 h-6 rounded flex items-center justify-center ${meta.bg}`}><meta.icon size={12} className={meta.color} /></div>
        <span className="text-xs font-bold text-primary flex-1 truncate">{meta.label}</span>
        <button onClick={() => onDelete(block.id)} className="p-1 rounded hover:bg-red-50 text-secondary hover:text-red-500"><Trash2 size={12} /></button>
      </div>

      {block.type === 'text' && (
        <>
          <div><label className="block text-[10px] font-medium text-secondary mb-1">Content</label>
            <div className="flex flex-wrap gap-1 mb-1">
              {PLACEHOLDERS.map(p => (
                <button key={p.key} onClick={() => onInsertPlaceholder(block.id, p.key)}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100" title={p.desc}>{p.key}</button>
              ))}
            </div>
            <textarea value={block.content || ''} onChange={e => onChangeContent(block.id, e.target.value)}
              className="w-full rounded-lg border border-theme bg-background px-2 py-1.5 text-xs font-mono resize-none" rows={3} spellCheck={false} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="block text-[10px] font-medium text-secondary mb-0.5">X (mm)</label>{num('x')}</div>
            <div><label className="block text-[10px] font-medium text-secondary mb-0.5">Y (mm)</label>{num('y')}</div>
            <div><label className="block text-[10px] font-medium text-secondary mb-0.5">Width (mm)</label>{num('w')}</div>
            <div><label className="block text-[10px] font-medium text-secondary mb-0.5">Height (mm)</label>{num('h')}</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="block text-[10px] font-medium text-secondary mb-0.5">Font Size</label>{num('fontSize')}</div>
            <div><label className="block text-[10px] font-medium text-secondary mb-0.5">Color</label><input type="color" value={s.color || '#000'} onChange={e => set('color', e.target.value)} className="w-full h-7 rounded border border-theme cursor-pointer p-0.5" /></div>
          </div>
          <div><label className="block text-[10px] font-medium text-secondary mb-0.5">Font</label>
            <select value={s.fontFamily || 'Times New Roman'} onChange={e => set('fontFamily', e.target.value)} className="w-full rounded-lg border border-theme bg-background px-2 py-1 text-xs">
              {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => set('bold', !s.bold)} className={`p-1.5 rounded ${s.bold ? 'bg-primary-100 text-primary-700' : 'text-secondary hover:text-primary'} border border-theme`}><Bold size={14} /></button>
            <button onClick={() => set('italic', !s.italic)} className={`p-1.5 rounded ${s.italic ? 'bg-primary-100 text-primary-700' : 'text-secondary hover:text-primary'} border border-theme`}><Italic size={14} /></button>
            <span className="w-px h-5 bg-theme" />
            {['left', 'center', 'right'].map(a => (
              <button key={a} onClick={() => set('textAlign', a)} className={`p-1.5 rounded ${s.textAlign === a ? 'bg-primary-100 text-primary-700' : 'text-secondary hover:text-primary'} border border-theme`}>
                {a === 'left' ? <AlignLeft size={14} /> : a === 'center' ? <AlignCenter size={14} /> : <AlignRight size={14} />}
              </button>
            ))}
          </div>
        </>
      )}

      {(block.type === 'image' || block.type === 'logo') && (
        <>
          <div><label className="block text-[10px] font-medium text-secondary mb-1">Image URL</label>
            <input type="text" value={block.content || ''} onChange={e => onChangeContent(block.id, e.target.value)}
              className="w-full rounded-lg border border-theme bg-background px-2 py-1.5 text-xs" placeholder="Paste URL or upload..." />
          </div>
          {block.content && <div className="border border-theme rounded-lg p-2 bg-white"><img src={block.content} alt="" className="max-h-20 mx-auto object-contain" /></div>}
          <div className="grid grid-cols-2 gap-2">
            <div><label className="block text-[10px] font-medium text-secondary mb-0.5">X (mm)</label>{num('x')}</div>
            <div><label className="block text-[10px] font-medium text-secondary mb-0.5">Y (mm)</label>{num('y')}</div>
            <div><label className="block text-[10px] font-medium text-secondary mb-0.5">Width (mm)</label>{num('w')}</div>
            <div><label className="block text-[10px] font-medium text-secondary mb-0.5">Height (mm)</label>{num('h')}</div>
          </div>
        </>
      )}

      {block.type === 'rect' && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="block text-[10px] font-medium text-secondary mb-0.5">X (mm)</label>{num('x')}</div>
            <div><label className="block text-[10px] font-medium text-secondary mb-0.5">Y (mm)</label>{num('y')}</div>
            <div><label className="block text-[10px] font-medium text-secondary mb-0.5">Width (mm)</label>{num('w')}</div>
            <div><label className="block text-[10px] font-medium text-secondary mb-0.5">Height (mm)</label>{num('h')}</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="block text-[10px] font-medium text-secondary mb-0.5">Border</label>{num('borderWidth')}</div>
            <div><label className="block text-[10px] font-medium text-secondary mb-0.5">Color</label><input type="color" value={s.borderColor || '#000'} onChange={e => set('borderColor', e.target.value)} className="w-full h-7 rounded border border-theme cursor-pointer p-0.5" /></div>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-[10px] text-secondary"><input type="checkbox" checked={s.fill !== 'none'} onChange={e => set('fill', e.target.checked ? '#ffffff' : 'none')} className="accent-primary-600" /> Fill</label>
            {s.fill !== 'none' && <input type="color" value={s.fill || '#ffffff'} onChange={e => set('fill', e.target.value)} className="w-7 h-7 rounded border border-theme cursor-pointer p-0.5" />}
          </div>
        </>
      )}

      {block.type === 'circle' && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="block text-[10px] font-medium text-secondary mb-0.5">X (mm)</label>{num('x')}</div>
            <div><label className="block text-[10px] font-medium text-secondary mb-0.5">Y (mm)</label>{num('y')}</div>
          </div>
          <div><label className="block text-[10px] font-medium text-secondary mb-0.5">Radius (mm)</label>{num('r')}</div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="block text-[10px] font-medium text-secondary mb-0.5">Border</label>{num('borderWidth')}</div>
            <div><label className="block text-[10px] font-medium text-secondary mb-0.5">Color</label><input type="color" value={s.borderColor || '#000'} onChange={e => set('borderColor', e.target.value)} className="w-full h-7 rounded border border-theme cursor-pointer p-0.5" /></div>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-[10px] text-secondary"><input type="checkbox" checked={s.fill !== 'none'} onChange={e => set('fill', e.target.checked ? '#ffffff' : 'none')} className="accent-primary-600" /> Fill</label>
            {s.fill !== 'none' && <input type="color" value={s.fill || '#ffffff'} onChange={e => set('fill', e.target.value)} className="w-7 h-7 rounded border border-theme cursor-pointer p-0.5" />}
          </div>
        </>
      )}

      {block.type === 'line' && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="block text-[10px] font-medium text-secondary mb-0.5">X (mm)</label>{num('x')}</div>
            <div><label className="block text-[10px] font-medium text-secondary mb-0.5">Y (mm)</label>{num('y')}</div>
            <div><label className="block text-[10px] font-medium text-secondary mb-0.5">Length (mm)</label>{num('w')}</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="block text-[10px] font-medium text-secondary mb-0.5">Thickness</label>{num('strokeWidth')}</div>
            <div><label className="block text-[10px] font-medium text-secondary mb-0.5">Color</label><input type="color" value={s.strokeColor || '#000'} onChange={e => set('strokeColor', e.target.value)} className="w-full h-7 rounded border border-theme cursor-pointer p-0.5" /></div>
          </div>
        </>
      )}

      {block.type === 'signature' && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="block text-[10px] font-medium text-secondary mb-0.5">X (mm)</label>{num('x')}</div>
            <div><label className="block text-[10px] font-medium text-secondary mb-0.5">Y (mm)</label>{num('y')}</div>
            <div><label className="block text-[10px] font-medium text-secondary mb-0.5">Width (mm)</label>{num('w')}</div>
            <div><label className="block text-[10px] font-medium text-secondary mb-0.5">Height (mm)</label>{num('h')}</div>
          </div>
          {block.content ? (
            <div className="border border-theme rounded-lg p-2 bg-white">
              <img src={block.content} alt="signature" className="max-h-12 mx-auto object-contain" />
              <button onClick={() => onChangeContent(block.id, null)} className="text-[10px] text-red-500 mt-1">Remove & redraw</button>
            </div>
          ) : (
            <div><p className="text-[10px] text-tertiary italic mb-1">No signature drawn yet</p>
              <button onClick={onRequestSignature} className="text-[10px] px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100">Draw Signature</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const CertificateDesigner = ({ specId, cert, onClose, onSaved }) => {
  const toast = useToast();
  const [blocks, setBlocks] = useState([]);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [viewMode, setViewMode] = useState('canvas');
  const [codeHtml, setCodeHtml] = useState('');
  const [issuerName, setIssuerName] = useState('');
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [minScore, setMinScore] = useState(70);
  const [certificateType, setCertificateType] = useState('completion');
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [canvasScale, setCanvasScale] = useState(1.8);
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  const canvasRef = useRef(null);
  const dragRef = useRef(null);
  const resizeRef = useRef(null);

  const selectedBlock = blocks.find(b => b.id === selectedBlockId) || null;

  const recalcScale = useCallback(() => {
    if (canvasRef.current) {
      const w = canvasRef.current.clientWidth - 32;
      setCanvasScale(clamp(w / 297, 0.5, 3));
    }
  }, []);

  useEffect(() => {
    recalcScale();
    window.addEventListener('resize', recalcScale);
    return () => window.removeEventListener('resize', recalcScale);
  }, [recalcScale]);

  useEffect(() => {
    if (cert) {
      setIssuerName(cert.issuer_name || '');
      setAutoGenerate(cert.auto_generate !== false);
      setMinScore(cert.min_score || 70);
      setCertificateType(cert.certificate_type || 'completion');
      const tpl = cert.template_html || '';
      const parsed = htmlToBlocks(tpl);
      if (parsed && parsed.length > 0) {
        setBlocks(parsed);
        setViewMode('canvas');
        setCodeHtml(blocksToHtml(parsed));
      } else {
        setBlocks(DEFAULT_BLOCKS.map(b => ({ ...b, id: generateId() })));
        setViewMode('code');
        setCodeHtml(tpl || wrapTemplate(''));
      }
    } else {
      setBlocks(DEFAULT_BLOCKS.map(b => ({ ...b, id: generateId() })));
      setCodeHtml(blocksToHtml(DEFAULT_BLOCKS.map(b => ({ ...b, id: generateId() }))));
    }
  }, [cert]);

  const handleSwitchToCode = () => {
    setCodeHtml(blocksToHtml(blocks));
    setViewMode('code');
  };

  const handleSwitchToCanvas = () => {
    const parsed = htmlToBlocks(codeHtml);
    if (parsed && parsed.length > 0) {
      setBlocks(parsed);
      setViewMode('canvas');
    } else {
      toast.error('Cannot switch to canvas: no block data found in HTML. Edit in code view or add <!-- certificate-blocks: [...] --> comment.');
    }
  };

  const updateBlock = (id, styleUpdates) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, styles: { ...b.styles, ...styleUpdates } } : b));
  };

  const updateBlockContent = (id, content) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, content } : b));
  };

  const addBlock = (type) => {
    const nb = getDefaultForType(type);
    setBlocks(prev => [...prev, nb]);
    setSelectedBlockId(nb.id);
  };

  const deleteBlock = (id) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const insertPlaceholder = (blockId, key) => {
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, content: (b.content || '') + key } : b));
  };

  const handleSignatureSaved = (dataUrl) => {
    if (selectedBlockId) {
      updateBlockContent(selectedBlockId, dataUrl);
    }
    setShowSignaturePad(false);
  };

  const handleCanvasMouseDown = (blockId, e) => {
    if (e.button !== 0) return;
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    setSelectedBlockId(blockId);
    const rect = canvasRef.current.getBoundingClientRect();
    const pxPerMm = canvasScale;
    const offsetX = (e.clientX - rect.left) / pxPerMm - block.styles.x;
    const offsetY = (e.clientY - rect.top) / pxPerMm - block.styles.y;
    dragRef.current = { blockId, offsetX, offsetY };
    e.preventDefault();
  };

  const handleResizeMouseDown = (blockId, e) => {
    if (e.button !== 0) return;
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    setSelectedBlockId(blockId);
    const rect = canvasRef.current.getBoundingClientRect();
    const pxPerMm = canvasScale;
    resizeRef.current = { blockId, startW: block.styles.w || 40, startH: block.styles.h || 20, startMX: e.clientX, startMY: e.clientY, pxPerMm };
    e.preventDefault();
    e.stopPropagation();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (dragRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const pxPerMm = canvasScale;
        const rawX = (e.clientX - rect.left) / pxPerMm - dragRef.current.offsetX;
        const rawY = (e.clientY - rect.top) / pxPerMm - dragRef.current.offsetY;
        const block = blocks.find(b => b.id === dragRef.current.blockId);
        const bw = block?.styles?.w || 40;
        const bh = block?.styles?.h || 20;
        updateBlock(dragRef.current.blockId, { x: clamp(rawX, 0, 287 - bw), y: clamp(rawY, 0, 200 - bh) });
      }
      if (resizeRef.current) {
        const dx = (e.clientX - resizeRef.current.startMX) / canvasScale;
        const dy = (e.clientY - resizeRef.current.startMY) / canvasScale;
        updateBlock(resizeRef.current.blockId, { w: Math.max(5, resizeRef.current.startW + dx), h: Math.max(5, resizeRef.current.startH + dy) });
      }
    };
    const handleMouseUp = () => {
      dragRef.current = null;
      resizeRef.current = null;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [canvasScale, blocks]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedBlockId) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.contentEditable === 'true') return;
        deleteBlock(selectedBlockId);
        return;
      }
      const step = e.shiftKey ? 5 : 1;
      const arrowMap = { ArrowUp: ['y', -step], ArrowDown: ['y', step], ArrowLeft: ['x', -step], ArrowRight: ['x', step] };
      const delta = arrowMap[e.key];
      if (delta) {
        e.preventDefault();
        const block = blocks.find(b => b.id === selectedBlockId);
        if (!block) return;
        const newVal = clamp((block.styles[delta[0]] || 0) + delta[1], 0, delta[0] === 'x' ? 287 - (block.styles.w || 40) : 200 - (block.styles.h || 20));
        updateBlock(selectedBlockId, { [delta[0]]: newVal });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBlockId, blocks]);

  const handlePreview = async () => {
    if (!cert?.id) { toast.error('Save the template first before previewing'); return; }
    setPreviewLoading(true);
    try {
      const html = viewMode === 'canvas' ? blocksToHtml(blocks) : codeHtml;
      await specializationsService.updateCertificate(cert.id, {
        template_html: html,
        issuer_name: issuerName,
        auto_generate: autoGenerate,
        min_score: parseInt(minScore),
        certificate_type: certificateType,
      });
      const gen = await specializationsService.generateCertificatePdf(cert.id);
      if (gen.file_url) setPreviewUrl(gen.file_url);
      toast.success('Preview generated');
    } catch (e) {
      toast.error('Preview failed: ' + (e.response?.data?.error || e.message));
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const html = viewMode === 'canvas' ? blocksToHtml(blocks) : codeHtml;
      if (cert?.id) {
        await specializationsService.updateCertificate(cert.id, {
          template_html: html,
          issuer_name: issuerName,
          auto_generate: autoGenerate,
          min_score: parseInt(minScore),
          certificate_type: certificateType,
        });
        toast.success('Certificate template saved');
      } else {
        const r = await specializationsService.createCertificate({
          specialization: [specId],
          template_html: html,
          issuer_name: issuerName,
          auto_generate: autoGenerate,
          min_score: parseInt(minScore),
          certificate_type: certificateType,
        });
        toast.success('Certificate created');
        if (onSaved) onSaved(r);
      }
      if (onClose) onClose();
    } catch (e) {
      toast.error('Save failed: ' + (e.response?.data?.error || e.message));
    } finally {
      setSaving(false);
    }
  };

  const renderBlockOnCanvas = (block) => {
    const s = block.styles;
    const px = (v) => v * canvasScale;
    const isSelected = selectedBlockId === block.id;

    let content = null;
    switch (block.type) {
      case 'text':
        content = <div style={{ fontSize: s.fontSize * (canvasScale / 1.8), fontFamily: s.fontFamily, color: s.color, fontWeight: s.bold ? 'bold' : 'normal', fontStyle: s.italic ? 'italic' : 'normal', textAlign: s.textAlign, lineHeight: 1.2, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{fillDemoValues(block.content || '')}</div>;
        break;
      case 'image':
      case 'logo':
        content = block.content ? <img src={block.content} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <div className="flex items-center justify-center h-full text-tertiary text-[10px]"><Image size={16} /></div>;
        break;
      case 'rect':
        content = null;
        break;
      case 'circle':
        content = null;
        break;
      case 'line':
        content = null;
        break;
      case 'signature':
        content = block.content ? <img src={block.content} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <div className="flex items-center justify-center h-full text-tertiary text-[9px] italic">Signature</div>;
        break;
    }

    return (
      <div key={block.id}
        onMouseDown={(e) => { handleCanvasMouseDown(block.id, e); }}
        style={{
          position: 'absolute',
          left: px(s.x || 0),
          top: px(s.y || 0),
          width: px(block.type === 'circle' ? (s.r || 15) * 2 : (s.w || 40)),
          height: px(block.type === 'circle' ? (s.r || 15) * 2 : (s.h || 20)),
          ...(block.type === 'circle' ? { borderRadius: '50%' } : {}),
          ...(block.type === 'line' ? { height: px(s.strokeWidth || 1), background: s.strokeColor || '#000' } : {}),
          ...(block.type === 'rect' || block.type === 'circle' ? { border: `${s.borderWidth || 1}px solid ${s.borderColor || '#000'}`, background: s.fill || 'none' } : {}),
          ...(isSelected ? { outline: '2px solid #3b82f6', outlineOffset: 1, zIndex: 10 } : { zIndex: 1 }),
          cursor: 'move',
          overflow: 'hidden',
          userSelect: 'none',
        }}
        onClick={() => setSelectedBlockId(block.id)}>
        {content}
        {isSelected && block.type !== 'line' && (
          <div onMouseDown={(e) => handleResizeMouseDown(block.id, e)}
            style={{ position: 'absolute', bottom: -4, right: -4, width: 10, height: 10, background: '#3b82f6', borderRadius: 1, cursor: 'nwse-resize', zIndex: 20 }} />
        )}
        {isSelected && (
          <div style={{ position: 'absolute', top: -18, left: 0, background: '#3b82f6', color: '#fff', fontSize: 9, padding: '1px 4px', borderRadius: 2, whiteSpace: 'nowrap', zIndex: 20, pointerEvents: 'none' }}>
            {BLOCK_META[block.type]?.label || block.type}
          </div>
        )}
      </div>
    );
  };

  const canvasW = 287 * canvasScale;
  const canvasH = 200 * canvasScale;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-elevated border border-theme rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col">

        {/* HEADER */}
        <div className="px-4 sm:px-5 py-3 border-b border-theme flex items-center justify-between shrink-0">
          <h3 className="font-bold text-primary text-sm sm:text-base">Certificate Designer</h3>
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex bg-secondary/10 rounded-lg p-0.5 border border-theme">
              <button onClick={() => setViewMode('canvas')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${viewMode === 'canvas' ? 'bg-primary-600 text-white shadow-sm' : 'text-secondary hover:text-primary'}`}>
                Canvas
              </button>
              <button onClick={handleSwitchToCode}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${viewMode === 'code' ? 'bg-primary-600 text-white shadow-sm' : 'text-secondary hover:text-primary'}`}>
                Code <span className="text-[9px] opacity-70 ml-0.5">dev</span>
              </button>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary/10 text-secondary"><X size={18} /></button>
          </div>
        </div>

        {/* MAIN */}
        <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
          {viewMode === 'canvas' ? (
            <>
              {/* TOOLBAR */}
              <div className="w-12 sm:w-14 border-r border-theme bg-secondary/5 flex flex-col items-center gap-1 p-1.5 overflow-y-auto shrink-0">
                {BLOCK_TYPES.map(t => {
                  const m = BLOCK_META[t];
                  return (
                    <button key={t} onClick={() => addBlock(t)}
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex flex-col items-center justify-center gap-0 hover:bg-secondary/10 transition-colors ${m.bg} ${m.color}`}
                      title={m.label}>
                      <m.icon size={14} />
                      <span className="text-[6px] leading-none">{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* CANVAS */}
              <div className="flex-1 overflow-auto bg-gray-100/50 dark:bg-gray-900/30 p-4" ref={canvasRef}>
                <div className="mx-auto bg-white shadow-lg border border-theme relative"
                  style={{ width: canvasW, height: canvasH, backgroundImage: 'linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)', backgroundSize: `${canvasScale * 5}px ${canvasScale * 5}px` }}>
                  {blocks.map(renderBlockOnCanvas)}
                </div>
                <div className="text-center text-[10px] text-tertiary mt-2">
                  {blocks.length} blocks &middot; Click to select &middot; Drag to move &middot; Arrow keys to nudge &middot; Delete to remove
                </div>
              </div>

              {/* PROPERTY PANEL */}
              <div className="w-56 sm:w-64 border-l border-theme bg-secondary/5 overflow-y-auto shrink-0">
                <div className="p-2 border-b border-theme bg-elevated">
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-wider">Properties</p>
                </div>
                <PropertyPanel block={selectedBlock} onChange={updateBlock} onChangeContent={updateBlockContent}
                  onDelete={deleteBlock} onInsertPlaceholder={insertPlaceholder} onRequestSignature={() => setShowSignaturePad(true)} />
              </div>
            </>
          ) : (
            /* CODE VIEW */
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-3 border-b border-theme bg-secondary/5 flex items-center gap-1.5 flex-wrap shrink-0">
                <span className="text-[10px] font-bold text-secondary uppercase tracking-wider mr-1">Insert:</span>
                {PLACEHOLDERS.map(p => (
                  <button key={p.key} onClick={() => {
                    const ta = document.getElementById('cert-code-editor');
                    if (ta) {
                      const start = ta.selectionStart;
                      const end = ta.selectionEnd;
                      const before = codeHtml.substring(0, start);
                      const after = codeHtml.substring(end);
                      setCodeHtml(before + p.key + after);
                      setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + p.key.length; ta.focus(); }, 0);
                    } else {
                      setCodeHtml(prev => prev + p.key);
                    }
                  }}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100">
                    {p.key}
                  </button>
                ))}
                <span className="flex-1" />
                <button onClick={handleSwitchToCanvas} className="text-[10px] px-2 py-1 rounded-lg border border-theme text-secondary hover:text-primary">
                  Import to Canvas
                </button>
              </div>
              <textarea id="cert-code-editor" value={codeHtml} onChange={e => setCodeHtml(e.target.value)}
                className="flex-1 w-full bg-gray-900 text-gray-100 px-3 py-2.5 text-xs font-mono leading-relaxed resize-none focus:outline-none border-0"
                spellCheck={false} />
            </div>
          )}
        </div>

        {/* SETTINGS BAR */}
        <div className="px-4 sm:px-5 py-2 border-t border-theme bg-secondary/5 flex flex-wrap items-center gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <label className="text-secondary whitespace-nowrap">Issuer:</label>
            <input type="text" value={issuerName} onChange={e => setIssuerName(e.target.value)}
              className="rounded-lg border border-theme bg-background px-2 py-1 text-xs w-32 sm:w-40" placeholder="COMRADE Academy" />
          </div>
          <label className="flex items-center gap-1.5 text-xs text-secondary whitespace-nowrap"><input type="checkbox" checked={autoGenerate} onChange={e => setAutoGenerate(e.target.checked)} className="accent-primary-600" /> Auto-issue</label>
          <div className="flex items-center gap-1.5 text-xs text-secondary whitespace-nowrap">
            <span>Min score:</span>
            <input type="number" value={minScore} onChange={e => setMinScore(e.target.value)} className="w-14 rounded-lg border border-theme bg-background px-1.5 py-1 text-xs" />
          </div>
          <select value={certificateType} onChange={e => setCertificateType(e.target.value)} className="rounded-lg border border-theme bg-background px-1.5 py-1 text-xs">
            <option value="completion">Completion</option>
            <option value="distinction">Distinction</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {/* FOOTER */}
        <div className="px-4 sm:px-5 py-3 border-t border-theme flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            {previewUrl && (
              <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 underline flex items-center gap-1">
                <Download size={12} /> View last preview
              </a>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePreview} isLoading={previewLoading}>
              <Eye size={12} className="mr-1" /> Preview PDF
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} isLoading={saving}>
              <Save size={12} className="mr-1" /> Save Template
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          </div>
        </div>

      </div>

      {showSignaturePad && (
        <SignaturePad onSave={handleSignatureSaved} onClose={() => setShowSignaturePad(false)} />
      )}
    </div>
  );
};

export default CertificateDesigner;
