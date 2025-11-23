// 配置文件
const CONFIG = {
    // Supabase 配置 - 请替换为您的实际配置
    SUPABASE_URL: 'https://your-project-id.supabase.co',
    SUPABASE_ANON_KEY: 'your-supabase-anon-key-here',
    
    // 网站配置
    SITE_NAME: '精品商城',
    SITE_DESCRIPTION: '精选全球好物，为您的生活添彩',
    CURRENCY: 'CNY',
    
    // 分页配置
    ITEMS_PER_PAGE: 12,
    
    // 运费配置
    SHIPPING_THRESHOLD: 99, // 免运费门槛
    SHIPPING_FEE: 10,       // 运费
    
    // 税率配置
    TAX_RATE: 0.08,
    
    // 本地存储键名
    STORAGE_KEYS: {
        CART: 'shopping_cart',
        USER: 'user_info',
        FAVORITES: 'favorites',
        TOKEN: 'auth_token'
    }
};

// 初始化 Supabase 客户端
let supabase;

try {
    supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
} catch (error) {
    console.warn('Supabase 客户端初始化失败，将使用本地存储模式:', error);
}

// 导出配置
window.CONFIG = CONFIG;
window.supabase = supabase;