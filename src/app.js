import { categories } from "./data/ingredients.js";

const treeGrid = document.getElementById("treeGrid");
const summary = document.getElementById("summary");
const processSteps = document.getElementById("processSteps");
const randomizeBtn = document.getElementById("randomizeBtn");
const resetBtn = document.getElementById("resetBtn");
const regenBtn = document.getElementById("regenBtn");
const modeToggle = document.getElementById("modeToggle");
const status = document.getElementById("status");

const state = {
  mode: "random",
  selected: new Map(),
  amounts: new Map()
};

const shuffle = (list) => {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const randomFromRange = (min, max, step) => {
  const steps = Math.floor((max - min) / step);
  return min + step * Math.floor(Math.random() * (steps + 1));
};

const getCategoryById = (id) => categories.find((category) => category.id === id);

const setStatus = () => {
  status.textContent = state.mode === "random" ? "Mode: Randomize" : "Mode: Pick your own";
};

const toggleSelection = (categoryId, itemId) => {
  const category = getCategoryById(categoryId);
  const existing = state.selected.get(categoryId) || new Set();
  const isStyle = categoryId === "style";

  if (existing.has(itemId)) {
    existing.delete(itemId);
  } else {
    if (isStyle) {
      existing.clear();
    }
    existing.add(itemId);
  }

  state.selected.set(categoryId, existing);
  render();
};

const buildAmount = (category) => {
  if (!category.amount) {
    return "";
  }
  const value = randomFromRange(category.amount.min, category.amount.max, category.amount.step);
  return `${value} ${category.amount.unit}`;
};

const refreshAmounts = () => {
  state.amounts.clear();
  categories.forEach((category) => {
    const selectedItems = state.selected.get(category.id);
    if (!selectedItems || selectedItems.size === 0) {
      return;
    }
    selectedItems.forEach((itemId) => {
      state.amounts.set(itemId, buildAmount(category));
    });
  });
};

const randomizeSelections = () => {
  state.selected.clear();
  categories.forEach((category) => {
    const shuffled = shuffle(category.items);
    const pickCount = randomFromRange(category.minPick, category.maxPick, 1);
    const picked = new Set(shuffled.slice(0, pickCount).map((item) => item.id));
    if (picked.size > 0) {
      state.selected.set(category.id, picked);
    }
  });
  refreshAmounts();
};

const resetSelections = () => {
  state.selected.clear();
  state.amounts.clear();
};

const renderSummary = () => {
  summary.innerHTML = "";
  categories.forEach((category) => {
    const selectedItems = state.selected.get(category.id);
    if (!selectedItems || selectedItems.size === 0) {
      return;
    }
    const block = document.createElement("div");
    block.className = "summary-block";

    const title = document.createElement("h3");
    title.textContent = category.label;
    block.appendChild(title);

    selectedItems.forEach((itemId) => {
      const item = category.items.find((entry) => entry.id === itemId);
      const line = document.createElement("div");
      line.className = "summary-item";
      const amount = state.amounts.get(itemId);
      line.textContent = amount ? `${item.name} - ${amount}` : item.name;
      block.appendChild(line);
    });

    summary.appendChild(block);
  });

  if (!summary.childNodes.length) {
    summary.innerHTML = "<div class=\"summary-item\">Pick ingredients or hit Randomize.</div>";
  }
};

const renderProcess = () => {
  processSteps.innerHTML = "";
  const styleSelection = state.selected.get("style");
  const styleId = styleSelection ? Array.from(styleSelection)[0] : null;
  const style = categories
    .find((category) => category.id === "style")
    .items.find((item) => item.id === styleId);

  const steps = style?.steps || [
    "Choose a cooking style to generate steps.",
    "Randomize to get a full process path.",
    "Pick ingredients to customize the flow."
  ];

  steps.forEach((step) => {
    const li = document.createElement("li");
    li.className = "process-step";
    li.textContent = step;
    processSteps.appendChild(li);
  });
};

const renderTree = () => {
  treeGrid.innerHTML = "";
  categories.forEach((category) => {
    const column = document.createElement("div");
    column.className = "tree-column";

    const header = document.createElement("div");
    header.className = "tree-header";
    const title = document.createElement("h3");
    title.textContent = category.label;
    const pill = document.createElement("span");
    const selectedItems = state.selected.get(category.id);
    pill.className = "count-pill";
    pill.textContent = selectedItems ? `${selectedItems.size} selected` : "0 selected";
    header.appendChild(title);
    header.appendChild(pill);
    column.appendChild(header);

    category.items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "tree-item";
      row.dataset.category = category.id;
      row.dataset.item = item.id;

      const name = document.createElement("span");
      name.textContent = item.name;
      row.appendChild(name);

      const amount = document.createElement("span");
      amount.className = "amount";
      amount.textContent = state.amounts.get(item.id) || "";
      row.appendChild(amount);

      if (selectedItems && selectedItems.has(item.id)) {
        row.classList.add("selected");
      }

      if (state.mode === "pick") {
        row.addEventListener("click", () => toggleSelection(category.id, item.id));
      }

      column.appendChild(row);
    });

    treeGrid.appendChild(column);
  });
};

const render = () => {
  renderTree();
  renderSummary();
  renderProcess();
};

modeToggle.addEventListener("change", (event) => {
  state.mode = event.target.checked ? "pick" : "random";
  setStatus();
  render();
});

randomizeBtn.addEventListener("click", () => {
  state.mode = "random";
  modeToggle.checked = false;
  randomizeSelections();
  setStatus();
  render();
});

regenBtn.addEventListener("click", () => {
  refreshAmounts();
  render();
});

resetBtn.addEventListener("click", () => {
  resetSelections();
  render();
});

setStatus();
randomizeSelections();
render();
