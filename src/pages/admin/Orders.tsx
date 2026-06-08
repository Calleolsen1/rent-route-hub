export default function AdminOrders() {
  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-3xl font-display mb-2">Beställningar</h1>
      <p className="text-muted-foreground text-sm mb-8">
        Biljettköp och leveransstatus.
      </p>
      <div className="rounded-xl border border-border bg-card p-10 text-center">
        <p className="text-muted-foreground">
          Byggs i Fas 3 när biljettflödet med Stripe är på plats.
        </p>
      </div>
    </div>
  );
}
