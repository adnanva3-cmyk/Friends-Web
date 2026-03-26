import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { INITIAL_DATA } from '../constants/initialData';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export default function Products() {
  const [products, setProducts] = useState<any[]>(INITIAL_DATA.products);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'products'), (snapshot) => {
      if (!snapshot.empty) {
        const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(productsData);
      } else {
        setProducts(INITIAL_DATA.products);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching products from Firestore:", error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="py-32 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mb-4"></div>
          <div className="text-neutral-400 font-bold tracking-widest text-sm uppercase">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <section className="py-20 px-6 max-w-7xl mx-auto">
      <div className="mb-16">
        <h2 className="text-4xl font-display font-bold mb-4">Our Product Range</h2>
        <p className="text-neutral-500 max-w-2xl">
          We provide a wide variety of construction materials engineered for durability, 
          aesthetic appeal, and structural integrity.
        </p>
      </div>

      <div className="space-y-24">
        {Array.from(new Set(products.map(p => p.category || 'Other'))).map((category) => (
          <div key={category} className="space-y-12">
            <div className="flex items-center gap-4">
              <h3 className="text-2xl font-display font-bold uppercase tracking-widest text-red-700">{category}</h3>
              <div className="h-px flex-1 bg-neutral-100"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products
                .filter(p => (p.category || 'Other') === category)
                .map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="group bg-white rounded-3xl overflow-hidden border border-neutral-200 hover:border-red-200 transition-colors shadow-sm hover:shadow-xl flex flex-col"
                  >
                    <div className="aspect-square overflow-hidden relative bg-neutral-100 shrink-0">
                      {/* Background Image */}
                      {product.bgImage && (
                        <img 
                          src={product.bgImage} 
                          alt=""
                          className="w-full h-full object-cover opacity-60"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      
                      {/* Product Photo - Bottom Right */}
                      <div className="absolute bottom-4 right-4 w-[40%] aspect-square">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-full object-contain drop-shadow-2xl group-hover:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      <div className="absolute top-4 left-4">
                        <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-red-700">
                          {product.category || 'Product'}
                        </span>
                      </div>
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <h3 className="text-xl font-bold mb-1">{product.name}</h3>
                      <p className="text-sm text-neutral-500 mb-4 flex-grow">{product.description}</p>
                      
                      {product.price && (
                        <p className="text-lg font-bold text-red-700 mb-4">{product.price}</p>
                      )}

                      {product.additionalPhotos && product.additionalPhotos.length > 0 && (
                        <button 
                          onClick={() => setSelectedProduct(product)}
                          className="w-full mt-auto py-3 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
                        >
                          More Photos
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selectedProduct && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl overflow-hidden w-full max-w-5xl max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-2xl font-bold">{selectedProduct.name}</h3>
                  <p className="text-neutral-500 text-sm">Additional Photos</p>
                </div>
                <button 
                  onClick={() => setSelectedProduct(null)}
                  className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {selectedProduct.additionalPhotos?.map((photo: string, idx: number) => (
                    <div key={idx} className="aspect-square rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-50">
                      <img 
                        src={photo} 
                        alt={`${selectedProduct.name} ${idx + 1}`} 
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
