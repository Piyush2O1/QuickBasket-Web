import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const googleScriptSrc = "https://accounts.google.com/gsi/client";
let googleScriptPromise;

const loadGoogleScript = () => {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (!googleScriptPromise) {
    googleScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${googleScriptSrc}"]`);

      if (existingScript) {
        existingScript.addEventListener("load", resolve, { once: true });
        existingScript.addEventListener("error", reject, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = googleScriptSrc;
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  return googleScriptPromise;
};

export default function GoogleAuthButton({ disabled = false, onCredential }) {
  const buttonRef = useRef(null);
  const onCredentialRef = useRef(onCredential);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    let cancelled = false;

    if (!clientId || clientId.startsWith("add your")) {
      setLoadError("Google sign-in unavailable");
      return undefined;
    }

    loadGoogleScript()
      .then(() => {
        if (cancelled || !buttonRef.current) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response.credential) {
              onCredentialRef.current?.(response.credential);
            }
          },
        });

        const containerWidth =
          buttonRef.current.parentElement?.getBoundingClientRect().width ||
          buttonRef.current.getBoundingClientRect().width ||
          window.innerWidth - 48;
        const width = Math.max(220, Math.min(Math.floor(containerWidth), 400));

        buttonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          type: "standard",
          shape: "pill",
          text: "continue_with",
          logo_alignment: "left",
          width,
        });
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError("Google sign-in unavailable");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [clientId]);

  if (loadError) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white/70 px-5 py-3.5 text-sm font-semibold text-slate-400"
      >
        {loadError}
      </button>
    );
  }

  return (
    <div className={`relative flex w-full justify-center ${disabled ? "pointer-events-none opacity-60" : ""}`}>
      {!ready && (
        <button
          type="button"
          disabled
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/80 bg-white/78 px-5 py-3.5 text-sm font-semibold text-slate-600"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading Google
        </button>
      )}
      <div ref={buttonRef} className={ready ? "flex w-full justify-center" : "hidden w-full"} />
    </div>
  );
}
