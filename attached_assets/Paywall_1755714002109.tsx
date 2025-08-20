import React from "react";
import CTAButton from "../components/CTAButton";

export default function Paywall() {
  return (
    <div className="min-h-[100svh] bg-calai-bg flex items-center justify-center p-4">
      <div className="card max-w-3xl w-full">
        <div className="rounded-2xl p-6 text-white bg-calai-hero mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Don’t log — just snap.</h1>
          <p className="mt-1 opacity-90">Log meals in ~3 seconds with AI. Accurate calories you can edit.</p>
        </div>

        <ul className="grid md:grid-cols-2 gap-4 mb-6">
          <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-white ring-4 ring-calai-primary"></span> Snap → instant calories & macros</li>
          <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-white ring-4 ring-calai-primary"></span> Barcode scan + verified sources</li>
          <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-white ring-4 ring-calai-primary"></span> Macro targets & gentle tips</li>
          <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-white ring-4 ring-calai-primary"></span> Privacy-first: your data, your control</li>
        </ul>

        <div className="grid md:grid-cols-3 gap-4">
          <PlanCard title="Best Value" price="$39.99/year" highlight>
            <CTAButton className="w-full mt-3" onClick={() => startCheckout('annual')}>Start 7‑day free trial</CTAButton>
          </PlanCard>
          <PlanCard title="Monthly" price="$9.99/month">
            <CTAButton variant="outline" className="w-full mt-3" onClick={() => startCheckout('monthly')}>Start 7‑day trial</CTAButton>
          </PlanCard>
          <PlanCard title="Free Lite" price="2 scans/day">
            <CTAButton variant="outline" className="w-full mt-3" onClick={() => continueFree()}>Continue free</CTAButton>
          </PlanCard>
        </div>

        <p className="text-xs text-slate-500 mt-4 text-center">
          Cancel anytime. After trial, $39.99/year (or $9.99/month) auto-renews.
        </p>
      </div>
    </div>
  );
}

function PlanCard({ title, price, children, highlight=false }: { title: string; price: string; children: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`card ${highlight ? "ring-2 ring-calai-primary" : ""}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        {highlight && <span className="text-xs bg-calai-primary text-white px-2 py-0.5 rounded-full">Most popular</span>}
      </div>
      <div className="mt-1 text-slate-600">{price}</div>
      {children}
    </div>
  );
}

// TODO: wire to your checkout provider
function startCheckout(plan: "annual"|"monthly") {
  console.log("checkout:", plan);
}

function continueFree() {
  console.log("continue free");
}
