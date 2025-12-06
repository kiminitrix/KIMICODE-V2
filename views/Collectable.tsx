import React, { useState } from 'react';
import { SavedImage } from '../types';
import { toDataUrl, Modal, Button } from '../components/Shared';
import { Trash2, Download, Maximize2, LayoutGrid, X, Calendar, Cpu, Tag } from 'lucide-react';

interface CollectableProps {
  images: SavedImage[];
  onRemove: (id: string) => void;
}

const Collectable: React.FC<CollectableProps> = ({ images, onRemove }) => {
  const [viewImage, setViewImage] = useState<SavedImage | null>(null);

  const handleDownload = (img: SavedImage) => {
    const link = document.createElement('a');
    link.href = toDataUrl(img.data);
    link.download = `kimicode-saved-${img.timestamp}.png`;
    link.click();
  };

  return (
    <div className="pb-20">
      <h2 className="text-3xl font-bold mb-8 text-slate-800 dark:text-white flex items-center gap-3">
        <LayoutGrid className="text-purple-600" /> Collectable
        <span className="text-sm font-normal text-slate-500 bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded-full">{images.length} items</span>
      </h2>

      {images.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
           <p className="text-slate-400 text-lg">Your collection is empty.</p>
           <p className="text-slate-500 text-sm mt-2">Generate or edit images to save them here.</p>
        </div>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {images.map(img => (
            <div key={img.id} className="break-inside-avoid relative group rounded-2xl overflow-hidden bg-slate-900 shadow-lg hover:shadow-2xl transition-all duration-300">
               <img src={toDataUrl(img.data)} alt="Saved" className="w-full" />
               
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  <p className="text-white text-xs line-clamp-2 mb-3 opacity-90">{img.prompt}</p>
                  <div className="flex gap-2 justify-end">
                     <button onClick={() => setViewImage(img)} className="p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition-colors">
                        <Maximize2 size={16} />
                     </button>
                     <button onClick={() => handleDownload(img)} className="p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition-colors">
                        <Download size={16} />
                     </button>
                     <button onClick={() => onRemove(img.id)} className="p-2 bg-red-500/50 hover:bg-red-500 backdrop-blur-md rounded-full text-white transition-colors">
                        <Trash2 size={16} />
                     </button>
                  </div>
               </div>
               
               <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-sm rounded text-[10px] font-bold text-white uppercase">
                 {img.type}
               </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!viewImage} onClose={() => setViewImage(null)}>
        {viewImage && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden flex flex-col md:flex-row h-[80vh] w-full shadow-2xl">
            {/* Image Container */}
            <div className="flex-1 bg-slate-100 dark:bg-slate-950/50 flex items-center justify-center p-4 md:p-8 overflow-hidden relative group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                <img 
                  src={toDataUrl(viewImage.data)} 
                  alt="View" 
                  className="max-w-full max-h-full object-contain shadow-lg rounded-lg" 
                />
            </div>

            {/* Sidebar / Info Panel */}
            <div className="w-full md:w-[400px] bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800 flex flex-col relative z-10">
                {/* Header with Close */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white">Image Details</h3>
                  <button 
                     onClick={() => setViewImage(null)}
                     className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 hover:text-red-500"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                   {/* Prompt */}
                   <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Prompt</label>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-sm text-slate-700 dark:text-slate-300 leading-relaxed border border-slate-100 dark:border-slate-800">
                         {viewImage.prompt}
                      </div>
                   </div>

                   {/* Metadata */}
                   <div className="space-y-4">
                       <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                          <Cpu size={16} className="text-purple-500" />
                          <span className="font-medium">{viewImage.model}</span>
                       </div>
                       <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                          <Calendar size={16} className="text-purple-500" />
                          <span className="font-medium">{new Date(viewImage.timestamp).toLocaleDateString()} {new Date(viewImage.timestamp).toLocaleTimeString()}</span>
                       </div>
                       <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                          <Tag size={16} className="text-purple-500" />
                          <span className="capitalize font-medium">{viewImage.type}</span>
                       </div>
                   </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                   <Button onClick={() => handleDownload(viewImage)} className="w-full justify-center">
                      <Download size={18} /> Download Original
                   </Button>
                </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Collectable;