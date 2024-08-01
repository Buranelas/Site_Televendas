let products = [];
let cart = [];
let filteredProducts = [];
let currentPage = 1;
const itemsPerPageDesktop = 50;
const itemsPerPageMobile = 25;
const isMobile = window.innerWidth <= 480;
const itemsPerPage = isMobile ? itemsPerPageMobile : itemsPerPageDesktop;

// Função para carregar os produtos do arquivo JSON
async function loadProducts() {
    try {
        const response = await fetch('products.json');
        products = await response.json();
        filteredProducts = products;
        populateFilters();
        displayProducts(filteredProducts, currentPage);
        initializeFuse();
    } catch (error) {
        console.error('Erro ao carregar os produtos:', error);
    }
}

// Inicializar Fuse.js
let fuse;
function initializeFuse() {
    const options = {
        keys: ['Descrição', 'Desc Grupo', 'Desc Marca'],
        threshold: 0.3,  // Ajuste para a sensibilidade da pesquisa fuzzy
    };
    fuse = new Fuse(products, options);
}

function displayProducts(productsToDisplay, page) {
    const productList = document.getElementById('product-list');
    productList.innerHTML = '';
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedItems = productsToDisplay.slice(start, end);

    paginatedItems.forEach(product => {
        const productItem = document.createElement('div');
        productItem.className = 'product-item';
        productItem.innerHTML = `
            <h2>${product["Descrição"]}</h2>
            <p>Grupo: ${product["Desc Grupo"]}</p>
            <p>Marca: ${product["Desc Marca"]}</p>
            <button onclick="addToCart('${product["Descrição"]}')">Selecionar</button>
        `;
        productList.appendChild(productItem);
    });

    updatePagination(productsToDisplay.length, page);
}

function updatePagination(totalItems, page) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    document.getElementById('pageInfo').textContent = `Página ${page} de ${totalPages}`;
    document.getElementById('prevPage').disabled = page === 1;
    document.getElementById('nextPage').disabled = page === totalPages;
}

function nextPage() {
    if (currentPage < Math.ceil(filteredProducts.length / itemsPerPage)) {
        currentPage++;
        displayProducts(filteredProducts, currentPage);
    }
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        displayProducts(filteredProducts, currentPage);
    }
}

function addToCart(productDescription) {
    const product = products.find(item => item["Descrição"] === productDescription);
    const existingProduct = cart.find(item => item["Descrição"] === productDescription);
    if (existingProduct) {
        existingProduct.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    renderCart();
}

function removeFromCart(productDescription) {
    const productIndex = cart.findIndex(item => item["Descrição"] === productDescription);
    if (productIndex > -1) {
        cart[productIndex].quantity--;
        if (cart[productIndex].quantity === 0) {
            cart.splice(productIndex, 1);
        }
    }
    renderCart();
}

function renderCart() {
    const cartItems = document.getElementById('cart-items');
    cartItems.innerHTML = '';
    cart.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${item["Descrição"]} - Quantidade: ${item.quantity}</span>
            <button onclick="removeFromCart('${item["Descrição"]}')">Remover</button>
        `;
        cartItems.appendChild(li);
    });
}

function checkout() {
    const orderText = cart.map(item => `${item.quantity}x ${item["Descrição"]}`).join('\n');
    const whatsappUrl = `https://wa.me/554530567599?text=${encodeURIComponent('Meu Carrinho:\n' + orderText)}`;
    window.location.href = whatsappUrl;
}

function filterProducts() {
    const searchTerm = document.getElementById('search').value.toLowerCase();
    const selectedGroup = document.getElementById('filter-group').value;
    const selectedBrand = document.getElementById('filter-brand').value;

    let results = products;

    if (searchTerm) {
        results = fuse.search(searchTerm).map(result => result.item);
    }

    filteredProducts = results.filter(product => {
        return (
            (selectedGroup === "" || product["Desc Grupo"] === selectedGroup) &&
            (selectedBrand === "" || product["Desc Marca"] === selectedBrand)
        );
    });

    displayProducts(filteredProducts, currentPage);
}

function populateFilters() {
    const groupFilter = document.getElementById('filter-group');
    const brandFilter = document.getElementById('filter-brand');

    const groups = [...new Set(products.map(product => product["Desc Grupo"]))];
    const brands = [...new Set(products.map(product => product["Desc Marca"]))];

    groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group;
        option.textContent = group;
        groupFilter.appendChild(option);
    });

    brands.forEach(brand => {
        const option = document.createElement('option');
        option.value = brand;
        option.textContent = brand;
        brandFilter.appendChild(option);
    });
}

document.getElementById('search').addEventListener('input', filterProducts);
document.getElementById('filter-group').addEventListener('change', filterProducts);
document.getElementById('filter-brand').addEventListener('change', filterProducts);

document.addEventListener('DOMContentLoaded', loadProducts);
