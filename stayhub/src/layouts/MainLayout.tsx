import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './home/Header';
import Footer from './home/Footer';


export const MainLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header cố định ở trên cùng */}
      <Header />
      
      {/* Phần nội dung chính: 
          - flex-grow để đẩy Footer xuống đáy trang
          - padding-top để nội dung không bị Header (sticky) che mất 
      */}
      <main className="flex-grow bg-white">
        {/* Outlet là nơi React Router sẽ render các page con (Home, Tours, v.v.) */}
        <Outlet />
      </main>
      
      <Footer />
    </div>
  );
};