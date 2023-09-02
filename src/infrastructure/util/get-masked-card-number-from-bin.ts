export const getMaskedCardNumberFromBin = (bin) => {
  const asterisks = '*'.repeat(16 - bin.length);
  const result = bin + asterisks;
  return result;
};
