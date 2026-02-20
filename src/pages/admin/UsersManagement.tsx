import UserManagement from "@/components/admin/UserManagement";

export default function UsersManagement() {
  return (
    <div className="pb-8">
      <p className="text-muted-foreground text-sm mb-6">Hantera resenärer, arrangörer och administratörer.</p>
      <UserManagement />
    </div>
  );
}

