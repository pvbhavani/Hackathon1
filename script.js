const STORAGE_KEYS = {
  users: 'ai-diet-planner-users',
  currentUser: 'ai-diet-planner-current-user',
  generatedPlan: 'ai-diet-planner-plan'
};

const state = {
  users: [],
  currentUser: null,
  generatedPlan: null
};

const appState = {
  currentView: 'auth'
};

const mealTemplates = {
  'North Indian': {
    budget: [
      { meal: 'Breakfast', dish: 'Masala oats with banana' },
      { meal: 'Lunch', dish: 'Moong dal khichdi with cucumber salad' },
      { meal: 'Dinner', dish: 'Paneer bhurji with roti' }
    ],
    standard: [
      { meal: 'Breakfast', dish: 'Besan chilla with yogurt' },
      { meal: 'Lunch', dish: 'Dal tadka with brown rice' },
      { meal: 'Dinner', dish: 'Chicken tikka with roasted vegetables' }
    ]
  },
  'South Indian': {
    budget: [
      { meal: 'Breakfast', dish: 'Idli with sambar' },
      { meal: 'Lunch', dish: 'Coconut rice with dal' },
      { meal: 'Dinner', dish: 'Vegetable curry with millet dosa' }
    ],
    standard: [
      { meal: 'Breakfast', dish: 'Egg dosa with chutney' },
      { meal: 'Lunch', dish: 'Fish curry with brown rice' },
      { meal: 'Dinner', dish: 'Chicken stew with quinoa' }
    ]
  },
  'East Indian': {
    budget: [
      { meal: 'Breakfast', dish: 'Poha with peanuts' },
      { meal: 'Lunch', dish: 'Lentil stew with rice' },
      { meal: 'Dinner', dish: 'Vegetable stir-fry with chapati' }
    ],
    standard: [
      { meal: 'Breakfast', dish: 'Egg bhurji with toast' },
      { meal: 'Lunch', dish: 'Bengali fish curry with rice' },
      { meal: 'Dinner', dish: 'Chicken jalfrezi with millet' }
    ]
  },
  'West Indian': {
    budget: [
      { meal: 'Breakfast', dish: 'Upma with sprouts' },
      { meal: 'Lunch', dish: 'Rajma with rice' },
      { meal: 'Dinner', dish: 'Vegetable pulao with yogurt' }
    ],
    standard: [
      { meal: 'Breakfast', dish: 'Avocado toast with eggs' },
      { meal: 'Lunch', dish: 'Chicken khichdi with salad' },
      { meal: 'Dinner', dish: 'Paneer tikka with quinoa' }
    ]
  }
};

function hydrateState() {
  state.users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]');
  state.currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.currentUser) || 'null');
  state.generatedPlan = JSON.parse(localStorage.getItem(STORAGE_KEYS.generatedPlan) || 'null');
}

function persistState() {
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(state.users));
  if (state.currentUser) {
    localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(state.currentUser));
  } else {
    localStorage.removeItem(STORAGE_KEYS.currentUser);
  }
  if (state.generatedPlan) {
    localStorage.setItem(STORAGE_KEYS.generatedPlan, JSON.stringify(state.generatedPlan));
  } else {
    localStorage.removeItem(STORAGE_KEYS.generatedPlan);
  }
}

function setupEventListeners() {
  document.getElementById('showRegisterBtn').addEventListener('click', () => switchAuthView('register'));
  document.getElementById('showLoginBtn').addEventListener('click', () => switchAuthView('login'));
  document.getElementById('registerForm').addEventListener('submit', handleRegister);
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('plannerForm').addEventListener('submit', handlePlannerSubmit);
  document.getElementById('progressButton').addEventListener('click', () => showView('progress'));
  document.getElementById('logoutButton').addEventListener('click', handleLogout);
}

function switchAuthView(type) {
  document.getElementById('registerForm').classList.toggle('hidden', type !== 'register');
  document.getElementById('loginForm').classList.toggle('hidden', type !== 'login');
  document.getElementById('showRegisterBtn').classList.toggle('active', type === 'register');
  document.getElementById('showLoginBtn').classList.toggle('active', type === 'login');
  document.getElementById('authTitle').textContent = type === 'register' ? 'Create your account' : 'Welcome back';
}

function handleRegister(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const payload = {
    name: formData.get('name').toString().trim(),
    email: formData.get('email').toString().trim(),
    password: formData.get('password').toString(),
    age: Number(formData.get('age')),
    weight: Number(formData.get('weight')),
    goal: formData.get('goal'),
    budget: formData.get('budget'),
    region: formData.get('region'),
    foodType: formData.get('foodType') || 'Veg',
    healthConditions: Array.from(formData.getAll('healthConditions')),
    createdAt: new Date().toISOString()
  };

  if (state.users.some((user) => user.email.toLowerCase() === payload.email.toLowerCase())) {
    alert('An account already exists for this email. Please log in instead.');
    return;
  }

  state.users.push(payload);
  state.currentUser = payload;
  persistState();
  renderApp();
  showView('dashboard');
  alert(`Welcome, ${payload.name}! Your plan is ready to build.`);
}

function handleLogin(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const email = formData.get('email').toString().trim().toLowerCase();
  const password = formData.get('password').toString();
  const match = state.users.find((user) => user.email.toLowerCase() === email && user.password === password);

  if (!match) {
    alert('Invalid credentials. Please try again or register first.');
    return;
  }

  state.currentUser = match;
  persistState();
  renderApp();
  showView('dashboard');
}

function handlePlannerSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const payload = {
    age: Number(formData.get('age')),
    weight: Number(formData.get('weight')),
    goal: formData.get('goal'),
    budget: formData.get('budget'),
    health: Array.from(formData.getAll('health')),
    region: formData.get('region'),
    foodType: formData.get('foodType') || 'Veg'
  };

  const plan = generatePlan(payload);
  state.generatedPlan = plan;
  persistState();
  renderWeeklyPlan(plan);
  renderProgress(plan);
  showView('weekly');
}

function handleLogout() {
  state.currentUser = null;
  persistState();
  renderApp();
  showView('auth');
  switchAuthView('register');
}

function generatePlan(profile) {
  const targetCalories = calculateTarget(profile);
  const template = mealTemplates[profile.region][profile.budget] || mealTemplates['North Indian'].budget;
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const plan = days.map((day, index) => {
    const base = template[index % template.length];
    const adjustedDish = applyHealthAdjustments(base.dish, profile.health);
    const foodStyleDish = applyFoodType(adjustedDish, profile.foodType);
    const calories = targetCalories + (index % 3 === 0 ? 80 : -60) + (profile.goal === 'loss' ? -120 : profile.goal === 'gain' ? 110 : 0);
    return {
      day,
      breakfast: foodStyleDish,
      lunch: profile.budget === 'budget-friendly'
        ? `Budget ${base.meal.toLowerCase()} bowl with seasonal vegetables`
        : `Balanced ${base.meal.toLowerCase()} plate with protein`,
      dinner: profile.goal === 'loss'
        ? 'Light dinner with salad and lentils'
        : 'Protein-rich dinner with healthy carbs',
      snack: 'Fruit or yogurt cup',
      calories: Math.max(1400, calories),
      portions: profile.goal === 'loss' ? 'Light' : profile.goal === 'gain' ? 'Balanced' : 'Moderate'
    };
  });

  return {
    profile,
    targetCalories,
    generatedAt: new Date().toISOString(),
    days: plan,
    points: 320 + (profile.goal === 'loss' ? 35 : 20),
    streak: 7,
    badges: ['First Plan', 'Consistency Starter', profile.health.length ? 'Health Aware' : 'Balanced Eating']
  };
}

function calculateTarget(profile) {
  const base = (profile.weight * 11 + profile.age * 5) / 1.2;
  const goalAdjustment = profile.goal === 'loss' ? -250 : profile.goal === 'gain' ? 220 : 0;
  const budgetAdjustment = profile.budget === 'budget-friendly' ? -80 : 0;
  const healthAdjustment = profile.health.includes('diabetes') ? -60 : 0;
  return Math.round(base + goalAdjustment + budgetAdjustment + healthAdjustment);
}

function applyFoodType(dish, foodType) {
  if (foodType === 'Vegan') return `${dish} with plant-based protein`;
  if (foodType === 'Non-Veg') return `${dish} with lean protein`;
  if (foodType === 'Other') return `${dish} with flexible ingredient swaps`;
  return dish;
}

function applyHealthAdjustments(dish, health) {
  if (health.includes('diabetes')) return `${dish} with extra greens`;
  if (health.includes('pcos')) return `${dish} with added protein`;
  if (health.includes('thyroid')) return `${dish} with iodine-rich veggies`;
  if (health.includes('heart health')) return `${dish} with less oil`;
  return dish;
}

function renderApp() {
  hydrateState();
  const loggedIn = Boolean(state.currentUser);
  document.getElementById('logoutButton').classList.toggle('hidden', !loggedIn);
  document.getElementById('authSection').classList.toggle('hidden', loggedIn);
  document.getElementById('dashboardSection').classList.toggle('hidden', !loggedIn);
  document.getElementById('weeklySection').classList.toggle('hidden', !loggedIn || !state.generatedPlan);
  document.getElementById('progressSection').classList.toggle('hidden', !loggedIn || !state.generatedPlan);
  document.getElementById('heroCalories').textContent = state.currentUser ? 'Personalized' : '1,800';
  document.getElementById('registeredCount').textContent = state.users.length;
  if (!loggedIn) {
    return;
  }

  document.getElementById('welcomeName').textContent = `Welcome, ${state.currentUser.name}`;
  const isAdmin = state.currentUser.email === 'admin@ai-diet.com';
  document.getElementById('adminBadge').classList.toggle('hidden', !isAdmin);
  document.getElementById('adminPanel').classList.toggle('hidden', !isAdmin);
  if (isAdmin) {
    renderAdminStats();
  }

  document.getElementById('plannerAge').value = state.currentUser.age || '';
  document.getElementById('plannerWeight').value = state.currentUser.weight || '';
  document.getElementById('plannerGoal').value = state.currentUser.goal || 'maintenance';
  document.getElementById('plannerBudget').value = state.currentUser.budget || 'budget-friendly';
  document.getElementById('plannerRegion').value = state.currentUser.region || 'North Indian';
  document.getElementById('plannerFoodType').value = state.currentUser.foodType || 'Veg';

  const target = state.generatedPlan?.targetCalories || calculateTarget({
    age: state.currentUser.age,
    weight: state.currentUser.weight,
    goal: state.currentUser.goal,
    budget: state.currentUser.budget,
    health: state.currentUser.healthConditions || [],
    region: state.currentUser.region
  });
  document.getElementById('targetCalories').textContent = `${target} kcal`;
  document.getElementById('proteinFocus').textContent = state.currentUser.healthConditions?.length ? 'Health-aware' : 'Balanced';
  document.getElementById('goalBar').style.width = `${Math.min(100, 70 + (state.generatedPlan ? 15 : 0))}%`;
  document.getElementById('goalText').textContent = state.generatedPlan
    ? 'Your AI-generated weekly plan is ready and ready to track.'
    : 'A tailored weekly plan will appear after you generate it.';

  if (state.generatedPlan) {
    renderWeeklyPlan(state.generatedPlan);
    renderProgress(state.generatedPlan);
  }
}

function renderWeeklyPlan(plan) {
  const container = document.getElementById('weeklyPlanGrid');
  container.innerHTML = plan.days.map((day) => `
    <article class="day-card">
      <h4>${day.day}</h4>
      <div class="meal-line"><strong>Breakfast</strong><span>${day.breakfast}</span></div>
      <div class="meal-line"><strong>Lunch</strong><span>${day.lunch}</span></div>
      <div class="meal-line"><strong>Dinner</strong><span>${day.dinner}</span></div>
      <div class="meal-line"><strong>Snack</strong><span>${day.snack}</span></div>
      <div class="meal-line"><strong>Calories</strong><span>${day.calories} kcal</span></div>
      <div class="meal-line"><strong>Portion</strong><span>${day.portions}</span></div>
      <div class="day-actions">
        <button>Swap dish</button>
        <button>Adjust portion</button>
        <button>Add favorite</button>
      </div>
    </article>
  `).join('');
}

function renderProgress(plan) {
  const chart = document.getElementById('calorieChart');
  const lineValues = plan.days.map((day) => day.calories);
  const maxValue = Math.max(...lineValues) + 100;
  const points = lineValues.map((value, index) => `${20 + index * 42},${160 - (value / maxValue) * 120}`).join(' ');
  chart.innerHTML = `
    <line x1="12" y1="140" x2="300" y2="140" stroke="#dfe9df" stroke-width="2"></line>
    <polyline fill="none" stroke="#2f8f5b" stroke-width="4" points="${points}"></polyline>
    ${lineValues.map((value, index) => `<circle cx="${20 + index * 42}" cy="${160 - (value / maxValue) * 120}" r="5" fill="#1e6b43"></circle>`).join('')}
    ${lineValues.map((value, index) => `<text x="${20 + index * 42}" y="155" text-anchor="middle" fill="#5f7368" font-size="10">${plan.days[index].day}</text>`).join('')}
  `;

  const nutritionBars = document.getElementById('nutritionBars');
  const bars = [
    { label: 'Protein', value: 78 },
    { label: 'Fiber', value: 70 },
    { label: 'Hydration', value: 84 },
    { label: 'Balance', value: 90 }
  ];
  nutritionBars.innerHTML = bars.map((bar) => `
    <div class="bar" style="height:${bar.value}%">
      <span>${bar.label}</span>
    </div>
  `).join('');

  document.getElementById('achievementList').innerHTML = plan.badges.map((badge) => `<li>🏅 ${badge}</li>`).join('');
  document.getElementById('pointsValue').textContent = plan.points;
}

function renderAdminStats() {
  const totalUsers = state.users.length;
  const newToday = state.users.filter((user) => user.createdAt?.slice(0, 10) === new Date().toISOString().slice(0, 10)).length;
  const weeklyTrend = Math.max(1, Math.round(totalUsers / 2));
  const monthlyTrend = Math.max(2, Math.round(totalUsers * 1.5));
  document.getElementById('totalUsers').textContent = totalUsers;
  document.getElementById('newUsersToday').textContent = newToday;
  document.getElementById('weeklyTrend').textContent = `${weeklyTrend} users`;
  document.getElementById('monthlyTrend').textContent = `${monthlyTrend} users`;
}

function showView(view) {
  const views = {
    auth: document.getElementById('authSection'),
    dashboard: document.getElementById('dashboardSection'),
    weekly: document.getElementById('weeklySection'),
    progress: document.getElementById('progressSection')
  };
  Object.entries(views).forEach(([key, element]) => {
    element.classList.toggle('hidden', key !== view);
  });
  appState.currentView = view;
}

window.addEventListener('DOMContentLoaded', () => {
  hydrateState();
  setupEventListeners();
  renderApp();
  switchAuthView('register');
  if (state.currentUser) {
    showView('dashboard');
  }
});
