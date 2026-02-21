import { categories } from "./data/ingredients.js";

const treeCanvas = document.getElementById("treeCanvas");
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
  treeCanvas.innerHTML = "";

  const ingredientCategories = categories.filter((category) => category.id !== "style");
  const styleCategory = categories.find((category) => category.id === "style");
  const selectedStyle = state.selected.get("style");
  const selectedStyleId = selectedStyle ? Array.from(selectedStyle)[0] : null;

  const layout = {
    padX: 40,
    padY: 40,
    colGap: 220,
    rowGap: 42,
    nodeW: 170,
    nodeH: 28
  };

  const colX = [
    layout.padX,
    layout.padX + layout.colGap,
    layout.padX + layout.colGap * 2,
    layout.padX + layout.colGap * 3,
    layout.padX + layout.colGap * 4
  ];

  let currentY = layout.padY;
  const ingredientNodes = [];
  const categoryNodes = [];

  ingredientCategories.forEach((category) => {
    const startY = currentY;
    category.items.forEach((item) => {
      ingredientNodes.push({
        id: item.id,
        label: item.name,
        categoryId: category.id,
        x: colX[0],
        y: currentY,
        type: "ingredient"
      });
      currentY += layout.rowGap;
    });

    const endY = currentY - layout.rowGap;
    const centerY = (startY + endY) / 2;
    categoryNodes.push({
      id: `cat-${category.id}`,
      label: category.label,
      categoryId: category.id,
      x: colX[1],
      y: centerY,
      type: "category"
    });

    currentY += layout.rowGap * 0.6;
  });

  const averageY = (nodes) =>
    nodes.reduce((sum, node) => sum + node.y, 0) / Math.max(nodes.length, 1);
  const comboY = averageY(categoryNodes) || layout.padY;

  const comboNode = {
    id: "combo",
    label: "Combination Merge",
    x: colX[2],
    y: comboY,
    type: "hub"
  };

  const styleNodes = styleCategory.items.map((style, index) => {
    const spread = (styleCategory.items.length - 1) * layout.rowGap * 1.2;
    const startY = comboY - spread / 2;
    return {
      id: style.id,
      label: style.name,
      x: colX[3],
      y: startY + index * layout.rowGap * 1.2,
      type: "style"
    };
  });

  const finalNode = {
    id: "final",
    label: "Final Dish",
    x: colX[4],
    y: comboY,
    type: "hub"
  };

  const maxY = Math.max(
    ...ingredientNodes.map((node) => node.y),
    ...styleNodes.map((node) => node.y),
    comboY
  );
  const width = colX[4] + layout.nodeW + layout.padX;
  const height = maxY + layout.padY * 2;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Ingredient branching tree");

  const addEdge = (from, to, isSelected) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const startX = from.x + layout.nodeW;
    const startY = from.y + layout.nodeH / 2;
    const endX = to.x;
    const endY = to.y + layout.nodeH / 2;
    const midX = (startX + endX) / 2;
    const d = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
    path.setAttribute("d", d);
    path.setAttribute("class", `tree-edge${isSelected ? " selected" : ""}`);
    svg.appendChild(path);
  };

  const addNode = (node, options = {}) => {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", node.x);
    rect.setAttribute("y", node.y);
    rect.setAttribute("width", layout.nodeW);
    rect.setAttribute("height", layout.nodeH);
    rect.setAttribute("rx", "12");
    rect.setAttribute(
      "class",
      `tree-node${options.isHub ? " hub" : ""}${options.isSelected ? " selected" : ""}`
    );

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", node.x + 10);
    text.setAttribute("y", node.y + layout.nodeH / 2 + 4);
    text.setAttribute("class", "tree-label");

    if (options.lines && options.lines.length > 1) {
      text.textContent = "";
      options.lines.forEach((line, index) => {
        const tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
        tspan.setAttribute("x", node.x + 10);
        tspan.setAttribute("dy", index === 0 ? "0" : "14");
        tspan.setAttribute("class", index === 0 ? "tree-label" : "tree-label sub");
        tspan.textContent = line;
        text.appendChild(tspan);
      });
    } else {
      text.textContent = node.label;
    }

    group.appendChild(rect);
    group.appendChild(text);

    if (state.mode === "pick" && options.onClick) {
      group.style.cursor = "pointer";
      group.addEventListener("click", options.onClick);
    }

    svg.appendChild(group);
  };

  ingredientNodes.forEach((ingredient) => {
    const isSelected = state.selected.get(ingredient.categoryId)?.has(ingredient.id);
    const categoryNode = categoryNodes.find((node) => node.categoryId === ingredient.categoryId);
    addEdge(ingredient, categoryNode, Boolean(isSelected));
  });

  categoryNodes.forEach((categoryNode) => {
    const hasSelection = state.selected.get(categoryNode.categoryId)?.size > 0;
    addEdge(categoryNode, comboNode, hasSelection);
  });

  styleNodes.forEach((styleNode) => {
    const isSelected = styleNode.id === selectedStyleId;
    addEdge(comboNode, styleNode, isSelected);
    addEdge(styleNode, finalNode, isSelected);
  });

  ingredientNodes.forEach((ingredient) => {
    const isSelected = state.selected.get(ingredient.categoryId)?.has(ingredient.id);
    const amount = state.amounts.get(ingredient.id);
    const label = amount ? `${ingredient.label} (${amount})` : ingredient.label;
    addNode(
      { ...ingredient, label },
      {
        isSelected,
        onClick: () => toggleSelection(ingredient.categoryId, ingredient.id)
      }
    );
  });

  categoryNodes.forEach((categoryNode) => {
    const hasSelection = state.selected.get(categoryNode.categoryId)?.size > 0;
    addNode(categoryNode, { isSelected: hasSelection, isHub: true });
  });

  addNode(comboNode, { isHub: true, isSelected: Boolean(selectedStyleId) });

  styleNodes.forEach((styleNode) => {
    const isSelected = styleNode.id === selectedStyleId;
    addNode(styleNode, {
      isSelected,
      onClick: () => toggleSelection("style", styleNode.id)
    });
  });

  addNode(finalNode, {
    isHub: true,
    isSelected: Boolean(selectedStyleId)
  });

  treeCanvas.appendChild(svg);
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
