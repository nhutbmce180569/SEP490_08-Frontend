import React, { useEffect, useState } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { ActionButton } from "../../../components/home/ActionButton";

interface Props {
  onRetry: () => void;
}

export const AiModelsNotReadyBanner: React.FC<Props> = ({ onRetry }) => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown <= 0) {
      onRetry();
      setCountdown(5);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, onRetry]);

  return (
    <div className="glass-card rounded-2xl p-7 text-center">
      <div className="mb-4 flex justify-center">
        <span className="flex h-14 w-14 animate-pulse items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <AlertTriangle size={26} />
        </span>
      </div>
      <h3 className="travel-heading mb-2 text-lg text-navy">AI is warming up…</h3>
      <p className="mx-auto mb-6 max-w-sm text-sm font-medium text-slate-500">
        The recommendation model is starting. Will retry automatically in{" "}
        <span className="font-bold text-navy">{countdown}s</span>.
      </p>

      <div className="mb-6 grid grid-cols-3 gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse overflow-hidden rounded-xl border border-slate-200"
          >
            <div className="aspect-[4/3] bg-slate-200" />
            <div className="space-y-2 p-3">
              <div className="h-2.5 w-3/4 rounded bg-slate-200" />
              <div className="h-2.5 w-1/2 rounded bg-slate-200" />
            </div>
          </div>
        ))}
      </div>

      <ActionButton
        variant="primary"
        onClick={onRetry}
        className="!px-6 inline-flex gap-2"
      >
        <RefreshCw size={15} />
        Retry now
      </ActionButton>
    </div>
  );
};
