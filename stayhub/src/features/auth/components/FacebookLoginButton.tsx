import React from 'react';
import FacebookLoginModule from '@greatsumini/react-facebook-login';
import { useToast } from '../../../contexts/ToastContext';
import { useFacebookLogin } from '../hooks/useFacebookLogin'; 

// Fix lỗi tương thích giữa Vite (ESM) và thư viện (CJS)
const FacebookLogin = (FacebookLoginModule as any).default || FacebookLoginModule;

// Lấy App ID từ biến môi trường
const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID || "26819798064321441";

export const FacebookLoginButton: React.FC = () => {
  const { error } = useToast();
  const { handleFacebookLoginSubmit, isSubmitting, serverError } = useFacebookLogin();

  return (
    <div className="flex flex-col items-center justify-start w-full gap-1">
      <FacebookLogin
        appId={FACEBOOK_APP_ID}
        
       onSuccess={(response: any) => {
          console.log('Login Success!', response);
          handleFacebookLoginSubmit({ accessToken: response.accessToken });
        }}
        onFail={(errorResponse: any) => {
          console.error('Login Failed!', errorResponse);
          error('Facebook login failed. Please try again.');
        }}
        onProfileSuccess={(response: any) => {
          console.log('Get Profile Success!', response);
        }}
        className="flex !h-[40px] !w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 outline-none"
      >
        <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" alt="Facebook" className="h-5 w-5" />
        Facebook
      </FacebookLogin>
      
      {isSubmitting && <p className="mt-1 text-sm text-slate-500">Processing login...</p>}
      {serverError && <p className="mt-1 text-sm text-rose-500">{serverError}</p>}
    </div>
  );
};