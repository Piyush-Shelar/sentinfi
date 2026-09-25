import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload, FileText, Image, X, CheckCircle, Lock, Hash,
  CloudUpload, AlertCircle, ChevronDown, ShieldCheck, RefreshCw
} from 'lucide-react';
import ClientNavbar from '../../components/ClientNavbar';
import SecurityBadge from '../../components/SecurityBadge';
import { useAuth } from '../../context/AuthContext';

const DOC_TYPE_OPTIONS = [
  { label: 'PAN Card',             value: 'PAN' },
  { label: 'Aadhaar Card',         value: 'AADHAAR' },
  { label: 'ITR',                  value: 'ITR' },
  { label: 'Salary Slip',          value: 'SALARY_SLIP' },
  { label: 'Portfolio Statement',  value: 'PORTFOLIO' },
];

const PIPELINE_STAGES = [
  { id: 'sha256',   label: 'SHA-256 Digest',      icon: Hash,        description: 'Computing SHA-256 baseline digest...' },
  { id: 'aeskey',  label: 'AES Session Key',      icon: Lock,        description: 'Generating ephemeral AES-256 session key...' },
  { id: 'gcm',     label: 'AES-256-GCM Cipher',   icon: ShieldCheck, description: 'Applying AES-256-GCM authenticated cipher...' },
  { id: 'rsa',     label: 'RSA-2048 OAEP',         icon: Lock,        description: 'Encapsulating key via RSA-2048 OAEP...' },
  { id: 'vault',   label: 'Securing in Vault',     icon: CloudUpload, description: 'Securing in vault...' },
  { id: 'done',    label: 'Complete',              icon: CheckCircle, description: 'Document verified and stored.' },
];

function PipelineProgress({ stageId }) {
  const idx = PIPELINE_STAGES.findIndex(s => s.id === stageId);
  return (
    <div className="mt-5 space-y-3">
      <div className="flex gap-1.5">
        {PIPELINE_STAGES.map((s, i) => (
          <div
            key={s.id}
            className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
              i <= idx ? 'bg-teal-500' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      {idx >= 0 && idx < PIPELINE_STAGES.length && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="w-3 h-3 border-2 border-navy-300 border-t-navy-900 rounded-full animate-spin inline-block flex-shrink-0" />
          {PIPELINE_STAGES[idx].description}
        </div>
      )}
      <div className="grid grid-cols-3 gap-2">
        {PIPELINE_STAGES.slice(0, 6).map((s, i) => {
          const Icon = s.icon;
          const done = i < idx;
          const active = i === idx;
          return (
            <div
              key={s.id}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                done   ? 'bg-teal-50 text-teal-700 border border-teal-200' :
                active ? 'bg-navy-50 text-navy-900 border border-navy-200' :
                         'bg-gray-50 text-gray-400 border border-gray-100'
              }`}
            >
              {done
                ? <CheckCircle size={11} className="flex-shrink-0" />
                : <Icon size={11} className="flex-shrink-0" />
              }
              <span className="truncate">{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DocumentCard({ doc }) {
  const dateStr = doc.createdAt
    ? new Date(doc.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-border hover:bg-surface transition-colors">
      <div className="w-8 h-8 rounded-lg bg-navy-50 flex items-center justify-center flex-shrink-0">
        <FileText size={14} className="text-navy-700" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-navy-900 truncate">{doc.originalFilename || doc.name}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {doc.documentType || doc.type} · {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : doc.size}
        </p>
        {doc.sha256Hash && (
          <p className="text-xs text-gray-400 font-mono mt-0.5 truncate" title={doc.sha256Hash}>
            {doc.sha256Hash.slice(0, 16)}…
          </p>
        )}
        <div className="mt-1.5">
          <SecurityBadge status={doc.status || 'Verified'} />
        </div>
        {dateStr && <p className="text-xs text-gray-400 mt-1">{dateStr}</p>}
      </div>
    </div>
  );
}

export default function ClientUpload() {
  const { accessToken } = useAuth();
  const [dragOver, setDragOver]     = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [docType, setDocType]       = useState('');
  const [pipelineStage, setPipelineStage] = useState(null);
  const [uploadDone, setUploadDone] = useState(false);
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState('');
  const [myDocs, setMyDocs]         = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const inputRef = useRef(null);
  const stageTimerRef = useRef(null);

  const fetchMyDocs = useCallback(async () => {
    if (!accessToken) return;
    setLoadingDocs(true);
    try {
      const res = await fetch('/api/documents/my-documents', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMyDocs(data);
      }
    } catch {
    } finally {
      setLoadingDocs(false);
    }
  }, [accessToken]);

  useEffect(() => { fetchMyDocs(); }, [fetchMyDocs]);

  const handleFile = (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('File must be smaller than 10 MB.');
      return;
    }
    setError('');
    setSelectedFile(file);
    setUploadDone(false);
    setPipelineStage(null);
    setResult(null);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }, []);

  const advanceStages = (stages, idx, delay, onComplete) => {
    if (idx >= stages.length) { onComplete(); return; }
    setPipelineStage(stages[idx]);
    stageTimerRef.current = setTimeout(() => advanceStages(stages, idx + 1, delay, onComplete), delay);
  };

  const runUpload = async () => {
    if (!selectedFile || !docType) {
      setError('Please select a file and a document type.');
      return;
    }
    setError('');

    const preStages = ['sha256', 'aeskey', 'gcm', 'rsa'];
    let stageIdx = 0;

    const tick = () => {
      if (stageIdx < preStages.length) {
        setPipelineStage(preStages[stageIdx]);
        stageIdx++;
        stageTimerRef.current = setTimeout(tick, 650);
      } else {
        sendToServer();
      }
    };
    tick();
  };

  const sendToServer = async () => {
    setPipelineStage('vault');
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('documentType', docType);

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setPipelineStage(null);
        setError(data.error || 'Upload failed. Please try again.');
        return;
      }

      setPipelineStage('done');
      setResult(data);
      setUploadDone(true);
      fetchMyDocs();
    } catch {
      setPipelineStage(null);
      setError('Unable to reach the server. Please try again.');
    }
  };

  const resetUpload = () => {
    clearTimeout(stageTimerRef.current);
    setSelectedFile(null);
    setDocType('');
    setPipelineStage(null);
    setUploadDone(false);
    setResult(null);
    setError('');
  };

  const isProcessing = !!pipelineStage && !uploadDone;

  return (
    <div className="min-h-screen bg-surface">
      <ClientNavbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-2xl font-bold text-navy-900">Upload Document</h1>
          <p className="text-gray-500 text-sm mt-1">
            Files are encrypted with AES-256-GCM, key-wrapped with RSA-2048 OAEP, and SHA-256 fingerprinted before storage.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-4 animate-fade-in-up stagger-1">

            <div className="bg-white rounded-2xl shadow-card border border-border p-6">
              <h2 className="text-sm font-semibold text-navy-800 mb-4">Select File</h2>
              {!selectedFile ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onClick={() => inputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 ${
                    dragOver
                      ? 'border-teal-500 bg-teal-50 scale-[1.01]'
                      : 'border-border hover:border-navy-400 hover:bg-navy-50/50'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${dragOver ? 'bg-teal-100' : 'bg-navy-50'}`}>
                    <Upload size={28} className={dragOver ? 'text-teal-600' : 'text-navy-700'} />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-navy-800">
                      {dragOver ? 'Drop to upload' : 'Drag & drop your file here'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">or <span className="text-teal-600 font-medium">browse to choose</span></p>
                    <p className="text-xs text-gray-400 mt-2">PDF, JPG, PNG — max 10 MB</p>
                  </div>
                  <div className="flex gap-3 mt-2">
                    {[FileText, Image].map((Icon, i) => (
                      <div key={i} className="w-10 h-10 bg-gray-50 border border-border rounded-lg flex items-center justify-center">
                        <Icon size={18} className="text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center flex-shrink-0">
                      <FileText size={18} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-navy-900 truncate">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                        {selectedFile.type && ` · ${selectedFile.type.split('/')[1].toUpperCase()}`}
                      </p>
                    </div>
                    {!isProcessing && !uploadDone && (
                      <button onClick={resetUpload} className="p-1.5 rounded-lg hover:bg-teal-100 text-gray-500 hover:text-gray-700 transition-colors">
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {isProcessing && <PipelineProgress stageId={pipelineStage} />}

                  {uploadDone && result && (
                    <div className="mt-4 p-4 bg-white rounded-xl border border-teal-200 space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={18} className="text-teal-600 flex-shrink-0" />
                        <p className="text-sm font-semibold text-teal-700">Upload Complete — Stored in Vault</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">SHA-256 Integrity Digest</p>
                        <p className="text-xs font-mono text-navy-900 break-all">{result.sha256Hash}</p>
                      </div>
                      <p className="text-xs text-gray-400">
                        Document ID: <span className="font-mono">{result.documentId}</span>
                      </p>
                    </div>
                  )}
                </div>
              )}
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFile(e.target.files[0])}
              />
            </div>

            <div className="bg-white rounded-2xl shadow-card border border-border p-6">
              <h2 className="text-sm font-semibold text-navy-800 mb-4">Document Type</h2>
              <div className="relative">
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  disabled={isProcessing}
                  className="w-full appearance-none border border-border rounded-xl px-4 py-2.5 text-sm text-navy-900 bg-white focus:border-navy-900 focus:ring-2 focus:ring-navy-900/10 transition-all pr-10 disabled:opacity-60"
                >
                  <option value="">Select document type...</option>
                  {DOC_TYPE_OPTIONS.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                {DOC_TYPE_OPTIONS.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setDocType(t.value)}
                    disabled={isProcessing}
                    className={`text-xs font-medium px-3 py-2 rounded-lg border transition-all duration-200 disabled:opacity-60 ${
                      docType === t.value
                        ? 'bg-navy-900 text-white border-navy-900'
                        : 'border-border text-gray-600 hover:border-navy-400 hover:text-navy-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                <AlertCircle size={16} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={uploadDone ? resetUpload : runUpload}
              disabled={isProcessing}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                uploadDone
                  ? 'bg-teal-600 hover:bg-teal-700 text-white'
                  : 'bg-navy-900 hover:bg-navy-800 text-white'
              }`}
            >
              {isProcessing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
                  Processing…
                </>
              ) : uploadDone ? (
                <><Upload size={16} /> Upload Another</>
              ) : (
                <><Lock size={16} /> Encrypt &amp; Upload</>
              )}
            </button>
          </div>

          <div className="lg:col-span-2 animate-fade-in-up stagger-3">
            <div className="bg-white rounded-2xl shadow-card border border-border p-6 h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-navy-800">Previously Uploaded</h2>
                <button
                  onClick={fetchMyDocs}
                  disabled={loadingDocs}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                  title="Refresh"
                >
                  <RefreshCw size={13} className={loadingDocs ? 'animate-spin' : ''} />
                </button>
              </div>
              <div className="space-y-3">
                {loadingDocs && myDocs.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-xs">Loading…</div>
                )}
                {!loadingDocs && myDocs.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-xs">No documents uploaded yet.</div>
                )}
                {myDocs.map(doc => (
                  <DocumentCard key={doc._id} doc={doc} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
