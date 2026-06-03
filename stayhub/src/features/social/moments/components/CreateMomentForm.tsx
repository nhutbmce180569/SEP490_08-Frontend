import React, { useState, useContext, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { Loader2, X, RefreshCw, MapPin, Globe, Users, Lock, ChevronDown } from "lucide-react";
import { AuthContext } from "../../../../contexts/AuthContext";
import { useToast } from "../../../../contexts/ToastContext";
import { useCreateMoment } from "../hooks/useMoments";
import { useGetEligibleSchedules } from "../hooks/useEligibleSchedules";
import { useTranslation } from "../../../../contexts/LocaleContext";

interface CreateMomentFormProps {
  onClose?: () => void;
}

const MAX_CAPTION_LENGTH = 500;

export const CreateMomentForm: React.FC<CreateMomentFormProps> = ({ 
  onClose
}) => {
  const { t } = useTranslation();
  const { mutate: createMoment, isPending } = useCreateMoment();
  
  // 1. GỌI API LẤY DANH SÁCH CHUYẾN ĐI
  const { data: eligibleSchedules, isLoading: isSchedulesLoading } = useGetEligibleSchedules();
  
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [privacy, setPrivacy] = useState<'Public' | 'Friend' | 'Private'>('Public');
  
  // 2. TỰ ĐỘNG CHỌN CHUYẾN ĐI TRÊN CÙNG KHI CÓ DATA
  useEffect(() => {
    if (eligibleSchedules && eligibleSchedules.length > 0) {
      setSelectedScheduleId(String(eligibleSchedules[0].scheduleId));
    }
  }, [eligibleSchedules]);

  // STATE: GPS
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [geoStatus, setGeoStatus] = useState<"locating" | "success" | "error">("locating");

  const webcamRef = useRef<Webcam>(null);
  const { user } = useContext(AuthContext);
  const { success, error: showError, warning } = useToast();

  // ĐỊNH VỊ GPS NGAY KHI MỞ
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setGeoStatus("success");
        },
        (err) => {
          console.error("Lỗi GPS:", err);
          setGeoStatus("error");
          setLocation({ lat: 10.0451, lng: 105.7468 }); 
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setGeoStatus("error");
    }
  }, []);

  const capture = useCallback(() => {
    const src = webcamRef.current?.getScreenshot();
    if (src) setImageSrc(src);
  }, [webcamRef]);

  const retake = () => {
    setImageSrc(null);
    setCaption("");
  };

  const onSubmit = async () => {
    if (!imageSrc) return;
    if (isPending) return;
    if (!selectedScheduleId) {
      warning(t("social.momentSelectSchedule"));
      return;
    }
    
    if (geoStatus === "locating") {
      warning(t("social.momentGpsWait"));
      return;
    }

    try {
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      const file = new File([blob], "moment.jpg", { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("image", file);
      
      if (caption.trim()) {
        formData.append("caption", caption.trim());
      }

      // TRUYỀN ID CHUYẾN ĐI ĐÃ CHỌN VÀO FORM
      formData.append("scheduleId", selectedScheduleId);

      if (user && user.id) {
        formData.append("userId", user.id.toString());
      }

      if (location) {
        formData.append("lat", location.lat.toString().replace(',', '.'));
        formData.append("lng", location.lng.toString().replace(',', '.'));
      }

      formData.append("privacy", privacy);

      submitForm(formData);
    } catch (e) {
      showError(t("social.momentImageError"));
    }
  };

  const submitForm = (formData: FormData) => {
    createMoment(formData, {
      onSuccess: () => {
        success(t("social.momentPostSuccess"));
        if (onClose) onClose();
      },
      onError: (err: any) => {
        console.error("LỖI UPLOAD:", err.response?.data);
        showError(t("social.momentPostError"));
      }
    });
  };

  // ==========================================
  // XỬ LÝ EMPTY STATE (CHƯA MUA TOUR)
  // ==========================================
  if (!isSchedulesLoading && (!eligibleSchedules || eligibleSchedules.length === 0)) {
    return (
      <div className="relative w-full max-w-md mx-auto p-8 rounded-3xl bg-white text-center shadow-2xl animate-fade-in-up">
        {onClose && (
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        )}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-light mb-5">
          <MapPin className="h-10 w-10 text-brand" />
        </div>
        <h3 className="text-xl font-black mb-3 text-slate-800">{t("social.momentNoTripsTitle")}</h3>
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
          {t("social.momentNoTripsDesc")}
        </p>
        <button onClick={onClose} className="w-full font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 py-3.5 rounded-xl transition-all active:scale-95">
          {t("common.confirm")}
        </button>
      </div>
    );
  }

  // ==========================================
  // RENDER CAMERA & FORM CHÍNH
  // ==========================================
  return (
    <div className="relative w-full max-w-md mx-auto overflow-hidden rounded-[2rem] bg-black text-white shadow-2xl flex flex-col h-[80vh] md:h-[650px] border border-white/10">
      {onClose && (
        <button 
          onClick={onClose} 
          disabled={isPending}
          className="absolute top-4 right-4 z-50 p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition disabled:opacity-50"
        >
          <X className="w-6 h-6" />
        </button>
      )}

      {/* DROPDOWN CHỌN CHUYẾN ĐI (Floating trên góc trái) */}
      <div className="absolute top-4 left-4 z-50 flex items-center bg-black/50 backdrop-blur-md pl-2 pr-1 py-1 rounded-full text-xs font-medium border border-white/10">
        <MapPin className="w-3.5 h-3.5 text-brand mr-2" />
        <select 
          value={selectedScheduleId}
          onChange={(e) => setSelectedScheduleId(e.target.value)}
          className="bg-transparent text-white focus:outline-none appearance-none font-semibold truncate max-w-[120px]"
        >
          {isSchedulesLoading ? (
            <option className="bg-slate-800" disabled>{t("social.momentLoadingSchedules")}</option>
          ) : (
            eligibleSchedules?.map((trip: any) => (
              <option key={trip.scheduleId} value={trip.scheduleId} className="bg-slate-800">
                {trip.tourName}
              </option>
            ))
          )}
        </select>
        <ChevronDown className="w-3 h-3 text-white/50 pointer-events-none" />
      </div>

      {/* RADAR GPS (Dịch xuống dưới Dropdown) */}
      <div className="absolute top-14 left-4 z-50 flex items-center gap-2 bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-medium border border-white/5">
        <div className={`w-2 h-2 rounded-full ${geoStatus === 'locating' ? 'animate-ping bg-yellow-400' : geoStatus === 'success' ? 'bg-green-400' : 'bg-red-400'}`} />
        {geoStatus === 'locating' && <span className="text-yellow-400">{t("social.momentLocatingGps")}</span>}
        {geoStatus === 'success' && <span className="text-green-400">{t("social.momentGpsPinned")}</span>}
        {geoStatus === 'error' && <span className="text-red-400">{t("social.momentGpsError")}</span>}
      </div>

      {isPending && (
        <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
          <Loader2 className="w-12 h-12 animate-spin text-brand mb-4" />
          <p className="font-semibold text-lg tracking-tight">{t("social.momentUploading")}</p>
        </div>
      )}

      {!imageSrc ? (
        <div className="relative flex-1 flex flex-col">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: "environment" }}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 pointer-events-none border-[2px] border-white/20 m-4 rounded-[1.5rem]" />
          
          <div className="absolute bottom-10 left-0 right-0 flex justify-center z-10">
            <button
              onClick={capture}
              className="w-20 h-20 rounded-full border-[5px] border-white flex items-center justify-center bg-transparent hover:bg-white/30 transition-all active:scale-90"
            >
              <div className="w-[60px] h-[60px] rounded-full bg-white shadow-lg" />
            </button>
          </div>
        </div>
      ) : (
        <div className="relative flex-1 flex flex-col bg-black">
          <img src={imageSrc} alt="Preview" className="w-full h-full object-cover opacity-90" />
          
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col gap-4">
            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
              {[
                { id: 'Public', icon: Globe, label: t('social.public') },
                { id: 'Friend', icon: Users, label: t('social.momentPrivacyFriends') },
                { id: 'Private', icon: Lock, label: t('social.momentPrivacyOnlyMe') }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setPrivacy(opt.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${privacy === opt.id ? 'bg-brand text-white shadow-md' : 'bg-black/40 text-white/70 hover:bg-black/60 border border-white/10'}`}
                >
                  <opt.icon className="w-3.5 h-3.5" />
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="relative">
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder={t("social.momentAddCaption")}
                className="w-full bg-black/40 backdrop-blur-md border border-white/20 text-white placeholder-white/50 px-5 py-4 rounded-2xl outline-none focus:border-brand transition-colors pr-16"
                maxLength={MAX_CAPTION_LENGTH}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-white/40">
                {caption.length}/{MAX_CAPTION_LENGTH}
              </span>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={retake}
                disabled={isPending}
                className="flex-1 py-4 px-4 rounded-2xl bg-white/10 backdrop-blur-md hover:bg-white/20 font-bold flex items-center justify-center gap-2 transition-colors active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className="w-5 h-5" /> {t("social.momentRetake")}
              </button>
              <button
                onClick={onSubmit}
                disabled={isPending || geoStatus === 'locating' || !selectedScheduleId}
                className="flex-1 py-4 px-4 rounded-2xl bg-brand hover:bg-brand-hover font-bold text-white shadow-[0_8px_20px_rgba(0,104,224,0.4)] transition-all active:scale-95 disabled:opacity-50"
              >
                {t("social.momentPostBtn")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};