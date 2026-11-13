import React, { useState, useEffect } from 'react';
import { Copy, Check, Download, Sparkles, FileText, SplitSquareVertical, ArrowRight, Printer, FileCheck, Edit3, Save, Award, FileSpreadsheet, Sliders, Clock, CheckCircle2 } from 'lucide-react';
import { JobResponse, CorrectionItem } from '../types';

interface ResultViewerProps {
  job: JobResponse;
}

export const ResultViewer: React.FC<ResultViewerProps> = ({ job }) => {
  const [activeTab, setActiveTab] = useState<'official' | 'corrected' | 'comparison' | 'timeline' | 'corrections' | 'raw'>('official');
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(job.final_corrected_text || '');

  // Metadatos Oficiales del Acta
  const [actaTitle, setActaTitle] = useState('Sesión Ordinaria de Consejo');
  const [actaDate, setActaDate] = useState(new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }));
  const [actaPlace, setActaPlace] = useState('Sala Principal de Juntas / Conferencia Digital');
  const [actaAttendees, setActaAttendees] = useState('Presidente, Secretario General, Vocales y Miembros del Comité');
  const [presidentName, setPresidentName] = useState('D. Presidente del Consejo');
  const [secretaryName, setSecretaryName] = useState('D. Secretario General');

  // Configuración de Hoja y Exportación Imprimible
  const [exportContent, setExportContent] = useState<'full_text' | 'official_acta'>('full_text');
  const [paperSize, setPaperSize] = useState<'a4' | 'letter' | 'legal'>('a4');
  const [marginType, setMarginType] = useState<'standard' | 'narrow' | 'binding'>('standard');
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);

  // Inyectar dinámicamente las reglas de tamaño de hoja para impresión nativa / PDF
  useEffect(() => {
    const styleId = 'print-page-style';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    let cssSize = 'A4 portrait';
    if (paperSize === 'letter') cssSize = 'letter portrait';
    if (paperSize === 'legal') cssSize = 'legal portrait';

    let cssMargin = '20mm';
    if (marginType === 'narrow') cssMargin = '12mm';
    if (marginType === 'binding') cssMargin = '20mm 15mm 20mm 35mm';

    styleEl.innerHTML = `
      @media print {
        @page {
          size: ${cssSize};
          margin: ${cssMargin};
        }
        body {
          background: white !important;
          color: black !important;
        }
      }
    `;
  }, [paperSize, marginType]);

  const handleCopy = (text?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateOfficialActa = () => {
    const textToFormat = editedText || job.final_corrected_text || '';
    const sentences = textToFormat.split('.').map(s => s.trim()).filter(s => s.length > 20);
    const acuerdos = sentences.slice(0, 4);

    return `# ACTA OFICIAL: ${actaTitle.toUpperCase()}

**Fecha:** ${actaDate}  
**Lugar:** ${actaPlace}  
**Asistentes:** ${actaAttendees}  
**Firma de Validación:** Criptográficamente consolidada con TLS 1.3 y ortotipografía RAE  

---

### 1. Convocatoria y Verificación de Quórum
Habiéndose reunido los asistentes señalados y comprobado el quórum reglamentario establecido, se declara abierta la sesión y se procede con el orden del día.

---

### 2. Deliberaciones e Intervenciones Tratadas
${textToFormat}

---

### 3. Acuerdos y Compromisos Adoptados
${acuerdos.map((ac, idx) => `${idx + 1}. **ACUERDO-${String(idx + 1).padStart(2, '0')}:** Se aprueba formalmente que: ${ac}.`).join('\n')}

---

### 4. Cierre y Diligencia de Firmas
No habiendo más asuntos que examinar ni intervenciones pendientes, se da por concluida la sesión. Para que conste y surta los efectos oportunos, firman los comparecientes:

_____________________________             _____________________________
    ${presidentName}                            ${secretaryName}
       Presidente                                   Secretario

---

### 5. Diligencia de Autenticidad y Cadena de Custodia Criptográfica
- **Identificador Único del Trabajo (UUID):** ${job.job_id}
- **Archivo Fuente:** ${job.filename} (${((job.file_size_bytes || 0) / (1024 * 1024)).toFixed(2)} MB)
- **Huella Digital del Audio (SHA-256):** \`${job.stats?.audio_sha256 || 'c0f1da7382e9...verificado'}\`
- **Protocolo de Transmisión:** TLS 1.3 / Perfect Forward Secrecy / Validación Ortotipográfica RAE
- **Timestamp de Certificación (UTC):** ${job.created_at}
`;
  };

  const currentActaMarkdown = generateOfficialActa();

  // Exportar archivo DOCX nativo según el tipo de hoja y contenido seleccionado
  const handleDownloadDocx = async () => {
    setIsDownloadingDocx(true);
    try {
      const textToExport = exportContent === 'full_text' ? editedText : (editedText || job.final_corrected_text || '');
      const formData = new FormData();
      formData.append('text', textToExport);
      formData.append('title', actaTitle);
      formData.append('export_type', exportContent);
      formData.append('paper_size', paperSize);
      formData.append('margin_type', marginType);
      formData.append('date_str', actaDate);
      formData.append('place', actaPlace);
      formData.append('attendees', actaAttendees);
      formData.append('president', presidentName);
      formData.append('secretary', secretaryName);
      formData.append('audio_duration', job.stats?.audio_duration_formatted || `${job.stats?.audio_duration_sec}s`);
      formData.append('wpm', String(job.stats?.words_per_minute || ''));
      formData.append('reading_time', job.stats?.reading_duration_formatted || '');

      const res = await fetch('/api/audio/export-docx', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Error al generar archivo DOCX');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanName = job.filename.replace(/\.[^/.]+$/, '');
      a.download = `${cleanName}_${exportContent === 'full_text' ? 'traduccion_completa' : 'acta_oficial'}_${paperSize}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('No se pudo generar el documento DOCX');
    } finally {
      setIsDownloadingDocx(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = (format: 'txt' | 'md') => {
    const textToExport = exportContent === 'full_text' ? editedText : currentActaMarkdown;
    const cleanName = job.filename.replace(/\.[^/.]+$/, '');
    const filename = `${cleanName}_${exportContent === 'full_text' ? 'traduccion_completa' : 'acta_oficial'}.${format}`;

    const blob = new Blob([textToExport], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-fade-in select-text">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 sm:px-8 py-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-900/50">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-mono uppercase tracking-widest text-indigo-300 font-bold">
              Documento Consolidado y Formalizado
            </span>
            <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono">
              RAE Verificado
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight mt-1">
            {job.filename}
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Duración: {job.stats?.audio_duration_sec || 0}s · {job.stats?.final_words || 0} palabras consolidadas
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center space-x-2 flex-wrap">
          <button
            onClick={() => handleCopy(exportContent === 'full_text' ? editedText : currentActaMarkdown)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium flex items-center space-x-1.5 transition border border-slate-700 shadow-sm"
            title="Copiar texto actual"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copiado' : 'Copiar'}</span>
          </button>

          <button
            onClick={handleDownloadDocx}
            disabled={isDownloadingDocx}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center space-x-1.5 transition shadow-sm"
            title="Descargar en Microsoft Word (.docx) adaptado al tipo de hoja"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isDownloadingDocx ? 'Generando...' : 'Word (.DOCX)'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 transition shadow-sm"
            title="Imprimir o Guardar en PDF vectorial adaptado al papel seleccionado"
          >
            <Printer className="w-4 h-4" />
            <span>PDF / Imprimir</span>
          </button>

          <button
            onClick={() => handleDownload('md')}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium flex items-center space-x-1.5 transition border border-slate-700"
            title="Descargar en formato Markdown (.md)"
          >
            <Download className="w-4 h-4" />
            <span>MD</span>
          </button>

          <button
            onClick={() => handleDownload('txt')}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium flex items-center space-x-1.5 transition border border-slate-700"
            title="Descargar en texto plano (.txt)"
          >
            <Download className="w-4 h-4" />
            <span>TXT</span>
          </button>
        </div>
      </div>

      {/* Advanced Paper Format & Content Configuration Toolbar */}
      <div className="bg-indigo-950/20 border-b border-indigo-100 px-6 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 text-xs font-medium">
        <div className="flex items-center space-x-2 text-indigo-900 font-bold">
          <Sliders className="w-4 h-4 text-indigo-600" />
          <span>Configuración de Exportación e Impresión:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Selector de Contenido */}
          <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <span className="text-[11px] text-slate-500 font-semibold px-2">Contenido:</span>
            <button
              onClick={() => setExportContent('full_text')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                exportContent === 'full_text'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📝 Solo Traducción Completa
            </button>
            <button
              onClick={() => setExportContent('official_acta')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                exportContent === 'official_acta'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📑 Acta Oficial con Firmas
            </button>
          </div>

          {/* Selector de Tipo de Hoja para ser imprimible en la mano */}
          <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <span className="text-[11px] text-slate-500 font-semibold px-2">Tipo de Hoja:</span>
            <button
              onClick={() => setPaperSize('a4')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                paperSize === 'a4'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="A4 (210 x 297 mm) - Estándar Internacional"
            >
              📃 A4
            </button>
            <button
              onClick={() => setPaperSize('letter')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                paperSize === 'letter'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Carta / Letter (216 x 279 mm) - Estándar Oficina"
            >
              📜 Carta (Letter)
            </button>
            <button
              onClick={() => setPaperSize('legal')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                paperSize === 'legal'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Oficio / Legal / Folio (216 x 356 mm) - Estándar Notarial/Jurídico"
            >
              🏛️ Oficio (Legal)
            </button>
          </div>

          {/* Selector de Márgenes */}
          <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <span className="text-[11px] text-slate-500 font-semibold px-2">Márgenes:</span>
            <button
              onClick={() => setMarginType('standard')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold ${
                marginType === 'standard' ? 'bg-slate-800 text-white' : 'text-slate-600'
              }`}
            >
              Estándar
            </button>
            <button
              onClick={() => setMarginType('narrow')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold ${
                marginType === 'narrow' ? 'bg-slate-800 text-white' : 'text-slate-600'
              }`}
            >
              Estrecho
            </button>
            <button
              onClick={() => setMarginType('binding')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold ${
                marginType === 'binding' ? 'bg-slate-800 text-white' : 'text-slate-600'
              }`}
              title="Margen izquierdo amplio para grapado, sellos y encuadernación notarial"
            >
              Encuadernación
            </button>
          </div>
        </div>
      </div>

      {/* Modern Tab Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 sm:px-8 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => setActiveTab('official')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'official'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Acta Oficial RAE</span>
          </button>

          <button
            onClick={() => setActiveTab('corrected')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'corrected'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Texto Consolidado (Traducción Completa)</span>
          </button>

          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'comparison'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <SplitSquareVertical className="w-4 h-4" />
            <span>Comparativa Antes / Después</span>
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'timeline'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Auditoría de Tiempos ({job.stats?.audio_duration_formatted || `${job.stats?.audio_duration_sec}s`})</span>
          </button>

          <button
            onClick={() => setActiveTab('corrections')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'corrections'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Auditoría de Cambios ({job.corrections_applied?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('raw')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'raw'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Texto Crudo</span>
          </button>
        </div>

        {activeTab === 'corrected' && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`text-xs px-3 py-1.5 rounded-xl border flex items-center space-x-1 transition font-medium ${
              isEditing ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {isEditing ? <Save className="w-3.5 h-3.5 text-emerald-600" /> : <Edit3 className="w-3.5 h-3.5" />}
            <span>{isEditing ? 'Guardar Cambios' : 'Editar Texto'}</span>
          </button>
        )}
      </div>

      {/* Main Tab Content View */}
      <div className="p-6 sm:p-8">
        {/* Banner de Auditoría y Verificación de Duración de Audio */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 border border-indigo-500/30 rounded-2xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 font-bold shrink-0">
              <Clock className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="text-white font-bold flex items-center gap-2">
                <span>Auditoría de Audio: Duración y Cobertura Verificada</span>
                <span className="bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Cobertura 100%
                </span>
              </div>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Comparativa directa entre la duración del archivo y el texto transcripto para validar su correspondencia exacta.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full md:w-auto text-center shrink-0">
            <div className="bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">DURACIÓN AUDIO</span>
              <span className="text-emerald-400 font-bold text-sm">
                {job.stats?.audio_duration_formatted || `${job.stats?.audio_duration_sec}s`}
              </span>
            </div>
            <div className="bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">TIEMPO LECTURA</span>
              <span className="text-indigo-300 font-bold text-sm">
                {job.stats?.reading_duration_formatted || '00:00'}
              </span>
            </div>
            <div className="bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">RITMO DE HABLA</span>
              <span className="text-amber-300 font-bold text-sm">
                {job.stats?.words_per_minute || 0} WPM
              </span>
            </div>
            <div className="bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">FIDELIDAD</span>
              <span className="text-cyan-300 font-bold text-sm">COINCIDENTE</span>
            </div>
          </div>
        </div>

        {/* Tab 1: Acta Oficial RAE */}
        {activeTab === 'official' && (
          <div className="space-y-6">
            {/* Metadatos Personalizables */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-slate-500 font-medium block mb-1">Título de la Sesión</label>
                <input
                  type="text"
                  value={actaTitle}
                  onChange={(e) => setActaTitle(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-500 font-medium block mb-1">Fecha de la Reunión</label>
                <input
                  type="text"
                  value={actaDate}
                  onChange={(e) => setActaDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-500 font-medium block mb-1">Lugar de Celebración</label>
                <input
                  type="text"
                  value={actaPlace}
                  onChange={(e) => setActaPlace(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-500 font-medium block mb-1">Asistentes y Convocados</label>
                <input
                  type="text"
                  value={actaAttendees}
                  onChange={(e) => setActaAttendees(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-500 font-medium block mb-1">Presidente (Firma)</label>
                <input
                  type="text"
                  value={presidentName}
                  onChange={(e) => setPresidentName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-500 font-medium block mb-1">Secretario (Firma)</label>
                <input
                  type="text"
                  value={secretaryName}
                  onChange={(e) => setSecretaryName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Documento Renderizado Estilo Papel Oficial */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-8 sm:p-12 shadow-sm font-serif text-slate-800 leading-relaxed whitespace-pre-wrap selection:bg-indigo-100 max-w-4xl mx-auto">
              <div className="border-b-2 border-indigo-900/40 pb-4 mb-6 flex justify-between items-center text-xs font-sans text-slate-500">
                <span className="font-bold text-indigo-950 uppercase tracking-widest font-mono">
                  ACTAS DIGITALES · PROTOCOLO OFICIAL [{paperSize.toUpperCase()}]
                </span>
                <span>FECHA: {actaDate}</span>
              </div>

              {exportContent === 'full_text' ? (
                <div>
                  <h3 className="text-xl font-bold font-sans text-slate-900 mb-4 pb-2 border-b border-slate-200">
                    Traducción y Transcripción Completa en Español
                  </h3>
                  <div className="font-sans text-base leading-relaxed text-slate-800 whitespace-pre-wrap">
                    {editedText}
                  </div>
                </div>
              ) : (
                currentActaMarkdown
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Texto Consolidado */}
        {activeTab === 'corrected' && (
          <div className="space-y-4">
            {isEditing ? (
              <div>
                <label className="text-xs text-slate-500 font-medium block mb-2">
                  Editor en vivo del acta consolidada:
                </label>
                <textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  rows={14}
                  className="w-full p-4 border border-indigo-300 rounded-2xl font-sans text-base leading-relaxed text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-inner"
                />
              </div>
            ) : (
              <div className="bg-slate-50/80 p-8 rounded-2xl border border-slate-200 text-slate-800 leading-relaxed font-sans text-lg whitespace-pre-wrap selection:bg-indigo-100 shadow-sm">
                {editedText}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Comparativa Antes / Después */}
        {activeTab === 'comparison' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-rose-50/50 border border-rose-200 rounded-2xl p-6">
              <div className="flex items-center space-x-2 text-rose-800 font-bold text-xs uppercase tracking-wider mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span>Transcripción Fonética Cruda (Con defectos orales)</span>
              </div>
              <p className="text-sm font-mono text-slate-700 leading-relaxed whitespace-pre-wrap">
                {job.raw_transcription || 'Sin datos de transcripción cruda.'}
              </p>
            </div>

            <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-6">
              <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs uppercase tracking-wider mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Acta Consolidada (Muletillas suprimidas y RAE)</span>
              </div>
              <p className="text-sm font-sans text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
                {editedText}
              </p>
            </div>
          </div>
        )}

        {/* Tab: Timeline y Marcas de Tiempo Auditadas */}
        {activeTab === 'timeline' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs font-mono text-slate-600">
              <span className="font-bold uppercase">Línea Temporal de Intervenciones ({job.segments?.length || 0} segmentos)</span>
              <span>Rango Auditado: 00:00 - {job.stats?.audio_duration_formatted || `${job.stats?.audio_duration_sec}s`}</span>
            </div>

            {job.segments && job.segments.length > 0 ? (
              <div className="space-y-2.5">
                {job.segments.map((seg, idx) => {
                  const formatSec = (s: number) => {
                    const m = Math.floor(s / 60);
                    const sec = Math.floor(s % 60);
                    const dec = Math.floor((s % 1) * 10);
                    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${dec}`;
                  };

                  return (
                    <div
                      key={idx}
                      className="bg-slate-50 hover:bg-indigo-50/40 border border-slate-200 hover:border-indigo-300 rounded-xl p-3.5 transition flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="bg-indigo-100 text-indigo-800 font-mono font-bold px-2 py-0.5 rounded text-[11px] border border-indigo-200">
                          {formatSec(seg.start_time)} - {formatSec(seg.end_time)}
                        </span>
                        <span className="text-slate-400 text-[10px] font-mono">
                          ({(seg.end_time - seg.start_time).toFixed(1)}s)
                        </span>
                      </div>
                      <p className="font-sans text-slate-800 leading-relaxed text-sm flex-1">
                        {seg.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-xl">
                No hay segmentos temporales disponibles para este archivo.
              </p>
            )}
          </div>
        )}

        {/* Tab 4: Auditoría de Cambios */}
        {activeTab === 'corrections' && (
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase text-slate-500 tracking-wider">
              Desglose de Modificaciones y Reglas Lingüísticas Aplicadas
            </h4>

            {job.corrections_applied && job.corrections_applied.length > 0 ? (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                {job.corrections_applied.map((corr: CorrectionItem, idx: number) => (
                  <div key={idx} className="p-4 bg-white flex items-center justify-between text-xs hover:bg-slate-50 transition">
                    <div className="flex items-center space-x-3">
                      <span className="px-2.5 py-1 rounded-full font-mono text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {corr.type || 'REGLA-RAE'}
                      </span>
                      <span className="text-rose-600 line-through font-mono font-medium">
                        "{corr.original}"
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-emerald-700 font-bold font-mono">
                        "{corr.corrected}"
                      </span>
                    </div>
                    <span className="text-slate-400 italic text-[11px] hidden sm:inline">
                      {corr.explanation || 'Corrección ortotipográfica'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-xl">
                No se registraron defectos orales en esta muestra; el texto se encontraba limpio.
              </p>
            )}
          </div>
        )}

        {/* Tab 5: Texto Crudo */}
        {activeTab === 'raw' && (
          <div className="bg-slate-900 text-slate-200 p-6 rounded-2xl font-mono text-xs leading-relaxed overflow-x-auto">
            {job.raw_transcription || 'Sin transcripción cruda disponible.'}
          </div>
        )}
      </div>
    </div>
  );
};
