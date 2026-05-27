const STORAGE_KEY = "tongzhande_clinic_data_v2";

const commonDiagnoses = ["腰椎间盘突出", "颈椎病", "骨质增生", "关节炎", "软组织损伤", "骨折", "扭伤", "腱鞘炎", "肩周炎", "坐骨神经痛"];
const commonAdvice = ["口服药物治疗", "外敷消肿止痛药", "注意休息", "禁止剧烈运动", "定期复查", "必要时拍片检查"];
const usageOptions = ["口服", "外用", "饭后", "饭前", "每日1次", "每日2次", "每日3次", "每次1片", "每次2片", "每次3片"];

const state = {
  db: null,
  currentUser: null,
  tabs: [],
  activeTab: "dashboard",
  selectedRows: {},
  selectedPatientId: null,
  collapsedMenuGroups: {}
};

const permissions = {
  管理员: ["*"],
  医生: ["dashboard", "patients", "visits", "doctor", "prescription", "profile"],
  护士: ["dashboard", "treatments", "nurse", "profile"],
  药房: ["dashboard", "drugIn", "inventory", "inRecords", "stockCheck", "stockQuery", "stockProfit", "supplierPay", "dispense", "retail", "priceTag"],
  收费员: ["dashboard", "payments", "reports", "salesReport", "profitReport", "drugSalesReport", "workloadReport", "debtReport", "refundReport", "visits"]
};

const menuGroups = [
  { title: "综合导航", items: [["patients", "新患者登记"], ["treatmentOrder", "诊疗/治疗开单"], ["followup", "复诊患者查询"], ["payments", "门诊收费"], ["medicineCard", "领药卡目录"], ["shiftPrint", "交班单打印"], ["cashDrawer", "打开钱箱"], ["queueScreen", "开诊叫号屏幕"]] },
  { title: "医生接诊", items: [["doctor", "医生接诊"], ["treatments", "检查/治疗登记"], ["nurse", "护士登记"], ["prescription", "处方开具"]] },
  { title: "药品管理", items: [["drugIn", "药品入库"], ["inventory", "浏览与修改"], ["inRecords", "入库记录"], ["stockCheck", "库存盘点"], ["stockQuery", "进销存查询"], ["stockProfit", "库存损益表"], ["supplierPay", "供应商结算"], ["dispense", "药品发放"], ["retail", "药品零售"], ["priceTag", "价签打印"]] },
  { title: "报表统计", items: [["salesReport", "营业额统计"], ["profitReport", "利润统计"], ["drugSalesReport", "药品销售统计"], ["workloadReport", "工作量统计"], ["debtReport", "欠费统计"], ["refundReport", "退费统计"], ["visits", "门诊日志"]] },
  { title: "基本设置", items: [["settings", "门诊模式"], ["doctorSettings", "医生设置"], ["projectSettings", "治疗项目"], ["packageSettings", "诊疗套餐"], ["paySettings", "支付方式"], ["smsSettings", "短信设置"], ["memberSettings", "会员政策"], ["resetIndex", "索引重置"]] },
  { title: "数据维护", items: [["autoBackup", "数据定时备份"], ["manualBackup", "数据手动备份"], ["restoreData", "数据恢复还原"], ["clearData", "数据清空操作"], ["maintenance", "数据维护"]] },
  { title: "系统设置", items: [["idReader", "身份证读卡器"], ["printSettings", "打印设置"], ["upgrade", "文件升级"], ["users", "用户账号"]] }
];

const tabNames = {
  dashboard: "首页仪表盘",
  reports: "报表统计",
  ...Object.fromEntries(menuGroups.flatMap(group => group.items))
};

document.addEventListener("DOMContentLoaded", initApp);

function initApp() {
  state.db = initDemoData();
  bindGlobalEvents();
  renderSidebar();
  const savedUser = sessionStorage.getItem("clinic_user");
  if (savedUser) {
    state.currentUser = JSON.parse(savedUser);
    showApp();
  }
}

function initDemoData() {
  const saved = loadData(STORAGE_KEY);
  if (saved) return saved;
  const today = getToday();
  const patients = [
    { id: generateId("P"), name: "李秀恩", gender: "女", age: 75, phone: "", idCard: "", address: "肖里沟", occupation: "农民", allergy: "", medicalHistory: "", remark: "主诉：左膝关节扭伤1天；血压：110/70mmHg", createdAt: today },
    { id: generateId("P"), name: "张玉琴", gender: "女", age: 65, phone: "13772656941", idCard: "", address: "西街村", occupation: "农民", allergy: "", medicalHistory: "", remark: "血压：125/80mmHg", createdAt: today },
    { id: generateId("P"), name: "文学慧", gender: "女", age: 76, phone: "无", idCard: "", address: "汤峪镇关寨", occupation: "农民", allergy: "", medicalHistory: "", remark: "血压：120/80mmHg", createdAt: today },
    { id: generateId("P"), name: "李发全", gender: "男", age: 63, phone: "15991971124", idCard: "", address: "清联5", occupation: "农民", allergy: "", medicalHistory: "", remark: "诊断：左第4远节指骨骨折", createdAt: today }
  ];
  const drugs = [
    ["活血止痛胶囊", "骨伤用药", "0.25g*20粒/盒", "盒", 5, 8, 100, 10],
    ["藤黄健骨胶囊", "骨伤用药", "0.3g*30粒/瓶", "瓶", 6, 8, 80, 10],
    ["三七伤药片", "骨伤用药", "12片*2板/盒", "盒", 4, 5, 60, 10],
    ["乙酰螺旋霉素片", "抗感染", "0.1g*12片/板", "板", 2, 2.5, 90, 12],
    ["布洛芬缓释胶囊", "止痛药", "0.3g*20粒/盒", "盒", 12, 18, 18, 15],
    ["云南白药气雾剂", "外用药", "85g/瓶", "瓶", 28, 39, 12, 10],
    ["双氯芬酸钠缓释片", "止痛药", "0.1g*12片/盒", "盒", 13, 20, 8, 12],
    ["跌打丸", "骨伤用药", "3g*10丸/盒", "盒", 10, 16, 26, 10],
    ["麝香壮骨膏", "外用药", "7cm*10cm*5贴/盒", "盒", 9, 14, 9, 10]
  ].map((item, index) => ({
    id: `D${String(index + 1).padStart(3, "0")}`,
    name: item[0],
    category: item[1],
    specification: item[2],
    unit: item[3],
    purchasePrice: item[4],
    salePrice: item[5],
    stock: item[6],
    minStock: item[7],
    manufacturer: "示例药厂",
    supplier: "眉县医药配送",
    batchNo: `B20260${index + 1}`,
    productionDate: "2026-01-05",
    expiryDate: index === 5 ? addDays(today, 20) : index === 8 ? addDays(today, -3) : "2027-12-31",
    inDate: today,
    remark: ""
  }));
  const visits = patients.map((patient, index) => ({
    id: generateId("V"),
    patientId: patient.id,
    patientName: patient.name,
    name: patient.name,
    gender: patient.gender,
    age: patient.age,
    phone: patient.phone,
    idCard: patient.idCard,
    address: patient.address,
    occupation: patient.occupation,
    remark: patient.remark,
    chiefComplaint: ["左膝关节扭伤1天", "", "", "左手指疼痛肿胀"][index],
    complaint: ["左膝关节扭伤1天", "", "", "左手指疼痛肿胀"][index],
    presentIllness: "",
    temperature: "36.5℃",
    bloodPressure: ["110/70mmHg", "125/80mmHg", "120/80mmHg", "120/80mmHg"][index],
    physicalExam: "局部压痛，活动受限",
    exam: "局部压痛，活动受限",
    diagnosis: index === 3 ? "左第4远节指骨骨折" : commonDiagnoses[index + 3],
    advice: index === 3 ? "口服活血止痛胶囊，外敷消肿止痛药，休息，禁运动" : "注意休息，定期复查",
    doctor: index === 3 ? "安利群" : "同占德",
    visitDate: today,
    date: today,
    fee: [48, 36, 42, 60][index],
    status: index === 3 ? "已开方" : "待接诊",
    type: "诊疗"
  }));
  const rxPatient = patients[3];
  const rxItems = [
    makeRxItem(drugs[0], 1, "口服 每日3次 每次5粒"),
    makeRxItem(drugs[1], 1, "口服 每日3次 每次5粒"),
    makeRxItem(drugs[2], 1, "口服 每日3次 每次3片"),
    makeRxItem(drugs[3], 2, "口服 每日3次 每次3片")
  ];
  rxItems[0].amount = 8;
  rxItems[1].amount = 8;
  rxItems[2].amount = 5;
  rxItems[3].amount = 5;
  const prescriptions = [{
    id: generateId("RX"),
    visitId: visits[3].id,
    patientId: rxPatient.id,
    patientName: rxPatient.name,
    gender: rxPatient.gender,
    age: rxPatient.age,
    phone: rxPatient.phone,
    address: rxPatient.address,
    doctor: "安利群",
    diagnosis: "左第4远节指骨骨折",
    advice: "口服活血止痛胶囊，外敷消肿止痛药，休息，禁运动",
    items: rxItems,
    medicineFee: 26,
    drugFee: 26,
    injectionFee: 0,
    treatmentFee: 0,
    totalFee: 26,
    status: "待发药",
    createdAt: today,
    date: today
  }];
  const db = {
    patients,
    visits,
    prescriptions,
    drugs,
    payments: [{
      id: generateId("PAY"),
      patientId: rxPatient.id,
      patientName: rxPatient.name,
      visitId: visits[3].id,
      prescriptionId: prescriptions[0].id,
      medicineFee: 26,
      drugFee: 26,
      treatmentFee: 0,
      checkFee: 0,
      therapyFee: 0,
      injectionFee: 0,
      otherFee: 0,
      totalAmount: 26,
      total: 26,
      payMethod: "现金",
      payStatus: "已收费",
      status: "已收费",
      paidAt: today,
      date: today,
      remark: "演示处方收费"
    }],
    treatments: [
      { id: generateId("T"), patientId: patients[0].id, patientName: "李秀恩", projectName: "固定", bodyPart: "左膝", result: "膝关节固定包扎", type: "固定", item: "膝关节固定包扎", fee: 30, operator: "同占德", doctor: "同占德", createdAt: today, date: today, remark: "减少负重" },
      { id: generateId("T"), patientId: patients[3].id, patientName: "李发全", projectName: "DR拍片", bodyPart: "左手", result: "左第4远节指骨骨折", type: "DR拍片", item: "手指正侧位片", fee: 80, operator: "护士A", doctor: "同占德", createdAt: today, date: today, remark: "排除移位" }
    ],
    nurseRecords: [],
    users: [
      { id: "U-admin", username: "admin", password: "123456", name: "管理员", role: "管理员" },
      { id: "U-doctor", username: "doctor", password: "123456", name: "医生", role: "医生" },
      { id: "U-nurse", username: "nurse", password: "123456", name: "护士", role: "护士" },
      { id: "U-drug", username: "drug", password: "123456", name: "药房", role: "药房" },
      { id: "U-cashier", username: "cashier", password: "123456", name: "收费员", role: "收费员" }
    ]
  };
  saveData(STORAGE_KEY, db);
  return db;
}

function makeRxItem(drug, quantity, usage) {
  return {
    drugId: drug.id,
    drugName: drug.name,
    specification: drug.specification,
    spec: drug.specification,
    usage,
    frequency: usage.includes("每日3次") ? "每日3次" : "",
    dosage: usage.includes("每次") ? usage.split("每次")[1] ? `每次${usage.split("每次")[1]}` : "" : "",
    quantity,
    unit: drug.unit,
    price: drug.salePrice,
    amount: drug.salePrice * quantity
  };
}

function saveData(key, data) {
  if (data === undefined) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(key));
    return;
  }
  localStorage.setItem(key, JSON.stringify(data));
}

function loadData(key) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

function generateId(prefix) {
  const date = getToday().replaceAll("-", "");
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}${date}${random}`;
}

function bindGlobalEvents() {
  $("loginForm").addEventListener("submit", event => {
    event.preventDefault();
    const username = $("loginUsername").value.trim();
    const password = $("loginPassword").value;
    const user = state.db.users.find(item => item.username === username && item.password === password);
    if (!user) return alert("账号或密码错误");
    state.currentUser = user;
    sessionStorage.setItem("clinic_user", JSON.stringify(user));
    showApp();
  });
  $("logoutBtn").addEventListener("click", () => {
    sessionStorage.removeItem("clinic_user");
    state.currentUser = null;
    $("appView").classList.add("hidden");
    $("loginView").classList.remove("hidden");
  });
  $("menuToggle").addEventListener("click", () => $("sidebar").classList.toggle("collapsed"));
  $("modalClose").addEventListener("click", closeModal);
  $("modal").addEventListener("click", event => {
    if (event.target.id === "modal") closeModal();
  });
  document.querySelectorAll("[data-open-tab]").forEach(button => {
    button.addEventListener("click", () => openTab(button.dataset.openTab));
  });
}

function showApp() {
  $("loginView").classList.add("hidden");
  $("appView").classList.remove("hidden");
  $("currentUser").textContent = `${state.currentUser.name}（${state.currentUser.role}）`;
  openTab("dashboard");
}

function hasPermission(key) {
  if (!state.currentUser) return true;
  const list = permissions[state.currentUser.role] || [];
  return list.includes("*") || list.includes(key);
}

function renderSidebar() {
  $("sidebar").innerHTML = menuGroups.map((group, index) => {
    const collapsed = !!state.collapsedMenuGroups[group.title];
    return `
    <div class="menu-group ${collapsed ? "is-collapsed" : ""}">
      <button class="menu-title" data-menu-group="${escapeAttr(group.title)}" type="button" aria-expanded="${!collapsed}">
        <span class="menu-arrow">▾</span>
        <span>${escapeHtml(group.title)}</span>
      </button>
      <div class="submenu" id="submenu-${index}">
        ${group.items.map(([key, name]) => `<button class="menu-item" data-menu="${key}" type="button">${escapeHtml(name)}</button>`).join("")}
      </div>
    </div>
  `;
  }).join("");
  document.querySelectorAll("[data-menu-group]").forEach(button => {
    button.addEventListener("click", () => {
      const title = button.dataset.menuGroup;
      state.collapsedMenuGroups[title] = !state.collapsedMenuGroups[title];
      renderSidebar();
      renderTabs();
    });
  });
  document.querySelectorAll("[data-menu]").forEach(button => {
    button.addEventListener("click", () => openTab(button.dataset.menu));
  });
}

function openTab(key) {
  if (!hasPermission(key)) return alert("当前账号无权访问该功能");
  if (!state.tabs.includes(key)) state.tabs.push(key);
  state.activeTab = key;
  renderTabs();
  renderActiveTab();
}

function closeTab(key) {
  state.tabs = state.tabs.filter(item => item !== key);
  if (state.activeTab === key) state.activeTab = state.tabs[state.tabs.length - 1] || "dashboard";
  if (!state.tabs.includes(state.activeTab)) state.tabs.push(state.activeTab);
  renderTabs();
  renderActiveTab();
}

function renderTabs() {
  $("tabsBar").innerHTML = state.tabs.map(key => `
    <button class="tab ${key === state.activeTab ? "active" : ""}" data-tab="${key}" type="button">
      ${escapeHtml(tabNames[key] || key)}
      ${key === "dashboard" ? "" : `<span class="tab-close" data-close="${key}">×</span>`}
    </button>
  `).join("");
  document.querySelectorAll("[data-tab]").forEach(button => {
    button.addEventListener("click", event => {
      if (event.target.dataset.close) return closeTab(event.target.dataset.close);
      openTab(button.dataset.tab);
    });
  });
  document.querySelectorAll("[data-menu]").forEach(button => {
    button.classList.toggle("active", button.dataset.menu === state.activeTab);
  });
}

function renderActiveTab() {
  const renderers = {
    dashboard: renderDashboard,
    patients: renderPatients,
    visits: renderVisits,
    doctor: renderDoctor,
    prescription: renderPrescription,
    treatments: renderTreatments,
    nurse: renderNurse,
    drugIn: renderDrugIn,
    inventory: renderInventory,
    inRecords: renderInRecords,
    stockCheck: renderInventory,
    stockQuery: renderStockQuery,
    stockProfit: renderStockProfit,
    supplierPay: renderPlaceholder,
    dispense: renderDispense,
    retail: renderRetail,
    priceTag: renderPlaceholder,
    payments: renderPayments,
    profile: renderProfile,
    reports: renderReports,
    salesReport: renderReports,
    profitReport: renderReports,
    drugSalesReport: renderReports,
    workloadReport: renderReports,
    debtReport: renderReports,
    refundReport: renderReports,
    users: renderUsers,
    maintenance: renderMaintenance,
    autoBackup: renderMaintenance,
    manualBackup: renderMaintenance,
    restoreData: renderMaintenance,
    clearData: renderMaintenance,
    settings: renderSettings,
    doctorSettings: renderSettings,
    projectSettings: renderSettings,
    packageSettings: renderSettings,
    paySettings: renderSettings,
    smsSettings: renderSettings,
    memberSettings: renderSettings,
    resetIndex: renderSettings,
    treatmentOrder: renderTreatments,
    followup: renderProfile,
    medicineCard: renderDispense,
    shiftPrint: renderPlaceholder,
    cashDrawer: renderPlaceholder,
    queueScreen: renderPlaceholder,
    idReader: renderSettings,
    printSettings: renderSettings,
    upgrade: renderSettings
  };
  $("workspace").innerHTML = "";
  (renderers[state.activeTab] || renderPlaceholder)(tabNames[state.activeTab]);
}

function pageShell(title, actions = "") {
  $("workspace").innerHTML = `<div class="page"><div class="page-title"><h2>${escapeHtml(title)}</h2><div class="toolbar">${actions}</div></div><div id="pageBody"></div></div>`;
  return $("pageBody");
}

function renderDashboard() {
  const today = getToday();
  const todayVisits = state.db.visits.filter(item => item.visitDate === today || item.date === today);
  const todayRx = state.db.prescriptions.filter(item => item.createdAt === today || item.date === today);
  const todayPay = state.db.payments.filter(item => item.paidAt === today || item.date === today);
  const lowStock = state.db.drugs.filter(drug => Number(drug.stock) <= Number(drug.minStock));
  const expiring = state.db.drugs.filter(drug => drugStatus(drug) === "即将过期");
  const body = pageShell("首页仪表盘");
  body.innerHTML = `
    <div class="stats-grid">
      ${statCard("今日接诊", `${todayVisits.length}人`, "success")}
      ${statCard("今日处方", `${todayRx.length}张`, "")}
      ${statCard("今日收费", `${money(sum(todayPay, "totalAmount"))}元`, "success")}
      ${statCard("待发药", `${state.db.prescriptions.filter(item => item.status === "待发药").length}人`, "warning")}
      ${statCard("库存不足", `${lowStock.length}种`, "danger")}
      ${statCard("即将过期", `${expiring.length}种`, "warning")}
    </div>
    <div class="panel">
      <h3>快捷入口</h3>
      <div class="toolbar">
        ${["patients", "doctor", "payments", "drugIn", "retail", "profile"].map(key => `<button data-dash="${key}" type="button">${tabNames[key]}</button>`).join("")}
      </div>
    </div>
    <div class="panel"><h3>今日门诊概览</h3>${renderTable(todayVisits, visitColumns().slice(0, 11), "visits", false)}</div>
  `;
  document.querySelectorAll("[data-dash]").forEach(button => button.addEventListener("click", () => openTab(button.dataset.dash)));
}

function renderPatients() {
  const body = pageShell("新患者登记", `<input id="patientKeyword" placeholder="按姓名/电话/地址查询"><button id="addPatient" class="primary-btn" type="button">新增患者</button>`);
  body.innerHTML = `<div id="patientTable"></div>`;
  $("addPatient").addEventListener("click", () => openPatientModal());
  $("patientKeyword").addEventListener("input", refreshPatients);
  refreshPatients();
}

function refreshPatients() {
  const keyword = ($("patientKeyword")?.value || "").trim();
  const rows = state.db.patients.filter(row => matchKeyword(row, keyword, ["name", "phone", "address", "remark"]));
  $("patientTable").innerHTML = renderTable(rows, [
    ["name", "姓名"], ["gender", "性别"], ["age", "年龄"], ["phone", "电话"], ["idCard", "身份证号"], ["address", "地址"], ["occupation", "职业"], ["allergy", "过敏史"], ["medicalHistory", "既往病史"], ["remark", "备注"], ["createdAt", "登记日期"]
  ], "patients", true, { edit: openPatientModal, delete: deletePatient, select: row => state.selectedPatientId = row.id });
}

function openPatientModal(row = {}) {
  openFormModal(row.id ? "编辑患者" : "新增患者", [
    field("name", "姓名", row.name, true),
    selectField("gender", "性别", ["男", "女"], row.gender || "女"),
    field("age", "年龄", row.age, false, "number"),
    field("phone", "电话", row.phone),
    field("idCard", "身份证号", row.idCard),
    field("address", "地址", row.address),
    field("occupation", "职业", row.occupation),
    field("allergy", "过敏史", row.allergy),
    field("medicalHistory", "既往病史", row.medicalHistory),
    field("createdAt", "登记日期", row.createdAt || getToday(), true, "date"),
    textareaField("remark", "备注", row.remark)
  ], values => {
    if (row.id) Object.assign(row, values);
    else state.db.patients.unshift({ id: generateId("P"), ...values });
    saveAndRefresh();
  });
}

function deletePatient(row) {
  if (!confirm(`确认删除患者 ${row.name}？`)) return;
  state.db.patients = state.db.patients.filter(item => item.id !== row.id);
  saveAndRefresh();
}

function renderVisits() {
  const body = pageShell("门诊日志", `
    <input id="visitStart" type="date">
    <input id="visitEnd" type="date">
    <label class="inline-check"><input id="visitTypeClinic" type="checkbox" checked>诊疗</label>
    <label class="inline-check"><input id="visitTypeRetail" type="checkbox" checked>零售</label>
    <input id="visitKeyword" placeholder="姓名/电话/诊断">
    <button id="queryVisits" type="button">查询</button>
    <button id="exportVisits" type="button">导出CSV</button>
    <button id="addVisit" class="primary-btn" type="button">新增日志</button>
  `);
  body.innerHTML = `<div id="visitTable"></div><div id="visitSummary" class="summary-line"></div>`;
  $("visitStart").value = getToday();
  $("visitEnd").value = getToday();
  ["visitStart", "visitEnd", "visitKeyword", "visitTypeClinic", "visitTypeRetail"].forEach(id => $(id).addEventListener("input", refreshVisits));
  $("queryVisits").addEventListener("click", refreshVisits);
  $("addVisit").addEventListener("click", () => openVisitModal());
  $("exportVisits").addEventListener("click", exportVisitsCsv);
  refreshVisits();
}

function filteredVisits() {
  const start = $("visitStart")?.value || "";
  const end = $("visitEnd")?.value || "";
  const keyword = ($("visitKeyword")?.value || "").trim();
  const allowClinic = $("visitTypeClinic")?.checked;
  const allowRetail = $("visitTypeRetail")?.checked;
  return state.db.visits.filter(row => {
    const date = row.visitDate || row.date;
    const typeOk = (row.type !== "零售" && allowClinic) || (row.type === "零售" && allowRetail);
    return (!start || date >= start) && (!end || date <= end) && typeOk && matchKeyword(row, keyword, ["patientName", "name", "phone", "diagnosis"]);
  });
}

function refreshVisits() {
  const rows = filteredVisits();
  $("visitTable").innerHTML = renderTable(rows, visitColumns(), "visits", true, { edit: openVisitModal, delete: deleteVisit, print: printVisitPrescription });
  $("visitSummary").innerHTML = `<span>记录数：${rows.length}</span><span>费用合计：${money(sum(rows, "fee"))} 元</span>`;
}

function visitColumns() {
  return [["id", "流水ID"], ["patientName", "姓名"], ["gender", "性别"], ["age", "年龄"], ["phone", "电话"], ["idCard", "身份证"], ["address", "地址"], ["occupation", "职业"], ["remark", "备注"], ["chiefComplaint", "主诉"], ["temperature", "体温"], ["bloodPressure", "血压"], ["physicalExam", "身体检查"], ["diagnosis", "诊断"], ["doctor", "医生"], ["fee", "费用"], ["visitDate", "日期"], ["status", "状态"]];
}

function openVisitModal(row = {}) {
  const patientOptions = state.db.patients.map(item => `${item.id}|${item.name}`);
  openFormModal(row.id ? "修改门诊日志" : "新增门诊日志", [
    selectField("patientChoice", "患者", patientOptions, row.patientId ? `${row.patientId}|${row.patientName || row.name}` : patientOptions[0]),
    field("chiefComplaint", "主诉", row.chiefComplaint || row.complaint),
    field("presentIllness", "现病史", row.presentIllness),
    field("temperature", "体温", row.temperature || "36.5℃"),
    field("bloodPressure", "血压", row.bloodPressure),
    textareaField("physicalExam", "身体检查", row.physicalExam || row.exam),
    field("diagnosis", "诊断", row.diagnosis),
    textareaField("advice", "医嘱", row.advice),
    field("doctor", "医生", row.doctor || "同占德"),
    selectField("status", "状态", ["待接诊", "接诊中", "已开方", "已收费", "已完成"], row.status || "待接诊"),
    field("fee", "费用", row.fee || 0, false, "number"),
    field("visitDate", "日期", row.visitDate || row.date || getToday(), true, "date"),
    textareaField("remark", "备注", row.remark)
  ], values => {
    const patient = state.db.patients.find(item => item.id === values.patientChoice.split("|")[0]) || {};
    const data = normalizeVisit(values, patient);
    if (row.id) Object.assign(row, data);
    else state.db.visits.unshift({ id: generateId("V"), ...data, type: "诊疗" });
    saveAndRefresh();
  });
}

function normalizeVisit(values, patient) {
  return {
    patientId: patient.id,
    patientName: patient.name,
    name: patient.name,
    gender: patient.gender,
    age: patient.age,
    phone: patient.phone,
    idCard: patient.idCard,
    address: patient.address,
    occupation: patient.occupation,
    remark: values.remark || patient.remark,
    chiefComplaint: values.chiefComplaint,
    complaint: values.chiefComplaint,
    presentIllness: values.presentIllness,
    temperature: values.temperature,
    bloodPressure: values.bloodPressure,
    physicalExam: values.physicalExam,
    exam: values.physicalExam,
    diagnosis: values.diagnosis,
    advice: values.advice,
    doctor: values.doctor,
    status: values.status,
    fee: Number(values.fee || 0),
    visitDate: values.visitDate,
    date: values.visitDate
  };
}

function deleteVisit(row) {
  if (!confirm(`确认删除流水 ${row.id}？`)) return;
  state.db.visits = state.db.visits.filter(item => item.id !== row.id);
  saveAndRefresh();
}

function exportVisitsCsv() {
  const rows = filteredVisits();
  const columns = visitColumns();
  const csv = [columns.map(item => item[1]).join(","), ...rows.map(row => columns.map(([key]) => `"${String(row[key] ?? "").replaceAll('"', '""')}"`).join(","))].join("\n");
  downloadText(`门诊日志-${getToday()}.csv`, `\uFEFF${csv}`);
}

function renderDoctor() {
  const todayVisits = state.db.visits.filter(item => (item.visitDate || item.date) === getToday());
  const current = todayVisits.find(item => item.patientId === state.selectedPatientId) || todayVisits[0] || state.db.visits[0];
  if (current) state.selectedPatientId = current.patientId;
  const patient = current ? state.db.patients.find(item => item.id === current.patientId) : null;
  const body = pageShell("医生接诊");
  body.innerHTML = `
    <div class="split-layout">
      <div class="panel">
        <h3>今日患者</h3>
        <div class="list-box">
          ${todayVisits.map(item => `<button class="patient-chip ${item.patientId === state.selectedPatientId ? "active" : ""}" data-doctor-patient="${item.patientId}" type="button"><strong>${escapeHtml(item.patientName)}</strong><br><small>${escapeHtml(item.visitDate)} / ${escapeHtml(item.diagnosis || "待诊断")} / ${escapeHtml(item.status || "待接诊")}</small></button>`).join("") || "<p>暂无今日患者</p>"}
        </div>
      </div>
      <form id="doctorForm" class="panel form-grid">
        ${field("patientName", "患者姓名", patient?.name || current?.patientName || "", false)}
        ${field("gender", "性别", patient?.gender || current?.gender || "", false)}
        ${field("age", "年龄", patient?.age || current?.age || "", false, "number")}
        ${field("phone", "电话", patient?.phone || current?.phone || "", false)}
        ${textareaField("chiefComplaint", "主诉", current?.chiefComplaint || current?.complaint)}
        ${textareaField("presentIllness", "现病史", current?.presentIllness)}
        ${field("temperature", "体温", current?.temperature || "36.5℃")}
        ${field("bloodPressure", "血压", current?.bloodPressure)}
        ${textareaField("physicalExam", "体格检查", current?.physicalExam || current?.exam)}
        ${textareaField("diagnosis", "临床诊断", current?.diagnosis)}
        ${textareaField("advice", "医嘱建议", current?.advice)}
        ${field("reviewDate", "复诊日期", current?.reviewDate, false, "date")}
        <div class="wide toolbar"><button class="primary-btn" type="submit">保存病历</button><button id="doctorToPrescription" type="button">生成处方</button></div>
      </form>
      <div class="panel">
        <h3>骨科常用诊断</h3>
        <div class="template-section">${commonDiagnoses.map(text => `<button class="template-chip" data-template="diagnosis" type="button">${escapeHtml(text)}</button>`).join("")}</div>
        <h3>常用医嘱</h3>
        <div class="template-section">${commonAdvice.map(text => `<button class="template-chip" data-template="advice" type="button">${escapeHtml(text)}</button>`).join("")}</div>
      </div>
    </div>
  `;
  document.querySelectorAll("[data-doctor-patient]").forEach(button => button.addEventListener("click", () => {
    state.selectedPatientId = button.dataset.doctorPatient;
    renderDoctor();
  }));
  document.querySelectorAll("[data-template]").forEach(button => button.addEventListener("click", () => appendTextarea(button.dataset.template, button.textContent)));
  $("doctorForm").addEventListener("submit", event => {
    event.preventDefault();
    if (!current) return alert("请先登记患者");
    const values = formValues(event.currentTarget);
    Object.assign(current, {
      chiefComplaint: values.chiefComplaint,
      complaint: values.chiefComplaint,
      presentIllness: values.presentIllness,
      temperature: values.temperature,
      bloodPressure: values.bloodPressure,
      physicalExam: values.physicalExam,
      exam: values.physicalExam,
      diagnosis: values.diagnosis,
      advice: values.advice,
      reviewDate: values.reviewDate,
      status: "接诊中"
    });
    saveData(STORAGE_KEY, state.db);
    alert("病历已保存");
    renderDoctor();
  });
  $("doctorToPrescription").addEventListener("click", () => openTab("prescription"));
}

function appendTextarea(name, text) {
  const input = document.querySelector(`[name="${name}"]`);
  if (!input) return;
  input.value = input.value ? `${input.value}；${text}` : text;
}

function renderPrescription() {
  const body = pageShell("处方开具", `<button id="newPrescription" class="primary-btn" type="button">新建处方</button>`);
  body.innerHTML = `<div id="prescriptionEditor"></div><div class="panel"><h3>历史处方</h3><div id="prescriptionTable"></div></div>`;
  $("newPrescription").addEventListener("click", () => drawPrescriptionEditor());
  drawPrescriptionEditor();
  refreshPrescriptionTable();
}

function drawPrescriptionEditor(rx = { items: [] }) {
  const patientOptions = state.db.patients.map(item => `<option value="${item.id}" ${item.id === (rx.patientId || state.selectedPatientId) ? "selected" : ""}>${escapeHtml(item.name)} ${escapeHtml(item.phone || "")}</option>`).join("");
  $("prescriptionEditor").innerHTML = `
    <form id="rxForm" class="panel">
      <div class="form-grid">
        <label><span>患者</span><select name="patientId">${patientOptions}</select></label>
        ${field("diagnosis", "临床诊断", rx.diagnosis)}
        ${field("advice", "医嘱建议", rx.advice)}
        ${field("doctor", "医生", rx.doctor || "同占德")}
      </div>
      <div class="toolbar" style="margin:12px 0"><button id="addRxDrug" type="button">添加药品</button><strong>合计：<span id="rxTotal">0.00</span> 元</strong></div>
      <div class="table-wrapper"><table><thead><tr><th>药品名称</th><th>规格</th><th>单价</th><th>数量</th><th>单位</th><th>用法</th><th>频次</th><th>天数</th><th>金额</th><th>操作</th></tr></thead><tbody id="rxItems"></tbody></table></div>
      <div class="toolbar" style="margin-top:12px"><button class="primary-btn" type="submit">保存处方</button><button id="chargeRx" type="button">生成收费单</button><button id="printRx" type="button">打印处方</button></div>
    </form>
  `;
  const items = rx.items.length ? rx.items.map(item => ({ ...item })) : [{ drugId: state.db.drugs[0]?.id, quantity: 1, usage: "口服", frequency: "每日3次", days: 3 }];
  renderRxItems(items);
  $("addRxDrug").addEventListener("click", () => {
    items.push({ drugId: state.db.drugs[0]?.id, quantity: 1, usage: "口服", frequency: "每日3次", days: 3 });
    renderRxItems(items);
  });
  $("rxForm").addEventListener("submit", event => {
    event.preventDefault();
    savePrescriptionFromForm(items);
    alert("处方已保存");
    refreshPrescriptionTable();
  });
  $("chargeRx").addEventListener("click", () => {
    const saved = savePrescriptionFromForm(items);
    createPaymentFromPrescription(saved);
    alert("收费单已生成");
    openTab("payments");
  });
  $("printRx").addEventListener("click", () => printPrescription(savePrescriptionFromForm(items)));
}

function renderRxItems(items) {
  const drugOptions = selectedId => state.db.drugs.map(drug => `<option value="${drug.id}" ${drug.id === selectedId ? "selected" : ""}>${escapeHtml(drug.name)}</option>`).join("");
  $("rxItems").innerHTML = items.map((item, index) => {
    const drug = state.db.drugs.find(d => d.id === item.drugId) || state.db.drugs[0] || {};
    const amount = Number(drug.salePrice || 0) * Number(item.quantity || 0);
    return `<tr>
      <td><select data-rx-index="${index}" data-rx-field="drugId">${drugOptions(item.drugId)}</select></td>
      <td>${escapeHtml(drug.specification || "")}</td>
      <td>${money(drug.salePrice || 0)}</td>
      <td><input type="number" min="1" data-rx-index="${index}" data-rx-field="quantity" value="${item.quantity || 1}"></td>
      <td>${escapeHtml(drug.unit || "")}</td>
      <td><select data-rx-index="${index}" data-rx-field="usage">${usageOptions.map(text => `<option ${text === item.usage ? "selected" : ""}>${text}</option>`).join("")}</select></td>
      <td><select data-rx-index="${index}" data-rx-field="frequency">${["每日1次", "每日2次", "每日3次"].map(text => `<option ${text === item.frequency ? "selected" : ""}>${text}</option>`).join("")}</select></td>
      <td><input type="number" min="1" data-rx-index="${index}" data-rx-field="days" value="${item.days || 3}"></td>
      <td>${money(amount)}</td>
      <td><button data-rx-delete="${index}" type="button">删除</button></td>
    </tr>`;
  }).join("");
  $("rxTotal").textContent = money(rxItemsTotal(items));
  document.querySelectorAll("[data-rx-field]").forEach(input => {
    const updateItem = () => {
      const item = items[Number(input.dataset.rxIndex)];
      item[input.dataset.rxField] = ["quantity", "days"].includes(input.dataset.rxField) ? Number(input.value || 0) : input.value;
      renderRxItems(items);
    };
    input.addEventListener("input", updateItem);
    input.addEventListener("change", updateItem);
  });
  document.querySelectorAll("[data-rx-delete]").forEach(button => button.addEventListener("click", () => {
    items.splice(Number(button.dataset.rxDelete), 1);
    renderRxItems(items);
  }));
}

function rxItemsTotal(items) {
  return items.reduce((total, item) => {
    const drug = state.db.drugs.find(d => d.id === item.drugId);
    return total + Number(drug?.salePrice || 0) * Number(item.quantity || 0);
  }, 0);
}

function savePrescriptionFromForm(items) {
  const values = formValues($("rxForm"));
  const patient = state.db.patients.find(item => item.id === values.patientId) || {};
  const visit = state.db.visits.find(item => item.patientId === patient.id && (item.visitDate || item.date) === getToday());
  const cleanItems = items.filter(item => item.drugId).map(item => {
    const drug = state.db.drugs.find(d => d.id === item.drugId) || {};
    const quantity = Number(item.quantity || 1);
    return {
      drugId: item.drugId,
      drugName: drug.name,
      specification: drug.specification,
      spec: drug.specification,
      usage: item.usage || "口服",
      frequency: item.frequency || "每日3次",
      dosage: item.dosage || "",
      days: Number(item.days || 3),
      quantity,
      unit: drug.unit,
      price: Number(drug.salePrice || 0),
      amount: Number(drug.salePrice || 0) * quantity
    };
  });
  const total = cleanItems.reduce((sumValue, item) => sumValue + item.amount, 0);
  const rx = {
    id: generateId("RX"),
    visitId: visit?.id || "",
    patientId: patient.id,
    patientName: patient.name,
    gender: patient.gender,
    age: patient.age,
    phone: patient.phone,
    address: patient.address,
    doctor: values.doctor,
    diagnosis: values.diagnosis,
    advice: values.advice,
    items: cleanItems,
    medicineFee: total,
    drugFee: total,
    injectionFee: 0,
    treatmentFee: 0,
    totalFee: total,
    status: "待发药",
    createdAt: getToday(),
    date: getToday()
  };
  state.db.prescriptions.unshift(rx);
  if (visit) visit.status = "已开方";
  saveData(STORAGE_KEY, state.db);
  return rx;
}

function refreshPrescriptionTable() {
  $("prescriptionTable").innerHTML = renderTable(state.db.prescriptions, [["id", "编号"], ["patientName", "姓名"], ["diagnosis", "诊断"], ["medicineFee", "药费"], ["status", "状态"], ["doctor", "医生"], ["createdAt", "日期"]], "prescriptions", true, {
    print: printPrescription,
    delete: row => {
      if (!confirm(`确认删除处方 ${row.id}？`)) return;
      state.db.prescriptions = state.db.prescriptions.filter(item => item.id !== row.id);
      saveAndRefresh();
    }
  });
}

function printVisitPrescription(visit) {
  const rx = state.db.prescriptions.find(item => item.visitId === visit.id || item.patientId === visit.patientId);
  if (!rx) return alert("该记录没有处方");
  printPrescription(rx);
}

function printPrescription(rx) {
  const patient = state.db.patients.find(item => item.id === rx.patientId) || rx;
  const medicineFee = Number(rx.medicineFee || rx.drugFee || 0);
  const injectionFee = Number(rx.injectionFee || 0);
  const treatmentFee = Number(rx.treatmentFee || 0);
  const totalFee = Number(rx.totalFee || medicineFee + injectionFee + treatmentFee);
  $("printArea").innerHTML = `
    <div class="rx-sheet">
      <div class="rx-title">眉县槐芽镇同占德诊所 处方笺</div>
      <div class="rx-top-line rx-patient-row">
        <span><b>姓名：</b>${escapeHtml(patient.name || rx.patientName)}</span>
        <span><b>性别：</b>${escapeHtml(patient.gender || rx.gender || "")}</span>
        <span><b>年龄：</b>${escapeHtml(patient.age || rx.age || "")}岁</span>
        <span><b>编号：</b>${escapeHtml(rx.id)}</span>
      </div>
      <div class="rx-top-line"><b>电话/地址：</b>${escapeHtml(`${patient.phone || ""}    ${patient.address || ""}`)}</div>
      <div class="rx-top-line"><b>临床诊断：</b>${escapeHtml(rx.diagnosis || "")}</div>
      <div class="rx-top-line"><b>医嘱建议：</b>${escapeHtml(rx.advice || "")}</div>
      <div class="rx-rp">
        <div class="rx-rp-title">Rp</div>
        <div class="rx-drug-list">
          ${rx.items.map((item, index) => {
            const doseText = item.dosage || getDosageFromUsage(item.usage) || "";
            const frequencyText = item.frequency || getFrequencyFromUsage(item.usage) || "";
            const usageText = [getBaseUsage(item.usage), frequencyText, doseText].filter(Boolean).join("　");
            return `<div class="rx-drug-item">
              <div class="rx-drug-main">
                <span class="rx-drug-name">${index + 1}. ${escapeHtml(item.drugName)}</span>
                <span>${escapeHtml(item.specification || item.spec || "")}</span>
                <span>${escapeHtml(doseText || "")}</span>
                <span>共${escapeHtml(item.quantity || "")}${escapeHtml(item.unit || "")}</span>
              </div>
              <div class="rx-drug-usage">用法：${escapeHtml(usageText)}</div>
            </div>`;
          }).join("")}
        </div>
        <div class="rx-empty-line"><span>以下内容为空</span></div>
      </div>
      <div class="rx-footer">
        <div class="rx-sign-row">
          <span>医　生：${escapeHtml(rx.doctor || "")}</span>
          <span>调　配：</span>
          <span>核　对：</span>
          <span>发　药：</span>
        </div>
        <div class="rx-fee-row">
          <span>药　费：${money(medicineFee)}</span>
          <span>注射费：${money(injectionFee)}</span>
          <span>诊疗费：${money(treatmentFee)}</span>
          <span>合　计：${money(totalFee)}</span>
        </div>
        <div class="rx-date">日期：${escapeHtml(rx.createdAt || rx.date || getToday())}</div>
      </div>
    </div>
  `;
  window.print();
}

function renderTreatments() {
  renderCrudModule("检查/治疗登记", "treatments", [["patientName", "患者姓名"], ["projectName", "检查项目"], ["bodyPart", "检查部位"], ["result", "检查结果"], ["item", "治疗项目"], ["fee", "收费金额"], ["operator", "执行医生/护士"], ["createdAt", "登记时间"], ["remark", "备注"]], row => [
    patientField(row), selectField("projectName", "检查项目", ["X光检查", "DR拍片", "关节检查", "腰椎检查", "颈椎检查", "复查", "换药", "理疗", "固定", "包扎"], row.projectName),
    field("bodyPart", "检查部位", row.bodyPart), textareaField("result", "检查结果", row.result), field("item", "治疗项目", row.item), field("fee", "收费金额", row.fee || 0, false, "number"), field("operator", "执行医生/护士", row.operator || "同占德"), field("createdAt", "登记时间", row.createdAt || getToday(), true, "date"), textareaField("remark", "备注", row.remark)
  ], row => ({ ...row, type: row.projectName, doctor: row.operator, date: row.createdAt, fee: Number(row.fee || 0) }));
}

function renderNurse() {
  renderCrudModule("护士执行登记", "nurseRecords", [["patientName", "患者姓名"], ["project", "执行项目"], ["executeTime", "执行时间"], ["nurse", "执行护士"], ["result", "执行结果"], ["remark", "备注"]], row => [
    patientField(row), field("project", "执行项目", row.project), field("executeTime", "执行时间", row.executeTime || nowLocal(), true, "datetime-local"), field("nurse", "执行护士", row.nurse || "护士A"), field("result", "执行结果", row.result || "已执行"), textareaField("remark", "备注", row.remark)
  ]);
}

function renderDrugIn() {
  renderCrudModule("药品入库", "drugs", drugColumns(), drugFields, normalizeDrug);
}

function renderInventory() {
  const body = pageShell(tabNames[state.activeTab] || "药品库存管理", `<input id="drugKeyword" placeholder="查询药品"><button id="addDrug" class="primary-btn" type="button">新增入库</button>`);
  body.innerHTML = `<div id="inventoryTable"></div>`;
  $("drugKeyword").addEventListener("input", refreshInventory);
  $("addDrug").addEventListener("click", () => openDrugModal());
  refreshInventory();
}

function refreshInventory() {
  const keyword = ($("drugKeyword")?.value || "").trim();
  const rows = state.db.drugs.filter(row => matchKeyword(row, keyword, ["id", "name", "category", "supplier"])).map(row => ({ ...row, status: drugStatus(row) }));
  $("inventoryTable").innerHTML = renderTable(rows, [["id", "药品编号"], ...drugColumns(), ["status", "状态"]], "inventory", true, { edit: openDrugModal, delete: deleteDrug });
}

function drugColumns() {
  return [["name", "药品名称"], ["category", "分类"], ["specification", "规格"], ["unit", "单位"], ["purchasePrice", "进价"], ["salePrice", "售价"], ["stock", "库存数量"], ["minStock", "库存下限"], ["manufacturer", "生产厂家"], ["supplier", "供应商"], ["batchNo", "批号"], ["productionDate", "生产日期"], ["expiryDate", "有效期"], ["inDate", "入库日期"], ["remark", "备注"]];
}

function drugFields(row = {}) {
  return [field("name", "药品名称", row.name, true), field("category", "分类", row.category), field("specification", "规格", row.specification), field("unit", "单位", row.unit || "盒"), field("purchasePrice", "进价", row.purchasePrice || 0, false, "number"), field("salePrice", "售价", row.salePrice || 0, false, "number"), field("stock", "入库数量/库存", row.stock || 0, false, "number"), field("minStock", "库存下限", row.minStock || 10, false, "number"), field("manufacturer", "生产厂家", row.manufacturer), field("supplier", "供应商", row.supplier), field("batchNo", "批号", row.batchNo), field("productionDate", "生产日期", row.productionDate, false, "date"), field("expiryDate", "有效期", row.expiryDate, false, "date"), field("inDate", "入库日期", row.inDate || getToday(), false, "date"), textareaField("remark", "备注", row.remark)];
}

function normalizeDrug(row) {
  return { ...row, purchasePrice: Number(row.purchasePrice || 0), salePrice: Number(row.salePrice || 0), stock: Number(row.stock || 0), minStock: Number(row.minStock || 0) };
}

function openDrugModal(row = {}) {
  openFormModal(row.id ? "修改药品" : "新增入库", drugFields(row), values => {
    const data = normalizeDrug(values);
    if (row.id) Object.assign(row, data);
    else state.db.drugs.unshift({ id: generateId("D"), ...data });
    saveAndRefresh();
  });
}

function deleteDrug(row) {
  if (!confirm(`确认删除药品 ${row.name}？`)) return;
  state.db.drugs = state.db.drugs.filter(item => item.id !== row.id);
  saveAndRefresh();
}

function renderInRecords() {
  const body = pageShell("入库记录");
  body.innerHTML = renderTable(state.db.drugs, [["id", "药品编号"], ["name", "药品名称"], ["stock", "入库数量"], ["supplier", "供应商"], ["batchNo", "批号"], ["inDate", "入库日期"], ["remark", "备注"]], "inRecords", false);
}

function renderStockQuery() {
  const body = pageShell("进销存查询");
  body.innerHTML = `<div class="panel">${renderTable(state.db.drugs.map(drug => ({ ...drug, sold: soldQuantity(drug.id), current: drug.stock })), [["id", "药品编号"], ["name", "药品名称"], ["stock", "当前库存"], ["sold", "已销售/发放"], ["supplier", "供应商"]], "stockQuery", false)}</div>`;
}

function renderStockProfit() {
  const body = pageShell("库存损益表");
  body.innerHTML = renderTable(state.db.drugs.map(drug => ({ ...drug, stockValue: drug.stock * drug.purchasePrice, saleValue: drug.stock * drug.salePrice, profitValue: drug.stock * (drug.salePrice - drug.purchasePrice) })), [["name", "药品名称"], ["stock", "库存"], ["stockValue", "库存成本"], ["saleValue", "售价金额"], ["profitValue", "预估毛利"]], "stockProfit", false);
}

function renderDispense() {
  const body = pageShell("药品发放");
  const pending = state.db.prescriptions.filter(item => item.status !== "已发药");
  body.innerHTML = `<div class="panel"><h3>待发药处方</h3>${renderTable(pending, [["id", "处方编号"], ["patientName", "患者姓名"], ["medicineFee", "药费"], ["status", "发药状态"], ["createdAt", "日期"]], "dispense", true, { dispense: dispensePrescription, print: printPrescription })}</div>`;
}

function dispensePrescription(rx) {
  const lacking = rx.items.find(item => {
    const drug = state.db.drugs.find(row => row.id === item.drugId);
    return !drug || Number(drug.stock) < Number(item.quantity);
  });
  if (lacking) {
    rx.status = "缺药";
    saveAndRefresh();
    return alert(`${lacking.drugName} 库存不足，状态已标记为缺药`);
  }
  rx.items.forEach(item => {
    const drug = state.db.drugs.find(row => row.id === item.drugId);
    drug.stock -= Number(item.quantity);
  });
  rx.status = "已发药";
  rx.dispenser = state.currentUser?.name || "药房";
  rx.dispensedAt = nowLocal();
  saveAndRefresh();
  alert("发药完成，库存已扣减");
}

function renderRetail() {
  const body = pageShell("药品零售");
  body.innerHTML = `
    <form id="retailForm" class="panel form-grid">
      ${field("customerName", "客户姓名", "散客")}
      ${field("phone", "联系电话", "")}
      ${selectField("drugChoice", "药品名称", state.db.drugs.map(drug => `${drug.id}|${drug.name}`))}
      ${field("quantity", "数量", 1, true, "number")}
      ${selectField("payMethod", "收款方式", ["现金", "微信", "支付宝", "医保", "银行卡", "欠费"], "现金")}
      <div class="wide toolbar"><button class="primary-btn" type="submit">结算</button><button id="printRetail" type="button">打印小票</button></div>
    </form>
    <div class="panel"><h3>库存列表</h3>${renderTable(state.db.drugs.map(drug => ({ ...drug, status: drugStatus(drug) })), [["name", "药品名称"], ["specification", "规格"], ["salePrice", "单价"], ["stock", "库存"], ["status", "状态"]], "retailStock", false)}</div>
  `;
  $("retailForm").addEventListener("submit", event => {
    event.preventDefault();
    const values = formValues(event.currentTarget);
    const drug = state.db.drugs.find(item => item.id === values.drugChoice.split("|")[0]);
    const qty = Number(values.quantity || 0);
    if (!drug || drug.stock < qty) return alert("库存不足");
    drug.stock -= qty;
    const total = drug.salePrice * qty;
    state.db.payments.unshift({ id: generateId("PAY"), patientId: "", patientName: values.customerName || "药品零售", medicineFee: total, drugFee: total, treatmentFee: 0, checkFee: 0, therapyFee: 0, injectionFee: 0, otherFee: 0, totalAmount: total, total, payMethod: values.payMethod, payStatus: values.payMethod === "欠费" ? "部分欠费" : "已收费", status: values.payMethod === "欠费" ? "欠费" : "已收费", paidAt: getToday(), date: getToday(), remark: `零售：${drug.name} x ${qty}` });
    saveData(STORAGE_KEY, state.db);
    alert(`结算完成，金额 ${money(total)} 元`);
    renderRetail();
  });
  $("printRetail").addEventListener("click", () => alert("小票打印可在后续接入热敏打印模板"));
}

function renderPayments() {
  renderCrudModule("门诊收费", "payments", [["patientName", "患者"], ["medicineFee", "药费"], ["treatmentFee", "诊疗费"], ["checkFee", "检查费"], ["therapyFee", "治疗费"], ["injectionFee", "注射费"], ["otherFee", "其他费用"], ["totalAmount", "合计"], ["payMethod", "支付方式"], ["payStatus", "收费状态"], ["paidAt", "日期"], ["remark", "备注"]], paymentFields, row => {
    const total = ["medicineFee", "treatmentFee", "checkFee", "therapyFee", "injectionFee", "otherFee"].reduce((value, key) => value + Number(row[key] || 0), 0);
    return { ...row, drugFee: Number(row.medicineFee || 0), totalAmount: total, total, payStatus: row.payStatus || (row.payMethod === "欠费" ? "部分欠费" : "已收费"), status: row.payMethod === "欠费" ? "欠费" : "已收费", paidAt: row.paidAt || getToday(), date: row.paidAt || getToday() };
  }, { extraActions: { refund: refundPayment, confirmPay: confirmPayment } });
}

function paymentFields(row = {}) {
  return [patientField(row), field("medicineFee", "药费", row.medicineFee || row.drugFee || 0, false, "number"), field("treatmentFee", "诊疗费", row.treatmentFee || 0, false, "number"), field("checkFee", "检查费", row.checkFee || 0, false, "number"), field("therapyFee", "治疗费", row.therapyFee || 0, false, "number"), field("injectionFee", "注射费", row.injectionFee || 0, false, "number"), field("otherFee", "其他费用", row.otherFee || 0, false, "number"), selectField("payMethod", "支付方式", ["现金", "微信", "支付宝", "医保", "银行卡", "欠费"], row.payMethod || "现金"), selectField("payStatus", "收费状态", ["未收费", "已收费", "部分欠费", "已退费"], row.payStatus || "未收费"), field("paidAt", "收费日期", row.paidAt || getToday(), true, "date"), textareaField("remark", "备注", row.remark)];
}

function createPaymentFromPrescription(rx) {
  state.db.payments.unshift({ id: generateId("PAY"), patientId: rx.patientId, patientName: rx.patientName, visitId: rx.visitId, prescriptionId: rx.id, medicineFee: rx.medicineFee, drugFee: rx.medicineFee, treatmentFee: 0, checkFee: 0, therapyFee: 0, injectionFee: 0, otherFee: 0, totalAmount: rx.medicineFee, total: rx.medicineFee, payMethod: "现金", payStatus: "未收费", status: "待收费", paidAt: getToday(), date: getToday(), remark: `处方 ${rx.id}` });
  saveData(STORAGE_KEY, state.db);
}

function confirmPayment(row) {
  row.payStatus = "已收费";
  row.status = "已收费";
  saveAndRefresh();
}

function refundPayment(row) {
  if (!confirm(`确认退费 ${row.id}？`)) return;
  row.payStatus = "已退费";
  row.status = "已退费";
  saveAndRefresh();
}

function renderProfile() {
  const body = pageShell("患者资料", `<input id="profileKeyword" placeholder="姓名/电话/日期/诊断/编号">`);
  body.innerHTML = `<div id="profileBody"></div>`;
  $("profileKeyword").addEventListener("input", refreshProfile);
  refreshProfile();
}

function refreshProfile() {
  const keyword = ($("profileKeyword")?.value || "").trim();
  const patients = state.db.patients.filter(patient => {
    const related = [...state.db.visits, ...state.db.prescriptions].filter(row => row.patientId === patient.id);
    return matchKeyword(patient, keyword, ["id", "name", "phone", "address"]) || related.some(row => JSON.stringify(row).includes(keyword));
  });
  const selected = patients.find(item => item.id === state.selectedPatientId) || patients[0];
  if (!selected) {
    $("profileBody").innerHTML = `<div class="panel">未找到患者</div>`;
    return;
  }
  state.selectedPatientId = selected.id;
  $("profileBody").innerHTML = `
    <div class="profile-layout">
      <div class="panel">
        <h3>患者列表</h3>
        <div class="list-box">${patients.map(patient => `<button class="patient-chip ${patient.id === selected.id ? "active" : ""}" data-profile-patient="${patient.id}" type="button"><strong>${escapeHtml(patient.name)}</strong><br><small>${escapeHtml(patient.phone || "")} ${escapeHtml(patient.address || "")}</small></button>`).join("")}</div>
      </div>
      <div class="panel">
        <h3>${escapeHtml(selected.name)} 基本信息</h3>
        <p>${escapeHtml(selected.gender)}，${escapeHtml(selected.age)}岁，电话：${escapeHtml(selected.phone || "")}，地址：${escapeHtml(selected.address || "")}，职业：${escapeHtml(selected.occupation || "")}</p>
        <p>过敏史：${escapeHtml(selected.allergy || "无")}；既往病史：${escapeHtml(selected.medicalHistory || "无")}</p>
        <p>${escapeHtml(selected.remark || "")}</p>
      </div>
    </div>
    <div class="panel"><h3>历史病历</h3>${renderTable(state.db.visits.filter(item => item.patientId === selected.id), visitColumns(), "profileVisits", false)}</div>
    <div class="panel"><h3>历史处方</h3>${renderTable(state.db.prescriptions.filter(item => item.patientId === selected.id), [["id", "编号"], ["diagnosis", "诊断"], ["medicineFee", "药费"], ["status", "状态"], ["createdAt", "日期"]], "profileRx", false)}</div>
    <div class="panel"><h3>收费记录</h3>${renderTable(state.db.payments.filter(item => item.patientId === selected.id), [["totalAmount", "合计"], ["payMethod", "支付方式"], ["payStatus", "状态"], ["paidAt", "日期"], ["remark", "备注"]], "profilePay", false)}</div>
    <div class="panel"><h3>检查记录</h3>${renderTable(state.db.treatments.filter(item => item.patientId === selected.id), [["projectName", "检查项目"], ["bodyPart", "部位"], ["result", "结果"], ["fee", "费用"], ["createdAt", "日期"]], "profileTreat", false)}</div>
  `;
  document.querySelectorAll("[data-profile-patient]").forEach(button => button.addEventListener("click", () => {
    state.selectedPatientId = button.dataset.profilePatient;
    refreshProfile();
  }));
}

function renderReports() {
  const paid = state.db.payments.filter(item => item.payStatus === "已收费");
  const debt = state.db.payments.filter(item => item.payStatus === "部分欠费" || item.status === "欠费");
  const refund = state.db.payments.filter(item => item.payStatus === "已退费");
  const drugSales = {};
  state.db.prescriptions.forEach(rx => rx.items.forEach(item => drugSales[item.drugName] = (drugSales[item.drugName] || 0) + Number(item.quantity || 0)));
  const doctors = {};
  const nurses = {};
  state.db.visits.forEach(visit => doctors[visit.doctor || "未填"] = (doctors[visit.doctor || "未填"] || 0) + 1);
  state.db.nurseRecords.forEach(row => nurses[row.nurse || "未填"] = (nurses[row.nurse || "未填"] || 0) + 1);
  const today = getToday();
  const todayPay = state.db.payments.filter(item => item.paidAt === today || item.date === today);
  const body = pageShell(tabNames[state.activeTab] || "报表统计");
  body.innerHTML = `
    <div class="stats-grid">
      ${statCard("今日接诊人数", `${state.db.visits.filter(item => item.visitDate === today || item.date === today).length}人`, "success")}
      ${statCard("今日营业额", `${money(sum(todayPay, "totalAmount"))}元`, "success")}
      ${statCard("今日药品销售额", `${money(sum(todayPay, "medicineFee"))}元`, "")}
      ${statCard("今日检查治疗收入", `${money(sum(todayPay, "checkFee") + sum(todayPay, "therapyFee") + sum(todayPay, "treatmentFee"))}元`, "")}
      ${statCard("库存不足药品数", `${state.db.drugs.filter(drug => Number(drug.stock) <= Number(drug.minStock)).length}种`, "danger")}
      ${statCard("即将过期药品数", `${state.db.drugs.filter(drug => drugStatus(drug) === "即将过期").length}种`, "warning")}
    </div>
    <div class="stats-grid">
      ${statCard("营业额统计", `${money(sum(paid, "totalAmount"))}元`, "success")}
      ${statCard("利润统计", `${money(estimateProfit())}元`, "")}
      ${statCard("欠费统计", `${money(sum(debt, "totalAmount"))}元`, "danger")}
      ${statCard("退费统计", `${money(sum(refund, "totalAmount"))}元`, "warning")}
    </div>
    <div class="panel"><h3>药品销售统计</h3>${simpleKeyTable(drugSales, "药品", "数量")}</div>
    <div class="panel"><h3>医生工作量统计</h3>${simpleKeyTable(doctors, "医生", "接诊次数")}</div>
    <div class="panel"><h3>护士工作量统计</h3>${simpleKeyTable(nurses, "护士", "执行次数")}</div>
  `;
}

function renderSettings() {
  const body = pageShell(tabNames[state.activeTab] || "基本设置");
  body.innerHTML = `<div class="panel"><p>当前为纯前端演示版。门诊模式、医生设置、治疗项目、支付方式、打印设置等配置项已预留入口。</p><p>处方抬头：眉县槐芽镇同占德诊所 处方笺。</p></div>`;
}

function renderMaintenance() {
  const body = pageShell(tabNames[state.activeTab] || "数据维护", `<button id="exportData" type="button">数据手动备份</button><button id="resetDemo" class="danger-btn" type="button">恢复演示数据</button><button id="clearLocal" class="danger-btn" type="button">数据清空操作</button>`);
  body.innerHTML = `<div class="panel"><p>数据保存在 localStorage：patients、visits、prescriptions、drugs、payments、treatments、nurseRecords、users。</p><textarea readonly style="min-height:220px">${escapeHtml(JSON.stringify(state.db, null, 2))}</textarea></div>`;
  $("exportData").addEventListener("click", () => downloadText(`同占德诊所数据-${getToday()}.json`, JSON.stringify(state.db, null, 2)));
  $("resetDemo").addEventListener("click", () => {
    if (!confirm("确认恢复演示数据？当前数据会被覆盖。")) return;
    localStorage.removeItem(STORAGE_KEY);
    state.db = initDemoData();
    renderActiveTab();
  });
  $("clearLocal").addEventListener("click", () => {
    if (!confirm("确认清空所有本地数据？")) return;
    localStorage.removeItem(STORAGE_KEY);
    state.db = initDemoData();
    renderActiveTab();
  });
}

function renderUsers() {
  renderCrudModule("用户账号", "users", [["username", "账号"], ["name", "姓名"], ["role", "角色"], ["password", "密码"]], row => [field("username", "账号", row.username, true), field("password", "密码", row.password || "123456", true), field("name", "姓名", row.name), selectField("role", "角色", ["管理员", "医生", "护士", "药房", "收费员"], row.role)]);
}

function renderPlaceholder(title = tabNames[state.activeTab] || "功能") {
  const body = pageShell(title);
  body.innerHTML = `<div class="panel"><p>${escapeHtml(title)} 已预留入口。第一版先完成核心业务流程，后续可接入专用设备、打印机或后端数据库。</p></div>`;
}

function renderCrudModule(title, storeName, columns, fieldsFactory, normalize = row => row, options = {}) {
  const body = pageShell(title, `<input id="crudKeyword" placeholder="输入关键字查询"><button id="crudAdd" class="primary-btn" type="button">新增</button>`);
  body.innerHTML = `<div id="crudTable"></div>`;
  const refresh = () => {
    const keyword = ($("crudKeyword")?.value || "").trim();
    const rows = state.db[storeName].filter(row => !keyword || JSON.stringify(row).includes(keyword));
    $("crudTable").innerHTML = renderTable(rows, columns, storeName, true, {
      edit: row => openCrudModal(title, storeName, fieldsFactory, normalize, row),
      delete: row => deleteCrudRow(storeName, row),
      ...(options.extraActions || {})
    });
  };
  $("crudKeyword").addEventListener("input", refresh);
  $("crudAdd").addEventListener("click", () => openCrudModal(title, storeName, fieldsFactory, normalize));
  refresh();
}

function openCrudModal(title, storeName, fieldsFactory, normalize, row = {}) {
  openFormModal(row.id ? `修改${title}` : `新增${title}`, fieldsFactory(row), values => {
    const data = normalize(resolvePatient(values));
    if (row.id) Object.assign(row, data);
    else state.db[storeName].unshift({ id: generateId(storeName.slice(0, 3).toUpperCase()), ...data });
    saveAndRefresh();
  });
}

function deleteCrudRow(storeName, row) {
  if (!confirm(`确认删除 ${row.name || row.patientName || row.id}？`)) return;
  state.db[storeName] = state.db[storeName].filter(item => item.id !== row.id);
  saveAndRefresh();
}

function patientField(row = {}) {
  return selectField("patientChoice", "患者姓名", state.db.patients.map(patient => `${patient.id}|${patient.name}`), row.patientId ? `${row.patientId}|${row.patientName}` : undefined);
}

function resolvePatient(values) {
  if (!values.patientChoice) return values;
  const patient = state.db.patients.find(item => item.id === values.patientChoice.split("|")[0]) || {};
  delete values.patientChoice;
  return { ...values, patientId: patient.id, patientName: patient.name };
}

function renderTable(rows, columns, tableKey, selectable = true, actions = {}) {
  const actionHeader = Object.keys(actions).length ? "<th>操作</th>" : "";
  setTimeout(() => bindActionButtons(tableKey, actions));
  return `<div class="table-wrapper"><table><thead><tr>${columns.map(([, title]) => `<th>${escapeHtml(title)}</th>`).join("")}${actionHeader}</tr></thead><tbody>
    ${rows.map(row => `<tr data-row-id="${row.id}" class="${selectable && state.selectedRows[tableKey] === row.id ? "selected" : ""}">
      ${columns.map(([key]) => `<td>${formatCell(row[key], key)}</td>`).join("")}
      ${actionHeader ? `<td><div class="row-actions">${actionButtons(row, tableKey, actions)}</div></td>` : ""}
    </tr>`).join("") || `<tr><td colspan="${columns.length + (actionHeader ? 1 : 0)}">暂无数据</td></tr>`}
  </tbody></table></div>`;
}

function actionButtons(row, tableKey, actions) {
  const labels = { edit: "修改", delete: "删除", print: "打印处方单", dispense: "发药", select: "选择", refund: "退费", confirmPay: "确认收费" };
  return Object.keys(actions).map(key => `<button data-action-table="${tableKey}" data-action="${key}" data-row="${row.id}" type="button" class="${key === "delete" || key === "refund" ? "danger-btn" : ""}">${labels[key] || key}</button>`).join("");
}

function bindActionButtons(tableKey, actions) {
  document.querySelectorAll(`[data-action-table="${tableKey}"]`).forEach(button => {
    if (button.dataset.bound) return;
    button.dataset.bound = "1";
    button.addEventListener("click", () => {
      const row = allRowsForTable(tableKey).find(item => item.id === button.dataset.row);
      if (!row) return;
      state.selectedRows[tableKey] = row.id;
      actions[button.dataset.action]?.(row);
    });
  });
}

function allRowsForTable(tableKey) {
  const map = { inventory: state.db.drugs, retailStock: state.db.drugs, dispense: state.db.prescriptions, inRecords: state.db.drugs, stockQuery: state.db.drugs, stockProfit: state.db.drugs };
  return map[tableKey] || state.db[tableKey] || [];
}

function openFormModal(title, fields, onSubmit) {
  $("modalTitle").textContent = title;
  $("modalBody").innerHTML = `<form id="modalForm"><div class="form-grid">${fields.join("")}</div><div class="modal-footer"><button type="button" id="modalCancel">取消</button><button class="primary-btn" type="submit">保存</button></div></form>`;
  $("modal").classList.remove("hidden");
  $("modalCancel").addEventListener("click", closeModal);
  $("modalForm").addEventListener("submit", event => {
    event.preventDefault();
    onSubmit(formValues(event.currentTarget));
  });
}

function closeModal() {
  $("modal").classList.add("hidden");
  $("modalBody").innerHTML = "";
}

function saveAndRefresh() {
  saveData(STORAGE_KEY, state.db);
  closeModal();
  renderActiveTab();
}

function formValues(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function field(name, label, value = "", required = false, type = "text") {
  return `<label><span>${escapeHtml(label)}</span><input name="${name}" type="${type}" value="${escapeAttr(value ?? "")}" ${required ? "required" : ""}></label>`;
}

function textareaField(name, label, value = "") {
  return `<label class="wide"><span>${escapeHtml(label)}</span><textarea name="${name}">${escapeHtml(value ?? "")}</textarea></label>`;
}

function selectField(name, label, options, value = "") {
  const selectedValue = String(value || options[0] || "");
  const html = options.map(option => {
    const optionValue = String(option);
    const text = optionValue.includes("|") ? optionValue.split("|").slice(1).join("|") : optionValue;
    return `<option value="${escapeAttr(optionValue)}" ${optionValue === selectedValue ? "selected" : ""}>${escapeHtml(text)}</option>`;
  }).join("");
  return `<label><span>${escapeHtml(label)}</span><select name="${name}">${html}</select></label>`;
}

function statCard(label, value, tone) {
  return `<div class="stat-card ${tone || ""}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function simpleKeyTable(obj, keyName, valueName) {
  return renderTable(Object.entries(obj).map(([key, value]) => ({ key, value })), [["key", keyName], ["value", valueName]], `simple-${keyName}`, false);
}

function formatCell(value, key) {
  if (value === undefined || value === null || value === "") return "";
  if (["fee", "medicineFee", "drugFee", "treatmentFee", "checkFee", "therapyFee", "injectionFee", "otherFee", "total", "totalAmount", "purchasePrice", "salePrice", "stockValue", "saleValue", "profitValue"].includes(key)) return money(value);
  if (key === "status" || key === "payStatus") {
    const tone = ["库存不足", "已过期", "欠费", "部分欠费", "已退费", "缺药"].includes(value) ? "danger" : ["即将过期", "待发药", "未收费", "待收费"].includes(value) ? "warning" : "";
    return `<span class="badge ${tone}">${escapeHtml(value)}</span>`;
  }
  return escapeHtml(String(value));
}

function matchKeyword(row, keyword, keys) {
  if (!keyword) return true;
  return keys.some(key => String(row[key] || "").includes(keyword));
}

function drugStatus(drug) {
  if (Number(drug.stock) <= Number(drug.minStock)) return "库存不足";
  if (drug.expiryDate) {
    const diff = (new Date(drug.expiryDate) - new Date(getToday())) / 86400000;
    if (diff < 0) return "已过期";
    if (diff < 30) return "即将过期";
  }
  return "正常";
}

function soldQuantity(drugId) {
  return state.db.prescriptions.reduce((total, rx) => total + rx.items.filter(item => item.drugId === drugId).reduce((sumValue, item) => sumValue + Number(item.quantity || 0), 0), 0);
}

function getDosageFromUsage(usage = "") {
  const match = String(usage).match(/每次[^\s　，,；;]+/);
  return match ? match[0] : "";
}

function getFrequencyFromUsage(usage = "") {
  const match = String(usage).match(/每日[^\s　，,；;]+/);
  return match ? match[0] : "";
}

function getBaseUsage(usage = "") {
  return String(usage).split(/[\s　，,；;]/).filter(Boolean)[0] || "";
}

function estimateProfit() {
  let profit = 0;
  state.db.prescriptions.forEach(rx => rx.items.forEach(item => {
    const drug = state.db.drugs.find(row => row.id === item.drugId);
    profit += (Number(item.price || 0) - Number(drug?.purchasePrice || 0)) * Number(item.quantity || 0);
  }));
  profit += sum(state.db.payments, "treatmentFee") + sum(state.db.payments, "checkFee") + sum(state.db.payments, "therapyFee") + sum(state.db.payments, "injectionFee") + sum(state.db.payments, "otherFee");
  return profit;
}

function sum(rows, key) {
  return rows.reduce((total, row) => total + Number(row[key] || 0), 0);
}

function money(value) {
  return Number(value || 0).toFixed(2);
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function getToday() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function addDays(dateText, days) {
  const date = new Date(dateText);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function nowLocal() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function $(id) {
  return document.getElementById(id);
}
