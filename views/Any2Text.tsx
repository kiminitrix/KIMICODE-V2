
import React from 'react';
import { Button, fileToBase64 } from '../components/Shared';
import { convertMediaToText } from '../services/geminiService';
import { Any2TextState } from '../types';
import { FileText, Loader2, Copy, Download, X, Sparkles, FileAudio, FileVideo, Image as ImageIcon, File, Plus } from 'lucide-react';

interface Any2TextProps {
  state: Any2TextState;
  updateState: (updates: Partial<Any2TextState>) => void;
}

const Any2Text: React.FC<Any2TextProps> = ({ state, updateState }) => {
  const { files, result, isProcessing } = state;

  const handleUpload = async (uploadedFiles: File[]) => {
    const newFiles = await Promise.all(uploadedFiles.map(async (f) => ({
      name: f.name,
      type: f.type,
      data: await fileToBase64(f)
    })));
    updateState({ files: [...files, ...newFiles] });
  };

  const removeFile = (index: number) => {
    updateState({ files: files.filter((_, i) => i !== index) });
  };

  const handleConvert = async () => {
    if (files.length === 0) return;
    updateState({ isProcessing: true });
    try {
      const text = await convertMediaToText(files.map(f => ({ mimeType: f.type, data: f.data })));
      updateState({ result: text });
    } catch (e) {
      alert("Conversion failed. Please try again.");
    } finally {
      updateState({ isProcessing: false });
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    alert("Copied to clipboard!");
  };

  const downloadText = () => {
    if (!result) return;
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `any2text-${Date.now()}.txt`;
    link.click();
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon size={16} />;
    if (mimeType.startsWith('video/')) return <FileVideo size={16} />;
    if (mimeType.startsWith('audio/')) return <FileAudio size={16} />;
    return <File size={16} />;
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-800">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white flex items-center gap-2">
          <FileText className="text-purple-600" /> Any2Text
        </h2>

        {/* Upload Section */}
        <div className="mb-8">
           <label className="w-full h-64 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer transition-all text-slate-400 hover:text-purple-500 bg-slate-50 dark:bg-slate-900/50 gap-3">
              <input 
                type="file" 
                className="hidden" 
                onChange={(e) => {
                  if (e.target.files) {
                    handleUpload(Array.from(e.target.files));
                  }
                }} 
                multiple
                accept="image/*,video/*,audio/*,application/pdf,text/*" 
              />
              <Plus size={48} strokeWidth={1.5} />
              <div className="text-center">
                <p className="text-sm font-semibold">Upload Media</p>
                <p className="text-xs opacity-70 mt-1">Drag & drop or click to upload</p>
              </div>
           </label>
          
          {/* File List */}
          {files.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full text-sm text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  <span className="text-purple-500">{getFileIcon(file.type)}</span>
                  <span className="max-w-[150px] truncate" title={file.name}>{file.name}</span>
                  <button onClick={() => removeFile(idx)} className="text-slate-400 hover:text-red-500 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-center mb-8">
          <Button 
            onClick={handleConvert} 
            disabled={files.length === 0 || isProcessing}
            className="w-full md:w-auto min-w-[200px] py-3 text-lg shadow-lg shadow-purple-500/20"
          >
            {isProcessing ? <><Loader2 className="animate-spin" /> Processing...</> : <><Sparkles /> Convert to Text</>}
          </Button>
        </div>

        {/* Result Section */}
        <div className="space-y-2">
          <div className="flex justify-between items-end mb-2">
             <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Result</label>
             <div className="flex gap-2">
                <button 
                  onClick={copyToClipboard}
                  disabled={!result}
                  className="p-2 text-slate-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 disabled:opacity-30 transition-colors"
                  title="Copy Text"
                >
                  <Copy size={20} />
                </button>
                <button 
                  onClick={downloadText}
                  disabled={!result}
                  className="p-2 text-slate-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 disabled:opacity-30 transition-colors"
                  title="Download .txt"
                >
                  <Download size={20} />
                </button>
             </div>
          </div>
          
          <div className="w-full min-h-[300px] p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">
            {result || <span className="text-slate-400 italic">Extracted text will appear here...</span>}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Any2Text;
