document.addEventListener('DOMContentLoaded', function () {
    const storageKeys = {
        cart: 'cafePortal.customer.cart',
        orders: 'cafePortal.customer.orders',
        profile: 'cafePortal.customer.profile',
        preferences: 'cafePortal.customer.preferences'
    };

    function showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.hidden = false;
        clearTimeout(showToast.timeout);
        showToast.timeout = setTimeout(function () {
            toast.hidden = true;
        }, 3500);
    }

    function readStorage(key, fallback) {
        try {
            const saved = localStorage.getItem(key);
            if (saved === null) return fallback;
            return JSON.parse(saved);
        } catch (error) {
            showToast('Saved browser data could not be read. Starting with an empty value.');
            return fallback;
        }
    }

    function writeStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            showToast('Could not save this change in browser storage.');
            return false;
        }
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, function (character) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[character];
        });
    }

    if (window.lucide) window.lucide.createIcons();

    const contentViews = document.querySelectorAll('.content-view');
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    const productsGrid = document.getElementById('productsGrid');
    const menuSearchInput = document.getElementById('menuSearchInput');
    const emptyMenuMessage = document.getElementById('emptyMenuMessage');
    const cartItemsElement = document.getElementById('filledCartItems');
    const placeOrderButton = document.getElementById('placeOrderBtn');
    const historyBody = document.getElementById('orderHistoryBody');
    const trackingOrders = document.getElementById('trackingOrders');
    const profileNameInput = document.getElementById('profileName');
    const profileEmailInput = document.getElementById('profileEmail');
    const languageSelect = document.getElementById('languageSelect');
    const backend = window.CafeBackend;

    let activeCategory = 'all';
    let cart = readStorage(storageKeys.cart, []);
    let orders = backend.configured ? [] : readStorage(storageKeys.orders, []);
    let profile = readStorage(storageKeys.profile, {
        fullName: profileNameInput.value,
        email: profileEmailInput.value
    });
    let preferences = readStorage(storageKeys.preferences, { language: 'en', darkMode: false });
    let menuItems = Array.from(productsGrid.querySelectorAll('.product-card')).map(function (card) {
        const button = card.querySelector('.btn-add-item');
        return {
            id: button.dataset.productId,
            name: button.dataset.name,
            price: Number(button.dataset.price),
            category: card.dataset.category,
            description: card.querySelector('.card-desc').textContent.trim(),
            image_url: card.querySelector('img').src
        };
    });

    cart = Array.isArray(cart) ? cart.filter(function (item) {
        return item && typeof item.id === 'string' && Number.isFinite(Number(item.price))
            && Number.isInteger(Number(item.quantity)) && Number(item.quantity) > 0;
    }).map(function (item) {
        return {
            id: item.id,
            name: String(item.name),
            price: Number(item.price),
            quantity: Math.min(Number(item.quantity), 20)
        };
    }) : [];
    orders = Array.isArray(orders) ? orders : [];

    function saveCart() {
        writeStorage(storageKeys.cart, cart);
    }

    function showView(id) {
        contentViews.forEach(function (view) {
            view.classList.toggle('active', view.id === id);
        });
        navLinks.forEach(function (link) {
            link.classList.toggle('active', link.dataset.view === id);
        });
        if (id === 'viewOrderHistory' || id === 'viewOrderTracking') refreshOrders();
    }

    navLinks.forEach(function (link) {
        link.addEventListener('click', function () {
            showView(link.dataset.view);
        });
    });

    document.querySelectorAll('.filter-pill').forEach(function (pill) {
        pill.addEventListener('click', function () {
            activeCategory = pill.dataset.category;
            document.querySelectorAll('.filter-pill').forEach(function (button) {
                button.classList.toggle('active', button === pill);
            });
            filterMenu();
        });
    });

    function filterMenu() {
        const searchTerm = menuSearchInput.value.trim().toLocaleLowerCase();
        let visibleCount = 0;
        productsGrid.querySelectorAll('.product-card').forEach(function (card) {
            const matchesCategory = activeCategory === 'all' || card.dataset.category === activeCategory;
            const matchesSearch = !searchTerm || card.textContent.toLocaleLowerCase().includes(searchTerm);
            const visible = matchesCategory && matchesSearch;
            card.hidden = !visible;
            if (visible) visibleCount += 1;
        });
        emptyMenuMessage.hidden = visibleCount > 0;
    }

    menuSearchInput.addEventListener('input', filterMenu);

    function renderMenu(items) {
        menuItems = items;
        productsGrid.innerHTML = items.map(function (item) {
            const id = escapeHtml(item.id);
            const name = escapeHtml(item.name);
            const description = escapeHtml(item.description || '');
            const category = escapeHtml(item.category);
            const imageUrl = escapeHtml(item.image_url || '');
            const price = Number(item.price);
            return `
                <div class="product-card" data-category="${category}" data-product-id="${id}">
                    <div class="card-image-wrap">
                        ${item.id === 'chicken-teriyaki-bowl' ? '<span class="most-ordered-badge"><i data-lucide="star"></i> MOST ORDERED</span>' : ''}
                        <img src="${imageUrl}" alt="${name}" loading="lazy">
                        <span class="price-tag">₱${price.toFixed(0)}</span>
                    </div>
                    <div class="card-details">
                        <div class="card-title-row">
                            <h3>${name}</h3>
                            <button class="btn-add-item" type="button" data-product-id="${id}" data-name="${name}" data-price="${price}" aria-label="Add ${name} to cart">+</button>
                        </div>
                        <p class="card-desc">${description}</p>
                        <a href="#" class="view-details-link">View item details</a>
                    </div>
                </div>`;
        }).join('');
        if (window.lucide) window.lucide.createIcons();
        filterMenu();
    }

    productsGrid.addEventListener('click', function (event) {
        const addButton = event.target.closest('.btn-add-item');
        if (addButton) {
            const item = menuItems.find(function (menuItem) {
                return menuItem.id === addButton.dataset.productId;
            });
            if (item) addToCart(item);
            return;
        }

        const detailsLink = event.target.closest('.view-details-link');
        if (detailsLink) {
            event.preventDefault();
            const card = detailsLink.closest('.product-card');
            const item = menuItems.find(function (menuItem) {
                return menuItem.id === card.dataset.productId;
            });
            if (item) showProductDetails(item);
        }
    });

    const productDetailsDialog = document.getElementById('productDetailsDialog');
    let detailItem = null;
    function showProductDetails(item) {
        detailItem = item;
        document.getElementById('detailsImage').src = item.image_url || '';
        document.getElementById('detailsImage').alt = item.name;
        document.getElementById('detailsCategory').textContent = item.category;
        document.getElementById('detailsName').textContent = item.name;
        document.getElementById('detailsDescription').textContent = item.description || '';
        document.getElementById('detailsPrice').textContent = `₱${Number(item.price).toFixed(2)}`;
        productDetailsDialog.showModal();
    }

    document.getElementById('detailsAddButton').addEventListener('click', function () {
        if (detailItem) addToCart(detailItem);
        productDetailsDialog.close();
    });

    function addToCart(item) {
        const existing = cart.find(function (cartItem) {
            return cartItem.id === item.id;
        });
        if (existing) {
            if (existing.quantity >= 20) {
                showToast('You can add up to 20 of each item.');
                return;
            }
            existing.quantity += 1;
        } else {
            cart.push({
                id: item.id,
                name: item.name,
                price: Number(item.price),
                quantity: 1
            });
        }
        saveCart();
        renderCart();
        showToast(`${item.name} added to your cart.`);
    }

    function renderCart() {
        const itemCount = cart.reduce(function (total, item) {
            return total + item.quantity;
        }, 0);
        const subtotal = cart.reduce(function (total, item) {
            return total + item.price * item.quantity;
        }, 0);

        document.getElementById('navCartCount').textContent = itemCount;
        document.getElementById('checkoutItemCount').textContent = itemCount;
        document.getElementById('checkoutSubtotal').textContent = `₱${subtotal.toFixed(2)}`;
        document.getElementById('checkoutTotal').textContent = `₱${subtotal.toFixed(2)}`;
        placeOrderButton.disabled = itemCount === 0;
        document.getElementById('emptyCartBox').hidden = itemCount > 0;
        cartItemsElement.hidden = itemCount === 0;

        cartItemsElement.innerHTML = cart.map(function (item) {
            return `
                <div class="cart-item-row">
                    <div class="cart-item-description">
                        <strong>${escapeHtml(item.name)}</strong>
                        <span>₱${item.price.toFixed(2)} each</span>
                    </div>
                    <div class="cart-item-actions">
                        <button type="button" data-cart-action="decrease" data-product-id="${escapeHtml(item.id)}" aria-label="Decrease ${escapeHtml(item.name)} quantity">−</button>
                        <span>${item.quantity}</span>
                        <button type="button" data-cart-action="increase" data-product-id="${escapeHtml(item.id)}" aria-label="Increase ${escapeHtml(item.name)} quantity">+</button>
                        <button type="button" class="cart-remove-button" data-cart-action="remove" data-product-id="${escapeHtml(item.id)}">Remove</button>
                    </div>
                </div>`;
        }).join('');
    }

    cartItemsElement.addEventListener('click', function (event) {
        const button = event.target.closest('[data-cart-action]');
        if (!button) return;
        const item = cart.find(function (cartItem) {
            return cartItem.id === button.dataset.productId;
        });
        if (!item) return;
        if (button.dataset.cartAction === 'remove' || (button.dataset.cartAction === 'decrease' && item.quantity === 1)) {
            cart = cart.filter(function (cartItem) {
                return cartItem.id !== item.id;
            });
        } else if (button.dataset.cartAction === 'decrease') {
            item.quantity -= 1;
        } else if (button.dataset.cartAction === 'increase') {
            if (item.quantity >= 20) {
                showToast('You can add up to 20 of each item.');
                return;
            }
            item.quantity += 1;
        }
        saveCart();
        renderCart();
    });

    document.getElementById('openCartBtn').addEventListener('click', function () {
        showView('viewCheckout');
    });
    document.getElementById('backToMenuBtn').addEventListener('click', function () {
        showView('viewHome');
    });
    document.getElementById('btnReturnMenu').addEventListener('click', function () {
        showView('viewHome');
    });

    document.querySelectorAll('.payment-option').forEach(function (option) {
        option.addEventListener('click', function () {
            document.querySelectorAll('.payment-option').forEach(function (other) {
                other.classList.toggle('active', other === option);
                other.querySelector('input').checked = other === option;
            });
        });
    });

    function formatPayment(method) {
        return {
            cash: 'Cash',
            gcash: 'GCash',
            maya: 'Maya',
            bank: 'Bank transfer'
        }[method] || method;
    }

    function formatStatus(status) {
        return String(status || 'pending').replace(/_/g, ' ');
    }

    function normalizeOrder(order) {
        return {
            id: order.id,
            orderNumber: order.order_number || order.orderNumber,
            status: order.status || 'pending',
            paymentMethod: order.payment_method || order.paymentMethod || 'cash',
            total: Number(order.total) || 0,
            createdAt: order.created_at || order.createdAt || new Date().toISOString(),
            items: (order.order_items || order.items || []).map(function (item) {
                return {
                    name: item.item_name || item.name,
                    price: Number(item.unit_price || item.price) || 0,
                    quantity: Number(item.quantity) || 1
                };
            })
        };
    }

    function renderOrders() {
        const normalizedOrders = orders.map(normalizeOrder);
        document.getElementById('orderCount').textContent = `${normalizedOrders.length} ORDER${normalizedOrders.length === 1 ? '' : 'S'}`;
        document.getElementById('emptyHistoryMessage').hidden = normalizedOrders.length > 0;
        historyBody.innerHTML = normalizedOrders.map(function (order) {
            const summary = order.items.map(function (item) {
                return `${item.quantity}× ${escapeHtml(item.name)}`;
            }).join(', ');
            const date = new Date(order.createdAt);
            return `
                <tr>
                    <td class="order-id">${escapeHtml(order.orderNumber)}</td>
                    <td class="order-summary">${summary || 'Order items'}</td>
                    <td>${escapeHtml(date.toLocaleString())}</td>
                    <td><span class="status-badge status-${escapeHtml(order.status)}">${escapeHtml(formatStatus(order.status).toUpperCase())}</span></td>
                    <td class="payment-info">${escapeHtml(formatPayment(order.paymentMethod))} • ₱${order.total.toFixed(2)}</td>
                    <td class="action-col"><button type="button" class="btn-chevron" data-order-number="${escapeHtml(order.orderNumber)}" aria-label="Track ${escapeHtml(order.orderNumber)}"><i data-lucide="chevron-right"></i></button></td>
                </tr>`;
        }).join('');

        const activeOrders = normalizedOrders.filter(function (order) {
            return !['completed', 'cancelled'].includes(order.status);
        });
        document.getElementById('emptyTrackingMessage').hidden = activeOrders.length > 0;
        trackingOrders.innerHTML = activeOrders.map(function (order) {
            const summary = order.items.map(function (item) {
                return `${item.quantity}× ${escapeHtml(item.name)}`;
            }).join(', ');
            return `
                <article class="tracking-order-card">
                    <div class="tracking-order-heading">
                        <div><span class="section-tag">ORDER</span><h3>${escapeHtml(order.orderNumber)}</h3></div>
                        <span class="status-badge status-${escapeHtml(order.status)}">${escapeHtml(formatStatus(order.status).toUpperCase())}</span>
                    </div>
                    <p>${summary || 'Order items'}</p>
                    <div class="tracking-order-footer">
                        <span>${escapeHtml(new Date(order.createdAt).toLocaleString())}</span>
                        <strong>₱${order.total.toFixed(2)}</strong>
                    </div>
                </article>`;
        }).join('');
        if (window.lucide) window.lucide.createIcons();
    }

    historyBody.addEventListener('click', function (event) {
        const button = event.target.closest('[data-order-number]');
        if (!button) return;
        showView('viewOrderTracking');
    });

    async function refreshOrders() {
        if (!backend.configured) {
            renderOrders();
            return;
        }
        try {
            const result = await backend.getOrders();
            orders = result || [];
            renderOrders();
        } catch (error) {
            showToast(`Could not load orders: ${error.message}`);
            renderOrders();
        }
    }

    placeOrderButton.addEventListener('click', async function () {
        if (cart.length === 0) return;
        const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
        placeOrderButton.disabled = true;
        placeOrderButton.textContent = 'Placing order…';
        try {
            const savedOrder = await backend.placeOrder(paymentMethod, cart);
            if (savedOrder) {
                orders.unshift(Object.assign({}, savedOrder, {
                    order_items: cart.map(function (item) {
                        return {
                            item_name: item.name,
                            unit_price: item.price,
                            quantity: item.quantity
                        };
                    })
                }));
                renderOrders();
            } else {
                const now = new Date().toISOString();
                const localOrder = {
                    order_number: `CP-${String(Date.now()).slice(-6)}`,
                    status: 'pending',
                    payment_method: paymentMethod,
                    total: cart.reduce(function (sum, item) {
                        return sum + item.price * item.quantity;
                    }, 0),
                    created_at: now,
                    order_items: cart.map(function (item) {
                        return {
                            item_name: item.name,
                            unit_price: item.price,
                            quantity: item.quantity
                        };
                    })
                };
                orders.unshift(localOrder);
                writeStorage(storageKeys.orders, orders);
                renderOrders();
            }
            cart = [];
            saveCart();
            renderCart();
            showView('viewOrderTracking');
            showToast('Your order has been placed.');
        } catch (error) {
            showToast(`Could not place order: ${error.message}`);
        } finally {
            placeOrderButton.innerHTML = 'Place order <i data-lucide="chevron-right"></i>';
            renderCart();
            if (window.lucide) window.lucide.createIcons();
        }
    });

    function applyProfile() {
        profileNameInput.value = profile.fullName || 'Alex Rivera';
        profileEmailInput.value = profile.email || '';
        document.querySelectorAll('.js-user-name').forEach(function (element) {
            element.textContent = profile.fullName || 'Alex Rivera';
        });
        document.getElementById('greetingTag').textContent = `GOOD MORNING, ${(profile.fullName || 'Alex Rivera').split(/\s+/)[0].toUpperCase()}`;
        const initials = (profile.fullName || 'Alex Rivera').trim().split(/\s+/).slice(0, 2)
            .map(function (part) { return part.charAt(0); }).join('').toUpperCase();
        const avatar = document.getElementById('profileAvatar');
        if (profile.photo) {
            avatar.innerHTML = `<img src="${escapeHtml(profile.photo)}" alt="Profile photo">`;
        } else {
            avatar.textContent = initials;
        }
    }

    document.querySelectorAll('.settings-tab-btn').forEach(function (button) {
        button.addEventListener('click', function () {
            document.querySelectorAll('.settings-tab-btn').forEach(function (tab) {
                tab.classList.toggle('active', tab === button);
            });
            document.querySelectorAll('.settings-pane').forEach(function (pane) {
                pane.classList.toggle('active', pane.id === button.dataset.settingsTab);
            });
        });
    });

    function savePreferences() {
        preferences.language = languageSelect.value;
        preferences.darkMode = document.body.classList.contains('dark-mode');
        writeStorage(storageKeys.preferences, preferences);
        profile.language = preferences.language;
        profile.darkMode = preferences.darkMode;
        writeStorage(storageKeys.profile, profile);
        if (backend.configured) {
            backend.saveProfile({
                fullName: profile.fullName || profileNameInput.value,
                email: profile.email || profileEmailInput.value,
                language: preferences.language,
                darkMode: preferences.darkMode
            }).catch(function (error) {
                showToast(`Could not save preferences to Supabase: ${error.message}`);
            });
        }
    }

    document.getElementById('btnLightMode').addEventListener('click', function () {
        document.body.classList.remove('dark-mode');
        document.getElementById('btnLightMode').classList.add('active');
        document.getElementById('btnDarkMode').classList.remove('active');
        savePreferences();
    });
    document.getElementById('btnDarkMode').addEventListener('click', function () {
        document.body.classList.add('dark-mode');
        document.getElementById('btnDarkMode').classList.add('active');
        document.getElementById('btnLightMode').classList.remove('active');
        savePreferences();
    });
    languageSelect.addEventListener('change', savePreferences);

    document.getElementById('profileForm').addEventListener('submit', async function (event) {
        event.preventDefault();
        profile.fullName = profileNameInput.value.trim();
        profile.email = profileEmailInput.value.trim();
        profile.language = languageSelect.value;
        profile.darkMode = document.body.classList.contains('dark-mode');
        writeStorage(storageKeys.profile, profile);
        applyProfile();
        if (backend.configured) {
            try {
                await backend.saveProfile(profile);
            } catch (error) {
                showToast(`Profile saved in this browser, but Supabase returned an error: ${error.message}`);
                return;
            }
        }
        showToast('Profile saved.');
    });

    const photoInput = document.getElementById('profilePhotoInput');
    document.getElementById('changePhotoBtn').addEventListener('click', function () {
        photoInput.click();
    });
    photoInput.addEventListener('change', function () {
        const file = photoInput.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) {
            showToast('Choose an image smaller than 2 MB.');
            photoInput.value = '';
            return;
        }
        const reader = new FileReader();
        reader.addEventListener('load', function () {
            profile.photo = reader.result;
            if (writeStorage(storageKeys.profile, profile)) {
                applyProfile();
                showToast('Profile photo updated in this browser.');
            }
        });
        reader.addEventListener('error', function () {
            showToast('Could not read that image.');
        });
        reader.readAsDataURL(file);
    });

    async function logOut() {
        if (!window.confirm('Sign out of this customer session?')) return;
        try {
            await backend.signOut();
            window.location.href = 'LoginPage.html';
        } catch (error) {
            showToast(`Could not sign out: ${error.message}`);
        }
    }
    document.getElementById('headerLogoutBtn').addEventListener('click', logOut);
    document.getElementById('settingsLogoutBtn').addEventListener('click', logOut);

    async function initializeBackend() {
        function applyPreferenceButtons() {
            document.getElementById('btnDarkMode').classList.toggle('active', preferences.darkMode);
            document.getElementById('btnLightMode').classList.toggle('active', !preferences.darkMode);
        }

        languageSelect.value = preferences.language === 'fil' ? 'fil' : 'en';
        document.body.classList.toggle('dark-mode', Boolean(preferences.darkMode));
        applyPreferenceButtons();
        applyProfile();
        renderCart();
        renderOrders();

        if (!backend.configured) {
            showToast(backend.configurationIncomplete
                ? 'Add both the Supabase URL and publishable key in supabase-config.js.'
                : 'Demo mode: add your Supabase URL and publishable key in supabase-config.js to enable the backend.');
            return;
        }

        const results = await Promise.allSettled([
            backend.getMenu(),
            backend.getProfile(),
            backend.getOrders()
        ]);
        if (results[0].status === 'fulfilled' && results[0].value) {
            renderMenu(results[0].value);
        } else if (results[0].status === 'rejected') {
            showToast(`Could not load the Supabase menu: ${results[0].reason.message}`);
        }
        if (results[1].status === 'fulfilled' && results[1].value) {
            profile = Object.assign({}, profile, {
                fullName: results[1].value.full_name,
                email: results[1].value.email || ''
            });
            preferences = Object.assign({}, preferences, {
                language: results[1].value.language || preferences.language,
                darkMode: Boolean(results[1].value.dark_mode)
            });
            languageSelect.value = preferences.language;
            document.body.classList.toggle('dark-mode', preferences.darkMode);
            applyPreferenceButtons();
            applyProfile();
            writeStorage(storageKeys.profile, profile);
            writeStorage(storageKeys.preferences, preferences);
        } else if (results[1].status === 'rejected') {
            showToast(`Could not load your Supabase profile: ${results[1].reason.message}`);
        }
        if (results[2].status === 'fulfilled') {
            orders = results[2].value || [];
            renderOrders();
        } else {
            showToast(`Could not load Supabase orders: ${results[2].reason.message}`);
        }
    }

    initializeBackend();
});
