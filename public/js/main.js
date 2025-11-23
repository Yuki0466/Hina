// 主要功能初始化
document.addEventListener('DOMContentLoaded', async () => {
    // 初始化示例数据（仅在使用本地存储时）
    if (!window.supabase && window.db.initSampleData) {
        window.db.initSampleData();
    }
    
    // 初始化购物车
    window.cart.init();
    
    // 初始化认证状态
    await window.auth.init();
    
    // 加载首页数据
    await loadHomePage();
    
    // 绑定通用事件
    bindCommonEvents();
});

// 加载首页数据
async function loadHomePage() {
    try {
        // 加载分类
        await renderCategories();
        
        // 加载热门产品
        const result = await window.productService.getFeaturedProducts(8);
        if (result.error) {
            console.error('加载热门产品失败:', result.error);
            return;
        }
        
        window.productService.renderProductGrid(result.data, 'featuredProducts');
        
    } catch (error) {
        console.error('加载首页数据失败:', error);
    }
}

// 绑定通用事件
function bindCommonEvents() {
    // 购物车按钮点击事件
    const cartBtns = document.querySelectorAll('.cart-btn');
    cartBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            window.location.href = 'cart.html';
        });
    });

    // 搜索按钮事件
    const searchBtns = document.querySelectorAll('.search-btn');
    searchBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const searchTerm = prompt('请输入搜索关键词:');
            if (searchTerm) {
                window.location.href = `products.html?search=${encodeURIComponent(searchTerm)}`;
            }
        });
    });

    // 英雄区域按钮事件
    const heroBtn = document.querySelector('.hero-btn');
    if (heroBtn) {
        heroBtn.addEventListener('click', () => {
            window.location.href = 'products.html';
        });
    }

    // 产品页面特定事件
    if (window.location.pathname.includes('products.html')) {
        bindProductsPageEvents();
    }

    // 购物车页面特定事件
    if (window.location.pathname.includes('cart.html')) {
        bindCartPageEvents();
    }

    // 个人中心页面特定事件
    if (window.location.pathname.includes('profile.html')) {
        bindProfilePageEvents();
    }

    // 绑定模态框关闭事件
    bindModalEvents();

    // 绑定移动端菜单事件
    bindMobileMenuEvents();
}

// 绑定产品页面事件
function bindProductsPageEvents() {
    // 筛选器事件
    const categoryFilter = document.getElementById('categoryFilter');
    const priceFilter = document.getElementById('priceFilter');
    const sortBy = document.getElementById('sortBy');
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');

    // 加载分类选项
    loadCategoryOptions();

    // 绑定筛选器变化事件
    if (categoryFilter) categoryFilter.addEventListener('change', () => loadProducts());
    if (priceFilter) priceFilter.addEventListener('change', () => loadProducts());
    if (sortBy) sortBy.addEventListener('change', () => loadProducts());
    if (searchBtn) searchBtn.addEventListener('click', () => loadProducts());
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') loadProducts();
        });
    }

    // 加载初始产品
    loadProducts();
}

// 加载分类选项
async function loadCategoryOptions() {
    const result = await window.db.getCategories();
    if (result.error || !result.data) return;

    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter) return;

    const defaultOption = categoryFilter.querySelector('option[value=""]');
    categoryFilter.innerHTML = '';
    if (defaultOption) categoryFilter.appendChild(defaultOption);

    result.data.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        categoryFilter.appendChild(option);
    });
}

// 绑定购物车页面事件
function bindCartPageEvents() {
    // 清空购物车按钮
    const clearCartBtn = document.getElementById('clearCartBtn');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', () => {
            if (confirm('确定要清空购物车吗？')) {
                window.cart.clearCart();
            }
        });
    }

    // 优惠券按钮
    const applyCouponBtn = document.getElementById('applyCouponBtn');
    if (applyCouponBtn) {
        applyCouponBtn.addEventListener('click', () => {
            const couponCode = document.getElementById('couponCode').value.trim();
            if (couponCode) {
                window.cart.applyCoupon(couponCode);
            }
        });
    }

    // 结算按钮
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            window.cart.checkout();
        });
    }

    // 加载推荐商品
    loadRecommendedProducts();
}

// 加载推荐商品
async function loadRecommendedProducts() {
    const container = document.getElementById('recommendedProducts');
    if (!container) return;

    const result = await window.db.getProducts({
        filters: { featured: true },
        order: { column: 'created_at', ascending: false },
        range: { start: 0, end: 2 }
    });

    if (result.error || !result.data) return;

    container.innerHTML = result.data.map(product => `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-price">¥${parseFloat(product.price).toFixed(2)}</p>
                <button class="add-to-cart-btn" data-product-id="${product.id}">
                    加入购物车
                </button>
            </div>
        </div>
    `).join('');

    // 绑定添加到购物车事件
    container.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = btn.dataset.productId;
            window.cart.addToCart(productId, 1);
        });
    });
}

// 绑定个人中心页面事件
function bindProfilePageEvents() {
    if (!window.auth.isLoggedIn()) {
        // 如果未登录，显示登录模态框而不是直接跳转
        showLoginModal();
        return;
    }

    // 绑定标签切换事件
    const navItems = document.querySelectorAll('.profile-nav .nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = item.dataset.tab;
            
            // 移除所有活动状态
            navItems.forEach(nav => nav.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // 添加当前活动状态
            item.classList.add('active');
            const targetTab = document.getElementById(tabId);
            if (targetTab) {
                targetTab.classList.add('active');
                loadTabContent(tabId);
            }
        });
    });

    // 加载用户信息
    loadUserProfile();

    // 绑定表单事件
    bindProfileForms();

    // 绑定登出事件
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (confirm('确定要退出登录吗？')) {
                await window.auth.logout();
                window.location.href = 'index.html';
            }
        });
    }
}

// 加载标签内容
async function loadTabContent(tabId) {
    switch (tabId) {
        case 'dashboard':
            await loadDashboard();
            break;
        case 'orders':
            await loadOrders();
            break;
        case 'addresses':
            await loadAddresses();
            break;
        case 'favorites':
            await loadFavorites();
            break;
    }
}

// 加载订单
async function loadOrders() {
    const user = window.auth.getCurrentUser();
    if (!user) return;

    try {
        const result = await window.db.getOrders(user.id);
        const orders = result.data || [];
        
        const container = document.getElementById('ordersList');
        if (!container) return;

        if (orders.length === 0) {
            container.innerHTML = '<p style="color: #6b7280; text-align: center; padding: 40px;">暂无订单</p>';
            return;
        }

        container.innerHTML = `
            <div style="display: grid; gap: 20px;">
                ${orders.map(order => renderOrderItem(order)).join('')}
            </div>
        `;

    } catch (error) {
        console.error('加载订单失败:', error);
        window.cart.showNotification('加载订单失败', 'error');
    }
}

// 渲染订单项
function renderOrderItem(order) {
    const orderDate = new Date(order.created_at).toLocaleDateString();
    const statusColor = getOrderStatusColor(order.status);
    const statusText = getOrderStatusText(order.status);

    return `
        <div class="order-card" style="
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 20px;
            background: white;
        ">
            <div class="order-header" style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                padding-bottom: 15px;
                border-bottom: 1px solid #f3f4f6;
            ">
                <div>
                    <h4 style="margin: 0; color: #1f2937;">订单 #${order.id}</h4>
                    <p style="margin: 5px 0 0; color: #6b7280; font-size: 14px;">${orderDate}</p>
                </div>
                <div style="text-align: right;">
                    <span class="order-status" style="
                        display: inline-block;
                        padding: 6px 12px;
                        border-radius: 6px;
                        font-size: 12px;
                        font-weight: 500;
                        background: ${statusColor};
                        color: white;
                    ">${statusText}</span>
                    <div style="font-size: 18px; font-weight: 600; color: #ef4444; margin-top: 5px;">
                        ¥${parseFloat(order.total || 0).toFixed(2)}
                    </div>
                </div>
            </div>
            
            ${order.items ? `
                <div class="order-items" style="
                    display: grid;
                    gap: 10px;
                    margin-bottom: 15px;
                ">
                    ${order.items.map(item => `
                        <div style="
                            display: flex;
                            align-items: center;
                            gap: 15px;
                        ">
                            <img src="${item.image}" alt="${item.name}" style="
                                width: 60px;
                                height: 60px;
                                object-fit: cover;
                                border-radius: 8px;
                            ">
                            <div style="flex: 1;">
                                <h5 style="margin: 0 0 5px; color: #1f2937;">${item.name}</h5>
                                <p style="margin: 0; color: #6b7280; font-size: 14px;">
                                    数量: ${item.quantity} × ¥${parseFloat(item.price).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `;
}

// 获取订单状态颜色
function getOrderStatusColor(status) {
    const colorMap = {
        'pending': '#f59e0b',
        'processing': '#3b82f6',
        'shipped': '#8b5cf6',
        'delivered': '#10b981',
        'cancelled': '#6b7280'
    };
    return colorMap[status] || '#6b7280';
}

// 加载地址
async function loadAddresses() {
    const user = window.auth.getCurrentUser();
    if (!user) return;

    try {
        const result = await window.db.getAddresses(user.id);
        const addresses = result.data || [];
        
        const container = document.getElementById('addressesList');
        if (!container) return;

        if (addresses.length === 0) {
            container.innerHTML = '<p style="color: #6b7280; text-align: center; padding: 40px;">暂无收货地址</p>';
            return;
        }

        container.innerHTML = addresses.map(address => renderAddressCard(address)).join('');

    } catch (error) {
        console.error('加载地址失败:', error);
        window.cart.showNotification('加载地址失败', 'error');
    }
}

// 渲染地址卡片
function renderAddressCard(address) {
    return `
        <div class="address-card" style="
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 20px;
            background: white;
            margin-bottom: 15px;
        ">
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: start;
            ">
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 10px; color: #1f2937;">
                        ${address.name}
                        ${address.is_default ? '<span style="background: #10b981; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-left: 10px;">默认</span>' : ''}
                    </h4>
                    <p style="margin: 5px 0; color: #6b7280;">${address.phone}</p>
                    <p style="margin: 5px 0; color: #6b7280;">
                        ${address.province} ${address.city} ${address.district} ${address.street_address}
                    </p>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button class="btn-secondary" onclick="editAddress('${address.id}')" style="padding: 6px 12px; font-size: 12px;">编辑</button>
                    <button class="btn-danger" onclick="deleteAddress('${address.id}')" style="padding: 6px 12px; font-size: 12px;">删除</button>
                </div>
            </div>
        </div>
    `;
}

// 加载收藏
async function loadFavorites() {
    const user = window.auth.getCurrentUser();
    if (!user) return;

    try {
        const result = await window.db.getFavorites(user.id);
        const favorites = result.data || [];
        
        const container = document.getElementById('favoritesList');
        if (!container) return;

        if (favorites.length === 0) {
            container.innerHTML = '<p style="color: #6b7280; text-align: center; padding: 40px; grid-column: 1 / -1;">暂无收藏商品</p>';
            return;
        }

        // 获取收藏商品详情
        const productIds = favorites.map(fav => fav.product_id);
        const products = [];
        
        for (const productId of productIds) {
            const productResult = await window.db.getProductById(productId);
            if (productResult.data) {
                products.push(productResult.data);
            }
        }

        window.productService.renderProductGrid(products, 'favoritesList');

    } catch (error) {
        console.error('加载收藏失败:', error);
        window.cart.showNotification('加载收藏失败', 'error');
    }
}

// 加载用户信息
function loadUserProfile() {
    const user = window.auth.getCurrentUser();
    if (!user) return;

    // 更新用户信息显示
    const userNameElement = document.getElementById('userName');
    const userEmailElement = document.getElementById('userEmail');

    if (userNameElement) {
        userNameElement.textContent = user.first_name ? 
            `${user.first_name} ${user.last_name || ''}`.trim() : 
            user.email?.split('@')[0] || '用户';
    }

    if (userEmailElement) {
        userEmailElement.textContent = user.email || '';
    }

    // 填充表单
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.firstName.value = user.first_name || '';
        profileForm.lastName.value = user.last_name || '';
        profileForm.email.value = user.email || '';
        profileForm.phone.value = user.phone || '';
        profileForm.birthday.value = user.birthday || '';
    }
}

// 加载仪表板数据
async function loadDashboard() {
    const user = window.auth.getCurrentUser();
    if (!user) return;

    try {
        // 获取订单统计
        const ordersResult = await window.db.getOrders(user.id);
        const orders = ordersResult.data || [];
        
        // 计算总消费
        const totalSpent = orders.reduce((total, order) => total + (order.total || 0), 0);
        
        // 获取收藏数量
        const favoritesResult = await window.db.getFavorites(user.id);
        const favoriteCount = favoritesResult.data?.length || 0;

        // 更新统计信息
        document.getElementById('totalOrders').textContent = orders.length;
        document.getElementById('totalSpent').textContent = `¥${totalSpent.toFixed(2)}`;
        document.getElementById('favoriteCount').textContent = favoriteCount;

        // 显示最近订单
        renderRecentOrders(orders.slice(0, 3));

    } catch (error) {
        console.error('加载仪表板数据失败:', error);
    }
}

// 渲染最近订单
function renderRecentOrders(orders) {
    const container = document.getElementById('recentOrdersList');
    if (!container) return;

    if (orders.length === 0) {
        container.innerHTML = '<p>暂无订单</p>';
        return;
    }

    container.innerHTML = orders.map(order => `
        <div class="order-item">
            <div class="order-header">
                <span class="order-id">订单 #${order.id}</span>
                <span class="order-status">${getOrderStatusText(order.status)}</span>
            </div>
            <div class="order-info">
                <span class="order-date">${new Date(order.created_at).toLocaleDateString()}</span>
                <span class="order-total">¥${parseFloat(order.total || 0).toFixed(2)}</span>
            </div>
        </div>
    `).join('');
}

// 获取订单状态文本
function getOrderStatusText(status) {
    const statusMap = {
        'pending': '待付款',
        'processing': '处理中',
        'shipped': '已发货',
        'delivered': '已送达',
        'cancelled': '已取消'
    };
    return statusMap[status] || status;
}

// 绑定个人资料表单
function bindProfileForms() {
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                first_name: profileForm.firstName.value,
                last_name: profileForm.lastName.value,
                email: profileForm.email.value,
                phone: profileForm.phone.value,
                birthday: profileForm.birthday.value
            };

            try {
                await window.auth.updateProfile(formData);
                window.cart.showNotification('个人信息已更新');
            } catch (error) {
                console.error('更新个人信息失败:', error);
                window.cart.showNotification('更新失败，请重试', 'error');
            }
        });
    }
}

// 绑定模态框事件
function bindModalEvents() {
    // 产品详情模态框
    const modal = document.getElementById('productModal');
    if (modal) {
        const closeBtn = modal.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
}

// 绑定移动端菜单事件
function bindMobileMenuEvents() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (mobileMenuToggle && navMenu) {
        mobileMenuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });

        // 点击外部关闭菜单
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.mobile-menu-toggle') && !e.target.closest('.nav-menu')) {
                navMenu.classList.remove('active');
            }
        });
    }
}

// 检查 URL 参数并处理
function handleUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // 处理搜索参数
    const search = urlParams.get('search');
    if (search && document.getElementById('searchInput')) {
        document.getElementById('searchInput').value = search;
        loadProducts();
    }

    // 处理分类参数
    const category = urlParams.get('category');
    if (category && document.getElementById('categoryFilter')) {
        document.getElementById('categoryFilter').value = category;
        loadProducts();
    }

    // 处理标签参数（个人中心）
    const tab = urlParams.get('tab');
    if (tab) {
        const tabElement = document.querySelector(`[data-tab="${tab}"]`);
        if (tabElement) {
            tabElement.click();
        }
    }
}

// 显示登录模态框
function showLoginModal() {
    const modal = createLoginModal();
    document.body.appendChild(modal);

    setTimeout(() => {
        modal.style.opacity = '1';
        modal.style.transform = 'scale(1)';
    }, 10);

    // 绑定事件
    const loginForm = modal.querySelector('#loginForm');
    const closeBtn = modal.querySelector('.modal-close');
    const switchToRegister = modal.querySelector('#switchToRegister');

    const closeModal = () => {
        modal.style.opacity = '0';
        modal.style.transform = 'scale(0.9)';
        setTimeout(() => {
            document.body.removeChild(modal);
            // 如果在个人中心页面未登录，跳转到首页
            if (window.location.pathname.includes('profile.html')) {
                window.location.href = 'index.html';
            }
        }, 300);
    };

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleLogin(e.target, closeModal);
    });

    closeBtn.addEventListener('click', closeModal);
    switchToRegister?.addEventListener('click', () => {
        switchToRegisterModal(modal);
    });
}

// 创建登录模态框
function createLoginModal() {
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        opacity: 0;
        transform: scale(0.9);
        transition: all 0.3s ease;
    `;

    modal.innerHTML = `
        <div class="modal-content" style="
            background: white;
            padding: 40px;
            border-radius: 12px;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        ">
            <button class="modal-close" style="
                position: absolute;
                top: 15px;
                right: 15px;
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #6b7280;
            ">&times;</button>
            <h2 style="
                text-align: center;
                margin-bottom: 30px;
                color: #1f2937;
            ">登录账户</h2>
            <form id="loginForm">
                <div class="form-group">
                    <label for="loginEmail">邮箱</label>
                    <input type="email" id="loginEmail" required style="
                        width: 100%;
                        padding: 12px;
                        border: 1px solid #e5e7eb;
                        border-radius: 6px;
                        font-size: 14px;
                    ">
                </div>
                <div class="form-group">
                    <label for="loginPassword">密码</label>
                    <input type="password" id="loginPassword" required style="
                        width: 100%;
                        padding: 12px;
                        border: 1px solid #e5e7eb;
                        border-radius: 6px;
                        font-size: 14px;
                    ">
                </div>
                <button type="submit" class="btn-primary btn-large" style="
                    width: 100%;
                    margin-bottom: 15px;
                ">登录</button>
            </form>
            <p style="text-align: center; color: #6b7280; margin-bottom: 15px;">
                还没有账户？<a href="#" id="switchToRegister" style="color: #667eea; text-decoration: none;">立即注册</a>
            </p>
        </div>
    `;

    return modal;
}

// 处理登录
async function handleLogin(form, closeModal) {
    const email = form.loginEmail.value;
    const password = form.loginPassword.value;

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '登录中...';
    submitBtn.disabled = true;

    try {
        const result = await window.auth.login(email, password);
        if (result.error) {
            throw new Error(result.error.message || '登录失败');
        }

        window.cart.showNotification('登录成功！');
        closeModal();
        
        // 重新初始化页面
        setTimeout(() => {
            location.reload();
        }, 1000);

    } catch (error) {
        window.cart.showNotification(error.message || '登录失败，请重试', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// 切换到注册模态框
function switchToRegisterModal(loginModal) {
    // 移除登录模态框
    loginModal.style.opacity = '0';
    loginModal.style.transform = 'scale(0.9)';
    setTimeout(() => {
        document.body.removeChild(loginModal);
    }, 300);

    // 创建注册模态框
    const registerModal = createRegisterModal();
    document.body.appendChild(registerModal);

    setTimeout(() => {
        registerModal.style.opacity = '1';
        registerModal.style.transform = 'scale(1)';
    }, 10);

    // 绑定注册事件
    const registerForm = registerModal.querySelector('#registerForm');
    const closeBtn = registerModal.querySelector('.modal-close');
    const switchToLogin = registerModal.querySelector('#switchToLogin');

    const closeModal = () => {
        registerModal.style.opacity = '0';
        registerModal.style.transform = 'scale(0.9)';
        setTimeout(() => {
            document.body.removeChild(registerModal);
            // 如果在个人中心页面未登录，跳转到首页
            if (window.location.pathname.includes('profile.html')) {
                window.location.href = 'index.html';
            }
        }, 300);
    };

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleRegister(e.target, closeModal);
    });

    closeBtn.addEventListener('click', closeModal);
    switchToLogin?.addEventListener('click', () => {
        // 重新显示登录模态框
        registerModal.style.opacity = '0';
        registerModal.style.transform = 'scale(0.9)';
        setTimeout(() => {
            document.body.removeChild(registerModal);
            showLoginModal();
        }, 300);
    });
}

// 创建注册模态框
function createRegisterModal() {
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        opacity: 0;
        transform: scale(0.9);
        transition: all 0.3s ease;
    `;

    modal.innerHTML = `
        <div class="modal-content" style="
            background: white;
            padding: 40px;
            border-radius: 12px;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        ">
            <button class="modal-close" style="
                position: absolute;
                top: 15px;
                right: 15px;
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #6b7280;
            ">&times;</button>
            <h2 style="
                text-align: center;
                margin-bottom: 30px;
                color: #1f2937;
            ">注册账户</h2>
            <form id="registerForm">
                <div class="form-group">
                    <label for="registerFirstName">姓名</label>
                    <input type="text" id="registerFirstName" required style="
                        width: 100%;
                        padding: 12px;
                        border: 1px solid #e5e7eb;
                        border-radius: 6px;
                        font-size: 14px;
                        margin-bottom: 15px;
                    ">
                </div>
                <div class="form-group">
                    <label for="registerEmail">邮箱</label>
                    <input type="email" id="registerEmail" required style="
                        width: 100%;
                        padding: 12px;
                        border: 1px solid #e5e7eb;
                        border-radius: 6px;
                        font-size: 14px;
                    ">
                </div>
                <div class="form-group">
                    <label for="registerPassword">密码</label>
                    <input type="password" id="registerPassword" required style="
                        width: 100%;
                        padding: 12px;
                        border: 1px solid #e5e7eb;
                        border-radius: 6px;
                        font-size: 14px;
                    ">
                </div>
                <div class="form-group">
                    <label for="registerConfirmPassword">确认密码</label>
                    <input type="password" id="registerConfirmPassword" required style="
                        width: 100%;
                        padding: 12px;
                        border: 1px solid #e5e7eb;
                        border-radius: 6px;
                        font-size: 14px;
                    ">
                </div>
                <button type="submit" class="btn-primary btn-large" style="
                    width: 100%;
                    margin-bottom: 15px;
                ">注册</button>
            </form>
            <p style="text-align: center; color: #6b7280; margin-bottom: 15px;">
                已有账户？<a href="#" id="switchToLogin" style="color: #667eea; text-decoration: none;">立即登录</a>
            </p>
        </div>
    `;

    return modal;
}

// 处理注册
async function handleRegister(form, closeModal) {
    const firstName = form.registerFirstName.value;
    const email = form.registerEmail.value;
    const password = form.registerPassword.value;
    const confirmPassword = form.registerConfirmPassword.value;

    if (password !== confirmPassword) {
        window.cart.showNotification('两次输入的密码不一致', 'error');
        return;
    }

    if (password.length < 6) {
        window.cart.showNotification('密码长度至少6位', 'error');
        return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '注册中...';
    submitBtn.disabled = true;

    try {
        const userData = {
            firstName,
            lastName: '',
            email
        };

        const result = await window.auth.register(email, password, userData);
        if (result.error) {
            throw new Error(result.error.message || '注册失败');
        }

        window.cart.showNotification('注册成功！');
        closeModal();
        
        // 重新初始化页面
        setTimeout(() => {
            location.reload();
        }, 1000);

    } catch (error) {
        window.cart.showNotification(error.message || '注册失败，请重试', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// 页面加载完成后处理 URL 参数
document.addEventListener('DOMContentLoaded', handleUrlParams);