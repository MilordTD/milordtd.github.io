import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
THREE.Cache.enabled = true; // Включаем кэширование

document.addEventListener('DOMContentLoaded', function() {
    const book3DModel = document.getElementById('book-3d-model');
    let renderer, scene, camera, currentModel;
    let mouseX = 0, mouseY = 0;
    let products = {};
    let cart = [];
    const largeImageContainer = document.getElementById('large-image-container');
    const largeImage = document.getElementById('large-image');
    const cartContainer = document.querySelector('.cart-container');
    const cartItems = document.querySelector('.cart-items');
    const cartTotal = document.querySelector('.total-amount');
    const productListContainer = document.querySelector('.product-list-container');
    const productListWrapper = document.querySelector('.product-list-wrapper');
    const leftArrow = document.querySelector('.slider-arrow.left');
    const rightArrow = document.querySelector('.slider-arrow.right');

    // Инициализация рендерера, сцены и камеры
    function initialize3D(container) {
        if (!renderer) {
            renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
            renderer.setClearColor(0x000000, 0);
            container.appendChild(renderer.domElement);
        }
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.z = 8;
        renderer.setSize(container.clientWidth, container.clientHeight);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.01);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.01);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);
    }

    // Удаление модели и ресурсов сцены
    function disposeScene() {
        if (scene) {
            scene.traverse((object) => {
                if (!object.isMesh) return;

                if (object.geometry) object.geometry.dispose();

                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(mat => mat.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });

            while (scene.children.length > 0) {
                scene.remove(scene.children[0]);
            }
        }
    }

    // Загрузка и отображение модели
    function loadModel(modelUrl) {
        disposeScene(); // Очистка предыдущей сцены

        const loader = new GLTFLoader();
        loader.load(modelUrl, (gltf) => {
            currentModel = gltf.scene;

            const box = new THREE.Box3().setFromObject(currentModel);
            const height = box.max.y - box.min.y;
            const scale = 7 / height;
            currentModel.scale.set(scale, scale, scale);

            currentModel.position.y = -(box.max.y - box.min.y) / 2; // Центрирование модели по вертикали
            scene.add(currentModel);

            animate();
        }, undefined, (error) => {
            console.error('An error happened', error);
        });
    }

    // Анимация сцены
    function animate() {
        requestAnimationFrame(animate);
        resizeRendererToDisplaySize(renderer, camera);

        if (currentModel) {
            currentModel.rotation.y = mouseX * Math.PI * 0.03;
            currentModel.rotation.x = mouseY * Math.PI * 0.03;
        }

        renderer.render(scene, camera);
    }

    // Проверка и обновление размеров рендерера
    function resizeRendererToDisplaySize(renderer, camera) {
        const canvas = renderer.domElement;
        const width = book3DModel.clientWidth;
        const height = book3DModel.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        }
        return needResize;
    }

    // Обработка движения мыши
    function onDocumentMouseMove(event) {
        mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        mouseY = (event.clientY / window.innerHeight) * 2 - 1;
    }

    document.addEventListener('mousemove', onDocumentMouseMove, false);

    // Инициализация 3D сцены и рендерера
    initialize3D(book3DModel);

    // Загрузка продуктов из JSON
    fetch('/products.json') // Замените '/path/to/products.json' на реальный путь к JSON
        .then(response => response.json())
        .then(data => {
            products = data;
            initializeProducts();
        })
        .catch(error => {
            console.error('Error loading products:', error);
        });

    // Инициализация продуктов
    function initializeProducts() {
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

        document.querySelectorAll('.product-item').forEach(item => {
            item.addEventListener('click', function() {
                const productId = this.dataset.productId;
                updateProductInfo(productId);
            });
        });

        const firstProductId = Object.keys(products)[0];
        updateProductInfo(firstProductId);

        initializeSlider();
        updateCategoryFilter();

        handleResponsive();
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

        // Предварительная загрузка галереи изображений
        product.gallery.forEach(imageUrl => {
            preloadImage(imageUrl);
        });

        // Обновление изображения или 3D модели
        if (window.innerWidth <= 860) {
            largeImage.src = product.gallery[0];
            largeImageContainer.style.display = 'block';
            book3DModel.style.display = 'none';
        } else {
            loadModel(product.modelUrl);
            largeImageContainer.style.display = 'none';
            book3DModel.style.display = 'flex';
        }

        updateGallery(product.gallery, document.querySelector('.product-gallery'));

        document.querySelectorAll('.product-item').forEach(item => {
            item.classList.remove('active');
        });
        const activeItem = document.querySelector(`.product-item[data-product-id="${productId}"]`);
        if (activeItem) activeItem.classList.add('active');

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

    // Обновление галереи изображений
    function updateGallery(galleryImages, container) {
        if (!container) {
            console.error('Gallery container not found');
            return;
        }

        container.innerHTML = '';
        galleryImages.forEach((imgSrc, index) => {
            const img = document.createElement('img');
            img.src = imgSrc;
            img.alt = `Product image ${index + 1}`;
            img.classList.add('gallery-item');
            img.addEventListener('click', () => {
                largeImage.src = imgSrc;
                if (window.innerWidth > 860) {
                    openModal(imgSrc);
                }
            });
            container.appendChild(img);
        });
    }

    // Функции для работы с корзиной
    function updateCart() {
        const cartItemCount = cart.length;

        cartItems.textContent = `Items in cart: ${cartItemCount}`;

        let total = cart.reduce((sum, productId) => sum + products[productId].price, 0);
        cartTotal.textContent = total.toFixed(2);

        if (cartItemCount > 0) {
            cartContainer.classList.add('active');
            productListContainer.classList.add('with-cart');

            if (window.innerWidth <= 860) {
                productListContainer.style.bottom = '220px';
            }
        } else {
            cartContainer.classList.remove('active');
            productListContainer.classList.remove('with-cart');

            if (window.innerWidth <= 860) {
                productListContainer.style.bottom = '20px';
            }
        }
    }

    const emptyCartButton = document.querySelector('.empty-cart-button');
    if (emptyCartButton) {
        emptyCartButton.addEventListener('click', () => {
            cart = [];
            updateCart();
            updateProductInfo(Object.keys(products)[0]);
        });
    }

    updateCart();

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

    // Работа с галереей и модальными окнами
    function openModal(modalIdOrImgSrc) {
        console.log('Opening modal:', modalIdOrImgSrc);
        if (modalIdOrImgSrc.startsWith('#')) {
            const modal = document.getElementById(modalIdOrImgSrc.slice(1));
            if (modal) {
                modal.style.display = 'block';
                document.body.style.overflow = 'hidden';
                console.log('Modal opened');
            } else {
                console.error('Modal not found:', modalIdOrImgSrc);
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

    document.querySelectorAll('.modal .close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            const modalId = closeBtn.closest('.modal').id;
            closeModal(modalId);
        });
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal(modal.id);
            }
        });
    });

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

        function calculatePosition(progress) {
            const startX = startRect.left;
            const startY = startRect.top;
            const endX = endRect.right - 20;
            const endY = endRect.bottom - 20;

            const controlX = (startX + endX) / 2;
            const controlY = startY - 100;

            const x = Math.pow(1 - progress, 2) * startX +
                2 * (1 - progress) * progress * controlX +
                Math.pow(progress, 2) * endX;
            const y = Math.pow(1 - progress, 2) * startY +
                2 * (1 - progress) * progress * controlY +
                Math.pow(progress, 2) * endY;

            return { x, y };
        }

        function animate(currentTime) {
            const duration = 1000;
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

    // Адаптация к мобильным устройствам
    function handleResponsive() {
        const productDetail = document.querySelector('.product-detail');
        const productItems = document.querySelectorAll('.product-item');

        function handleProductClick(e) {
            const productId = e.currentTarget.dataset.productId;
            if (window.innerWidth <= 860) {
                openModal('#productDetailModal');
            } else {
                updateProductInfo(productId);
            }
        }

        productItems.forEach(item => {
            item.removeEventListener('click', handleProductClick);
            item.addEventListener('click', handleProductClick);
        });

        if (window.innerWidth <= 860) {
            if (productDetail) productDetail.style.display = 'none';
            largeImageContainer.style.display = 'block';
            leftArrow.style.display = 'none';
            rightArrow.style.display = 'none';
        } else {
            if (productDetail) productDetail.style.display = 'flex';
            largeImageContainer.style.display = 'none';
            updateArrowVisibility();
        }
    }

    handleResponsive();
    window.addEventListener('resize', handleResponsive);

    // Дополнительные функции, например, для работы с платежами и статусами
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
            cart = [];
            updateCart();
        } else if (waitlistStatus === 'success') {
            console.log('Opening waitlist success modal');
            openModal('#waitlistSuccessModal');
        }

        console.log('Removing status parameters from URL');
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Инициализация страницы
    const introOverlay = document.querySelector('.intro-overlay');
    const introContent = document.querySelector('.intro-content');
    const introButton = document.querySelector('.intro-button');
    const productDetail = document.querySelector('.product-detail');
    const erinImage = document.querySelector('.erin-image');

    introOverlay.classList.add('active');
    document.body.classList.add('overlay-active');

    setTimeout(() => {
        introContent.style.opacity = '1';
    }, 500);

    introButton.addEventListener('click', (event) => {
        console.log('Explore loot button clicked');
        event.preventDefault();
        event.stopPropagation();

        introContent.style.opacity = '0';

        erinImage.classList.add('moved');

        setTimeout(() => {
            introOverlay.classList.remove('active');
            document.body.classList.remove('overlay-active');
            introOverlay.style.display = 'none';

            productDetail.style.opacity = '1';
            productListContainer.style.opacity = '1';
        }, 500);
    });

    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment_status');
    const waitlistStatus = urlParams.get('waitlist_status');

    if (paymentStatus || waitlistStatus) {
        introOverlay.style.display = 'none';
        productDetail.style.opacity = '1';
        productListContainer.style.opacity = '1';
        checkStatus();
    } else {
        setTimeout(() => {
            introContent.style.opacity = '1';
        }, 500);
    }
});

// Callback function for Google Maps API
function initMap() {
    console.log('Google Maps API loaded');
}
