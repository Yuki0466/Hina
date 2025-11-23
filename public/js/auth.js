// 认证服务
class AuthService {
    constructor() {
        this.supabase = window.supabase;
        this.currentUser = null;
        this.useLocalStorage = !window.supabase;
    }

    // 初始化认证状态
    async init() {
        if (this.useLocalStorage) {
            const userData = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
            if (userData) {
                this.currentUser = JSON.parse(userData);
                return this.currentUser;
            }
            return null;
        } else {
            // Supabase 认证
            const { data: { user } } = await this.supabase.auth.getUser();
            if (user) {
                this.currentUser = user;
                // 获取用户详细信息
                const { data: userData } = await window.db.getUserById(user.id);
                if (userData) {
                    this.currentUser = { ...user, ...userData };
                }
            }
            return this.currentUser;
        }
    }

    // 注册
    async register(email, password, userData) {
        if (this.useLocalStorage) {
            // 本地存储注册逻辑
            const existingUser = await window.db.getUserByEmail(email);
            if (existingUser) {
                throw new Error('该邮箱已被注册');
            }

            const newUser = await window.db.createUser({
                email,
                password: btoa(password), // 注意：这只是示例，实际应用中需要更安全的加密
                first_name: userData.firstName || '',
                last_name: userData.lastName || '',
                phone: userData.phone || '',
                created_at: new Date().toISOString()
            });

            if (newUser.data) {
                this.currentUser = newUser.data;
                localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(this.currentUser));
                return { user: this.currentUser, error: null };
            } else {
                throw new Error('注册失败');
            }
        } else {
            // Supabase 注册
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password
            });

            if (!error && data.user) {
                // 保存用户详细信息到 users 表
                await window.db.createUser({
                    id: data.user.id,
                    email: data.user.email,
                    first_name: userData.firstName || '',
                    last_name: userData.lastName || '',
                    phone: userData.phone || ''
                });

                this.currentUser = data.user;
                return { user: data.user, error: null };
            }

            return { user: null, error };
        }
    }

    // 登录
    async login(email, password) {
        if (this.useLocalStorage) {
            // 本地存储登录逻辑
            const user = await window.db.getUserByEmail(email);
            if (!user) {
                throw new Error('用户不存在');
            }

            if (user.password !== btoa(password)) {
                throw new Error('密码错误');
            }

            this.currentUser = user;
            localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(this.currentUser));
            return { user: this.currentUser, error: null };
        } else {
            // Supabase 登录
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });

            if (!error && data.user) {
                // 获取用户详细信息
                const { data: userData } = await window.db.getUserById(data.user.id);
                if (userData) {
                    this.currentUser = { ...data.user, ...userData };
                } else {
                    this.currentUser = data.user;
                }
            }

            return { user: data?.user || null, error };
        }
    }

    // 登出
    async logout() {
        if (this.useLocalStorage) {
            localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
            localStorage.removeItem(CONFIG.STORAGE_KEYS.CART);
            localStorage.removeItem(CONFIG.STORAGE_KEYS.FAVORITES);
            this.currentUser = null;
            return { error: null };
        } else {
            const { error } = await this.supabase.auth.signOut();
            if (!error) {
                this.currentUser = null;
            }
            return { error };
        }
    }

    // 获取当前用户
    getCurrentUser() {
        return this.currentUser;
    }

    // 检查是否已登录
    isLoggedIn() {
        return !!this.currentUser;
    }

    // 更新用户信息
    async updateProfile(userData) {
        if (!this.currentUser) {
            throw new Error('用户未登录');
        }

        const userId = this.currentUser.id;
        
        if (this.useLocalStorage) {
            // 本地存储更新
            const result = await window.db.updateUser(userId, userData);
            if (result.data) {
                this.currentUser = { ...this.currentUser, ...result.data };
                localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(this.currentUser));
                return { data: this.currentUser, error: null };
            }
            return { data: null, error: new Error('更新失败') };
        } else {
            // Supabase 更新
            const result = await window.db.updateUser(userId, userData);
            if (result.data) {
                this.currentUser = { ...this.currentUser, ...result.data };
                return { data: this.currentUser, error: null };
            }
            return result;
        }
    }

    // 修改密码
    async changePassword(newPassword) {
        if (!this.currentUser) {
            throw new Error('用户未登录');
        }

        if (this.useLocalStorage) {
            const result = await window.db.updateUser(this.currentUser.id, {
                password: btoa(newPassword)
            });
            return result;
        } else {
            const { error } = await this.supabase.auth.updateUser({
                password: newPassword
            });
            return { data: null, error };
        }
    }

    // 重置密码
    async resetPassword(email) {
        if (this.useLocalStorage) {
            throw new Error('本地存储模式不支持密码重置');
        } else {
            const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password.html`
            });
            return { data: null, error };
        }
    }

    // 监听认证状态变化
    onAuthChange(callback) {
        if (this.useLocalStorage) {
            // 本地存储模式，监听 storage 事件
            window.addEventListener('storage', (e) => {
                if (e.key === CONFIG.STORAGE_KEYS.USER) {
                    const user = e.newValue ? JSON.parse(e.newValue) : null;
                    this.currentUser = user;
                    callback(user);
                }
            });
        } else {
            // Supabase 监听认证状态变化
            return this.supabase.auth.onAuthStateChange(async (event, session) => {
                if (session?.user) {
                    const { data: userData } = await window.db.getUserById(session.user.id);
                    this.currentUser = userData ? { ...session.user, ...userData } : session.user;
                } else {
                    this.currentUser = null;
                }
                callback(this.currentUser);
            });
        }
    }
}

// 创建认证服务实例
window.auth = new AuthService();

// 页面加载时初始化认证
document.addEventListener('DOMContentLoaded', async () => {
    await window.auth.init();
});