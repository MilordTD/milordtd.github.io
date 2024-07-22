import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

document.addEventListener('DOMContentLoaded', function() {
    // Инициализация 3D сцены
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setClearColor(0x000000, 0); // Полностью прозрачный фон
    const productGallery = document.querySelector('.product-gallery');
    const modal = document.getElementById('imageModal');
    const menuIcon = document.querySelector('.menu-icon');
    const popupMenu = document.querySelector('.popup-menu');
    const modalImg = document.getElementById('modalImage');
    const closeButton = document.getElementsByClassName('close')[0];
    renderer.setSize(260, 260);
    document.getElementById('book-3d-model').appendChild(renderer.domElement);

    let mouseX = 0;
    let mouseY = 0;

    // Toggle popup menu
    menuIcon.addEventListener('click', () => {
        popupMenu.style.display = popupMenu.style.display === 'block' ? 'none' : 'block';
    });

    // Close popup menu when clicking outside
    document.addEventListener('click', (event) => {
        if (!menuIcon.contains(event.target) && !popupMenu.contains(event.target)) {
            popupMenu.style.display = 'none';
        }
    });

    function onDocumentMouseMove(event) {
        mouseX = (event.clientX - window.innerWidth / 2) / 100;
        mouseY = (event.clientY - window.innerHeight / 2) / 100;
    }

    function typewriterEffect(element, text, speed = 50) {
    let i = 0;
    element.innerHTML = '';
    function type() {
        if (i < text.length) {
            if (text.charAt(i) === '\n') {
                element.innerHTML += '<br>';
            } else {
                element.innerHTML += text.charAt(i);
            }
            i++;
            setTimeout(type, speed);
        }
    }
    type();
    }

    const typewriterText = document.getElementById('typewriter-text');
    const textToType = "I’m Erin, an artist, traveler\nand adventurer. I’ve got a neat\ncollection of trinkets, artifacts\nand equipment. Wanna trade?";

    // Запускаем эффект печатной машинки после открытия интро
    setTimeout(() => {
        typewriterEffect(typewriterText, textToType);
    }, 1000); // Задержка в 1 секунду перед началом печати

    // Загрузка 3D модели
    const loader = new GLTFLoader();
    let currentModel;

    function loadModel(modelUrl) {
        // Удаляем все существующие объекты со сцены
        while(scene.children.length > 0){ 
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
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
            scene.add(ambientLight);
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.05);
            directionalLight.position.set(5, 5, 5);
            scene.add(directionalLight);
        }, undefined, (error) => {
            console.error('An error happened', error);
        });
    }

    function animate() {
        requestAnimationFrame(animate);
        if (currentModel) {
            currentModel.rotation.y = mouseX * 0.01;
            currentModel.rotation.x = mouseY * 0.01;
        }
        renderer.render(scene, camera);
    }

    animate();

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
        .then(response => response.json())
        .then(data => {
            products = data;
            initializeProducts();
        })
        .catch(error => {
            console.error('Error loading products:', error);
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
            item.addEventListener('click', function() {
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
        document.getElementById('product-price').textContent = `€${product.price.toFixed(2)}`;
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
            if (index < 4) {
                const img = document.createElement('img');
                img.src = imgSrc;
                img.alt = `Product image ${index + 1}`;
                img.classList.add('gallery-item');
                img.addEventListener('click', () => openModal(imgSrc));
                productGallery.appendChild(img);
            }
        });
    }

    function openModal(modalIdOrImgSrc) {
        if (modalIdOrImgSrc.startsWith('#')) {
            const modal = document.getElementById(modalIdOrImgSrc.slice(1));
            if (modal) {
                modal.style.display = 'block';
                document.body.style.overflow = 'hidden';
            }
        } else {
            const imageModal = document.getElementById('imageModal');
            const modalImg = document.getElementById('modalImage');
            if (imageModal && modalImg) {
                modalImg.src = modalIdOrImgSrc;
                imageModal.style.display = 'block';
                document.body.style.overflow = 'hidden';
            }
        }
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    // Обработчики для закрытия модальных окон
    document.querySelectorAll('.modal .close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            const modalId = closeBtn.closest('.modal').id;
            closeModal(modalId);
        });
    });

    // Закрытие модального окна при клике вне его содержимого
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (event) => {
            if (event.target === modal || event.target.classList.contains('modal-content')) {
                closeModal(modal.id);
            }
        });
    });

    // Обработчики для открытия модальных окон с изображениями
    document.querySelectorAll('.gallery-item').forEach(img => {
        img.addEventListener('click', () => {
            openModal(img.src);
        });
    });

    // Предотвращение закрытия при клике на само изображение
    document.getElementById('modalImage').addEventListener('click', (event) => {
        event.stopPropagation();
    });

    // Обновление фильтра категорий
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

        // Обновление обработчиков событий для кнопок категорий
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

    // Реализация горизонтального слайдера
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
            if (currentPosition < 0) {
                leftArrow.style.display = 'flex';
            } else {
                leftArrow.style.display = 'none';
            }
            
            if (currentPosition > containerWidth - productListWidth) {
                rightArrow.style.display = 'flex';
            } else {
                rightArrow.style.display = 'none';
            }
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
    }

    // Обработчик для кнопки "Empty cart"
    const emptyCartButton = document.querySelector('.empty-cart-button');
    if (emptyCartButton) {
        emptyCartButton.addEventListener('click', () => {
            cart = [];
            updateCart();
            updateProductInfo(Object.keys(products)[0]);
        });
    }

    // Инициализация корзины
    updateCart();

    // Обработчик для кнопки оформления заказа
    const checkoutButton = document.querySelector('.checkout-button');
    if (checkoutButton) {
        checkoutButton.addEventListener('click', () => {
            const cartWithQuantity = cart.reduce((acc, productId) => {
                if (acc[productId]) {
                    acc[productId].quantity += 1;
                } else {
                    acc[productId] = { id: productId, quantity: 1 };
                }
                return acc;
            }, {});

            localStorage.setItem('cart', JSON.stringify(Object.values(cartWithQuantity)));
            localStorage.setItem('products', JSON.stringify(products));
            
            window.location.href = '/checkout/index.html';
        });
    }

    function animateAddToCart() {
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

    // Проверка статуса оплаты и waitlist
    function checkStatus() {
        console.log('Checking status');
        const urlParams = new URLSearchParams(window.location.search);
        const paymentStatus = urlParams.get('payment_status');
        const waitlistStatus = urlParams.get('waitlist_status');
        console.log('Payment status:', paymentStatus);
        console.log('Waitlist status:', waitlistStatus);

        const successModal = document.getElementById('successModal');
        const waitlistSuccessModal = document.getElementById('waitlistSuccessModal');

        if (paymentStatus === 'success') {
            console.log('Opening success modal');
            openModal('#successModal');
            // Очистка корзины после успешной оплаты
            cart = [];
            updateCart();
        } else if (waitlistStatus === 'success') {
            console.log('Opening waitlist success modal');
            openModal('#waitlistSuccessModal');
        }

        // Удаление параметров статуса из URL
        console.log('Removing status parameters from URL');
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Основной код, выполняющийся после загрузки DOM
    console.log('DOM fully loaded');
    const introOverlay = document.querySelector('.intro-overlay');
    const introContent = document.querySelector('.intro-content');
    const introButton = document.querySelector('.intro-button');
    const productDetail = document.querySelector('.product-detail');
    const erinImage = document.querySelector('.erin-image');

    // Добавляем класс active к оверлею и body при загрузке страницы
    introOverlay.classList.add('active');
    document.body.classList.add('overlay-active');

    // Показываем контент с эффектом fade in
    setTimeout(() => {
        introContent.style.opacity = '1';
    }, 500);

    introButton.addEventListener('click', (event) => {
        console.log('Explore loot button clicked');
        event.preventDefault();
        event.stopPropagation();
        
        // Скрываем intro-content
        introContent.style.opacity = '0';
        
        // Перемещаем и увеличиваем изображение Эрин
        erinImage.classList.add('moved');
        
        // Ждем завершения анимации скрытия intro-content
        setTimeout(() => {
            introOverlay.classList.remove('active');
            document.body.classList.remove('overlay-active');
            introOverlay.style.display = 'none';
            
            // Показываем product-detail и product-list-container
            productDetail.style.opacity = '1';
            productListContainer.style.opacity = '1';
        }, 500);
    });

    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment_status');
    const waitlistStatus = urlParams.get('waitlist_status');
    console.log('Payment status:', paymentStatus);
    console.log('Waitlist status:', waitlistStatus);

    if (paymentStatus || waitlistStatus) {
        console.log('Status detected, hiding intro overlay');
        introOverlay.style.display = 'none';
        productDetail.style.opacity = '1';
        productListContainer.style.opacity = '1';
        
        console.log('Calling checkStatus()');
        checkStatus();
    } else {
        console.log('No status, showing intro overlay');
        setTimeout(() => {
            introContent.style.opacity = '1';
        }, 500);
    }

    // Обработчики для закрытия модальных окон
    document.querySelectorAll('.payment-status-modal .close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            closeModal(closeBtn.closest('.modal').id);
        });
    });

    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('payment-status-modal')) {
            closeModal(event.target.id);
        }
    });

    // Запускаем анимацию
    animate();
});

// Callback function for Google Maps API
function initMap() {
    console.log('Google Maps API loaded');
}