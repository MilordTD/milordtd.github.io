import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Инициализация 3D сцены
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setClearColor(0x000000, 0); // Полностью прозрачный фон
const productGallery = document.querySelector('.product-gallery');
const modal = document.getElementById('imageModal');
const modalImg = document.getElementById('modalImage');
const closeButton = document.getElementsByClassName('close')[0];
renderer.setSize(260, 260);
document.getElementById('book-3d-model').appendChild(renderer.domElement);

document.addEventListener('DOMContentLoaded', () => {
    const introOverlay = document.querySelector('.intro-overlay');
    const introContent = document.querySelector('.intro-content');
    const introButton = document.querySelector('.intro-button');
    const productDetail = document.querySelector('.product-detail');
    const productListContainer = document.querySelector('.product-list-container');

    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment_status');

    if (paymentStatus) {
        // Если есть статус оплаты, сразу скрываем интро-оверлей
        introOverlay.style.display = 'none';
        productDetail.style.opacity = '1';
        productListContainer.style.opacity = '1';

        // Вызываем функцию проверки статуса оплаты
        checkPaymentStatus();
    } else {
        // Показываем контент с эффектом fade in
        setTimeout(() => {
            introContent.style.opacity = '1';
        }, 500);

        introButton.addEventListener('click', () => {
            // Скрываем intro-content
            introContent.style.opacity = '0';

            // Ждем завершения анимации скрытия intro-content
            setTimeout(() => {
                introOverlay.style.display = 'none';

                // Показываем product-detail и product-list-container
                productDetail.style.opacity = '1';
                productListContainer.style.opacity = '1';
            }, 500); // Время должно совпадать с длительностью перехода в CSS
        });
    }

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
            currentModel.rotation.y = mouseX * 0.01;
            currentModel.rotation.x = mouseY * 0.01;
        }
        renderer.render(scene, camera);
    }

    document.addEventListener('mousemove', onDocumentMouseMove, false);

    function loadModel(modelUrl) {
        // Удаляем все существующие объекты со сцены
        while (scene.children.length > 0) {
            scene.remove(scene.children[0]);
        }

        loader.load(modelUrl, (gltf) => {
            currentModel = gltf.scene;

            // Масштабируем модель до высоты 200px
            const box = new THREE.Box3().setFromObject(currentModel);
            const height = box.max.y - box.min.y;
            const scale = 7 / height;
            currentModel.scale.set(scale, scale, scale);

            scene.add(currentModel);

            // Настройка камеры и освещения
            camera.position.z = 5;
            camera.position.y = 0.5;
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
            products = data;
            initializeProducts();
        })
        .catch(error => {
            console.error('Error loading products:', error);
            // Здесь можно добавить код для отображения ошибки пользователю
        });

    function initializeProducts() {
        // Создание элементов товаров
        productListWrapper.innerHTML = '';

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

            productItem.appendChild(img);
            productListWrapper.appendChild(productItem);
        }

        // Обновление обработчиков событий для продуктов
        document.querySelectorAll('.product-item').forEach(item => {
            item.addEventListener('click', function () {
                const productId = this.dataset.productId;
                updateProductInfo(productId);
            });
        });

        // Инициализация первого товара
        const firstProductId = Object.keys(products)[0];
        updateProductInfo(firstProductId);

        // Обновление слайдера и фильтров
        initializeSlider();
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
            productGallery.innerHTML = ''; // Очистка галереи, если изображений нет
        }

        document.querySelectorAll('.product-item').forEach(item => {
            item.classList.remove('active');
        });
        const activeItem = document.querySelector(`.product-item[data-product-id="${productId}"]`);
        activeItem.classList.add('active');

        const addToCartButton = document.querySelector('.add-to-cart');

        if (product.inStock > 0) {
            addToCartButton.textContent = 'ADD TO CART';
            addToCartButton.disabled = false;
            addToCartButton.onclick = () => {
                cart.push(productId);
                updateCart();
                animateAddToCart();
            };
        } else {
            addToCartButton.textContent = 'SOLD OUT';
            addToCartButton.disabled = true;
        }
    }

    function updateGallery(galleryImages) {
        productGallery.innerHTML = '';
        galleryImages.forEach((imgSrc, index) => {
            if (index < 4) { // Limit to 4 images
                const img = document.createElement('img');
                img.src = imgSrc;
                img.alt = `Product image ${index + 1}`;
                img.classList.add('product-gallery-item');
                img.addEventListener('click', () => {
                    openModal(imgSrc);
                });
                productGallery.appendChild(img);
            }
        });
    }

    function openModal(src) {
        modal.style.display = 'block';
        modalImg.src = src;
    }

    closeButton.onclick = function () {
        modal.style.display = 'none';
    };

    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };

    function updateCart() {
        cartItems.innerHTML = '';
        let total = 0;

        cart.forEach(productId => {
            const product = products[productId];
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';

            const itemName = document.createElement('span');
            itemName.className = 'cart-item-name';
            itemName.textContent = product.name;

            const itemPrice = document.createElement('span');
            itemPrice.className = 'cart-item-price';
            itemPrice.textContent = `$${product.price.toFixed(2)}`;

            cartItem.appendChild(itemName);
            cartItem.appendChild(itemPrice);
            cartItems.appendChild(cartItem);

            total += product.price;
        });

        cartTotal.textContent = `$${total.toFixed(2)}`;
        cartContainer.style.display = cart.length > 0 ? 'block' : 'none';
    }

    function animateAddToCart() {
        const addToCartButton = document.querySelector('.add-to-cart');
        const cartRect = cartContainer.getBoundingClientRect();
        const buttonRect = addToCartButton.getBoundingClientRect();

        const item = document.createElement('div');
        item.className = 'cart-animation-item';
        item.style.position = 'absolute';
        item.style.left = `${buttonRect.left}px`;
        item.style.top = `${buttonRect.top}px`;
        document.body.appendChild(item);

        // Вычисление позиции
        const calculatePosition = () => {
            const rect = item.getBoundingClientRect();
            const dx = (cartRect.left + cartRect.width / 2) - (rect.left + rect.width / 2);
            const dy = (cartRect.top + cartRect.height / 2) - (rect.top + rect.height / 2);
            return { dx, dy };
        };

        // Анимация
        const animate = () => {
            const { dx, dy } = calculatePosition();
            const duration = 500;
            const start = performance.now();

            const step = (timestamp) => {
                const progress = (timestamp - start) / duration;
                if (progress < 1) {
                    item.style.transform = `translate(${dx * progress}px, ${dy * progress}px)`;
                    requestAnimationFrame(step);
                } else {
                    item.style.transform = `translate(${dx}px, ${dy}px)`;
                    item.remove();
                }
            };

            requestAnimationFrame(step);
        };

        animate();
    }

    function checkPaymentStatus() {
        const urlParams = new URLSearchParams(window.location.search);
        const paymentStatus = urlParams.get('payment_status');

        if (paymentStatus === 'success') {
            // Обработка успешного платежа
            const successMessage = document.getElementById('success-message');
            successMessage.style.display = 'block';
        } else if (paymentStatus === 'failed') {
            // Обработка неуспешного платежа
            const failureMessage = document.getElementById('failure-message');
            failureMessage.style.display = 'block';
        }
    }

    // Обновление категорий
    function updateCategoryFilter() {
        const categoryFilter = document.getElementById('category-filter');
        const categories = Array.from(new Set(Object.values(products).map(product => product.category)));
        categoryFilter.innerHTML = '';

        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });

        categoryFilter.addEventListener('change', () => {
            const selectedCategory = categoryFilter.value;
            const productItems = document.querySelectorAll('.product-item');
            productItems.forEach(item => {
                if (selectedCategory === 'all' || item.dataset.category === selectedCategory) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }

    // Инициализация слайдера
    function initializeSlider() {
        let position = 0;
        const itemsToShow = 3; // Количество отображаемых товаров

        function updateSlider() {
            const productItems = Array.from(document.querySelectorAll('.product-item'));
            const totalItems = productItems.length;

            productItems.forEach((item, index) => {
                item.style.display = (index >= position && index < position + itemsToShow) ? 'block' : 'none';
            });

            leftArrow.style.display = (position > 0) ? 'block' : 'none';
            rightArrow.style.display = (position < totalItems - itemsToShow) ? 'block' : 'none';
        }

        leftArrow.addEventListener('click', () => {
            if (position > 0) {
                position--;
                updateSlider();
            }
        });

        rightArrow.addEventListener('click', () => {
            if (position < document.querySelectorAll('.product-item').length - itemsToShow) {
                position++;
                updateSlider();
            }
        });

        updateSlider();
    }

    // Вызов анимации
    animate();
});
