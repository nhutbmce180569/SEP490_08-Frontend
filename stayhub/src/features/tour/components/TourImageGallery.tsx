import React, { useState, useEffect } from "react";
import { Maximize2, ChevronLeft, ChevronRight, X } from "lucide-react";
import { createPortal } from "react-dom";

interface TourImageGalleryProps {
  images: string[];
}

export function TourImageGallery({ images }: TourImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Auto-play effect
  useEffect(() => {
    if (!images || images.length <= 1) return;
    
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length);
    }, 4000); // Tự động chuyển ảnh mỗi 4 giây

    return () => clearInterval(interval);
  }, [images]);

  if (!images || images.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl">
      <div className="flex flex-col-reverse md:flex-row gap-3 md:gap-4 md:h-[400px] lg:h-[460px]">
        {/* Thumbnails - Vertical on desktop, horizontal on mobile */}
        {images.length > 1 && (
          <div className="flex md:flex-col gap-2 md:gap-3 overflow-x-auto md:overflow-y-auto w-full md:w-[100px] lg:w-[140px] shrink-0 snap-x md:snap-y hide-scrollbar scroll-smooth pb-2 md:pb-0 md:pr-2 p-1">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`relative flex-shrink-0 w-[80px] h-[80px] md:w-full md:h-[80px] lg:h-[105px] rounded-xl overflow-hidden snap-center transition-all duration-300 ${
                  activeIndex === idx 
                    ? "ring-2 ring-brand ring-offset-1 scale-[1.02] shadow-sm" 
                    : "opacity-60 hover:opacity-100 hover:scale-[1.02]"
                }`}
              >
                <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Main Image */}
        <div className="relative w-full aspect-[16/9] md:aspect-auto md:h-full rounded-2xl overflow-hidden bg-slate-100 group shadow-sm border border-slate-100 flex-1">
          <img 
            key={activeIndex}
            src={images[activeIndex]} 
            alt="Tour preview" 
            className="w-full h-full object-cover animate-in fade-in duration-500"
          />
          {/* Fullscreen button */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-slate-700 p-2.5 rounded-xl shadow-md backdrop-blur-md transition-all hover:scale-105 z-10"
          >
            <Maximize2 size={18} />
          </button>
        </div>
      </div>

      {/* Modal Fullscreen */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md transition-opacity">
          <button 
            onClick={() => setIsModalOpen(false)}
            className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-colors z-[110]"
          >
            <X size={24} />
          </button>
          
          <img 
            src={images[activeIndex]} 
            alt="Tour fullscreen" 
            className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />

          {images.length > 1 && (
            <>
              <button 
                onClick={() => setActiveIndex((activeIndex - 1 + images.length) % images.length)}
                className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all hover:scale-110 z-[110]"
              >
                <ChevronLeft size={36} strokeWidth={1.5} />
              </button>
              <button 
                onClick={() => setActiveIndex((activeIndex + 1) % images.length)}
                className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all hover:scale-110 z-[110]"
              >
                <ChevronRight size={36} strokeWidth={1.5} />
              </button>
            </>
          )}
          
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/90 font-medium bg-black/60 px-5 py-2 rounded-full backdrop-blur-xl border border-white/10 shadow-xl">
            {activeIndex + 1} / {images.length}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
