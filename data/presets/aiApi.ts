
import { PresetProduct, BillingCycle } from '../../types';

export const aiApiServices: PresetProduct[] = [
  {
    id: 'openai-api',
    name: 'OpenAI API',
    brandColor: '#74aa9c',
    category: '开发/API',
    plans: [
      { label: '充值 $5', cost: 5, currency: 'USD', cycle: BillingCycle.ONE_TIME },
      { label: '充值 $20', cost: 20, currency: 'USD', cycle: BillingCycle.ONE_TIME },
      { label: '充值 $50', cost: 50, currency: 'USD', cycle: BillingCycle.ONE_TIME },
      { label: '充值 $100', cost: 100, currency: 'USD', cycle: BillingCycle.ONE_TIME }
    ]
  },
  {
    id: 'deepseek-api',
    name: 'DeepSeek API',
    brandColor: '#3b82f6',
    category: '开发/API',
    plans: [
      { label: '充值 10元', cost: 10, currency: 'CNY', cycle: BillingCycle.ONE_TIME },
      { label: '充值 50元', cost: 50, currency: 'CNY', cycle: BillingCycle.ONE_TIME },
      { label: '充值 100元', cost: 100, currency: 'CNY', cycle: BillingCycle.ONE_TIME },
      { label: '充值 200元', cost: 200, currency: 'CNY', cycle: BillingCycle.ONE_TIME }
    ]
  },
  {
    id: 'anthropic-api',
    name: 'Anthropic API',
    brandColor: '#d97757',
    category: '开发/API',
    plans: [
      { label: '充值 $20', cost: 20, currency: 'USD', cycle: BillingCycle.ONE_TIME },
      { label: '充值 $100', cost: 100, currency: 'USD', cycle: BillingCycle.ONE_TIME }
    ]
  },
  {
    id: 'google-ai-studio',
    name: 'Gemini API',
    brandColor: '#4285f4',
    category: '开发/API',
    plans: [
      { label: 'Pay-as-you-go', cost: 0, currency: 'USD', cycle: BillingCycle.PHASED }
    ]
  }
];

export const aiCourses: PresetProduct[] = [
  {
    id: 'deeplearning-ai',
    name: 'DeepLearning.AI',
    brandColor: '#ffcc00',
    category: 'AI 课程',
    plans: [
      { label: '专项课程月订阅', cost: 49, currency: 'USD', cycle: BillingCycle.MONTHLY }
    ]
  },
  {
    id: 'udemy-ai',
    name: 'Udemy AI Course',
    brandColor: '#a435f0',
    category: 'AI 课程',
    plans: [
      { label: '单次买断课程 (平均价)', cost: 19.9, currency: 'USD', cycle: BillingCycle.ONE_TIME }
    ]
  }
];
