// 个人中心页面专用脚本
// 这个文件在 profile.html 中加载，用于处理个人中心页面的特定功能

document.addEventListener('DOMContentLoaded', async () => {
    // 检查登录状态
    if (!window.auth.isLoggedIn()) {
        // 如果未登录，可以显示登录模态框或跳转到首页
        showLoginModal();
        return;
    }

    // 初始化个人中心页面
    await initProfilePage();
});

async function initProfilePage() {
    // 绑定标签切换事件
    bindTabNavigation();
    
    // 加载用户信息
    await loadUserProfile();
    
    // 绑定表单事件
    bindProfileForms();
    
    // 绑定其他事件
    bindProfileEvents();
    
    // 处理 URL 参数
    handleProfilePageParams();
    
    // 加载默认标签内容
    const activeTab = document.querySelector('.profile-nav .nav-item.active');
    if (activeTab) {
        const tabId = activeTab.dataset.tab;
        await loadTabContent(tabId);
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
            // 跳转到首页
            window.location.href = 'index.html';
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

// 绑定标签导航
function bindTabNavigation() {
    const navItems = document.querySelectorAll('.profile-nav .nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = item.dataset.tab;
            
            // 更新 URL
            const url = new URL(window.location);
            url.searchParams.set('tab', tabId);
            window.history.replaceState({}, '', url);

            // 切换标签
            switchTab(tabId);
        });
    });
}

// 切换标签
async function switchTab(tabId) {
    const navItems = document.querySelectorAll('.profile-nav .nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    // 移除所有活动状态
    navItems.forEach(nav => nav.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    // 添加当前活动状态
    const activeNav = document.querySelector(`[data-tab="${tabId}"]`);
    const targetTab = document.getElementById(tabId);
    
    if (activeNav && targetTab) {
        activeNav.classList.add('active');
        targetTab.classList.add('active');
        await loadTabContent(tabId);
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
        case 'profile':
            // 个人信息标签在页面加载时已经处理
            break;
        case 'addresses':
            await loadAddresses();
            break;
        case 'favorites':
            await loadFavorites();
            break;
        case 'settings':
            // 设置标签在页面加载时已经处理
            break;
    }
}

// 处理 URL 参数
function handleProfilePageParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    
    if (tab) {
        const tabElement = document.querySelector(`[data-tab="${tab}"]`);
        if (tabElement) {
            tabElement.click();
        }
    }
}

// 加载用户信息
async function loadUserProfile() {
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
        // 显示加载状态
        const dashboardElement = document.getElementById('dashboard');
        const existingContent = dashboardElement.innerHTML;
        
        // 获取订单统计
        const ordersResult = await window.db.getOrders(user.id);
        const orders = ordersResult.data || [];
        
        // 计算总消费
        const totalSpent = orders.reduce((total, order) => total + (order.total || 0), 0);
        
        // 获取收藏数量
        const favoritesResult = await window.db.getFavorites(user.id);
        const favoriteCount = favoritesResult.data?.length || 0;

        // 更新统计信息
        const totalOrdersElement = document.getElementById('totalOrders');
        const totalSpentElement = document.getElementById('totalSpent');
        const favoriteCountElement = document.getElementById('favoriteCount');

        if (totalOrdersElement) totalOrdersElement.textContent = orders.length;
        if (totalSpentElement) totalSpentElement.textContent = `¥${totalSpent.toFixed(2)}`;
        if (favoriteCountElement) favoriteCountElement.textContent = favoriteCount;

        // 显示最近订单
        renderRecentOrders(orders.slice(0, 3));

    } catch (error) {
        console.error('加载仪表板数据失败:', error);
        window.cart.showNotification('加载数据失败，请刷新页面', 'error');
    }
}

// 渲染最近订单
function renderRecentOrders(orders) {
    const container = document.getElementById('recentOrdersList');
    if (!container) return;

    if (orders.length === 0) {
        container.innerHTML = '<p style="color: #6b7280; text-align: center; padding: 20px;">暂无订单</p>';
        return;
    }

    container.innerHTML = `
        <div style="display: grid; gap: 15px;">
            ${orders.map(order => `
                <div class="order-item" style="
                    padding: 15px;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <div>
                        <div style="font-weight: 600; color: #1f2937;">订单 #${order.id}</div>
                        <div style="color: #6b7280; font-size: 14px;">${new Date(order.created_at).toLocaleDateString()}</div>
                    </div>
                    <div style="text-align: right;">
                        <div class="order-status" style="
                            padding: 4px 8px;
                            border-radius: 4px;
                            font-size: 12px;
                            font-weight: 500;
                            background: ${getOrderStatusColor(order.status)};
                            color: white;
                            margin-bottom: 5px;
                        ">${getOrderStatusText(order.status)}</div>
                        <div style="font-weight: 600; color: #ef4444;">¥${parseFloat(order.total || 0).toFixed(2)}</div>
                    </div>
                </div>
            `).join('')}
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

            const submitBtn = profileForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = '保存中...';
            submitBtn.disabled = true;

            try {
                await window.auth.updateProfile(formData);
                window.cart.showNotification('个人信息已更新');
            } catch (error) {
                console.error('更新个人信息失败:', error);
                window.cart.showNotification('更新失败，请重试', 'error');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
}

// 绑定个人中心事件
function bindProfileEvents() {
    // 登出按钮
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (confirm('确定要退出登录吗？')) {
                await window.auth.logout();
                window.cart.showNotification('已退出登录');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            }
        });
    }

    // 添加地址按钮
    const addAddressBtn = document.getElementById('addAddressBtn');
    if (addAddressBtn) {
        addAddressBtn.addEventListener('click', showAddAddressModal);
    }

    // 修改密码按钮
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', showChangePasswordModal);
    }

    // 删除账户按钮
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', showDeleteAccountConfirmation);
    }

    // 地址模态框
    const addressModal = document.getElementById('addressModal');
    if (addressModal) {
        bindAddressModalEvents();
    }
}

// 显示添加地址模态框
function showAddAddressModal() {
    const modal = document.getElementById('addressModal');
    if (!modal) return;

    // 重置表单
    const form = document.getElementById('addressForm');
    if (form) form.reset();

    // 显示模态框
    modal.style.display = 'block';
}

// 绑定地址模态框事件
function bindAddressModalEvents() {
    const modal = document.getElementById('addressModal');
    const form = document.getElementById('addressForm');
    const closeBtn = modal.querySelector('.close');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleAddressSubmit(form, modal);
        });
    }

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

// 处理地址提交
async function handleAddressSubmit(form, modal) {
    const user = window.auth.getCurrentUser();
    if (!user) return;

    const addressData = {
        user_id: user.id,
        name: document.getElementById('addressName').value,
        phone: document.getElementById('addressPhone').value,
        province: document.getElementById('province').value,
        city: document.getElementById('city').value,
        district: document.getElementById('district').value,
        street_address: document.getElementById('streetAddress').value,
        is_default: document.getElementById('isDefault').checked
    };

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '保存中...';
    submitBtn.disabled = true;

    try {
        await window.db.createAddress(addressData);
        window.cart.showNotification('地址已保存');
        modal.style.display = 'none';
        await loadAddresses();
    } catch (error) {
        console.error('保存地址失败:', error);
        window.cart.showNotification('保存失败，请重试', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// 显示修改密码模态框
function showChangePasswordModal() {
    const modal = createPasswordModal();
    document.body.appendChild(modal);

    setTimeout(() => {
        modal.style.opacity = '1';
        modal.style.transform = 'scale(1)';
    }, 10);

    const form = modal.querySelector('#passwordForm');
    const closeBtn = modal.querySelector('.modal-close');

    const closeModal = () => {
        modal.style.opacity = '0';
        modal.style.transform = 'scale(0.9)';
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handlePasswordChange(e.target, closeModal);
    });

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

// 创建密码修改模态框
function createPasswordModal() {
    const modal = document.createElement('div');
    modal.className = 'password-modal';
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
            <h3 style="margin-bottom: 25px; color: #1f2937;">修改密码</h3>
            <form id="passwordForm">
                <div class="form-group">
                    <label for="currentPassword">当前密码</label>
                    <input type="password" id="currentPassword" required style="
                        width: 100%;
                        padding: 12px;
                        border: 1px solid #e5e7eb;
                        border-radius: 6px;
                        font-size: 14px;
                    ">
                </div>
                <div class="form-group">
                    <label for="newPassword">新密码</label>
                    <input type="password" id="newPassword" required style="
                        width: 100%;
                        padding: 12px;
                        border: 1px solid #e5e7eb;
                        border-radius: 6px;
                        font-size: 14px;
                    ">
                </div>
                <div class="form-group">
                    <label for="confirmPassword">确认新密码</label>
                    <input type="password" id="confirmPassword" required style="
                        width: 100%;
                        padding: 12px;
                        border: 1px solid #e5e7eb;
                        border-radius: 6px;
                        font-size: 14px;
                    ">
                </div>
                <button type="submit" class="btn-primary btn-large">修改密码</button>
            </form>
        </div>
    `;

    return modal;
}

// 处理密码修改
async function handlePasswordChange(form, closeModal) {
    const newPassword = form.newPassword.value;
    const confirmPassword = form.confirmPassword.value;

    if (newPassword !== confirmPassword) {
        window.cart.showNotification('两次输入的密码不一致', 'error');
        return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '修改中...';
    submitBtn.disabled = true;

    try {
        await window.auth.changePassword(newPassword);
        window.cart.showNotification('密码修改成功');
        closeModal();
    } catch (error) {
        console.error('修改密码失败:', error);
        window.cart.showNotification('修改失败，请重试', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// 显示删除账户确认
function showDeleteAccountConfirmation() {
    const modal = createConfirmationModal(
        '删除账户',
        '确定要删除账户吗？此操作不可恢复，所有数据将被永久删除。',
        '确认删除',
        '取消'
    );

    document.body.appendChild(modal);

    setTimeout(() => {
        modal.style.opacity = '1';
        modal.style.transform = 'scale(1)';
    }, 10);

    const confirmBtn = modal.querySelector('.modal-confirm');
    const cancelBtn = modal.querySelector('.modal-cancel');
    const closeBtn = modal.querySelector('.modal-close');

    const closeModal = () => {
        modal.style.opacity = '0';
        modal.style.transform = 'scale(0.9)';
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    };

    confirmBtn.addEventListener('click', async () => {
        // 这里应该调用删除账户的 API
        window.cart.showNotification('账户删除功能暂未实现');
        closeModal();
    });

    cancelBtn.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

// 创建确认模态框（复用购物车页面的函数）
function createConfirmationModal(title, message, confirmText, cancelText) {
    const modal = document.createElement('div');
    modal.className = 'custom-modal';
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
            padding: 30px;
            border-radius: 12px;
            max-width: 400px;
            width: 90%;
            text-align: center;
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
            <h3 style="
                font-size: 20px;
                font-weight: 600;
                margin-bottom: 15px;
                color: #1f2937;
            ">${title}</h3>
            <p style="
                color: #6b7280;
                margin-bottom: 25px;
                line-height: 1.5;
            ">${message}</p>
            <div style="
                display: flex;
                gap: 12px;
                justify-content: center;
            ">
                <button class="modal-cancel btn-secondary" style="
                    flex: 1;
                ">${cancelText}</button>
                <button class="modal-confirm btn-danger" style="
                    flex: 1;
                ">${confirmText}</button>
            </div>
        </div>
    `;

    return modal;
}