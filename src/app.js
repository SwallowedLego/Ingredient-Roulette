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
  amounts: new Map(),
  collapsedCategories: new Set(),
  styleCollapsed: false
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

const toggleCategoryCollapse = (categoryId) => {
  if (state.collapsedCategories.has(categoryId)) {
    state.collapsedCategories.delete(categoryId);
  } else {
    state.collapsedCategories.add(categoryId);
  }
  render();
};

const toggleStyleCollapse = () => {
  state.styleCollapsed = !state.styleCollapsed;
  render();
};

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

  const defaultSteps = [
    "Choose a cooking style to generate steps.",
    "Randomize to get a full process path.",
    "Pick ingredients to customize the flow."
  ];

  const collectItems = (categoryId) => {
    const category = categories.find((entry) => entry.id === categoryId);
    const selectedItems = state.selected.get(categoryId);
    if (!category || !selectedItems || selectedItems.size === 0) {
      return [];
    }
    return Array.from(selectedItems)
      .map((itemId) => {
        const item = category.items.find((entry) => entry.id === itemId);
        if (!item) {
          return null;
        }
        const amount = state.amounts.get(itemId);
        return amount ? `${item.name} (${amount})` : item.name;
      })
      .filter(Boolean);
  };

  const fats = collectItems("fats");
  const aromatics = collectItems("aromatics");
  const spices = collectItems("spices");
  const proteins = collectItems("proteins");
  const vegetables = collectItems("vegetables");
  const sauces = collectItems("sauces");
  const carbs = collectItems("carbs");
  const finishes = collectItems("finishes");

  const hasIngredients =
    fats.length ||
    aromatics.length ||
    spices.length ||
    proteins.length ||
    vegetables.length ||
    sauces.length ||
    carbs.length ||
    finishes.length;

  const carbMethod = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes("nood")) {
      return "boil";
    }
    if (lower.includes("rice")) {
      return "steam";
    }
    if (lower.includes("potato")) {
      return "roast";
    }
    return "cook";
  };

  const steps = [];

  if (!style || !hasIngredients) {
    steps.push(...defaultSteps);
  } else {
    if (styleId === "roast") {
      steps.push("Heat oven to 220C.");
      if (fats.length || aromatics.length || spices.length) {
        const flavorBits = [...fats, ...aromatics, ...spices].join(", ");
        steps.push(`Toss ${flavorBits} together to coat and season.`);
      }
      if (proteins.length || vegetables.length) {
        const roastItems = [...proteins, ...vegetables].join(", ");
        steps.push(`Roast ${roastItems} on a sheet pan until browned and tender.`);
      }
      if (carbs.length) {
        const carbLines = carbs
          .map((item) => `${carbMethod(item)} ${item}`)
          .join(", ");
        steps.push(`Meanwhile, ${carbLines}.`);
      }
      if (sauces.length) {
        steps.push(`Finish with sauces: ${sauces.join(", ")}.`);
      }
      if (finishes.length) {
        steps.push(`Add finishes: ${finishes.join(", ")}.`);
      }
    } else if (styleId === "stirfry") {
      steps.push("Heat a wok or skillet until hot.");
      if (fats.length) {
        steps.push(`Add ${fats.join(", ")} to the pan.`);
      }
      if (proteins.length) {
        steps.push(`Sear ${proteins.join(", ")} until just cooked, then remove.`);
      }
      if (aromatics.length || spices.length) {
        const aromaticsLine = [...aromatics, ...spices].join(", ");
        steps.push(`Stir-fry ${aromaticsLine} for 30 seconds to bloom.`);
      }
      if (vegetables.length) {
        steps.push(`Add ${vegetables.join(", ")} and toss until crisp-tender.`);
      }
      if (sauces.length) {
        steps.push(`Return protein and add sauces: ${sauces.join(", ")}.`);
      }
      if (carbs.length) {
        const carbLines = carbs
          .map((item) => `${carbMethod(item)} ${item}`)
          .join(", ");
        steps.push(`Cook carbs separately, then serve with the stir-fry: ${carbLines}.`);
      }
      if (finishes.length) {
        steps.push(`Finish with ${finishes.join(", ")}.`);
      }
    } else if (styleId === "braise") {
      steps.push("Heat a pot over medium-high heat.");
      if (fats.length) {
        steps.push(`Add ${fats.join(", ")} to the pot.`);
      }
      if (proteins.length) {
        steps.push(`Brown ${proteins.join(", ")} for color, then remove.`);
      }
      if (aromatics.length || spices.length) {
        const aromaticsLine = [...aromatics, ...spices].join(", ");
        steps.push(`Cook ${aromaticsLine} until fragrant.`);
      }
      if (vegetables.length) {
        steps.push(`Add ${vegetables.join(", ")} and cook briefly.`);
      }
      if (sauces.length) {
        steps.push(`Stir in sauces and enough liquid to cover.`);
      }
      steps.push("Return protein, cover, and simmer until tender.");
      if (carbs.length) {
        const carbLines = carbs
          .map((item) => `${carbMethod(item)} ${item}`)
          .join(", ");
        steps.push(`Cook carbs separately: ${carbLines}.`);
      }
      if (finishes.length) {
        steps.push(`Finish with ${finishes.join(", ")}.`);
      }
    } else if (styleId === "grill") {
      steps.push("Preheat the grill on high.");
      if (fats.length || spices.length) {
        const seasoning = [...fats, ...spices].join(", ");
        steps.push(`Season with ${seasoning}.`);
      }
      if (proteins.length) {
        steps.push(`Grill ${proteins.join(", ")} until charred and cooked through.`);
      }
      if (vegetables.length) {
        steps.push(`Grill ${vegetables.join(", ")} until marked and tender.`);
      }
      if (sauces.length) {
        steps.push(`Glaze with ${sauces.join(", ")}.`);
      }
      if (carbs.length) {
        const carbLines = carbs
          .map((item) => `${carbMethod(item)} ${item}`)
          .join(", ");
        steps.push(`Prepare carbs alongside: ${carbLines}.`);
      }
      if (finishes.length) {
        steps.push(`Finish with ${finishes.join(", ")}.`);
      }
    }
  }

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
    colGap: 180,
    itemGap: 34,
    blockGap: 24,
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

  let cursorY = layout.padY;
  const ingredientNodes = [];
  const categoryNodes = [];

  ingredientCategories.forEach((category) => {
    const isCollapsed = state.collapsedCategories.has(category.id);
    const items = isCollapsed ? [] : category.items;
    const itemYs = [];

    if (items.length) {
      items.forEach((item) => {
        ingredientNodes.push({
          id: item.id,
          label: item.name,
          categoryId: category.id,
          x: colX[0],
          y: cursorY,
          type: "ingredient"
        });
        itemYs.push(cursorY);
        cursorY += layout.itemGap;
      });
    } else {
      itemYs.push(cursorY);
      cursorY += layout.itemGap;
    }

    const centerY = (itemYs[0] + itemYs[itemYs.length - 1]) / 2;
    categoryNodes.push({
      id: `cat-${category.id}`,
      label: category.label,
      categoryId: category.id,
      x: colX[1],
      y: centerY,
      type: "category"
    });

    cursorY += layout.blockGap;
  });

  const averageY = (nodes) =>
    nodes.reduce((sum, node) => sum + node.y, 0) / Math.max(nodes.length, 1);
  const hubY = averageY(categoryNodes) || layout.padY;

  const styleHub = {
    id: "styleHub",
    label: "Cooking Style",
    x: colX[2],
    y: hubY,
    type: "hub"
  };

  const styleNodes = state.styleCollapsed
    ? []
    : styleCategory.items.map((style, index) => {
        const spread = (styleCategory.items.length - 1) * layout.itemGap * 1.2;
        const startY = hubY - spread / 2;
        return {
          id: style.id,
          label: style.name,
          x: colX[3],
          y: startY + index * layout.itemGap * 1.2,
          type: "style"
        };
      });

  const finalNode = {
    id: "final",
    label: "Final Dish",
    x: colX[4],
    y: hubY,
    type: "hub"
  };

  const maxY = Math.max(
    hubY,
    ...ingredientNodes.map((node) => node.y),
    ...categoryNodes.map((node) => node.y),
    ...styleNodes.map((node) => node.y)
  );
  const minY = Math.min(
    hubY,
    ...ingredientNodes.map((node) => node.y),
    ...categoryNodes.map((node) => node.y),
    ...styleNodes.map((node) => node.y)
  );
  const height = maxY - minY + layout.padY * 2 + layout.nodeH;
  const width = colX[4] + layout.nodeW + layout.padX;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 ${minY - layout.padY} ${width} ${height}`);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Ingredient mind map tree");

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

  const badgeMap = {
    proteins: "P",
    vegetables: "V",
    carbs: "C",
    aromatics: "A",
    spices: "S",
    sauces: "Sa",
    fats: "F",
    finishes: "Fi",
    styleHub: "St",
    final: "FD"
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

    const labelX = options.badge ? node.x + 36 : node.x + 12;
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", labelX);
    text.setAttribute("y", node.y + layout.nodeH / 2 + 4);
    text.setAttribute("class", "tree-label");
    text.textContent = node.label;

    group.appendChild(rect);

    if (options.badge) {
      const badgeCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      badgeCircle.setAttribute("cx", node.x + 18);
      badgeCircle.setAttribute("cy", node.y + layout.nodeH / 2);
      badgeCircle.setAttribute("r", "9");
      badgeCircle.setAttribute("class", "tree-badge");

      const badgeText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      badgeText.setAttribute("x", node.x + 18);
      badgeText.setAttribute("y", node.y + layout.nodeH / 2 + 4);
      badgeText.setAttribute("text-anchor", "middle");
      badgeText.setAttribute("class", "tree-badge-text");
      badgeText.textContent = options.badge;

      group.appendChild(badgeCircle);
      group.appendChild(badgeText);
    }

    group.appendChild(text);

    if (options.onClick) {
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
    addEdge(categoryNode, styleHub, hasSelection);
  });

  styleNodes.forEach((styleNode) => {
    const isSelected = styleNode.id === selectedStyleId;
    addEdge(styleHub, styleNode, isSelected);
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
        onClick:
          state.mode === "pick"
            ? () => toggleSelection(ingredient.categoryId, ingredient.id)
            : null
      }
    );
  });

  categoryNodes.forEach((categoryNode) => {
    const isCollapsed = state.collapsedCategories.has(categoryNode.categoryId);
    const hasSelection = state.selected.get(categoryNode.categoryId)?.size > 0;
    addNode(categoryNode, {
      isSelected: hasSelection,
      isHub: true,
      badge: badgeMap[categoryNode.categoryId],
      onClick: () => toggleCategoryCollapse(categoryNode.categoryId)
    });

    if (isCollapsed) {
      const hintNode = {
        id: `hint-${categoryNode.categoryId}`,
        label: "Show items",
        x: categoryNode.x,
        y: categoryNode.y + layout.nodeH + 6
      };
      addNode(hintNode, {
        isHub: false,
        onClick: () => toggleCategoryCollapse(categoryNode.categoryId)
      });
    }
  });

  addNode(styleHub, {
    isHub: true,
    isSelected: Boolean(selectedStyleId),
    badge: badgeMap.styleHub,
    onClick: toggleStyleCollapse
  });

  styleNodes.forEach((styleNode) => {
    const isSelected = styleNode.id === selectedStyleId;
    addNode(styleNode, {
      isSelected,
      onClick:
        state.mode === "pick" ? () => toggleSelection("style", styleNode.id) : null
    });
  });

  addNode(finalNode, {
    isHub: true,
    isSelected: Boolean(selectedStyleId),
    badge: badgeMap.final
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
