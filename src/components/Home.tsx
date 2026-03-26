import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, MotionValue, useSpring, useMotionValue } from 'motion/react';
import { useRef } from 'react';
import { INITIAL_DATA } from '../constants/initialData';
import { db } from '../firebase';
import { doc, collection, onSnapshot } from 'firebase/firestore';

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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const heroEnd = 1 / (total + 1);
  
  // Map the scroll progress from the end of the hero section to the bottom of the page
  // into a continuous "progress" value from -1 to (total - 1).
  // -1 means the first slide is just starting to come into view.
  // (total - 1) means the last slide is perfectly centered.
  const progress = useTransform(scrollYProgress, [heroEnd, 1], [-1, total - 1 || 0]);
  
  // Calculate the relative distance of THIS specific slide from the center (0).
  // -1 = incoming from bottom, 0 = centered, 1 = outgoing to top.
  const distance = useTransform(progress, (p) => p - index);

  // Map the relative distance to visual properties.
  // By using a continuous [-1, 0, 1] mapping without a flat center, 
  // the slides will never "stop" or pause. They will continuously flow through the center.
  // We tighten the opacity range to [-0.8, 0.8] so they fade out completely before overlapping too much.
  const opacity = useTransform(distance, [-0.8, -0.2, 0.2, 0.8], [0, 1, 1, 0]);
  const scale = useTransform(distance, [-1, 0, 1], [0.8, 1, 0.8]);
  // Increased the Y distance on mobile from 200 to 400 to physically push the cards further apart
  const y = useTransform(distance, [-1, 0, 1], [isMobile ? 400 : 500, 0, isMobile ? -400 : -500]);
  const rotateX = useTransform(distance, [-1, 0, 1], [20, 0, -20]);
  const z = useTransform(distance, [-1, 0, 1], [-400, 0, -400]);

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
  const shapeClass = shape === 'square' ? 'aspect-square' : (isMobile ? 'aspect-[4/5]' : 'aspect-video');
  const roundedClass = {
    none: 'rounded-none',
    medium: 'rounded-2xl',
    large: 'rounded-[2rem]',
    full: 'rounded-[4rem]'
  }[rounded as 'none' | 'medium' | 'large' | 'full'] || 'rounded-[2rem]';

  const fitClass = fit === 'full' 
    ? 'w-screen h-[100dvh] max-w-none rounded-none border-none shadow-none' 
    : `w-[90vw] md:w-[85vw] max-w-4xl ${shapeClass} ${roundedClass}`;

  const alignClass = fit === 'full' ? '' : {
    center: 'justify-center',
    left: 'justify-start pl-4 md:pl-20',
    right: 'justify-end pr-4 md:pr-20'
  }[align as 'center' | 'left' | 'right'] || 'justify-center';

  return (
    <div className={`absolute inset-0 w-full h-full flex items-center ${alignClass} pointer-events-none z-10`} style={{ transformStyle: 'preserve-3d' }}>
      <motion.div
        style={{
          opacity,
          scale,
          y,
          rotateX,
          z,
          transformOrigin: 'center center',
          willChange: 'transform, opacity',
        }}
        className={`${fitClass} relative overflow-hidden shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] border border-neutral-200 ${style.bg} pointer-events-auto`}
      >
        {layout === 'overlay' && (
        <>
          <img 
            src={slide.image} 
            alt={slide.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent flex flex-col justify-end p-6 md:p-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className={`${style.accent} font-display font-bold tracking-widest text-[10px] md:text-xs uppercase mb-1 md:mb-2 block`}>
                {slide.subtitle}
              </span>
              <h3 className={`${style.text} text-3xl md:text-6xl font-display font-bold tracking-tight leading-none`}>
                {slide.title}
              </h3>
              <p className="text-neutral-600 mt-2 md:mt-4 max-w-md text-sm md:text-lg leading-relaxed font-medium line-clamp-3 md:line-clamp-none">
                {slide.description}
              </p>
            </motion.div>
          </div>
        </>
      )}

      {layout === 'split' && (
        <div className="flex flex-col md:flex-row h-full">
          <div className="w-full md:w-1/2 h-1/2 md:h-full">
            <img 
              src={slide.image} 
              alt={slide.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col justify-center p-6 md:p-16 bg-white">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className={`${style.accent} font-display font-bold tracking-widest text-[10px] md:text-xs uppercase mb-1 md:mb-2 block`}>
                {slide.subtitle}
              </span>
              <h3 className={`${style.text} text-2xl md:text-5xl font-display font-bold tracking-tight leading-tight`}>
                {slide.title}
              </h3>
              <p className="text-neutral-500 mt-2 md:mt-6 text-sm md:text-lg leading-relaxed line-clamp-3 md:line-clamp-none">
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
    </div>
  );
}

function HomeContent({ homeContent, slides }: { homeContent: any, slides: any[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: rawScrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const scrollYProgress = useSpring(rawScrollYProgress, {
    stiffness: 40,
    damping: 15,
    mass: 0.8,
    restDelta: 0.0001
  });

  // Dynamic Opacity Hook
  const opacitySetting = useMotionValue(INITIAL_DATA.home.heroOpacity);
  useEffect(() => {
    opacitySetting.set(homeContent.heroOpacity ?? 0.4);
  }, [homeContent.heroOpacity]);

  const heroEnd = 1 / (slides.length + 1);

  // Hooks for Hero Image
  const heroFade = useTransform(rawScrollYProgress, [0, heroEnd], [1, 0]);
  const heroOpacity = useTransform([heroFade, opacitySetting], ([f, o]) => (f as number) * (o as number));
  const heroScale = useTransform(rawScrollYProgress, [0, heroEnd], [1, 1.1]);

  // Hooks for Ambient Light
  const ambientOpacity = useTransform(rawScrollYProgress, [0, heroEnd], [1, 0]);

  // Hooks for Hero Text
  const textOpacity = useTransform(rawScrollYProgress, [0, heroEnd], [1, 0]);
  const textY = useTransform(rawScrollYProgress, [0, heroEnd], [0, -300]);
  const textScale = useTransform(rawScrollYProgress, [0, heroEnd], [1, 0.95]);
  const textPointerEvents = useTransform(rawScrollYProgress, [0, heroEnd], ["auto" as any, "none" as any]);
  const textVisibility = useTransform(rawScrollYProgress, [0, heroEnd], ["visible" as any, "hidden" as any]);

  // Hooks for Scroll Indicator
  const indicatorOpacity = useTransform(rawScrollYProgress, [0, heroEnd], [1, 0]);
  const indicatorPointerEvents = useTransform(rawScrollYProgress, [0, heroEnd], ["auto" as any, "none" as any]);
  const indicatorVisibility = useTransform(rawScrollYProgress, [0, heroEnd], ["visible" as any, "hidden" as any]);

  return (
    <div ref={containerRef} style={{ height: `${(slides.length + 1) * 100}vh` }} className="relative bg-white">
      {/* Sticky Hero Section */}
      <div className="sticky top-0 h-[100dvh] flex flex-col items-center justify-center overflow-hidden">
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
          className="text-center z-20 mb-32 px-4 md:px-6"
        >
          <motion.h2 
            initial={{ opacity: 0, letterSpacing: "0.5em" }}
            animate={{ opacity: 1, letterSpacing: "0.3em" }}
            className="text-neutral-400 uppercase text-[10px] md:text-sm font-bold mb-4 md:mb-6"
          >
            {homeContent.heroSubtitle}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-neutral-900 text-4xl md:text-8xl font-display font-bold max-w-5xl mx-auto leading-[0.9] tracking-tighter"
          >
            {homeContent.heroTitle.split('Last Generations')[0]}
            {homeContent.heroTitle.includes('Last Generations') && <span className="text-red-600">Last Generations</span>}
          </motion.p>
        </motion.div>

        {/* 3D Scrolling Gallery */}
        <div 
          className="absolute inset-0 flex items-center justify-center overflow-visible"
          style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
        >
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

export default function Home() {
  const [homeContent, setHomeContent] = useState(INITIAL_DATA.home);
  const [slides, setSlides] = useState<any[]>(INITIAL_DATA.slides);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let homeLoaded = false;
    let slidesLoaded = false;

    const checkLoading = () => {
      if (homeLoaded && slidesLoaded) setLoading(false);
    };

    const unsubHome = onSnapshot(doc(db, 'settings', 'home'), (docSnap) => {
      if (docSnap.exists()) {
        setHomeContent(docSnap.data() as any);
      } else {
        setHomeContent(INITIAL_DATA.home);
      }
      homeLoaded = true;
      checkLoading();
    }, (error) => {
      console.error("Error fetching home data from Firestore:", error);
      homeLoaded = true;
      checkLoading();
    });

    const unsubSlides = onSnapshot(collection(db, 'slides'), (snapshot) => {
      if (!snapshot.empty) {
        const slidesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSlides(slidesData);
      } else {
        setSlides(INITIAL_DATA.slides);
      }
      slidesLoaded = true;
      checkLoading();
    }, (error) => {
      console.error("Error fetching slides from Firestore:", error);
      slidesLoaded = true;
      checkLoading();
    });

    return () => {
      unsubHome();
      unsubSlides();
    };
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mb-4"></div>
          <div className="text-neutral-400 font-bold tracking-widest text-sm uppercase">Loading...</div>
        </div>
      </div>
    );
  }

  return <HomeContent homeContent={homeContent} slides={slides} />;
}
