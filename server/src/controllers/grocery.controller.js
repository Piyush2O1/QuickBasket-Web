import { Grocery, groceryCategories, groceryUnits } from "../models/grocery.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { badRequest, notFound } from "../utils/httpError.js";
import { buildPagination, getPagination } from "../utils/pagination.js";
import { uploadBufferToCloudinary } from "../services/cloudinary.service.js";

const parseStock = (value) => {
  if (value === undefined || value === null || value === "") {
    return 0;
  }

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    throw badRequest("Stock must be 0 or greater");
  }

  return Math.floor(parsedValue);
};

const hasValidPointLocation = (location) =>
  location?.type === "Point" &&
  Array.isArray(location.coordinates) &&
  location.coordinates.length === 2 &&
  Number.isFinite(Number(location.coordinates[0])) &&
  Number.isFinite(Number(location.coordinates[1])) &&
  !(Number(location.coordinates[0]) === 0 && Number(location.coordinates[1]) === 0);

const getAdminProductLocation = (user) =>
  hasValidPointLocation(user?.location)
    ? {
        type: "Point",
        coordinates: [Number(user.location.coordinates[0]), Number(user.location.coordinates[1])],
      }
    : undefined;

export const listGroceries = asyncHandler(async (req, res) => {
  const { category, search } = req.query;
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  if (category) filter.category = category;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
    ];
  }

  const [total, groceries] = await Promise.all([
    Grocery.countDocuments(filter),
    limit > 0
      ? Grocery.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
      : Grocery.find(filter).sort({ createdAt: -1 }),
  ]);

  res.json({
    groceries,
    categories: groceryCategories,
    units: groceryUnits,
    pagination: buildPagination({ total, page, limit }),
  });
});

export const createGrocery = asyncHandler(async (req, res) => {
  const { name, category, price, unit, image, stock } = req.body;

  if (!name || !category || !price || !unit) {
    throw badRequest("Name, category, price and unit are required");
  }

  let imageUrl = image;
  if (req.file?.buffer) {
    imageUrl = await uploadBufferToCloudinary(req.file.buffer, "quickbasket/groceries");
  }

  if (!imageUrl) {
    throw badRequest("Grocery image is required");
  }

  const grocery = await Grocery.create({
    name,
    category,
    price,
    unit,
    image: imageUrl,
    stock: parseStock(stock),
    location: getAdminProductLocation(req.user),
  });
  res.status(201).json({ grocery });
});

export const updateGrocery = asyncHandler(async (req, res) => {
  const grocery = await Grocery.findById(req.params.id);

  if (!grocery) {
    throw notFound("Grocery not found");
  }

  const { name, category, price, unit, image, stock } = req.body;
  if (name) grocery.name = name;
  if (category) grocery.category = category;
  if (price) grocery.price = price;
  if (unit) grocery.unit = unit;
  if (stock !== undefined) grocery.stock = parseStock(stock);
  if (image) grocery.image = image;
  const adminLocation = getAdminProductLocation(req.user);
  if (adminLocation) grocery.location = adminLocation;
  if (req.file?.buffer) {
    grocery.image = await uploadBufferToCloudinary(req.file.buffer, "quickbasket/groceries");
  }

  await grocery.save();
  res.json({ grocery });
});

export const deleteGrocery = asyncHandler(async (req, res) => {
  const grocery = await Grocery.findByIdAndDelete(req.params.id);

  if (!grocery) {
    throw notFound("Grocery not found");
  }

  res.json({ success: true });
});
