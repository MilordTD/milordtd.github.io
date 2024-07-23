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
    let products = {};
    let cart = [];
    const cartContainer = document.querySelector('.cart-container');
    const cartItems = document.querySelector('.cart-items');
    const cartTotal = document.querySelector('.total-amount');
    const productListContainer = document.querySelector('.product-list-container');
    const productListWrapper = document.querySelector('.product-list-wrapper');
    const leftArrow = document.querySelector('.slider-arrow.left');
    const rightArrow = document.querySelector('.slider-arrow.right');

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

    document.addEventListener('mousemove', onDocumentMouseMove, false);

    function typewriterEffect(element, text, speed = 10) {
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
    const textToType = "I'm Erin, an artist, traveler and adventurer.\nI've got a neat collection of trinkets, artifacts\nand equipment. Wanna trade?";

    // Запускаем эффект печатной машинки после открытия интро
    setTimeout(() => {
        typewriterEffect(typewriterText, textToType, 10);
    }, 1000);

    // Загрузка 3D модели
    const loader = new GLTFLoader();
    let currentModel;

    function loadModel(modelUrl) {
        while(scene.children.length > 0){ 
            scene.remove(scene.children[0]); 
        }

        loader.load(modelUrl, (gltf) => {
            currentModel = gltf.scene;
            
            const box = new THREE.Box3().setFromObject(currentModel);
            const height = box.max.y - box.min.y;
            const scale = 7 / height;
            currentModel.scale.set(scale, scale, scale);
            
            scene.add(currentModel);
            
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

    function loadCartData() {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            cart = JSON.parse(savedCart);
        }
        const savedProducts = localStorage.getItem('products');
        if (savedProducts) {
            products = JSON.parse(savedProducts);
        }
        console.log('Cart data loaded:', cart);
        console.log('Products data loaded:', products);
    }

    function displayCartItems() {
        cartItems.innerHTML = '';
        let total = 0;

        cart.forEach((item, index) => {
            const product = products[item.id];
            if (product) {
                const itemElement = document.createElement('div');
                itemElement.className = 'cart-item';
                itemElement.innerHTML = `
                    <span>${product.name} x${item.quantity}</span>
                    <span>€${(product.price * item.quantity).toFixed(2)}</span>
                `;
                cartItems.appendChild(itemElement);
                total += product.price * item.quantity;
            }
        });

        cartTotal.textContent = total.toFixed(2);
        updateCart();
    }

    function handleQuantityChange(event) {
        const index = event.target.dataset.index;
        const action = event.target.classList.contains('plus') ? 'increase' : 'decrease';
        
        if (action === 'increase') {
            cart[index].quantity++;
        } else if (action === 'decrease') {
            if (cart[index].quantity > 1) {
                cart[index].quantity--;
            } else {
                cart.splice(index, 1);
            }
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        displayCartItems();
    }

    function handleAddToCart(event) {
        const productId = event.target.dataset.productId;
        addToCart(productId);
    }

    function handleProductClick(event) {
        const productId = event.currentTarget.dataset.productId;
        updateProductInfo(productId);
    }

    function initializeShop() {
        console.log('Initializing shop');
        loadCartData();
        displayCartItems();
        initializeProducts();
        initializeSlider();
        updateCategoryFilter();
        handleResponsive();
        checkStatus();

        initializeEventListeners();
    }

    function initializeEventListeners() {
        console.log('Initializing event listeners');
        
        document.querySelectorAll('.quantity-btn').forEach(btn => {
            btn.removeEventListener('click', handleQuantityChange);
            btn.addEventListener('click', handleQuantityChange);
        });

        document.querySelectorAll('.add-to-cart').forEach(btn => {
            btn.removeEventListener('click', handleAddToCart);
            btn.addEventListener('click', handleAddToCart);
        });

        document.querySelectorAll('.product-item').forEach(item => {
            item.removeEventListener('click', handleProductClick);
            item.addEventListener('click', handleProductClick);
        });

        const emptyCartButton = document.querySelector('.empty-cart-button');
        if (emptyCartButton) {
            emptyCartButton.removeEventListener('click', handleEmptyCart);
            emptyCartButton.addEventListener('click', handleEmptyCart);
        }

        const checkoutButton = document.querySelector('.checkout-button');
        if (checkoutButton) {
            checkoutButton.removeEventListener('click', handleCheckout);
            checkoutButton.addEventListener('click', handleCheckout);
        }
    }

    function handleEmptyCart() {
        cart = [];
        updateCart();
        updateProductInfo(Object.keys(products)[0]);
    }

    function handleCheckout() {
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
    }

    function updateURL(url) {
        history.pushState(null, '', url);
    }

    window.addEventListener('popstate', function(event) {
        console.log('popstate event triggered');
        initializeShop();
    });

    initializeShop();

    document.body.addEventListener('click', function(e) {
        if (e.target.tagName === 'A' && e.target.href.startsWith(window.location.origin)) {
            e.preventDefault();
            updateURL(e.target.href);
            initializeShop();
        }
    });

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

    function updateProductInfo(productId) {
        const product = products[productId];
        document.getElementById('product-name').textContent = product.name;
        document.getElementById('product-price').textContent = `€${product.price.toFixed(2)}`;
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

    let currentProductId;

    function openModal(modalIdOrImgSrc) {
        console.log('Opening modal:', modalIdOrImgSrc);
        if (modalIdOrImgSrc.startsWith('#')) {
            const modal = document.getElementById(modalIdOrImgSrc.slice(1));
            if (modal) {
                if (modalIdOrImgSrc === '#productDetailModal') {
                    updateProductDetailModal(currentProductId);
                }
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

    function updateProductDetailModal(productId) {
        console.log('Updating product detail modal for product:', productId);
        const product = products[productId];
        const modalContent = document.querySelector('#productDetailModal .product-detail-modal-content');
        
        if (!modalContent) {
            console.error('Modal content element not found');
            return;
        }
        
        modalContent.innerHTML = `
            <h2>${product.name}</h2>
            <div class="modal-product-image">
                <div id="modal-book-3d-model"></div>
                <div class="modal-product-gallery"></div>
            </div>
            <p>Price: €${product.price.toFixed(2)}</p>
            <div>
                <h3>Ingredients</h3>
                <p>${product.ingredients}</p>
            </div>
            <div>
                <h3>Characteristics</h3>
                <p>${product.characteristics}</p>
            </div>
            <div>
                <h3>Buffs and Debuffs</h3>
                <p>${product.buffs}</p>
            </div>
            <button class="add-to-cart" data-product-id="${productId}">ADD TO CART</button>
        `;

        console.log('Modal content updated');

        // Загрузка 3D модели
        loadModel(product.modelUrl, 'modal-book-3d-model');

        // Обновление галереи
        if (product.gallery && Array.isArray(product.gallery)) {
            updateGallery(product.gallery, modalContent.querySelector('.modal-product-gallery'));
        }

        const addToCartButton = modalContent.querySelector('.add-to-cart');
        addToCartButton.addEventListener('click', function() {
            addToCart(this.dataset.productId);
            closeModal('productDetailModal');
        });
    }

    function handleResponsive() {
        const productDetail = document.querySelector('.product-detail');
        const productItems = document.querySelectorAll('.product-item');

        function handleProductClick(e) {
            const productId = e.currentTarget.dataset.productId;
            console.log('Product clicked:', productId);
            console.log('Window size:', window.innerWidth, 'x', window.innerHeight);
            
            if (window.innerWidth <= 860) {
                console.log('Opening modal for product:', productId);
                currentProductId = productId;
                openModal('#productDetailModal');
            } else {
                console.log('Updating product info for:', productId);
                updateProductInfo(productId);
            }
        }

        productItems.forEach(item => {
            item.removeEventListener('click', handleProductClick);
            item.addEventListener('click', handleProductClick);
        });

        if (window.innerWidth <= 860) {
            if (productDetail) productDetail.style.display = 'none';
        } else {
            if (productDetail) productDetail.style.display = 'flex';
        }

        updateArrowVisibility();
    }

    handleResponsive();
    window.addEventListener('resize', handleResponsive);

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

    function addToCart(productId) {
        cart.push(productId);
        updateCart();
        animateAddToCart();
        closeModal('productDetailModal');
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

    console.log('DOM fully loaded');
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

    window.addEventListener('resize', handleResponsive);

    window.addEventListener('resize', function() {
        updateCart();
    });

    animate();
});

function initMap() {
    console.log('Google Maps API loaded');
}