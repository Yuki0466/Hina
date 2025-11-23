// 购物车服务
class CartService {
    constructor() {
        this.cartItems = [];
        this.cartKey = CONFIG.STORAGE_KEYS.CART;
        this.init();
    }

    // 初始化购物车
    init() {
        this.loadCart();
        this.updateCartUI();
    }

    // 加载购物车数据
    loadCart() {
        const cartData = localStorage.getItem(this.cartKey);
        if (cartData) {
            this.cartItems = JSON.parse(cartData);
        }
    }

    // 保存购物车数据
    saveCart() {
        localStorage.setItem(this.cartKey, JSON.stringify(this.cartItems));
    }

    // 添加商品到购物车
    async addToCart(productId, quantity = 1) {
        try {
            console.log('尝试添加产品到购物车:', productId);
            
            // 获取产品信息
            const productResult = await window.db.getProductById(productId);
            
            if (productResult.error) {
                console.error('产品查询错误:', productResult.error);
                throw new Error('产品查询失败: ' + productResult.error.message);
            }
            
            if (!productResult.data) {
                console.error('产品不存在，ID:', productId);
                
                // 调试：列出所有可用的产品
                const allProducts = await window.db.getProducts();
                console.log('所有可用产品:', allProducts);
                
                // 显示所有产品ID用于调试
                if (allProducts.data && allProducts.data.length > 0) {
                    console.log('所有产品ID:', allProducts.data.map(p => ({ id: p.id, name: p.name })));
                }
                
                throw new Error(`产品不存在 (ID: ${productId})`);
            }

            const product = productResult.data;
            console.log('成功获取产品信息:', product);

            // 检查是否已在购物车中
            const existingItem = this.cartItems.find(item => item.product_id === productId);

            if (existingItem) {
                // 更新数量
                const newQuantity = existingItem.quantity + quantity;
                if (newQuantity > product.stock) {
                    throw new Error('库存不足');
                }
                existingItem.quantity = newQuantity;
                existingItem.updated_at = new Date().toISOString();
            } else {
                // 添加新商品
                const cartItem = {
                    id: this.generateId(),
                    product_id: productId,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    quantity: quantity,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                this.cartItems.push(cartItem);
            }

            this.saveCart();
            this.updateCartUI();
            this.showNotification('商品已添加到购物车');

        } catch (error) {
            console.error('添加到购物车失败:', error);
            this.showNotification(error.message || '添加失败', 'error');
        }
    }

    // 从购物车移除商品
    removeFromCart(itemId) {
        this.cartItems = this.cartItems.filter(item => item.id !== itemId);
        this.saveCart();
        this.updateCartUI();
        this.showNotification('商品已从购物车移除');
    }

    // 更新商品数量
    updateQuantity(itemId, quantity) {
        const item = this.cartItems.find(item => item.id === itemId);
        if (item) {
            item.quantity = Math.max(1, quantity);
            item.updated_at = new Date().toISOString();
            this.saveCart();
            this.updateCartUI();
        }
    }

    // 清空购物车
    clearCart() {
        this.cartItems = [];
        this.saveCart();
        this.updateCartUI();
        this.showNotification('购物车已清空');
    }

    // 获取购物车商品数量
    getItemCount() {
        return this.cartItems.reduce((total, item) => total + item.quantity, 0);
    }

    // 计算购物车总价
    calculateTotal() {
        const subtotal = this.cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
        const shipping = subtotal >= CONFIG.SHIPPING_THRESHOLD ? 0 : CONFIG.SHIPPING_FEE;
        const discount = 0; // 这里可以添加折扣逻辑
        const tax = subtotal * CONFIG.TAX_RATE;
        const total = subtotal + shipping + tax - discount;

        return {
            subtotal,
            shipping,
            discount,
            tax,
            total
        };
    }

    // 更新购物车 UI
    updateCartUI() {
        // 更新购物车计数
        const cartCountElements = document.querySelectorAll('.cart-count');
        const itemCount = this.getItemCount();
        cartCountElements.forEach(element => {
            element.textContent = itemCount;
        });

        // 更新购物车页面（如果在购物车页面）
        if (window.location.pathname.includes('cart.html')) {
            this.renderCartItems();
            this.renderCartSummary();
        }
    }

    // 渲染购物车商品列表
    renderCartItems() {
        const container = document.getElementById('cartItemsList');
        const emptyCart = document.getElementById('emptyCart');

        if (!container) return;

        if (this.cartItems.length === 0) {
            container.style.display = 'none';
            if (emptyCart) emptyCart.style.display = 'block';
            return;
        }

        container.style.display = 'block';
        if (emptyCart) emptyCart.style.display = 'none';

        container.innerHTML = this.cartItems.map(item => `
            <div class="cart-item" data-item-id="${item.id}">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-info">
                    <h3 class="cart-item-name">${item.name}</h3>
                    <p class="cart-item-price">¥${parseFloat(item.price).toFixed(2)}</p>
                    <div class="cart-item-actions">
                        <div class="quantity-controls">
                            <button class="quantity-btn minus">-</button>
                            <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="99">
                            <button class="quantity-btn plus">+</button>
                        </div>
                        <button class="remove-btn">移除</button>
                    </div>
                </div>
            </div>
        `).join('');

        // 绑定事件
        container.querySelectorAll('.cart-item').forEach(item => {
            const itemId = item.dataset.itemId;
            const minusBtn = item.querySelector('.minus');
            const plusBtn = item.querySelector('.plus');
            const quantityInput = item.querySelector('.quantity-input');
            const removeBtn = item.querySelector('.remove-btn');

            minusBtn.addEventListener('click', () => {
                const currentQuantity = parseInt(quantityInput.value);
                if (currentQuantity > 1) {
                    this.updateQuantity(itemId, currentQuantity - 1);
                }
            });

            plusBtn.addEventListener('click', () => {
                const currentQuantity = parseInt(quantityInput.value);
                this.updateQuantity(itemId, currentQuantity + 1);
            });

            quantityInput.addEventListener('change', () => {
                const newQuantity = parseInt(quantityInput.value);
                if (newQuantity >= 1) {
                    this.updateQuantity(itemId, newQuantity);
                } else {
                    quantityInput.value = 1;
                }
            });

            removeBtn.addEventListener('click', () => {
                this.removeFromCart(itemId);
            });
        });
    }

    // 渲染购物车汇总
    renderCartSummary() {
        const totals = this.calculateTotal();
        
        // 更新汇总信息
        const totalItemsElement = document.getElementById('totalItems');
        const subtotalElement = document.getElementById('subtotal');
        const shippingElement = document.getElementById('shipping');
        const discountElement = document.getElementById('discount');
        const totalElement = document.getElementById('total');

        if (totalItemsElement) totalItemsElement.textContent = this.getItemCount();
        if (subtotalElement) subtotalElement.textContent = `¥${totals.subtotal.toFixed(2)}`;
        if (shippingElement) shippingElement.textContent = totals.shipping === 0 ? '免费' : `¥${totals.shipping.toFixed(2)}`;
        if (discountElement) discountElement.textContent = `-¥${totals.discount.toFixed(2)}`;
        if (totalElement) totalElement.textContent = `¥${totals.total.toFixed(2)}`;
    }

    // 应用优惠券
    applyCoupon(couponCode) {
        // 这里可以实现优惠券逻辑
        const coupons = {
            'SAVE10': 0.1,
            'SAVE20': 0.2,
            'NEWUSER': 0.15
        };

        const discount = coupons[couponCode.toUpperCase()];
        if (discount) {
            this.updateCartUI();
            this.showNotification(`优惠券已应用，节省 ${discount * 100}%`);
            return true;
        } else {
            this.showNotification('无效的优惠券码', 'error');
            return false;
        }
    }

    // 结算
    async checkout() {
        if (this.cartItems.length === 0) {
            this.showNotification('购物车是空的', 'error');
            return;
        }

        // 检查用户是否登录
        if (!window.auth.isLoggedIn()) {
            this.showNotification('请先登录', 'error');
            // 跳转到登录页面或显示登录模态框
            return;
        }

        const totals = this.calculateTotal();
        const orderData = {
            user_id: window.auth.getCurrentUser().id,
            items: this.cartItems,
            subtotal: totals.subtotal,
            shipping: totals.shipping,
            discount: totals.discount,
            tax: totals.tax,
            total: totals.total,
            status: 'pending',
            created_at: new Date().toISOString()
        };

        try {
            const result = await window.db.createOrder(orderData);
            if (result.error) {
                throw new Error('创建订单失败');
            }

            // 清空购物车
            this.clearCart();
            
            // 跳转到订单确认页面
            this.showNotification('订单创建成功！', 'success');
            setTimeout(() => {
                window.location.href = 'profile.html?tab=orders';
            }, 2000);

        } catch (error) {
            console.error('结算失败:', error);
            this.showNotification('结算失败，请重试', 'error');
        }
    }

    // 显示通知
    showNotification(message, type = 'success') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        // 添加样式
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '9999',
            opacity: '0',
            transform: 'translateY(-20px)',
            transition: 'all 0.3s ease'
        });

        if (type === 'error') {
            notification.style.background = '#ef4444';
        } else {
            notification.style.background = '#10b981';
        }

        document.body.appendChild(notification);

        // 显示动画
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 100);

        // 3秒后移除
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // 生成唯一 ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

// 创建购物车服务实例
window.cart = new CartService();