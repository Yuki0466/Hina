// 产品相关功能
class ProductService {
    constructor() {
        this.currentProducts = [];
        this.currentPage = 1;
        this.filters = {};
    }

    // 获取热门产品
    async getFeaturedProducts(limit = 8) {
        const result = await window.db.getProducts({
            filters: { featured: true },
            order: { column: 'created_at', ascending: false },
            range: { start: 0, end: limit - 1 }
        });
        return result;
    }

    // 获取所有产品（带分页）
    async getAllProducts(page = 1, filters = {}, sortBy = 'created_desc') {
        this.filters = filters;
        this.currentPage = page;

        const itemsPerPage = CONFIG.ITEMS_PER_PAGE;
        const offset = (page - 1) * itemsPerPage;

        // 处理排序
        let order = this.parseSortOrder(sortBy);

        // 构建查询选项
        const options = {
            order,
            range: { start: offset, end: offset + itemsPerPage - 1 }
        };

        // 添加过滤器
        if (filters.category) {
            options.filters = { category_id: filters.category };
        }

        // 价格过滤器
        if (filters.priceRange) {
            const [min, max] = filters.priceRange.split('-').map(p => p === '+' ? Infinity : parseFloat(p));
            // 这里需要更复杂的价格过滤逻辑
            // 简化处理：先获取所有数据，然后在前端过滤
            const allProductsResult = await window.db.getProducts({ order });
            const filtered = allProductsResult.data.filter(product => {
                if (filters.category && product.category_id !== filters.category) return false;
                if (filters.priceRange) {
                    const price = parseFloat(product.price);
                    if (max === Infinity) {
                        return price >= min;
                    } else {
                        return price >= min && price <= max;
                    }
                }
                return true;
            });

            const paginatedData = filtered.slice(offset, offset + itemsPerPage);
            return { data: paginatedData, error: null, total: filtered.length };
        }

        return await window.db.getProducts(options);
    }

    // 搜索产品
    async searchProducts(query) {
        return await window.db.searchProducts(query);
    }

    // 获取产品详情
    async getProductById(id) {
        return await window.db.getProductById(id);
    }

    // 获取分类产品
    async getProductsByCategory(categoryId) {
        return await window.db.getProductsByCategory(categoryId);
    }

    // 解析排序参数
    parseSortOrder(sortBy) {
        const [field, direction] = sortBy.split('-');
        const column = field === 'name' ? 'name' : 
                      field === 'price' ? 'price' : 
                      'created_at';
        const ascending = direction === 'asc';
        return { column, ascending };
    }

    // 渲染产品卡片
    renderProductCard(product) {
        const price = parseFloat(product.price);
        return `
            <div class="product-card" data-product-id="${product.id}">
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-price">¥${price.toFixed(2)}</p>
                    <p class="product-description">${product.description}</p>
                    <button class="add-to-cart-btn" data-product-id="${product.id}">
                        加入购物车
                    </button>
                </div>
            </div>
        `;
    }

    // 渲染产品网格
    renderProductGrid(products, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (products.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>没有找到符合条件的产品</p>
                </div>
            `;
            return;
        }

        container.innerHTML = products.map(product => this.renderProductCard(product)).join('');

        // 绑定添加到购物车事件
        container.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = btn.dataset.productId;
                window.cart.addToCart(productId, 1);
            });
        });

        // 绑定产品卡片点击事件
        container.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('add-to-cart-btn')) {
                    const productId = card.dataset.productId;
                    this.showProductDetails(productId);
                }
            });
        });
    }

    // 显示产品详情
    async showProductDetails(productId) {
        const result = await this.getProductById(productId);
        if (result.error || !result.data) {
            console.error('获取产品详情失败:', result.error);
            return;
        }

        const product = result.data;
        const modal = document.getElementById('productModal');
        if (!modal) return;

        const modalContent = modal.querySelector('#modalProductDetails');
        if (!modalContent) return;

        const price = parseFloat(product.price);
        modalContent.innerHTML = `
            <div class="product-detail">
                <div class="product-detail-image">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="product-detail-info">
                    <h2>${product.name}</h2>
                    <p class="product-price">¥${price.toFixed(2)}</p>
                    <p class="product-description">${product.description}</p>
                    <div class="product-actions">
                        <div class="quantity-selector">
                            <button class="quantity-btn minus">-</button>
                            <input type="number" class="quantity-input" value="1" min="1" max="${product.stock}">
                            <button class="quantity-btn plus">+</button>
                        </div>
                        <button class="add-to-cart-btn btn-large" data-product-id="${product.id}">
                            加入购物车
                        </button>
                    </div>
                    <div class="product-meta">
                        <p><strong>库存:</strong> ${product.stock} 件</p>
                        <p><strong>分类:</strong> ${product.category_id}</p>
                    </div>
                </div>
            </div>
        `;

        // 绑定数量选择器事件
        const minusBtn = modalContent.querySelector('.quantity-btn.minus');
        const plusBtn = modalContent.querySelector('.quantity-btn.plus');
        const quantityInput = modalContent.querySelector('.quantity-input');

        minusBtn.addEventListener('click', () => {
            const currentValue = parseInt(quantityInput.value);
            if (currentValue > 1) {
                quantityInput.value = currentValue - 1;
            }
        });

        plusBtn.addEventListener('click', () => {
            const currentValue = parseInt(quantityInput.value);
            const maxValue = parseInt(quantityInput.max);
            if (currentValue < maxValue) {
                quantityInput.value = currentValue + 1;
            }
        });

        // 绑定添加到购物车事件
        const addToCartBtn = modalContent.querySelector('.add-to-cart-btn');
        addToCartBtn.addEventListener('click', () => {
            const quantity = parseInt(quantityInput.value);
            window.cart.addToCart(productId, quantity);
            modal.style.display = 'none';
        });

        modal.style.display = 'block';
    }
}

// 创建产品服务实例
window.productService = new ProductService();

// 渲染分类
async function renderCategories() {
    const result = await window.db.getCategories();
    if (result.error || !result.data) {
        console.error('获取分类失败:', result.error);
        return;
    }

    const container = document.getElementById('categoryGrid');
    if (!container) return;

    container.innerHTML = result.data.map(category => `
        <div class="category-card" data-category-id="${category.id}">
            <div class="category-icon">${category.icon}</div>
            <div class="category-name">${category.name}</div>
        </div>
    `).join('');

    // 绑定分类点击事件
    container.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            const categoryId = card.dataset.categoryId;
            // 跳转到产品页面并筛选该分类
            window.location.href = `products.html?category=${categoryId}`;
        });
    });
}

// 渲染分页
function renderPagination(currentPage, totalPages, containerId) {
    const container = document.getElementById(containerId);
    if (!container || totalPages <= 1) return;

    let paginationHTML = '';

    // 上一页
    if (currentPage > 1) {
        paginationHTML += `<button class="pagination-btn" data-page="${currentPage - 1}">上一页</button>`;
    }

    // 页码
    for (let i = 1; i <= totalPages; i++) {
        const activeClass = i === currentPage ? 'active' : '';
        paginationHTML += `<button class="pagination-btn ${activeClass}" data-page="${i}">${i}</button>`;
    }

    // 下一页
    if (currentPage < totalPages) {
        paginationHTML += `<button class="pagination-btn" data-page="${currentPage + 1}">下一页</button>`;
    }

    container.innerHTML = paginationHTML;

    // 绑定分页点击事件
    container.querySelectorAll('.pagination-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = parseInt(btn.dataset.page);
            loadProducts(page);
        });
    });
}

// 加载产品列表
async function loadProducts(page = 1) {
    // 获取筛选条件
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';
    const priceFilter = document.getElementById('priceFilter')?.value || '';
    const sortBy = document.getElementById('sortBy')?.value || 'created_desc';
    const searchInput = document.getElementById('searchInput')?.value || '';

    const filters = {};
    if (categoryFilter) filters.category = categoryFilter;
    if (priceFilter) filters.priceRange = priceFilter;

    let result;
    if (searchInput) {
        result = await window.productService.searchProducts(searchInput);
    } else {
        result = await window.productService.getAllProducts(page, filters, sortBy);
    }

    if (result.error) {
        console.error('加载产品失败:', result.error);
        return;
    }

    // 渲染产品
    window.productService.renderProductGrid(result.data, 'allProducts');

    // 更新产品计数
    const countElement = document.getElementById('productsCount');
    if (countElement) {
        const total = result.total || result.data.length;
        countElement.textContent = `共找到 ${total} 个产品`;
    }

    // 渲染分页
    const totalItems = result.total || result.data.length;
    const totalPages = Math.ceil(totalItems / CONFIG.ITEMS_PER_PAGE);
    renderPagination(page, totalPages, 'pagination');
}