import React, { useState, useEffect } from 'react';
import { X, Save, Eye, Code, Upload, Image, Download, RefreshCw } from 'lucide-react';
import Button from '../../components/common/Button';
import { useToast } from '../../contexts/ToastContext';
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

const DEFAULT_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <style>
    @page { size: A4 landscape; margin: 0; }
    body {
      font-family: 'Times New Roman', serif;
      margin: 0; padding: 0;
      width: 297mm; height: 210mm;
      display: flex; align-items: center; justify-content: center;
      background: #faf6f0;
    }
    .certificate {
      width: 270mm; height: 185mm;
      border: 3px solid #c9a94e;
      background: white;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      padding: 20mm;
      text-align: center;
      position: relative;
    }
    .certificate::before {
      content: ''; position: absolute;
      top: 8mm; left: 8mm; right: 8mm; bottom: 8mm;
      border: 1px solid #c9a94e;
      pointer-events: none;
    }
    h1 { font-size: 36pt; color: #1a1a2e; margin-bottom: 0; text-transform: uppercase; letter-spacing: 4px; }
    h2 { font-size: 18pt; color: #666; font-weight: normal; margin-top: 10mm; }
    h3 { font-size: 28pt; color: #c9a94e; margin: 8mm 0; }
    p { font-size: 14pt; color: #444; margin: 3mm 0; }
    .learner { font-size: 32pt; color: #1a1a2e; font-weight: bold; margin: 5mm 0; }
    .details { font-size: 12pt; color: #666; margin-top: 5mm; }
    .verification { font-size: 9pt; color: #999; margin-top: 8mm; }
  </style>
</head>
<body>
  <div class="certificate">
    <h1>Certificate of Completion</h1>
    <h2>This is proudly presented to</h2>
    <div class="learner">{{learner_name}}</div>
    <p>for successfully completing</p>
    <h3>{{course_name}}</h3>
    <p class="details">Issued by: {{issuer_name}} &bull; {{completion_date}}</p>
    <p class="details">Grade: {{grade}} &bull; Average Score: {{average_score}}%</p>
    <p class="verification">Verification Code: {{verification_code}}</p>
  </div>
</body>
</html>`;

const CertificateDesigner = ({ specId, cert, onClose, onSaved }) => {
  const toast = useToast();
  const [templateHtml, setTemplateHtml] = useState(DEFAULT_TEMPLATE);
  const [issuerName, setIssuerName] = useState('');
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [minScore, setMinScore] = useState(70);
  const [certificateType, setCertificateType] = useState('completion');
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (cert) {
      setTemplateHtml(cert.template_html || DEFAULT_TEMPLATE);
      setIssuerName(cert.issuer_name || '');
      setAutoGenerate(cert.auto_generate !== false);
      setMinScore(cert.min_score || 70);
      setCertificateType(cert.certificate_type || 'completion');
    }
  }, [cert]);

  const handleInsertPlaceholder = (key) => {
    setTemplateHtml(prev => prev + key);
  };

  const handlePreview = async () => {
    if (!cert) return;
    setPreviewLoading(true);
    try {
      const r = await specializationsService.updateCertificate(cert.id, {
        template_html: templateHtml,
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
      if (cert?.id) {
        await specializationsService.updateCertificate(cert.id, {
          template_html: templateHtml,
          issuer_name: issuerName,
          auto_generate: autoGenerate,
          min_score: parseInt(minScore),
          certificate_type: certificateType,
        });
        toast.success('Certificate template saved');
      } else {
        const r = await specializationsService.createCertificate({
          specialization: [specId],
          template_html: templateHtml,
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-elevated border border-theme rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-theme flex items-center justify-between">
          <h3 className="font-bold text-primary">Certificate Designer</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary/10 text-secondary"><X size={18} /></button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            <div>
              <label className="block text-xs font-medium text-primary mb-1">Issuer Name</label>
              <input type="text" value={issuerName} onChange={e => setIssuerName(e.target.value)}
                className="w-full rounded-lg border border-theme bg-background px-3 py-2 text-sm" placeholder="e.g. COMRADE Academy" />
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={autoGenerate} onChange={e => setAutoGenerate(e.target.checked)} className="accent-primary-600" /> Auto-generate on completion</label>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-secondary">Min score:</span>
                <input type="number" value={minScore} onChange={e => setMinScore(e.target.value)} className="w-16 rounded-lg border border-theme bg-background px-2 py-1 text-xs" />
              </div>
              <select value={certificateType} onChange={e => setCertificateType(e.target.value)} className="rounded-lg border border-theme bg-background px-2 py-1 text-xs">
                <option value="completion">Completion</option>
                <option value="distinction">Distinction</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-primary mb-1">HTML Template</label>
              <div className="flex flex-wrap gap-1 mb-2">
                {PLACEHOLDERS.map(p => (
                  <button key={p.key} onClick={() => handleInsertPlaceholder(p.key)}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100" title={p.desc}>
                    {p.key}
                  </button>
                ))}
              </div>
              <textarea value={templateHtml} onChange={e => setTemplateHtml(e.target.value)}
                className="w-full h-64 rounded-lg border border-theme bg-gray-900 text-gray-100 px-3 py-2.5 text-xs font-mono leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
                spellCheck={false} />
            </div>
          </div>

          <div className="w-72 border-l border-theme p-4 space-y-3 overflow-y-auto bg-secondary/5">
            <p className="text-xs font-bold text-secondary uppercase tracking-wider">Placeholders</p>
            <div className="space-y-2">
              {PLACEHOLDERS.map(p => (
                <div key={p.key} className="text-xs">
                  <code className="text-primary-600 bg-primary-50 px-1 rounded text-[10px]">{p.key}</code>
                  <p className="text-tertiary mt-0.5">{p.desc}</p>
                </div>
              ))}
            </div>

            {previewUrl && (
              <div className="mt-4">
                <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">Preview</p>
                <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <div className="border border-theme rounded-lg p-2 bg-white">
                    <Download size={24} className="mx-auto text-primary-600" />
                    <p className="text-[10px] text-center text-secondary mt-1">Click to view PDF</p>
                  </div>
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-theme flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={handlePreview} isLoading={previewLoading}>
            <Eye size={12} className="mr-1" /> Preview
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} isLoading={saving}>
            <Save size={12} className="mr-1" /> Save Template
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
};

export default CertificateDesigner;
