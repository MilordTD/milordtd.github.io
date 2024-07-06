import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Инициализация 3D сцены
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ 
    alpha: true,
    antialias: true
});
renderer.setClearColor(0x000000, 0);
renderer.setPixelRatio(window.devicePixelRatio);
const productGallery = document.querySelector('.product-gallery');
const modal = document.getElementById('imageModal');
const modalImg = document.getElementById('modalImage');
const closeButton = document.getElementsByClassName('close')[0];
renderer.setSize(200, 200);
document.getElementById('book-3d-model').appendChild(renderer.domElement);

// Загрузка 3D модели
const loader = new GLTFLoader();
let currentModel;

let mouseX = 0;
let mouseY = 0;

function onDocumentMouseMove(event) {
    mouseX = (event.clientX - window.innerWidth / 2) / 100;
    mouseY = (event.clientY - window.innerHeight / 2) / 100;
}

function animate() {
    requestAnimationFrame(animate);
    if (currentModel) {
        currentModel.rotation.y = mouseX * 0.009;
        currentModel.rotation.x = mouseY * 0.009;
    }
    renderer.render(scene, camera);
}

document.addEventListener('mousemove', onDocumentMouseMove, false);

function loadModel(modelUrl) {
    if (currentModel) {
        scene.remove(currentModel);
    }

    loader.load(modelUrl, (gltf) => {
        currentModel = gltf.scene;
        
        const box = new THREE.Box3().setFromObject(currentModel);
        const height = box.max.y - box.min.y;
        const scale = 6 / height;
        currentModel.scale.set(scale, scale, scale);
        
        scene.add(currentModel);
        
        camera.position.z = 5;
        camera.position.x = 0.5;
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.1);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);
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
const productListWrapper = document.querySelector('.product-list-wrapper');
const leftArrow = document.querySelector('.slider-arrow.left');
const rightArrow = document.querySelector('.slider-arrow.right');

// Загрузка данных о товарах из JSON файла
fetch('/products.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Loaded products data:', data);
        products = data;
        initializeProducts();
    })
    .catch(error => {
        console.error('Error loading products:', error);
    });

function initializeProducts() {
    console.log('Initializing products with data:', products);
    
    if (!products || Object.keys(products).length === 0) {
        console.error('No product data available');
        return;
    }

    productListWrapper.innerHTML = '';

    for (const [id, product] of Object.entries(products)) {
        console.log(`Creating product item for ${id}:`, product);
        
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
        productListWrapper.appendChild(productItem);
    }

    document.querySelectorAll('.product-item').forEach(item => {
        item.addEventListener('click', function() {
            const productId = this.dataset.productId;
            updateProductInfo(productId);
        });
    });

    const firstProductId = Object.keys(products)[0];
    if (firstProductId) {
        updateProductInfo(firstProductId);
    } else {
        console.error('No products found to initialize');
    }

    initializeSlider();
    updateCategoryFilter();
}

function updateProductInfo(productId) {
    const product = products[productId];
    document.getElementById('product-name').textContent = product.name;
    document.getElementById('product-ingredients').innerHTML = product.ingredients;
    document.getElementById('product-characteristics').innerHTML = product.characteristics;
    document.getElementById('product-buffs').innerHTML = product.buffs;
    document.getElementById('product-debuffs').innerHTML = product.debuffs;
    loadModel(product.modelUrl);

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
            console.log('Add to cart button clicked');
            cart.push(productId);
            updateCart();
            removeFromCartButton.style.display = 'block';
            animateAddToCart();
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

function animateAddToCart() {
    console.log('animateAddToCart function called');

    const modelContainer = document.getElementById('book-3d-model');
    const cartIcon = document.querySelector('.cart-container');
    const activeProduct = document.querySelector('.product-item.active');
    
    if (!modelContainer || !cartIcon || !activeProduct) {
        console.error('Required elements not found');
        return;
    }

    const productImage = activeProduct.querySelector('img').src;
    const startRect = modelContainer.getBoundingClientRect();
    const endRect = cartIcon.getBoundingClientRect();

    console.log('Rectangles:', { startRect, endRect });

    // Создаем элемент изображения для анимации
    const animatedImage = document.createElement('img');
    animatedImage.src = productImage;
    animatedImage.style.position = 'fixed';
    animatedImage.style.left = `${startRect.left}px`;
    animatedImage.style.top = `${startRect.top}px`;
    animatedImage.style.width = `${startRect.width}px`;
    animatedImage.style.height = `${startRect.height}px`;
    animatedImage.style.zIndex = '9999';
    animatedImage.style.pointerEvents = 'none';
    document.body.appendChild(animatedImage);

    console.log('Animated image created and appended to body');

    // Функция для расчета положения на дуге
    function calculatePosition(progress) {
        const startX = startRect.left;
        const startY = startRect.top;
        const endX = endRect.right - 20;
        const endY = endRect.bottom - 20;

        // Контрольная точка для кривой Безье (вершина дуги)
        const controlX = (startX + endX) / 2;
        const controlY = startY - 100; // Регулируйте это значение для изменения высоты дуги

        const x = Math.pow(1 - progress, 2) * startX + 
                  2 * (1 - progress) * progress * controlX + 
                  Math.pow(progress, 2) * endX;
        const y = Math.pow(1 - progress, 2) * startY + 
                  2 * (1 - progress) * progress * controlY + 
                  Math.pow(progress, 2) * endY;

        return { x, y };
    }

    // Функция анимации
    function animate(currentTime) {
        const duration = 1000; // Продолжительность анимации в мс
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const { x, y } = calculatePosition(progress);

        animatedImage.style.left = `${x}px`;
        animatedImage.style.top = `${y}px`;
        animatedImage.style.transform = `scale(${1 - progress * 0.9})`;
        animatedImage.style.opacity = 1 - progress;

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            document.body.removeChild(animatedImage);
            console.log('Animated image removed');
        }
    }

    const startTime = performance.now();
    requestAnimationFrame(animate);
}

function updateGallery(galleryImages) {
    productGallery.innerHTML = '';
    galleryImages.forEach((imgSrc, index) => {
        if (index < 4) { // Limit to 4 images
            const img = document.createElement('img');
            img.src = imgSrc;
            img.alt = `Product image ${index + 1}`;
            img.classList.add('gallery-item');
            img.addEventListener('click', () => openModal(imgSrc));
            productGallery.appendChild(img);
        }
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

function updateCategoryFilter() {
    const categories = [...new Set(Object.values(products).map(product => product.category))];
    const categoryFilter = document.querySelector('.category-filter-container');
    categoryFilter.innerHTML = '<button class="category-button active" data-category="all">All</button>';
    
    categories.forEach(category => {
        const button = document.createElement('button');
        button.className = 'category-button';
        button.dataset.category = category;
        button.textContent = category.charAt(0).toUpperCase() + category.slice(1) + 's';
        categoryFilter.appendChild(button);
    });

    document.querySelectorAll('.category-button').forEach(button => {
        button.addEventListener('click', function() {
            const category = this.dataset.category;

            document.querySelectorAll('.category-button').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            document.querySelectorAll('.product-item').forEach(item => {
                if (category === 'all' || item.dataset.category === category) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });

            currentPosition = 0;
            updateSliderPosition();
            
            setTimeout(updateArrowVisibility, 0);
        });
    });
}

let currentPosition = 0;

function updateSliderPosition() {
    productListWrapper.style.transform = `translateX(${currentPosition}px)`;
}

function updateArrowVisibility() {
    const productListWidth = productListWrapper.scrollWidth;
    const containerWidth = productListContainer.clientWidth;
    
    if (productListWidth <= containerWidth) {
        leftArrow.style.display = 'none';
        rightArrow.style.display = 'none';
    } else {
        leftArrow.style.display = currentPosition < 0 ? 'flex' : 'none';
        rightArrow.style.display = currentPosition > containerWidth - productListWidth ? 'flex' : 'none';
    }
}

function initializeSlider() {
    updateArrowVisibility();
    
    window.addEventListener('resize', updateArrowVisibility);
    
    leftArrow.addEventListener('click', () => {
        currentPosition += 120;
        if (currentPosition > 0) currentPosition = 0;
        updateSliderPosition();
        updateArrowVisibility();
    });

    rightArrow.addEventListener('click', () => {
        const maxPosition = -(productListWrapper.scrollWidth - productListContainer.clientWidth);
        currentPosition -= 120;
        if (currentPosition < maxPosition) currentPosition = maxPosition;
        updateSliderPosition();
        updateArrowVisibility();
    });
}

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

    document.querySelectorAll('.product-item').forEach(item => {
        const productId = item.dataset.productId;
        const removeButton = item.querySelector('.remove-from-cart');
        if (removeButton) {
            removeButton.style.display = cart.includes(productId) ? 'block' : 'none';
        }
    });
}

const emptyCartButton = document.querySelector('.empty-cart-button');
if (emptyCartButton) {
    emptyCartButton.addEventListener('click', () => {
        cart = [];
        updateCart();
        updateProductInfo(Object.keys(products)[0]);
    });
}

const checkoutButton = document.querySelector('.checkout-button');
if (checkoutButton) {
    checkoutButton.addEventListener('click', () => {
        alert('Переход к оформлению заказа');
    });
}

animate();