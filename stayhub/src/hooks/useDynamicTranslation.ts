import { useState, useEffect } from "react";
import { useLocale } from "../contexts/LocaleContext";

// Simple in-memory cache to avoid re-fetching the same string during the session
const translationCache = new Map<string, string>();

export function useDynamicTranslation(text: string | undefined | null, isHtml: boolean = false) {
  const { locale } = useLocale();
  const [translatedText, setTranslatedText] = useState(text || "");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!text) {
      setTranslatedText("");
      return;
    }

    // If current locale is English (the original DB language), just use the text
    if (locale === "en") {
      setTranslatedText(text);
      return;
    }

    // For Vietnamese, we need to translate from 'en' to 'vi'
    if (locale === "vi") {
      const cacheKey = `en-vi:${isHtml ? 'html:' : ''}${text}`;
      
      // Check memory cache first
      if (translationCache.has(cacheKey)) {
        setTranslatedText(translationCache.get(cacheKey)!);
        return;
      }
      
      // Check localStorage cache (for persistence across reloads)
      const storedCache = localStorage.getItem("deepl_cache");
      if (storedCache) {
        try {
          const parsed = JSON.parse(storedCache);
          if (parsed[cacheKey]) {
            translationCache.set(cacheKey, parsed[cacheKey]);
            setTranslatedText(parsed[cacheKey]);
            return;
          }
        } catch (e) {
          // Ignore parse error
        }
      }

      const translate = async () => {
        setIsLoading(true);
        try {
          const apiKey = import.meta.env.VITE_DEEPL_KEY;
          if (!apiKey) {
            console.warn("VITE_DEEPL_KEY is not defined");
            setTranslatedText(text);
            return;
          }
          
          const isFree = apiKey.endsWith(":fx");
          const url = isFree 
            ? "/deepl-api/v2/translate" 
            : "/deepl-api-pro/v2/translate";
          
          const params: any = {
            text: [text],
            source_lang: "EN",
            target_lang: "VI"
          };
          if (isHtml) {
            params.tag_handling = "html";
          }

          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Authorization": `DeepL-Auth-Key ${apiKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(params),
          });
          
          if (!response.ok) {
            // Log response text to understand the exact error from DeepL
            const errText = await response.text();
            throw new Error(`API error ${response.status}: ${response.statusText}. Details: ${errText}`);
          }
          
          const data = await response.json();
          if (data.translations && data.translations.length > 0) {
            const result = data.translations[0].text;
            setTranslatedText(result);
            
            // Save to memory cache
            translationCache.set(cacheKey, result);
            
            // Save to localStorage cache safely
            try {
              const currentCacheStr = localStorage.getItem("deepl_cache");
              const currentCache = currentCacheStr ? JSON.parse(currentCacheStr) : {};
              currentCache[cacheKey] = result;
              
              // Simple limit to prevent localStorage from blowing up (e.g., max 1000 items)
              const keys = Object.keys(currentCache);
              if (keys.length > 1000) {
                // Delete oldest (first) 100 keys
                for (let i = 0; i < 100; i++) {
                   delete currentCache[keys[i]];
                }
              }
              localStorage.setItem("deepl_cache", JSON.stringify(currentCache));
            } catch (e) {
              console.error("Failed to save translation to cache", e);
            }
            
          } else {
            setTranslatedText(text); // Fallback on failure
          }
        } catch (error) {
          console.error("Translation API error", error);
          setTranslatedText(text); // Fallback on error
        } finally {
          setIsLoading(false);
        }
      };

      // Debounce slightly to prevent spamming the API with rapid changes
      const timeoutId = setTimeout(() => {
        translate();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [text, locale]);

  return { translatedText, isLoading };
}
