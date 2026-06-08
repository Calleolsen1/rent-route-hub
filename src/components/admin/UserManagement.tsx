import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, UserPlus } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { UsersTable } from "./UsersTable";
import { UsersFiltersSheet } from "./UsersFiltersSheet";

import { useDemoData } from "@/hooks/useDemoData";
import { CreateClientDialog } from "./CreateClientDialog";
import { Button } from "@/components/ui/button";

const UserManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortValue, setSortValue] = useState("created_at-desc");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [createClientOpen, setCreateClientOpen] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 500);
  const { isDemoMode, getAdminUsers } = useDemoData();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users", debouncedSearch, roleFilter, statusFilter, sortValue],
    queryFn: async () => {
      // Always fetch real users — admins need to see actual customers regardless of demo mode
      const [sortBy, sortOrder] = sortValue.split("-");
      const { data, error } = await supabase.rpc("admin_search_users", {
        search_query: debouncedSearch || null,
        status_filter: statusFilter === "all" ? null : (statusFilter as "active" | "inactive" | "suspended"),
        role_filter: roleFilter === "all" ? null : (roleFilter as "admin" | "host" | "guest"),
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      if (error) throw error;
      return data;
    },
  });

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (roleFilter !== "all") count++;
    if (statusFilter !== "all") count++;
    return count;
  }, [roleFilter, statusFilter]);

  const hasActiveFilters = Boolean(searchQuery || roleFilter !== "all" || statusFilter !== "all");

  return (
    <Card className="w-full">
      <CardContent className="py-6">
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            {/* Controls Row */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              {/* Left: Search */}
              <div className="relative w-full sm:w-auto sm:min-w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background border-border"
                />
              </div>

              {/* Right: Filters, Sort and Create */}
              <div className="flex items-center gap-2">
                <Button onClick={() => setCreateClientOpen(true)} size="sm" className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Skapa Mitt Kaisen-kund
                </Button>

                <UsersFiltersSheet
                  roleFilter={roleFilter}
                  statusFilter={statusFilter}
                  onRoleFilterChange={setRoleFilter}
                  onStatusFilterChange={setStatusFilter}
                  activeFilterCount={activeFilterCount}
                  open={filtersOpen}
                  onOpenChange={setFiltersOpen}
                />

                <Select value={sortValue} onValueChange={setSortValue}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at-desc">Newest First</SelectItem>
                    <SelectItem value="created_at-asc">Oldest First</SelectItem>
                    <SelectItem value="full_name-asc">Name A-Z</SelectItem>
                    <SelectItem value="full_name-desc">Name Z-A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table */}
            <UsersTable
              // Cast: generated supabase types still expose
              // listings_count/bookings_count from the user_admin_view; after
              // 20260608240000_strip_rental_schema applies and types are
              // regen'd, this becomes a direct pass-through.
              users={users as unknown as any}
              loading={isLoading}
              hasActiveFilters={hasActiveFilters}
            />
          </TabsContent>

        </Tabs>
      </CardContent>

      <CreateClientDialog
        open={createClientOpen}
        onOpenChange={setCreateClientOpen}
      />
    </Card>
  );
};

export default UserManagement;
