import zhCN from '@/locales/zh-CN';
import enUS from '@/locales/en-US';
import { flattenMessages } from '@/locales/flatten';

const flatZH = flattenMessages(zhCN);
const flatEN = flattenMessages(enUS);

const FALLBACK_MESSAGE = '系统繁忙，请稍后重试';

export function getErrorMessage(key: string): string {
  const locale = localStorage.getItem('locale') || 'zh-CN';
  const messages = locale === 'en-US' ? flatEN : flatZH;
  return messages[key] || messages['error.unknown'] || FALLBACK_MESSAGE;
}

/**
 * 根据错误码获取 i18n 消息
 * 优先级: error.code.{code} > serverMessage > fallbackKey
 */
export function getAppErrorMessage(
  code: number,
  serverMessage?: string,
  fallbackKey = 'error.unknown',
): string {
  const locale = localStorage.getItem('locale') || 'zh-CN';
  const messages = locale === 'en-US' ? flatEN : flatZH;
  const codeKey = `error.code.${code}`;
  return messages[codeKey] || serverMessage || messages[fallbackKey] || FALLBACK_MESSAGE;
}
