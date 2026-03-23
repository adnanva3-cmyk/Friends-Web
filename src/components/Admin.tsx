import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trash2, Plus, Save, LogOut, Settings, Package, Phone, Upload, Loader2 } from 'lucide-react';
import { INITIAL_DATA } from '../constants/initialData';
import { db, auth } from '../firebase';
import { doc, getDoc, getDocs, collection, setDoc, writeBatch } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export default function Admin() {
  const [isLocalAdmin, setIsLocalAdmin] = useState(() => {
    return sessionStorage.getItem('admin_session') === 'true';
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'home' | 'slides' | 'products' | 'contact'>('home');

  // Full Data State
  const [allData, setAllData] = useState<any>(INITIAL_DATA);

  // Products State
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    image: '',
    bgImage: '',
    category: '',
    price: ''
  });
  const [productFile, setProductFile] = useState<File | null>(null);
  const [productPreview, setProductPreview] = useState<string>('');
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [bgPreview, setBgPreview] = useState<string>('');

  // Slides State
  const [newSlide, setNewSlide] = useState({
    title: '',
    subtitle: '',
    description: '',
    image: '',
    layout: 'overlay' as 'overlay' | 'split' | 'minimal',
    type: 'general' as 'general' | 'legacy' | 'news' | 'trending',
    shape: 'rectangle' as 'rectangle' | 'square',
    rounded: 'large' as 'none' | 'medium' | 'large' | 'full',
    fit: 'contained' as 'contained' | 'full',
    align: 'center' as 'center' | 'left' | 'right'
  });
  const [slideFile, setSlideFile] = useState<File | null>(null);
  const [slidePreview, setSlidePreview] = useState<string>('');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [heroPreview, setHeroPreview] = useState<string>('');

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  const categories = allData?.products ? Array.from(new Set(allData.products.map((p: any) => p.category).filter(Boolean))) : ['HOLLOW BRICKS', 'INTERLOCK'];
  const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLocalAdmin(true);
        sessionStorage.setItem('admin_session', 'true');
        fetchData();
      } else {
        setIsLocalAdmin(false);
        sessionStorage.removeItem('admin_session');
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchData = async () => {
    try {
      const homeSnap = await getDoc(doc(db, 'settings', 'home'));
      const contactSnap = await getDoc(doc(db, 'settings', 'contact'));
      const productsSnap = await getDocs(collection(db, 'products'));
      const slidesSnap = await getDocs(collection(db, 'slides'));

      const sanitizedData = {
        home: homeSnap.exists() ? homeSnap.data() : INITIAL_DATA.home,
        contact: contactSnap.exists() ? contactSnap.data() : INITIAL_DATA.contact,
        products: productsSnap.empty ? INITIAL_DATA.products : productsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        slides: slidesSnap.empty ? INITIAL_DATA.slides : slidesSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      };
      
      if (sanitizedData.contact && !sanitizedData.contact.branches) {
        sanitizedData.contact.branches = [];
      }

      setAllData(sanitizedData);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data from Firestore:", err);
      setLoading(false);
    }
  };

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in.');
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  const saveData = async (updatedData: any) => {
    try {
      const batch = writeBatch(db);
      
      batch.set(doc(db, 'settings', 'home'), updatedData.home);
      batch.set(doc(db, 'settings', 'contact'), updatedData.contact);
      
      const productsSnap = await getDocs(collection(db, 'products'));
      productsSnap.forEach(doc => batch.delete(doc.ref));
      
      updatedData.products.forEach((p: any) => {
        const docRef = doc(collection(db, 'products'), p.id || Date.now().toString() + Math.random());
        batch.set(docRef, p);
      });
      
      const slidesSnap = await getDocs(collection(db, 'slides'));
      slidesSnap.forEach(doc => batch.delete(doc.ref));
      
      updatedData.slides.forEach((s: any) => {
        const docRef = doc(collection(db, 'slides'), s.id || Date.now().toString() + Math.random());
        batch.set(docRef, s);
      });
      
      await batch.commit();
      setAllData(updatedData);
      return true;
    } catch (err) {
      console.error("Error saving data to Firestore:", err);
    }
    return false;
  };

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const saveHome = async () => {
    setUploading(true);
    try {
      let updatedData = { ...allData };
      
      if (heroFile) {
        const base64Image = await fileToBase64(heroFile);
        updatedData.home.heroImage = base64Image;
      }

      const success = await saveData(updatedData);
      if (success) {
        setHeroFile(null);
        setHeroPreview('');
        showStatus('Home content updated!');
      }
    } catch (err) {
      console.error("Error saving home content:", err);
      showStatus("Failed to save home content.", 'error');
    } finally {
      setUploading(false);
    }
  };

  const saveContact = async () => {
    const success = await saveData(allData);
    if (success) showStatus('Contact info updated!');
  };

  const handleProductFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProductFile(file);
      setProductPreview(URL.createObjectURL(file));
    }
  };

  const handleBgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBgFile(file);
      setBgPreview(URL.createObjectURL(file));
    }
  };

  const handleHeroFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setHeroFile(file);
      setHeroPreview(URL.createObjectURL(file));
    }
  };

  const handleSlideFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSlideFile(file);
      setSlidePreview(URL.createObjectURL(file));
    }
  };

  const addSlide = async () => {
    if (!newSlide.title || (!slideFile && !newSlide.image)) {
      showStatus('Please provide a title and an image.', 'error');
      return;
    }
    
    setUploading(true);
    try {
      let imageUrl = newSlide.image;

      if (slideFile) {
        imageUrl = await fileToBase64(slideFile);
      }

      const updatedSlides = [
        ...(allData.slides || []),
        { ...newSlide, id: Date.now().toString(), image: imageUrl }
      ];

      const success = await saveData({ ...allData, slides: updatedSlides });

      if (success) {
        setNewSlide({ 
          title: '', 
          subtitle: '', 
          description: '', 
          image: '', 
          layout: 'overlay', 
          type: 'general',
          shape: 'rectangle',
          rounded: 'large',
          fit: 'contained',
          align: 'center'
        });
        setSlideFile(null);
        setSlidePreview('');
        showStatus('Slide added successfully!');
      }
    } catch (err: any) {
      console.error("Error adding slide:", err);
      showStatus(`Error: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  const deleteSlide = async (id: string) => {
    if (deletingId === id) {
      const updatedSlides = (allData.slides || []).filter((s: any) => s.id !== id);
      const success = await saveData({ ...allData, slides: updatedSlides });
      if (success) {
        setDeletingId(null);
        showStatus('Slide deleted');
      }
    } else {
      setDeletingId(id);
      setTimeout(() => setDeletingId(prev => prev === id ? null : prev), 3000);
    }
  };

  const addProduct = async () => {
    if (!newProduct.name || (!productFile && !newProduct.image)) {
      showStatus('Please provide a name and a product photo.', 'error');
      return;
    }
    
    setUploading(true);
    try {
      let imageUrl = newProduct.image;
      let bgImageUrl = newProduct.bgImage;

      // Upload Product Photo
      if (productFile) {
        imageUrl = await fileToBase64(productFile);
      }

      // Upload Background Image
      if (bgFile) {
        bgImageUrl = await fileToBase64(bgFile);
      }

      const updatedProducts = [
        ...allData.products,
        { ...newProduct, id: Date.now().toString(), image: imageUrl, bgImage: bgImageUrl }
      ];

      const success = await saveData({ ...allData, products: updatedProducts });

      if (success) {
        setNewProduct({ name: '', description: '', image: '', bgImage: '', category: '', price: '' });
        setProductFile(null);
        setProductPreview('');
        setBgFile(null);
        setBgPreview('');
        showStatus('Product added successfully!');
      }
    } catch (err: any) {
      console.error("Error adding product:", err);
      showStatus(`Error: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (deletingId === id) {
      const updatedProducts = (allData.products || []).filter((p: any) => p.id !== id);
      const success = await saveData({ ...allData, products: updatedProducts });
      if (success) {
        setDeletingId(null);
        showStatus('Product deleted');
      }
    } else {
      setDeletingId(id);
      // Reset after 3 seconds if not confirmed
      setTimeout(() => setDeletingId(prev => prev === id ? null : prev), 3000);
    }
  };

  if (loading && isLocalAdmin) return <div className="p-20 text-center">Loading...</div>;

  if (!isLocalAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm text-center">
          <h2 className="text-2xl font-bold mb-6">Admin Access</h2>
          <p className="text-neutral-500 mb-8">Sign in with your Google account to manage the website content.</p>
          
          {error && <p className="text-red-600 text-sm font-bold mb-4">{error}</p>}
          
          <button 
            onClick={login}
            className="w-full flex items-center justify-center gap-3 bg-white border border-neutral-200 text-neutral-700 py-4 rounded-xl font-bold hover:bg-neutral-50 transition-all shadow-sm"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
              <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
              </g>
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold">Admin Dashboard</h1>
          <p className="text-neutral-500">Manage your website content</p>
        </div>
        <button 
          onClick={logout}
          className="flex items-center gap-2 text-neutral-500 hover:text-red-600 font-bold transition-colors"
        >
          <LogOut size={20} /> Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
        <button 
          onClick={() => setActiveSubTab('home')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeSubTab === 'home' ? 'bg-red-700 text-white' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'}`}
        >
          <Settings size={18} /> Home Page
        </button>
        <button 
          onClick={() => setActiveSubTab('slides')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeSubTab === 'slides' ? 'bg-red-700 text-white' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'}`}
        >
          <Plus size={18} /> Home Slides
        </button>
        <button 
          onClick={() => setActiveSubTab('products')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeSubTab === 'products' ? 'bg-red-700 text-white' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'}`}
        >
          <Package size={18} /> Products
        </button>
        <button 
          onClick={() => setActiveSubTab('contact')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeSubTab === 'contact' ? 'bg-red-700 text-white' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'}`}
        >
          <Phone size={18} /> Contact Info
        </button>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`fixed bottom-8 right-8 px-6 py-3 rounded-xl font-bold text-white shadow-lg z-50 ${statusMessage.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}
        >
          {statusMessage.text}
        </motion.div>
      )}

      {/* Content */}
      <div className="bg-white border border-neutral-100 rounded-3xl p-8 shadow-sm">
        {!allData && !loading && (
          <div className="text-center py-12 text-neutral-500">
            <p className="font-bold text-lg mb-2">Failed to load data</p>
            <p>Please check your connection or try refreshing the page.</p>
            <button 
              onClick={fetchData}
              className="mt-4 px-6 py-2 bg-red-700 text-white rounded-lg font-bold hover:bg-red-800 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {activeSubTab === 'home' && allData && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold mb-4">Hero Section</h3>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-bold text-neutral-500 mb-2 uppercase tracking-wider">Hero Title</label>
                <input 
                  type="text" 
                  value={allData.home.heroTitle}
                  onChange={e => setAllData({...allData, home: {...allData.home, heroTitle: e.target.value}})}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-neutral-500 mb-2 uppercase tracking-wider">Hero Subtitle</label>
                <textarea 
                  value={allData.home.heroSubtitle}
                  onChange={e => setAllData({...allData, home: {...allData.home, heroSubtitle: e.target.value}})}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none h-32"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-neutral-500 mb-2 uppercase tracking-wider">Hero Image Vertical Gradient Strength (Fading to Bottom)</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="5"
                    value={allData.home.heroGradientStrength ?? 60}
                    onChange={e => setAllData({...allData, home: {...allData.home, heroGradientStrength: parseInt(e.target.value)}})}
                    className="flex-1 h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-red-700"
                  />
                  <span className="text-sm font-bold text-neutral-700 w-12">{allData.home.heroGradientStrength ?? 60}%</span>
                </div>
                <p className="text-[10px] text-neutral-400 mt-1">Controls how much the image fades out towards the bottom. 0% is no fade, 100% is a deep fade.</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-neutral-500 mb-2 uppercase tracking-wider">Hero Image</label>
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="flex-1 w-full">
                    <label className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 outline-none cursor-pointer hover:bg-neutral-100 transition-colors">
                      <Upload size={18} className="text-neutral-400" />
                      <span className="text-neutral-500 truncate">
                        {heroFile ? heroFile.name : 'Upload New Hero Image'}
                      </span>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleHeroFileChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[10px] text-neutral-400 mt-2 italic">Current URL: {allData.home.heroImage}</p>
                    
                    <div className="mt-6">
                      <label className="block text-sm font-bold text-neutral-500 mb-2 uppercase tracking-wider">Hero Image Opacity (Fading)</label>
                      <div className="flex items-center gap-4">
                        <input 
                          type="range" 
                          min="0" 
                          max="1" 
                          step="0.05"
                          value={allData.home.heroOpacity ?? 0.4}
                          onChange={e => setAllData({...allData, home: {...allData.home, heroOpacity: parseFloat(e.target.value)}})}
                          className="flex-1 h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-red-700"
                        />
                        <span className="text-sm font-bold text-neutral-700 w-12">{Math.round((allData.home.heroOpacity ?? 0.4) * 100)}%</span>
                      </div>
                      <p className="text-[10px] text-neutral-400 mt-1">Controls how much the background image is visible. 0% is hidden, 100% is fully visible.</p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase mb-2">Preview</p>
                    <div className="relative w-40 h-24 rounded-xl overflow-hidden border border-neutral-200 shadow-sm bg-white">
                      <img 
                        src={heroPreview || allData.home.heroImage} 
                        style={{ opacity: allData.home.heroOpacity ?? 0.4 }}
                        className="w-full h-full object-cover" 
                        alt="Hero Preview" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <button 
              onClick={saveHome}
              disabled={uploading}
              className="flex items-center gap-2 bg-red-700 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-800 transition-all disabled:opacity-50"
            >
              {uploading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {uploading ? 'Saving...' : 'Save Home Content'}
            </button>
          </div>
        )}

        {activeSubTab === 'slides' && allData && (
          <div className="space-y-8">
            <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100">
              <h3 className="text-xl font-bold mb-4">Add New Home Slide</h3>
              <p className="text-xs text-neutral-400 mb-4 uppercase font-bold tracking-widest">These slides appear as the main 3D scrolling gallery on the home page.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input 
                  placeholder="Slide Title (e.g. Our Legacy)"
                  value={newSlide.title}
                  onChange={e => setNewSlide({...newSlide, title: e.target.value})}
                  className="bg-white border border-neutral-200 rounded-xl px-4 py-3 outline-none"
                />
                <input 
                  placeholder="Slide Subtitle (e.g. Since 1995)"
                  value={newSlide.subtitle}
                  onChange={e => setNewSlide({...newSlide, subtitle: e.target.value})}
                  className="bg-white border border-neutral-200 rounded-xl px-4 py-3 outline-none"
                />
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 bg-white border border-neutral-200 rounded-xl px-4 py-3 outline-none cursor-pointer hover:bg-neutral-50 transition-colors">
                    <Upload size={18} className="text-neutral-400" />
                    <span className="text-neutral-500 truncate">
                      {slideFile ? slideFile.name : 'Upload Slide Image'}
                    </span>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleSlideFileChange}
                      className="hidden"
                    />
                  </label>
                  {slidePreview && (
                    <img src={slidePreview} className="w-20 h-20 object-cover rounded-lg border border-neutral-200" alt="Preview" />
                  )}
                </div>
                <textarea 
                  placeholder="Slide Description"
                  value={newSlide.description}
                  onChange={e => setNewSlide({...newSlide, description: e.target.value})}
                  className="md:col-span-2 bg-white border border-neutral-200 rounded-xl px-4 py-3 outline-none h-24"
                />
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Slide Layout</label>
                  <select 
                    value={newSlide.layout}
                    onChange={e => setNewSlide({...newSlide, layout: e.target.value as any})}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 outline-none"
                  >
                    <option value="overlay">Image Overlay (Classic)</option>
                    <option value="split">Split Layout (Side-by-Side)</option>
                    <option value="minimal">Minimal (Text Focused)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Slide Type</label>
                  <select 
                    value={newSlide.type}
                    onChange={e => setNewSlide({...newSlide, type: e.target.value as any})}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 outline-none"
                  >
                    <option value="general">General</option>
                    <option value="legacy">Legacy / History</option>
                    <option value="news">Latest News</option>
                    <option value="trending">Trending</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Shape</label>
                  <select 
                    value={newSlide.shape}
                    onChange={e => setNewSlide({...newSlide, shape: e.target.value as any})}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 outline-none"
                  >
                    <option value="rectangle">Rectangle (16:9)</option>
                    <option value="square">Square (1:1)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Corners</label>
                  <select 
                    value={newSlide.rounded}
                    onChange={e => setNewSlide({...newSlide, rounded: e.target.value as any})}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 outline-none"
                  >
                    <option value="none">Sharp (None)</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large (Default)</option>
                    <option value="full">Extra Large</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Page Fit</label>
                  <select 
                    value={newSlide.fit}
                    onChange={e => setNewSlide({...newSlide, fit: e.target.value as any})}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 outline-none"
                  >
                    <option value="contained">Contained (Floating)</option>
                    <option value="full">Full Width (Fit Page)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Alignment</label>
                  <select 
                    value={newSlide.align}
                    onChange={e => setNewSlide({...newSlide, align: e.target.value as any})}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 outline-none"
                  >
                    <option value="center">Center</option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                  </select>
                </div>
              </div>
              <button 
                onClick={addSlide}
                disabled={uploading}
                className="flex items-center gap-2 bg-red-700 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                {uploading ? 'Uploading...' : 'Add Slide'}
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold">Current Slides</h3>
              <div className="grid grid-cols-1 gap-4">
                {(allData.slides || []).map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between p-4 bg-white border border-neutral-100 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <img src={s.image} className="w-16 h-16 object-cover rounded-lg" alt="" />
                      <div>
                        <h4 className="font-bold">{s.title}</h4>
                        <div className="flex gap-2 mt-1">
                          <span className="text-[10px] bg-neutral-100 px-2 py-0.5 rounded uppercase font-bold text-neutral-500">{s.type}</span>
                          <span className="text-[10px] bg-neutral-100 px-2 py-0.5 rounded uppercase font-bold text-neutral-500">{s.layout}</span>
                          <span className="text-[10px] bg-neutral-100 px-2 py-0.5 rounded uppercase font-bold text-neutral-500">{s.shape}</span>
                          <span className="text-[10px] bg-neutral-100 px-2 py-0.5 rounded uppercase font-bold text-neutral-500">{s.align}</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteSlide(s.id)}
                      className={`flex items-center gap-2 transition-all px-4 py-2 rounded-xl font-bold ${deletingId === s.id ? 'bg-red-600 text-white' : 'text-neutral-300 hover:text-red-600'}`}
                    >
                      {deletingId === s.id ? (
                        <>Confirm Delete?</>
                      ) : (
                        <Trash2 size={20} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'products' && allData && (
          <div className="space-y-8">
            <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100">
              <h3 className="text-xl font-bold mb-4">Add New Product</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input 
                  placeholder="Product Name"
                  value={newProduct.name}
                  onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                  className="bg-white border border-neutral-200 rounded-xl px-4 py-3 outline-none"
                />
                <div className="flex flex-col gap-2">
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">1. Product Photo (Bottom Right)</label>
                  <label className="flex items-center gap-2 bg-white border border-neutral-200 rounded-xl px-4 py-3 outline-none cursor-pointer hover:bg-neutral-50 transition-colors">
                    <Upload size={18} className="text-neutral-400" />
                    <span className="text-neutral-500 truncate">
                      {productFile ? productFile.name : 'Upload Product Photo'}
                    </span>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleProductFileChange}
                      className="hidden"
                    />
                  </label>
                  {productPreview && (
                    <img src={productPreview} className="w-20 h-20 object-cover rounded-lg border border-neutral-200" alt="Preview" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">2. Background Image</label>
                  <label className="flex items-center gap-2 bg-white border border-neutral-200 rounded-xl px-4 py-3 outline-none cursor-pointer hover:bg-neutral-50 transition-colors">
                    <Upload size={18} className="text-neutral-400" />
                    <span className="text-neutral-500 truncate">
                      {bgFile ? bgFile.name : 'Upload Background Image'}
                    </span>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleBgFileChange}
                      className="hidden"
                    />
                  </label>
                  {bgPreview && (
                    <img src={bgPreview} className="w-20 h-20 object-cover rounded-lg border border-neutral-200" alt="Preview" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">Category</label>
                  <div className="flex gap-2">
                    {!showNewCategoryInput ? (
                      <select 
                        value={newProduct.category}
                        onChange={e => {
                          if (e.target.value === 'ADD_NEW') {
                            setShowNewCategoryInput(true);
                          } else {
                            setNewProduct({...newProduct, category: e.target.value});
                          }
                        }}
                        className="flex-1 bg-white border border-neutral-200 rounded-xl px-4 py-3 outline-none"
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat as string} value={cat as string}>{cat as string}</option>
                        ))}
                        <option value="ADD_NEW">+ Add New Category</option>
                      </select>
                    ) : (
                      <div className="flex-1 flex gap-2">
                        <input 
                          placeholder="New Category Name"
                          value={customCategory}
                          onChange={e => setCustomCategory(e.target.value)}
                          className="flex-1 bg-white border border-neutral-200 rounded-xl px-4 py-3 outline-none"
                        />
                        <button 
                          onClick={() => {
                            if (customCategory.trim()) {
                              setNewProduct({...newProduct, category: customCategory.trim().toUpperCase()});
                              setShowNewCategoryInput(false);
                              setCustomCategory('');
                            }
                          }}
                          className="bg-neutral-900 text-white px-4 rounded-xl font-bold"
                        >
                          Add
                        </button>
                        <button 
                          onClick={() => setShowNewCategoryInput(false)}
                          className="bg-neutral-100 text-neutral-500 px-4 rounded-xl font-bold"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <input 
                  placeholder="Price (optional)"
                  value={newProduct.price}
                  onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                  className="bg-white border border-neutral-200 rounded-xl px-4 py-3 outline-none"
                />
                <textarea 
                  placeholder="Description"
                  value={newProduct.description}
                  onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                  className="md:col-span-2 bg-white border border-neutral-200 rounded-xl px-4 py-3 outline-none h-24"
                />
              </div>
              <button 
                onClick={addProduct}
                disabled={uploading}
                className="flex items-center gap-2 bg-red-700 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                {uploading ? 'Uploading...' : 'Add Product'}
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold">Current Products</h3>
              <div className="grid grid-cols-1 gap-4">
                {(allData.products || []).map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-4 bg-white border border-neutral-100 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <img src={p.image} className="w-16 h-16 object-cover rounded-lg" alt="" />
                      <div>
                        <h4 className="font-bold">{p.name}</h4>
                        <p className="text-xs text-neutral-500">{p.category}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteProduct(p.id)}
                      className={`flex items-center gap-2 transition-all px-4 py-2 rounded-xl font-bold ${deletingId === p.id ? 'bg-red-600 text-white' : 'text-neutral-300 hover:text-red-600'}`}
                    >
                      {deletingId === p.id ? (
                        <>Confirm Delete?</>
                      ) : (
                        <Trash2 size={20} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'contact' && allData && (
          <div className="space-y-8">
            <h3 className="text-xl font-bold mb-4">Contact Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-neutral-500 mb-2 uppercase tracking-wider">Primary Phone Number</label>
                <input 
                  type="text" 
                  value={allData.contact.phone}
                  onChange={e => setAllData({...allData, contact: {...allData.contact, phone: e.target.value}})}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-neutral-500 mb-2 uppercase tracking-wider">Secondary Phone Number</label>
                <input 
                  type="text" 
                  value={allData.contact.secondaryPhone || ''}
                  onChange={e => setAllData({...allData, contact: {...allData.contact, secondaryPhone: e.target.value}})}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-neutral-500 mb-2 uppercase tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  value={allData.contact.email}
                  onChange={e => setAllData({...allData, contact: {...allData.contact, email: e.target.value}})}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-neutral-500 mb-2 uppercase tracking-wider">WhatsApp Number</label>
                <input 
                  type="text" 
                  value={allData.contact.whatsapp}
                  onChange={e => setAllData({...allData, contact: {...allData.contact, whatsapp: e.target.value}})}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-lg">Branches & Locations</h4>
                <button 
                  onClick={() => {
                    const branches = [...(allData.contact.branches || [])];
                    branches.push({ name: 'New Branch', address: '', mapEmbed: '', mapLink: '' });
                    setAllData({...allData, contact: {...allData.contact, branches}});
                  }}
                  className="bg-neutral-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-neutral-800 transition-all"
                >
                  + Add Branch
                </button>
              </div>
              
              <div className="space-y-6">
                {(allData.contact.branches || []).map((branch: any, idx: number) => (
                  <div key={idx} className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100 relative group">
                    <button 
                      onClick={() => {
                        const branches = (allData.contact.branches || []).filter((_: any, i: number) => i !== idx);
                        setAllData({...allData, contact: {...allData.contact, branches}});
                      }}
                      className="absolute top-4 right-4 text-neutral-300 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Branch Name</label>
                        <input 
                          type="text" 
                          value={branch.name}
                          onChange={e => {
                            const branches = [...(allData.contact.branches || [])];
                            branches[idx].name = e.target.value;
                            setAllData({...allData, contact: {...allData.contact, branches}});
                          }}
                          className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Address</label>
                        <textarea 
                          value={branch.address}
                          onChange={e => {
                            const branches = [...(allData.contact.branches || [])];
                            branches[idx].address = e.target.value;
                            setAllData({...allData, contact: {...allData.contact, branches}});
                          }}
                          className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none h-20 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Google Maps Embed URL (src only)</label>
                        <textarea 
                          value={branch.mapEmbed}
                          onChange={e => {
                            const branches = [...(allData.contact.branches || [])];
                            branches[idx].mapEmbed = e.target.value;
                            setAllData({...allData, contact: {...allData.contact, branches}});
                          }}
                          placeholder="https://www.google.com/maps/embed?pb=..."
                          className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none h-20 text-xs font-mono"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Google Maps Direct Link (for navigation)</label>
                        <input 
                          type="text" 
                          value={branch.mapLink || ''}
                          onChange={e => {
                            const branches = [...(allData.contact.branches || [])];
                            branches[idx].mapLink = e.target.value;
                            setAllData({...allData, contact: {...allData.contact, branches}});
                          }}
                          placeholder="https://maps.google.com/..."
                          className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={saveContact}
              className="flex items-center gap-2 bg-red-700 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-800 transition-all"
            >
              <Save size={18} /> Save Contact Info
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
