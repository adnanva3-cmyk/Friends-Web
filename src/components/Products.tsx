import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/data');
        if (!res.ok) throw new Error('Server returned ' + res.status);
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Response is not JSON");
        }
        const data = await res.json();
        setProducts(data.products || []);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  if (loading) return <div className="py-20 text-center">Loading Products...</div>;

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
                    className="group bg-white rounded-3xl overflow-hidden border border-neutral-200 hover:border-red-200 transition-colors shadow-sm hover:shadow-xl"
                  >
                    <div className="aspect-square overflow-hidden relative bg-neutral-100">
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
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-1">{product.name}</h3>
                      <p className="text-sm text-neutral-500 mb-4">{product.description}</p>
                      
                      {product.price && (
                        <p className="text-lg font-bold text-red-700 mb-4">{product.price}</p>
                      )}

                      <button className="w-full py-3 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors">
                        More Photos
                      </button>
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
