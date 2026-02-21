import { categories } from "./data/ingredients.js";

const summary = document.getElementById("summary");
const processSteps = document.getElementById("processSteps");
const randomizeBtn = document.getElementById("randomizeBtn");
const resetBtn = document.getElementById("resetBtn");
const regenBtn = document.getElementById("regenBtn");
const modeToggle = document.getElementById("modeToggle");
const status = document.getElementById("status");
const recipeForm = document.getElementById("recipeForm");
const recipeName = document.getElementById("recipeName");
const recipeDetails = document.getElementById("recipeDetails");
const recipeList = document.getElementById("recipeList");
const refreshRecipes = document.getElementById("refreshRecipes");

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

const repoOwner = "SwallowedLego";
const repoName = "Ingredient-Roulette";

const renderRecipes = (recipes) => {
  recipeList.innerHTML = "";
  if (!recipes.length) {
    recipeList.innerHTML =
      "<p class=\"summary-item\">No recipes yet. Submit the first one!</p>";
    return;
  }
  recipes.forEach((recipe) => {
    const card = document.createElement("div");
    card.className = "recipe-card";

    const title = document.createElement("h4");
    title.textContent = recipe.name;
    card.appendChild(title);

    if (recipe.url) {
      const meta = document.createElement("a");
      meta.className = "recipe-meta";
      meta.href = recipe.url;
      meta.target = "_blank";
      meta.rel = "noreferrer";
      meta.textContent = "View on GitHub";
      card.appendChild(meta);
    }

    const details = document.createElement("p");
    details.textContent = recipe.details;
    card.appendChild(details);

    recipeList.appendChild(card);
  });
};

const fetchRecipes = async () => {
  recipeList.innerHTML = "<p class=\"summary-item\">Loading recipes...</p>";
  try {
    const response = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/issues?state=open&per_page=30`
    );
    if (!response.ok) {
      throw new Error("Failed to load");
    }
    const issues = await response.json();
    const recipes = issues
      .filter((issue) => issue.title.toLowerCase().startsWith("recipe:"))
      .map((issue) => ({
        name: issue.title.replace(/^recipe:\s*/i, ""),
        details: issue.body || "",
        url: issue.html_url
      }));
    renderRecipes(recipes);
  } catch (error) {
    recipeList.innerHTML =
      "<p class=\"summary-item\">Could not load recipes. Try refresh.</p>";
  }
};

const render = () => {
  renderSummary();
  renderProcess();
};

const buildRecipeText = () => {
  const lines = [];
  const blocks = summary.querySelectorAll(".summary-block");
  blocks.forEach((block) => {
    const title = block.querySelector("h3");
    const items = Array.from(block.querySelectorAll(".summary-item"))
      .map((entry) => entry.textContent)
      .join(", ");
    if (title && items) {
      lines.push(`${title.textContent}: ${items}`);
    }
  });
  const stepLines = Array.from(processSteps.querySelectorAll("li"))
    .map((li) => li.textContent)
    .join("\n");
  if (lines.length || stepLines) {
    return `${lines.join("\n")}\n\nSteps:\n${stepLines}`.trim();
  }
  return "";
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

recipeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = recipeName.value.trim();
  const details = recipeDetails.value.trim();
  if (!name || !details) {
    return;
  }
  const title = `Recipe: ${name}`;
  const url = `https://github.com/${repoOwner}/${repoName}/issues/new?title=${encodeURIComponent(
    title
  )}&body=${encodeURIComponent(details)}`;
  window.open(url, "_blank", "noopener,noreferrer");
  recipeForm.reset();
  recipeDetails.value = buildRecipeText();
});

refreshRecipes.addEventListener("click", fetchRecipes);

setStatus();
randomizeSelections();
render();
fetchRecipes();
recipeDetails.value = buildRecipeText();
