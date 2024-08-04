import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

document.addEventListener('DOMContentLoaded', function() {
    let currentPosition = 0;

    const book3DModel = document.getElementById('book-3d-model');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, book3DModel.clientWidth / book3DModel.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(book3DModel.clientWidth, book3DModel.clientHeight);
    book3DModel.appendChild(renderer.domElement);

    let mouseX = 0;
    let mouseY = 0;
    let currentModel;
    const loaderElement = document.getElementById('loader');
    const largeImageContainer = document.getElementById('large-image-container');
    const largeImage = document.getElementById('large-image');

    const menuIcon = document.querySelector('.menu-icon');
    const popupMenu = document.querySelector('.popup-menu');
    menuIcon.addEventListener('click', () => {
        popupMenu.style.display = popupMenu.style.display === 'block' ? 'none' : 'block';
    });

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

    setTimeout(() => {
        typewriterEffect(typewriterText, textToType, 10);
    }, 1000);

    const loader = new GLTFLoader();

    function showLoader() {
        loaderElement.classList.add('visible');
    }

    function hideLoader() {
        loaderElement.classList.remove('visible');
    }

    function initializeRenderer(container) {
        const newRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        newRenderer.setClearColor(0x000000, 0);
        newRenderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(newRenderer.domElement);
        return newRenderer;
    }

    function initializeSceneAndCamera(container) {
        const newScene = new THREE.Scene();
        const aspect = container.clientWidth / container.clientHeight;
        const newCamera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        newCamera.position.z = 8;
        newCamera.position.y = 0.5;

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.01);
        newScene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.01);
        directionalLight.position.set(5, 5, 5);
        newScene.add(directionalLight);

        return { newScene, newCamera };
    }

    function loadModel(modelUrl, containerId) {
        let container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Container not found: ${containerId}. Creating a new one.`);
            container = document.createElement('div');
            container.id = containerId;
            document.querySelector('.product-image').appendChild(container);
        }

        container.innerHTML = '';

        const rendererInstance = initializeRenderer(container);
        const { newScene, newCamera } = initializeSceneAndCamera(container);
        const sceneInstance = newScene;
        const cameraInstance = newCamera;

        showLoader();

        loader.load(modelUrl, (gltf) => {
            const currentModel = gltf.scene;

            const box = new THREE.Box3().setFromObject(currentModel);
            const height = box.max.y - box.min.y;
            const scale = 7 / height;
            currentModel.scale.set(scale, scale, scale);

            currentModel.position.y = -(box.max.y - box.min.y) / 2;
            sceneInstance.add(currentModel);

            hideLoader();

            animate(rendererInstance, sceneInstance, cameraInstance);
        }, undefined, (error) => {
            console.error('An error happened', error);
            hideLoader();
        });
    }

    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        mouseY = (event.clientY / window.innerHeight) * 2 - 1;
    });

    function animate(rendererInstance, sceneInstance, cameraInstance) {
        requestAnimationFrame(() => animate(rendererInstance, sceneInstance, cameraInstance));

        if (currentModel) {
            currentModel.rotation.y = mouseX * Math.PI * 0.03;
            currentModel.rotation.x = mouseY * Math.PI * 0.03;
        }

        if (rendererInstance && sceneInstance && cameraInstance) {
            rendererInstance.render(sceneInstance, cameraInstance);
        }
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
            productItem.className = 'product-item swiper-slide';
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

        if (window.innerWidth <= 860) {
            largeImage.src = product.gallery[0];
            largeImageContainer.style.display = 'block';
            book3DModel.style.display = 'none';
        } else {
            loadModel(product.modelUrl, 'book-3d-model');
            largeImageContainer.style.display = 'none';
            book3DModel.style.display = 'flex';
        }

        const productGallery = document.querySelector('.product-gallery');
        if (product.gallery && Array.isArray(product.gallery) && productGallery) {
            updateGallery(product.gallery, productGallery);
        } else {
            console.error('Product gallery not found or invalid gallery data');
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

    function updateGallery(galleryImages, container) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }

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

    let currentProductId;

    function openModal(modalIdOrImgSrc) {
        if (modalIdOrImgSrc.startsWith('#')) {
            const modal = document.getElementById(modalIdOrImgSrc.slice(1));
            if (modal) {
                if (modalIdOrImgSrc === '#productDetailModal') {
                    updateProductDetailModal(currentProductId);
                }
                modal.style.display = 'block';
                document.body.style.overflow = 'hidden';
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
        const product = products[productId];
        const modalContent = document.querySelector('#productDetailModal .product-detail-modal-content');

        if (!modalContent) {
            console.error('Modal content element not found');
            return;
        }

        modalContent.innerHTML = `
            <h2>${product.name}</h2>
            <div class="modal-product-image">
                <img id="modal-large-image" src="${product.gallery[0]}" alt="Large product image">
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
                <h3>Item info</h3>
                <p>${product.buffs}</p>
            </div>
            <button class="add-to-cart" data-product-id="${productId}">ADD TO CART</button>
        `;

        const modalLargeImage = document.getElementById('modal-large-image');
        const modalGallery = document.querySelector('.modal-product-gallery');
        
        modalGallery.innerHTML = '';
        product.gallery.forEach((imgSrc, index) => {
            const img = document.createElement('img');
            img.src = imgSrc;
            img.alt = `Product image ${index + 1}`;
            img.classList.add('gallery-item');
            img.addEventListener('click', () => {
                modalLargeImage.src = imgSrc;
            });
            modalGallery.appendChild(img);
        });

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

            if (window.innerWidth <= 860) {
                currentProductId = productId;
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
        } else {
            if (productDetail) productDetail.style.display = 'flex';
            largeImageContainer.style.display = 'none';
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
        const categoryFilter = document.querySelector('.category-filter-container');
        if (!categoryFilter) {
            console.error('Category filter container not found');
            return;
        }

        const categories = [...new Set(Object.values(products).map(product => product.category))];
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

    function initializeSlider() {
        const swiper = new Swiper('.product-list-container', {
            direction: 'horizontal',
            loop: false,
            slidesPerView: 'auto',
            spaceBetween: 10,
            navigation: {
                nextEl: '.slider-arrow.right',
                prevEl: '.slider-arrow.left',
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
        });

        swiper.on('slideChange', function () {
            updateArrowVisibility();
        });

        updateArrowVisibility();
    }

    function updateSliderPosition() {
        const productListWrapper = document.querySelector('.product-list-wrapper');
        const productListContainer = document.querySelector('.product-list-container');

        if (productListWrapper && productListContainer) {
            const productListWidth = productListWrapper.scrollWidth;
            const containerWidth = productListContainer.clientWidth;
            const maxPosition = Math.max(0, productListWidth - containerWidth);

            currentPosition = Math.min(maxPosition, Math.max(0, currentPosition));
            productListWrapper.style.transform = `translateX(-${currentPosition}px)`;
        }
    }

    function updateArrowVisibility() {
        const productListWrapper = document.querySelector('.product-list-wrapper');
        const productListContainer = document.querySelector('.product-list-container');
        const leftArrow = document.querySelector('.slider-arrow.left');
        const rightArrow = document.querySelector('.slider-arrow.right');

        if (productListWrapper && productListContainer && leftArrow && rightArrow) {
            const productListWidth = productListWrapper.scrollWidth;
            const containerWidth = productListContainer.clientWidth;
            const maxPosition = productListWidth - containerWidth;

            if (currentPosition <= 0) {
                leftArrow.classList.remove('visible');
            } else {
                leftArrow.classList.add('visible');
            }

            if (currentPosition >= maxPosition) {
                rightArrow.classList.remove('visible');
            } else {
                rightArrow.classList.add('visible');
            }
        }
    }

    leftArrow.addEventListener('click', () => {
        const productListContainer = document.querySelector('.product-list-container');
        currentPosition -= productListContainer.clientWidth / 2;
        updateSliderPosition();
        updateArrowVisibility();
    });

    rightArrow.addEventListener('click', () => {
        const productListContainer = document.querySelector('.product-list-container');
        currentPosition += productListContainer.clientWidth / 2;
        updateSliderPosition();
        updateArrowVisibility();
    });

    function updateCart() {
        const cartItems = document.querySelector('.cart-items');
        const cartTotal = document.querySelector('.total-amount');
        const cartContainer = document.querySelector('.cart-container');

        cartItems.innerHTML = '';
        let total = 0;

        cart.forEach(productId => {
            const product = products[productId];

            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.dataset.productId = productId;
            cartItem.innerHTML = `
                <span>${product.name}</span>
                <span>€${product.price.toFixed(2)}</span>
                <button class="remove-from-cart">×</button>
            `;

            cartItem.querySelector('.remove-from-cart').addEventListener('click', () => {
                cart = cart.filter(id => id !== productId);
                updateCart();
            });

            cartItems.appendChild(cartItem);
            total += product.price;
        });

        cartTotal.textContent = total.toFixed(2);

        if (cart.length > 0) {
            cartContainer.classList.add('active');
            productListContainer.classList.add('with-cart');
        } else {
            cartContainer.classList.remove('active');
            productListContainer.classList.remove('with-cart');
        }
    }

    function animateAddToCart() {
        const cartIcon = document.querySelector('.cart-icon');
        const cartContainer = document.querySelector('.cart-container');
        const productListContainer = document.querySelector('.product-list-container');

        cartIcon.classList.add('animate');
        setTimeout(() => cartIcon.classList.remove('animate'), 1000);

        cartContainer.classList.add('active');
        productListContainer.classList.add('with-cart');
    }

    document.querySelector('.empty-cart-button').addEventListener('click', () => {
        cart = [];
        updateCart();
    });

    function checkStatus() {
        const urlParams = new URLSearchParams(window.location.search);
        const paymentStatus = urlParams.get('payment_status');
        const waitlistStatus = urlParams.get('waitlist_status');

        const successModal = document.getElementById('successModal');
        const waitlistSuccessModal = document.getElementById('waitlistSuccessModal');

        if (paymentStatus === 'success') {
            openModal('#successModal');
            cart = [];
            updateCart();
        } else if (waitlistStatus === 'success') {
            openModal('#waitlistSuccessModal');
        }

        window.history.replaceState({}, document.title, window.location.pathname);
    }

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

    function animate(rendererInstance, sceneInstance, cameraInstance) {
        requestAnimationFrame(() => animate(rendererInstance, sceneInstance, cameraInstance));
        resizeRendererToDisplaySize(rendererInstance, cameraInstance);
        if (currentModel) {
            currentModel.rotation.y = mouseX * Math.PI * 0.03;
            currentModel.rotation.x = mouseY * Math.PI * 0.03;
        }
        rendererInstance.render(sceneInstance, cameraInstance);
    }

    animate(renderer, scene, camera);
});
