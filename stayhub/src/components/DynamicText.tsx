import React from "react";
import { useDynamicTranslation } from "../hooks/useDynamicTranslation";

interface DynamicTextProps {
  text: string;
  isHtml?: boolean;
}

export const DynamicText: React.FC<DynamicTextProps> = ({ text, isHtml = false }) => {
  const { translatedText, isLoading } = useDynamicTranslation(text, isHtml);

  if (!text) return null;

  if (isLoading) {
    return (
      <span className="animate-pulse bg-slate-200/50 text-transparent rounded inline-block w-3/4">
        Loading...
      </span>
    );
  }

  if (isHtml) {
    return <span dangerouslySetInnerHTML={{ __html: translatedText }} />;
  }

  return <>{translatedText}</>;
};
