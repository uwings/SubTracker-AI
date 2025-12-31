
import { PresetProduct, BillingCycle } from '../../types';

export const aiChatTools: PresetProduct[] = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    brandColor: '#10a37f',
    category: 'AI 助手',
    plans: [
      { label: 'Plus 会员', cost: 20, currency: 'USD', cycle: BillingCycle.MONTHLY },
      { label: 'Plus (年付)', cost: 200, currency: 'USD', cycle: BillingCycle.YEARLY }
    ]
  },
  {
    id: 'claude',
    name: 'Claude',
    brandColor: '#d97757',
    category: 'AI 助手',
    plans: [
      { label: 'Pro 会员', cost: 20, currency: 'USD', cycle: BillingCycle.MONTHLY }
    ]
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    brandColor: '#20b2aa',
    category: 'AI 搜索',
    plans: [
      { label: 'Pro (月付)', cost: 20, currency: 'USD', cycle: BillingCycle.MONTHLY },
      { label: 'Pro (年付)', cost: 200, currency: 'USD', cycle: BillingCycle.YEARLY }
    ]
  },
  {
    id: 'kimi',
    name: 'Kimi 智能助手',
    brandColor: '#3d3d3d',
    category: 'AI 助手',
    plans: [
      { label: '打赏方案 A', cost: 9.9, currency: 'CNY', cycle: BillingCycle.ONE_TIME },
      { label: '打赏方案 B', cost: 49, currency: 'CNY', cycle: BillingCycle.ONE_TIME }
    ]
  }
];

export const aiCreativeTools: PresetProduct[] = [
  {
    id: 'midjourney',
    name: 'Midjourney',
    brandColor: '#6366f1',
    category: 'AI 绘图',
    plans: [
      { label: 'Basic Plan', cost: 10, currency: 'USD', cycle: BillingCycle.MONTHLY },
      { label: 'Standard Plan', cost: 30, currency: 'USD', cycle: BillingCycle.MONTHLY },
      { label: 'Pro Plan', cost: 60, currency: 'USD', cycle: BillingCycle.MONTHLY }
    ]
  },
  {
    id: 'flux',
    name: 'Flux AI',
    brandColor: '#000000',
    category: 'AI 绘图',
    plans: [
      { label: 'Pro Monthly', cost: 20, currency: 'USD', cycle: BillingCycle.MONTHLY }
    ]
  },
  {
    id: 'runway',
    name: 'Runway',
    brandColor: '#000000',
    category: 'AI 视频',
    plans: [
      { label: 'Standard', cost: 15, currency: 'USD', cycle: BillingCycle.MONTHLY },
      { label: 'Pro', cost: 35, currency: 'USD', cycle: BillingCycle.MONTHLY }
    ]
  },
  {
    id: 'suno',
    name: 'Suno AI',
    brandColor: '#f59e0b',
    category: 'AI 音乐',
    plans: [
      { label: 'Pro Plan', cost: 10, currency: 'USD', cycle: BillingCycle.MONTHLY },
      { label: 'Premier Plan', cost: 30, currency: 'USD', cycle: BillingCycle.MONTHLY }
    ]
  }
];
