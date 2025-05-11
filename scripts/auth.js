class AuthService {
    static getUsers() {
        const defaultUsers = [
            { 
                name: "Admin", 
                email: "admin@example.com", 
                password: "admin", 
                isAdmin: true 
            }
        ];
        
        const users = localStorage.getItem('shop-users');
        return users ? [...defaultUsers, ...JSON.parse(users)] : defaultUsers;
    }

    static saveUsers(users) {
        const regularUsers = users.filter(user => !user.isAdmin);
        localStorage.setItem('shop-users', JSON.stringify(regularUsers));
    }

    static login(email, password) {
        const users = this.getUsers();
        const user = users.find(u => u.email === email && u.password === password);
        
        if (!user) {
            throw new Error('Неверный email или пароль');
        }

        localStorage.setItem('current-user', JSON.stringify(user));
        return user;
    }

    static getCurrentUser() {
        const user = localStorage.getItem('current-user');
        return user ? JSON.parse(user) : null;
    }
}