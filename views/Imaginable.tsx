import React, { useState } from 'react';
import { Button, fileToBase64, toDataUrl, Modal } from '../components/Shared';
import { GeminiModel, AspectRatio, ImageSize, SavedImage, ImaginableState } from '../types';
import { generateImages, enhancePrompt } from '../services/geminiService';
import { uploadToCloud } from '../services/storageService';
import { Wand2, X, Download, Save, Maximize2, Trash2, ImagePlus, Loader2, Plus, Check, CloudUpload } from 'lucide-react';

interface ImaginableProps {
  state: ImaginableState;
  updateState: (updates: Partial<ImaginableState>) => void;
  onSave: (img: SavedImage) => void;
}

const Imaginable: React.FC<ImaginableProps> = ({ state, updateState, onSave }) => {
  const { prompt, model, aspectRatio, imageSize, refImages, count, generatedResults } = state;
  const [loading, setLoading] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [itemToSave, setItemToSave] = useState<{ id: string; data: string; prompt: string; model: GeminiModel } | null>(null);

  const handleRefUpload = async (files: File[]) => {
    const promises = files.map(f => fileToBase64(f));
    const bases = await Promise.all(promises);
    updateState({ refImages: [...refImages, ...bases] });
  };

  const removeRefImage = (index: number) => {
    updateState({ refImages: refImages.filter((_, i) => i !== index) });
  };

  const handleEnhance = async () => {
    if (!prompt) return;
    setEnhancing(true);
    const newPrompt = await enhancePrompt(prompt);
    updateState({ prompt: newPrompt });
    setEnhancing(false);
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const results: { id: string; data: string; prompt: string; model: GeminiModel }[] = [];
      for (let i = 0; i < count; i++) {
        const imgs = await generateImages(prompt, model, { aspectRatio, imageSize, referenceImages: refImages });
        imgs.forEach(imgData => {
            results.push({
                id: Date.now().toString() + Math.random(),
                data: imgData,
                prompt: prompt,
                model: model
            });
        });
      }
      updateState({ generatedResults: [...generatedResults, ...results] });
    } catch (e) {
      alert("Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const confirmSave = (result: { id: string; data: string; prompt: string; model: GeminiModel }) => {
    if (savedIds.has(result.id) || savingIds.has(result.id)) return;
    setItemToSave(result);
  };

  const executeSave = async () => {
    if (!itemToSave) return;
    const result = itemToSave;
    setItemToSave(null);

    // Set saving state for this specific item
    setSavingIds(prev => {
        const next = new Set(prev);
        next.add(result.id);
        return next;
    });

    try {
        // Upload to cloud
        const cloudUrl = await uploadToCloud(result.data, 'generated');

        onSave({
          id: Date.now().toString() + Math.random(),
          data: result.data,
          prompt: result.prompt,
          timestamp: Date.now(),
          model: result.model,
          type: 'generated',
          cloudUrl: cloudUrl
        });
        
        setSavedIds(prev => {
            const next = new Set(prev);
            next.add(result.id);
            return next;
        });
    } catch (e) {
        console.error("Failed to save to cloud", e);
        alert("Failed to save to cloud storage.");
    } finally {
        setSavingIds(prev => {
            const next = new Set(prev);
            next.delete(result.id);
            return next;
        });
    }
  };

  const handleDownload = (base64: string) => {
    const link = document.createElement('a');
    link.href = toDataUrl(base64);
    link.download = `kimicode-gen-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-6 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Prompt</label>
            <textarea 
              value={prompt}
              onChange={(e) => updateState({ prompt: e.target.value })}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-purple-500 min-h-[100px]"
              placeholder="Describe what you want to imagine..."
            />
            <button 
              onClick={handleEnhance}
              disabled={enhancing || !prompt}
              className="mt-2 text-xs flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium hover:underline disabled:opacity-50"
              type="button"
            >
               <Wand2 size={12} /> {enhancing ? 'Enhancing...' : 'Enhance Prompt'}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Model</label>
            <select 
              value={model} 
              onChange={(e) => updateState({ model: e.target.value as GeminiModel })}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-purple-500"
            >
              <option value={GeminiModel.FLASH_IMAGE}>Nano Banana (Fast)</option>
              <option value={GeminiModel.PRO_IMAGE}>Nano Banana Pro (High Quality)</option>
            </select>
          </div>

          <div className={`grid gap-4 ${model === GeminiModel.PRO_IMAGE ? 'grid-cols-3' : 'grid-cols-2'}`}>
             <div className="col-span-1">
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Ratio</label>
              <select 
                value={aspectRatio} 
                onChange={(e) => updateState({ aspectRatio: e.target.value as AspectRatio })}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="1:1">1:1 Ratio (Square)</option>
                <option value="3:4">3:4 Ratio (Portrait)</option>
                <option value="4:3">4:3 Ratio (Landscape)</option>
                <option value="9:16">9:16 Ratio (Mobile)</option>
                <option value="16:9">16:9 Ratio (Widescreen)</option>
              </select>
            </div>
            {model === GeminiModel.PRO_IMAGE && (
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Size</label>
                <select 
                  value={imageSize} 
                  onChange={(e) => updateState({ imageSize: e.target.value as ImageSize })}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="1K">1K</option>
                  <option value="2K">2K</option>
                  <option value="4K">4K</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Count</label>
              <select 
                value={count} 
                onChange={(e) => updateState({ count: parseInt(e.target.value) })}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-purple-500"
              >
                {[1, 2, 3, 4].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Reference Images</label>
             <div className="flex flex-wrap gap-2">
               {refImages.map((img, idx) => (
                 <div key={idx} className="relative w-12 h-12 rounded-lg overflow-hidden group border border-slate-200 dark:border-slate-700 shadow-sm">
                   <img src={toDataUrl(img)} alt="ref" className="w-full h-full object-cover" />
                   <button onClick={() => removeRefImage(idx)} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" type="button">
                     <X size={14} className="text-white" />
                   </button>
                 </div>
               ))}
               
               <label className="w-12 h-12 flex items-center justify-center rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer transition-all text-slate-400 hover:text-purple-500">
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files) {
                        handleRefUpload(Array.from(e.target.files));
                      }
                    }} 
                    multiple 
                    accept="image/*" 
                  />
                  <Plus size={20} />
               </label>
             </div>
          </div>

          <Button onClick={handleGenerate} disabled={loading} className="w-full py-3 text-lg shadow-lg shadow-purple-500/30" type="button">
            {loading ? <><Loader2 className="animate-spin" /> Generating...</> : <><ImagePlus /> Generate</>}
          </Button>
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
           <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white flex items-center gap-2">
             Results <span className="text-sm font-normal text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">{generatedResults.length}</span>
           </h2>
           
           {generatedResults.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-96 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
               <ImagePlus size={48} className="mb-4 opacity-50" />
               <p>Your imagination awaits</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {generatedResults.map((result) => {
                 const isSaved = savedIds.has(result.id);
                 const isSaving = savingIds.has(result.id);
                 return (
                 <div key={result.id} className="group relative bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
                   <div className="aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img src={toDataUrl(result.data)} alt="Generated" className="w-full h-full object-cover" />
                   </div>
                   
                   <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setViewImage(result.data)} className="p-2 bg-black/60 text-white rounded-full hover:bg-black/80 backdrop-blur-sm" type="button"><Maximize2 size={16}/></button>
                   </div>

                   <div className="p-4 flex justify-between items-center bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => handleDownload(result.data)} className="px-3 py-1.5 text-xs" type="button"><Download size={14}/></Button>
                        <Button 
                           variant={isSaved ? "primary" : "secondary"} 
                           onClick={() => confirmSave(result)} 
                           className={`px-3 py-1.5 text-xs transition-all ${isSaved ? 'bg-green-500 hover:bg-green-600 text-white ring-0' : ''}`} 
                           type="button"
                           disabled={isSaved || isSaving}
                        >
                           {isSaving ? <Loader2 size={14} className="animate-spin" /> : isSaved ? <CloudUpload size={14}/> : <Save size={14}/>}
                        </Button>
                      </div>
                      <button onClick={() => updateState({ generatedResults: generatedResults.filter((r) => r.id !== result.id) })} className="text-slate-400 hover:text-red-500 transition-colors" type="button">
                        <Trash2 size={18} />
                      </button>
                   </div>
                 </div>
               )})}
             </div>
           )}
        </div>
      </div>

      <Modal isOpen={!!viewImage} onClose={() => setViewImage(null)}>
        {viewImage && <img src={toDataUrl(viewImage)} alt="Full View" className="max-w-full max-h-[85vh] rounded-lg shadow-2xl mx-auto" />}
      </Modal>

      <Modal isOpen={!!itemToSave} onClose={() => setItemToSave(null)} maxWidth="max-w-md">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <CloudUpload size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Save to Cloud?</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
                        This will upload your image to the cloud storage to make it accessible across devices.
                    </p>
                </div>
                <div className="flex gap-3 w-full mt-2">
                    <Button variant="secondary" onClick={() => setItemToSave(null)} className="flex-1">Cancel</Button>
                    <Button onClick={executeSave} className="flex-1">Confirm Upload</Button>
                </div>
            </div>
        </div>
      </Modal>
    </div>
  );
};

export default Imaginable;