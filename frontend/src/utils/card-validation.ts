export const isValidLuhn = (value: string): boolean => {
  const normalized = value.replace(/\s+/g, '');

  if (!/^\d+$/.test(normalized)) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;

  for (let i = normalized.length - 1; i >= 0; i -= 1) {
    let digit = Number(normalized[i]);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
};
