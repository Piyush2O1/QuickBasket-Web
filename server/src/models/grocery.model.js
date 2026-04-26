import mongoose from "mongoose";

export const groceryCategories = [
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

export const groceryUnits = ["kg", "g", "liter", "ml", "piece", "pack"];

const grocerySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: groceryCategories,
      required: true,
    },
    price: {
      type: String,
      required: true,
    },
    unit: {
      type: String,
      enum: groceryUnits,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
  },
  { timestamps: true },
);

grocerySchema.index({ location: "2dsphere" });

export const Grocery = mongoose.models.Grocery || mongoose.model("Grocery", grocerySchema);
