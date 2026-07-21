import React, { useState } from "react";
import { Maximize2, ChevronLeft, ChevronRight, X } from "lucide-react";
import { createPortal } from "react-dom";

interface TourImageGalleryProps {
  images: string[];
}

export function TourImageGallery({ images }: TourImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!images || images.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl">
      {/* Main Image */}
      <div className="relative aspect-[16/9] md:aspect-[2/1] w-full rounded-xl overflow-hidden bg-slate-100 group shadow-sm border border-slate-100">
        <img 
          src={images[activeIndex]} 
          alt="Tour preview" 
          className="w-full h-full object-cover transition-all duration-500 ease-out"
        />
        {/* Fullscreen button */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-slate-700 p-2.5 rounded-xl shadow-md backdrop-blur-md transition-all hover:scale-105 z-10"
        >
          <Maximize2 size={18} />
        </button>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2.5 justify-center overflow-x-auto mt-2 py-2 snap-x hide-scrollbar">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`relative flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-md overflow-hidden snap-center transition-all duration-300 ${
                activeIndex === idx 
                  ? "ring-2 ring-brand ring-offset-2 scale-105" 
                  : "opacity-60 hover:opacity-100 hover:scale-105"
              }`}
            >
              <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

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
