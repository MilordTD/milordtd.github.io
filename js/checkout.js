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
    const paymentDetails = document.getElementById('payment-details');
    const orderSummary = document.getElementById('order-summary');

    let cart = [];
    let products = {};

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

        // Добавление обработчиков событий для кнопок изменения количества
const quantityButtons = document.querySelectorAll('.quantity-btn');
quantityButtons.forEach(button => {
    button.addEventListener('click', function() {
        const index = this.dataset.index;
        if (this.classList.contains('plus')) {
            cart[index].quantity++;
        } else if (this.classList.contains('minus')) {
            if (cart[index].quantity > 1) {
                cart[index].quantity--;
            }
        } else if (this.classList.contains('remove-item')) {
            cart.splice(index, 1);
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        displayCartItems();
    });
});
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
            stripeCheckoutBtn.querySelector('.button-text').textContent = 'Proceed to Payment';
            stripeCheckoutBtn.style.display = 'block';
            pickupFields.style.display = 'block';
            orderSummary.style.display = 'block';
            paymentDetails.querySelector('p').textContent = 'Complete your purchase by providing your payment details.';
            
            // Добавим небольшую задержку перед загрузкой карты
            setTimeout(() => {
                console.log('Attempting to load Google Maps');
                loadGoogleMaps();
            }, 100);
            } else if (shippingMethod === 'local') {
                shippingCostElement.textContent = '€5.00';
                stripeCheckoutBtn.querySelector('.button-text').textContent = 'Proceed to Payment';
                stripeCheckoutBtn.style.display = 'block';
                localFields.style.display = 'block';
                orderSummary.style.display = 'block';
                paymentDetails.querySelector('p').textContent = 'Complete your purchase by providing your payment details.';
            } else if (shippingMethod === 'other') {
                shippingCostElement.textContent = '€10.00';
                stripeCheckoutBtn.querySelector('.button-text').textContent = 'Submit';
                stripeCheckoutBtn.style.display = 'block';
                otherFields.style.display = 'block';
                orderSummary.style.display = 'none';
                paymentDetails.querySelector('p').textContent = '⚠️Delivery is currently available only within Grande Porto. If you would like delivery to another region, please fill out the fields below and we will notify you as soon as delivery becomes available in your area.⚠️';
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

        if (shippingMethod === 'other') {
            handleTelegramSubmission(form);
        } else {
            handleStripeCheckout(shippingMethod, form);
        }
    });

async function handleStripeCheckout(shippingMethod, form) {
    showLoader();

    const formData = new FormData(form);
    let customerData = {
        email: formData.get('email') || '',
    };

    let shippingCost = 0;

    if (shippingMethod === 'pickup') {
        customerData = {
            ...customerData,
            name: formData.get('name') || '',
            phone: formData.get('phone') || '',
        };
        shippingCost = 0;
    } else if (shippingMethod === 'local') {
        customerData = {
            ...customerData,
            name: formData.get('local-name') || '',
            phone: formData.get('local-phone') || '',
            address: formData.get('address') || '',
        };
        shippingCost = 5;
    } else if (shippingMethod === 'other') {
        customerData = {
            ...customerData,
            country: formData.get('country') || '',
            city: formData.get('city') || '',
        };
        shippingCost = 10;
    }

    console.log('Customer Data before sending:', customerData);
    console.log('Shipping Method:', shippingMethod);
    console.log('Shipping Cost:', shippingCost);

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

    // Функция для обработки отправки данных в Telegram
    async function handleTelegramSubmission(form) {
        showLoader();

        const formData = new FormData(form);
        const customerData = {
            email: formData.get('email'),
            country: formData.get('country'),
            city: formData.get('city')
        };

        console.log('Telegram Data:', customerData);

        if (!customerData.email || !validateEmail(customerData.email)) {
            alert('Please provide a valid email address.');
            hideLoader();
            return;
        }

        try {
            const response = await fetch('https://bejewelled-hamster-2b071a.netlify.app/.netlify/functions/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    isWaitlist: true,
                    customerData: customerData
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

            // Перенаправление на /shop и вызов модального окна
            window.location.href = '/shop?waitlistStatus=success';
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

    function initMap() {
    console.log('initMap called');
    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) {
        console.error('Map container not found');
        return;
    }

    // Координаты для магазина "Varenka"
    const varenkoLocation = { lat: 41.1510219, lng: -8.6120077 };

    const mapOptions = {
        center: varenkoLocation,
        zoom: 17
    };

    const map = new google.maps.Map(mapContainer, mapOptions);

    const marker = new google.maps.Marker({
        position: varenkoLocation,
        map: map,
        title: 'Varenka'
    });

    console.log('Map initialized');
}

// Добавим эту функцию для загрузки карты
function loadGoogleMaps() {
    console.log('Loading Google Maps');
    if (window.google && window.google.maps) {
        console.log('Google Maps API already loaded');
        initMap();
        return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyA4JymRfTQM1RglXSpsnrgwwVcl6uaOMvE&callback=initMapCallback`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
}

window.initMapCallback = function() {
    console.log('Google Maps API loaded, calling initMap');
    initMap();
}

function initMap() {
    console.log('initMap called');
    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) {
        console.error('Map container not found');
        return;
    }

    // Координаты для магазина "Varenka"
    const varenkoLocation = { lat: 41.1510219, lng: -8.6120077 };

    const mapOptions = {
        center: varenkoLocation,
        zoom: 15
    };

    const map = new google.maps.Map(mapContainer, mapOptions);

    const marker = new google.maps.Marker({
        position: varenkoLocation,
        map: map,
        title: 'Varenka'
    });

    console.log('Map initialized');
}

// Вызовем функцию загрузки карты после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');
    const pickupOption = document.querySelector('.shipping-option[data-value="pickup"]');
    if (pickupOption) {
        pickupOption.addEventListener('click', loadGoogleMaps);
    }
});
});


