import { Mail, MapPin, Phone, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import BrandMark from "./BrandMark.jsx";

const linksByRole = {
  guest: [
    { label: "Home", href: "/" },
    { label: "Login", href: "/login" },
    { label: "Sign Up", href: "/register" },
  ],
  user: [
    { label: "Dashboard", href: "/user/dashboard" },
    { label: "Cart", href: "/user/cart" },
    { label: "My Orders", href: "/user/orders" },
  ],
  admin: [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Groceries", href: "/admin/groceries" },
    { label: "Orders", href: "/admin/orders" },
  ],
  deliveryBoy: [
    { label: "Dashboard", href: "/delivery/dashboard" },
    { label: "Storefront", href: "/user/dashboard" },
    { label: "Track Queue", href: "/delivery/dashboard" },
  ],
};

export default function Footer({ role = "guest" }) {
  const quickLinks = linksByRole[role] || linksByRole.guest;

  return (
    <motion.footer
      initial={{ opacity: 0, y: 34 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className="px-4 pb-6 pt-16 sm:pt-20"
    >
      <div className="glass-panel-dark mx-auto max-w-7xl overflow-hidden rounded-[34px] p-8 text-white sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr_0.9fr]">
          <div className="space-y-5">
            <BrandMark light />
            <p className="max-w-md text-sm leading-7 text-white/70 sm:text-base">
              Quick Basket is built for faster grocery shopping, smoother order operations, cleaner
              delivery handoff, and a more premium brand presence.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm text-white/80">
              <Sparkles className="h-4 w-4 text-emerald-300" />
              Responsive, branded, and ready for daily operations
            </div>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold text-white">Quick Links</h2>
            <div className="mt-4 grid gap-3">
              {quickLinks.map((link) => (
                <Link
                  key={`${link.href}-${link.label}`}
                  to={link.href}
                  className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-medium text-white/78 transition hover:bg-white/12 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-display text-xl font-semibold text-white">Contact</h3>
            <div className="mt-4 space-y-3 text-sm text-white/75">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-emerald-300" />
                Mumbai, India
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-emerald-300" />
                +91 0000000000
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-emerald-300" />
                support@quickbasket.in
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-5 text-sm text-white/55">
          {new Date().getFullYear()} Quick Basket. All rights reserved.
        </div>
      </div>
    </motion.footer>
  );
}
