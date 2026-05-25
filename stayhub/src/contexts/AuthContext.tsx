import React, { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { isTokenValid } from '../utils/jwt';

export interface User {
    id?: string | number;
    email?: string;
    fullName?: string;
    roles?: string | string[];
    avatarUrl?: string;
    [key: string]: any;
}

export interface AuthContextType {
    user: User | null;
    token: string | null;
    refreshToken: string | null; // BỔ SUNG
    login: (newToken: string, newRefreshToken: string, userData: User) => void; // CẬP NHẬT
    logout: () => void;
    updateTokens: (newToken: string, newRefreshToken: string) => void; // BỔ SUNG: Dành cho Axios Interceptor gọi khi refresh thành công
    loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [token, setToken] = useState<string | null>(null);
    const [refreshToken, setRefreshToken] = useState<string | null>(null); // BỔ SUNG
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const login = (newToken: string, newRefreshToken: string, userData: User) => {
        setToken(newToken);
        setRefreshToken(newRefreshToken);
        setUser(userData);
        
        localStorage.setItem('accessToken', newToken);
        localStorage.setItem('refreshToken', newRefreshToken); // LƯU REFRESH TOKEN
        localStorage.setItem('user', JSON.stringify(userData));
    };

    // Hàm này dùng để cập nhật lại token mới khi Interceptor chạy xong mà không cần set lại User
    const updateTokens = (newToken: string, newRefreshToken: string) => {
        setToken(newToken);
        setRefreshToken(newRefreshToken);
        localStorage.setItem('accessToken', newToken);
        localStorage.setItem('refreshToken', newRefreshToken);
    };

    const logout = () => {
        setToken(null);
        setRefreshToken(null);
        setUser(null);
        
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login'; // Reset lại toàn bộ app
    };

    useEffect(() => {
        const savedUser = localStorage.getItem("user");
        const savedToken = localStorage.getItem("accessToken");
        const savedRefreshToken = localStorage.getItem("refreshToken");
        
        if (savedUser && savedToken) {
            // LOGIC MỚI: Nếu Access Token còn hạn HOẶC còn Refresh Token dự phòng -> Vẫn cho phép set state
            if (isTokenValid(savedToken) || savedRefreshToken) {
                try {
                    setUser(JSON.parse(savedUser));
                    setToken(savedToken);
                    setRefreshToken(savedRefreshToken);
                } catch (error) {
                    console.error("Failed to parse user from localStorage", error);
                    logout(); // Lỗi parse JSON thì dọn dẹp luôn
                }
            } else {
                // Chỉ đá văng khi CẢ Access Token và Refresh Token đều không còn/hết hạn
                logout(); 
            }
        }
        setLoading(false);

        // Lắng nghe sự kiện cập nhật Auth từ axiosClient (khi Silent Refresh Token thành công)
        const handleAuthRefreshed = (event: Event) => {
            const customEvent = event as CustomEvent<{ user: User; token: string; refreshToken: string }>;
            setUser(customEvent.detail.user);
            setToken(customEvent.detail.token);
            setRefreshToken(customEvent.detail.refreshToken);
        };
        window.addEventListener("onAuthRefreshed", handleAuthRefreshed);

        return () => window.removeEventListener("onAuthRefreshed", handleAuthRefreshed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <AuthContext.Provider value={{ user, token, refreshToken, login, logout, updateTokens, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
