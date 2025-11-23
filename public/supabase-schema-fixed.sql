-- 精品商城数据库结构 (修复版本)
-- 创建时间: 2024年
-- 适用于 Supabase PostgreSQL

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建用户表 (扩展 Supabase 的 auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    birthday DATE,
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建分类表
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建产品表
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    short_description TEXT,
    price DECIMAL(10,2) NOT NULL,
    compare_price DECIMAL(10,2),
    cost_price DECIMAL(10,2),
    sku TEXT UNIQUE,
    barcode TEXT,
    track_inventory BOOLEAN DEFAULT true,
    stock INTEGER DEFAULT 0,
    weight DECIMAL(8,2),
    dimensions JSONB,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    brand TEXT,
    tags TEXT[],
    image_url TEXT,
    images JSONB,
    featured BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
    seo_title TEXT,
    seo_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建订单表
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    order_number TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    currency TEXT DEFAULT 'CNY',
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    shipping_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    notes TEXT,
    shipping_address JSONB NOT NULL,
    shipping_method TEXT,
    tracking_number TEXT,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_intent_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建订单项表
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    product_snapshot JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建购物车表
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- 创建地址表
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    province TEXT NOT NULL,
    city TEXT NOT NULL,
    district TEXT,
    postal_code TEXT,
    address TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建收藏表
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- 创建优惠券表
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2) NOT NULL,
    minimum_amount DECIMAL(10,2),
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    starts_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建优惠券使用记录表
CREATE TABLE IF NOT EXISTS public.coupon_usages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    discount_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(coupon_id, user_id, order_id)
);

-- 创建评论表
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    content TEXT,
    images JSONB,
    is_verified BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, user_id)
);

-- 创建评论点赞表
CREATE TABLE IF NOT EXISTS public.review_helpful (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(review_id, user_id)
);

-- 创建产品变体表
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    price DECIMAL(10,2),
    compare_price DECIMAL(10,2),
    weight DECIMAL(8,2),
    stock INTEGER DEFAULT 0,
    image_url TEXT,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建变体选项表
CREATE TABLE IF NOT EXISTS public.variant_options (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    values JSONB NOT NULL,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建库存记录表
CREATE TABLE IF NOT EXISTS public.inventory_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjust', 'sale', 'return')),
    quantity INTEGER NOT NULL,
    reason TEXT,
    reference_id UUID,
    reference_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id)
);

-- 安全创建索引 - 检查是否存在后再创建

-- 用户表索引
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'users' AND indexname = 'idx_users_email') THEN
        CREATE INDEX idx_users_email ON public.users(email);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'users' AND indexname = 'idx_users_phone') THEN
        CREATE INDEX idx_users_phone ON public.users(phone);
    END IF;
END $$;

-- 产品表索引
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'products' AND indexname = 'idx_products_category_id') THEN
        CREATE INDEX idx_products_category_id ON public.products(category_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'products' AND indexname = 'idx_products_featured') THEN
        CREATE INDEX idx_products_featured ON public.products(featured);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'products' AND indexname = 'idx_products_status') THEN
        CREATE INDEX idx_products_status ON public.products(status);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'products' AND indexname = 'idx_products_price') THEN
        CREATE INDEX idx_products_price ON public.products(price);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'products' AND indexname = 'idx_products_created_at') THEN
        CREATE INDEX idx_products_created_at ON public.products(created_at);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'products' AND indexname = 'idx_products_tags') THEN
        CREATE INDEX idx_products_tags ON public.products USING GIN(tags);
    END IF;
END $$;

-- 订单表索引
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'orders' AND indexname = 'idx_orders_user_id') THEN
        CREATE INDEX idx_orders_user_id ON public.orders(user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'orders' AND indexname = 'idx_orders_status') THEN
        CREATE INDEX idx_orders_status ON public.orders(status);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'orders' AND indexname = 'idx_orders_created_at') THEN
        CREATE INDEX idx_orders_created_at ON public.orders(created_at);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'orders' AND indexname = 'idx_orders_order_number') THEN
        CREATE INDEX idx_orders_order_number ON public.orders(order_number);
    END IF;
END $$;

-- 订单项表索引
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'order_items' AND indexname = 'idx_order_items_order_id') THEN
        CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'order_items' AND indexname = 'idx_order_items_product_id') THEN
        CREATE INDEX idx_order_items_product_id ON public.order_items(product_id);
    END IF;
END $$;

-- 购物车表索引
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'cart_items' AND indexname = 'idx_cart_items_user_id') THEN
        CREATE INDEX idx_cart_items_user_id ON public.cart_items(user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'cart_items' AND indexname = 'idx_cart_items_product_id') THEN
        CREATE INDEX idx_cart_items_product_id ON public.cart_items(product_id);
    END IF;
END $$;

-- 地址表索引
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'addresses' AND indexname = 'idx_addresses_user_id') THEN
        CREATE INDEX idx_addresses_user_id ON public.addresses(user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'addresses' AND indexname = 'idx_addresses_is_default') THEN
        CREATE INDEX idx_addresses_is_default ON public.addresses(is_default);
    END IF;
END $$;

-- 收藏表索引
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'favorites' AND indexname = 'idx_favorites_user_id') THEN
        CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'favorites' AND indexname = 'idx_favorites_product_id') THEN
        CREATE INDEX idx_favorites_product_id ON public.favorites(product_id);
    END IF;
END $$;

-- 评论表索引
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'reviews' AND indexname = 'idx_reviews_product_id') THEN
        CREATE INDEX idx_reviews_product_id ON public.reviews(product_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'reviews' AND indexname = 'idx_reviews_user_id') THEN
        CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'reviews' AND indexname = 'idx_reviews_rating') THEN
        CREATE INDEX idx_reviews_rating ON public.reviews(rating);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'reviews' AND indexname = 'idx_reviews_created_at') THEN
        CREATE INDEX idx_reviews_created_at ON public.reviews(created_at);
    END IF;
END $$;

-- 优惠券表索引
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'coupons' AND indexname = 'idx_coupons_code') THEN
        CREATE INDEX idx_coupons_code ON public.coupons(code);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'coupons' AND indexname = 'idx_coupons_is_active') THEN
        CREATE INDEX idx_coupons_is_active ON public.coupons(is_active);
    END IF;
END $$;

-- 分类表索引
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'categories' AND indexname = 'idx_categories_sort_order') THEN
        CREATE INDEX idx_categories_sort_order ON public.categories(sort_order);
    END IF;
END $$;

-- 创建更新时间戳的函数
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要的表创建更新时间戳触发器
DROP TRIGGER IF EXISTS handle_users_updated_at ON public.users;
CREATE TRIGGER handle_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_categories_updated_at ON public.categories;
CREATE TRIGGER handle_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_products_updated_at ON public.products;
CREATE TRIGGER handle_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_orders_updated_at ON public.orders;
CREATE TRIGGER handle_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_cart_items_updated_at ON public.cart_items;
CREATE TRIGGER handle_cart_items_updated_at
    BEFORE UPDATE ON public.cart_items
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_addresses_updated_at ON public.addresses;
CREATE TRIGGER handle_addresses_updated_at
    BEFORE UPDATE ON public.addresses
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_coupons_updated_at ON public.coupons;
CREATE TRIGGER handle_coupons_updated_at
    BEFORE UPDATE ON public.coupons
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_reviews_updated_at ON public.reviews;
CREATE TRIGGER handle_reviews_updated_at
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_product_variants_updated_at ON public.product_variants;
CREATE TRIGGER handle_product_variants_updated_at
    BEFORE UPDATE ON public.product_variants
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 启用 RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_helpful ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;

-- 用户表策略
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- 订单表策略
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

-- 订单项表策略
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

-- 购物车表策略
DROP POLICY IF EXISTS "Users can manage own cart" ON public.cart_items;
CREATE POLICY "Users can manage own cart" ON public.cart_items
    FOR ALL USING (auth.uid() = user_id);

-- 地址表策略
DROP POLICY IF EXISTS "Users can manage own addresses" ON public.addresses;
CREATE POLICY "Users can manage own addresses" ON public.addresses
    FOR ALL USING (auth.uid() = user_id);

-- 收藏表策略
DROP POLICY IF EXISTS "Users can manage own favorites" ON public.favorites;
CREATE POLICY "Users can manage own favorites" ON public.favorites
    FOR ALL USING (auth.uid() = user_id);

-- 评论表策略
DROP POLICY IF EXISTS "Users can view all reviews" ON public.reviews;
CREATE POLICY "Users can view all reviews" ON public.reviews
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own reviews" ON public.reviews;
CREATE POLICY "Users can manage own reviews" ON public.reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
CREATE POLICY "Users can update own reviews" ON public.reviews
    FOR UPDATE USING (auth.uid() = user_id);

-- 评论点赞策略
DROP POLICY IF EXISTS "Users can manage own helpful votes" ON public.review_helpful;
CREATE POLICY "Users can manage own helpful votes" ON public.review_helpful
    FOR ALL USING (auth.uid() = user_id);

-- 优惠券使用记录策略
DROP POLICY IF EXISTS "Users can view own coupon usage" ON public.coupon_usages;
CREATE POLICY "Users can view own coupon usage" ON public.coupon_usages
    FOR SELECT USING (auth.uid() = user_id);

-- 插入示例数据
INSERT INTO public.categories (id, name, description, icon, sort_order) VALUES
('550e8400-e29b-41d4-a716-446655440001', '电子产品', '智能手机、平板电脑、耳机等', '💻', 1),
('550e8400-e29b-41d4-a716-446655440002', '服装配饰', '时尚服装、鞋子、包包等', '👕', 2),
('550e8400-e29b-41d4-a716-446655440003', '家居用品', '家具、装饰品、厨具等', '🏠', 3),
('550e8400-e29b-41d4-a716-446655440004', '美妆护肤', '化妆品、护肤品、香水等', '💄', 4),
('550e8400-e29b-41d4-a716-446655440005', '运动户外', '运动装备、户外用品等', '⚽', 5),
('550e8400-e29b-41d4-a716-446655440006', '图书音像', '书籍、音乐、影视等', '📚', 6)
ON CONFLICT DO NOTHING;

-- 插入示例产品
INSERT INTO public.products (id, name, description, short_description, price, category_id, image_url, stock, featured, status) VALUES
('660e8400-e29b-41d4-a716-446655440001', '智能手机 Pro Max', '最新款智能手机，配备强大的处理器和高清摄像头，支持5G网络', '旗舰智能手机，性能强劲', 4999.00, '550e8400-e29b-41d4-a716-446655440001', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80', 50, true, 'active'),
('660e8400-e29b-41d4-a716-446655440002', '无线蓝牙耳机', '高品质音效，长续航，舒适佩戴，主动降噪功能', '真无线蓝牙耳机', 299.00, '550e8400-e29b-41d4-a716-446655440001', 'https://images.unsplash.com/photo-1484704849700-f032a568e944?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80', 100, true, 'active'),
('660e8400-e29b-41d4-a716-446655440003', '时尚运动鞋', '舒适透气，时尚设计，适合日常穿着和运动', '潮流运动鞋', 599.00, '550e8400-e29b-41d4-a716-446655440002', 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80', 30, true, 'active'),
('660e8400-e29b-41d4-a716-446655440004', '智能手表', '健康监测，消息提醒，长续航，防水设计', '多功能智能手表', 1299.00, '550e8400-e29b-41d4-a716-446655440001', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80', 25, false, 'active'),
('660e8400-e29b-41d4-a716-446655440005', '护肤套装', '深层清洁，保湿滋润，适合各种肌肤类型', '完整护肤套装', 399.00, '550e8400-e29b-41d4-a716-446655440004', 'https://images.unsplash.com/photo-1570164077319-4e5c7c9a5b8c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80', 40, false, 'active'),
('660e8400-e29b-41d4-a716-446655440006', '瑜伽垫', '防滑设计，加厚舒适，环保材质，多种颜色可选', '专业瑜伽垫', 89.00, '550e8400-e29b-41d4-a716-446655440005', 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80', 60, false, 'active')
ON CONFLICT DO NOTHING;

-- 插入示例优惠券
INSERT INTO public.coupons (code, name, description, discount_type, discount_value, minimum_amount, usage_limit, starts_at, expires_at) VALUES
('SAVE10', '新用户专享', '新用户首单满100减10', 'fixed', 10.00, 100.00, 1000, NOW(), NOW() + INTERVAL '1 year'),
('SAVE20', '满200减20', '订单满200元立减20元', 'fixed', 20.00, 200.00, 500, NOW(), NOW() + INTERVAL '6 months'),
('NEWUSER15', '新用户85折', '新用户首单享85折优惠', 'percentage', 15.00, 50.00, 1000, NOW(), NOW() + INTERVAL '1 month')
ON CONFLICT DO NOTHING;

-- 创建订单号生成函数
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT AS $$
DECLARE
    order_number TEXT;
    sequence_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SPLIT_PART(order_number, '-', 3) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM public.orders
    WHERE order_number LIKE 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '%';
    
    order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(sequence_num::TEXT, 5, '0');
    
    RETURN order_number;
END;
$$ LANGUAGE plpgsql;

-- 创建订单号生成触发器
CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL THEN
        NEW.order_number := public.generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_order_number_trigger ON public.orders;
CREATE TRIGGER set_order_number_trigger
    BEFORE INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.set_order_number();