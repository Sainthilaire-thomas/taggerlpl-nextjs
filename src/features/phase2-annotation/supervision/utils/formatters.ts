// supervision/utils/formatters.ts

export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
};

export const truncateText = (text: string, maxLength: number = 100): string => {
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};
