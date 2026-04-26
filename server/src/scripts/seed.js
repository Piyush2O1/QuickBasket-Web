import bcrypt from "bcryptjs";
import { connectDb } from "../config/db.js";
import { env, requireEnv } from "../config/env.js";
import { Grocery } from "../models/grocery.model.js";
import { User } from "../models/user.model.js";

const groceries = [
  {
    name: "Fresh Bananas",
    category: "Fruits & Vegetables",
    price: "60",
    unit: "piece",
    image: "https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Tomatoes",
    category: "Fruits & Vegetables",
    price: "45",
    unit: "kg",
    image: "https://images.unsplash.com/photo-1546470427-e26264be0b0d?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Amul Milk",
    category: "Dairy & Eggs",
    price: "64",
    unit: "liter",
    image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Basmati Rice",
    category: "Rice, Atta & Grains",
    price: "155",
    unit: "kg",
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Masala Chips",
    category: "Snacks & Biscuits",
    price: "30",
    unit: "pack",
    image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Orange Juice",
    category: "Beverages & Drinks",
    price: "120",
    unit: "liter",
    image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=900&q=80",
  },
];

const run = async () => {
  await connectDb();

  const adminEmail = requireEnv(env.adminEmail, "ADMIN_EMAIL").trim().toLowerCase();
  const adminPassword = requireEnv(env.adminPassword, "ADMIN_PASSWORD");
  const password = await bcrypt.hash(adminPassword, 10);
  await User.updateOne(
    { email: adminEmail },
    {
      name: env.adminName,
      email: adminEmail,
      password,
      role: "admin",
      mobile: env.adminMobile,
      emailVerified: true,
    },
    { upsert: true },
  );

  for (const grocery of groceries) {
    await Grocery.updateOne({ name: grocery.name }, grocery, { upsert: true });
  }

  console.log("Seed complete");
  console.log(`Admin email: ${adminEmail}`);
  process.exit(0);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
