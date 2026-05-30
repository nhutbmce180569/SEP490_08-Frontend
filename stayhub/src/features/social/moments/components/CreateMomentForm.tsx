import React, { useState, useContext, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { Loader2, X, RefreshCw, MapPin, Globe, Users, Lock } from "lucide-react";
import { AuthContext } from "../../../../contexts/AuthContext";
import { useToast } from "../../../../contexts/ToastContext";
import { useCreateMoment } from "../hooks/useMoments";

interface CreateMomentFormProps {
  scheduleId?: number | string;
  onClose?: () => void;
}

const MAX_CAPTION_LENGTH = 500;

export const CreateMomentForm: React.FC<CreateMomentFormProps> = ({ 
  scheduleId = 1,
  onClose
}) => {
  const { mutate: createMoment, isPending } = useCreateMoment();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  
  // ✨ STATE MỚI: Lưu trữ tọa độ ngay khi bật Camera
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [geoStatus, setGeoStatus] = useState<"locating" | "success" | "error">("locating");
  const [privacy, setPrivacy] = useState<'Public' | 'Friend' | 'Private'>('Public');

  const webcamRef = useRef<Webcam>(null);
  const { user } = useContext(AuthContext);
  const { success, error: showError, warning } = useToast();

  // ✨ ĐỊNH VỊ NGAY KHI MỞ COMPONENT
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
          // Fallback tạm về tọa độ Cần Thơ nếu trình duyệt chặn
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
    
    if (geoStatus === "locating") {
      warning("Đang tìm vị trí GPS, vui lòng đợi 1 chút...");
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

      formData.append("scheduleId", scheduleId.toString());

      if (user && user.id) {
        formData.append("userId", user.id.toString());
      }

      // ✨ Gắn tọa độ đã chuẩn bị sẵn vào Form
      if (location) {
        // Mẹo: Replace phẩy thành chấm để phòng lỗi sai Format số thập phân bên C#
        formData.append("lat", location.lat.toString().replace(',', '.'));
        formData.append("lng", location.lng.toString().replace(',', '.'));
      }

      formData.append("privacy", privacy);

      submitForm(formData);
    } catch (e) {
      showError("Lỗi xử lý hình ảnh.");
    }
  };

  const submitForm = (formData: FormData) => {
    createMoment(formData, {
      onSuccess: () => {
        success("Đã ghim khoảnh khắc lên Bản đồ!");
        if (onClose) onClose();
      },
      onError: (err: any) => {
        console.error("LỖI UPLOAD:", err.response?.data);
        showError("Lỗi đăng bài. Vui lòng thử lại!");
      }
    });
  };

  return (
    <div className="relative w-full max-w-md mx-auto overflow-hidden rounded-[2rem] bg-black text-white shadow-2xl flex flex-col h-[80vh] md:h-[600px] border border-white/10">
      {onClose && (
        <button 
          onClick={onClose} 
          disabled={isPending}
          className="absolute top-4 right-4 z-50 p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition disabled:opacity-50"
        >
          <X className="w-6 h-6" />
        </button>
      )}

      {/* ✨ RADAR HIỂN THỊ TRẠNG THÁI GPS */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium">
        <MapPin className={`w-3.5 h-3.5 ${geoStatus === 'locating' ? 'animate-bounce text-yellow-400' : geoStatus === 'success' ? 'text-green-400' : 'text-red-400'}`} />
        {geoStatus === 'locating' && <span className="text-yellow-400">Đang dò GPS...</span>}
        {geoStatus === 'success' && <span className="text-green-400">Đã ghim vị trí</span>}
        {geoStatus === 'error' && <span className="text-red-400">Dùng vị trí mặc định</span>}
      </div>

      {isPending && (
        <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
          <Loader2 className="w-12 h-12 animate-spin text-[#EB662B] mb-4" />
          <p className="font-semibold text-lg tracking-tight">Đang tải lên...</p>
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
                { id: 'Public', icon: Globe, label: 'Public' },
                { id: 'Friend', icon: Users, label: 'Friends' },
                { id: 'Private', icon: Lock, label: 'Only me' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setPrivacy(opt.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${privacy === opt.id ? 'bg-[#EB662B] text-white shadow-md' : 'bg-black/40 text-white/70 hover:bg-black/60 border border-white/10'}`}
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
                placeholder="Thêm mô tả..."
                className="w-full bg-black/40 backdrop-blur-md border border-white/20 text-white placeholder-white/50 px-5 py-4 rounded-2xl outline-none focus:border-[#EB662B] transition-colors pr-16"
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
                <RefreshCw className="w-5 h-5" /> Chụp lại
              </button>
              <button
                onClick={onSubmit}
                disabled={isPending || geoStatus === 'locating'}
                className="flex-1 py-4 px-4 rounded-2xl bg-[#EB662B] hover:bg-[#d55821] font-bold text-white shadow-[0_8px_20px_rgba(235,102,43,0.4)] transition-all active:scale-95 disabled:opacity-50"
              >
                Đăng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};