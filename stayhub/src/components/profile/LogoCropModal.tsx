import React, { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, Check, ZoomIn, ZoomOut } from 'lucide-react';
import { useTranslation } from '../../contexts/LocaleContext';

export interface LogoCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedFile: File, croppedUrl: string) => void;
}

async function getCroppedImg(image: HTMLImageElement, pixelCrop: PixelCrop): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  canvas.width = Math.floor(pixelCrop.width * scaleX);
  canvas.height = Math.floor(pixelCrop.height * scaleY);

  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(
    image,
    pixelCrop.x * scaleX,
    pixelCrop.y * scaleY,
    pixelCrop.width * scaleX,
    pixelCrop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error('Canvas is empty')); return; }
      resolve(blob);
    }, 'image/png');
  });
}

export const LogoCropModal: React.FC<LogoCropModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
}) => {
  const { t } = useTranslation();
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth: nw, naturalHeight: nh } = e.currentTarget;
    // Init crop to fill as much of the image as possible
    const initCrop = centerCrop(
      makeAspectCrop({ unit: '%', width: 100 }, nw / nh, nw, nh),
      nw,
      nh,
    );
    setCrop(initCrop);
  }, []);

  const handleSave = async () => {
    if (!imgRef.current || !completedCrop) return;
    setIsProcessing(true);
    try {
      const blob = await getCroppedImg(imgRef.current, completedCrop);
      const file = new File([blob], 'logo.png', { type: 'image/png' });
      const url = URL.createObjectURL(blob);
      onCropComplete(file, url);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{t('admin.cropLogo')}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{t('admin.cropLogoHint')}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Crop area */}
        <div
          className="flex items-center justify-center overflow-auto bg-[#1e1e2e] p-4"
          style={{ maxHeight: '480px', minHeight: '300px' }}
        >
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            ruleOfThirds
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="crop"
              onLoad={onImageLoad}
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                maxWidth: '100%',
                maxHeight: '440px',
                display: 'block',
              }}
            />
          </ReactCrop>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4 px-6 py-5">
          <div className="flex items-center gap-3">
            <ZoomOut size={16} className="shrink-0 text-slate-400" />
            <input
              type="range"
              value={scale}
              min={0.5}
              max={3}
              step={0.05}
              aria-label="Zoom"
              onChange={(e) => setScale(Number(e.target.value))}
              className="w-full accent-brand"
            />
            <ZoomIn size={16} className="shrink-0 text-slate-400" />
            <span className="w-10 shrink-0 text-right text-xs font-mono text-slate-500">
              {scale.toFixed(1)}x
            </span>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={isProcessing || !completedCrop}
              className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand/20 hover:brightness-105 disabled:opacity-60 transition-all"
            >
              <Check size={16} />
              {isProcessing ? (t('common.processing') || 'Đang xử lý...') : t('common.save')}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
