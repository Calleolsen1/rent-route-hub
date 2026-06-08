export default function AdminOverview() {
  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-3xl font-display mb-2">Översikt</h1>
      <p className="text-muted-foreground text-sm mb-8">
        Välkommen till Kaisen Admin.
      </p>
      <div className="rounded-xl border border-border bg-card p-10 text-center">
        <p className="text-muted-foreground">
          Dashboarden byggs ut i Fas 3 när biljettflödet är på plats.
        </p>
      </div>
    </div>
  );
}
