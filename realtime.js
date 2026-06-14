// ============================================
// REALTIME.JS - Mise à jour en temps réel du site
// ============================================

class RealtimeUpdater {
    constructor() {
        this.updateInterval = 3000;
        this.lastUpdateTime = localStorage.getItem('mokamboLastUpdate') || Date.now();
        this.listeners = [];
        this.isActive = false;
        this.updateBadge = null;
    }

    start() {
        if (this.isActive) return;
        this.isActive = true;
        
        this.createUpdateBadge();
        
        this.interval = setInterval(() => {
            this.checkForUpdates();
        }, this.updateInterval);
        
        window.addEventListener('storage', (e) => {
            if (e.key === 'mokamboLastUpdate' || e.key === 'mokamboItems' || e.key === 'mokamboOrders') {
                this.handleUpdate(e.key);
            }
        });
        
        window.addEventListener('mokamboDataUpdated', (e) => {
            this.handleUpdate(e.detail.key);
        });
        
        this.checkForUpdates();
        console.log('🟢 Système de mise à jour en temps réel activé');
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.isActive = false;
        }
    }

    createUpdateBadge() {
        if (document.getElementById('updateBadge')) return;
        
        this.updateBadge = document.createElement('div');
        this.updateBadge.id = 'updateBadge';
        this.updateBadge.className = 'update-notification-badge';
        this.updateBadge.innerHTML = `
            <i class="fas fa-sync-alt fa-spin"></i>
            <span>Nouveaux articles disponibles !</span>
            <button onclick="realtimeUpdater.refreshPage()">
                <i class="fas fa-redo"></i> Actualiser
            </button>
        `;
        this.updateBadge.style.display = 'none';
        document.body.appendChild(this.updateBadge);
    }

    checkForUpdates() {
        const currentUpdateTime = localStorage.getItem('mokamboLastUpdate');
        
        if (currentUpdateTime && parseInt(currentUpdateTime) > parseInt(this.lastUpdateTime)) {
            this.lastUpdateTime = currentUpdateTime;
            this.notifyListeners('update');
            this.showUpdateNotification();
        }
    }

    handleUpdate(key) {
        if (key === 'mokamboItems' || key === 'mokamboLastUpdate') {
            this.notifyListeners('items');
        } else if (key === 'mokamboOrders') {
            this.notifyListeners('orders');
        }
        this.lastUpdateTime = localStorage.getItem('mokamboLastUpdate') || Date.now();
    }

    showUpdateNotification() {
        if (this.updateBadge) {
            this.updateBadge.style.display = 'flex';
            this.updateBadge.classList.add('show');
            
            setTimeout(() => {
                this.updateBadge.classList.remove('show');
                setTimeout(() => {
                    this.updateBadge.style.display = 'none';
                }, 300);
            }, 10000);
        }
    }

    refreshPage() {
        // Recharger les données depuis le localStorage
        if (typeof items !== 'undefined') {
            const newItems = JSON.parse(localStorage.getItem('mokamboItems')) || [];
            if (typeof displayItems === 'function') {
                items = newItems;
                displayItems();
            }
        }
        
        if (typeof loadOrders === 'function') {
            loadOrders();
        }
        
        if (typeof displayAdminItems === 'function') {
            const newItems = JSON.parse(localStorage.getItem('mokamboItems')) || [];
            if (typeof items !== 'undefined') {
                items = newItems;
            }
            displayAdminItems();
        }
        
        if (this.updateBadge) {
            this.updateBadge.classList.remove('show');
            setTimeout(() => {
                this.updateBadge.style.display = 'none';
            }, 300);
        }
        
        showToast('✅ Page mise à jour avec succès !', 'success');
    }

    addListener(callback) {
        this.listeners.push(callback);
    }

    notifyListeners(type) {
        this.listeners.forEach(callback => {
            try {
                callback(type);
            } catch (e) {
                console.error('Erreur dans le listener:', e);
            }
        });
    }

    static markAsUpdated() {
        const timestamp = Date.now().toString();
        localStorage.setItem('mokamboLastUpdate', timestamp);
        
        window.dispatchEvent(new CustomEvent('mokamboDataUpdated', {
            detail: { key: 'mokamboLastUpdate', timestamp: timestamp }
        }));
        
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'mokamboLastUpdate',
            newValue: timestamp
        }));
    }
}

function showToast(message, type = 'info') {
    document.querySelectorAll('.toast-notification').forEach(t => t.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

const realtimeUpdater = new RealtimeUpdater();

// Surcharger localStorage.setItem pour déclencher les mises à jour
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
    originalSetItem.apply(this, arguments);
    
    if (key === 'mokamboItems' || key === 'mokamboOrders') {
        RealtimeUpdater.markAsUpdated();
    }
};