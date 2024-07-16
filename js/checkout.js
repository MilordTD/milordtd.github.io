document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');
    
    const cartItems = document.getElementById('cart-items');
    const subtotalElement = document.getElementById('subtotal');
    const shippingCostElement = document.getElementById('shipping-cost');
    const totalCostElement = document.getElementById('total-cost');
    const checkoutForm = document.getElementById('checkout-form');
    const stripeCheckoutBtn = document.getElementById('stripe-checkout-btn');
    const waitingListForm = document.getElementById('waiting-list-form');
    const countrySelect = document.getElementById('waiting-country');
    const cityInput = document.getElementById('waiting-city');
    const shippingOptions = document.querySelectorAll('.shipping-option');
    const paymentDetails = document.getElementById('payment-details');
    const otherDelivery = document.getElementById('other-delivery');
    const pickupForm = document.getElementById('pickup-form');
    const menuIcon = document.querySelector('.menu-icon');
    const popupMenu = document.querySelector('.popup-menu');
    const localDeliveryForm = document.getElementById('local-delivery-form');

    let cart = [];
    let products = {};

    // Load cart data and products from localStorage
    function loadCartData() {
        cart = JSON.parse(localStorage.getItem('cart')) || [];
        products = JSON.parse(localStorage.getItem('products')) || {};
        console.log('Loaded cart:', cart);
        console.log('Loaded products:', products);
    }

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
        console.log('Cart items displayed, subtotal:', subtotal);
    }

    // Update total cost
    function updateTotalCost() {
        const subtotal = parseFloat(subtotalElement.textContent.slice(1));
        const shippingCost = parseFloat(shippingCostElement.textContent.slice(1));
        const total = subtotal + shippingCost;
        totalCostElement.textContent = `€${total.toFixed(2)}`;
        console.log('Total cost updated:', total);
    }

    // Handle quantity change
    function handleQuantityChange(index, change) {
        cart[index].quantity += change;
        if (cart[index].quantity < 1) cart[index].quantity = 1;
        localStorage.setItem('cart', JSON.stringify(cart));
        displayCartItems();
        console.log('Quantity changed for item at index:', index, 'New quantity:', cart[index].quantity);
    }

    // Remove item from cart
    function removeItem(index) {
        cart.splice(index, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        displayCartItems();
        console.log('Item removed from cart at index:', index);
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
                console.log('Quantity manually changed for item at index:', index, 'New quantity:', newQuantity);
            }
        }
    });

    // Handle shipping method selection
    shippingOptions.forEach(option => {
        option.addEventListener('click', function() {
            console.log('Shipping option clicked:', this.dataset.value);
            
            // Remove 'selected' class from all options
            shippingOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Add 'selected' class to clicked option
            this.classList.add('selected');

            // Update shipping cost and form visibility
            const shippingMethod = this.dataset.value;

            if (shippingMethod === 'pickup') {
                shippingCostElement.textContent = '€0.00';
                paymentDetails.style.display = 'block';
                otherDelivery.style.display = 'none';
                if (pickupForm) pickupForm.style.display = 'block';
                if (localDeliveryForm) localDeliveryForm.style.display = 'none';
            } else if (shippingMethod === 'local') {
                shippingCostElement.textContent = '€5.00';
                paymentDetails.style.display = 'block';
                otherDelivery.style.display = 'none';
                if (pickupForm) pickupForm.style.display = 'none';
                if (localDeliveryForm) localDeliveryForm.style.display = 'block';
            } else if (shippingMethod === 'other') {
                shippingCostElement.textContent = '€10.00';
                paymentDetails.style.display = 'none';
                otherDelivery.style.display = 'block';
                if (pickupForm) pickupForm.style.display = 'none';
                if (localDeliveryForm) localDeliveryForm.style.display = 'none';
            }
            updateTotalCost();
        });
    });

    // Initialize Stripe
    const stripe = Stripe('pk_test_51Pa3ibRscs7gmx3WK8tvLJAXQ2ugBOGM7KMEUyyNgLoQqYeLNxB2qo06ueA8kjWGd1qokCJNcSHgnKWe9JtF4V2M00SbWEiUby');

    function showLoader() {
        stripeCheckoutBtn.classList.add('loading');
        stripeCheckoutBtn.disabled = true;
        console.log('Loader shown');
    }

    function hideLoader() {
        stripeCheckoutBtn.classList.remove('loading');
        stripeCheckoutBtn.disabled = false;
        console.log('Loader hidden');
    }

    // Handle form submission and Stripe checkout
    stripeCheckoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Stripe checkout button clicked');
        
        const selectedShippingOption = document.querySelector('.shipping-option.selected');
        if (!selectedShippingOption) {
            console.log('No shipping method selected');
            alert('Please select a shipping method');
            return;
        }

        const shippingMethod = selectedShippingOption.dataset.value;
        console.log('Selected shipping method:', shippingMethod);

        let form;
        if (shippingMethod === 'pickup') {
            form = document.getElementById('pickup-form');
        } else if (shippingMethod === 'local') {
            form = document.getElementById('local-delivery-form');
        } else {
            console.log('Invalid shipping method');
            return;
        }

        // Check if the selected form exists and is an HTMLFormElement
        if (!form || !(form instanceof HTMLFormElement)) {
            console.error('Selected form is not valid or not an HTMLFormElement:', form);
            return;
        }

        const requiredFields = form.querySelectorAll('input[required], textarea[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.style.border = '2px solid red';
                isValid = false;
                console.log('Invalid field:', field.id);
            } else {
                field.style.border = '';
            }
        });

        if (isValid) {
            handleStripeCheckout(shippingMethod, form);
        } else {
            console.log('Form validation failed');
        }
    });

    async function handleStripeCheckout(shippingMethod, form) {
        showLoader();

        // Check if form is an HTMLFormElement
        if (!(form instanceof HTMLFormElement)) {
            console.error('Provided parameter is not an HTMLFormElement:', form);
            hideLoader();
            return;
        }

        const formData = new FormData(form);
        const customerData = {
            email: formData.get('email'),
            name: formData.get('name'),
            phone: formData.get('phone'),
            address: formData.get('address')
        };

        let shippingCost = 0;
        if (shippingMethod === 'local') {
            shippingCost = 5;
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

    // Загрузка списка стран
    async function loadCountries() {
        try {
            const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2');
            const countries = await response.json();
            
            countrySelect.innerHTML = '<option value="">Select Country</option>';
            countries.sort((a, b) => a.name.common.localeCompare(b.name.common)).forEach(country => {
                const option = document.createElement('option');
                option.value = country.cca2;
                option.textContent = country.name.common;
                countrySelect.appendChild(option);
            });
            console.log('Countries loaded successfully');
        } catch (error) {
            console.error('Error loading countries:', error);
            countrySelect.innerHTML = '<option value="">Error loading countries. Please try again later.</option>';
        }
    }

    // Обработчик изменения выбранной страны
    countrySelect.addEventListener('change', function() {
        const selectedCountry = this.value;
        console.log('Selected country:', selectedCountry);
        if (selectedCountry) {
            cityInput.disabled = false;
            // Для упрощения, просто включаем поле input для ввода города
            cityInput.placeholder = 'Enter your city';
        } else {
            cityInput.value = '';
            cityInput.disabled = true;
        }
    });

    // Handle waiting list form submission
    waitingListForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Waitlist form submitted');
        const email = document.getElementById('waiting-email').value;
        const country = countrySelect.options[countrySelect.selectedIndex].text;
        const city = cityInput.value;

        console.log('Sending waitlist submission...');
        console.log('Waitlist data:', { email, country, city });

        try {
            const response = await fetch('https://bejewelled-hamster-2b071a.netlify.app/.netlify/functions/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    isWaitlist: true,
                    customerData: { email, country, city }
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Waitlist submission result:', result);
            window.location.href = '/shop?waitlist_status=success';
        } catch (error) {
            console.error('Error submitting waitlist:', error);
            alert('An error occurred while submitting your information. Please try again later.');
        }
    });

    // Инициализация страницы
    loadCartData();
    displayCartItems();
    loadCountries();
    console.log('Page initialized');
});

// Глобальная функция initMap для callback Google Maps API
window.initMap = function() {
    console.log('Google Maps API loaded, initMap called');
    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) {
        console.error('Map container not found');
        return;
    }
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
    console.log('Map initialized');
};
