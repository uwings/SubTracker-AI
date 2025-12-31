
import { aiChatTools, aiCreativeTools } from './aiTools';
import { aiApiServices, aiCourses } from './aiApi';

export const ALL_PRESETS = [
  { label: 'AI 助手', products: aiChatTools },
  { label: 'AI 创意创作', products: aiCreativeTools },
  { label: 'API & 开发者', products: aiApiServices },
  { label: 'AI 学习与课程', products: aiCourses }
];
