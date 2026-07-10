// =============================================
// Expense & Budget Visualizer — script.js
// =============================================

// ---------- Category config ----------
const CATEGORY_ICON = {
  Food: "🍔",
  Transport: "🚗",
  Fun: "🎮",
  Health: "💊",
  Education: "📚",
  Shopping: "🛍️",
  Other: "📦",
};

const CATEGORY_COLOR = {
  Food: "#f6ad55",
  Transport: "#63b3ed",
  Fun: "#9f7aea",
  Health: "#68d391",
  Education: "#fc8181",
  Shopping: "#f687b3",
  Other: "#a0aec0",
};

// ---------- State ----------
let transactions = [];
let chartInstance = null;
let currentSort = "newest";   // "newest" | "amount" | "category"
let spendingLimit = 0;        // 0 = no limit
let isDark = false;

// ---------- DOM refs ----------
const form             = document.getElementById("transaction-form");
const inputName        = document.getElementById("item-name");
const inputAmount      = document.getElementById("item-amount");
const inputCategory    = document.getElementById("item-category");
const errorMsg         = document.getElementById("error-msg");
const totalBalanceEl   = document.getElementById("total-balance");
const transactionListEl= document.getElementById("transaction-list");
const emptyMsg         = document.getElementById("empty-msg");
const chartEmptyMsg    = document.getElementById("chart-empty-msg");
const chartCanvas      = document.getElementById("expense-chart");
const btnTheme         = document.getElementById("btn-theme");
const sortButtons      = document.querySelectorAll(".btn-sort");
const inputLimit       = document.getElementById("spending-limit");
const btnSetLimit      = document.getElementById("btn-set-limit");
const limitInfo        = document.getElementById("limit-info");

// ---------- Utility: format Rupiah ----------
function formatRupiah(amount) {
  return (
    "Rp " +
    amount.toLocaleString("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  );
}

// ---------- Security: escape HTML ----------
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ---------- LocalStorage ----------
function saveToStorage() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

function loadFromStorage() {
  const saved = localStorage.getItem("transactions");
  if (saved) {
    try { transactions = JSON.parse(saved); }
    catch { transactions = []; }
  }

  const savedLimit = localStorage.getItem("spendingLimit");
  if (savedLimit !== null) {
    spendingLimit = Number(savedLimit);
    if (spendingLimit > 0) {
      inputLimit.value = spendingLimit;
      limitInfo.textContent = `Limit aktif: ${formatRupiah(spendingLimit)}`;
    }
  }

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") applyTheme(true);
}

// ---------- Feature 1: Dark / Light Mode ----------
function applyTheme(dark) {
  isDark = dark;
  document.body.classList.toggle("dark", dark);
  btnTheme.textContent = dark ? "☀️ Light Mode" : "🌙 Dark Mode";
  localStorage.setItem("theme", dark ? "dark" : "light");

  // Re-render chart so legend text colour updates
  if (chartInstance) {
    const legendColor = dark ? "#e2e8f0" : "#4a5568";
    chartInstance.options.plugins.legend.labels.color = legendColor;
    chartInstance.update();
  }
}

btnTheme.addEventListener("click", () => applyTheme(!isDark));

// ---------- Feature 2: Sort ----------
function getSortedTransactions() {
  const copy = [...transactions];
  switch (currentSort) {
    case "amount":
      return copy.sort((a, b) => b.amount - a.amount);
    case "category":
      return copy.sort((a, b) => a.category.localeCompare(b.category));
    case "newest":
    default:
      return copy.reverse(); // newest = last added → reverse
  }
}

sortButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentSort = btn.dataset.sort;
    sortButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    renderList();
  });
});

// ---------- Feature 3: Spending Limit ----------
btnSetLimit.addEventListener("click", () => {
  const val = parseInt(inputLimit.value, 10);
  if (!inputLimit.value || isNaN(val) || val <= 0) {
    spendingLimit = 0;
    limitInfo.textContent = "Limit dihapus.";
    localStorage.removeItem("spendingLimit");
  } else {
    spendingLimit = val;
    limitInfo.textContent = `Limit aktif: ${formatRupiah(spendingLimit)}`;
    localStorage.setItem("spendingLimit", spendingLimit);
  }
  renderList();
});

// ---------- Render: Balance ----------
function renderBalance() {
  const total = transactions.reduce((sum, item) => sum + item.amount, 0);
  totalBalanceEl.textContent = formatRupiah(total);
}

// ---------- Render: Transaction List ----------
function renderList() {
  transactionListEl.innerHTML = "";

  if (transactions.length === 0) {
    emptyMsg.style.display = "block";
    return;
  }

  emptyMsg.style.display = "none";

  const sorted = getSortedTransactions();

  sorted.forEach((tx) => {
    const isOverLimit = spendingLimit > 0 && tx.amount > spendingLimit;
    const icon = CATEGORY_ICON[tx.category] || "📦";

    const li = document.createElement("li");
    li.className = "transaction-item" + (isOverLimit ? " over-limit" : "");
    li.setAttribute("data-id", tx.id);

    li.innerHTML = `
      <span class="transaction-icon" aria-hidden="true">${icon}</span>
      <div class="transaction-info">
        <p class="transaction-name">${escapeHtml(tx.name)}</p>
        <p class="transaction-category">${escapeHtml(tx.category)}</p>
      </div>
      ${isOverLimit ? '<span class="over-limit-badge">⚠️ Over Limit</span>' : ""}
      <span class="transaction-amount">-${formatRupiah(tx.amount)}</span>
      <button
        class="btn-delete"
        aria-label="Hapus transaksi ${escapeHtml(tx.name)}"
        data-id="${tx.id}"
      >✕</button>
    `;

    transactionListEl.appendChild(li);
  });
}

// ---------- Render: Pie Chart ----------
function renderChart() {
  if (transactions.length === 0) {
    chartEmptyMsg.style.display = "block";
    chartCanvas.style.display = "none";
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
    return;
  }

  chartEmptyMsg.style.display = "none";
  chartCanvas.style.display = "block";

  // Aggregate by category
  const totals = {};
  transactions.forEach((tx) => {
    totals[tx.category] = (totals[tx.category] || 0) + tx.amount;
  });

  const labels = Object.keys(totals);
  const data   = Object.values(totals);
  const colors = labels.map((l) => CATEGORY_COLOR[l] || "#a0aec0");
  const legendColor = isDark ? "#e2e8f0" : "#4a5568";

  if (chartInstance) {
    chartInstance.data.labels = labels;
    chartInstance.data.datasets[0].data = data;
    chartInstance.data.datasets[0].backgroundColor = colors;
    chartInstance.options.plugins.legend.labels.color = legendColor;
    chartInstance.update();
    return;
  }

  chartInstance = new Chart(chartCanvas, {
    type: "pie",
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderColor: "#fff",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding: 16,
            font: { size: 13 },
            color: legendColor,
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const value = context.parsed;
              const pct = ((value / total) * 100).toFixed(1);
              return ` ${formatRupiah(value)} (${pct}%)`;
            },
          },
        },
      },
    },
  });
}

// ---------- Render: All ----------
function renderAll() {
  renderBalance();
  renderList();
  renderChart();
}

// ---------- Add Transaction ----------
function addTransaction(name, amount, category) {
  const tx = {
    id: Date.now(),
    name: name.trim(),
    amount: parseInt(amount, 10),
    category,
  };
  transactions.push(tx);
  saveToStorage();
  renderAll();
}

// ---------- Delete Transaction ----------
function deleteTransaction(id) {
  const numId = Number(id);
  const index = transactions.findIndex((tx) => tx.id === numId);
  if (index !== -1) {
    transactions.splice(index, 1);
    saveToStorage();
    renderAll();
  }
}

// ---------- Form submit ----------
form.addEventListener("submit", function (e) {
  e.preventDefault();

  const name     = inputName.value.trim();
  const amount   = inputAmount.value.trim();
  const category = inputCategory.value;

  if (!name || !amount || !category) {
    errorMsg.textContent = "Please fill all fields.";
    return;
  }

  if (isNaN(Number(amount)) || Number(amount) <= 0) {
    errorMsg.textContent = "Jumlah harus berupa angka positif.";
    return;
  }

  errorMsg.textContent = "";
  addTransaction(name, amount, category);

  // Reset form
  inputName.value     = "";
  inputAmount.value   = "";
  inputCategory.value = "";
  inputName.focus();
});

// ---------- Delete via event delegation ----------
transactionListEl.addEventListener("click", function (e) {
  const btn = e.target.closest(".btn-delete");
  if (btn) deleteTransaction(btn.getAttribute("data-id"));
});

// ---------- Init ----------
loadFromStorage();
renderAll();
