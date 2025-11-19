// Kapricho.Foods - Boutique Gourmet Website JavaScript
// Cart functionality, video modal, contact form, and navigation

// Cart functionality
class Cart {
    constructor() {
        this.items = {};
        this.totalItems = 0;
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.updateUI();
        this.bindEvents();
    }

    loadFromStorage() {
        const saved = localStorage.getItem('kapricho-cart');
        if (saved) {
            this.items = JSON.parse(saved);
            this.calculateTotalItems();
        }
    }

    saveToStorage() {
        localStorage.setItem('kapricho-cart', JSON.stringify(this.items));
    }

    addItem(productName, quantity = 1) {
        if (this.items[productName]) {
            this.items[productName] += quantity;
        } else {
            this.items[productName] = quantity;
        }
        this.calculateTotalItems();
        this.saveToStorage();
        this.updateUI();
    }

    removeItem(productName, quantity = 1) {
        if (this.items[productName]) {
            this.items[productName] -= quantity;
            if (this.items[productName] <= 0) {
                delete this.items[productName];
            }
        }
        this.calculateTotalItems();
        this.saveToStorage();
        this.updateUI();
    }

    calculateTotalItems() {
        this.totalItems = Object.values(this.items).reduce((sum, qty) => sum + qty, 0);
    }

    updateUI() {
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            cartCount.textContent = this.totalItems;
        }
    }

    getWhatsAppMessage() {
        if (this.totalItems === 0) {
            return "Hola Kapricho! Me gustaría hacer un pedido.";
        }

        let message = "Hola Kapricho! Me gustaría ordenar:\n\n";
        for (const [product, quantity] of Object.entries(this.items)) {
            message += `• ${product}: ${quantity}\n`;
        }
        message += `\nTotal productos: ${this.totalItems}`;
        return message;
    }

    sendToWhatsApp() {
        const message = encodeURIComponent(this.getWhatsAppMessage());
        const whatsappUrl = `https://api.whatsapp.com/send/?phone=573247774420&text=${message}&type=phone_number&app_absent=0`;
        window.open(whatsappUrl, '_blank');
    }

    clear() {
        this.items = {};
        this.totalItems = 0;
        this.saveToStorage();
        this.updateUI();
    }

    bindEvents() {
        // Bind cart widget click
        const cartWidget = document.querySelector('.cart-widget');
        if (cartWidget) {
            cartWidget.addEventListener('click', () => this.showCartModal());
        }

        // Chef widget functionality removed - now using Chatbase chatbot
    }

    showCartModal() {
        if (this.totalItems === 0) {
            alert('Tu carrito está vacío. ¡Agrega algunos productos primero!');
            return;
        }

        // Create modal HTML
        const modalHTML = `
            <div id="cart-modal" class="modal">
                <div class="modal-content cart-modal-content">
                    <span class="close-modal" id="close-cart-modal">&times;</span>
                    <h2>Revisar Pedido</h2>
                    <div class="cart-items">
                        ${this.getCartItemsHTML()}
                    </div>
                    <div class="cart-total">
                        <strong>Total de productos: ${this.totalItems}</strong>
                    </div>
                    <div class="cart-actions">
                        <button class="cart-btn cancel-btn" id="cancel-order">Modificar Pedido</button>
                        <button class="cart-btn whatsapp-btn" id="send-whatsapp">Enviar Pedido por WhatsApp</button>
                    </div>
                    <p class="cart-notice">Al enviar, se abrirá WhatsApp con tu pedido para Kapricho.Foods</p>
                </div>
            </div>
        `;

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Bind modal events
        const modal = document.getElementById('cart-modal');
        const closeBtn = document.getElementById('close-cart-modal');
        const cancelBtn = document.getElementById('cancel-order');
        const whatsappBtn = document.getElementById('send-whatsapp');

        closeBtn.addEventListener('click', () => this.closeCartModal());
        cancelBtn.addEventListener('click', () => this.closeCartModal());
        whatsappBtn.addEventListener('click', () => {
            this.closeCartModal();
            // Sync quantities before sending to WhatsApp
            setTimeout(() => {
                if (window.quantitySelector) {
                    window.quantitySelector.syncQuantitiesFromCart();
                }
                this.sendToWhatsApp();
            }, 200);
        });

        // Bind cart quantity controls
        this.bindCartQuantityControls();

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeCartModal();
            }
        });

        // Show modal
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    getCartItemsHTML() {
        let html = '';
        for (const [product, quantity] of Object.entries(this.items)) {
            html += `
                <div class="cart-item">
                    <span class="cart-item-name">${product}</span>
                    <div class="cart-item-controls">
                        <button class="cart-qty-btn" data-action="decrease" data-product="${product}">-</button>
                        <span class="cart-item-quantity">${quantity}</span>
                        <button class="cart-qty-btn" data-action="increase" data-product="${product}">+</button>
                    </div>
                </div>
            `;
        }
        return html;
    }

    bindCartQuantityControls() {
        const decreaseBtns = document.querySelectorAll('.cart-qty-btn[data-action="decrease"]');
        const increaseBtns = document.querySelectorAll('.cart-qty-btn[data-action="increase"]');

        decreaseBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const product = e.target.getAttribute('data-product');
                this.removeItem(product, 1);
                this.refreshCartModal();
                // Sync with product page quantities immediately
                if (window.quantitySelector) {
                    window.quantitySelector.syncQuantitiesFromCart();
                }
            });
        });

        increaseBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const product = e.target.getAttribute('data-product');
                this.addItem(product, 1);
                this.refreshCartModal();
                // Sync with product page quantities immediately
                if (window.quantitySelector) {
                    window.quantitySelector.syncQuantitiesFromCart();
                }
            });
        });
    }

    refreshCartModal() {
        const cartItems = document.querySelector('.cart-items');
        const cartTotal = document.querySelector('.cart-total strong');

        if (cartItems && cartTotal) {
            cartItems.innerHTML = this.getCartItemsHTML();
            cartTotal.textContent = `Total de productos: ${this.totalItems}`;
            this.bindCartQuantityControls();
            // Update cart widget counter
            this.updateUI();
        }
    }

    closeCartModal() {
        const modal = document.getElementById('cart-modal');
        if (modal) {
            modal.remove();
            document.body.style.overflow = 'auto';
            // Re-sync quantities after modal closes
            setTimeout(() => {
                if (window.quantitySelector) {
                    window.quantitySelector.syncQuantitiesFromCart();
                }
            }, 100);
        }
    }

    // Chef chat functionality removed - now using Chatbase chatbot
}

// Video Modal functionality
class VideoModal {
    constructor() {
        this.modal = document.getElementById('video-modal');
        this.video = document.getElementById('history-video');
        this.closeBtn = document.querySelector('.close-modal');
        this.trigger = document.querySelector('.video-trigger');
        this.init();
    }

    init() {
        if (this.trigger) {
            this.trigger.addEventListener('click', () => this.open());
        }

        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.close());
        }

        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.close();
                }
            });
        }

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'block') {
                this.close();
            }
        });
    }

    open() {
        if (this.modal) {
            this.modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            if (this.video) {
                this.video.play();
            }
        }
    }

    close() {
        if (this.modal) {
            this.modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            if (this.video) {
                this.video.pause();
                this.video.currentTime = 0;
            }
        }
    }
}

// Contact Form functionality
class ContactForm {
    constructor() {
        this.form = document.getElementById('contact-form');
        this.messageDiv = document.getElementById('form-message');
        this.submitBtn = this.form ? this.form.querySelector('.submit-btn') : null;
        this.init();
    }

    init() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));

            // Hide submit button initially
            if (this.submitBtn) {
                this.submitBtn.style.display = 'none';
            }

            // Add validation listeners to email fields
            const emailInput = this.form.querySelector('#email');
            const confirmEmailInput = this.form.querySelector('#confirm_email');

            [emailInput, confirmEmailInput].forEach(input => {
                if (input) {
                    input.addEventListener('input', () => this.validateForm());
                }
            });
        }
    }

    validateForm() {
        const email = this.form.querySelector('#email').value.trim();
        const confirmEmail = this.form.querySelector('#confirm_email').value.trim();

        const isValid = email && confirmEmail && email === confirmEmail;

        if (this.submitBtn) {
            this.submitBtn.style.display = isValid ? 'inline-block' : 'none';
        }
    }

    async handleSubmit(e) {
        e.preventDefault(); // Prevent default form submission

        const submitBtn = this.form.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;

        // Show loading state
        submitBtn.textContent = 'Enviando...';
        submitBtn.disabled = true;

        try {
            // Get form data
            const formData = new FormData(this.form);

            // Construct JSON data
            const jsonData = {
                nombre: formData.get('nombre'),
                whatsapp: formData.get('whatsapp') || '',
                email: formData.get('email'),
                mensaje: formData.get('mensaje'),
                permiso_email: formData.has('permiso_email'),
                permiso_whatsapp: formData.has('permiso_whatsapp')
            };

            // Send data to N8N webhook
            const response = await fetch('https://aibanez.app.n8n.cloud/webhook/40510bd6-04c5-4d23-9088-e2623a355ec5', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(jsonData)
            });

            if (!response.ok) {
                throw new Error('Failed to send data to webhook');
            }

            // Success - show message on same page
            this.showMessage('¡Gracias por tu mensaje! Te contactaremos pronto.', 'success');
            this.form.reset();

        } catch (error) {
            // Error - show error message
            this.showMessage('Hubo un error al enviar el formulario. Por favor intenta nuevamente.', 'error');
        } finally {
            // Reset button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    showMessage(message, type) {
        if (this.messageDiv) {
            this.messageDiv.textContent = message;
            this.messageDiv.className = `form-message ${type}`;
            this.messageDiv.style.display = 'block';

            // Hide message after 5 seconds
            setTimeout(() => {
                this.messageDiv.style.display = 'none';
            }, 5000);
        }
    }
}

// Navigation functionality
class Navigation {
    constructor() {
        this.toggle = document.querySelector('.nav-toggle');
        this.menu = document.querySelector('.nav-menu');
        this.links = document.querySelectorAll('.nav-link');
        this.init();
    }

    init() {
        // Mobile menu toggle
        if (this.toggle) {
            this.toggle.addEventListener('click', () => this.toggleMenu());
        }

        // Close mobile menu when clicking a link
        this.links.forEach(link => {
            link.addEventListener('click', () => this.closeMenu());
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.toggle.contains(e.target) && !this.menu.contains(e.target)) {
                this.closeMenu();
            }
        });

        // Update active link on scroll
        this.updateActiveLink();
        window.addEventListener('scroll', () => this.updateActiveLink());
    }

    toggleMenu() {
        if (this.menu) {
            this.menu.classList.toggle('active');
        }
        if (this.toggle) {
            this.toggle.classList.toggle('active');
        }
    }

    closeMenu() {
        if (this.menu) {
            this.menu.classList.remove('active');
        }
        if (this.toggle) {
            this.toggle.classList.remove('active');
        }
    }

    updateActiveLink() {
        const sections = document.querySelectorAll('section');
        const scrollPosition = window.scrollY + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                this.links.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}` || link.getAttribute('href') === `${sectionId}.html`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }
}

// Quantity selector functionality
class QuantitySelector {
    constructor() {
        this.selectors = document.querySelectorAll('.quantity-selector');
        this.init();
    }

    init() {
        this.selectors.forEach(selector => {
            const decreaseBtn = selector.querySelector('[data-action="decrease"]');
            const increaseBtn = selector.querySelector('[data-action="increase"]');
            const input = selector.querySelector('.qty-input');
            const addToCartBtn = selector.closest('.product-info').querySelector('.add-to-cart-btn');
            const productName = addToCartBtn.getAttribute('data-product');

            if (decreaseBtn && increaseBtn && input) {
                decreaseBtn.addEventListener('click', () => this.decrease(input, productName));
                increaseBtn.addEventListener('click', () => this.increase(input, productName));
                input.addEventListener('change', () => this.validateInput(input, productName));
                input.addEventListener('input', () => this.updateFromInput(input, productName));
            }

            if (addToCartBtn) {
                addToCartBtn.addEventListener('click', () => {
                    const quantity = parseInt(input.value);
                    if (quantity > 0) {
                        window.cart.addItem(productName, quantity);
                        // Keep the quantity in the input field - don't reset to 0
                        // This maintains synchronization
                        // Show feedback
                        this.showFeedback(addToCartBtn, '¡Agregado al pedido!');
                    }
                });
            }
        });

        // Sync quantities on page load
        this.syncQuantitiesFromCart();
    }

    decrease(input, productName) {
        let value = parseInt(input.value);
        if (value > 0) {
            value--;
            input.value = value;
            this.updateCart(productName, value);
        }
    }

    increase(input, productName) {
        let value = parseInt(input.value);
        value++;
        input.value = value;
        this.updateCart(productName, value);
    }

    validateInput(input, productName) {
        let value = parseInt(input.value);
        if (isNaN(value) || value < 0) {
            value = 0;
        }
        input.value = value;
        this.updateCart(productName, value);
    }

    updateFromInput(input, productName) {
        const value = parseInt(input.value) || 0;
        this.updateCart(productName, value);
    }

    updateCart(productName, quantity) {
        // Update cart with new quantity
        if (quantity > 0) {
            window.cart.items[productName] = quantity;
        } else {
            delete window.cart.items[productName];
        }
        window.cart.calculateTotalItems();
        window.cart.saveToStorage();
        window.cart.updateUI();
    }

    syncQuantitiesFromCart() {
        // Sync all quantity inputs with cart data
        this.selectors.forEach(selector => {
            const input = selector.querySelector('.qty-input');
            const addToCartBtn = selector.closest('.product-info').querySelector('.add-to-cart-btn');
            const productName = addToCartBtn.getAttribute('data-product');

            if (input && productName && window.cart.items[productName]) {
                input.value = window.cart.items[productName];
            }
        });
    }

    decrease(input) {
        let value = parseInt(input.value);
        if (value > 0) {
            value--;
            input.value = value;
        }
    }

    increase(input) {
        let value = parseInt(input.value);
        value++;
        input.value = value;
    }

    validateInput(input) {
        let value = parseInt(input.value);
        if (isNaN(value) || value < 0) {
            value = 0;
        }
        input.value = value;
    }

    showFeedback(button, message) {
        const originalText = button.textContent;
        button.textContent = message;
        button.style.backgroundColor = '#40E0D0';

        setTimeout(() => {
            button.textContent = originalText;
            button.style.backgroundColor = '';
        }, 1500);
    }
}

// Initialize all functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize cart
    window.cart = new Cart();

    // Initialize video modal
    new VideoModal();

    // Initialize contact form
    new ContactForm();

    // Initialize navigation
    new Navigation();

    // Initialize quantity selectors
    window.quantitySelector = new QuantitySelector();

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Enhanced image loading with smooth animations
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach(img => {
        // Check if image is already loaded
        if (img.complete && img.naturalHeight !== 0) {
            img.classList.add('loaded');
        } else {
            img.addEventListener('load', function() {
                this.classList.add('loaded');
            });
        }

        // Add error handling for failed images
        img.addEventListener('error', function() {
            this.style.display = 'none';
        });
    });

    // Add click ripple effect to buttons
    const buttons = document.querySelectorAll('button, .cta-button, .add-to-cart-btn, .submit-btn, .chef-chat-btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Create ripple element
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s ease-out;
                pointer-events: none;
            `;

            // Remove existing ripples
            const existingRipple = this.querySelector('.ripple-effect');
            if (existingRipple) {
                existingRipple.remove();
            }

            ripple.classList.add('ripple-effect');
            this.style.position = 'relative';
            this.appendChild(ripple);

            // Remove ripple after animation
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    // Intersection Observer for lazy loading optimization
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                }
            });
        });

        // Apply to recipe images
        document.querySelectorAll('.recipe-item img').forEach(img => {
            imageObserver.observe(img);
        });
    }

    // Add intersection observer for animations (optimized)
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '50px 0px -50px 0px' // Start loading earlier
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                // Stop observing after animation is triggered
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements for animation with debouncing
    const animateElements = document.querySelectorAll('.highlight-card, .product-card, .recipe-item');
    let animationTimeout;

    const observeElements = () => {
        clearTimeout(animationTimeout);
        animationTimeout = setTimeout(() => {
            animateElements.forEach(el => {
                if (!el.classList.contains('animate-in')) {
                    observer.observe(el);
                }
            });
        }, 100);
    };

    observeElements();
});

// Add enhanced CSS for animations and effects
const style = document.createElement('style');
style.textContent = `
    .animate-in {
        animation: fadeInUp 0.6s ease forwards;
    }

    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .loaded {
        animation: imageFadeIn 0.5s ease;
    }

    @keyframes imageFadeIn {
        from { opacity: 0; transform: scale(1.1); }
        to { opacity: 1; transform: scale(1); }
    }

    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }

    .nav-toggle.active span:nth-child(1) {
        transform: rotate(45deg) translate(5px, 5px);
    }

    .nav-toggle.active span:nth-child(2) {
        opacity: 0;
    }

    .nav-toggle.active span:nth-child(3) {
        transform: rotate(-45deg) translate(7px, -6px);
    }

    /* Enhanced button interactions */
    button:active {
        transform: scale(0.98);
    }

    /* Smooth transitions for all interactive elements */
    .nav-link,
    .social-link,
    .highlight-card,
    .product-detail-card,
    .recipe-item {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
`;
document.head.appendChild(style);

// Carousel functionality
class ImageCarousel {
    constructor() {
        this.track = document.getElementById('carouselTrack');
        this.slides = document.querySelectorAll('.carousel-slide');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.indicators = document.getElementById('carouselIndicators');
        this.currentIndex = 0;
        this.init();
    }

    init() {
        if (!this.track || !this.slides.length) return;

        this.createIndicators();
        this.bindEvents();
        this.updateCarousel();
    }

    createIndicators() {
        if (!this.indicators) return;

        this.slides.forEach((_, index) => {
            const indicator = document.createElement('div');
            indicator.className = 'carousel-indicator';
            indicator.addEventListener('click', () => this.goToSlide(index));
            this.indicators.appendChild(indicator);
        });
    }

    bindEvents() {
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.prevSlide());
        }
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.nextSlide());
        }

        // Click on slides to navigate to appropriate page
        this.slides.forEach((slide, index) => {
            slide.addEventListener('click', () => this.handleSlideClick(slide, index));
        });

        // Auto-play
        setInterval(() => this.nextSlide(), 5000);
    }

    handleSlideClick(slide, index) {
        const slideType = slide.getAttribute('data-type');
        if (slideType === 'product') {
            window.location.href = 'productos.html';
        } else if (slideType === 'recipe') {
            window.location.href = 'recetas.html';
        }
    }

    updateCarousel() {
        const translateX = -this.currentIndex * 100;
        this.track.style.transform = `translateX(${translateX}%)`;

        // Update indicators
        const indicators = document.querySelectorAll('.carousel-indicator');
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === this.currentIndex);
        });
    }

    nextSlide() {
        this.currentIndex = (this.currentIndex + 1) % this.slides.length;
        this.updateCarousel();
    }

    prevSlide() {
        this.currentIndex = (this.currentIndex - 1 + this.slides.length) % this.slides.length;
        this.updateCarousel();
    }

    goToSlide(index) {
        this.currentIndex = index;
        this.updateCarousel();
    }
}

// Initialize carousel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ImageCarousel();
});

// Activate chatbot function
function activateChatbot() {
    // Check if Chatbase chatbot is available
    if (window.chatbase && typeof window.chatbase === 'function') {
        // Try to open the chatbot
        try {
            window.chatbase('open');
        } catch (e) {
            // Fallback: scroll to bottom where chatbot might be
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }
    } else {
        // Fallback: scroll to bottom
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
}

// Ensure Chatbase chatbot is properly initialized and visible
document.addEventListener('DOMContentLoaded', function() {
    // Wait for Chatbase to load and ensure it's visible
    setTimeout(function() {
        const chatWidget = document.querySelector('[id*="chatbase"]') ||
                          document.querySelector('.chatbase-chatbot') ||
                          document.querySelector('[class*="chatbase"]');

        if (chatWidget) {
            // Ensure proper styling
            chatWidget.style.cssText += `
                position: fixed !important;
                bottom: 20px !important;
                right: 20px !important;
                z-index: 999999 !important;
                width: 350px !important;
                height: 500px !important;
                border-radius: 15px !important;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3) !important;
                border: none !important;
            `;
        }
    }, 2000); // Wait 2 seconds for Chatbase to load
});

// Export for potential future use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Cart, VideoModal, ContactForm, Navigation, QuantitySelector, ImageCarousel };
}