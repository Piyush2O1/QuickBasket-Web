import { ArrowLeft, Loader2, Pencil, Search, Trash2, Upload, X } from "lucide-react";
import { motion } from "motion/react";
import { useDeferredValue, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, getErrorMessage } from "../api/http.js";

const PAGE_SIZE = 8;

export default function AdminGroceries() {
  const [groceries, setGroceries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [backendImage, setBackendImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [currentLimit, setCurrentLimit] = useState(PAGE_SIZE);
  const deferredSearch = useDeferredValue(search.trim());

  const load = async (limit = PAGE_SIZE, showMore = false) => {
    if (showMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const { data } = await api.get("/groceries", {
        params: {
          limit,
          search: deferredSearch || undefined,
        },
      });

      setGroceries(data.groceries || []);
      setCategories(data.categories || []);
      setUnits(data.units || []);
      setTotal(data.pagination?.total ?? data.groceries?.length ?? 0);
      setHasMore(Boolean(data.pagination?.hasMore));
      setCurrentLimit(limit);
      setError("");
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    load(PAGE_SIZE);
  }, [deferredSearch]);

  const closeEditor = () => {
    setEditing(null);
    setImagePreview("");
    setBackendImage(null);
  };

  const save = async () => {
    if (!editing?._id) return;

    setSaving(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("name", editing.name);
      formData.append("category", editing.category);
      formData.append("price", editing.price);
      formData.append("unit", editing.unit);
      formData.append("stock", editing.stock ?? 0);

      if (!backendImage && editing.image) {
        formData.append("image", editing.image);
      }

      if (backendImage) {
        formData.append("image", backendImage);
      }

      await api.patch(`/groceries/${editing._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await load(currentLimit);
      closeEditor();
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!editing?._id) return;

    setDeleting(true);
    setError("");

    try {
      await api.delete(`/groceries/${editing._id}`);
      await load(Math.max(PAGE_SIZE, currentLimit));
      closeEditor();
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className="mx-auto w-[94%] max-w-6xl pb-16">
      <Link
        to="/admin/dashboard"
        className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
      >
        <ArrowLeft size={16} />
        Back to dashboard
      </Link>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-sm font-bold uppercase tracking-[0.28em] text-emerald-700">
            Inventory
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Manage groceries
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Review inventory by product, edit pricing or stock, and only load more rows when you need them.
          </p>
        </div>

        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or category..."
            className="w-full rounded-full border border-white/80 bg-white/78 py-4 pl-12 pr-4 text-slate-800 outline-none focus:border-emerald-300"
          />
        </div>
      </div>

      <div className="mt-6 inline-flex rounded-full border border-white/80 bg-white/72 px-4 py-2 text-sm font-semibold text-slate-600">
        Showing {groceries.length} of {total} grocery items
      </div>

      {loading ? (
        <div className="glass-panel-strong mt-8 rounded-[32px] p-10 text-center font-semibold text-slate-500">
          Loading groceries...
        </div>
      ) : error && !editing ? (
        <div className="glass-panel-strong mt-8 rounded-[32px] border border-red-200 p-8 text-center">
          <p className="font-semibold text-red-700">{error}</p>
        </div>
      ) : groceries.length === 0 ? (
        <div className="glass-panel-strong mt-8 rounded-[32px] p-10 text-center">
          <h2 className="text-2xl font-semibold text-slate-950">No data found</h2>
          <p className="mt-2 text-slate-600">
            {deferredSearch ? "Try a different search term to see matching groceries." : "Add groceries to build your inventory list."}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-8 space-y-4">
            {groceries.map((item, index) => (
              <motion.article
                key={item._id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03, duration: 0.28 }}
                className="glass-panel-strong flex flex-col gap-5 rounded-[30px] p-5 sm:flex-row sm:items-start"
              >
                <div className="h-36 w-full overflow-hidden rounded-[24px] border border-white/80 bg-white sm:h-32 sm:w-36">
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                </div>

                <div className="flex-1">
                  <h2 className="font-display text-2xl font-semibold text-slate-950">{item.name}</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">{item.category}</p>
                  <p className="mt-4 text-lg font-bold text-emerald-700">
                    Rs. {item.price} <span className="text-sm font-medium text-slate-500">/ {item.unit}</span>
                  </p>
                  <p className="mt-2 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                    Stock: {item.stock ?? 0}
                  </p>
                </div>

                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-700"
                  onClick={() => {
                    setEditing({
                      ...item,
                      stock: item.stock ?? 0,
                    });
                    setImagePreview(item.image);
                    setBackendImage(null);
                  }}
                >
                  <Pencil size={16} />
                  Edit
                </button>
              </motion.article>
            ))}
          </div>

          {hasMore && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                disabled={loadingMore}
                onClick={() => load(currentLimit + PAGE_SIZE, true)}
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                {loadingMore ? "Loading more..." : "Load more"}
              </button>
            </div>
          )}
        </>
      )}

      {editing && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <div className="glass-panel-strong w-full max-w-xl rounded-[32px] p-6 sm:p-7">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-3xl font-bold tracking-tight text-slate-950">
                Edit grocery
              </h2>
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
                onClick={closeEditor}
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 overflow-hidden rounded-[24px] border border-white/80 bg-white">
              {imagePreview && <img src={imagePreview} alt={editing.name} className="h-64 w-full object-cover" />}
            </div>

            <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-[24px] border border-dashed border-slate-300 bg-white/60 px-4 py-4 font-semibold text-slate-600 transition hover:bg-white">
              <Upload size={18} />
              {backendImage ? backendImage.name : "Upload new image"}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;
                  setBackendImage(file);

                  if (file) {
                    setImagePreview(URL.createObjectURL(file));
                  }
                }}
              />
            </label>

            <div className="mt-5 grid gap-4">
              <input
                value={editing.name}
                onChange={(event) => setEditing({ ...editing, name: event.target.value })}
                className="w-full rounded-[24px] border border-white/80 bg-white/78 px-4 py-4 text-slate-800 outline-none focus:border-emerald-300"
                placeholder="Grocery name"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <select
                  value={editing.category}
                  onChange={(event) => setEditing({ ...editing, category: event.target.value })}
                  className="w-full rounded-[24px] border border-white/80 bg-white/78 px-4 py-4 text-slate-800 outline-none focus:border-emerald-300"
                >
                  {categories.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>

                <select
                  value={editing.unit}
                  onChange={(event) => setEditing({ ...editing, unit: event.target.value })}
                  className="w-full rounded-[24px] border border-white/80 bg-white/78 px-4 py-4 text-slate-800 outline-none focus:border-emerald-300"
                >
                  {units.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editing.price}
                  onChange={(event) => setEditing({ ...editing, price: event.target.value })}
                  className="w-full rounded-[24px] border border-white/80 bg-white/78 px-4 py-4 text-slate-800 outline-none focus:border-emerald-300"
                  placeholder="Price"
                />
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={editing.stock ?? 0}
                  onChange={(event) => setEditing({ ...editing, stock: event.target.value })}
                  className="w-full rounded-[24px] border border-white/80 bg-white/78 px-4 py-4 text-slate-800 outline-none focus:border-emerald-300"
                  placeholder="Stock"
                />
              </div>

              <input
                value={editing.image || ""}
                onChange={(event) => {
                  const nextImage = event.target.value;
                  setEditing({ ...editing, image: nextImage });
                  setImagePreview(nextImage);
                  setBackendImage(null);
                }}
                className="w-full rounded-[24px] border border-white/80 bg-white/78 px-4 py-4 text-slate-800 outline-none focus:border-emerald-300"
                placeholder="Image URL"
              />
            </div>

            {error && (
              <div className="mt-4 rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={saving}
                onClick={save}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil size={16} />}
                Save changes
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={remove}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-5 py-3 font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 size={16} />}
                Delete grocery
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
