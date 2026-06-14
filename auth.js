// ============================================
// AUTH.JS - Authentification avec session persistante
// ============================================

class AuthSystem {
    constructor() {
        this.sessionKey = 'mokamboAdminSession';
        this.usersKey = 'mokamboUsers';
        this.initializeAdmin();
        this.checkPersistentSession();
    }

    initializeAdmin() {
        let users = this.getUsers();
        const adminExists = users.some(user => user.email === 'mwansaestime@gmail.com');
        
        if (!adminExists) {
            const defaultAdmin = {
                id: 1,
                email: 'mwansaestime@gmail.com',
                password: 'Mwewa1994@',
                name: 'Mwansa Estime',
                role: 'admin',
                phone: '+243992292032',
                createdBy: 'system',
                createdAt: new Date().toISOString(),
                lastLogin: null
            };
            users.push(defaultAdmin);
            localStorage.setItem(this.usersKey, JSON.stringify(users));
        }
    }

    getUsers() {
        return JSON.parse(localStorage.getItem(this.usersKey)) || [];
    }

    saveUsers(users) {
        localStorage.setItem(this.usersKey, JSON.stringify(users));
    }

    login(email, password, rememberMe = false) {
        const users = this.getUsers();
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            user.lastLogin = new Date().toISOString();
            const updatedUsers = users.map(u => u.id === user.id ? user : u);
            this.saveUsers(updatedUsers);
            
            const session = {
                userId: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                loginTime: new Date().toISOString(),
                persistent: rememberMe
            };
            
            if (rememberMe) {
                const expirationDate = new Date();
                expirationDate.setDate(expirationDate.getDate() + 30);
                session.expiresAt = expirationDate.toISOString();
                localStorage.setItem(this.sessionKey, JSON.stringify(session));
            }
            
            sessionStorage.setItem(this.sessionKey, JSON.stringify(session));
            return { success: true, user: user };
        }
        
        return { success: false, message: 'Email ou mot de passe incorrect' };
    }

    logout() {
        localStorage.removeItem(this.sessionKey);
        sessionStorage.removeItem(this.sessionKey);
        window.location.href = 'login.html';
    }

    isLoggedIn() {
        let session = sessionStorage.getItem(this.sessionKey);
        
        if (!session) {
            session = localStorage.getItem(this.sessionKey);
        }
        
        if (!session) return null;
        
        const sessionData = JSON.parse(session);
        
        if (sessionData.persistent && sessionData.expiresAt) {
            const expiresAt = new Date(sessionData.expiresAt);
            if (expiresAt < new Date()) {
                localStorage.removeItem(this.sessionKey);
                sessionStorage.removeItem(this.sessionKey);
                return null;
            }
            // Prolonger la session
            const newExpiration = new Date();
            newExpiration.setDate(newExpiration.getDate() + 30);
            sessionData.expiresAt = newExpiration.toISOString();
            localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
        }
        
        if (sessionData.persistent && !sessionStorage.getItem(this.sessionKey)) {
            sessionStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
        }
        
        return sessionData;
    }

    isAdmin() {
        const session = this.isLoggedIn();
        return session && session.role === 'admin';
    }

    addUser(userData, adminEmail) {
        const session = this.isLoggedIn();
        if (!session || session.role !== 'admin') {
            return { success: false, message: 'Accès non autorisé' };
        }

        const users = this.getUsers();
        if (users.some(u => u.email === userData.email)) {
            return { success: false, message: 'Cet email est déjà utilisé' };
        }

        const newUser = {
            id: Date.now(),
            email: userData.email,
            password: userData.password,
            name: userData.name,
            role: userData.role || 'editor',
            createdBy: adminEmail,
            createdAt: new Date().toISOString(),
            lastLogin: null
        };

        users.push(newUser);
        this.saveUsers(users);
        return { success: true, message: 'Utilisateur ajouté avec succès' };
    }

    getUsersList() {
        const session = this.isLoggedIn();
        if (!session || session.role !== 'admin') return [];
        
        const users = this.getUsers();
        return users.map(user => ({
            ...user,
            password: '••••••••'
        }));
    }

    deleteUser(userId) {
        const session = this.isLoggedIn();
        if (!session || session.role !== 'admin') {
            return { success: false, message: 'Accès non autorisé' };
        }

        let users = this.getUsers();
        const userToDelete = users.find(u => u.id === userId);
        if (userToDelete && userToDelete.email === 'mwansaestime@gmail.com') {
            return { success: false, message: 'Impossible de supprimer l\'administrateur principal' };
        }

        users = users.filter(u => u.id !== userId);
        this.saveUsers(users);
        return { success: true, message: 'Utilisateur supprimé avec succès' };
    }

    changePassword(currentPassword, newPassword) {
        const session = this.isLoggedIn();
        if (!session) return { success: false, message: 'Non connecté' };
        
        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.email === session.email);
        
        if (userIndex === -1) return { success: false, message: 'Utilisateur non trouvé' };
        if (users[userIndex].password !== currentPassword) {
            return { success: false, message: 'Mot de passe actuel incorrect' };
        }
        if (newPassword.length < 8) {
            return { success: false, message: 'Le mot de passe doit contenir au moins 8 caractères' };
        }
        
        users[userIndex].password = newPassword;
        this.saveUsers(users);
        return { success: true, message: 'Mot de passe modifié avec succès' };
    }

    checkPersistentSession() {
        const persistentSession = localStorage.getItem(this.sessionKey);
        if (persistentSession) {
            const sessionData = JSON.parse(persistentSession);
            if (sessionData.persistent && sessionData.expiresAt) {
                const expiresAt = new Date(sessionData.expiresAt);
                if (expiresAt > new Date()) {
                    sessionStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
                    return true;
                } else {
                    localStorage.removeItem(this.sessionKey);
                }
            }
        }
        return false;
    }
}

const auth = new AuthSystem();