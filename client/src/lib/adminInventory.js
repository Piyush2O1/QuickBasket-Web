export const adminInventoryCategories = [
  "Fruits & Vegetables",
  "Dairy & Eggs",
  "Rice, Atta & Grains",
  "Snacks & Biscuits",
  "Spices & Masalas",
  "Beverages & Drinks",
  "Personal Care",
  "Household Essentials",
  "Instant & Packaged Food",
  "Baby & Pet Care",
];

export const adminInventoryUnits = ["kg", "g", "liter", "ml", "piece", "pack"];

export const createEmptyGroceryForm = () => ({
  name: "",
  category: adminInventoryCategories[0],
  price: "",
  unit: adminInventoryUnits[0],
  image: "",
  stock: "",
});
