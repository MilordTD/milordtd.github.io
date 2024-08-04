document.addEventListener('DOMContentLoaded', function() {
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

        // Update the large image based on screen width
        largeImage.src = product.gallery[0];  // Use the first image in the gallery as the "large" image on mobile devices
        largeImageContainer.style.display = 'block';  // Ensure the container is displayed

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
                largeImage.src = imgSrc;  // Update the "large" image on gallery image click
                openModal(imgSrc);
            });
            container.appendChild(img);
        });
    }

    let currentProductId;

    function openModal(imgSrc) {
        const imageModal = document.getElementById('imageModal');
        const modalImg = document.getElementById('modalImage');
        if (imageModal && modalImg) {
            modalImg.src = imgSrc;
            imageModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    function handleResponsive() {
        const productDetail = document.querySelector('.product-detail');
        const productItems = document.querySelectorAll('.product-item');

        function handleProductClick(e) {
            const productId = e.currentTarget.dataset.productId;
            updateProductInfo(productId);
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

    let startX;
    let scrollLeft;

    function handleTouchStart(e) {
        startX = e.touches[0].pageX - productListWrapper.offsetLeft;
        scrollLeft = productListWrapper.scrollLeft;
    }

    function handleTouchMove(e) {
        if (!startX) return;
        const x = e.touches[0].pageX - productListWrapper.offsetLeft;
        const walk = (x - startX) * 2;
        productListWrapper.scrollLeft = scrollLeft - walk;
    }

    productListWrapper.addEventListener('touchstart', handleTouchStart);
    productListWrapper.addEventListener('touchmove', handleTouchMove);
    productListWrapper.addEventListener('touchend', () => {
        startX = null;
    });

    function animateAddToCart() {
        const productImage = document.querySelector('.product-item.active img').src;
        const startRect = largeImageContainer.getBoundingClientRect();
        const endRect = cartContainer.getBoundingClientRect();

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
            openModal('#successModal');
            cart = [];
            updateCart();
        } else if (waitlistStatus === 'success') {
            openModal('#waitlistSuccessModal');
        }

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

    function animateAddToCart() {
        const productImage = document.querySelector('.product-item.active img').src;
        const startRect = largeImageContainer.getBoundingClientRect();
        const endRect = cartContainer.getBoundingClientRect();

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
            }
        }

        const startTime = performance.now();
        requestAnimationFrame(animate);
    }
});
