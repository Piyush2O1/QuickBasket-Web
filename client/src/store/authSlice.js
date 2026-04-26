import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../api/http.js";

const getAuthError = (error, fallback) => {
  if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
    return "API server is not running. Start the backend and verify the MongoDB connection. If you use Atlas, whitelist this machine's IP.";
  }

  return error.response?.data?.message || fallback;
};

export const fetchMe = createAsyncThunk("auth/fetchMe", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/auth/me");
    return data.user;
  } catch (error) {
    return rejectWithValue(null);
  }
});

export const loginUser = createAsyncThunk("auth/login", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/auth/login", payload);
    return data.user;
  } catch (error) {
    return rejectWithValue(getAuthError(error, "Login failed"));
  }
});

export const loginWithGoogle = createAsyncThunk(
  "auth/google",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/auth/google", payload);
      return data.user;
    } catch (error) {
      return rejectWithValue(getAuthError(error, "Google sign-in failed"));
    }
  },
);

export const sendRegisterOtp = createAsyncThunk(
  "auth/registerOtp",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/auth/register/otp", payload);
      return data;
    } catch (error) {
      return rejectWithValue(getAuthError(error, "Could not send OTP"));
    }
  },
);

export const registerUser = createAsyncThunk(
  "auth/register",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/auth/register", payload);
      return data.user;
    } catch (error) {
      return rejectWithValue(getAuthError(error, "Register failed"));
    }
  },
);

export const logoutUser = createAsyncThunk("auth/logout", async () => {
  await api.post("/auth/logout");
});

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.patch("/auth/profile", payload);
      return data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Profile update failed");
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    status: "idle",
    error: "",
  },
  reducers: {
    clearAuthError: (state) => {
      state.error = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.status = "authenticated";
        state.user = action.payload;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.status = "guest";
        state.user = null;
      })
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "authenticated";
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "guest";
        state.error = action.payload;
      })
      .addCase(loginWithGoogle.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.status = "authenticated";
        state.user = action.payload;
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.status = "guest";
        state.error = action.payload;
      })
      .addCase(sendRegisterOtp.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(sendRegisterOtp.fulfilled, (state) => {
        state.status = "guest";
      })
      .addCase(sendRegisterOtp.rejected, (state, action) => {
        state.status = "guest";
        state.error = action.payload;
      })
      .addCase(registerUser.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = "authenticated";
        state.user = action.payload;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = "guest";
        state.error = action.payload;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.status = "guest";
        state.user = null;
      });
  },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;
