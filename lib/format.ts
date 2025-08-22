import { parseUnits, formatUnits } from 'viem';

export const USDC_DECIMALS = 6;

export function toMicros(strAmount: string) {
  return parseUnits(strAmount, USDC_DECIMALS);
}

export function microsToDisplay(micros: bigint) {
  return Number(formatUnits(micros, USDC_DECIMALS)).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}
