// ============================================
// SCRIPT.JS - Frontend utilisateur avec diaporama
// ============================================

let items = JSON.parse(localStorage.getItem('mokamboItems')) || [];
let cart = JSON.parse(localStorage.getItem('mokamboCart')) || [];
let orders = JSON.parse(localStorage.getItem('mokamboOrders')) || [];

// Données par défaut avec images multiples
if (items.length === 0) {
    items = [
        {
            id: 1,
            title: "Toyota Corolla 2022",
            category: "voiture",
            price: 13500000,
            images: [
                "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600",
                "https://images.unsplash.com/photo-1550355291-bbee04a92027?w=600",
                "https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=600"
            ],
            image: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600",
            description: "Toyota Corolla en excellent état, 15000 km, climatisation, direction assistée, intérieur cuir, première main, toutes options.",
            status: "disponible",
            views: 245
        },
        {
            id: 2,
            title: "Yamaha MT-07 2023",
            category: "moto",
            price: 12150000,
            images: [
                "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600",
                "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600"
            ],
            image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600",
            description: "Moto sportive comme neuve, 5000 km seulement, entretien régulier chez concessionnaire, parfait état.",
            status: "disponible",
            views: 189
        },
        {
            id: 3,
            title: "Honda CR-V 2021",
            category: "voiture",
            price: 32400000,
            images: [
                "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=600",
                "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600",
                "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600"
            ],
            image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=600",
            description: "SUV spacieux, 30000 km, cuir, toit ouvrant, GPS intégré, caméra de recul, excellent état.",
            status: "disponible",
            views: 312
        },
        {
            id: 4,
            title: "Pièces détachées Toyota",
            category: "autre",
            price: 270000,
            images: [
                "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600",
                "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600"
            ],
            image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600",
            description: "Lot de pièces détachées Toyota origine, freins, filtres, courroies, bougies, qualité garantie.",
            status: "disponible",
            views: 67
        }
    ];
    localStorage.setItem('mokamboItems', JSON.stringify(items));
}

// Traitement des URLs d'images
function processImageUrl(url) {
    if (!url || url.trim() === '') return 'https://via.placeholder.com/600x400?text=Image+non+disponible';
    url = url.trim();
    
    // Images directes
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i)) return url;
    
    // Facebook
    if (url.includes('facebook.com') || url.includes('fbcdn.net')) {
        if (url.includes('url=')) {
            const match = url.match(/url=([^&]+)/);
            if (match) return decodeURIComponent(match[1]);
        }
        return url;
    }
    
    // Instagram
    if (url.includes('instagram.com') || url.includes('cdninstagram.com')) return url;
    
    // Telegram
    if (url.includes('t.me') || url.includes('telegram.org')) return url;
    
    // Google Drive
    if (url.includes('drive.google.com')) {
        const fileId = url.match(/[-\w]{25,}/);
        if (fileId) return `https://drive.google.com/uc?export=view&id=${fileId[0]}`;
    }
    
    // Imgur
    if (url.includes('imgur.com') && !url.includes('i.imgur.com')) {
        const imgurId = url.split('/').pop().split('.')[0];
        return `https://i.imgur.com/${imgurId}.jpg`;
    }
    
    return url;
}

// Obtenir toutes les images d'un article
function getItemImages(item) {
    if (item.images && item.images.length > 0) {
        return item.images.map(url => processImageUrl(url));
    } else if (item.image) {
        return [processImageUrl(item.image)];
    }
    return ['https://via.placeholder.com/600x400?text=Image+non+disponible'];
}

// Afficher les articles avec diaporama
function displayItems(filteredItems = null) {
    const itemsGrid = document.getElementById('itemsGrid');
    const noResults = document.getElementById('noResults');
    const itemsToDisplay = filteredItems || items.filter(item => item.status !== 'vendu');
    
    if (itemsToDisplay.length === 0) {
        itemsGrid.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }
    
    noResults.style.display = 'none';
    const currentCurrency = currencyManager.getCurrentCurrency();
    
    itemsGrid.innerHTML = itemsToDisplay.map(item => {
        const price = currencyManager.formatPrice(item.price);
        const otherPrice = currentCurrency.code === 'USD' ? 
            currencyManager.formatPrice(item.price, 'CDF') : 
            currencyManager.formatPrice(item.price, 'USD');
        
        const images = getItemImages(item);
        const hasMultipleImages = images.length > 1;
        
        return `
            <div class="item-card" data-category="${item.category}">
                <div class="item-image-slider">
                    <div class="slider-container" id="slider-${item.id}">
                        ${images.map((img, index) => `
                            <div class="slider-slide ${index === 0 ? 'active' : ''}">
                                <img src="${img}" 
                                     alt="${item.title} - Image ${index + 1}"
                                     onerror="this.src='https://via.placeholder.com/600x400?text=Image+non+disponible'"
                                     loading="${index === 0 ? 'eager' : 'lazy'}">
                            </div>
                        `).join('')}
                    </div>
                    ${hasMultipleImages ? `
                        <button class="slider-btn slider-prev" onclick="changeSlide(${item.id}, -1, event)">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <button class="slider-btn slider-next" onclick="changeSlide(${item.id}, 1, event)">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        <div class="slider-dots">
                            ${images.map((_, index) => `
                                <span class="slider-dot ${index === 0 ? 'active' : ''}" 
                                      onclick="goToSlide(${item.id}, ${index}, event)"></span>
                            `).join('')}
                        </div>
                        <span class="slider-counter">1/${images.length}</span>
                    ` : ''}
                    <span class="item-status status-available"><i class="fas fa-check-circle"></i> Disponible</span>
                    ${item.views ? `<span class="item-views"><i class="fas fa-eye"></i> ${item.views}</span>` : ''}
                </div>
                <div class="item-details">
                    <span class="item-category">${getCategoryIcon(item.category)} ${item.category}</span>
                    <h3>${item.title}</h3>
                    <div class="item-price">
                        <span class="price-amount">${price}</span>
                        <small>${otherPrice}</small>
                    </div>
                    <p class="item-description">${item.description}</p>
                    <div class="item-actions">
                        <button class="btn-order" onclick="openOrderModal(${item.id})">
                            <i class="fas fa-shopping-cart"></i> Commander
                        </button>
                        <button class="btn-details" onclick="viewDetails(${item.id})">
                            <i class="fas fa-info-circle"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Navigation du diaporama
function changeSlide(itemId, direction, event) {
    if (event) event.stopPropagation();
    
    const slider = document.getElementById(`slider-${itemId}`);
    if (!slider) return;
    
    const slides = slider.querySelectorAll('.slider-slide');
    const dots = slider.parentElement.querySelectorAll('.slider-dot');
    const counter = slider.parentElement.querySelector('.slider-counter');
    
    let currentIndex = Array.from(slides).findIndex(slide => slide.classList.contains('active'));
    if (currentIndex === -1) currentIndex = 0;
    
    slides[currentIndex].classList.remove('active');
    if (dots.length > 0) dots[currentIndex].classList.remove('active');
    
    currentIndex = (currentIndex + direction + slides.length) % slides.length;
    
    slides[currentIndex].classList.add('active');
    if (dots.length > 0) dots[currentIndex].classList.add('active');
    if (counter) counter.textContent = `${currentIndex + 1}/${slides.length}`;
}

function goToSlide(itemId, index, event) {
    if (event) event.stopPropagation();
    
    const slider = document.getElementById(`slider-${itemId}`);
    if (!slider) return;
    
    const slides = slider.querySelectorAll('.slider-slide');
    const dots = slider.parentElement.querySelectorAll('.slider-dot');
    const counter = slider.parentElement.querySelector('.slider-counter');
    
    slides.forEach(s => s.classList.remove('active'));
    if (dots.length > 0) dots.forEach(d => d.classList.remove('active'));
    
    if (slides[index]) slides[index].classList.add('active');
    if (dots[index]) dots[index].classList.add('active');
    if (counter) counter.textContent = `${index + 1}/${slides.length}`;
}

function getCategoryIcon(category) {
    const icons = { voiture: '🚗', moto: '🏍️', autre: '🔧' };
    return icons[category] || '📦';
}

function searchItems() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filtered = items.filter(item => 
        (item.title.toLowerCase().includes(searchTerm) || 
         item.description.toLowerCase().includes(searchTerm) ||
         item.category.toLowerCase().includes(searchTerm)) &&
        item.status !== 'vendu'
    );
    displayItems(filtered);
}

function filterCategory(category) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    if (category === 'tous') {
        displayItems();
    } else {
        const filtered = items.filter(item => item.category === category && item.status !== 'vendu');
        displayItems(filtered);
    }
}

function openOrderModal(itemId) {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    
    document.getElementById('selectedItemId').value = itemId;
    const preview = document.getElementById('orderItemPreview');
    const price = currencyManager.formatPrice(item.price);
    const images = getItemImages(item);
    const mainImage = images[0];
    
    preview.innerHTML = `
        <div class="preview-card">
            <img src="${processImageUrl(mainImage)}" alt="${item.title}" 
                 onerror="this.src='https://via.placeholder.com/100x80?text=Image'"
                 style="width:80px;height:60px;object-fit:cover;border-radius:8px;">
            <div>
                <h4>${item.title}</h4>
                <p class="preview-price">${price}</p>
                ${images.length > 1 ? `<small><i class="fas fa-images"></i> ${images.length} images</small>` : ''}
            </div>
        </div>
    `;
    
    document.getElementById('orderModal').style.display = 'flex';
}

function viewDetails(itemId) {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    const price = currencyManager.formatPrice(item.price);
    const images = getItemImages(item);
    
    alert(`
${item.title}

Prix: ${price}
Catégorie: ${item.category}
Images disponibles: ${images.length}

Description:
${item.description}

📞 Contact: +243 992 292 032
📧 Email: mwansaestime@gmail.com
    `);
}

// Modal
document.querySelector('.close').onclick = function() {
    document.getElementById('orderModal').style.display = 'none';
};

window.onclick = function(event) {
    if (event.target == document.getElementById('orderModal')) {
        document.getElementById('orderModal').style.display = 'none';
    }
};

// Formulaire de commande
document.getElementById('orderForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const itemId = parseInt(document.getElementById('selectedItemId').value);
    const item = items.find(i => i.id === itemId);
    
    if (!item) {
        showNotification('Article non trouvé', 'error');
        return;
    }
    
    const order = {
        id: Date.now(),
        orderNumber: 'MP-' + Date.now().toString(36).toUpperCase(),
        itemId: itemId,
        itemTitle: item.title,
        itemPrice: item.price,
        itemImage: getItemImages(item)[0],
        itemImages: getItemImages(item),
        customerName: document.getElementById('customerName').value,
        customerPhone: document.getElementById('customerPhone').value,
        customerEmail: document.getElementById('customerEmail').value,
        customerAddress: document.getElementById('customerAddress').value,
        message: document.getElementById('customerMessage').value,
        status: 'nouveau',
        date: new Date().toLocaleString('fr-FR'),
        timestamp: new Date().toISOString()
    };
    
    orders.push(order);
    localStorage.setItem('mokamboOrders', JSON.stringify(orders));
    RealtimeUpdater.markAsUpdated();
    
    cart.push(order);
    localStorage.setItem('mokamboCart', JSON.stringify(cart));
    updateCartCount();
    
    showNotification('✅ Commande envoyée avec succès!', 'success');
    alert(`🎉 Commande confirmée!\n\nArticle: ${item.title}\nN° ${order.orderNumber}\n\nNous vous contacterons au ${order.customerPhone}`);
    
    document.getElementById('orderModal').style.display = 'none';
    this.reset();
});

function changeDisplayCurrency() {
    const currency = document.getElementById('currencySelect').value;
    currencyManager.setCurrency(currency);
    displayItems();
}

function updateCartCount() {
    const count = cart.length;
    document.getElementById('cartCount').textContent = count;
    document.getElementById('cartFloatCount').textContent = count;
}

function showCartSummary() {
    if (cart.length === 0) {
        alert('Votre panier est vide');
        return;
    }
    let summary = 'Vos commandes récentes:\n\n';
    cart.slice(-5).forEach(order => {
        summary += `📦 ${order.itemTitle} - N° ${order.orderNumber}\n`;
    });
    alert(summary);
}

function showNotification(message, type) {
    showToast(message, type);
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    // Démarrer le système temps réel
    realtimeUpdater.start();
    
    // Écouter les mises à jour
    realtimeUpdater.addListener((type) => {
        if (type === 'update' || type === 'items') {
            items = JSON.parse(localStorage.getItem('mokamboItems')) || [];
            displayItems();
            updateCartCount();
        }
    });
    
    displayItems();
    updateCartCount();
    
    const savedCurrency = localStorage.getItem('mokamboCurrency') || 'USD';
    document.getElementById('currencySelect').value = savedCurrency;
    currencyManager.setCurrency(savedCurrency);
    
    console.log('🟢 Site connecté - Mises à jour automatiques activées');
});