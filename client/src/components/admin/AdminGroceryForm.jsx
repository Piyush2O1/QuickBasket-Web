import { Loader2, PlusCircle, Upload } from "lucide-react";
import {
  adminInventoryCategories,
  adminInventoryUnits,
} from "../../lib/adminInventory.js";

export default function AdminGroceryForm({
  form,
  onFieldChange,
  onSubmit,
  file,
  onFileChange,
  categories = [],
  units = [],
  submitting = false,
  error = "",
  success = "",
  eyebrow = "Inventory",
  title = "Add grocery",
  submitLabel = "Save grocery",
  submittingLabel = "Saving grocery...",
}) {
  const categoryOptions = categories.length ? categories : adminInventoryCategories;
  const unitOptions = units.length ? units : adminInventoryUnits;

  return (
    <form onSubmit={onSubmit} className="glass-panel-strong h-fit rounded-[32px] p-6">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
          <PlusCircle className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-slate-500">{eyebrow}</p>
          <h2 className="font-display text-2xl font-semibold text-slate-950">{title}</h2>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <Input
          placeholder="Name"
          value={form.name}
          onChange={onFieldChange("name")}
          disabled={submitting}
          required
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            value={form.category}
            onChange={onFieldChange("category")}
            options={categoryOptions}
            disabled={submitting}
          />
          <Select value={form.unit} onChange={onFieldChange("unit")} options={unitOptions} disabled={submitting} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="Price"
            value={form.price}
            onChange={onFieldChange("price")}
            disabled={submitting}
            required
          />
          <Input
            type="number"
            min="0"
            step="1"
            placeholder="Stock"
            value={form.stock}
            onChange={onFieldChange("stock")}
            disabled={submitting}
            required
          />
        </div>

        <Input
          placeholder="Image URL"
          value={form.image}
          onChange={onFieldChange("image")}
          disabled={submitting}
        />

        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-[24px] border border-dashed border-slate-300 bg-white/50 px-4 py-4 font-semibold text-slate-600 transition hover:bg-white">
          <Upload size={18} />
          {file ? file.name : "Upload image"}
          <input
            type="file"
            className="hidden"
            accept="image/*"
            disabled={submitting}
            onChange={(event) => onFileChange(event.target.files?.[0] || null)}
          />
        </label>
      </div>

      {error && (
        <p className="mt-4 rounded-[22px] border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      {success && (
        <p className="mt-4 rounded-[22px] border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
          {success}
        </p>
      )}

      <button
        disabled={submitting}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
        {submitting ? submittingLabel : submitLabel}
      </button>
    </form>
  );
}

function Input(props) {
  return (
    <input
      className="w-full rounded-[24px] border border-white/80 bg-white/78 px-4 py-4 text-slate-800 outline-none focus:border-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
      {...props}
    />
  );
}

function Select({ options = [], ...props }) {
  return (
    <select
      className="w-full rounded-[24px] border border-white/80 bg-white/78 px-4 py-4 text-slate-800 outline-none focus:border-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
      {...props}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}
