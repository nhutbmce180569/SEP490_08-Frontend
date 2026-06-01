import React from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Calendar, User, Globe, Users, Lock, ImageOff } from 'lucide-react';
import { useGetUserProfile, useGetUserMoments } from '../hooks/useProfile';
import { getImg } from '../../../../config/api/api';

export const SocialProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { 
    data: profile, 
    isLoading: isProfileLoading, 
    error: profileError 
  } = useGetUserProfile(id || '');

  const { 
    data: moments, 
    isLoading: isMomentsLoading, 
    error: momentsError 
  } = useGetUserMoments(id || '');

  if (isProfileLoading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#0068E0]" />
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-6 py-4 text-sm font-medium text-rose-500 shadow-sm">
          Không thể tải thông tin người dùng lúc này.
        </div>
      </div>
    );
  }

  const avatarInitial = profile.fullName ? profile.fullName.charAt(0).toUpperCase() : '?';

  const renderPrivacyBadge = (privacy: string) => {
    switch(privacy) {
      case 'Public':
        return <div className="flex items-center gap-1 rounded-full bg-blue-100/90 px-2.5 py-1 text-[10px] font-bold text-blue-700 shadow-sm backdrop-blur-md"><Globe className="h-3 w-3" /> Public</div>;
      case 'Friend':
        return <div className="flex items-center gap-1 rounded-full bg-emerald-100/90 px-2.5 py-1 text-[10px] font-bold text-emerald-700 shadow-sm backdrop-blur-md"><Users className="h-3 w-3" /> Friend</div>;
      case 'Private':
        return <div className="flex items-center gap-1 rounded-full bg-slate-100/90 px-2.5 py-1 text-[10px] font-bold text-slate-700 shadow-sm backdrop-blur-md"><Lock className="h-3 w-3" /> Private</div>;
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      {/* --- PHẦN HEADER THÔNG TIN PROFILE --- */}
      <div className="mb-10 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="h-32 w-full bg-gradient-to-r from-blue-100 to-[#0068E0]/20 sm:h-48"></div>
        <div className="relative px-6 pb-8 sm:px-10">
          <div className="relative -mt-16 mb-4 flex items-end sm:-mt-20">
            <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white shadow-md sm:h-40 sm:w-40">
              {profile.avatarUrl ? (
                <img 
                  src={getImg(profile.avatarUrl)} 
                  alt={profile.fullName} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-100 text-4xl font-black text-slate-400">
                  {avatarInitial}
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">{profile.fullName}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-5 text-sm font-medium text-slate-500">
              {profile.gender && (
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4 text-slate-400" />
                  {profile.gender}
                </div>
              )}
              {profile.createdAt && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  Tham gia từ {new Date(profile.createdAt).toLocaleDateString('vi-VN')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- PHẦN BODY: DANH SÁCH MOMENTS --- */}
      <div>
        <h2 className="mb-6 text-xl font-bold text-slate-900">Travel Moments</h2>
        
        {isMomentsLoading ? (
          <div className="flex h-40 items-center justify-center">
             <Loader2 className="h-6 w-6 animate-spin text-[#0068E0]" />
          </div>
        ) : momentsError ? (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-center text-sm font-medium text-rose-500">
            Có lỗi xảy ra khi tải danh sách khoảnh khắc.
          </div>
        ) : !moments || moments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
            <ImageOff className="mb-4 h-12 w-12 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">Chưa có khoảnh khắc nào</p>
            <p className="mt-1 text-xs text-slate-400">Người dùng chưa đăng tải khoảnh khắc hoặc bài viết đã bị giới hạn quyền riêng tư.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {moments.map((moment) => (
              <div key={moment.id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                  <img 
                    src={getImg(moment.imageUrl)} 
                    alt={moment.caption || "Travel moment"} 
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute right-3 top-3 z-10">
                    {renderPrivacyBadge(moment.privacy)}
                  </div>
                  
                  {/* Overlay Gradient hiển thị caption */}
                  {moment.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12 transition-opacity">
                      <p className="line-clamp-2 text-sm font-medium leading-relaxed text-white drop-shadow-sm">{moment.caption}</p>
                      {moment.createdAt && (
                        <p className="mt-1.5 text-[11px] font-bold text-white/60">
                          {new Date(moment.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Fallback layout nếu không muốn hiển thị caption đè lên ảnh */}
                {!moment.caption && moment.createdAt && (
                  <div className="px-4 py-3">
                    <p className="text-xs font-semibold text-slate-400">
                      {new Date(moment.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};