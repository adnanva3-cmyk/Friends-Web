import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, MotionValue, useMotionValue } from 'motion/react';
import { useRef } from 'react';

interface SlideCardProps {
  key?: React.Key;
  slide: any;
  index: number;
  total: number;
  scrollYProgress: MotionValue<number>;
}

function SlideCard({ 
  slide, 
  index, 
  total, 
  scrollYProgress 
}: SlideCardProps) {
  const start = index / total;
  const end = (index + 1) / total;
  const mid1 = start + (end - start) * 0.2;
  const mid2 = start + (end - start) * 0.8;
  const range4 = [start, mid1, mid2, end];

  const z = useTransform(scrollYProgress, [start, end], [600, -1200]);
  const opacity = useTransform(scrollYProgress, range4, [0, 1, 0.8, 0]);
  const scale = useTransform(scrollYProgress, range4, [0.4, 1.2, 1, 0.6]);
  const rotateX = useTransform(scrollYProgress, range4, [60, 0, -20, -40]);
  const y = useTransform(scrollYProgress, range4, [100, 0, -100, -200]);

  const layout = slide.layout || 'overlay';
  const type = slide.type || 'general';
  const shape = slide.shape || 'rectangle';
  const rounded = slide.rounded || 'large';
  const fit = slide.fit || 'contained';
  const align = slide.align || 'center';

  // Type-based styling
  const typeConfig: Record<string, { accent: string, bg: string, text: string }> = {
    general: { accent: 'text-red-600', bg: 'bg-white', text: 'text-neutral-900' },
    legacy: { accent: 'text-amber-700', bg: 'bg-stone-50', text: 'text-stone-900' },
    news: { accent: 'text-blue-600', bg: 'bg-slate-50', text: 'text-slate-900' },
    trending: { accent: 'text-emerald-600', bg: 'bg-emerald-50/30', text: 'text-neutral-900' }
  };

  const style = typeConfig[type] || typeConfig.general;

  // Layout classes
  const shapeClass = shape === 'square' ? 'aspect-square' : 'aspect-video';
  const roundedClass = {
    none: 'rounded-none',
    medium: 'rounded-2xl',
    large: 'rounded-[2rem]',
    full: 'rounded-[4rem]'
  }[rounded as 'none' | 'medium' | 'large' | 'full'] || 'rounded-[2rem]';

  const fitClass = fit === 'full' 
    ? 'w-screen h-screen max-w-none rounded-none border-none shadow-none' 
    : `w-[85vw] max-w-4xl ${shapeClass} ${roundedClass}`;

  const alignClass = fit === 'full' ? '' : {
    center: 'left-1/2 -translate-x-1/2',
    left: 'left-8 md:left-20',
    right: 'right-8 md:right-20'
  }[align as 'center' | 'left' | 'right'] || 'left-1/2 -translate-x-1/2';

  return (
    <motion.div
      style={{
        z,
        opacity,
        scale,
        rotateX,
        y,
        position: 'absolute',
      }}
      className={`${fitClass} ${alignClass} overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border border-neutral-200 ${style.bg}`}
    >
      {layout === 'overlay' && (
        <>
          <img 
            src={slide.image} 
            alt={slide.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent flex flex-col justify-end p-10 md:p-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className={`${style.accent} font-display font-bold tracking-widest text-xs uppercase mb-2 block`}>
                {slide.subtitle}
              </span>
              <h3 className={`${style.text} text-4xl md:text-6xl font-display font-bold tracking-tight leading-none`}>
                {slide.title}
              </h3>
              <p className="text-neutral-600 mt-4 max-w-md text-lg leading-relaxed font-medium">
                {slide.description}
              </p>
            </motion.div>
          </div>
        </>
      )}

      {layout === 'split' && (
        <div className="flex h-full">
          <div className="w-1/2 h-full">
            <img 
              src={slide.image} 
              alt={slide.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="w-1/2 h-full flex flex-col justify-center p-10 md:p-16 bg-white">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className={`${style.accent} font-display font-bold tracking-widest text-xs uppercase mb-2 block`}>
                {slide.subtitle}
              </span>
              <h3 className={`${style.text} text-3xl md:text-5xl font-display font-bold tracking-tight leading-tight`}>
                {slide.title}
              </h3>
              <p className="text-neutral-500 mt-6 text-base md:text-lg leading-relaxed">
                {slide.description}
              </p>
            </motion.div>
          </div>
        </div>
      )}

      {layout === 'minimal' && (
        <div className="h-full flex items-center justify-center p-10 md:p-20 text-center relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <img 
              src={slide.image} 
              alt=""
              className="w-full h-full object-cover blur-xl"
              referrerPolicy="no-referrer"
            />
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="z-10"
          >
            <span className={`${style.accent} font-display font-bold tracking-widest text-sm uppercase mb-4 block`}>
              {slide.subtitle}
            </span>
            <h3 className={`${style.text} text-5xl md:text-7xl font-display font-bold tracking-tighter leading-none mb-8`}>
              {slide.title}
            </h3>
            <p className="text-neutral-500 max-w-xl mx-auto text-lg md:text-xl leading-relaxed italic">
              "{slide.description}"
            </p>
          </motion.div>
        </div>
      )}
      
      {/* Decorative elements */}
      <div className="absolute top-8 right-8 w-16 h-16 border border-neutral-100 rounded-full flex items-center justify-center text-neutral-200 font-display text-xl z-20">
        0{index + 1}
      </div>
    </motion.div>
  );
}

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const [homeContent, setHomeContent] = useState({
    heroTitle: 'Building Foundations that Last Generations',
    heroSubtitle: 'Engineering the Future',
    heroGradientStrength: 60,
    heroImage: '',
    heroOpacity: 0.4
  });

  // Dynamic Opacity Hook
  const opacitySetting = useMotionValue(0.4);
  useEffect(() => {
    opacitySetting.set(homeContent.heroOpacity ?? 0.4);
  }, [homeContent.heroOpacity]);

  // Hooks for Hero Image
  const heroFade = useTransform(scrollYProgress, [0, 0.04], [1, 0]);
  const heroOpacity = useTransform([heroFade, opacitySetting], ([f, o]) => (f as number) * (o as number));
  const heroScale = useTransform(scrollYProgress, [0, 0.04], [1, 1.1]);

  // Hooks for Ambient Light
  const ambientOpacity = useTransform(scrollYProgress, [0, 0.04], [1, 0]);

  // Hooks for Hero Text
  const textOpacity = useTransform(scrollYProgress, [0, 0.04], [1, 0]);
  const textY = useTransform(scrollYProgress, [0, 0.04], [0, -50]);
  const textScale = useTransform(scrollYProgress, [0, 0.04], [1, 0.95]);
  const textPointerEvents = useTransform(scrollYProgress, [0, 0.04], ["auto" as any, "none" as any]);
  const textVisibility = useTransform(scrollYProgress, [0, 0.04], ["visible" as any, "hidden" as any]);

  // Hooks for Scroll Indicator
  const indicatorOpacity = useTransform(scrollYProgress, [0, 0.04], [1, 0]);
  const indicatorPointerEvents = useTransform(scrollYProgress, [0, 0.04], ["auto" as any, "none" as any]);
  const indicatorVisibility = useTransform(scrollYProgress, [0, 0.04], ["visible" as any, "hidden" as any]);

  const [slides, setSlides] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/data');
        const data = await res.json();
        if (data.home) setHomeContent(data.home);
        setSlides(data.slides || []);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, []);

  return (
    <div ref={containerRef} className="relative h-[800vh] bg-white">
      {/* Sticky Hero Section */}
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Background Hero Image */}
        {homeContent.heroImage && (
          <motion.div 
            style={{ 
              opacity: heroOpacity,
              scale: heroScale,
              maskImage: `linear-gradient(to bottom, black 0%, transparent ${100 - (homeContent.heroGradientStrength ?? 60)}%)`,
              WebkitMaskImage: `linear-gradient(to bottom, black 0%, transparent ${100 - (homeContent.heroGradientStrength ?? 60)}%)`
            }}
            className="absolute inset-0 z-0"
          >
            <img 
              src={homeContent.heroImage} 
              alt="Hero" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}

        {/* Background Ambient Light */}
        <motion.div 
          style={{ opacity: ambientOpacity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vh] bg-red-500/5 blur-[120px] rounded-full pointer-events-none" 
        />
        
        <motion.div 
          style={{ 
            opacity: textOpacity,
            y: textY,
            scale: textScale,
            pointerEvents: textPointerEvents,
            visibility: textVisibility
          }}
          className="text-center z-20 mb-32 px-6"
        >
          <motion.h2 
            initial={{ opacity: 0, letterSpacing: "0.5em" }}
            animate={{ opacity: 1, letterSpacing: "0.3em" }}
            className="text-neutral-400 uppercase text-xs md:text-sm font-bold mb-6"
          >
            {homeContent.heroSubtitle}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-neutral-900 text-5xl md:text-8xl font-display font-bold max-w-5xl mx-auto leading-[0.9] tracking-tighter"
          >
            {homeContent.heroTitle.split('Last Generations')[0]}
            {homeContent.heroTitle.includes('Last Generations') && <span className="text-red-600">Last Generations</span>}
          </motion.p>
        </motion.div>

        {/* 3D Scrolling Gallery */}
        <div className="absolute inset-0 flex items-center justify-center perspective-1000 overflow-visible">
          {slides.map((slide, index) => (
            <SlideCard 
              key={slide.id} 
              slide={slide} 
              index={index} 
              total={slides.length} 
              scrollYProgress={scrollYProgress} 
            />
          ))}
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          style={{ 
            opacity: indicatorOpacity,
            pointerEvents: indicatorPointerEvents,
            visibility: indicatorVisibility
          }}
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 text-neutral-300 flex flex-col items-center gap-3"
        >
          <span className="text-[9px] uppercase tracking-[0.4em] font-bold">Scroll to Explore</span>
          <div className="w-px h-16 bg-gradient-to-b from-neutral-300 to-transparent" />
        </motion.div>
      </div>
    </div>
  );
}
