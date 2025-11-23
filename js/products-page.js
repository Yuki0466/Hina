// 产品页面专用脚本
// 这个文件在 products.html 中加载，用于处理产品页面的特定功能

document.addEventListener('DOMContentLoaded', async () => {
    // 初始化页面
    await initProductsPage();
});

async function initProductsPage() {
    // 加载分类选项
    await loadCategoryOptions();
    
    // 绑定事件监听器
    bindProductsPageEvents();
    
    // 处理 URL 参数
    handleProductsPageParams();
    
    // 加载产品
    await loadProducts();
}

// 绑定产品页面特定事件
function bindProductsPageEvents() {
    // 筛选器事件
    const categoryFilter = document.getElementById('categoryFilter');
    const priceFilter = document.getElementById('priceFilter');
    const sortBy = document.getElementById('sortBy');
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');

    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            updateURL();
            loadProducts();
        });
    }
    
    if (priceFilter) {
        priceFilter.addEventListener('change', () => {
            updateURL();
            loadProducts();
        });
    }
    
    if (sortBy) {
        sortBy.addEventListener('change', () => {
            updateURL();
            loadProducts();
        });
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            updateURL();
            loadProducts();
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                updateURL();
                loadProducts();
            }
        });
        
        // 防抖搜索
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                updateURL();
                loadProducts();
            }, 500);
        });
    }
}

// 处理 URL 参数
function handleProductsPageParams() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // 恢复筛选状态
    const category = urlParams.get('category');
    const priceRange = urlParams.get('priceRange');
    const sort = urlParams.get('sort');
    const search = urlParams.get('search');
    const page = urlParams.get('page');

    if (category && document.getElementById('categoryFilter')) {
        document.getElementById('categoryFilter').value = category;
    }
    
    if (priceRange && document.getElementById('priceFilter')) {
        document.getElementById('priceFilter').value = priceRange;
    }
    
    if (sort && document.getElementById('sortBy')) {
        document.getElementById('sortBy').value = sort;
    }
    
    if (search && document.getElementById('searchInput')) {
        document.getElementById('searchInput').value = decodeURIComponent(search);
    }

    // 设置当前页码
    if (page) {
        window.productService.currentPage = parseInt(page);
    }
}

// 更新 URL
function updateURL() {
    const urlParams = new URLSearchParams();
    
    const category = document.getElementById('categoryFilter')?.value;
    const priceRange = document.getElementById('priceFilter')?.value;
    const sort = document.getElementById('sortBy')?.value;
    const search = document.getElementById('searchInput')?.value;
    
    if (category) urlParams.set('category', category);
    if (priceRange) urlParams.set('priceRange', priceRange);
    if (sort) urlParams.set('sort', sort);
    if (search) urlParams.set('search', encodeURIComponent(search));
    if (window.productService.currentPage > 1) {
        urlParams.set('page', window.productService.currentPage);
    }
    
    const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
}

// 加载分类选项
async function loadCategoryOptions() {
    const result = await window.db.getCategories();
    if (result.error || !result.data) return;

    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter) return;

    const defaultOption = categoryFilter.querySelector('option[value=""]');
    categoryFilter.innerHTML = '';
    if (defaultOption) {
        categoryFilter.appendChild(defaultOption);
    }

    result.data.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        categoryFilter.appendChild(option);
    });
}

// 加载产品
async function loadProducts() {
    // 显示加载状态
    showLoadingState();

    // 获取筛选条件
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';
    const priceFilter = document.getElementById('priceFilter')?.value || '';
    const sortBy = document.getElementById('sortBy')?.value || 'created_desc';
    const searchInput = document.getElementById('searchInput')?.value || '';

    const filters = {};
    if (categoryFilter) filters.category = categoryFilter;
    if (priceFilter) filters.priceRange = priceFilter;

    let result;
    if (searchInput.trim()) {
        result = await window.productService.searchProducts(searchInput.trim());
    } else {
        result = await window.productService.getAllProducts(
            window.productService.currentPage, 
            filters, 
            sortBy
        );
    }

    if (result.error) {
        console.error('加载产品失败:', result.error);
        showErrorState('加载产品失败，请刷新页面重试');
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
    renderPagination(window.productService.currentPage, totalPages, 'pagination');

    // 隐藏加载状态
    hideLoadingState();
}

// 显示加载状态
function showLoadingState() {
    const container = document.getElementById('allProducts');
    if (!container) return;

    container.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>正在加载产品...</p>
        </div>
    `;
}

// 隐藏加载状态
function hideLoadingState() {
    // 加载完成后会被产品渲染覆盖
}

// 显示错误状态
function showErrorState(message) {
    const container = document.getElementById('allProducts');
    if (!container) return;

    container.innerHTML = `
        <div class="error-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" x2="12" y1="8" y2="12"></line>
                <line x1="12" x2="12.01" y1="16" y2="16"></line>
            </svg>
            <h3>加载失败</h3>
            <p>${message}</p>
            <button class="btn-primary" onclick="loadProducts()">重试</button>
        </div>
    `;
}

// 渲染分页（覆盖 main.js 中的函数）
function renderPagination(currentPage, totalPages, containerId) {
    const container = document.getElementById(containerId);
    if (!container || totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let paginationHTML = '';

    // 上一页
    if (currentPage > 1) {
        paginationHTML += `<button class="pagination-btn" data-page="${currentPage - 1}">上一页</button>`;
    }

    // 页码逻辑：显示当前页及其附近的页码
    const maxVisiblePages = 7;
    let startPage = Math.max(1, currentPage - 3);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // 第一页和省略号
    if (startPage > 1) {
        paginationHTML += `<button class="pagination-btn" data-page="1">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
    }

    // 中间页码
    for (let i = startPage; i <= endPage; i++) {
        const activeClass = i === currentPage ? 'active' : '';
        paginationHTML += `<button class="pagination-btn ${activeClass}" data-page="${i}">${i}</button>`;
    }

    // 最后一页和省略号
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
        paginationHTML += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
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
            window.productService.currentPage = page;
            updateURL();
            loadProducts();
            
            // 滚动到顶部
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

// 添加 CSS 样式（用于加载和错误状态）
const additionalStyles = `
.loading-state, .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
    color: #6b7280;
}

.loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e5e7eb;
    border-top: 4px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
}

.error-state svg {
    margin-bottom: 16px;
}

.error-state h3 {
    font-size: 18px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 8px;
}

.error-state p {
    margin-bottom: 20px;
}

.pagination-ellipsis {
    padding: 8px 12px;
    color: #6b7280;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
`;

// 添加样式到页面
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);