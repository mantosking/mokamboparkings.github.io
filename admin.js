// ============================================
// ADMIN.JS - Administration complète
// ============================================

let items = JSON.parse(localStorage.getItem('mokamboItems')) || [];
let editingId = null;
let imageFieldCount = 1;

document.addEventListener('DOMContentLoaded', function() {
    const session = auth.isLoggedIn();
    
    if (!session) {
        window.location.href = 'login.html';
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('mokamboUsers')) || [];
    const currentUser = users.find(u => u.email === session.email);
    
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'editor')) {
        auth.logout();
        return;
    }
    
    document.getElementById('sessionCheck').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    
    displayUserInfo(session);
    
    if (session.email === 'mwansaestime@gmail.com') {
        document.getElementById('usersTabBtn').style.display = 'inline-block';
    }
    
    // Démarrer le système temps réel
    realtimeUpdater.start();
    
    realtimeUpdater.addListener((type) => {
        if (type === 'orders') {
            loadOrders();
            updateOrdersBadge();
        }
    });
    
    displayAdminItems();
    updateCurrencySettings();
    loadOrders();
    updateOrdersBadge();
    
    // Écouteur pour la prévisualisation des images
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('image-url-input')) {
            previewAllImages();
        }
    });
});

function displayUserInfo(session) {
    const userInfo = document.getElementById('userInfo');
    if (userInfo) {
        userInfo.innerHTML = `<i class="fas fa-user-shield"></i> ${session.name || session.email} <span class="badge-role">${session.role}</span>`;
    }
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(tabName + 'Tab').classList.add('active');
    if (event && event.target) event.target.classList.add('active');
    
    if (tabName === 'users') displayUsers();
    if (tabName === 'articles') displayAdminItems();
    if (tabName === 'orders') loadOrders();
    if (tabName === 'settings') updateCurrencySettings();
}

// ========== IMAGES ==========
function addImageField() {
    imageFieldCount++;
    const additionalImages = document.getElementById('additionalImages');
    const newField = document.createElement('div');
    newField.className = 'image-upload-row';
    newField.innerHTML = `
        <input type="text" class="image-url-input" placeholder="URL de l'image ${imageFieldCount}">
        <button type="button" class="btn-remove-image" onclick="removeImageField(this)">
            <i class="fas fa-times"></i> Supprimer
        </button>
    `;
    additionalImages.appendChild(newField);
}

function removeImageField(button) {
    button.parentElement.remove();
    previewAllImages();
}

function getAllImageUrls() {
    const inputs = document.querySelectorAll('.image-url-input');
    const urls = [];
    inputs.forEach(input => {
        const url = input.value.trim();
        if (url) urls.push(url);
    });
    return urls;
}

function previewAllImages() {
    const previewContainer = document.getElementById('imagesPreview');
    const urls = getAllImageUrls();
    
    if (urls.length === 0) {
        previewContainer.innerHTML = '<p style="color: #94a3b8;">Aucune image à afficher</p>';
        return;
    }
    
    previewContainer.innerHTML = urls.map((url, index) => {
        const imageUrl = processImageUrl(url);
        return `
            <div class="preview-image-item">
                <img src="${imageUrl}" 
                     alt="Image ${index + 1}"
                     onerror="this.parentElement.innerHTML='<div class=preview-error><i class=\\'fas fa-exclamation-triangle\\'></i><p>Image non disponible</p><small>Vérifiez l\\'URL</small></div>'"
                     onload="this.style.display='block'">
                <span class="preview-image-number">${index + 1}</span>
            </div>
        `;
    }).join('');
}

function processImageUrl(url) {
    if (!url || url.trim() === '') return 'https://via.placeholder.com/400x300?text=Image+non+disponible';
    url = url.trim();
    
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i)) return url;
    if (url.includes('facebook.com') || url.includes('fbcdn.net')) {
        if (url.includes('url=')) {
            const match = url.match(/url=([^&]+)/);
            if (match) return decodeURIComponent(match[1]);
        }
        return url;
    }
    if (url.includes('instagram.com') || url.includes('cdninstagram.com')) return url;
    if (url.includes('t.me') || url.includes('telegram.org')) return url;
    if (url.includes('drive.google.com')) {
        const fileId = url.match(/[-\w]{25,}/);
        if (fileId) return `https://drive.google.com/uc?export=view&id=${fileId[0]}`;
    }
    if (url.includes('imgur.com') && !url.includes('i.imgur.com')) {
        const imgurId = url.split('/').pop().split('.')[0];
        return `https://i.imgur.com/${imgurId}.jpg`;
    }
    return url;
}

// ========== ARTICLES ==========
function saveItemsAndNotify(itemsArray) {
    localStorage.setItem('mokamboItems', JSON.stringify(itemsArray));
    RealtimeUpdater.markAsUpdated();
}

function displayAdminItems() {
    const adminList = document.getElementById('adminItemsList');
    const currentCurrency = currencyManager.getCurrentCurrency();
    
    if (items.length === 0) {
        adminList.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><h3>Aucun article pour le moment</h3><p>Ajoutez votre premier article</p></div>';
        return;
    }
    
    adminList.innerHTML = items.map(item => {
        const price = currencyManager.formatPrice(item.price);
        const otherPrice = currentCurrency.code === 'USD' ? 
            currencyManager.formatPrice(item.price, 'CDF') : 
            currencyManager.formatPrice(item.price, 'USD');
        
        const mainImage = item.images && item.images.length > 0 ? processImageUrl(item.images[0]) : 
                         (item.image ? processImageUrl(item.image) : 'https://via.placeholder.com/400x300?text=Image');
        const imageCount = item.images ? item.images.length : (item.image ? 1 : 0);
        
        return `
            <div class="admin-card">
                <div class="admin-card-image">
                    <img src="${mainImage}" 
                         alt="${item.title}"
                         onerror="this.src='https://via.placeholder.com/400x300?text=Image+non+disponible'"
                         loading="lazy">
                    ${imageCount > 1 ? `<span class="image-count-badge"><i class="fas fa-images"></i> ${imageCount}</span>` : ''}
                </div>
                <div class="admin-card-content">
                    <h4>${item.title}</h4>
                    <p class="admin-price">${price}</p>
                    <p class="admin-price-secondary">${otherPrice}</p>
                    <p class="admin-meta">
                        <span class="badge badge-${item.category}">${item.category}</span>
                        <span class="badge badge-${item.status}">${item.status}</span>
                    </p>
                    <p class="admin-date"><small>${new Date(item.createdAt || Date.now()).toLocaleDateString('fr-FR')}</small></p>
                    <div class="admin-card-actions">
                        <button class="btn-edit" onclick="editItem(${item.id})"><i class="fas fa-edit"></i> Modifier</button>
                        <button class="btn-delete" onclick="deleteItem(${item.id})"><i class="fas fa-trash"></i> Supprimer</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

document.getElementById('itemForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const session = auth.isLoggedIn();
    if (!session) return;
    
    const imageUrls = getAllImageUrls();
    if (imageUrls.length === 0) {
        showNotification('❌ Veuillez ajouter au moins une image', 'error');
        return;
    }
    
    const itemData = {
        id: editingId || Date.now(),
        title: document.getElementById('itemTitle').value,
        category: document.getElementById('itemCategory').value,
        price: parseFloat(document.getElementById('itemPrice').value),
        images: imageUrls,
        image: imageUrls[0],
        description: document.getElementById('itemDescription').value,
        status: document.getElementById('itemStatus').value,
        createdBy: session.email,
        createdAt: editingId ? (items.find(i => i.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    if (editingId) {
        const index = items.findIndex(item => item.id === editingId);
        items[index] = itemData;
        showNotification('✅ Article modifié avec succès! Le site est mis à jour.', 'success');
        editingId = null;
        document.getElementById('formTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Ajouter un article';
        document.getElementById('saveBtn').innerHTML = '<i class="fas fa-save"></i> Enregistrer';
    } else {
        items.push(itemData);
        showNotification('✅ Article ajouté! Le site est mis à jour pour tous les visiteurs.', 'success');
    }
    
    saveItemsAndNotify(items);
    showToast('🔄 Site mis à jour - Tous les visiteurs verront les changements', 'success');
    resetForm();
    displayAdminItems();
});

function editItem(id) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    
    editingId = id;
    document.getElementById('formTitle').innerHTML = '<i class="fas fa-edit"></i> Modifier l\'article';
    document.getElementById('saveBtn').innerHTML = '<i class="fas fa-save"></i> Mettre à jour';
    document.getElementById('itemId').value = item.id;
    document.getElementById('itemTitle').value = item.title;
    document.getElementById('itemCategory').value = item.category;
    document.getElementById('itemPrice').value = item.price;
    document.getElementById('itemDescription').value = item.description;
    document.getElementById('itemStatus').value = item.status;
    
    const additionalImages = document.getElementById('additionalImages');
    additionalImages.innerHTML = '';
    imageFieldCount = 1;
    
    const images = item.images && item.images.length > 0 ? item.images : (item.image ? [item.image] : []);
    
    if (images.length > 0) {
        const firstInput = document.querySelector('.image-url-input');
        if (firstInput) firstInput.value = images[0];
        
        for (let i = 1; i < images.length; i++) {
            imageFieldCount++;
            const newField = document.createElement('div');
            newField.className = 'image-upload-row';
            newField.innerHTML = `
                <input type="text" class="image-url-input" value="${images[i]}" placeholder="URL de l'image ${imageFieldCount}">
                <button type="button" class="btn-remove-image" onclick="removeImageField(this)">
                    <i class="fas fa-times"></i> Supprimer
                </button>
            `;
            additionalImages.appendChild(newField);
        }
    }
    
    previewAllImages();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteItem(id) {
    if (confirm('⚠️ Êtes-vous sûr de vouloir supprimer cet article ?')) {
        items = items.filter(item => item.id !== id);
        saveItemsAndNotify(items);
        displayAdminItems();
        showNotification('🗑️ Article supprimé! Site mis à jour.', 'success');
    }
}

function resetForm() {
    document.getElementById('itemForm').reset();
    document.getElementById('additionalImages').innerHTML = '';
    document.getElementById('imagesPreview').innerHTML = '<p style="color: #94a3b8;">Aucune image à afficher</p>';
    imageFieldCount = 1;
    editingId = null;
    document.getElementById('formTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Ajouter un article';
    document.getElementById('saveBtn').innerHTML = '<i class="fas fa-save"></i> Enregistrer';
}

// ========== COMMANDES ==========
function loadOrders() {
    const ordersList = document.getElementById('ordersList');
    const orders = JSON.parse(localStorage.getItem('mokamboOrders')) || [];
    
    if (orders.length === 0) {
        ordersList.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><h3>Aucune commande</h3><p>Les commandes apparaîtront ici</p></div>';
        updateOrderStats([]);
        return;
    }
    
    updateOrderStats(orders);
    
    ordersList.innerHTML = orders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map(order => {
        const price = currencyManager.formatPrice(order.itemPrice);
        const statusClass = order.status === 'nouveau' ? 'status-new' : order.status === 'traite' ? 'status-processed' : 'status-cancelled';
        const statusLabel = order.status === 'nouveau' ? 'Nouveau' : order.status === 'traite' ? 'Traité' : 'Annulé';
        const itemImage = order.itemImage || (order.itemImages && order.itemImages[0]) || 'https://via.placeholder.com/100';
        
        return `
            <div class="order-card-admin">
                <div class="order-card-header">
                    <div>
                        <span class="order-number">📋 ${order.orderNumber}</span>
                        <span class="order-date">${order.date}</span>
                    </div>
                    <span class="order-status ${statusClass}">${statusLabel}</span>
                </div>
                <div class="order-card-body">
                    <div class="order-item-info">
                        <img src="${processImageUrl(itemImage)}" alt="${order.itemTitle}" onerror="this.src='https://via.placeholder.com/100x80?text=Image'">
                        <div>
                            <h4>${order.itemTitle}</h4>
                            <p class="order-price">${price}</p>
                        </div>
                    </div>
                    <div class="order-customer-info">
                        <p><i class="fas fa-user"></i> ${order.customerName}</p>
                        <p><i class="fas fa-phone"></i> ${order.customerPhone}</p>
                        <p><i class="fas fa-envelope"></i> ${order.customerEmail || 'Non fourni'}</p>
                        ${order.message ? `<p><i class="fas fa-comment"></i> ${order.message}</p>` : ''}
                    </div>
                </div>
                <div class="order-card-actions">
                    ${order.status === 'nouveau' ? `<button class="btn-process" onclick="updateOrderStatus(${order.id}, 'traite')"><i class="fas fa-check"></i> Traiter</button>` : ''}
                    ${order.status !== 'annule' ? `<button class="btn-cancel" onclick="updateOrderStatus(${order.id}, 'annule')"><i class="fas fa-times"></i> Annuler</button>` : ''}
                    <button class="btn-contact" onclick="window.open('tel:${order.customerPhone}')"><i class="fas fa-phone"></i> Appeler</button>
                    <button class="btn-delete-order" onclick="deleteOrder(${order.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    }).join('');
}

function updateOrderStats(orders) {
    document.getElementById('pendingCount').textContent = orders.filter(o => o.status === 'nouveau').length;
    document.getElementById('processedCount').textContent = orders.filter(o => o.status === 'traite').length;
    document.getElementById('cancelledCount').textContent = orders.filter(o => o.status === 'annule').length;
}

function updateOrderStatus(orderId, newStatus) {
    let orders = JSON.parse(localStorage.getItem('mokamboOrders')) || [];
    const index = orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
        orders[index].status = newStatus;
        orders[index].updatedAt = new Date().toISOString();
        localStorage.setItem('mokamboOrders', JSON.stringify(orders));
        RealtimeUpdater.markAsUpdated();
        loadOrders();
        updateOrdersBadge();
        showNotification('✅ Statut mis à jour!', 'success');
    }
}

function deleteOrder(orderId) {
    if (confirm('Supprimer cette commande ?')) {
        let orders = JSON.parse(localStorage.getItem('mokamboOrders')) || [];
        orders = orders.filter(o => o.id !== orderId);
        localStorage.setItem('mokamboOrders', JSON.stringify(orders));
        RealtimeUpdater.markAsUpdated();
        loadOrders();
        updateOrdersBadge();
        showNotification('🗑️ Commande supprimée!', 'success');
    }
}

function updateOrdersBadge() {
    const orders = JSON.parse(localStorage.getItem('mokamboOrders')) || [];
    const newOrders = orders.filter(o => o.status === 'nouveau').length;
    const badge = document.getElementById('ordersBadge');
    if (newOrders > 0) {
        badge.textContent = newOrders;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}

// ========== UTILISATEURS ==========
document.getElementById('userForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const session = auth.isLoggedIn();
    if (session.email !== 'mwansaestime@gmail.com') {
        showNotification('⛔ Réservé à l\'administrateur principal', 'error');
        return;
    }
    
    const result = auth.addUser({
        name: document.getElementById('newUserName').value,
        email: document.getElementById('newUserEmail').value,
        password: document.getElementById('newUserPassword').value,
        role: document.getElementById('newUserRole').value
    }, session.email);
    
    if (result.success) {
        showNotification('✅ ' + result.message, 'success');
        this.reset();
        displayUsers();
    } else {
        showNotification('❌ ' + result.message, 'error');
    }
});

function displayUsers() {
    const usersList = document.getElementById('usersList');
    const session = auth.isLoggedIn();
    
    if (session.email !== 'mwansaestime@gmail.com') {
        usersList.innerHTML = '<p style="text-align:center;color:#ef4444;">⛔ Accès réservé à l\'administrateur principal</p>';
        return;
    }
    
    const users = auth.getUsersList();
    usersList.innerHTML = users.map(user => `
        <div class="admin-card user-card">
            <div class="user-avatar"><i class="fas fa-user-circle"></i></div>
            <h4>${user.name}</h4>
            <p><i class="fas fa-envelope"></i> ${user.email}</p>
            <p><i class="fas fa-user-tag"></i> ${user.role}</p>
            ${user.email !== 'mwansaestime@gmail.com' ? 
                `<button class="btn-delete" onclick="deleteUser(${user.id})" style="width:100%;margin-top:10px;"><i class="fas fa-user-minus"></i> Supprimer</button>` :
                '<div class="admin-badge"><i class="fas fa-crown"></i> Admin Principal</div>'}
        </div>
    `).join('');
}

function deleteUser(userId) {
    if (confirm('Supprimer cet utilisateur ?')) {
        const result = auth.deleteUser(userId);
        showNotification(result.success ? '✅ ' + result.message : '❌ ' + result.message, result.success ? 'success' : 'error');
        if (result.success) displayUsers();
    }
}

// ========== MOT DE PASSE ==========
document.getElementById('passwordForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        showNotification('❌ Les mots de passe ne correspondent pas', 'error');
        return;
    }
    
    const result = auth.changePassword(currentPassword, newPassword);
    showNotification(result.success ? '✅ ' + result.message : '❌ ' + result.message, result.success ? 'success' : 'error');
    if (result.success) this.reset();
});

// ========== PARAMÈTRES ==========
function updateCurrencySettings() {
    const currentCurrency = currencyManager.getCurrentCurrency();
    document.getElementById('defaultCurrency').value = currentCurrency.code;
    document.getElementById('exchangeRate').value = currencyManager.currencies.USD.rate;
    document.getElementById('currentRate').textContent = currencyManager.currencies.USD.rate.toLocaleString();
}

function changeDefaultCurrency() {
    currencyManager.setCurrency(document.getElementById('defaultCurrency').value);
    showNotification('✅ Devise changée!', 'success');
    updateCurrencySettings();
    displayAdminItems();
}

function updateExchangeRate() {
    const newRate = parseFloat(document.getElementById('exchangeRate').value);
    if (newRate > 0 && currencyManager.updateExchangeRate('USD', newRate)) {
        showNotification('✅ Taux mis à jour!', 'success');
        updateCurrencySettings();
        displayAdminItems();
    } else {
        showNotification('❌ Taux invalide', 'error');
    }
}

function forceRefreshSite() {
    RealtimeUpdater.markAsUpdated();
    showToast('🔄 Rafraîchissement forcé - Tous les utilisateurs verront les mises à jour', 'success');
}

// ========== UTILITAIRES ==========
function showNotification(message, type) {
    showToast(message, type);
}