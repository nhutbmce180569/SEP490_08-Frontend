import React, { useState, useEffect } from 'react';
import { useSystemSettings } from '../features/system/hooks/useSystemSettings';
import { useTranslation } from '../contexts/LocaleContext';

const MobileDetector: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);
  const { getSetting } = useSystemSettings();
  const { t } = useTranslation();

  useEffect(() => {
    const checkMobile = () => {
      const skipPromptTime = localStorage.getItem('skipMobileApkPrompt');
      if (skipPromptTime && Date.now() < parseInt(skipPromptTime)) {
        setIsMobile(false);
        return;
      }

      const userAgent = typeof window.navigator === "undefined" ? "" : navigator.userAgent;
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      
      // Check user agent and screen width (mobile typical max width is around 768px)
      const isMobileDevice = mobileRegex.test(userAgent);
      const isSmallScreen = window.innerWidth <= 768;
      
      // If either user agent says it's mobile, or it's a very small screen
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    checkMobile();
    
    // Optional: Re-check on resize in case they are resizing browser tools
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6 text-center">
        <div className="max-w-md w-full">
          <div className="mb-8 flex justify-center">
            {/* Logo placeholder, using an icon or generic text */}
            <div className="w-20 h-20 bg-brand/10 text-brand rounded-2xl flex items-center justify-center text-3xl font-black shadow-sm">
              SH
            </div>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-4">
            {t('common.mobileDetector.title')}
          </h1>
          
          <p className="text-slate-600 mb-10 text-base leading-relaxed">
            {t('common.mobileDetector.description')}
          </p>
          
          <div className="flex flex-col gap-4">
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="flex items-center justify-center gap-3 bg-brand text-white px-6 py-4 rounded-xl font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19.5v-15h-11v15z"/><path d="M5 4.5h14v15H5z"/><path d="M12 16.5v.01"/></svg>
              {t('common.mobileDetector.downloadAndroid')}
            </a>
            
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="flex items-center justify-center gap-3 bg-slate-900 text-white px-6 py-4 rounded-xl font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"/><path d="M10 2c1 .5 2 2 2 5h-2c0-3-1-4-2-5Z"/></svg>
              {t('common.mobileDetector.downloadIos')}
            </a>
            
            <a
              href={getSetting('ApkDownloadLink') || "https://drive.google.com/uc?export=download&id=1jNrE3DYo6pbY9S_mp-fO-C05Lde-yvOa"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 bg-green-600 text-white px-6 py-4 rounded-xl font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {t('common.mobileDetector.downloadApk')}
            </a>
          </div>
          
          <button 
            onClick={() => {
              localStorage.setItem('skipMobileApkPrompt', (Date.now() + 24 * 60 * 60 * 1000).toString());
              setIsMobile(false);
            }}
            className="mt-8 text-sm font-semibold text-slate-400 hover:text-slate-600 underline underline-offset-4"
          >
            {t('common.mobileDetector.continueWeb')}
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default MobileDetector;
