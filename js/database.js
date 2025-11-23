// 数据库操作封装
class DatabaseService {
    constructor() {
        this.supabase = window.supabase;
        this.useLocalStorage = !window.supabase;
        this.storagePrefix = 'mall_db_';
    }

    // 通用方法
    async handleRequest(requestType, table, data = null, options = {}) {
        if (this.useLocalStorage) {
            return this.handleLocalStorageRequest(requestType, table, data, options);
        } else {
            return this.handleSupabaseRequest(requestType, table, data, options);
        }
    }

    // Supabase 请求处理
    async handleSupabaseRequest(requestType, table, data, options) {
        try {
            let query;
            switch (requestType) {
                case 'select':
                    query = this.supabase.from(table).select('*', options);
                    if (options.filters) {
                        Object.entries(options.filters).forEach(([key, value]) => {
                            query = query.eq(key, value);
                        });
                    }
                    if (options.order) {
                        query = query.order(options.order.column, { ascending: options.order.ascending });
                    }
                    if (options.range) {
                        query = query.range(options.range.start, options.range.end);
                    }
                    const { data: result, error } = await query;
                    return { data: result, error };
                    
                case 'insert':
                    const { data: insertResult, error: insertError } = await this.supabase.from(table).insert(data);
                    return { data: insertResult, error: insertError };
                    
                case 'update':
                    const { data: updateResult, error: updateError } = await this.supabase
                        .from(table)
                        .update(data)
                        .eq('id', options.id);
                    return { data: updateResult, error: updateError };
                    
                case 'delete':
                    const { data: deleteResult, error: deleteError } = await this.supabase
                        .from(table)
                        .delete()
                        .eq('id', options.id);
                    return { data: deleteResult, error: deleteError };
                    
                default:
                    throw new Error(`Unknown request type: ${requestType}`);
            }
        } catch (error) {
            console.error('Supabase request error:', error);
            return { data: null, error };
        }
    }

    // 本地存储请求处理
    handleLocalStorageRequest(requestType, table, data, options) {
        const key = this.storagePrefix + table;
        let items = JSON.parse(localStorage.getItem(key) || '[]');

        switch (requestType) {
            case 'select':
                let result = items;
                if (options.filters) {
                    result = items.filter(item => 
                        Object.entries(options.filters).every(([key, value]) => item[key] === value)
                    );
                }
                if (options.order) {
                    result.sort((a, b) => {
                        const aVal = a[options.order.column];
                        const bVal = b[options.order.column];
                        return options.order.ascending ? 
                            aVal > bVal ? 1 : -1 : 
                            aVal < bVal ? 1 : -1;
                    });
                }
                if (options.range) {
                    result = result.slice(options.range.start, options.range.end + 1);
                }
                return { data: result, error: null };

            case 'insert':
                const newItem = { ...data, id: this.generateId(), created_at: new Date().toISOString() };
                items.push(newItem);
                localStorage.setItem(key, JSON.stringify(items));
                return { data: newItem, error: null };

            case 'update':
                const index = items.findIndex(item => item.id === options.id);
                if (index !== -1) {
                    items[index] = { ...items[index], ...data, updated_at: new Date().toISOString() };
                    localStorage.setItem(key, JSON.stringify(items));
                    return { data: items[index], error: null };
                }
                return { data: null, error: new Error('Item not found') };

            case 'delete':
                const deleteIndex = items.findIndex(item => item.id === options.id);
                if (deleteIndex !== -1) {
                    const deletedItem = items.splice(deleteIndex, 1)[0];
                    localStorage.setItem(key, JSON.stringify(items));
                    return { data: deletedItem, error: null };
                }
                return { data: null, error: new Error('Item not found') };

            default:
                return { data: null, error: new Error(`Unknown request type: ${requestType}`) };
        }
    }

    // 生成唯一 ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // 产品相关方法
    async getProducts(options = {}) {
        return this.handleRequest('select', 'products', null, options);
    }

    async getProductById(id) {
        const result = await this.handleRequest('select', 'products', null, { filters: { id } });
        return result.data?.[0] || null;
    }

    async getProductsByCategory(categoryId) {
        return this.handleRequest('select', 'products', null, { filters: { category_id: categoryId } });
    }

    async searchProducts(searchTerm) {
        if (this.useLocalStorage) {
            const items = JSON.parse(localStorage.getItem(this.storagePrefix + 'products') || '[]');
            const filtered = items.filter(item => 
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
            return { data: filtered, error: null };
        } else {
            const { data, error } = await this.supabase
                .from('products')
                .select('*')
                .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
            return { data, error };
        }
    }

    // 分类相关方法
    async getCategories() {
        return this.handleRequest('select', 'categories');
    }

    async getCategoryById(id) {
        const result = await this.handleRequest('select', 'categories', null, { filters: { id } });
        return result.data?.[0] || null;
    }

    // 用户相关方法
    async createUser(userData) {
        return this.handleRequest('insert', 'users', userData);
    }

    async updateUser(id, userData) {
        return this.handleRequest('update', 'users', userData, { id });
    }

    async getUserById(id) {
        const result = await this.handleRequest('select', 'users', null, { filters: { id } });
        return result.data?.[0] || null;
    }

    async getUserByEmail(email) {
        const result = await this.handleRequest('select', 'users', null, { filters: { email } });
        return result.data?.[0] || null;
    }

    // 订单相关方法
    async createOrder(orderData) {
        return this.handleRequest('insert', 'orders', orderData);
    }

    async getOrders(userId) {
        return this.handleRequest('select', 'orders', null, { filters: { user_id: userId } });
    }

    async getOrderById(id) {
        const result = await this.handleRequest('select', 'orders', null, { filters: { id } });
        return result.data?.[0] || null;
    }

    async updateOrderStatus(id, status) {
        return this.handleRequest('update', 'orders', { status }, { id });
    }

    // 地址相关方法
    async createAddress(addressData) {
        return this.handleRequest('insert', 'addresses', addressData);
    }

    async getAddresses(userId) {
        return this.handleRequest('select', 'addresses', null, { filters: { user_id: userId } });
    }

    async updateAddress(id, addressData) {
        return this.handleRequest('update', 'addresses', addressData, { id });
    }

    async deleteAddress(id) {
        return this.handleRequest('delete', 'addresses', null, { id });
    }

    // 收藏相关方法
    async addToFavorites(favoriteData) {
        return this.handleRequest('insert', 'favorites', favoriteData);
    }

    async removeFromFavorites(userId, productId) {
        if (this.useLocalStorage) {
            const key = this.storagePrefix + 'favorites';
            let favorites = JSON.parse(localStorage.getItem(key) || '[]');
            favorites = favorites.filter(item => !(item.user_id === userId && item.product_id === productId));
            localStorage.setItem(key, JSON.stringify(favorites));
            return { data: true, error: null };
        } else {
            const { data, error } = await this.supabase
                .from('favorites')
                .delete()
                .eq('user_id', userId)
                .eq('product_id', productId);
            return { data, error };
        }
    }

    async getFavorites(userId) {
        return this.handleRequest('select', 'favorites', null, { filters: { user_id: userId } });
    }

    async isFavorite(userId, productId) {
        const result = await this.handleRequest('select', 'favorites', null, { 
            filters: { user_id: userId, product_id: productId } 
        });
        return result.data && result.data.length > 0;
    }
}

// 创建数据库服务实例
window.db = new DatabaseService();

// 初始化示例数据（仅在使用本地存储时）
if (!window.supabase) {
    db.initSampleData = function() {
        // 初始化分类数据
        const categories = [
            { id: '1', name: '电子产品', icon: '💻', description: '智能手机、平板电脑等' },
            { id: '2', name: '服装配饰', icon: '👕', description: '时尚服装、配饰等' },
            { id: '3', name: '家居用品', icon: '🏠', description: '家具、装饰品等' },
            { id: '4', name: '美妆护肤', icon: '💄', description: '化妆品、护肤品等' },
            { id: '5', name: '运动户外', icon: '⚽', description: '运动装备、户外用品等' },
            { id: '6', name: '图书音像', icon: '📚', description: '书籍、音乐、影视等' }
        ];
        localStorage.setItem(db.storagePrefix + 'categories', JSON.stringify(categories));

        // 初始化产品数据
        const products = [
            {
                id: '1',
                name: '智能手机 Pro Max',
                description: '最新款智能手机，配备强大的处理器和高清摄像头',
                price: 4999,
                category_id: '1',
                image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80',
                stock: 50,
                featured: true,
                created_at: new Date().toISOString()
            },
            {
                id: '2',
                name: '无线蓝牙耳机',
                description: '高品质音效，长续航，舒适佩戴',
                price: 299,
                category_id: '1',
                image: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80',
                stock: 100,
                featured: true,
                created_at: new Date().toISOString()
            },
            {
                id: '3',
                name: '时尚运动鞋',
                description: '舒适透气，时尚设计，适合日常穿着',
                price: 599,
                category_id: '2',
                image: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80',
                stock: 30,
                featured: true,
                created_at: new Date().toISOString()
            },
            {
                id: '4',
                name: '智能手表',
                description: '健康监测，消息提醒，长续航',
                price: 1299,
                category_id: '1',
                image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80',
                stock: 25,
                featured: false,
                created_at: new Date().toISOString()
            },
            {
                id: '5',
                name: '护肤套装',
                description: '深层清洁，保湿滋润，适合各种肌肤',
                price: 399,
                category_id: '4',
                image: 'https://images.unsplash.com/photo-1570164077319-4e5c7c9a5b8c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80',
                stock: 40,
                featured: false,
                created_at: new Date().toISOString()
            },
            {
                id: '6',
                name: '瑜伽垫',
                description: '防滑设计，加厚舒适，环保材质',
                price: 89,
                category_id: '5',
                image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80',
                stock: 60,
                featured: false,
                created_at: new Date().toISOString()
            }
        ];
        localStorage.setItem(db.storagePrefix + 'products', JSON.stringify(products));
    };

    // 检查是否需要初始化数据
    const existingProducts = localStorage.getItem(db.storagePrefix + 'products');
    const existingCategories = localStorage.getItem(db.storagePrefix + 'categories');
    
    if (!existingProducts || !existingCategories) {
        db.initSampleData();
    }
}