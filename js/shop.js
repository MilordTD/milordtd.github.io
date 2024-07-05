// Инициализация 3D сцены
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
const productGallery = document.querySelector('.product-gallery');
const modal = document.getElementById('imageModal');
const modalImg = document.getElementById('modalImage');
const closeButton = document.getElementsByClassName('close')[0];
renderer.setSize(200, 200);
document.getElementById('book-3d-model').appendChild(renderer.domElement);

// Загрузка 3D модели
const loader = new THREE.GLTFLoader();
let currentModel;

function loadModel(modelUrl) {
    if (currentModel) {
        scene.remove(currentModel);
    }

    loader.load(modelUrl, (gltf) => {
        currentModel = gltf.scene;
        scene.add(currentModel);
        
        // Настройка камеры и освещения
        camera.position.z = 10;
        const light = new THREE.PointLight(0xffffff, 1, 10);
        light.position.set(0, 0, 10);
        scene.add(light);

        /*// Анимация
        function animate() {
            requestAnimationFrame(animate);
            currentModel.rotation.y += 0.01;
            renderer.render(scene, camera);
        }
        animate();*/
    }, undefined, (error) => {
        console.error('An error happened', error);
    });
}

let products = {};
let cart = [];
const cartContainer = document.querySelector('.cart-container');
const cartItems = document.querySelector('.cart-items');
const cartTotal = document.querySelector('.total-amount');
const productListContainer = document.querySelector('.product-list-container');

// Загрузка данных о товарах из JSON файла
document.addEventListener('DOMContentLoaded', function() {
    fetch('/products.json')
        .then(response => response.json())
        .then(data => {
            products = data;
            initializeProducts();
        })
        .catch(error => console.error('Error loading products:', error));
});

function initializeProducts() {
    // Создание элементов товаров
    const productList = document.querySelector('.product-list');
    productList.innerHTML = '';

    for (const [id, product] of Object.entries(products)) {
        const productItem = document.createElement('div');
        productItem.className = 'product-item';
        productItem.dataset.productId = id;
        productItem.dataset.category = product.category;

        const img = document.createElement('img');
        img.src = `/images/pin_${id}.svg`;
        img.alt = product.name;

        if (product.inStock === 0) {
            const soldOutOverlay = document.createElement('div');
            soldOutOverlay.className = 'sold-out-overlay';
            soldOutOverlay.textContent = 'Sold Out';
            productItem.appendChild(soldOutOverlay);
        }

        const removeButton = document.createElement('button');
        removeButton.className = 'remove-from-cart';
        removeButton.textContent = '❌';
        removeButton.style.display = 'none';

        productItem.appendChild(img);
        productItem.appendChild(removeButton);
        productList.appendChild(productItem);
    }

    // Обновление обработчиков событий для продуктов
    document.querySelectorAll('.product-item').forEach(item => {
        item.addEventListener('click', function() {
            const productId = this.dataset.productId;
            updateProductInfo(productId);
        });
    });

    // Инициализация первого товара
    const firstProductId = Object.keys(products)[0];
    updateProductInfo(firstProductId);

    // Обновление фильтров категорий
    updateCategoryFilter();
}

// Обновление информации о продукте
function updateProductInfo(productId) {
    const product = products[productId];
    document.getElementById('product-name').textContent = product.name;
    document.getElementById('product-ingredients').innerHTML = product.ingredients;
    document.getElementById('product-characteristics').innerHTML = product.characteristics;
    document.getElementById('product-buffs').innerHTML = product.buffs;
    document.getElementById('product-debuffs').innerHTML = product.debuffs;
    loadModel(product.modelUrl);

    // Обновление галереи
    if (product.gallery && Array.isArray(product.gallery)) {
        updateGallery(product.gallery);
    } else {
        productGallery.innerHTML = '';
    }

    document.querySelectorAll('.product-item').forEach(item => {
        item.classList.remove('active');
    });
    const activeItem = document.querySelector(`.product-item[data-product-id="${productId}"]`);
    activeItem.classList.add('active');

    const addToCartButton = document.querySelector('.add-to-cart');
    const removeFromCartButton = activeItem.querySelector('.remove-from-cart');

    if (product.inStock > 0) {
        addToCartButton.textContent = 'ADD TO CART';
        addToCartButton.disabled = false;
        addToCartButton.onclick = () => {
            cart.push(productId);
            updateCart();
            removeFromCartButton.style.display = 'block';
        };
        removeFromCartButton.onclick = (event) => {
            event.stopPropagation();
            cart = cart.filter(id => id !== productId);
            updateCart();
            removeFromCartButton.style.display = 'none';
        };
    } else {
        addToCartButton.textContent = 'SOLD OUT';
        addToCartButton.disabled = true;
        removeFromCartButton.style.display = 'none';
    }

    removeFromCartButton.style.display = cart.includes(productId) ? 'block' : 'none';
}

function updateGallery(galleryImages) {
    productGallery.innerHTML = '';
    galleryImages.forEach((imgSrc, index) => {
        const img = document.createElement('img');
        img.src = imgSrc;
        img.alt = `Product image ${index + 1}`;
        img.classList.add('gallery-item');
        img.addEventListener('click', () => openModal(imgSrc));
        productGallery.appendChild(img);
    });
}

function openModal(imgSrc) {
    modal.style.display = 'block';
    modalImg.src = imgSrc;
}

closeButton.onclick = function() {
    modal.style.display = 'none';
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// Обновление фильтра категорий
function updateCategoryFilter() {
    const categories = [...new Set(Object.values(products).map(product => product.category))];
    const categoryFilter = document.querySelector('.category-filter');
    categoryFilter.innerHTML = '<button class="active" data-category="all">All</button>';
    
    categories.forEach(category => {
        const button = document.createElement('button');
        button.dataset.category = category;
        button.textContent = category.charAt(0).toUpperCase() + category.slice(1) + 's';
        categoryFilter.appendChild(button);
    });

    // Обновление обработчиков событий для кнопок категорий
    document.querySelectorAll('.category-filter button').forEach(button => {
        button.addEventListener('click', function() {
            const category = this.dataset.category;

            document.querySelectorAll('.category-filter button').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            document.querySelectorAll('.product-item').forEach(item => {
                if (category === 'all' || item.dataset.category === category) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });
}

// Реализация зума для 3D модели
const zoomInButton = document.getElementById('zoom-in');
const zoomOutButton = document.getElementById('zoom-out');

zoomInButton.addEventListener('click', () => {
    if (camera.position.z > 2) {
        camera.position.z -= 0.5;
    }
});

zoomOutButton.addEventListener('click', () => {
    if (camera.position.z < 10) {
        camera.position.z += 0.5;
    }
});

// Обновление рендеринга при изменении зума
function animate() {
    requestAnimationFrame(animate);
    if (currentModel) {
        currentModel.rotation.y += 0.01;
    }
    renderer.render(scene, camera);
}
animate();

// Функция обновления корзины
function updateCart() {
    const cartItemCount = cart.length;
    
    cartItems.textContent = `Items in cart: ${cartItemCount}`;

    let total = cart.reduce((sum, productId) => sum + products[productId].price, 0);
    cartTotal.textContent = total.toFixed(2);

    if (cartItemCount > 0) {
        cartContainer.classList.add('active');
        productListContainer.classList.add('with-cart');
    } else {
        cartContainer.classList.remove('active');
        productListContainer.classList.remove('with-cart');
    }

    // Обновляем видимость кнопок удаления из корзины
    document.querySelectorAll('.product-item').forEach(item => {
        const productId = item.dataset.productId;
        const removeButton = item.querySelector('.remove-from-cart');
        if (removeButton) {
            removeButton.style.display = cart.includes(productId) ? 'block' : 'none';
        }
    });
}

// Обработчик для кнопки "Empty cart"
const emptyCartButton = document.querySelector('.empty-cart-button');
if (emptyCartButton) {
    emptyCartButton.addEventListener('click', () => {
        cart = [];
        updateCart();
        updateProductInfo(Object.keys(products)[0]); // Обновляем информацию о первом продукте
    });
}

// Инициализация корзины
updateCart();

// Обработчик для кнопки оформления заказа
const checkoutButton = document.querySelector('.checkout-button');
if (checkoutButton) {
    checkoutButton.addEventListener('click', () => {
        alert('Переход к оформлению заказа');
        // Здесь можно добавить логику перехода на страницу оформления заказа
    });
}