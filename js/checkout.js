document.addEventListener('DOMContentLoaded', function() {
    const cartItems = document.getElementById('cart-items');
    const subtotalElement = document.getElementById('subtotal');
    const shippingCostElement = document.getElementById('shipping-cost');
    const totalCostElement = document.getElementById('total-cost');
    const checkoutForm = document.getElementById('checkout-form');
    const paymentDetails = document.getElementById('payment-details');
    const otherDelivery = document.getElementById('other-delivery');
    const stripeCheckoutBtn = document.getElementById('stripe-checkout-btn');
    const waitingListForm = document.getElementById('waiting-list-form');

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

        cart.forEach((item, index) => {
            if (products[item.id]) {
                const product = products[item.id];
                const itemElement = document.createElement('div');
                itemElement.className = 'cart-item';
                itemElement.innerHTML = `
                    <img src="/images/pin_${item.id}.svg" alt="${product.name}">
                    <div class="item-details">
                        <span class="item-name">${product.name}</span>
                        <span class="item-type">${product.category}</span>
                        <span class="item-price">€${product.price.toFixed(2)}</span>
                    </div>
                    <div class="item-quantity">
                        <button class="quantity-btn minus" data-index="${index}">-</button>
                        <input type="number" class="quantity-input" value="${item.quantity}" min="1" data-index="${index}">
                        <button class="quantity-btn plus" data-index="${index}">+</button>
                    </div>
                    <button class="remove-item" data-index="${index}">Remove</button>
                `;
                cartItems.appendChild(itemElement);
                subtotal += product.price * item.quantity;
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

    // Handle quantity change
    function handleQuantityChange(index, change) {
        cart[index].quantity += change;
        if (cart[index].quantity < 1) cart[index].quantity = 1;
        localStorage.setItem('cart', JSON.stringify(cart));
        displayCartItems();
    }

    // Remove item from cart
    function removeItem(index) {
        cart.splice(index, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        displayCartItems();
    }

    // Event listeners for quantity buttons and remove button
    cartItems.addEventListener('click', function(e) {
        if (e.target.classList.contains('quantity-btn')) {
            const index = parseInt(e.target.dataset.index);
            const change = e.target.classList.contains('plus') ? 1 : -1;
            handleQuantityChange(index, change);
        } else if (e.target.classList.contains('remove-item')) {
            const index = parseInt(e.target.dataset.index);
            removeItem(index);
        }
    });

    cartItems.addEventListener('change', function(e) {
        if (e.target.classList.contains('quantity-input')) {
            const index = parseInt(e.target.dataset.index);
            const newQuantity = parseInt(e.target.value);
            if (newQuantity >= 1) {
                cart[index].quantity = newQuantity;
                localStorage.setItem('cart', JSON.stringify(cart));
                displayCartItems();
            }
        }
    });

    // Initialize shipping method display
    function initializeShippingMethod() {
        const shippingMethod = document.querySelector('input[name="shipping"]:checked').value;
        updateShippingDisplay(shippingMethod);
    }

    // Update shipping display based on selected method
    function updateShippingDisplay(shippingMethod) {
        if (shippingMethod === 'pickup') {
            shippingCostElement.textContent = '€0.00';
            paymentDetails.style.display = 'block';
            otherDelivery.style.display = 'none';
            document.getElementById('pickup-address').style.display = 'block';
            document.getElementById('local-delivery-address').style.display = 'none';
            loadMap();
        } else if (shippingMethod === 'local') {
            shippingCostElement.textContent = '€5.00';
            paymentDetails.style.display = 'block';
            otherDelivery.style.display = 'none';
            document.getElementById('pickup-address').style.display = 'none';
            document.getElementById('local-delivery-address').style.display = 'block';
        } else if (shippingMethod === 'other') {
            shippingCostElement.textContent = '€10.00';
            paymentDetails.style.display = 'none';
            otherDelivery.style.display = 'block';
        }
        updateTotalCost();
    }

    // Handle shipping method change
    document.querySelectorAll('input[name="shipping"]').forEach(input => {
        input.addEventListener('change', function() {
            updateShippingDisplay(this.value);
        });
    });

    // Load Google Map
    function loadMap() {
        const mapContainer = document.getElementById('map-container');
        const mapOptions = {
            center: { lat: 41.1496, lng: -8.6108 }, // Coordinates for Porto
            zoom: 15
        };
        const map = new google.maps.Map(mapContainer, mapOptions);
        const marker = new google.maps.Marker({
            position: mapOptions.center,
            map: map,
            title: 'Pickup Location'
        });
    }

    // Initialize Stripe
    const stripe = Stripe('pk_test_51Pa3ibRscs7gmx3WK8tvLJAXQ2ugBOGM7KMEUyyNgLoQqYeLNxB2qo06ueA8kjWGd1qokCJNcSHgnKWe9JtF4V2M00SbWEiUby');

    function showLoader() {
        stripeCheckoutBtn.classList.add('loading');
        stripeCheckoutBtn.disabled = true;
    }

    function hideLoader() {
        stripeCheckoutBtn.classList.remove('loading');
        stripeCheckoutBtn.disabled = false;
    }

    // Handle form submission and Stripe checkout
    stripeCheckoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        const shippingMethod = document.querySelector('input[name="shipping"]:checked').value;
        let requiredFields;

        if (shippingMethod === 'pickup') {
            requiredFields = checkoutForm.querySelectorAll('#email, #phone, #name');
        } else if (shippingMethod === 'local') {
            requiredFields = checkoutForm.querySelectorAll('#email, #phone, #name, #address');
        } else {
            return; // Для третьего варианта не выполняем Stripe checkout
        }

        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.style.border = '2px solid red';
                isValid = false;
            } else {
                field.style.border = '';
            }
        });

        if (isValid) {
            handleStripeCheckout();
        }
    });

    async function handleStripeCheckout() {
        showLoader();

        const formData = new FormData(checkoutForm);
        const customerData = {
            email: formData.get('email'),
            name: formData.get('name'),
            phone: formData.get('phone'),
            address: formData.get('address')
        };

        const shippingMethod = document.querySelector('input[name="shipping"]:checked').value;
        let shippingCost = 0;

        if (shippingMethod === 'local') {
            shippingCost = 5;
        } else if (shippingMethod === 'other') {
            shippingCost = 10;
        }

        console.log('Sending request to create-checkout-session...');
        console.log('Cart data:', cart);
        console.log('Customer data:', customerData);
        console.log('Shipping method:', shippingMethod);
        console.log('Shipping cost:', shippingCost);

        try {
            const response = await fetch('https://bejewelled-hamster-2b071a.netlify.app/.netlify/functions/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cart: cart,
                    customerData: customerData,
                    shippingMethod: shippingMethod,
                    shippingCost: shippingCost
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
    }

    // Handle waiting list form submission
    waitingListForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('waiting-email').value;
        const country = document.getElementById('waiting-country').value;
        const city = document.getElementById('waiting-city').value;
        
        // Here you would typically send this data to your server
        console.log('Waiting list submission:', { email, country, city });
        alert('Thank you for joining the waiting list! We\'ll notify you when delivery becomes available in your area.');
    });

    // Initialize page
    loadCartData();
    displayCartItems();
    initializeShippingMethod();

    // Load countries and cities for the waiting list form
    const countries = ['USA', 'Canada', 'UK', 'Germany', 'France', 'Spain', 'Italy'];
    const cities = {
        'USA': ['New York', 'Los Angeles', 'Chicago'],
        'Canada': ['Toronto', 'Vancouver', 'Montreal'],
        'UK': ['London', 'Manchester', 'Birmingham'],
        'Germany': ['Berlin', 'Munich', 'Hamburg'],
        'France': ['Paris', 'Marseille', 'Lyon'],
        'Spain': ['Madrid', 'Barcelona', 'Valencia'],
        'Italy': ['Rome', 'Milan', 'Naples']
    };

    const countrySelect = document.getElementById('waiting-country');
    const citySelect = document.getElementById('waiting-city');

    countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        countrySelect.appendChild(option);
    });

    countrySelect.addEventListener('change', function() {
        citySelect.innerHTML = '';
        cities[this.value].forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            citySelect.appendChild(option);
        });
    });

    // Trigger change event to populate cities for the first country
    countrySelect.dispatchEvent(new Event('change'));
});

// Callback function for Google Maps API
function initMap() {
    // This function will be called when the Google Maps API is loaded
    console.log('Google Maps API loaded');
    // You can initialize the map here if needed, or leave it empty if you're initializing the map elsewhere
}