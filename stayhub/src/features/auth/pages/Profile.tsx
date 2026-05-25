import React, { useState, useContext, useEffect, useRef } from 'react';
import { Camera, Save, Mail, Phone, Calendar, User, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ActionButton } from '../../../components/home/ActionButton';
import { AuthContext } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { useProfile } from '../hooks/useProfile';
import { getImg } from '../../../config/api/api';
import { LoadingOverlay } from '../../../components/home/LoadingOverlay';

export const Profile: React.FC = () => {
  const { user } = useContext(AuthContext);
  const { success, error: showError } = useToast();
  const { handleUpdateProfile, isUpdating } = useProfile();
  const navigate = useNavigate();

  // Lấy role của user để kiểm tra quyền
  const userRoles = Array.isArray(user?.roles)
    ? user?.roles
    : typeof user?.roles === 'string'
    ? [user?.roles]
    : [];
  const upperRoles = userRoles.map((r: string) => r.toUpperCase());

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'Male',
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Đồng bộ thông tin user từ AuthContext vào state của Form
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phoneNumber || '',
        // Cắt lấy chuỗi 'YYYY-MM-DD' để bind chính xác vào input type="date"
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
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        fullName: formData.fullName,
        phoneNumber: formData.phone || null,
        gender: formData.gender || null,
        dateOfBirth: formData.dateOfBirth || null,
        avatarFile: avatarFile
      };
      
      await handleUpdateProfile(payload);
      success('Profile updated successfully!');
    } catch (err: any) {
      showError(err.response?.data?.message || err.message || 'Failed to update profile.');
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm md:p-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900">
            <User className="text-[#EB662B]" /> My Profile
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">Manage your personal details and how we can reach you</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
            <ShieldCheck size={18} />
            Account Verified
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-10 md:flex-row">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-5 md:w-1/3">
          <div className="group relative cursor-pointer">
            <div className="h-44 w-44 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-xl transition-transform duration-300 group-hover:scale-105">
              <img
                src={previewUrl || getImg(user?.avatarUrl) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.fullName.replace(/\s/g, '') || "StayHub"}`}
                alt="Profile Avatar"
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
              className="absolute bottom-2 right-2 flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-[#EB662B] text-white shadow-md transition-transform hover:scale-110 active:scale-95"
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

        {/* Form Fields Section */}
        <div className="flex-1 space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-bold text-slate-700">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition-all focus:border-[#EB662B] focus:bg-white focus:ring-4 focus:ring-[#EB662B]/10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Email Address</label>
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
              <label className="mb-2 block text-sm font-bold text-slate-700">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition-all focus:border-[#EB662B] focus:bg-white focus:ring-4 focus:ring-[#EB662B]/10"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Date of Birth</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition-all focus:border-[#EB662B] focus:bg-white focus:ring-4 focus:ring-[#EB662B]/10"
                />
              </div>
            </div>
            
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-[#EB662B] focus:bg-white focus:ring-4 focus:ring-[#EB662B]/10"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-100 pt-6">
            <ActionButton
              type="submit"
              variant="primary"
              disabled={isUpdating}
              className="gap-2 px-8 py-3.5 text-[15px] shadow-lg shadow-[#EB662B]/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </ActionButton>
          </div>
        </div>
      </form>
      
      <LoadingOverlay isOpen={isUpdating} message="Saving changes..." />
    </div>
  );
};