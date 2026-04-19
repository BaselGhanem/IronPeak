// --- Global State & Config ---
const CUSTOM_LOGO_URL = "https://raw.githubusercontent.com/BaselGhanem/IronPeak/refs/heads/main/GoldenPeakLogo.png";
const DEFAULT_PARTNERS = {
  omar: { id: 'omar', pass: '2026', role: 'partner', nameAr: 'عمر', nameEn: 'Omar', color: '#10b981', percentage: 50 },
  rakan: { id: 'rakan', pass: '2026', role: 'partner', nameAr: 'راكان', nameEn: 'Rakan', color: '#D4AF37', percentage: 30 },
  mohammad: { id: 'mohammad', pass: '2026', role: 'partner', nameAr: 'محمد', nameEn: 'Mohammad', color: '#3b82f6', percentage: 20 }
};
const ADMIN_USER = { id: 'admin', pass: 'admin2026', role: 'admin', nameAr: 'مدير النظام', nameEn: 'Admin' };

let ironPeakLang = localStorage.getItem('ironPeakLang') || 'ar';
let currentTheme = localStorage.getItem('ironPeakTheme') || 'dark';
let partners = JSON.parse(localStorage.getItem('goldenPeakPartners')) || DEFAULT_PARTNERS;
let profits = [];
let filteredProfits = [];
let platformSettings = { telegramLink: 'https://t.me/goldenpeak', platformEmail: 'support@goldenpeak.com', youtubeVideos: [] };
let currentUser = JSON.parse(sessionStorage.getItem('goldenPeakUser')) || null;
 
let monthlyChartInstance = null, dailyChartInstance = null;
let currentMarketSymbol = 'OANDA:XAUUSD';

// Firebase references
let db, Timestamp;
if (window.firebaseDB) { db = window.firebaseDB; Timestamp = window.firebaseTimestamp; }

// Dictionary
const dict = {
  ar: {
    signIn: "تسجيل الدخول", heroTitle: "منصتك المالية المتكاملة", heroDesc: "انضم إلى GoldenPeak Capital واستفد من أحدث التحليلات والأسواق العالمية.",
    getStarted: "ابدأ الآن", loginTitle: "تسجيل الدخول", username: "اسم المستخدم", password: "كلمة المرور", loginBtn: "دخول آمن",
    navAnalytics: "لوحة القيادة", navInput: "إدخال أرباح", navMarket: "الأسواق", navHistory: "السجل المالي", navTelegram: "رابط التلجرام", navAdmin: "الإعدادات",
    inputTitle: "إدخال أرباح جديدة", inputDesc: "أدخل صافي الأرباح ليتم توزيعها", date: "التاريخ", saveBtn: "اعتماد وحفظ", updateBtn: "تحديث", cancelEdit: "إلغاء",
    chartMonthly: "الأداء الشهري للشركاء", chartDaily: "نمو الأرباح اليومي والتراكمي",
    historyTitle: "السجل المالي", exportBtn: "تصدير Excel", filterFrom: "من", filterTo: "إلى", applyFilter: "تصفية", resetFilter: "إلغاء",
    thDate: "التاريخ", thMonth: "الشهر", thNet: "الصافي", thActions: "إجراءات", emptyData: "لا توجد بيانات", currency: "JD",
    totalProfit: "إجمالي الأرباح", activeDays: "أيام التداول", partnerManagement: "إدارة الشركاء", addPartner: "إضافة شريك",
    distributePercentages: "توزيع النسب", totalSum: "المجموع", savePercBtn: "اعتماد النسب",
    platformSettings: "إعدادات المنصة", telegramLinkLabel: "رابط التلجرام", platformEmailLabel: "البريد الإلكتروني",
    telegramTitle: "انضم لقناتنا على تيليجرام", telegramDesc: "آخر التحديثات", joinTelegram: "انضم الآن",
    succLogin: "تم الدخول", succSave: "تم الحفظ", succUpdate: "تم التحديث", succDelete: "تم الحذف",
    errLogin: "بيانات غير صحيحة", errFill: "املأ الحقول"
  },
  en: {
    signIn: "Sign In", heroTitle: "Integrated Financial Platform", heroDesc: "Join GoldenPeak Capital.",
    getStarted: "Get Started", loginTitle: "Sign In", username: "Username", password: "Password", loginBtn: "Sign In",
    navAnalytics: "Dashboard", navInput: "Add Profit", navMarket: "Markets", navHistory: "History", navTelegram: "Telegram", navAdmin: "Settings",
    inputTitle: "New Profit Entry", inputDesc: "Enter and distribute net profit", date: "Date", saveBtn: "Save", updateBtn: "Update", cancelEdit: "Cancel",
    chartMonthly: "Monthly Partner Performance", chartDaily: "Daily & Cumulative Profit",
    historyTitle: "Financial History", exportBtn: "Export Excel", filterFrom: "From", filterTo: "To", applyFilter: "Filter", resetFilter: "Reset",
    thDate: "Date", thMonth: "Month", thNet: "Net", thActions: "Actions", emptyData: "No data", currency: "JD",
    totalProfit: "Total Profit", activeDays: "Active Days", partnerManagement: "Partner Management", addPartner: "Add Partner",
    distributePercentages: "Distribute Percentages", totalSum: "Total", savePercBtn: "Save Percentages",
    platformSettings: "Platform Settings", telegramLinkLabel: "Telegram Link", platformEmailLabel: "Email",
    telegramTitle: "Join our Telegram", telegramDesc: "Latest updates", joinTelegram: "Join Now",
    succLogin: "Login successful", succSave: "Saved", succUpdate: "Updated", succDelete: "Deleted",
    errLogin: "Invalid credentials", errFill: "Fill all fields"
  }
};

// --- Initialize ---
async function init() {
  document.documentElement.setAttribute('data-theme', currentTheme);
  applyLanguage(ironPeakLang);
  updateThemeIcon();
  await loadPlatformSettings();
  if (currentUser) {
    showApp();
  } else {
    document.getElementById('landingPage').style.display = 'block';
    document.getElementById('appContainer').style.display = 'none';
    renderLandingTips();
  }
  if (db) await syncPartnersWithFirestore();
}

async function syncPartnersWithFirestore() {
  try {
    const snapshot = await getDocs(collection(db, 'partners'));
    if (!snapshot.empty) {
      const firestorePartners = {};
      snapshot.forEach(doc => { firestorePartners[doc.id] = doc.data(); });
      partners = firestorePartners;
      localStorage.setItem('goldenPeakPartners', JSON.stringify(partners));
    } else {
      // Seed default partners
      for (const [id, data] of Object.entries(DEFAULT_PARTNERS)) {
        await setDoc(doc(db, 'partners', id), data);
      }
    }
    await loadProfitsFromFirestore();
  } catch (e) { console.warn("Firestore sync error", e); }
}

async function loadProfitsFromFirestore() {
  try {
    const q = query(collection(db, 'profits'), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    profits = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    filteredProfits = [...profits];
  } catch (e) { console.warn("Load profits error", e); }
}

async function loadPlatformSettings() {
  if (!db) return;
  try {
    const docSnap = await getDoc(doc(db, 'settings', 'platform'));
    if (docSnap.exists()) platformSettings = docSnap.data();
    else await setDoc(doc(db, 'settings', 'platform'), platformSettings);
    updateTelegramLink();
  } catch (e) {}
}

// --- UI Helpers ---
function renderLandingTips() {
  document.getElementById('tipsGrid').innerHTML = `
    <div class="tip-card"><i class="fa-solid fa-chart-line"></i><h3>تحليل السوق</h3><p>تعلم قراءة الرسوم البيانية</p></div>
    <div class="tip-card"><i class="fa-solid fa-shield"></i><h3>إدارة المخاطر</h3><p>لا تخاطر بأكثر مما تتحمل</p></div>
    <div class="tip-card"><i class="fa-solid fa-arrows-spin"></i><h3>التنويع</h3><p>وزع استثماراتك</p></div>
  `;
}

function openLoginModal() { document.getElementById('loginModal').classList.add('active'); }
function closeLoginModal() { document.getElementById('loginModal').classList.remove('active'); }

document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;
  let authUser = null;
  if (username === ADMIN_USER.id && password === ADMIN_USER.pass) authUser = ADMIN_USER;
  else if (partners[username] && partners[username].pass === password) authUser = partners[username];
  if (authUser) {
    currentUser = authUser;
    sessionStorage.setItem('goldenPeakUser', JSON.stringify(currentUser));
    showToast(dict[ironPeakLang].succLogin);
    closeLoginModal();
    showApp();
  } else {
    showToast(dict[ironPeakLang].errLogin, 'error');
  }
});

function showApp() {
  document.getElementById('landingPage').style.display = 'none';
  document.getElementById('appContainer').style.display = 'block';
  renderNavigation();
  updateUserProfile();
  setSmartGreeting();
  renderDynamicUI();
  if (currentUser.role === 'admin') renderPartnerList();
  switchTab('analytics');
}

function logout() { sessionStorage.removeItem('goldenPeakUser'); location.reload(); }

function renderNavigation() {
  const isAdmin = currentUser.role === 'admin';
  const tabs = [
    { id: 'analytics', icon: 'fa-chart-pie', i18n: 'navAnalytics' },
    { id: 'input', icon: 'fa-pen-nib', i18n: 'navInput', admin: true },
    { id: 'market', icon: 'fa-chart-line', i18n: 'navMarket' },
    { id: 'transactions', icon: 'fa-clock-rotate-left', i18n: 'navHistory' },
    { id: 'telegram', icon: 'fa-brands fa-telegram', i18n: 'navTelegram' },
    { id: 'admin', icon: 'fa-user-gear', i18n: 'navAdmin', admin: true }
  ];
  document.getElementById('navMenu').innerHTML = tabs.filter(t => !t.admin || isAdmin).map(t => `
    <button class="nav-link ${t.id==='analytics'?'active':''}" onclick="switchTab('${t.id}')">
      <i class="fa-solid ${t.icon}"></i> <span class="tab-text" data-i18n="${t.i18n}">${dict[ironPeakLang][t.i18n]}</span>
    </button>
  `).join('');
  applyLanguage(ironPeakLang);
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  document.querySelector(`[onclick="switchTab('${tabId}')"]`)?.classList.add('active');
  if (tabId === 'analytics') updateAnalytics();
  else if (tabId === 'transactions') { renderTableHeaders(); applyFilter(); }
  else if (tabId === 'market' && !document.getElementById('tv_script')) loadMarket(currentMarketSymbol);
  else if (tabId === 'admin' && currentUser.role === 'admin') { renderPartnerList(); populateSettingsForm(); }
}

/* ==================== الدوال الكاملة ==================== */
// ضع هذه الدوال داخل وسم <script> بعد الدوال الأساسية (init, syncPartnersWithFirestore, etc.)

// --- تطبيق اللغة ---
function applyLanguage(lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[lang]?.[key]) el.innerText = dict[lang][key];
  });
  if (currentUser) {
    document.getElementById('currentUserDisplay') && (document.getElementById('currentUserDisplay').innerText = lang === 'ar' ? currentUser.nameAr : currentUser.nameEn);
  }
}

// --- السمة (Dark/Light) ---
function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  localStorage.setItem('ironPeakTheme', currentTheme);
  updateThemeIcon();
  if (monthlyChartInstance) updateAnalytics();
}
function updateThemeIcon() {
  const btn = document.getElementById('themeBtn');
  if (btn) btn.innerHTML = currentTheme === 'dark' ? '<i class="fa-regular fa-sun"></i>' : '<i class="fa-regular fa-moon"></i>';
}
function toggleLanguage() {
  ironPeakLang = ironPeakLang === 'ar' ? 'en' : 'ar';
  localStorage.setItem('ironPeakLang', ironPeakLang);
  applyLanguage(ironPeakLang);
  if (currentUser) { renderDynamicUI(); setSmartGreeting(); renderTableHeaders(); }
}

// --- Toast ---
function showToast(msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (container.children.length >= 3) container.removeChild(container.firstChild);
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<div class="toast-content"><i class="fa-solid fa-${type==='success'?'circle-check':'circle-exclamation'}"></i> <span>${msg}</span></div><div class="toast-progress"><div class="toast-progress-bar" style="animation-duration:3.5s;"></div></div>`;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 3500);
}

// --- تحديث واجهة المستخدم ---
function updateUserProfile() {
  const container = document.getElementById('userProfileNav');
  const img = currentUser?.profileImageUrl ? `<img src="${currentUser.profileImageUrl}" class="user-avatar">` : '';
  container.innerHTML = `${img}<span>${currentUser?.nameAr || currentUser?.id}</span>`;
}
function setSmartGreeting() {
  const hour = new Date().getHours();
  let greet = hour < 12 ? 'صباح الخير' : hour < 17 ? 'طاب مساؤك' : 'مساء الخير';
  document.getElementById('greetingArea').innerHTML = `<h1>${greet}، <span style="color:var(--gold-premium)">${currentUser.nameAr}</span></h1><p>ملخص الأداء المالي</p>`;
}

// --- عرض ديناميكي لحقول الشركاء في نموذج الإدخال ---
function renderDynamicUI() {
  renderEntryForm();
  renderTableHeaders();
  if (currentUser.role === 'admin') renderAdminPercentages();
}
function renderEntryForm() {
  const container = document.getElementById('dynamicPartnerInputs');
  container.innerHTML = '';
  Object.values(partners).forEach(p => {
    container.innerHTML += `
      <div class="form-group">
        <div class="stepper-wrapper">
          <label class="stepper-label" style="color:${p.color}">${p.nameAr} (${p.percentage}%)</label>
          <button type="button" class="stepper-btn" onclick="stepValue('profit_${p.id}', -10)">-</button>
          <input type="number" id="profit_${p.id}" class="stepper-input profit-input" step="0.01" placeholder="0.00">
          <button type="button" class="stepper-btn" onclick="stepValue('profit_${p.id}', 10)">+</button>
        </div>
      </div>`;
  });
  setupEntryListeners();
}
function stepValue(id, amount) {
  const inp = document.getElementById(id);
  inp.value = (parseFloat(inp.value) || 0) + amount;
  calculateLiveTotal();
}
function setupEntryListeners() {
  document.querySelectorAll('.profit-input').forEach(i => i.addEventListener('input', calculateLiveTotal));
  document.getElementById('masterNetProfit').addEventListener('input', function() {
    const total = parseFloat(this.value) || 0;
    Object.values(partners).forEach(p => {
      const inp = document.getElementById(`profit_${p.id}`);
      if (inp) inp.value = (total * p.percentage / 100).toFixed(2);
    });
    calculateLiveTotal();
  });
}
function calculateLiveTotal() {
  let sum = 0;
  document.querySelectorAll('.profit-input').forEach(i => sum += parseFloat(i.value) || 0);
  document.getElementById('liveTotalAmount').innerHTML = `${sum.toFixed(2)} <small>JD</small>`;
}

// --- إدخال الأرباح (حفظ / تعديل) ---
document.getElementById('entryForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const editId = document.getElementById('editEntryId').value;
  const date = document.getElementById('date').value;
  const monthAr = new Date(date).toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
  const monthEn = new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  let total = 0;
  const partnerProfits = {};
  Object.keys(partners).forEach(id => {
    const val = parseFloat(document.getElementById(`profit_${id}`).value) || 0;
    partnerProfits[id] = val;
    total += val;
  });
  const entry = { date, monthAr, monthEn, netProfit: total, profits: partnerProfits, timestamp: new Date(date).getTime() };
  try {
    if (editId) {
      await updateDoc(doc(db, 'profits', editId), entry);
      showToast(dict[ironPeakLang].succUpdate);
    } else {
      await addDoc(collection(db, 'profits'), entry);
      showToast(dict[ironPeakLang].succSave);
    }
    await loadProfitsFromFirestore();
    this.reset();
    document.getElementById('date').valueAsDate = new Date();
    cancelEditing();
    if (document.getElementById('transactions').classList.contains('active')) applyFilter();
    if (document.getElementById('analytics').classList.contains('active')) updateAnalytics();
  } catch (e) { showToast(e.message, 'error'); }
});
function editEntry(id) {
  const entry = profits.find(p => p.id === id);
  if (!entry) return;
  switchTab('input');
  document.getElementById('editEntryId').value = id;
  document.getElementById('date').value = entry.date;
  Object.keys(partners).forEach(pid => {
    document.getElementById(`profit_${pid}`).value = entry.profits[pid] || 0;
  });
  calculateLiveTotal();
  document.getElementById('formMainTitle').innerText = 'تعديل حركة';
  document.getElementById('saveDataBtn').innerHTML = '<i class="fa-solid fa-pen"></i> تحديث';
  document.getElementById('cancelEditBtn').style.display = 'flex';
}
function cancelEditing() {
  document.getElementById('entryForm').reset();
  document.getElementById('editEntryId').value = '';
  document.getElementById('date').valueAsDate = new Date();
  document.getElementById('formMainTitle').innerText = dict[ironPeakLang].inputTitle;
  document.getElementById('saveDataBtn').innerHTML = `<i class="fa-solid fa-check-double"></i> ${dict[ironPeakLang].saveBtn}`;
  document.getElementById('cancelEditBtn').style.display = 'none';
}
async function deleteEntry(id) {
  if (!confirm('متأكد؟')) return;
  await deleteDoc(doc(db, 'profits', id));
  await loadProfitsFromFirestore();
  showToast(dict[ironPeakLang].succDelete);
  applyFilter();
}

// --- جدول المعاملات ---
function renderTableHeaders() {
  let html = `<th>${dict[ironPeakLang].thDate}</th><th>${dict[ironPeakLang].thMonth}</th>`;
  Object.values(partners).forEach(p => html += `<th>${p.nameAr}</th><th>%</th>`);
  html += `<th>${dict[ironPeakLang].thNet}</th>`;
  if (currentUser.role === 'admin') html += `<th>${dict[ironPeakLang].thActions}</th>`;
  document.getElementById('tableHeaderRow').innerHTML = html;
}
function applyFilter() {
  const from = document.getElementById('filterFrom').value;
  const to = document.getElementById('filterTo').value;
  filteredProfits = profits.filter(p => (!from || p.date >= from) && (!to || p.date <= to));
  updateTable();
}
function resetFilter() {
  document.getElementById('filterFrom').value = '';
  document.getElementById('filterTo').value = '';
  filteredProfits = [...profits];
  updateTable();
}
function updateTable() {
  const tbody = document.getElementById('tableBody');
  if (!filteredProfits.length) {
    tbody.innerHTML = `<tr><td colspan="10">${dict[ironPeakLang].emptyData}</td></tr>`;
    return;
  }
  tbody.innerHTML = filteredProfits.map(p => {
    let row = `<td>${p.date}</td><td>${p.monthAr}</td>`;
    Object.keys(partners).forEach(pid => {
      const val = p.profits[pid] || 0;
      const perc = p.netProfit ? ((val / p.netProfit) * 100).toFixed(1) : 0;
      row += `<td>${val.toFixed(2)}</td><td><span class="badge" style="color:${partners[pid].color}">${perc}%</span></td>`;
    });
    row += `<td class="net-profit-cell">${p.netProfit.toFixed(2)}</td>`;
    if (currentUser.role === 'admin') row += `<td><div class="row-actions">
      <button class="btn-icon-small edit" onclick="editEntry('${p.id}')"><i class="fa-solid fa-pen"></i></button>
      <button class="btn-icon-small delete" onclick="deleteEntry('${p.id}')"><i class="fa-solid fa-trash-can"></i></button>
    </div></td>`;
    return `<tr>${row}</tr>`;
  }).join('');
}
function exportToExcel() {
  if (!filteredProfits.length) return showToast('لا توجد بيانات', 'error');
  const data = filteredProfits.map(p => {
    const row = { 'التاريخ': p.date, 'الشهر': p.monthAr, 'الصافي': p.netProfit };
    Object.entries(partners).forEach(([id, pData]) => { row[pData.nameAr] = p.profits[id] || 0; });
    return row;
  });
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'الأرباح');
  XLSX.writeFile(wb, `GoldenPeak_${new Date().toISOString().slice(0,10)}.xlsx`);
}

// --- التحليلات والرسوم ---
function updateAnalytics() {
  const grid = document.getElementById('analyticsCardsGrid');
  const total = profits.reduce((s, p) => s + p.netProfit, 0);
  const days = new Set(profits.map(p => p.date)).size;
  const partnerTotals = {};
  Object.keys(partners).forEach(k => partnerTotals[k] = 0);
  profits.forEach(p => Object.keys(partners).forEach(k => partnerTotals[k] += p.profits[k] || 0));
  
  let html = `
    <div class="stat-card premium-card"><i class="fa-solid fa-vault"></i><div class="stat-title">إجمالي الأرباح</div><div class="stat-value">${total.toFixed(2)} JD</div></div>
    <div class="stat-card premium-card"><i class="fa-solid fa-calendar"></i><div class="stat-title">أيام التداول</div><div class="stat-value">${days}</div></div>`;
  Object.entries(partners).forEach(([id, p]) => html += `
    <div class="stat-card premium-card"><i class="fa-solid fa-user" style="color:${p.color}"></i><div class="stat-title">${p.nameAr}</div><div class="stat-value">${partnerTotals[id].toFixed(2)} JD</div></div>`);
  grid.innerHTML = html;
  renderCharts();
}
function renderCharts() {
  // رسم بياني شهري
  const monthly = {};
  profits.forEach(p => {
    const key = p.date.substring(0,7);
    if (!monthly[key]) { monthly[key] = {}; Object.keys(partners).forEach(k => monthly[key][k] = 0); }
    Object.keys(partners).forEach(k => monthly[key][k] += p.profits[k] || 0);
  });
  const labels = Object.keys(monthly).sort();
  const datasets = Object.entries(partners).map(([id, p]) => ({
    label: p.nameAr, data: labels.map(m => monthly[m][id]), backgroundColor: p.color
  }));
  if (monthlyChartInstance) monthlyChartInstance.destroy();
  monthlyChartInstance = new Chart(document.getElementById('monthlyChart'), { type: 'bar', data: { labels, datasets }, options: { responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true } } } });
  
  // رسم يومي تراكمي
  const daily = {};
  profits.forEach(p => daily[p.date] = (daily[p.date] || 0) + p.netProfit);
  const days = Object.keys(daily).sort();
  const values = days.map(d => daily[d]);
  const cumulative = values.reduce((acc, v) => { acc.push((acc.length ? acc[acc.length-1] : 0) + v); return acc; }, []);
  if (dailyChartInstance) dailyChartInstance.destroy();
  dailyChartInstance = new Chart(document.getElementById('dailyCumulativeChart'), {
    type: 'bar', data: { labels: days, datasets: [
      { type: 'line', label: 'تراكمي', data: cumulative, borderColor: '#D4AF37', yAxisID: 'y1' },
      { type: 'bar', label: 'يومي', data: values, backgroundColor: '#00A693' }
    ] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { position: 'left' }, y1: { position: 'right', grid: { drawOnChartArea: false } } } }
  });
}

// --- إدارة الشركاء (Admin) ---
function renderPartnerList() {
  const container = document.getElementById('partnerList');
  container.innerHTML = Object.values(partners).map(p => `
    <div class="partner-item">
      <div class="partner-info">
        <div class="color-dot" style="background:${p.color}"></div>
        ${p.profileImageUrl ? `<img src="${p.profileImageUrl}" class="partner-avatar">` : ''}
        <div><div class="partner-name">${p.nameAr}</div><div>${p.id}</div></div>
      </div>
      <div><button class="btn-icon-small edit" onclick="editPartner('${p.id}')"><i class="fa-solid fa-pen"></i></button>
      <button class="btn-icon-small delete" onclick="deletePartner('${p.id}')"><i class="fa-solid fa-trash"></i></button></div>
    </div>`).join('');
}
function openPartnerModal(partnerId = null) {
  document.getElementById('partnerModal').classList.add('active');
  document.getElementById('partnerForm').reset();
  if (partnerId) {
    const p = partners[partnerId];
    document.getElementById('partnerId').value = partnerId;
    document.getElementById('partnerUsername').value = p.id;
    document.getElementById('partnerPassword').value = p.pass;
    document.getElementById('partnerNameAr').value = p.nameAr;
    document.getElementById('partnerNameEn').value = p.nameEn;
    document.getElementById('partnerColor').value = p.color;
    document.getElementById('partnerModalTitle').innerText = 'تعديل شريك';
  } else {
    document.getElementById('partnerModalTitle').innerText = 'إضافة شريك';
  }
}
function closePartnerModal() { document.getElementById('partnerModal').classList.remove('active'); }
document.getElementById('partnerForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const id = document.getElementById('partnerUsername').value.trim().toLowerCase();
  const existing = partners[id];
  const partnerId = document.getElementById('partnerId').value;
  if (!partnerId && existing) return showToast('اسم المستخدم موجود', 'error');
  
  // معالجة الصورة (تخزين Base64 في localStorage)
  const imageFile = document.getElementById('partnerImage').files[0];
  let profileImageUrl = existing?.profileImageUrl || '';
  if (imageFile) {
    const reader = new FileReader();
    reader.onload = async (ev) => {
      profileImageUrl = ev.target.result;
      await savePartnerData(id, profileImageUrl);
    };
    reader.readAsDataURL(imageFile);
    return; // ننتظر انتهاء القراءة
  }
  await savePartnerData(id, profileImageUrl);
  
  async function savePartnerData(finalId, img) {
    const newPartner = {
      id: finalId,
      pass: document.getElementById('partnerPassword').value,
      role: 'partner',
      nameAr: document.getElementById('partnerNameAr').value,
      nameEn: document.getElementById('partnerNameEn').value,
      color: document.getElementById('partnerColor').value,
      percentage: existing?.percentage || 0,
      profileImageUrl: img
    };
    if (partnerId && partnerId !== finalId) delete partners[partnerId];
    partners[finalId] = newPartner;
    localStorage.setItem('goldenPeakPartners', JSON.stringify(partners));
    if (db) await setDoc(doc(db, 'partners', finalId), newPartner);
    showToast('تم الحفظ');
    closePartnerModal();
    renderPartnerList();
    renderAdminPercentages();
  }
});
function editPartner(id) { openPartnerModal(id); }
async function deletePartner(id) {
  if (!confirm('حذف الشريك؟')) return;
  delete partners[id];
  localStorage.setItem('goldenPeakPartners', JSON.stringify(partners));
  if (db) await deleteDoc(doc(db, 'partners', id));
  renderPartnerList();
  renderAdminPercentages();
}

// --- نسب الشركاء ---
function renderAdminPercentages() {
  const list = document.getElementById('adminPercentagesList');
  list.innerHTML = Object.values(partners).map(p => `
    <div class="partner-item"><span>${p.nameAr}</span>
      <input type="number" id="perc_${p.id}" value="${p.percentage}" step="0.1" style="width:80px"> %
    </div>`).join('');
  document.querySelectorAll('[id^="perc_"]').forEach(i => i.addEventListener('input', validatePercentages));
  validatePercentages();
}
function validatePercentages() {
  let sum = 0;
  document.querySelectorAll('[id^="perc_"]').forEach(i => sum += parseFloat(i.value) || 0);
  const ok = Math.abs(sum - 100) < 0.01;
  document.getElementById('percTotalDisplay').innerText = sum.toFixed(1) + '%';
  document.getElementById('percTotalDisplay').style.color = ok ? 'var(--success)' : 'var(--danger)';
  document.getElementById('savePercBtn').disabled = !ok;
}
document.getElementById('percentagesForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  document.querySelectorAll('[id^="perc_"]').forEach(i => {
    const id = i.id.replace('perc_', '');
    partners[id].percentage = parseFloat(i.value) || 0;
  });
  localStorage.setItem('goldenPeakPartners', JSON.stringify(partners));
  for (const [id, data] of Object.entries(partners)) await setDoc(doc(db, 'partners', id), data);
  showToast('تم اعتماد النسب');
  renderDynamicUI();
});

// --- إعدادات المنصة ---
function populateSettingsForm() {
  document.getElementById('telegramLink').value = platformSettings.telegramLink || '';
  document.getElementById('platformEmail').value = platformSettings.platformEmail || '';
  renderAdminVideoList();
}
document.getElementById('settingsForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  platformSettings.telegramLink = document.getElementById('telegramLink').value;
  platformSettings.platformEmail = document.getElementById('platformEmail').value;
  await setDoc(doc(db, 'settings', 'platform'), platformSettings);
  updateTelegramLink();
  showToast('تم الحفظ');
});
function updateTelegramLink() {
  document.getElementById('telegramLinkBtn').href = platformSettings.telegramLink || '#';
}
document.getElementById('addVideoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  let rawUrl = document.getElementById('videoEmbedCode').value.trim();
  let finalUrl = rawUrl;

  // تحويل روابط يوتيوب العادية إلى روابط Embed تلقائياً
  if (rawUrl.includes('youtube.com/watch?v=')) {
      finalUrl = rawUrl.replace('watch?v=', 'embed/');
      // إزالة أي باراميترز زيادة مثل &t=10s
      finalUrl = finalUrl.split('&')[0];
  } else if (rawUrl.includes('youtu.be/')) {
      finalUrl = rawUrl.replace('youtu.be/', 'www.youtube.com/embed/');
      finalUrl = finalUrl.split('?')[0];
  }

  if (!platformSettings.youtubeVideos) platformSettings.youtubeVideos = [];

  platformSettings.youtubeVideos.push({
    title: document.getElementById('videoTitle').value,
    embedCode: finalUrl
  });
  
  try {
    await setDoc(doc(db, 'settings', 'platform'), platformSettings);
    renderAdminVideoList();
    e.target.reset();
    showToast('تمت إضافة الفيديو بنجاح');
  } catch (err) {
    showToast('خطأ في الاتصال بقاعدة البيانات', 'error');
  }
});
function renderAdminVideoList() {
  const list = document.getElementById('adminVideoList');
  list.innerHTML = platformSettings.youtubeVideos.map((v, i) => `
    <div class="video-item"><iframe src="${v.embedCode}"></iframe><span>${v.title}</span>
      <button onclick="deleteVideo(${i})"><i class="fa-solid fa-trash"></i></button>
    </div>`).join('');
}
async function deleteVideo(index) {
  platformSettings.youtubeVideos.splice(index, 1);
  await setDoc(doc(db, 'settings', 'platform'), platformSettings);
  renderAdminVideoList();
}

// --- TradingView ---
function loadMarket(symbol, btn) {
  currentMarketSymbol = symbol;
  document.querySelectorAll('.market-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const container = document.getElementById('tv_container');
  container.innerHTML = `<div class="tradingview-widget-container" style="height:100%"><div id="tv_chart"></div></div>`;
  new TradingView.widget({
    "width": "100%", "height": "100%", "symbol": symbol, "interval": "D", "timezone": "Asia/Riyadh",
    "theme": currentTheme, "style": "1", "locale": ironPeakLang, "toolbar_bg": "#f1f3f6",
    "enable_publishing": false, "allow_symbol_change": true, "container_id": "tv_chart"
  });
}

// تشغيل التهيئة عند التحميل
window.addEventListener('load', init);
