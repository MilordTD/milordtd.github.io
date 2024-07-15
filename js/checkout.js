document.addEventListener('DOMContentLoaded', function() {
    const cartItems = document.getElementById('cart-items');
    const subtotalElement = document.getElementById('subtotal');
    const shippingCostElement = document.getElementById('shipping-cost');
    const totalCostElement = document.getElementById('total-cost');
    const checkoutForm = document.getElementById('checkout-form');
    const addressGroup = document.getElementById('address-group');
    const stripeCheckoutBtn = document.getElementById('stripe-checkout-btn');

    let cart = [];
    let products = {};

    // Load cart data and products from localStorage
    function loadCartData() {
        cart = JSON.parse(localStorage.getItem('cart')) || [];
        products = JSON.parse(localStorage.getItem('products')) || {};
    }

    // Display cart items
    function displayCartItems() {
        cartItems.innerHTML = '';
        let subtotal = 0;

        cart.forEach(productId => {
            if (products[productId]) {
                const product = products[productId];
                const itemElement = document.createElement('div');
                itemElement.className = 'cart-item';
                itemElement.innerHTML = `
                    <img src="/images/pin_${productId}.svg" alt="${product.name}">
                    <div class="item-details">
                        <span class="item-name">${product.name}</span>
                        <span class="item-type">${product.category}</span>
                        <span class="item-price">€${product.price.toFixed(2)}</span>
                    </div>
                `;
                cartItems.appendChild(itemElement);
                subtotal += product.price;
            }
        });

        subtotalElement.textContent = `€${subtotal.toFixed(2)}`;
        updateTotalCost();
    }

    // Update total cost
    function updateTotalCost() {
        const subtotal = parseFloat(subtotalElement.textContent.slice(1));
        const shippingCost = parseFloat(shippingCostElement.textContent.slice(1));
        const total = subtotal + shippingCost;
        totalCostElement.textContent = `€${total.toFixed(2)}`;
    }

    // Handle shipping method change
    document.querySelectorAll('input[name="shipping"]').forEach(input => {
        input.addEventListener('change', function() {
            if (this.value === 'local') {
                shippingCostElement.textContent = '€5.00';
                addressGroup.style.display = 'block';
            } else {
                shippingCostElement.textContent = '€0.00';
                addressGroup.style.display = 'none';
            }
            updateTotalCost();
        });
    });

    // Initialize Stripe
    const stripe = Stripe('pk_test_51Pa3ibRscs7gmx3WK8tvLJAXQ2ugBOGM7KMEUyyNgLoQqYeLNxB2qo06ueA8kjWGd1qokCJNcSHgnKWe9JtF4V2M00SbWEiUby'); // Replace with your actual publishable key

    function showLoader() {
        stripeCheckoutBtn.classList.add('loading');
    }

    function hideLoader() {
        stripeCheckoutBtn.classList.remove('loading');
    }

    // Handle Stripe checkout
    stripeCheckoutBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        showLoader();

        const formData = new FormData(checkoutForm);
        const customerData = {
            email: formData.get('email'),
            name: formData.get('name'),
            phone: formData.get('phone'),
            address: formData.get('address')
        };

        const shippingMethod = document.querySelector('input[name="shipping"]:checked').value;

        try {
            console.log('Sending request to create-checkout-session...');
            const response = await fetch('https://bejewelled-hamster-2b071a.netlify.app/.netlify/functions/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cart: cart,
                    customerData: customerData,
                    shippingMethod: shippingMethod
                }),
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const data = await response.json();
            console.log('Response data:', data);
            
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error("No checkout URL in the response");
            }
        } catch (error) {
            console.error('Error:', error);
            alert(`An error occurred: ${error.message}. Please try again later.`);
            hideLoader();
        }
    });

    // Initialize page
    loadCartData();
    displayCartItems();

    // Map modal functionality
    const mapModal = document.getElementById('map-modal');
    const showMapBtn = document.getElementById('show-map');
    const closeBtn = document.getElementsByClassName('close')[0];
    const googleMap = document.getElementById('google-map');

    showMapBtn.onclick = function() {
        mapModal.style.display = 'block';
        // Replace coordinates with actual cafe location
        googleMap.src = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12345.67890!2d-8.6108!3d41.1496!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDHCsDA4JzU4LjYiTiA4wrAzNic0My4wIlc!5e0!3m2!1sen!2spt!4v1234567890123!5m2!1sen!2spt';
    }

    closeBtn.onclick = function() {
        mapModal.style.display = 'none';
    }

    window.onclick = function(event) {
        if (event.target == mapModal) {
            mapModal.style.display = 'none';
        }
    }
});