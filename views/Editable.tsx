
import React, { useState, useEffect } from 'react';
import { Button, fileToBase64, toDataUrl, Modal } from '../components/Shared';
import { editImage } from '../services/geminiService';
import { uploadToCloud } from '../services/storageService';
import { SavedImage, EditableState } from '../types';
import { Wand2, Download, Save, Maximize2, Trash2, Loader2, ArrowRight, Plus, CloudUpload, Check } from 'lucide-react';

interface EditableProps {
  state: EditableState;
  updateState: (updates: Partial<EditableState>) => void;
  onSave: (img: SavedImage) => void;
}

const Editable: React.FC<EditableProps> = ({ state, updateState, onSave }) => {
  const { sourceImage, prompt, resultImage } = state;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  // Reset saved state when a new result is generated
  useEffect(() => {
    setIsSaved(false);
  }, [resultImage]);

  const handleUpload = async (files: File[]) => {
    if (files.length > 0) {
      const base64 = await fileToBase64(files[0]);
      updateState({ sourceImage: base64, resultImage: null });
    }
  };

  const handleEdit = async () => {
    if (!sourceImage || !prompt) return;
    setLoading(true);
    try {
      const results = await editImage(sourceImage, prompt);
      if (results.length > 0) {
        updateState({ resultImage: results[0] });
      }
    } catch (e) {
      alert("Editing failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClick = () => {
    if (!resultImage || isSaved) return;
    setShowSaveConfirm(true);
  };

  const executeSave = async () => {
    if (!resultImage) return;
    setShowSaveConfirm(false);
    
    setSaving(true);
    try {
        const cloudUrl = await uploadToCloud(resultImage, 'edited');
        
        onSave({
          id: Date.now().toString(),
          data: resultImage,
          prompt: `Edit: ${prompt}`,
          timestamp: Date.now(),
          model: 'gemini-2.5-flash-image',
          type: 'edited',
          cloudUrl: cloudUrl
        });
        
        setIsSaved(true);
    } catch (e) {
        alert("Failed to save to cloud.");
    } finally {
        setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Source */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">Original Image</h3>
          {!sourceImage ? (
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
            <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800">
               <img src={toDataUrl(sourceImage)} alt="Original" className="w-full object-cover" />
               <button onClick={() => updateState({ sourceImage: null })} className="absolute top-2 right-2 p-2 bg-red-500/80 text-white rounded-full hover:bg-red-600 transition-colors">
                 <Trash2 size={16} />
               </button>
            </div>
          )}
          
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800">
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Editing Instruction</label>
            <div className="flex gap-2">
              <input 
                type="text"
                value={prompt}
                onChange={e => updateState({ prompt: e.target.value })}
                placeholder="e.g. 'Add a retro filter' or 'Remove the cat'"
                className="flex-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-purple-500"
              />
              <Button onClick={handleEdit} disabled={loading || !sourceImage || !prompt}>
                {loading ? <Loader2 className="animate-spin" /> : <Wand2 />}
              </Button>
            </div>
          </div>
        </div>

        {/* Result */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">Edited Result</h3>
          <div className="min-h-[300px] flex items-center justify-center bg-slate-100 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
             {loading ? (
               <div className="text-purple-600 flex flex-col items-center">
                 <Loader2 className="animate-spin w-10 h-10 mb-2" />
                 <p className="animate-pulse">Gemini is editing...</p>
               </div>
             ) : resultImage ? (
               <div className="relative w-full group">
                 <img src={toDataUrl(resultImage)} alt="Result" className="w-full rounded-2xl shadow-lg" />
                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center gap-4 backdrop-blur-sm">
                    <Button onClick={() => setViewImage(resultImage)} variant="secondary" className="bg-white/90 dark:bg-black/80"><Maximize2 size={20}/></Button>
                    <Button 
                        onClick={handleSaveClick} 
                        variant={isSaved ? "primary" : "primary"} 
                        disabled={saving || isSaved}
                        className={isSaved ? "bg-green-500 hover:bg-green-600 text-white border-none" : ""}
                    >
                       {saving ? <Loader2 className="animate-spin" /> : isSaved ? <CloudUpload size={20}/> : <Save size={20}/>}
                    </Button>
                 </div>
               </div>
             ) : (
               <div className="text-slate-400 text-center p-8">
                 <ArrowRight className="w-10 h-10 mx-auto mb-2 opacity-50" />
                 <p>Result will appear here</p>
               </div>
             )}
          </div>
          {resultImage && (
             <Button 
                onClick={() => {
                   const link = document.createElement('a');
                   link.href = toDataUrl(resultImage);
                   link.download = `kimicode-edit-${Date.now()}.png`;
                   link.click();
                }}
                variant="secondary"
                className="w-full"
             >
                <Download size={18} /> Download
             </Button>
          )}
        </div>
      </div>

       <Modal isOpen={!!viewImage} onClose={() => setViewImage(null)}>
        {viewImage && <img src={toDataUrl(viewImage)} alt="Full View" className="max-w-full max-h-[85vh] rounded-lg shadow-2xl mx-auto" />}
      </Modal>

      <Modal isOpen={showSaveConfirm} onClose={() => setShowSaveConfirm(false)} maxWidth="max-w-md">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <CloudUpload size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Save to Cloud?</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
                        This will upload your edited image to the cloud storage.
                    </p>
                </div>
                <div className="flex gap-3 w-full mt-2">
                    <Button variant="secondary" onClick={() => setShowSaveConfirm(false)} className="flex-1">Cancel</Button>
                    <Button onClick={executeSave} className="flex-1">Confirm Cloud Upload</Button>
                </div>
            </div>
        </div>
      </Modal>
    </div>
  );
};

export default Editable;
