import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "../../../contexts/LocaleContext";
import { getTrendPrediction } from "../services/trend.service";
import { formatVnd } from "../utils/formatters";
import { Calendar, TrendingUp, MapPin, Star, Clock, Cloud, Users, BarChart3, Percent, Heart, Banknote, Loader2 } from "lucide-react";

export const TrendPredictionPage: React.FC = () => {
  const { t } = useTranslation();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["trendPrediction", selectedMonth, selectedYear],
    queryFn: () => getTrendPrediction(selectedMonth, selectedYear),
  });

  const handleApply = () => {
    refetch();
  };

  return (
    <div className="page-container py-8 space-y-8 animate-in fade-in duration-500">
      {/* Header section with Glassmorphism */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-900 p-8 text-white shadow-xl">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-brand-400/20 blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 mb-4 backdrop-blur-md">
              <TrendingUp className="h-4 w-4 text-brand-100" />
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-50">AI Forecast</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              Tour Trends Predictor
            </h1>
            <p className="mt-3 max-w-2xl text-brand-100 text-lg">
              Discover which tours are likely to become hot next based on user interactions, reviews, and seasonality.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/10 p-2 rounded-2xl backdrop-blur-md border border-white/20">
            <div className="flex flex-col gap-1 px-3 py-1">
              <label className="text-xs font-medium text-brand-200">Month</label>
              <select 
                className="bg-transparent text-white font-bold outline-none cursor-pointer [&>option]:text-slate-800"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                ))}
              </select>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="flex flex-col gap-1 px-3 py-1">
              <label className="text-xs font-medium text-brand-200">Year</label>
              <select 
                className="bg-transparent text-white font-bold outline-none cursor-pointer [&>option]:text-slate-800"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {[currentDate.getFullYear(), currentDate.getFullYear() + 1].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button 
              onClick={handleApply}
              className="ml-2 rounded-xl bg-white text-brand-700 px-6 py-3 font-bold hover:bg-brand-50 transition-all shadow-lg hover:shadow-xl active:scale-95"
            >
              Analyze
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
          Failed to load trend predictions. Please try again.
        </div>
      )}

      {data && (
        <div className="space-y-8">
          {/* AI Evidences Section */}
          <div>
            <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
              <Calendar className="h-6 w-6 text-brand-500" /> 
              Căn cứ Phân tích từ AI ({data.targetMonth}/{data.targetYear})
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {data.evidences?.map((evidence, idx) => (
                <div key={idx} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                      {evidence.type === 'weather' ? <Cloud className="h-5 w-5" /> : 
                       evidence.type === 'interaction' ? <Users className="h-5 w-5" /> : 
                       <TrendingUp className="h-5 w-5" />}
                    </div>
                    <h3 className="font-bold text-slate-800 line-clamp-2">{evidence.title}</h3>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {evidence.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl bg-gradient-to-r from-brand-50 to-blue-50 p-6 border border-brand-100">
              <p className="text-slate-800 font-medium">
                <span className="font-bold text-brand-700 uppercase tracking-wider mr-2">Kết luận AI:</span> 
                {data.reason}
              </p>
            </div>

            {/* AI Algorithm Explanation */}
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <details className="group">
                <summary className="flex cursor-pointer items-center justify-between font-bold text-slate-700 marker:content-none">
                  <div className="flex items-center gap-2">
                    <Cloud className="h-5 w-5 text-slate-500" />
                    <span>Giải thích thuật toán: Business Viability Score (BVS)</span>
                  </div>
                  <span className="transition group-open:rotate-180">
                    <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <div className="mt-4 text-sm text-slate-600 leading-relaxed border-t border-slate-200 pt-4">
                  <p className="mb-3">Mô hình AI dự báo sử dụng chỉ số tổng hợp <strong>BVS (Business Viability Score)</strong> thang điểm 100, được tối ưu hóa cho doanh thu và lợi nhuận. Thuật toán phân tích 5 chiều dữ liệu lớn:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Hiệu suất lịch sử (Trọng số 35%):</strong> Khả năng lấp đầy (Occupancy Rate) của tour này vào cùng kỳ năm ngoái.</li>
                    <li><strong>Nhu cầu Wishlist (Trọng số 25%):</strong> Lượt người dùng chủ động thêm tour vào danh sách yêu thích trong 14 ngày qua (Purchase Intent).</li>
                    <li><strong>Khả năng chốt đơn (Trọng số 25%):</strong> Tỷ lệ chuyển đổi (Conversion) dựa trên chất lượng tour (Rating) và lịch sử hành vi.</li>
                    <li><strong>Lợi thế cạnh tranh giá (Trọng số 15%):</strong> Mức độ hấp dẫn về giá so với các đối thủ cùng phân khúc trong cùng thời điểm.</li>
                    <li><strong>Rủi ro hoàn hủy (Trừ điểm phạt tối đa 20%):</strong> AI tự động hạ rank các tour dài ngày hoặc giá quá cao có tỷ lệ hủy (Cancellation Rate) lịch sử lớn để bảo vệ dòng tiền.</li>
                  </ul>
                  <div className="mt-4 p-3 bg-slate-100 rounded-lg font-mono text-xs text-slate-700">
                    BVS = (Occupancy * 0.35) + (Intent * 0.25) + (Conversion * 0.25) + (PriceIndex * 0.15) - (CancelRiskPenalty)
                  </div>
                </div>
              </details>
            </div>
          </div>

          {/* Provincial Heatmap Grid */}
          <div className="mt-8">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-brand-500" />
              Bản đồ Xu hướng Toàn quốc (Provincial Heatmap)
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {data.provinceForecasts?.map((prov, i) => (
                <div key={i} className={`p-3 rounded-xl border flex flex-col justify-center items-center text-center shadow-sm transition-all hover:scale-105 ${prov.hotnessScore > 80 ? 'bg-red-50 border-red-200' : prov.hotnessScore > 50 ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-xs font-bold text-slate-700 mb-1">{prov.province}</span>
                  <span className={`text-lg font-black ${prov.hotnessScore > 80 ? 'text-red-600' : prov.hotnessScore > 50 ? 'text-orange-500' : 'text-slate-500'}`}>
                    {prov.hotnessScore}%
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 mt-1">{prov.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Predicted Tours Grid */}
          <div>
            <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-brand-500" /> 
              Top Predicted Hot Tours
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {data.predictedTours.map((tour, index) => (
                <div 
                  key={tour.id} 
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="absolute top-4 left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-md text-lg font-black text-brand-600 border border-white">
                    #{index + 1}
                  </div>
                  <div className="absolute top-4 right-4 z-10 rounded-full bg-gradient-to-r from-orange-400 to-red-500 px-3 py-1 text-xs font-bold text-white shadow-md flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Score {tour.trendScore}
                  </div>
                  
                  <div className="relative h-48 overflow-hidden bg-slate-100">
                    {tour.imageUrl ? (
                      <img 
                        src={tour.imageUrl} 
                        alt={tour.name} 
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-200 text-slate-400">
                        <MapPin className="h-8 w-8" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <div className="flex items-center gap-1 text-sm font-medium text-slate-200 mb-1">
                        <MapPin className="h-3 w-3" /> {tour.city || "Unknown City"}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h4 className="line-clamp-2 text-lg font-bold text-slate-800 mb-3 group-hover:text-brand-600 transition-colors">
                      {tour.name}
                    </h4>
                    
                    <div className="mt-auto grid grid-cols-2 gap-3 text-xs mb-3">
                      <div className="flex flex-col gap-1 rounded-lg bg-slate-50 p-2 border border-slate-100">
                        <span className="text-slate-500 uppercase font-semibold text-[10px]">Lấp đầy lịch sử</span>
                        <div className="flex items-center gap-1 font-bold text-slate-800">
                          <BarChart3 className="h-3.5 w-3.5 text-blue-500" />
                          {tour.occupancyRate}%
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 rounded-lg bg-slate-50 p-2 border border-slate-100">
                        <span className="text-slate-500 uppercase font-semibold text-[10px]">Tỷ lệ chốt đơn</span>
                        <div className="flex items-center gap-1 font-bold text-slate-800">
                          <Percent className="h-3.5 w-3.5 text-green-500" />
                          {tour.conversionRate}%
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 rounded-lg bg-slate-50 p-2 border border-slate-100">
                        <span className="text-slate-500 uppercase font-semibold text-[10px]">Lượt Wishlist</span>
                        <div className="flex items-center gap-1 font-bold text-slate-800">
                          <Heart className="h-3.5 w-3.5 text-red-400" />
                          {tour.wishlistAdds} lượt
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 rounded-lg bg-slate-50 p-2 border border-slate-100">
                        <span className="text-slate-500 uppercase font-semibold text-[10px]">Dự báo d.thu</span>
                        <div className="flex items-center gap-1 font-bold text-brand-600">
                          <Banknote className="h-3.5 w-3.5" />
                          {tour.projectedRevenue ? formatVnd(tour.projectedRevenue) : "N/A"}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        <span className="font-bold text-slate-700 text-sm">{tour.averageStar?.toFixed(1) || "New"}</span>
                        <span className="text-slate-400 text-xs">({tour.reviewCount})</span>
                      </div>
                      <button className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-700 shadow-md">
                        Lên Kế Hoạch
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
