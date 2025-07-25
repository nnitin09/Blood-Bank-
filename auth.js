// js/auth.js

const Auth = (() => {
    const SESSION_KEY = 'bloodBankUser';

    const login = (username, password) => {
        const users = DB.getUsers();
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            const userData = { username: user.username, role: user.role };
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(userData));
            return userData;
        }
        return null;
    };

    const logout = () => {
        sessionStorage.removeItem(SESSION_KEY);
    };

    const getCurrentUser = () => {
        const user = sessionStorage.getItem(SESSION_KEY);
        return user ? JSON.parse(user) : null;
    };

    const checkAuth = () => {
        return getCurrentUser() !== null;
    };
    
    const hasRole = (role) => {
        const user = getCurrentUser();
        return user && user.role === role;
    };

    return {
        login,
        logout,
        getCurrentUser,
        checkAuth,
        hasRole
    };
})();