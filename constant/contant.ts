export const formatTime = (seconds?: number) => {
  if (!seconds) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

export const toArabicNumber = (num: number) => {
  const arabicDigits = [
    "٠",
    "١",
    "٢",
    "٣",
    "٤",
    "٥",
    "٦",
    "٧",
    "٨",
    "٩",
  ];
  return num.toString().replace(/\d/g, (d) => arabicDigits[d]);
};
