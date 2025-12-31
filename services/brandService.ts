
/**
 * 品牌信息独立服务 (Brand Service)
 * 职责：根据产品名称或网址，自动匹配高质量 Logo 和官方网站
 */

interface BrandInfo {
  logoUrl?: string;
  websiteUrl?: string;
}

// 常见品牌预设映射，确保常用 App 的 Logo 质量
const BRAND_PRESETS: Record<string, BrandInfo> = {
  'netflix': { websiteUrl: 'https://www.netflix.com', logoUrl: 'https://www.netflix.com/favicon.ico' },
  'spotify': { websiteUrl: 'https://www.spotify.com', logoUrl: 'https://www.spotify.com/favicon.ico' },
  'chatgpt': { websiteUrl: 'https://chat.openai.com', logoUrl: 'https://openai.com/favicon.ico' },
  'youtube': { websiteUrl: 'https://www.youtube.com', logoUrl: 'https://www.youtube.com/favicon.ico' },
  'icloud': { websiteUrl: 'https://www.icloud.com', logoUrl: 'https://www.apple.com/favicon.ico' },
  'apple music': { websiteUrl: 'https://music.apple.com', logoUrl: 'https://www.apple.com/favicon.ico' },
  'disney+': { websiteUrl: 'https://www.disneyplus.com', logoUrl: 'https://www.disneyplus.com/favicon.ico' },
  'midjourney': { websiteUrl: 'https://www.midjourney.com', logoUrl: 'https://www.midjourney.com/favicon.ico' },
  'notion': { websiteUrl: 'https://www.notion.so', logoUrl: 'https://www.notion.so/images/favicon.ico' },
  'adobe': { websiteUrl: 'https://www.adobe.com', logoUrl: 'https://www.adobe.com/favicon.ico' },
  'microsoft 365': { websiteUrl: 'https://www.microsoft.com', logoUrl: 'https://www.microsoft.com/favicon.ico' },
  'github': { websiteUrl: 'https://github.com', logoUrl: 'https://github.com/favicon.ico' },
};

/**
 * 获取品牌元数据
 * @param name 产品名称
 * @param suggestedUrl AI 建议的网址（可选）
 */
export const fetchBrandMetadata = (name: string, suggestedUrl?: string): BrandInfo => {
  const normalizedName = name.toLowerCase().trim();
  
  // 1. 优先匹配预设库
  for (const [key, info] of Object.entries(BRAND_PRESETS)) {
    if (normalizedName.includes(key)) {
      return { ...info };
    }
  }

  // 2. 如果没有预设，尝试根据建议的网址生成
  if (suggestedUrl) {
    try {
      const url = new URL(suggestedUrl.startsWith('http') ? suggestedUrl : `https://${suggestedUrl}`);
      const domain = url.hostname;
      return {
        websiteUrl: url.origin,
        // 使用 Google Favicon 服务作为高质量兜底
        logoUrl: `https://www.google.com/s2/favicons?sz=128&domain=${domain}`
      };
    } catch (e) {
      console.warn('Invalid suggested URL for branding:', suggestedUrl);
    }
  }

  // 3. 最后的兜底：基于名称猜测域名并尝试获取 favicon
  // 注意：这只是一个简单的尝试，复杂的品牌名可能无法准确匹配
  const guessedDomain = normalizedName.replace(/\s+/g, '') + '.com';
  return {
    websiteUrl: `https://${guessedDomain}`,
    logoUrl: `https://www.google.com/s2/favicons?sz=128&domain=${guessedDomain}`
  };
};
