import zhCN from './zh-CN';
import enUS from './en-US';
import { flattenMessages } from './flatten';

export const messages: Record<string, Record<string, string>> = {
  'zh-CN': flattenMessages(zhCN),
  'en-US': flattenMessages(enUS),
};
