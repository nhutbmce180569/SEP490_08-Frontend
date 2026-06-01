import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, ArrowLeft } from "lucide-react";
import { ActionButton } from "../../../components/home/ActionButton";
import { PATH } from "../../../config/routes/route";
import { QuestionnaireWizard } from "../components/QuestionnaireWizard";
import { AiModelsNotReadyBanner } from "../components/AiModelsNotReadyBanner";
import { useQuestionnaire } from "../hooks/useQuestionnaire";
import { useRecommendFromProfile } from "../hooks/useRecommendFromProfile";
import type { TourPreferenceQuestionnaire } from "../types/tourAssistant";

export const AiQuestionnairePage: React.FC = () => {
  const navigate = useNavigate();
  const { data: questionnaire, isLoading, error, refetch } = useQuestionnaire();
  const { submit, isLoading: isSubmitting, modelsNotReady, retryLast } = useRecommendFromProfile();

  const handleSubmit = async (payload: TourPreferenceQuestionnaire) => {
    try {
      const result = await submit(payload);
      navigate(PATH.PUBLIC.AI_RECOMMENDATIONS, { state: result });
    } catch {
      // errors handled in hook
    }
  };

  const questions = questionnaire?.questions ?? [];

  return (
    <div
      className="min-h-screen pb-24"
      style={{
        background: "#F9F7F5",
        fontFamily: "'Sora', 'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      <div className="container mx-auto max-w-3xl px-4 pt-10">
        <Link
          to={PATH.PUBLIC.HOME}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-[#EB662B] mb-6 !no-underline transition-colors"
        >
          <ArrowLeft size={16} /> Về trang chủ
        </Link>

        <div className="mb-8">
          <p
            className="text-[10px] font-black uppercase tracking-[0.2em] mb-2"
            style={{ color: "#EB662B" }}
          >
            AI Tour Assistant
          </p>
          <h1
            className="text-3xl md:text-4xl font-black text-slate-900 mb-3"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            Khảo sát sở thích du lịch
          </h1>
          <p className="text-slate-500 font-medium leading-relaxed max-w-xl">
            Trả lời vài câu hỏi — AI sẽ gợi ý tour phù hợp với nhóm, ngân sách, sở thích
            và công bằng cho mọi thành viên.
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center py-24 gap-4">
            <div
              className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: "#EB662B", borderTopColor: "transparent" }}
            />
            <p className="text-sm font-bold text-slate-400">Đang tải khảo sát...</p>
          </div>
        ) : error ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: "#FFF1F2", border: "1px solid rgba(244,63,94,0.15)" }}
          >
            <p className="text-rose-600 font-bold mb-4">Không thể tải khảo sát</p>
            <ActionButton variant="primary" onClick={() => refetch()}>
              Thử lại
            </ActionButton>
          </div>
        ) : modelsNotReady ? (
          <AiModelsNotReadyBanner
            onRetry={async () => {
              try {
                const result = await retryLast();
                if (result) navigate(PATH.PUBLIC.AI_RECOMMENDATIONS, { state: result });
              } catch {
                // stay on banner
              }
            }}
          />
        ) : questions.length === 0 ? (
          <div className="rounded-2xl p-8 text-center bg-white border border-slate-200">
            <Sparkles size={32} className="mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 font-medium">Không có câu hỏi nào từ server.</p>
          </div>
        ) : (
          <QuestionnaireWizard
            questions={questions}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
};

export default AiQuestionnairePage;
