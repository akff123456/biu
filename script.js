document.addEventListener("DOMContentLoaded", () => {
    // === Элементы авторизации ===
    const authSection = document.getElementById("auth-section");
    const appSection = document.getElementById("app-section");

    const tabLogin = document.getElementById("tab-login");
    const tabRegister = document.getElementById("tab-register");

    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");
    const authMessage = document.getElementById("auth-message");

    const loginUsernameInput = document.getElementById("login-username");
    const loginPasswordInput = document.getElementById("login-password");

    const regUsernameInput = document.getElementById("reg-username");
    const regPasswordInput = document.getElementById("reg-password");
    const regPassword2Input = document.getElementById("reg-password2");

    const btnLogout = document.getElementById("btn-logout");

    // === Элементы основного приложения ===
    const form = document.getElementById("transaction-form");
    const transactionList = document.getElementById("transaction-list");
    const totalIncomeEl = document.getElementById("total-income");
    const totalExpenseEl = document.getElementById("total-expense");
    const balanceEl = document.getElementById("balance");

    // Текущий залогиненный пользователь
    let currentUser = null;
    // Массив транзакций для текущего пользователя
    let transactions = [];

    // ==== Работа с пользователями в localStorage ====

    // Структура в localStorage:
    // key: "users" → value: JSON.stringify({ "user1": "пароль1", "user2": "пароль2", ... })
    // key: "transactions_user1" → value: JSON.stringify([...])
    // key: "currentUser" → value: "user1" (имя текущего пользователя)

    // Получить список пользователей (объект)
    function getAllUsers() {
        const usersJSON = localStorage.getItem("users");
        return usersJSON ? JSON.parse(usersJSON) : {};
    }

    // Сохранить список пользователей
    function saveAllUsers(obj) {
        localStorage.setItem("users", JSON.stringify(obj));
    }

    // Сохранить текущего пользователя
    function setCurrentUser(username) {
        currentUser = username;
        localStorage.setItem("currentUser", username);
    }

    // Получить текущего пользователя из localStorage (если есть)
    function loadCurrentUser() {
        const stored = localStorage.getItem("currentUser");
        if (stored) currentUser = stored;
    }

    // Удалить текущего пользователя (logout)
    function clearCurrentUser() {
        currentUser = null;
        localStorage.removeItem("currentUser");
    }

    // ==== Переключение вкладок Login / Register ====

    tabLogin.addEventListener("click", () => {
        tabLogin.classList.add("active");
        tabRegister.classList.remove("active");
        loginForm.style.display = "flex";
        registerForm.style.display = "none";
        authMessage.textContent = "";
    });

    tabRegister.addEventListener("click", () => {
        tabRegister.classList.add("active");
        tabLogin.classList.remove("active");
        registerForm.style.display = "flex";
        loginForm.style.display = "none";
        authMessage.textContent = "";
    });

    // ==== Регистрация нового пользователя ====

    registerForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const username = regUsernameInput.value.trim();
        const password = regPasswordInput.value;
        const password2 = regPassword2Input.value;

        if (username.length < 1) {
            authMessage.textContent = "Логин толтыру керек.";
            return;
        }
        if (password.length < 2) {
            authMessage.textContent = "Құпия сөз кем дегенде 2 таңбадан тұру керек.";
            return;
        }
        if (password !== password2) {
            authMessage.textContent = "Құпия сөздер сәйкес келмейді.";
            return;
        }

        const users = getAllUsers();
        if (users[username]) {
            authMessage.textContent = "Бұл логин бұрыннан бар.";
            return;
        }

        // Сохраняем нового пользователя
        users[username] = password;
        saveAllUsers(users);

        // Инициализируем пустые транзакции
        localStorage.setItem(`transactions_${username}`, JSON.stringify([]));

        // Логиним автоматически
        setCurrentUser(username);
        initApp();
    });

    // ==== Вход для существующего пользователя ====

    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const username = loginUsernameInput.value.trim();
        const password = loginPasswordInput.value;

        const users = getAllUsers();
        if (!users[username]) {
            authMessage.textContent = "Пайдаланушы табылмады.";
            return;
        }
        if (users[username] !== password) {
            authMessage.textContent = "Құпия сөз қате.";
            return;
        }
        // Успешный вход
        setCurrentUser(username);
        initApp();
    });

    // ==== Logout ====

    btnLogout.addEventListener("click", () => {
        clearCurrentUser();
        // Скрываем приложение, показываем форму авторизации
        appSection.style.display = "none";
        authSection.style.display = "block";
        // Очистим поля форм
        loginForm.reset();
        registerForm.reset();
        // Вернём активную вкладку на «Кіру»
        tabLogin.click();
    });

    // ==== Загрузка транзакций для текущего пользователя ====

    function loadTransactions() {
        const json = localStorage.getItem(`transactions_${currentUser}`);
        transactions = json ? JSON.parse(json) : [];
    }

    function saveTransactions() {
        localStorage.setItem(`transactions_${currentUser}`, JSON.stringify(transactions));
    }

    // ==== Инициализация приложения после входа ====

    function initApp() {
        // Скрываем форму авторизации, показываем основное приложение
        authSection.style.display = "none";
        appSection.style.display = "block";
        authMessage.textContent = "";

        // Загружаем транзакции и рендерим
        loadTransactions();
        renderTransactions();
        updateSummary();
    }

    // ==== Рендер списка транзакций ====

    function renderTransactions() {
        transactionList.innerHTML = "";
        transactions.forEach((t, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${t.date}</td>
                <td>${t.amount.toLocaleString()} ₸</td>
                <td>${t.type === "income" ? "Табыс" : "Шығын"}</td>
                <td>${t.category}</td>
                <td><button class="delete-btn" data-index="${index}">Өшіру</button></td>
            `;
            transactionList.appendChild(row);
        });

        // Обработка удаления
        document.querySelectorAll(".delete-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const idx = parseInt(btn.getAttribute("data-index"));
                transactions.splice(idx, 1);
                saveTransactions();
                renderTransactions();
                updateSummary();
            });
        });
    }

    // ==== Обновление итогов (баланс) ====

    function updateSummary() {
        let totalIncome = 0;
        let totalExpense = 0;
        transactions.forEach(t => {
            if (t.type === "income") totalIncome += t.amount;
            else totalExpense += t.amount;
        });
        const balance = totalIncome - totalExpense;

        totalIncomeEl.textContent = totalIncome.toLocaleString();
        totalExpenseEl.textContent = totalExpense.toLocaleString();
        balanceEl.textContent = balance.toLocaleString();
    }

    // ==== Обработка добавления новой транзакции ====

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const amountValue = parseFloat(document.getElementById("amount").value);
        const typeValue = document.getElementById("type").value;
        const categoryValue = document.getElementById("category").value.trim();

        if (isNaN(amountValue) || categoryValue === "") {
            alert("Барлық өрістерді дұрыс толтырыңыз!");
            return;
        }

        const now = new Date();
        const dateString = now.toLocaleDateString("kk-KZ", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });

        const transaction = {
            date: dateString,
            amount: amountValue,
            type: typeValue,
            category: categoryValue
        };

        transactions.push(transaction);
        saveTransactions();
        renderTransactions();
        updateSummary();
        form.reset();
    });

    // ==== При загрузке страницы: проверяем, залогинен ли уже пользователь ====

    loadCurrentUser();
    if (currentUser) {
        initApp();
    } else {
        // Если нет — показываем форму авторизации
        authSection.style.display = "block";
        tabLogin.click(); // Вкладка «Кіру» активна
    }
});
