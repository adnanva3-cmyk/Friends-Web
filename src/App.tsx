/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone } from 'lucide-react';
import Home from './components/Home';
import Products from './components/Products';
import Contact from './components/Contact';
import Admin from './components/Admin';

type Tab = 'Home' | 'Products' | 'Contacts Us' | 'Admin';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('Home');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [contactData, setContactData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/data')
      .then(res => {
        if (!res.ok) throw new Error('Server returned ' + res.status);
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Response is not JSON");
        }
        return res.json();
      })
      .then(data => {
        if (data.contact) {
          setContactData(data.contact);
        }
      })
      .catch(err => console.error("Error fetching contact data:", err));
  }, []);

  const handleHiddenLogin = () => {
    setClickCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 5) {
        setIsAdminMode(true);
        setActiveTab('Admin');
        return 0;
      }
      return newCount;
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header / Navigation Section */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-6 py-3">
          {/* Top Row: Logo and Shortcuts */}
          <div className="flex justify-between items-start mb-4">
            {/* Logo - Top Left */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="cursor-pointer text-left inline-flex flex-col"
              onClick={() => setActiveTab('Home')}
            >
              <h1 className="font-display font-black text-5xl md:text-7xl leading-[0.8] flex justify-center gap-1 md:gap-2 w-full">
                <span className="text-[#8B0000]">F</span>
                <span className="text-[#8B0000]">R</span>
                <span className="text-[#8B0000]">I</span>
                <span className="text-[#8B0000]">E</span>
                <span className="text-[#8B0000]">N</span>
                <span className="text-[#8B0000]">D</span>
                <span className="text-black">S</span>
              </h1>
              <div className="mt-1 bg-black text-white px-4 py-1.5 text-[11px] md:text-[14px] font-black uppercase tracking-[0.3em] text-center whitespace-nowrap">
                HOLLOW BRICKS & INTERLOCKS
              </div>
            </motion.div>

            {/* Shortcuts - Top Right */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col items-end gap-2"
            >
              {contactData && (
                <>
                  {/* Phone Shortcut */}
                  <a 
                    href={`tel:${contactData.phone}`}
                    className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-full transition-all border border-red-100 group shadow-sm"
                  >
                    <div className="bg-red-700 text-white p-1.5 rounded-full group-hover:scale-110 transition-transform">
                      <Phone size={14} fill="currentColor" />
                    </div>
                    <span className="text-xs md:text-sm font-black tracking-tight">{contactData.phone}</span>
                  </a>

                  {/* WhatsApp Shortcut */}
                  <a 
                    href={`https://wa.me/${contactData.whatsapp?.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full transition-all border border-emerald-100 group shadow-sm"
                  >
                    <div className="bg-emerald-600 text-white p-1.5 rounded-full group-hover:scale-110 transition-transform flex items-center justify-center">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                    </div>
                    <span className="text-xs md:text-sm font-black tracking-tight">WhatsApp</span>
                  </a>
                </>
              )}
            </motion.div>
          </div>

          {/* Navigation Tabs - Centered at the bottom of header */}
          <nav className="flex justify-center w-full">
            <div className="flex items-center bg-neutral-100/80 p-1.5 rounded-2xl w-full max-w-2xl shadow-md border border-neutral-200/50">
              {((isAdminMode ? ['Home', 'Products', 'Contacts Us', 'Admin'] : ['Home', 'Products', 'Contacts Us']) as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative px-6 py-3 text-xs md:text-sm font-bold transition-colors rounded-xl flex-1 ${
                    activeTab === tab ? 'text-white' : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  {activeTab === tab && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-red-700 rounded-xl shadow-lg"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10">{tab}</span>
                </button>
              ))}
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'Home' && <Home />}
            {activeTab === 'Products' && <Products />}
            {activeTab === 'Contacts Us' && <Contact />}
            {activeTab === 'Admin' && <Admin />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-12 px-6 bg-neutral-50 text-neutral-900 border-t border-neutral-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="text-xl font-display font-bold mb-4">
              <span className="text-red-600">FRIEND</span>S
            </h3>
            <p className="text-neutral-500 text-sm">
              Leading manufacturer of high-quality hollow bricks and interlocking pavers since 1995.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4 uppercase tracking-widest text-sm text-red-600">Quick Links</h4>
            <ul className="space-y-2 text-neutral-500">
              <li><button onClick={() => setActiveTab('Home')} className="hover:text-red-600 transition-colors">Home</button></li>
              <li><button onClick={() => setActiveTab('Products')} className="hover:text-red-600 transition-colors">Products</button></li>
              <li><button onClick={() => setActiveTab('Contacts Us')} className="hover:text-red-600 transition-colors">Contacts Us</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 uppercase tracking-widest text-sm text-red-600">Newsletter</h4>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="Your email" 
                className="bg-white border border-neutral-200 rounded-lg px-4 py-2 flex-grow focus:ring-1 focus:ring-red-500 outline-none"
              />
              <button className="bg-red-700 px-4 py-2 rounded-lg font-bold text-white hover:bg-red-800 transition-colors">Join</button>
            </div>
          </div>
        </div>
        <div 
          className="max-w-7xl mx-auto mt-12 pt-8 border-t border-neutral-200 text-center text-neutral-400 text-sm cursor-default select-none"
          onClick={handleHiddenLogin}
        >
          © {new Date().getFullYear()} FRIENDS Hollow Bricks & Inter Locks. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
