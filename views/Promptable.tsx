import React, { useState } from 'react';
import { Button, fileToBase64, toDataUrl } from '../components/Shared';
import { analyzeImageForPrompt } from '../services/geminiService';
import { PromptHistory, PromptableState } from '../types';
import { ScanSearch, Video, Image as ImageIcon, Copy, FileText, Loader2, Trash2, History, Plus } from 'lucide-react';

interface PromptableProps {
  state: PromptableState;
  updateState: (updates: Partial<PromptableState>) => void;
}

const Promptable: React.FC<PromptableProps> = ({ state, updateState }) => {
  const { image, history } = state;
  const [loading, setLoading] = useState(false);
  
  const handleUpload = async (files: File[]) => {
    if (files.length > 0) {
      const base64 = await fileToBase64(files[0]);
      updateState({ image: base64 });
    }
  };

  const generatePrompt = async (type: 'image' | 'video') => {
    if (!image) return;
    setLoading(true);
    try {
      const text = await analyzeImageForPrompt(image, type);
      const newItem: PromptHistory = {
        id: Date.now().toString(),
        originalImage: image,
        generatedPrompt: text,
        type,
        timestamp: Date.now()
      };
      updateState({ history: [newItem, ...history] });
    } catch (e) {
      alert("Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const saveAsTxt = (text: string, id: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prompt-${id}.txt`;
    link.click();
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-800 mb-12">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white flex items-center gap-2">
          <ScanSearch className="text-purple-600" /> Image Analysis
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 flex justify-center md:justify-start">
            {!image ? (
               <label className="w-full h-64 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer transition-all text-slate-400 hover:text-purple-500 bg-slate-50 dark:bg-slate-900/50 gap-3">
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files) {
                        handleUpload(Array.from(e.target.files));
                      }
                    }} 
                    accept="image/*" 
                  />
                  <Plus size={48} strokeWidth={1.5} />
                  <div className="text-center">
                    <p className="text-sm font-semibold">Click to upload file</p>
                    <p className="text-xs opacity-70 mt-1">PNG, JPG (MAX. 5MB)</p>
                  </div>
               </label>
            ) : (
               <div className="relative w-full rounded-3xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700 group">
                 <img src={toDataUrl(image)} alt="Analysis Source" className="w-full h-auto block" />
                 <button onClick={() => updateState({ image: null })} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                    <Trash2 size={24} />
                 </button>
               </div>
            )}
          </div>
          
          <div className="md:col-span-2 flex flex-col justify-center gap-4">
             <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <h3 className="font-semibold text-lg mb-2 text-slate-700 dark:text-slate-200">Generate Prompt</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                  Use Gemini Pro Vision to intricately analyze the uploaded image and generate a high-quality prompt for other AI models.
                </p>

                <div className="flex flex-wrap gap-4">
                   <Button onClick={() => generatePrompt('image')} disabled={!image || loading} className="flex-1">
                      {loading ? <Loader2 className="animate-spin"/> : <><ImageIcon size={18} /> Image Prompt</>}
                   </Button>
                   <Button onClick={() => generatePrompt('video')} disabled={!image || loading} variant="secondary" className="flex-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                      {loading ? <Loader2 className="animate-spin"/> : <><Video size={18} /> Video Prompt</>}
                   </Button>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold mb-6 text-slate-800 dark:text-white flex items-center gap-2">
           <History size={20} /> History
        </h3>
        
        <div className="space-y-8">
          {history.length === 0 && (
            <p className="text-center text-slate-400 py-8">No analysis history yet.</p>
          )}
          {history.map(item => (
            <div key={item.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-md border-l-4 border-purple-500 flex flex-col md:flex-row gap-6 animate-fade-in hover:shadow-lg transition-shadow duration-300">
              <div className="w-full md:w-32 h-32 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                 <img src={toDataUrl(item.originalImage)} alt="Thumb" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                 <div className="flex justify-between items-start mb-3">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${item.type === 'image' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300'}`}>
                      {item.type} Prompt
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{new Date(item.timestamp).toLocaleTimeString()} {new Date(item.timestamp).toLocaleDateString()}</span>
                 </div>
                 <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-4 font-mono bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                   {item.generatedPrompt}
                 </p>
                 <div className="flex gap-3">
                   <Button variant="secondary" onClick={() => copyToClipboard(item.generatedPrompt)} className="px-4 py-1.5 text-xs font-medium"><Copy size={14}/> Copy</Button>
                   <Button variant="secondary" onClick={() => saveAsTxt(item.generatedPrompt, item.id)} className="px-4 py-1.5 text-xs font-medium"><FileText size={14}/> Save TXT</Button>
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Promptable;