// 主要功能初始化
document.addEventListener('DOMContentLoaded', async () => {
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
        // 如果未登录，跳转到首页
        window.location.href = 'index.html';
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

// 页面加载完成后处理 URL 参数
document.addEventListener('DOMContentLoaded', handleUrlParams);