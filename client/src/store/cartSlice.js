import { createSlice } from "@reduxjs/toolkit";

const guestOwnerId = "guest";

const normalizeOwnerId = (ownerId) => String(ownerId || guestOwnerId).trim().toLowerCase();

const getCartStorageKey = (ownerId) => `quickbasket_cart:${normalizeOwnerId(ownerId)}`;

const readCart = (ownerId) => {
  if (typeof localStorage === "undefined") {
    return [];
  }

  try {
    const nextItems = JSON.parse(localStorage.getItem(getCartStorageKey(ownerId)));

    if (Array.isArray(nextItems)) {
      return nextItems;
    }

    if (normalizeOwnerId(ownerId) === guestOwnerId) {
      return JSON.parse(localStorage.getItem("quickbasket_cart")) || [];
    }

    return [];
  } catch {
    return [];
  }
};

const saveCart = (ownerId, items) => {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(getCartStorageKey(ownerId), JSON.stringify(items));
};

const initialOwnerId = guestOwnerId;

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    ownerId: initialOwnerId,
    items: readCart(initialOwnerId),
  },
  reducers: {
    syncCartOwner: (state, action) => {
      const nextOwnerId = normalizeOwnerId(action.payload);

      if (state.ownerId === nextOwnerId) {
        return;
      }

      state.ownerId = nextOwnerId;
      state.items = readCart(nextOwnerId);
    },
    addItem: (state, action) => {
      const item = action.payload;
      const id = item._id || item.id;
      const existing = state.items.find((cartItem) => (cartItem._id || cartItem.id) === id);

      if (existing) {
        existing.quantity += 1;
      } else {
        state.items.push({ ...item, quantity: 1 });
      }

      saveCart(state.ownerId, state.items);
    },
    increaseItem: (state, action) => {
      const item = state.items.find((cartItem) => (cartItem._id || cartItem.id) === action.payload);

      if (item) {
        item.quantity += 1;
        saveCart(state.ownerId, state.items);
      }
    },
    decreaseItem: (state, action) => {
      const item = state.items.find((cartItem) => (cartItem._id || cartItem.id) === action.payload);

      if (item && item.quantity > 1) {
        item.quantity -= 1;
        saveCart(state.ownerId, state.items);
      }
    },
    removeItem: (state, action) => {
      state.items = state.items.filter((cartItem) => (cartItem._id || cartItem.id) !== action.payload);
      saveCart(state.ownerId, state.items);
    },
    clearCart: (state) => {
      state.items = [];
      saveCart(state.ownerId, []);
    },
  },
});

export const { addItem, clearCart, decreaseItem, increaseItem, removeItem, syncCartOwner } =
  cartSlice.actions;
export default cartSlice.reducer;
