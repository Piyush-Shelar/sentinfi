import React, { useState, useRef, useCallback } from 'react';
import {
  Upload, FileText, Image, X, CheckCircle, Lock, Hash, 
  CloudUpload, AlertCircle, ChevronDown
} from 'lucide-react';
import ClientNavbar from '../../components/ClientNavbar';
import SecurityBadge from '../../components/SecurityBadge';
import { mockDocuments } from '../../data/mockData';

const clientDocs = mockDocuments.filter(d => d.clientId === 'c001');

const DOC_TYPES = [
  'PAN Card',
  'Aadhaar Card',
  'ITR',
  'Salary Slip',
  'Portfolio Statement',
  'Bank Statement',
  'Other',
];

const UPLOAD_STAGES = [
  { id: 'encrypt', label: 'Encrypting', icon: Lock, description: 'AES-256 encryption applied' },
  { id: 'hash',    label: 'Generating Hash', icon: Hash, description: 'SHA-256 fingerprint created' },
  { id: 'upload',  label: 'Uploading', icon: CloudUpload, description: 'Secure transfer in progress' },
  { id: 'done',    label: 'Complete', icon: CheckCircle, description: 'Document stored successfully' },
];

function UploadProgressBar({ stage }) {
  const stageIndex = UPLOAD_STAGES.findIndex(s => s.id === stage);
  return (
    <div className="mt-4 space-y-3">
      <div className="flex gap-2">
        {UPLOAD_STAGES.map((s, idx) => (
          <div
            key={s.id}
            className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
              idx <= stageIndex ? 'bg-teal-500' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <div className="flex items-center gap-4">
        {UPLOAD_STAGES.map((s, idx) => {
          const Icon = s.icon;
          const isActive = idx === stageIndex;
          const isDone = idx < stageIndex;
          const isPending = idx > stageIndex;
          return (
            <div key={s.id} className="flex items-center gap-2 flex-1 min-w-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                isDone    ? 'bg-teal-500 text-white' :
                isActive  ? 'bg-navy-900 text-white animate-pulse-soft' :
                'bg-gray-100 text-gray-400'
              }`}>
                {isDone ? <CheckCircle size={14} /> : <Icon size={14} />}
              </div>
              <div className="min-w-0 hidden sm:block">
                <div className={`text-xs font-semibold truncate ${
                  isDone ? 'text-teal-600' : isActive ? 'text-navy-900' : 'text-gray-400'
                }`}>
                  {isActive ? s.label + '...' : s.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {stageIndex >= 0 && stageIndex < UPLOAD_STAGES.length && (
        <p className="text-xs text-gray-500 text-center">
          {UPLOAD_STAGES[stageIndex].description}
        </p>
      )}
    </div>
  );
}

export default function ClientUpload() {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [docType, setDocType] = useState('');
  const [uploadStage, setUploadStage] = useState(null);
  const [uploadDone, setUploadDone] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('File must be smaller than 10MB.');
      return;
    }
    setError('');
    setSelectedFile(file);
    setUploadDone(false);
    setUploadStage(null);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }, []);

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  const runUpload = () => {
    if (!selectedFile || !docType) {
      setError('Please select a file and document type.');
      return;
    }
    setError('');
    const stages = ['encrypt', 'hash', 'upload', 'done'];
    let i = 0;
    setUploadStage(stages[0]);
    const interval = setInterval(() => {
      i++;
      if (i < stages.length) {
        setUploadStage(stages[i]);
      } else {
        clearInterval(interval);
        setUploadDone(true);
      }
    }, 1200);
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setDocType('');
    setUploadStage(null);
    setUploadDone(false);
    setError('');
  };

  return (
    <div className="min-h-screen bg-surface">
      <ClientNavbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-2xl font-bold text-navy-900">Upload Document</h1>
          <p className="text-gray-500 text-sm mt-1">
            Files are encrypted with AES-256 and fingerprinted before upload.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Upload zone */}
          <div className="lg:col-span-3 space-y-4 animate-fade-in-up stagger-1">
            {/* Drop zone */}
            <div className="bg-white rounded-2xl shadow-card border border-border p-6">
              <h2 className="text-sm font-semibold text-navy-800 mb-4">Select File</h2>
              {!selectedFile ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
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
                    <p className="text-xs text-gray-400 mt-2">PDF, JPG, PNG — max 10MB</p>
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
                    {!uploadStage && !uploadDone && (
                      <button onClick={resetUpload} className="p-1.5 rounded-lg hover:bg-teal-100 text-gray-500 hover:text-gray-700 transition-colors">
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* Progress */}
                  {uploadStage && !uploadDone && <UploadProgressBar stage={uploadStage} />}

                  {/* Success */}
                  {uploadDone && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-teal-200 flex items-center gap-3">
                      <CheckCircle size={20} className="text-teal-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-teal-700">Upload Complete!</p>
                        <p className="text-xs text-gray-500">Hash stored · AES-256 encrypted · Pending review</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <input ref={inputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={e => handleFile(e.target.files[0])} />
            </div>

            {/* Document type */}
            <div className="bg-white rounded-2xl shadow-card border border-border p-6">
              <h2 className="text-sm font-semibold text-navy-800 mb-4">Document Type</h2>
              <div className="relative">
                <select
                  value={docType}
                  onChange={e => setDocType(e.target.value)}
                  className="w-full appearance-none border border-border rounded-xl px-4 py-2.5 text-sm text-navy-900 bg-white focus:border-navy-900 focus:ring-2 focus:ring-navy-900/10 transition-all pr-10"
                >
                  <option value="">Select document type...</option>
                  {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                {DOC_TYPES.slice(0, 5).map(t => (
                  <button
                    key={t}
                    onClick={() => setDocType(t)}
                    className={`text-xs font-medium px-3 py-2 rounded-lg border transition-all duration-200 ${
                      docType === t
                        ? 'bg-navy-900 text-white border-navy-900'
                        : 'border-border text-gray-600 hover:border-navy-400 hover:text-navy-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {/* Upload button */}
            <button
              onClick={uploadDone ? resetUpload : runUpload}
              disabled={!!uploadStage && !uploadDone}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                uploadDone
                  ? 'bg-teal-600 hover:bg-teal-700 text-white'
                  : 'bg-navy-900 hover:bg-navy-800 text-white'
              }`}
            >
              {uploadStage && !uploadDone ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
                  Processing...
                </>
              ) : uploadDone ? (
                <><Upload size={16} /> Upload Another</>
              ) : (
                <><Lock size={16} /> Encrypt & Upload</>
              )}
            </button>
          </div>

          {/* Previously uploaded docs */}
          <div className="lg:col-span-2 animate-fade-in-up stagger-3">
            <div className="bg-white rounded-2xl shadow-card border border-border p-6 h-full">
              <h2 className="text-sm font-semibold text-navy-800 mb-4">Previously Uploaded</h2>
              <div className="space-y-3">
                {clientDocs.map(doc => (
                  <div
                    key={doc.id}
                    className="flex items-start gap-3 p-3 rounded-xl border border-border hover:bg-surface transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-navy-50 flex items-center justify-center flex-shrink-0">
                      <FileText size={14} className="text-navy-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-navy-900 truncate">{doc.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{doc.type} · {doc.size}</p>
                      <div className="mt-1.5">
                        <SecurityBadge status={doc.status} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
