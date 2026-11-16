export interface LinkItem {
  id: string;
  name: string;
  url: string;
  description: string;
  avatar: string;
  feed?: string;
  is_active?: boolean;
  status?: 'unknown' | 'online' | 'offline';
  statusCode?: number;
  lastChecked?: string;
  lastError?: string;
}

export interface SiteInfo {
  title: string;
  url: string;
  description: string;
  avatar: string;
}

export const siteInfo: SiteInfo = {
  title: 'Ficor\'s Astro',
  url: 'https://ficor.cn',
  description: '写代码，也写字',
  avatar: '',
};

/**
 * 友链数据。
 *
 * 这个文件由 Ficor's Astro CMS 后台读写，字段名与后台的 FriendLink 模型一致：
 *   feed         订阅地址（后台用它自动生成订阅源）
 *   is_active    是否启用
 *   status       站点状态 unknown / online / offline
 * 手动新增时，id 建议使用稳定字符串，避免后台重新生成。
 */
export const links: LinkItem[] = [
  {
    id: 'astro',
    name: 'Astro',
    url: 'https://astro.build',
    description: '内容驱动的现代 Web 框架，本站的地基。',
    avatar: 'https://astro.build/favicon.svg',
    feed: 'https://astro.build/rss.xml',
    is_active: true,
    status: 'online',
  },
  {
    id: 'ficor-net',
    name: '柒色墨笺',
    url: 'https://vii.ink',
    description: '另一个同样由 CMS 管理的静态博客。',
    avatar: '',
    feed: 'https://vii.ink/rss.xml',
    is_active: true,
    status: 'online',
  },
  {
    id: 'warmpaper',
    name: 'WarmPaper',
    url: 'https://github.com/Ficorcc/WarmPaper',
    description: '写给慢读的一版轻量博客。',
    avatar: '',
    is_active: true,
    status: 'unknown',
  },
]
