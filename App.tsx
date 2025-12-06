import React, { useState, useEffect } from 'react';
import { SavedImage, AppView, ImaginableState, EditableState, PromptableState, GeminiModel } from './types';
import Imaginable from './views/Imaginable';
import Editable from './views/Editable';
import Promptable from './views/Promptable';
import Collectable from './views/Collectable';
import { Sparkles, Image, Pencil, Scan, LayoutGrid, Sun, Moon, Menu, X } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.IMAGINABLE);
  const [savedImages, setSavedImages] = useState<SavedImage[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Persistent State for Views
  const [imaginableState, setImaginableState] = useState<ImaginableState>({
    prompt: '',
    model: GeminiModel.FLASH_IMAGE,
    aspectRatio: '1:1',
    imageSize: '1K',
    refImages: [],
    count: 1,
    generatedResults: []
  });

  const [editableState, setEditableState] = useState<EditableState>({
    sourceImage: null,
    prompt: '',
    resultImage: null
  });

  const [promptableState, setPromptableState] = useState<PromptableState>({
    image: null,
    history: []
  });

  const updateImaginable = (updates: Partial<ImaginableState>) => 
    setImaginableState(prev => ({ ...prev, ...updates }));

  const updateEditable = (updates: Partial<EditableState>) => 
    setEditableState(prev => ({ ...prev, ...updates }));

  const updatePromptable = (updates: Partial<PromptableState>) => 
    setPromptableState(prev => ({ ...prev, ...updates }));

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('kimicode_collection');
    if (saved) {
      try {
        setSavedImages(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history");
      }
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    try {
      localStorage.setItem('kimicode_collection', JSON.stringify(savedImages));
    } catch (e) {
      console.error("Failed to save to local storage (likely quota exceeded)", e);
    }
  }, [savedImages]);

  // Handle Theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const addToCollection = (img: SavedImage) => {
    setSavedImages(prev => [img, ...prev]);
  };

  const removeFromCollection = (id: string) => {
    setSavedImages(prev => prev.filter(img => img.id !== id));
  };

  const navItems = [
    { id: AppView.IMAGINABLE, label: 'Imaginable', icon: Image },
    { id: AppView.EDITABLE, label: 'Editable', icon: Pencil },
    { id: AppView.PROMPTABLE, label: 'Promptable', icon: Scan },
    { id: AppView.COLLECTABLE, label: 'Collectable', icon: LayoutGrid },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-violet-600 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Sparkles className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-purple-400">KIMICODE V2</h1>
                <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">Creative Intelligence</p>
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    currentView === item.id 
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 shadow-sm' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <item.icon size={16} />
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={toggleTheme}
                className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-purple-500 transition-colors"
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>
              
              <button 
                className="md:hidden p-2 text-slate-600 dark:text-slate-300"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 pt-2 pb-6 space-y-1">
             {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full px-4 py-4 rounded-xl text-base font-medium transition-all ${
                    currentView === item.id 
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300' 
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <item.icon size={20} />
                  {item.label}
                </button>
              ))}
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 min-h-screen">
        <div className="animate-fade-in-up">
           {currentView === AppView.IMAGINABLE && (
             <Imaginable 
               state={imaginableState} 
               updateState={updateImaginable} 
               onSave={addToCollection} 
             />
           )}
           {currentView === AppView.EDITABLE && (
             <Editable 
               state={editableState}
               updateState={updateEditable}
               onSave={addToCollection} 
             />
           )}
           {currentView === AppView.PROMPTABLE && (
             <Promptable 
               state={promptableState}
               updateState={updatePromptable}
             />
           )}
           {currentView === AppView.COLLECTABLE && (
             <Collectable images={savedImages} onRemove={removeFromCollection} />
           )}
        </div>
      </main>

    </div>
  );
};

export default App;