document.addEventListener('DOMContentLoaded', function() {
    const shippingOptions = document.querySelectorAll('.shipping-option');
    const pickupFields = document.getElementById('pickup-fields');
    const localFields = document.getElementById('local-fields');
    const otherFields = document.getElementById('other-fields');
    const stripeCheckoutBtn = document.getElementById('stripe-checkout-btn');
    const countrySelect = document.getElementById('other-country');
    const subtotalElement = document.getElementById('subtotal');
    const shippingCostElement = document.getElementById('shipping-cost');
    const totalCostElement = document.getElementById('total-cost');
    const cartItems = document.getElementById('cart-items');

    let cart = [];
    let products = {};

    // Загрузка данных корзины
    function loadCartData() {
        cart = JSON.parse(localStorage.getItem('cart')) || [];
        products = JSON.parse(localStorage.getItem('products')) || {};
        console.log('Loaded cart:', cart);
        console.log('Loaded products:', products);
    }

    // Отображение товаров корзины
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
                        ${item.quantity > 1 ? `<button class="quantity-btn minus" data-index="${index}">-</button>` : '<button class="quantity-btn remove-item" data-index="${index}"><i class="fas fa-trash"></i></button>'}
                        <input type="number" class="quantity-input" value="${item.quantity}" min="1" data-index="${index}" readonly>
                        <button class="quantity-btn plus" data-index="${index}">+</button>
                    </div>
                `;
                cartItems.appendChild(itemElement);
                subtotal += product.price * item.quantity;
            }
        });

        subtotalElement.textContent = `€${subtotal.toFixed(2)}`;
        updateTotalCost();
        console.log('Cart items displayed, subtotal:', subtotal);
    }

    // Обновление общей стоимости
    function updateTotalCost() {
        const subtotal = parseFloat(subtotalElement.textContent.slice(1));
        const shippingCost = parseFloat(shippingCostElement.textContent.slice(1));
        const total = subtotal + shippingCost;
        totalCostElement.textContent = `€${total.toFixed(2)}`;
        console.log('Total cost updated:', total);
    }

    // Скрытие всех полей доставки
    function hideAllShippingFields() {
        pickupFields.style.display = 'none';
        localFields.style.display = 'none';
        otherFields.style.display = 'none';
    }

    // Обработка выбора метода доставки
    shippingOptions.forEach(option => {
        option.addEventListener('click', function() {
            console.log('Shipping option clicked:', this.dataset.value);

            // Сброс выделения для всех опций доставки
            shippingOptions.forEach(opt => {
                opt.classList.remove('selected');
                opt.style.borderColor = '';
            });

            // Выделение выбранной опции доставки
            this.classList.add('selected');
            this.style.borderColor = '#4CAF50';

            hideAllShippingFields();

            const shippingMethod = this.dataset.value;
            if (shippingMethod === 'pickup') {
                shippingCostElement.textContent = '€0.00';
                pickupFields.style.display = 'block';
            } else if (shippingMethod === 'local') {
                shippingCostElement.textContent = '€5.00';
                localFields.style.display = 'block';
            } else if (shippingMethod === 'other') {
                shippingCostElement.textContent = '€10.00';
                otherFields.style.display = 'block';
            }
            updateTotalCost();
        });
    });

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

    // Инициализация страницы
    loadCountries();
    hideAllShippingFields();
    loadCartData();
    displayCartItems();

    // Обработка нажатия на кнопку Stripe Checkout
    stripeCheckoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Stripe checkout button clicked');

        const selectedShippingOption = document.querySelector('.shipping-option.selected');
        if (!selectedShippingOption) {
            shippingOptions.forEach(option => option.style.borderColor = 'red');
            alert('Please select a shipping method');
            return;
        }

        const shippingMethod = selectedShippingOption.dataset.value;
        const form = document.getElementById('checkout-form');

        let requiredFields;
        if (shippingMethod === 'pickup') {
            requiredFields = form.querySelectorAll('#pickup-fields input[required], #pickup-fields textarea[required]');
        } else if (shippingMethod === 'local') {
            requiredFields = form.querySelectorAll('#local-fields input[required], #local-fields textarea[required]');
        } else if (shippingMethod === 'other') {
            requiredFields = form.querySelectorAll('#other-fields input[required], #other-fields select[required]');
        } else {
            requiredFields = form.querySelectorAll('input[required], textarea[required], select[required]');
        }

        let isValid = true;
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('error');
                isValid = false;
                console.log('Invalid field:', field.id);
            } else {
                field.classList.remove('error');
            }
        });

        if (!isValid) {
            console.log('Form validation failed');
            alert('Please fill in the required fields');
            return;
        }

        handleStripeCheckout(shippingMethod, form);
    });

    // Функция для обработки Stripe Checkout
    async function handleStripeCheckout(shippingMethod, form) {
        showLoader();

        const formData = new FormData(form);
        const customerData = {
            email: formData.get('email'),
            name: formData.get('name') || '',
            phone: formData.get('phone') || '',
            address: formData.get('address') || '',
            country: formData.get('country') || '',
            city: formData.get('city') || ''
        };

        console.log('Customer Data:', customerData);

        if (!customerData.email || !validateEmail(customerData.email)) {
            alert('Please provide a valid email address.');
            hideLoader();
            return;
        }

        let shippingCost = 0;
        if (shippingMethod === 'local') {
            shippingCost = 5;
        } else if (shippingMethod === 'other') {
            shippingCost = 10;
        }

        try {
            const response = await fetch('https://bejewelled-hamster-2b071a.netlify.app/.netlify/functions/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    cart: cart,
                    customerData: customerData,
                    shippingMethod: shippingMethod,
                    shippingCost: shippingCost
                })
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

    // Вспомогательная функция для проверки валидности email
    function validateEmail(email) {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\.,;:\s@"]+\.)+[^<>()[\]\.,;:\s@"]{2,})$/i;
        return re.test(String(email).toLowerCase());
    }

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
});
