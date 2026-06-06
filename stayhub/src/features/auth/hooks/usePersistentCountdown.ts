import { useCallback, useEffect, useState } from "react";

const OTP_COOLDOWN_PREFIX = "stayhub:otp-cooldown:";

const getRemainingSeconds = (
  storageKey: string,
  durationSeconds: number,
) => {
  const storedSentAt = window.localStorage.getItem(storageKey);
  const sentAt = storedSentAt ? Number(storedSentAt) : Number.NaN;

  if (!Number.isFinite(sentAt)) {
    return 0;
  }

  const remainingMilliseconds =
    durationSeconds * 1000 - (Date.now() - sentAt);
  const remainingSeconds = Math.max(
    0,
    Math.ceil(remainingMilliseconds / 1000),
  );

  if (remainingSeconds === 0) {
    window.localStorage.removeItem(storageKey);
  }

  return remainingSeconds;
};

export const getOtpCooldownStorageKey = (email: string) =>
  `${OTP_COOLDOWN_PREFIX}${email.trim().toLowerCase()}`;

export const usePersistentCountdown = (
  storageKey: string,
  durationSeconds: number,
) => {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    getRemainingSeconds(storageKey, durationSeconds),
  );

  const syncCountdown = useCallback(() => {
    setRemainingSeconds(getRemainingSeconds(storageKey, durationSeconds));
  }, [durationSeconds, storageKey]);

  const startCountdown = useCallback(
    (seconds = durationSeconds) => {
      const normalizedSeconds = Math.min(
        durationSeconds,
        Math.max(0, Math.ceil(seconds)),
      );
      const sentAt =
        Date.now() - (durationSeconds - normalizedSeconds) * 1000;

      window.localStorage.setItem(storageKey, String(sentAt));
      setRemainingSeconds(normalizedSeconds);
    },
    [durationSeconds, storageKey],
  );

  useEffect(() => {
    const initialSync = window.setTimeout(syncCountdown, 0);
    const timer = window.setInterval(syncCountdown, 1000);
    const handleStorage = (event: StorageEvent) => {
      if (event.key === storageKey) {
        syncCountdown();
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.clearTimeout(initialSync);
      window.clearInterval(timer);
      window.removeEventListener("storage", handleStorage);
    };
  }, [storageKey, syncCountdown]);

  return {
    remainingSeconds,
    isActive: remainingSeconds > 0,
    startCountdown,
  };
};
