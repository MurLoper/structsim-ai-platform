const toSafeInt = (value: unknown, fallback = 0): number => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
};

export const estimateRoundsFromOptParams = (
  optParams: Record<string, unknown> | undefined
): number => {
  if (!optParams) return 0;

  const algType = toSafeInt(optParams.algType, 2);

  if (algType === 2 || algType === 5) {
    const doeData = Array.isArray(optParams.doeParamData) ? optParams.doeParamData : [];
    return doeData.length;
  }

  if (algType !== 1) return 0;

  const batchSizeType = toSafeInt(optParams.batchSizeType, 1);
  const maxIter = Math.max(toSafeInt(optParams.maxIter, 1), 0);

  if (batchSizeType === 2) {
    const custom = Array.isArray(optParams.customBatchSize) ? optParams.customBatchSize : [];
    let total = 0;
    for (let idx = 1; idx <= maxIter; idx += 1) {
      let value = 0;
      for (const item of custom) {
        const row = item as Record<string, unknown>;
        const start = toSafeInt(row.startIndex, 0);
        const end = toSafeInt(row.endIndex, 0);
        if (start <= idx && idx <= end) {
          value = Math.max(toSafeInt(row.value, 0), 0);
          break;
        }
      }
      total += value;
    }
    return total;
  }

  const batchSize = Array.isArray(optParams.batchSize) ? optParams.batchSize : [];
  const values = batchSize.map(item => {
    const row = item as Record<string, unknown>;
    return Math.max(toSafeInt(row.value, 0), 0);
  });

  if (maxIter <= 0 || values.length === 0) return 0;
  if (values.length >= maxIter) return values.slice(0, maxIter).reduce((a, b) => a + b, 0);
  if (values.length === 1) return values[0] * maxIter;

  return values.reduce((a, b) => a + b, 0) + values[values.length - 1] * (maxIter - values.length);
};

export const estimateRoundsFromConditions = (
  conditions: Array<Record<string, unknown>>
): number => {
  return conditions.reduce((total, cond) => {
    const params = cond.params as Record<string, unknown> | undefined;
    const optParams = params?.optParams as Record<string, unknown> | undefined;
    return total + estimateRoundsFromOptParams(optParams);
  }, 0);
};
