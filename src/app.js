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

  const styleCategory = categories.find((category) => category.id === "style");
  const selectedStyle = state.selected.get("style");
  const selectedStyleId = selectedStyle ? Array.from(selectedStyle)[0] : null;

  const processOrder = [
    "fats",
    "aromatics",
    "spices",
    "proteins",
    "vegetables",
    "sauces",
    "carbs",
    "finishes"
  ];

  const containerWidth = treeCanvas.clientWidth || 1200;
  const containerHeight = treeCanvas.clientHeight || 520;
  const padX = 60;
  const padY = 60;
  const nodeW = 200;
  const nodeH = 32;

  const totalColumns = processOrder.length + 3;
  const availableWidth = Math.max(860, containerWidth) - padX * 2 - nodeW;
  const colGap = Math.max(160, Math.floor(availableWidth / (totalColumns - 1)));

  const styleCount = state.styleCollapsed ? 1 : styleCategory.items.length;
  const maxCategoryItems = Math.max(
    ...processOrder.map((categoryId) => {
      if (state.collapsedCategories.has(categoryId)) {
        return 1;
      }
      const category = categories.find((entry) => entry.id === categoryId);
      return category ? category.items.length : 1;
    })
  );

  const maxVerticalItems = Math.max(styleCount, maxCategoryItems, 4);
  const availableHeight = Math.max(420, containerHeight) - padY * 2;
  const itemGap = Math.max(32, Math.min(54, Math.floor(availableHeight / maxVerticalItems)));
  const itemOffset = Math.max(120, Math.min(200, colGap - 30));

  const layout = {
    padX,
    padY,
    colGap,
    itemGap,
    nodeW,
    nodeH,
    itemOffset
  };

  const hubY = layout.padY + Math.max(styleCount, maxCategoryItems) * layout.itemGap * 1.1;
  const styleHubX = layout.padX;
  const styleNodeX = styleHubX + layout.colGap;
  const processStartX = styleNodeX + layout.colGap;

  const styleHub = {
    id: "styleHub",
    label: "Cooking Style",
    x: styleHubX,
    y: hubY,
    type: "hub"
  };

  const styleNodes = state.styleCollapsed
    ? []
    : styleCategory.items.map((style, index) => {
        const spread = (styleCategory.items.length - 1) * layout.itemGap * 1.1;
        const startY = hubY - spread / 2;
        return {
          id: style.id,
          label: style.name,
          x: styleNodeX,
          y: startY + index * layout.itemGap * 1.1,
          type: "style"
        };
      });

  const processNodes = processOrder.map((categoryId, index) => {
    const category = categories.find((entry) => entry.id === categoryId);
    return {
      id: `step-${categoryId}`,
      label: category ? category.label : categoryId,
      categoryId,
      x: processStartX + index * layout.colGap,
      y: hubY,
      type: "hub"
    };
  });

  const finalNode = {
    id: "final",
    label: "Final Dish",
    x: processStartX + processOrder.length * layout.colGap,
    y: hubY,
    type: "hub"
  };

  const ingredientNodes = [];
  processNodes.forEach((node) => {
    const category = categories.find((entry) => entry.id === node.categoryId);
    if (!category) {
      return;
    }
    const isCollapsed = state.collapsedCategories.has(category.id);
    const items = isCollapsed ? [] : category.items;
    const itemCount = items.length || 1;
    const startY = node.y - ((itemCount - 1) * layout.itemGap) / 2;

    if (items.length) {
      items.forEach((item, index) => {
        ingredientNodes.push({
          id: item.id,
          label: item.name,
          categoryId: category.id,
          x: node.x - layout.itemOffset,
          y: startY + index * layout.itemGap,
          type: "ingredient"
        });
      });
    }
  });

  const allNodes = [styleHub, finalNode, ...styleNodes, ...processNodes, ...ingredientNodes];
  const minX = Math.min(...allNodes.map((node) => node.x));
  const maxX = Math.max(...allNodes.map((node) => node.x + layout.nodeW));
  const minY = Math.min(...allNodes.map((node) => node.y));
  const maxY = Math.max(...allNodes.map((node) => node.y + layout.nodeH));

  const width = maxX - minX + layout.padX * 2;
  const height = maxY - minY + layout.padY * 2;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `${minX - layout.padX} ${minY - layout.padY} ${width} ${height}`);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Ingredient cooking process tree");

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
    const processNode = processNodes.find((node) => node.categoryId === ingredient.categoryId);
    addEdge(ingredient, processNode, Boolean(isSelected));
  });

  if (state.styleCollapsed) {
    addEdge(styleHub, processNodes[0], Boolean(selectedStyleId));
  } else {
    styleNodes.forEach((styleNode) => {
      const isSelected = styleNode.id === selectedStyleId;
      addEdge(styleHub, styleNode, isSelected);
      if (isSelected) {
        addEdge(styleNode, processNodes[0], true);
      }
    });
  }

  processNodes.forEach((node, index) => {
    if (index < processNodes.length - 1) {
      const hasSelection = state.selected.get(node.categoryId)?.size > 0;
      addEdge(node, processNodes[index + 1], hasSelection);
    }
  });

  addEdge(processNodes[processNodes.length - 1], finalNode, Boolean(selectedStyleId));

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

  processNodes.forEach((node) => {
    const isCollapsed = state.collapsedCategories.has(node.categoryId);
    const hasSelection = state.selected.get(node.categoryId)?.size > 0;
    addNode(node, {
      isSelected: hasSelection,
      isHub: true,
      badge: badgeMap[node.categoryId],
      onClick: () => toggleCategoryCollapse(node.categoryId)
    });

    if (isCollapsed) {
      const hintNode = {
        id: `hint-${node.categoryId}`,
        label: "Show items",
        x: node.x,
        y: node.y + layout.nodeH + 6
      };
      addNode(hintNode, {
        isHub: false,
        onClick: () => toggleCategoryCollapse(node.categoryId)
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
