import React, { useState, useContext, useEffect, useRef } from 'react';

import { useNavigate } from 'react-router-dom';
import { Camera, Save, Mail, Phone, Calendar, User, ShieldCheck, Globe } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { ActionButton } from '../../../components/home/ActionButton';
import { AuthContext } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { useProfile } from '../hooks/useProfile';
import { getImg } from '../../../config/api/api';
import { LoadingOverlay } from '../../../components/home/LoadingOverlay';
import { useTranslation } from '../../../contexts/LocaleContext';
import { ImageCropModal } from '../../../components/profile/ImageCropModal';

export const Profile: React.FC = () => {
  const { t } = useTranslation();

  const navigate = useNavigate();

  const location = useLocation();

  const { user } = useContext(AuthContext);
  const { success, error: showError } = useToast();
  const { handleUpdateProfile, isUpdating } = useProfile();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'Male',
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phoneNumber || '',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
        gender: user.gender || 'Male',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setTempImageSrc(imageUrl);
      setIsCropModalOpen(true);
    }
    // Reset file input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropComplete = (croppedFile: File, croppedUrl: string) => {
    setAvatarFile(croppedFile);
    setPreviewUrl(croppedUrl);
    setIsCropModalOpen(false);
    setTempImageSrc(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.phone || formData.phone.trim() === '') {
      showError(t('errors.phoneRequired'));
      return;
    }

    const validateForm = () => {
      if (!formData.fullName.trim()) return t('auth.fullNameRequired');
      // Regex for FullName to support Vietnamese (equivalent to ^[\p{L}0-9\s]+$ in C#)
      const fullNameRegex = /^[\p{L}0-9\s]+$/u;
      if (!fullNameRegex.test(formData.fullName)) return t('errors.fullNameNoSpecialChars');
      return null;
    };

    const validationError = validateForm();
    if (validationError) {
      showError(validationError);
      return;
    }
    
    try {
      const payload = {
        fullName: formData.fullName,
        phoneNumber: formData.phone || null,
        gender: formData.gender || null,
        dateOfBirth: formData.dateOfBirth || null,
        avatarFile: avatarFile
      };
      
      await handleUpdateProfile(payload);
      success(t('auth.profileUpdated'));
    } catch (err: any) {
      if (err.response?.status === 400 && err.response.data?.errors) {
        const firstErrorKey = Object.keys(err.response.data.errors)[0];
        const firstErrorMsg = err.response.data.errors[firstErrorKey][0];
        if (firstErrorMsg === "FullNameCannotContainSpecialCharacters") {
           showError(t('errors.fullNameNoSpecialChars'));
        } else {
           showError(firstErrorMsg);
        }
      } else {
        const msg = err.response?.data?.message;
        if (msg === "PhoneNumberExists") {
          showError(t('errors.phoneNumberExists'));
        } else {
          showError(msg || err.message || t('auth.profileUpdateFailed'));
        }
      }
    }
  };
  const isDashboard = location.pathname.includes('/manager') || location.pathname.includes('/staff') || location.pathname.includes('/admin');

  return (
    <div className={isDashboard ? "glass-card p-6 md:p-8" : ""}>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900">
            <User className="text-brand" /> {t('auth.myProfile')}
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">{t('auth.profileSubtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          {!location.pathname.includes('/staff') && (
            <button
              type="button"
              onClick={() => navigate(`/social/profile/${user?.id || user?.Id}`)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
            >
              <Globe size={16} />
              <span>{t('auth.viewProfile') || 'View Profile'}</span>
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-10 md:flex-row">
        <div className="flex flex-col items-center gap-5 md:w-1/3">
          <div className="group relative cursor-pointer">
            <div className="h-44 w-44 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-xl transition-transform duration-300 group-hover:scale-105">
              <img
                src={previewUrl || getImg(user?.avatarUrl) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.fullName.replace(/\s/g, '') || "StayHub"}`}
                alt={t('auth.avatar')}
                className="h-full w-full object-cover"
              />
            </div>
            <div 
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-8 w-8 text-white" />
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-2 right-2 flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-brand text-white shadow-md transition-transform hover:scale-110 active:scale-95"
            >
              <Camera size={20} />
            </button>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
            />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-slate-900">{formData.fullName}</h3>
            <p className="mt-1 text-sm font-medium text-slate-500">{formData.email}</p>
          </div>
        </div>

        <div className="flex-1 space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-bold text-slate-700">{t('auth.fullName')}</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition-all focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10"
                  required
                  maxLength={100}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">{t('errors.emailAddress')}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-100 py-3.5 pl-11 pr-4 text-sm font-medium text-slate-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">{t('auth.phoneNumber')}</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition-all focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10"
                  required
                  maxLength={15}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">{t('common.dateOfBirth')}</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition-all focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10"
                />
              </div>
            </div>
            
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">{t('common.gender')}</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10"
              >
                <option value="Male">{t('common.male')}</option>
                <option value="Female">{t('common.female')}</option>
                <option value="Other">{t('common.other')}</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-100 pt-6">
            <ActionButton
              type="submit"
              variant="primary"
              disabled={isUpdating}
              className="gap-2 px-8 py-3.5 text-[15px] shadow-lg shadow-brand/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {isUpdating ? t('auth.savingChanges') : t('common.saveChanges')}
            </ActionButton>
          </div>
        </div>
      </form>
      
      <LoadingOverlay isOpen={isUpdating} message={t('auth.savingChanges')} />

      {tempImageSrc && (
        <ImageCropModal
          isOpen={isCropModalOpen}
          imageSrc={tempImageSrc}
          onClose={() => setIsCropModalOpen(false)}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
};
