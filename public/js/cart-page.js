// 购物车页面专用脚本
// 这个文件在 cart.html 中加载，用于处理购物车页面的特定功能

document.addEventListener('DOMContentLoaded', () => {
    // 初始化购物车页面
    initCartPage();
});

function initCartPage() {
    // 绑定事件监听器
    bindCartPageEvents();
    
    // 加载推荐商品
    loadRecommendedProducts();
    
    // 初始化购物车显示
    window.cart.updateCartUI();
}

// 绑定购物车页面特定事件
function bindCartPageEvents() {
    // 清空购物车按钮
    const clearCartBtn = document.getElementById('clearCartBtn');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', () => {
            showClearCartConfirmation();
        });
    }

    // 优惠券相关事件
    const couponCodeInput = document.getElementById('couponCode');
    const applyCouponBtn = document.getElementById('applyCouponBtn');
    
    if (applyCouponBtn) {
        applyCouponBtn.addEventListener('click', applyCoupon);
    }
    
    if (couponCodeInput) {
        couponCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                applyCoupon();
            }
        });
    }

    // 结算按钮
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckout);
    }

    // 监听购物车变化
    window.addEventListener('cartUpdated', () => {
        window.cart.updateCartUI();
        loadRecommendedProducts(); // 重新加载推荐商品
    });
}

// 显示清空购物车确认对话框
function showClearCartConfirmation() {
    if (window.cart.getItemCount() === 0) {
        window.cart.showNotification('购物车已经是空的', 'error');
        return;
    }

    // 创建自定义确认对话框
    const modal = createConfirmationModal(
        '确认清空购物车',
        '确定要清空购物车吗？此操作不可恢复。',
        '确认清空',
        '取消'
    );

    document.body.appendChild(modal);

    // 显示模态框
    setTimeout(() => {
        modal.style.opacity = '1';
        modal.style.transform = 'scale(1)';
    }, 10);

    // 绑定事件
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

    confirmBtn.addEventListener('click', () => {
        window.cart.clearCart();
        closeModal();
    });

    cancelBtn.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);

    // 点击背景关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

// 创建确认模态框
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

// 应用优惠券
async function applyCoupon() {
    const couponCode = document.getElementById('couponCode').value.trim();
    
    if (!couponCode) {
        window.cart.showNotification('请输入优惠券码', 'error');
        return;
    }

    // 显示加载状态
    const applyBtn = document.getElementById('applyCouponBtn');
    const originalText = applyBtn.textContent;
    applyBtn.textContent = '应用中...';
    applyBtn.disabled = true;

    // 模拟异步验证（实际应用中应该调用后端 API）
    setTimeout(() => {
        const success = window.cart.applyCoupon(couponCode);
        
        if (success) {
            document.getElementById('couponCode').value = '';
            // 清空输入框
        }

        // 恢复按钮状态
        applyBtn.textContent = originalText;
        applyBtn.disabled = false;
    }, 1000);
}

// 处理结算
async function handleCheckout() {
    if (window.cart.getItemCount() === 0) {
        window.cart.showNotification('购物车是空的', 'error');
        return;
    }

    // 检查用户是否登录
    if (!window.auth.isLoggedIn()) {
        showLoginPrompt();
        return;
    }

    // 检查购物车商品库存
    const stockCheck = await checkProductStock();
    if (!stockCheck.valid) {
        window.cart.showNotification(stockCheck.message, 'error');
        return;
    }

    // 显示结算确认
    showCheckoutConfirmation();
}

// 检查商品库存
async function checkProductStock() {
    const cartItems = window.cart.cartItems;
    
    for (const item of cartItems) {
        try {
            const result = await window.db.getProductById(item.product_id);
            if (result.error || !result.data) {
                return {
                    valid: false,
                    message: '商品信息获取失败'
                };
            }

            const product = result.data;
            if (product.stock < item.quantity) {
                return {
                    valid: false,
                    message: `${product.name} 库存不足，当前库存：${product.stock}`
                };
            }
        } catch (error) {
            return {
                valid: false,
                message: '库存检查失败，请重试'
            };
        }
    }

    return { valid: true };
}

// 显示登录提示
function showLoginPrompt() {
    const modal = createConfirmationModal(
        '请先登录',
        '结算需要您先登录账户，是否立即登录？',
        '去登录',
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

    confirmBtn.addEventListener('click', () => {
        closeModal();
        // 跳转到登录页面或显示登录模态框
        window.location.href = 'profile.html?tab=login';
    });

    cancelBtn.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

// 显示结算确认
function showCheckoutConfirmation() {
    const totals = window.cart.calculateTotal();
    
    const modal = createConfirmationModal(
        '确认订单',
        `订单总额：¥${totals.total.toFixed(2)}（含运费¥${totals.shipping.toFixed(2)}）<br>
        确认要提交订单吗？`,
        '确认支付',
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

    confirmBtn.addEventListener('click', () => {
        closeModal();
        processCheckout();
    });

    cancelBtn.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

// 处理结算流程
async function processCheckout() {
    const checkoutBtn = document.getElementById('checkoutBtn');
    const originalText = checkoutBtn.textContent;
    
    // 显示处理状态
    checkoutBtn.textContent = '处理中...';
    checkoutBtn.disabled = true;

    try {
        await window.cart.checkout();
    } catch (error) {
        console.error('结算失败:', error);
    } finally {
        // 恢复按钮状态
        checkoutBtn.textContent = originalText;
        checkoutBtn.disabled = false;
    }
}

// 加载推荐商品
async function loadRecommendedProducts() {
    const container = document.getElementById('recommendedProducts');
    if (!container || window.cart.getItemCount() === 0) return;

    // 显示加载状态
    container.innerHTML = '<p style="text-align: center; color: #6b7280;">加载中...</p>';

    try {
        // 获取购物车中的商品分类
        const cartItemCategories = new Set();
        for (const item of window.cart.cartItems) {
            const productResult = await window.db.getProductById(item.product_id);
            if (productResult.data && productResult.data.category_id) {
                cartItemCategories.add(productResult.data.category_id);
            }
        }

        // 获取推荐商品
        let result;
        if (cartItemCategories.size > 0) {
            // 获取相同分类的其他商品
            const categoryId = Array.from(cartItemCategories)[0];
            result = await window.db.getProducts({
                filters: { category_id: categoryId },
                order: { column: 'created_at', ascending: false },
                range: { start: 0, end: 1 }
            });

            // 过滤掉已经在购物车中的商品
            if (result.data) {
                const cartProductIds = window.cart.cartItems.map(item => item.product_id);
                result.data = result.data.filter(product => 
                    !cartProductIds.includes(product.id)
                );
            }
        } else {
            // 获取热门商品
            result = await window.productService.getFeaturedProducts(2);
        }

        if (result.error || !result.data || result.data.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #6b7280;">暂无推荐商品</p>';
            return;
        }

        container.innerHTML = result.data.map(product => `
            <div class="product-card">
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <div class="product-info">
                    <h3 class="product-name" style="font-size: 14px; margin-bottom: 5px;">${product.name}</h3>
                    <p class="product-price" style="font-size: 16px; margin-bottom: 8px;">¥${parseFloat(product.price).toFixed(2)}</p>
                    <button class="add-to-cart-btn" data-product-id="${product.id}" style="
                        padding: 8px;
                        font-size: 12px;
                    ">
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

    } catch (error) {
        console.error('加载推荐商品失败:', error);
        container.innerHTML = '<p style="text-align: center; color: #ef4444;">加载失败</p>';
    }
}