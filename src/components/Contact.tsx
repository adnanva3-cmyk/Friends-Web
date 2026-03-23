import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Send, Clock, ExternalLink, MessageCircle } from 'lucide-react';
import { INITIAL_DATA } from '../constants/initialData';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function Contact() {
  const [contactInfo, setContactInfo] = useState(INITIAL_DATA.contact);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'contact'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const branches = data.branches || [{
          name: 'Main Branch',
          address: data.address || '',
          mapEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d977.8458380352358!2d75.86388360604744!3d11.37967832514358!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba667cca92506bd%3A0xfeaaa668143354d5!2sFriends%20hollow%20bricks%20and%20inter%20Locke!5e0!3m2!1sen!2sin!4v1774172490444!5m2!1sen!2sin',
          mapLink: ''
        }];
        setContactInfo({ 
          phone: data.phone || '',
          secondaryPhone: data.secondaryPhone || '',
          email: data.email || '',
          whatsapp: data.whatsapp || '',
          branches 
        });
      }
    }, (error) => {
      console.error("Error fetching contact data from Firestore:", error);
    });
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-white pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16">
          <h2 className="text-5xl font-bold mb-4">Contact Us</h2>
          <p className="text-xl text-neutral-500 max-w-2xl">
            We're here to help you build your vision. Reach out to us through any of our channels or visit our branches.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* General Contact Info */}
          <div className="lg:col-span-1 space-y-12">
            <div>
              <h3 className="text-2xl font-bold mb-8">Get in Touch</h3>
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 shrink-0">
                    <Phone size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Phone</h4>
                    <p className="text-neutral-500">{contactInfo.phone}</p>
                    {contactInfo.secondaryPhone && (
                      <p className="text-neutral-500">{contactInfo.secondaryPhone}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 shrink-0">
                    <Mail size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Email</h4>
                    <p className="text-neutral-500">{contactInfo.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 shrink-0">
                    <MessageCircle size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">WhatsApp</h4>
                    <p className="text-neutral-500">{contactInfo.whatsapp}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-neutral-900 rounded-[2.5rem] text-white">
              <h4 className="text-xl font-bold mb-4">Business Hours</h4>
              <div className="space-y-3 text-neutral-400">
                <div className="flex justify-between">
                  <span>Mon - Sat</span>
                  <span>8:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span>Closed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Branches List */}
          <div className="lg:col-span-2 space-y-16">
            <h3 className="text-2xl font-bold">Our Branches</h3>
            {contactInfo.branches.map((branch: any, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h4 className="text-3xl font-bold text-red-700 mb-3">{branch.name}</h4>
                    <div className="flex items-start gap-3 text-neutral-500 max-w-md">
                      <MapPin size={20} className="shrink-0 mt-1 text-red-600" />
                      <p className="text-lg leading-relaxed">{branch.address}</p>
                    </div>
                  </div>
                  {branch.mapLink && (
                    <a 
                      href={branch.mapLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 px-6 py-3 rounded-2xl font-bold transition-all text-sm shrink-0"
                    >
                      <ExternalLink size={18} />
                      View on Google Maps
                    </a>
                  )}
                </div>

                <div className="h-[400px] rounded-[2.5rem] overflow-hidden border border-neutral-100 shadow-sm relative group">
                  <iframe 
                    src={branch.mapEmbed}
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen={true} 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                    className="grayscale hover:grayscale-0 transition-all duration-700"
                    title={`${branch.name} Location`}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
