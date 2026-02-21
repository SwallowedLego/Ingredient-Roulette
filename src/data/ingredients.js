export const categories = [
  {
    id: "style",
    label: "Cooking Style",
    minPick: 1,
    maxPick: 1,
    amount: null,
    items: [
      {
        id: "stirfry",
        name: "High-heat stir-fry",
        steps: [
          "Preheat the pan until it smokes lightly.",
          "Cook proteins first, then aromatics.",
          "Toss in vegetables and finish with sauce."
        ]
      },
      {
        id: "roast",
        name: "Sheet-pan roast",
        steps: [
          "Heat the oven to 220C.",
          "Roast proteins and vegetables together.",
          "Finish with a glaze or herbs."
        ]
      },
      {
        id: "braise",
        name: "Slow braise",
        steps: [
          "Brown the protein for depth.",
          "Add aromatics and liquid, cover, and simmer.",
          "Reduce the sauce and finish with herbs."
        ]
      },
      {
        id: "grill",
        name: "Grill + quick sear",
        steps: [
          "Oil the grates and preheat high.",
          "Sear proteins, then char vegetables.",
          "Rest everything before slicing."
        ]
      }
    ]
  },
  {
    id: "proteins",
    label: "Proteins",
    minPick: 1,
    maxPick: 2,
    amount: { min: 150, max: 350, step: 25, unit: "g" },
    items: [
      { id: "chicken", name: "Chicken thighs" },
      { id: "tofu", name: "Extra-firm tofu" },
      { id: "shrimp", name: "Shrimp" },
      { id: "beans", name: "Canned beans" },
      { id: "eggs", name: "Eggs" }
    ]
  },
  {
    id: "vegetables",
    label: "Vegetables",
    minPick: 2,
    maxPick: 4,
    amount: { min: 80, max: 220, step: 10, unit: "g" },
    items: [
      { id: "bellpepper", name: "Bell pepper" },
      { id: "zucchini", name: "Zucchini" },
      { id: "carrot", name: "Carrot" },
      { id: "broccoli", name: "Broccoli" },
      { id: "mushroom", name: "Mushroom" },
      { id: "spinach", name: "Spinach" },
      { id: "cabbage", name: "Cabbage" }
    ]
  },
  {
    id: "carbs",
    label: "Carbs",
    minPick: 1,
    maxPick: 2,
    amount: { min: 120, max: 250, step: 10, unit: "g" },
    items: [
      { id: "rice", name: "Rice" },
      { id: "noodles", name: "Noodles" },
      { id: "potatoes", name: "Baby potatoes" },
      { id: "tortillas", name: "Tortillas" }
    ]
  },
  {
    id: "aromatics",
    label: "Aromatics",
    minPick: 1,
    maxPick: 3,
    amount: { min: 10, max: 60, step: 5, unit: "g" },
    items: [
      { id: "garlic", name: "Garlic" },
      { id: "ginger", name: "Ginger" },
      { id: "shallot", name: "Shallot" },
      { id: "scallion", name: "Scallion" }
    ]
  },
  {
    id: "spices",
    label: "Spices",
    minPick: 1,
    maxPick: 3,
    amount: { min: 2, max: 10, step: 1, unit: "tsp" },
    items: [
      { id: "paprika", name: "Smoked paprika" },
      { id: "cumin", name: "Cumin" },
      { id: "chili", name: "Chili flakes" },
      { id: "pepper", name: "Black pepper" },
      { id: "coriander", name: "Coriander" }
    ]
  },
  {
    id: "sauces",
    label: "Sauces",
    minPick: 1,
    maxPick: 2,
    amount: { min: 15, max: 60, step: 5, unit: "ml" },
    items: [
      { id: "soy", name: "Soy sauce" },
      { id: "tomato", name: "Tomato paste" },
      { id: "coconut", name: "Coconut milk" },
      { id: "vinegar", name: "Vinegar" },
      { id: "mustard", name: "Mustard" }
    ]
  },
  {
    id: "fats",
    label: "Fats",
    minPick: 1,
    maxPick: 1,
    amount: { min: 10, max: 25, step: 5, unit: "ml" },
    items: [
      { id: "olive", name: "Olive oil" },
      { id: "butter", name: "Butter" },
      { id: "sesame", name: "Sesame oil" }
    ]
  },
  {
    id: "finishes",
    label: "Finishes",
    minPick: 0,
    maxPick: 2,
    amount: { min: 5, max: 20, step: 5, unit: "g" },
    items: [
      { id: "herbs", name: "Fresh herbs" },
      { id: "citrus", name: "Citrus zest" },
      { id: "seeds", name: "Toasted seeds" },
      { id: "cheese", name: "Grated cheese" }
    ]
  }
];
