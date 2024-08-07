let products = [];
let cart = [];
let filteredProducts = [];
let currentPage = 1;
const itemsPerPageDesktop = 50;
const itemsPerPageMobile = 25;
const isMobile = window.innerWidth <= 480;
const itemsPerPage = isMobile ? itemsPerPageMobile : itemsPerPageDesktop;
let showImages = false; // Estado inicial para mostrar imagens

// Função para carregar os produtos do arquivo JSON
async function loadProducts() {
    try {
        const response = await fetch('products.json');
        products = await response.json();
        products.sort((a, b) => a["Descrição"].localeCompare(b["Descrição"])); // Ordenar produtos alfabeticamente pela descrição
        filteredProducts = products;
        populateFilters();
        const urlParams = new URLSearchParams(window.location.search);
        currentPage = parseInt(urlParams.get('page')) || 1; // Ler a página da URL
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
        keys: ['Descrição'], // Pesquisar apenas na descrição
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
            ${showImages ? `<img src="${product.Imagem}" alt="${product["Descrição"]}">` : ''}
            <h2>${product["Descrição"]}</h2>
            <p>Grupo: ${product["Desc Grupo"]}</p>
            <p>Marca: ${product["Desc Marca"]}</p>
            <button onclick="handleButtonClick(event); addToCart('${product["Descrição"]}', this)">Selecionar</button>
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

    // Atualizar a URL com a página atual
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('page', page);
    window.history.pushState({}, '', `${window.location.pathname}?${urlParams}`);
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

function addToCart(productDescription, button) {
    const product = products.find(item => item["Descrição"] === productDescription);
    const existingProduct = cart.find(item => item["Descrição"] === productDescription);
    const isWeightProduct = productDescription.toLowerCase().includes('kg');
    
    if (existingProduct) {
        if (isWeightProduct) {
            existingProduct.quantity += 0.1; // Incrementar por 100g
        } else {
            existingProduct.quantity++;
        }
    } else {
        cart.push({ ...product, quantity: isWeightProduct ? 0.1 : 1 });
        button.classList.add('selected');
    }
    renderCart();
}

function removeFromCart(productDescription) {
    cart = cart.filter(item => item["Descrição"] !== productDescription);
    renderCart();
}

function incrementQuantity(productDescription) {
    const product = cart.find(item => item["Descrição"] === productDescription);
    const isWeightProduct = productDescription.toLowerCase().includes('kg');
    if (isWeightProduct) {
        product.quantity += 0.1;
    } else {
        product.quantity++;
    }
    renderCart();
}

function decrementQuantity(productDescription) {
    const product = cart.find(item => item["Descrição"] === productDescription);
    const isWeightProduct = productDescription.toLowerCase().includes('kg');
    if (isWeightProduct) {
        product.quantity -= 0.1;
    } else {
        product.quantity--;
    }
    if (product.quantity <= 0) {
        cart = cart.filter(item => item["Descrição"] !== productDescription);
    }
    renderCart();
}

function renderCart() {
    const cartItems = document.getElementById('cart-items');
    cartItems.innerHTML = '';
    cart.forEach(item => {
        const li = document.createElement('li');
        const isWeightProduct = item["Descrição"].toLowerCase().includes('kg');
        li.innerHTML = `
            <span>${item["Descrição"]} - Quantidade: ${isWeightProduct ? (item.quantity.toFixed(1) + ' KG') : item.quantity}</span>
            <div>
                <button class="decrement" onclick="handleButtonClick(event); decrementQuantity('${item["Descrição"]}')">-</button>
                <button class="increment" onclick="handleButtonClick(event); incrementQuantity('${item["Descrição"]}')">+</button>
                <button onclick="handleButtonClick(event); removeFromCart('${item["Descrição"]}')">Remover</button>
            </div>
        `;
        cartItems.appendChild(li);
    });
}

function checkout() {
    const orderText = cart.map(item => {
        const isWeightProduct = item["Descrição"].toLowerCase().includes('kg');
        return `${isWeightProduct ? item.quantity.toFixed(1) : item.quantity}x ${item["Descrição"]}`;
    }).join('\n');
    const whatsappUrl = `https://wa.me/554530567512?text=${encodeURIComponent('Meu Carrinho:\n' + orderText)}`;
    window.location.href = whatsappUrl;
    clearCart();
}

function clearCart() {
    cart = [];
    renderCart();
    document.querySelectorAll('.product-item button.selected').forEach(button => {
        button.classList.remove('selected');
    });
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
            (selectedGroup === "all" || product["Desc Grupo"] === selectedGroup) &&
            (selectedBrand === "all" || product["Desc Marca"] === selectedBrand)
        );
    });

    currentPage = 1; // Redefine a página atual para 1
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

function handleButtonClick(event) {
    const button = event.target;
    button.classList.add('clicked');
    setTimeout(() => {
        button.classList.remove('clicked');
    }, 300); // Tempo em milissegundos
}

function toggleImages() {
    showImages = !showImages;
    displayProducts(filteredProducts, currentPage);
}

document.getElementById('search').addEventListener('input', filterProducts);
document.getElementById('filter-group').addEventListener('change', filterProducts);
document.getElementById('filter-brand').addEventListener('change', filterProducts);

document.addEventListener('DOMContentLoaded', loadProducts);

document.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', handleButtonClick);
});
