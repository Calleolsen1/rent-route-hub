import AdminTripsManagement from "@/components/admin/AdminTripsManagement";

export default function AdminTrips() {
  return (
    <div className="pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Resehantering</h1>
        <p className="text-muted-foreground text-sm mt-1">Skapa och hantera resor för kunder</p>
      </div>
      <AdminTripsManagement />
    </div>
  );
}
