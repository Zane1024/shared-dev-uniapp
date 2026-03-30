/**
 * 格式化金额为千分位格式
 * @param amount 金额数字
 * @param decimals 小数位数，默认2位
 * @returns 格式化后的金额字符串
 */
export const formatMoney = (amount: number, decimals: number = 2): string => {
  if (!amount && amount !== 0) return '0.00';
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * 格式化日期为短格式 MM-DD
 * @param dateStr 日期字符串或时间戳
 * @returns 格式化后的日期字符串 MM-DD
 */
export const formatDateShort = (dateStr: string | number): string => {
  const date = new Date(dateStr);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}-${day}`;
};

/**
 * 格式化日期为完整格式 YYYY-MM-DD
 * @param dateStr 日期字符串或时间戳
 * @returns 格式化后的日期字符串 YYYY-MM-DD
 */
export const formatDate = (dateStr: string | number): string => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
