const expenseCategories = ["Food", "Household products", "Clothing", "Transportation"];

for (const expense of state.orders) {
  if (!expenseCategories.includes(expense.category)) expense.category = "Food";
}

const expenseForm = $("foodform");
const expenseTypeField = document.createElement("label");
expenseTypeField.className = "expense-type-field";
expenseTypeField.innerHTML = `Category
  <select id="expensecategory" aria-label="Expense category">
    ${expenseCategories.map((category) => `<option>${category}</option>`).join("")}
  </select>`;
expenseForm.before(expenseTypeField);
document.querySelector('label[for="restaurant"]').textContent = "Item or place";
$("restaurant").placeholder = "Restaurant, product, store, subway…";

const expenseCategory = $("expensecategory");
const restaurantShortcuts = document.querySelector(".restaurant-shortcuts");
const categoryFor = (expense) => expenseCategories.includes(expense.category) ? expense.category : "Food";

function syncExpenseFormCategory() {
  restaurantShortcuts.hidden = expenseCategory.value !== "Food";
}

function expenseRows(expenses, selectedDate, interactive = true) {
  return expenseCategories.map((category) => {
    const categoryExpenses = expenses.filter((expense) => categoryFor(expense) === category);
    return `<section class="expense-group">
      <h4>${esc(category)}</h4>
      ${categoryExpenses.length ? categoryExpenses.map((expense) => `
        <div class="food-order ${expense.date === selectedDate ? "chosen-day" : ""}">
          <div>
            <span class="food-date">${new Date(`${expense.date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
            <strong>${esc(expense.restaurant)}</strong>
          </div>
          <span class="order-price">${expense.price === null ? "No price yet" : money(expense.price)}</span>
          ${interactive ? `<button type="button" data-food-edit="${esc(expense.id)}">Edit</button>
          <button type="button" data-food-delete="${esc(expense.id)}" aria-label="Delete ${esc(expense.restaurant)}">×</button>` : ""}
        </div>`).join("") : '<p class="expense-empty">No entries yet.</p>'}
    </section>`;
  }).join("");
}

renderFood = function renderExpenses() {
  if (editingOrder) resetFoodForm();
  const selected = $("day").value;
  const day = new Date(`${selected}T12:00:00`);
  const start = new Date(day);
  start.setDate(day.getDate() - (day.getDay() + 6) % 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const formatDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const expenses = state.orders
    .filter((expense) => expense.date >= formatDate(start) && expense.date <= formatDate(end))
    .sort((a, b) => b.date.localeCompare(a.date));

  $("foodday").textContent = `Add for ${day.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}`;
  $("foodrange").textContent = `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  $("restaurant-options").innerHTML = [...new Set(["Slimak", "Gertie's", ...state.orders.map((expense) => expense.restaurant)])]
    .map((name) => `<option value="${esc(name)}"></option>`)
    .join("");
  $("foodorders").innerHTML = expenseRows(expenses, selected);

  const missing = expenses.filter((expense) => expense.price === null).length;
  const total = expenses.reduce((sum, expense) => sum + (expense.price ?? 0), 0);
  $("foodtotal").innerHTML = `<div><span>${expenses.length} ${expenses.length === 1 ? "expense" : "expenses"} this week</span><strong>${money(total)}</strong></div>${missing ? `<small>${missing} ${missing === 1 ? "entry is" : "entries are"} missing a price.</small>` : ""}`;
  syncExpenseFormCategory();
};

expenseForm.onsubmit = (event) => {
  event.preventDefault();
  const restaurant = $("restaurant").value.trim();
  const rawPrice = $("foodprice").value;
  const price = rawPrice === "" ? null : Number(rawPrice);
  if (!restaurant || (price !== null && (!Number.isFinite(price) || price < 0 || price > 100000))) return;
  if (editingOrder) {
    const expense = state.orders.find((entry) => entry.id === editingOrder);
    if (expense) {
      expense.restaurant = restaurant;
      expense.price = price;
      expense.category = expenseCategory.value;
    }
  } else {
    state.orders.push({
      id: globalThis.crypto?.randomUUID?.() || `expense-${Date.now()}`,
      restaurant,
      price,
      category: expenseCategory.value,
      date: $("day").value,
    });
  }
  resetFoodForm();
  save();
};

resetFoodForm = function resetExpenseForm() {
  editingOrder = null;
  $("restaurant").value = "";
  $("foodprice").value = "";
  expenseCategory.value = "Food";
  $("foodsave").textContent = "Add expense";
  $("foodcancel").hidden = true;
  syncExpenseFormCategory();
};

$("foodcancel").onclick = resetFoodForm;
$("foodorders").onclick = (event) => {
  const edit = event.target.closest("[data-food-edit]");
  const remove = event.target.closest("[data-food-delete]");
  if (edit) {
    const expense = state.orders.find((entry) => entry.id === edit.dataset.foodEdit);
    if (!expense) return;
    editingOrder = expense.id;
    $("restaurant").value = expense.restaurant;
    $("foodprice").value = expense.price ?? "";
    expenseCategory.value = categoryFor(expense);
    $("foodsave").textContent = "Save expense";
    $("foodcancel").hidden = false;
    $("foodday").textContent = `Editing expense from ${expense.date}`;
    syncExpenseFormCategory();
    $("foodprice").focus();
  }
  if (remove) {
    state.orders = state.orders.filter((entry) => entry.id !== remove.dataset.foodDelete);
    if (editingOrder === remove.dataset.foodDelete) resetFoodForm();
    save();
  }
};

expenseCategory.onchange = syncExpenseFormCategory;

const baseRenderSummaryForExpenses = renderSummary;
renderSummary = function renderSummaryWithExpenseGroups() {
  baseRenderSummaryForExpenses();
  const selected = $("day").value;
  const expenses = state.orders.filter((expense) => expense.date === selected);
  $("summaryfood").innerHTML = expenseRows(expenses, selected, false);
  if (expenses.length) {
    const missing = expenses.filter((expense) => expense.price === null).length;
    const total = expenses.reduce((sum, expense) => sum + (expense.price ?? 0), 0);
    $("summaryfood").innerHTML += `<p class="summary-food-total">Total recorded: ${money(total)}${missing ? ` · ${missing} missing ${missing === 1 ? "price" : "prices"}` : ""}</p>`;
  }
};

resetFoodForm();
renderFood();
renderSummary();
