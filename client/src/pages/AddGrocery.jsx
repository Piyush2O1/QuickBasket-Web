import { ArrowLeft, Boxes, LayoutDashboard } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, getErrorMessage } from "../api/http.js";
import AdminGroceryForm from "../components/admin/AdminGroceryForm.jsx";
import { createEmptyGroceryForm } from "../lib/adminInventory.js";

export default function AddGrocery() {
  const [form, setForm] = useState(createEmptyGroceryForm);
  const [file, setFile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [recentGroceries, setRecentGroceries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadPageData = async () => {
    setLoading(true);

    try {
      const { data } = await api.get("/groceries", {
        params: {
          limit: 4,
        },
      });

      setCategories(data.categories || []);
      setUnits(data.units || []);
      setRecentGroceries(data.groceries || []);
      setError("");
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPageData();
  }, []);

  const updateForm = (field) => (event) => {
    setForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
    setSuccess("");
  };

  const addGrocery = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));

      if (file) {
        payload.append("image", file);
      }

      await api.post("/groceries", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setForm(createEmptyGroceryForm());
      setFile(null);
      setSuccess("Grocery added to inventory.");
      await loadPageData();
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto w-[94%] max-w-6xl pb-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>
          <p className="font-display mt-5 text-sm font-bold uppercase tracking-[0.28em] text-emerald-700">
            Inventory Creation
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Add grocery
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Publish a new item with price, unit, image, and stock without leaving the admin workflow.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/72 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            to="/admin/groceries"
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <Boxes className="h-4 w-4" />
            View inventory
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[420px_1fr]">
        <AdminGroceryForm
          form={form}
          onFieldChange={updateForm}
          onSubmit={addGrocery}
          file={file}
          onFileChange={setFile}
          categories={categories}
          units={units}
          submitting={submitting}
          error={error}
          success={success}
          eyebrow="Inventory"
          title="Add grocery"
          submitLabel="Save grocery"
          submittingLabel="Saving grocery..."
        />

        <div className="space-y-6">
          <section className="glass-panel-strong rounded-[32px] p-6">
            <p className="font-display text-sm font-bold uppercase tracking-[0.24em] text-emerald-700">
              Checklist
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-slate-950">
              Keep the catalog clear
            </h2>
            <div className="mt-5 grid gap-3">
              {[
                "Use the product name customers already search for.",
                "Keep the price and unit aligned so billing stays consistent.",
                "Add a stock number so the admin team can track item availability.",
              ].map((item) => (
                <div key={item} className="rounded-[24px] border border-white/80 bg-white/68 p-4 text-sm text-slate-600">
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="glass-panel-strong rounded-[32px] p-6">
            <p className="font-display text-sm font-bold uppercase tracking-[0.24em] text-emerald-700">
              Recent Inventory
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-slate-950">
              Latest groceries
            </h2>

            {loading ? (
              <div className="mt-5 rounded-[24px] border border-white/80 bg-white/68 p-5 text-sm font-semibold text-slate-500">
                Loading recent groceries...
              </div>
            ) : recentGroceries.length === 0 ? (
              <div className="mt-5 rounded-[24px] border border-white/80 bg-white/68 p-5 text-sm font-semibold text-slate-500">
                No data found
              </div>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {recentGroceries.map((grocery) => (
                  <article key={grocery._id} className="flex gap-3 rounded-[24px] border border-white/80 bg-white/68 p-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white">
                      <img src={grocery.image} alt={grocery.name} className="h-full w-full object-contain p-2" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-950">{grocery.name}</p>
                      <p className="text-sm font-medium text-slate-500">{grocery.category}</p>
                      <p className="mt-1 text-sm font-semibold text-emerald-700">
                        Rs. {grocery.price}/{grocery.unit}
                      </p>
                      <p className="text-xs font-medium text-slate-500">Stock: {grocery.stock ?? 0}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
