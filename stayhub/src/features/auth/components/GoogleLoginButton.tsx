import React from 'react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useGoogleLogin } from '../hooks/useGoogleLogin';
import { useToast } from '../../../contexts/ToastContext';

// Lấy Client ID từ biến môi trường
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "1007115094738-i4re3khhtf8hlvnv1a5u57680il4p6ba.apps.googleusercontent.com";

export const GoogleLoginButton: React.FC = () => {
  const { handleGoogleLoginSubmit, isSubmitting, serverError } = useGoogleLogin();
  const { error } = useToast();

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <div className="flex flex-col items-center justify-start w-full gap-1">
        <GoogleLogin
          theme="outline"
          size="large"
          onSuccess={(credentialResponse) => {
            if (credentialResponse.credential) {
              handleGoogleLoginSubmit({ idToken: credentialResponse.credential });
            }
          }}
          onError={() => {
            console.error('Google login failed');
            error('Google login failed. Please try again.');
          }}
        />
        {isSubmitting && <p className="mt-1 text-sm text-slate-500">Processing login...</p>}
        {serverError && <p className="mt-1 text-sm text-rose-500">{serverError}</p>}
      </div>
    </GoogleOAuthProvider>
  );
};