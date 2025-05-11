const defaultCategories = [
	{
		id: 1,
		name: "Профиля",
		subcategories: [
			{
				id: 101,
				name: "Обычные",
				products: [
					{ id: 1002, name: "Багет стеновой", price: 108, description: "2.5м, ПВХ" }
				]
			},
			{
				id: 102,
				name: "Парящие",
				products: [
					{ id: 1003, name: "ПК-6", price: 1300, description: "2.5м, алюминий" }
				]
			}
		]
	},
	{
		id: 2,
		name: "Полотна",
		subcategories: [
			{
				id: 201,
				name: "Матовые",
				products: [
					{ id: 2001, name: "Белое Folien ECO Premium", price: 250, description: "1м/кв, ширина 320см" }
				]
			}
		]
	}
];

let categories = [];
let cart = [];
let currentCategoryId = null;
let currentSubcategoryId = null;
let currentUser = null;
let currentNavItem = 'home';

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
	loadCatalog();
	loadUserData();
	loadCart();
	showPage('home');
});

function loadUserData() {
	currentUser = AuthService.getCurrentUser();
}

function showPage(pageId) {
	document.querySelectorAll('.page').forEach(page => {
		page.classList.add('hidden');
	});
	document.getElementById(`${pageId}-page`).classList.remove('hidden');

	if (pageId === 'catalog') {
		loadCatalog();
		toggleAdminPanel();
	}

	if (pageId === 'account') {
		if (currentUser) {
			showUserInfo();
		} else {
			showLoginForm();
		}
	}

	 if (pageId === 'cart') {
		updateCartUI();
	}

    currentNavItem = pageId;
    updateNavIndicator();
}

function updateNavIndicator() {
    const indicator = document.getElementById('nav-indicator');
    const activeItem = document.querySelector(`nav a[onclick="showPage('${currentNavItem}')"]`);
    
    if (activeItem && indicator) {
        const itemRect = activeItem.getBoundingClientRect();
        const navRect = activeItem.closest('nav').getBoundingClientRect();
        
        indicator.style.width = `${itemRect.width}px`;
        indicator.style.left = `${itemRect.left - navRect.left}px`;
    }
}

window.addEventListener('load', updateNavIndicator);
window.addEventListener('resize', updateNavIndicator);

function loadCatalog() {
	const savedCatalog = localStorage.getItem('shop-catalog');
	if (savedCatalog) {
		categories = JSON.parse(savedCatalog);
	} else {
		categories = JSON.parse(JSON.stringify(defaultCategories));
		saveCatalog();
	}
	
	renderCategories();
}

function saveCatalog() {
	localStorage.setItem('shop-catalog', JSON.stringify(categories));
}

function toggleAdminPanel() {
	const adminPanel = document.getElementById('admin-panel');
	if (currentUser?.isAdmin) {
		adminPanel.classList.remove('hidden');
	} else {
		adminPanel.classList.add('hidden');
	}
}

function renderCategories() {
	const sidebar = document.getElementById('categories-sidebar');
	if (!sidebar) {
		console.error("Элемент categories-sidebar не найден");
		return;
	}
	
	sidebar.innerHTML = '';
	
	categories.forEach(category => {
		const categoryElement = document.createElement('div');
		categoryElement.className = 'category';
		categoryElement.innerHTML = `
			<h3 onclick="showCategory(${category.id})">${category.name}</h3>
			<div class="subcategories" id="subcategories-${category.id}"></div>
		`;
		sidebar.appendChild(categoryElement);
		
		renderSubcategories(category.id);
	});
	
	updateAdminDropdowns();
}

function showCategory(categoryId) {
	const category = categories.find(c => c.id === categoryId);
	if (!category) return;
	
	currentCategoryId = categoryId;
	currentSubcategoryId = null;
	
	const allProducts = [];
	category.subcategories.forEach(sub => {
		allProducts.push(...sub.products);
	});
	
	renderProductList(allProducts);
}

function showSubcategory(categoryId, subcategoryId) {
	const category = categories.find(c => c.id === categoryId);
	if (!category) return;
	
	const subcategory = category.subcategories.find(s => s.id === subcategoryId);
	if (!subcategory) return;
	
	currentCategoryId = categoryId;
	currentSubcategoryId = subcategoryId;
	
	renderProductList(subcategory.products);
}

function renderProductList(products) {
	const productsList = document.getElementById('products-list');
	if (!productsList) return;
	
	productsList.innerHTML = '';
	
	if (products.length === 0) {
		productsList.innerHTML = '<p>Товары не найдены</p>';
		return;
	}
	
	products.forEach(product => {
		const productElement = document.createElement('div');
		productElement.className = 'product';
		productElement.innerHTML = `
			<h3>${product.name}</h3>
			<p>${product.description}</p>
			<p><strong>${product.price} руб.</strong></p>
			<button onclick="addToCart(${product.id})">В корзину</button>
			${currentUser?.isAdmin ? `
				<button onclick="deleteProduct(${product.id})">Удалить</button>
			` : ''}
		`;
		productsList.appendChild(productElement);
	});
}

function renderSubcategories(categoryId) {
	const category = categories.find(c => c.id === categoryId);
	if (!category) return;
	
	const container = document.getElementById(`subcategories-${categoryId}`);
	container.innerHTML = '';
	
	category.subcategories.forEach(subcategory => {
		const subElement = document.createElement('div');
		subElement.className = 'subcategory';
		subElement.innerHTML = `
			<p onclick="showSubcategory(${categoryId}, ${subcategory.id})">
				${subcategory.name} (${subcategory.products.length})
			</p>
		`;
		container.appendChild(subElement);
	});
}

function updateAdminDropdowns() {
	const categorySelect = document.getElementById('category-select');
	const parentCategorySelect = document.getElementById('parent-category-select');
	const subcategorySelect = document.getElementById('subcategory-select');
	
	categorySelect.innerHTML = '';
	parentCategorySelect.innerHTML = '';
	subcategorySelect.innerHTML = '';
	
	categories.forEach(category => {
		const option1 = document.createElement('option');
		option1.value = category.id;
		option1.textContent = category.name;
		categorySelect.appendChild(option1);
		
		const option2 = document.createElement('option');
		option2.value = category.id;
		option2.textContent = category.name;
		parentCategorySelect.appendChild(option2);
	});
	
	updateSubcategoryDropdown();
}

function updateSubcategoryDropdown() {
	const categorySelect = document.getElementById('category-select');
	const subcategorySelect = document.getElementById('subcategory-select');
	
	subcategorySelect.innerHTML = '';
	
	if (!categorySelect.value) return;
	
	const categoryId = parseInt(categorySelect.value);
	const category = categories.find(c => c.id === categoryId);
	if (!category) return;
	
	category.subcategories.forEach(subcategory => {
		const option = document.createElement('option');
		option.value = subcategory.id;
		option.textContent = subcategory.name;
		subcategorySelect.appendChild(option);
	});
}

function addCategory() {
	const name = document.getElementById('new-category-name').value.trim();
	if (!name) return;
	
	const newCategory = {
		id: Date.now(),
		name,
		subcategories: []
	};
	
	categories.push(newCategory);
	saveCatalog();
	renderCategories();
	document.getElementById('new-category-name').value = '';
}

function addSubcategory() {
	const categoryId = parseInt(document.getElementById('parent-category-select').value);
	const name = document.getElementById('new-subcategory-name').value.trim();
	if (!name || !categoryId) return;
	
	const category = categories.find(c => c.id === categoryId);
	if (!category) return;
	
	const newSubcategory = {
		id: Date.now(),
		name,
		products: []
	};
	
	category.subcategories.push(newSubcategory);
	saveCatalog();
	renderCategories();
	document.getElementById('new-subcategory-name').value = '';
}

function addProduct() {
	const categoryId = parseInt(document.getElementById('category-select').value);
	const subcategoryId = parseInt(document.getElementById('subcategory-select').value);
	const name = document.getElementById('new-product-name').value.trim();
	const price = parseFloat(document.getElementById('new-product-price').value);
	const description = document.getElementById('new-product-desc').value.trim();
	
	if (!name || isNaN(price) || !description || !categoryId || !subcategoryId) {
		alert("Заполните все поля корректно!");
		return;
	}
	
	const category = categories.find(c => c.id === categoryId);
	if (!category) return;
	
	const subcategory = category.subcategories.find(s => s.id === subcategoryId);
	if (!subcategory) return;
	
	const newProduct = {
		id: Date.now(),
		name,
		price,
		description
	};
	
	subcategory.products.push(newProduct);
	saveCatalog();
	renderProductList(subcategory.products);
	document.getElementById('new-product-name').value = '';
	document.getElementById('new-product-price').value = '';
	document.getElementById('new-product-desc').value = '';
}

function deleteProduct(productId) {
	if (!confirm("Удалить этот товар?")) return;
	
	for (const category of categories) {
		for (const subcategory of category.subcategories) {
			const index = subcategory.products.findIndex(p => p.id === productId);
			if (index !== -1) {
				subcategory.products.splice(index, 1);
				saveCatalog();
				renderProductList(subcategory.products);
				return;
			}
		}
	}
	
	alert("Товар не найден");
}

function showLoginForm() {
	document.getElementById('login-form').classList.remove('hidden');
	document.getElementById('register-form').classList.add('hidden');
	document.getElementById('user-info').classList.add('hidden');
}

function showRegisterForm() {
	document.getElementById('login-form').classList.add('hidden');
	document.getElementById('register-form').classList.remove('hidden');
	document.getElementById('user-info').classList.add('hidden');
}

function login(event) {
	event.preventDefault();
	const email = document.getElementById('login-email').value;
	const password = document.getElementById('login-password').value;

	try {
		currentUser = AuthService.login(email, password);
		showUserInfo();
		toggleAdminPanel();
		showPage('catalog');
	} catch (error) {
		alert(error.message);
	}
}

function register(event) {
	event.preventDefault();
	const name = document.getElementById('register-name').value;
	const email = document.getElementById('register-email').value;
	const password = document.getElementById('register-password').value;

	try {
		const users = AuthService.getUsers();
		
		if (users.some(u => u.email === email)) {
			throw new Error('Пользователь с таким email уже существует');
		}

		const newUser = { name, email, password, isAdmin: false };
		AuthService.saveUsers([...users, newUser]);
		currentUser = newUser;
		
		showUserInfo();
		toggleAdminPanel();
		alert('Регистрация успешна!');
	} catch (error) {
		alert(error.message);
	}
}

function showUserInfo() {
	document.getElementById('login-form').classList.add('hidden');
	document.getElementById('register-form').classList.add('hidden');
	document.getElementById('user-info').classList.remove('hidden');

	document.getElementById('user-name').textContent = currentUser.name;
	document.getElementById('user-email').textContent = currentUser.email;
	document.getElementById('user-orders').innerHTML = '<li>История заказов временно недоступна</li>';
}

function logout() {
	currentUser = null;
	localStorage.removeItem('current-user');
	showLoginForm();
	showPage('home');
}

// Инициализация корзины при загрузке
function loadCart() {
	const savedCart = localStorage.getItem('shop-cart');
	if (savedCart) {
		cart = JSON.parse(savedCart);
	}
	updateCartUI();
}

// Сохранение корзины
function saveCart() {
	localStorage.setItem('shop-cart', JSON.stringify(cart));
	updateCartUI();
}

//Обновление корзины
function updateCartUI() {
	const cartItems = document.getElementById('cart-items');
	const cartCount = document.getElementById('cart-count');
	const totalPrice = document.getElementById('total-price');
	
	cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
	
	cartItems.innerHTML = '';
	
	let total = 0;
	cart.forEach((item, index) => {
		const product = findProductById(item.productId);
		if (!product) return;
		
		total += product.price * item.quantity;
		
		const itemElement = document.createElement('div');
		itemElement.className = 'cart-item';
		itemElement.innerHTML = `
			<div>
				<h4>${product.name}</h4>
				<p>${product.price} руб. × ${item.quantity}</p>
			</div>
			<div>
				<button onclick="changeQuantity(${index}, 1)">+</button>
				<button onclick="changeQuantity(${index}, -1)">-</button>
				<button onclick="removeFromCart(${index})">×</button>
			</div>
		`;
		cartItems.appendChild(itemElement);
	});
	
	totalPrice.textContent = total;
}

// Поиск товара по ID
function findProductById(id) {
	for (const category of categories) {
		for (const subcategory of category.subcategories) {
			const product = subcategory.products.find(p => p.id === id);
			if (product) return product;
		}
	}
	return null;
}

// Добавление в корзину
function addToCart(productId) {
	const existingItem = cart.find(item => item.productId === productId);
	
	if (existingItem) {
		existingItem.quantity += 1;
	} else {
		cart.push({ productId, quantity: 1 });
	}
	
	saveCart();
}

// Изменение количества
function changeQuantity(index, delta) {
	cart[index].quantity += delta;
	
	if (cart[index].quantity <= 0) {
		cart.splice(index, 1);
	}
	
	saveCart();
}

// Удаление из корзины
function removeFromCart(index) {
	cart.splice(index, 1);
	saveCart();
}

// Оформление заказа
function checkout() {
	if (cart.length === 0) {
		alert('Корзина пуста!');
		return;
	}
	
	if (!currentUser) {
		alert('Для оформления заказа войдите в систему');
		showPage('account');
		return;
	}
	
	alert('Заказ оформлен! Спасибо за покупку!');
	cart = [];
	saveCart();
}

// Обработчики изменений в выпадающих списках
document.getElementById('category-select')?.addEventListener('change', updateSubcategoryDropdown);
document.getElementById('parent-category-select')?.addEventListener('change', updateSubcategoryDropdown);