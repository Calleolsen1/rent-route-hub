import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TripsList from "@/components/guest/TripsList";
import TravelProfile from "@/components/guest/TravelProfile";
import GroupTripView from "@/components/guest/GroupTripView";
import { Plane, User, Users } from "lucide-react";

const Trips = () => {
  const { user } = useAuth();

  // Check if user is organizer of any group
  const { data: isOrganizer } = useQuery({
    queryKey: ["is-organizer", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase
        .from("trip_groups")
        .select("id")
        .eq("organizer_user_id", user.id)
        .limit(1);
      return (data?.length ?? 0) > 0;
    },
    enabled: !!user?.id,
  });

  return (
    <div className="container mx-auto px-4 pt-8 pb-8 lg:px-8">
      <Tabs defaultValue="trips" className="w-full">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="text-2xl lg:text-3xl font-bold">Mina resor</h1>
          <TabsList className="h-11 rounded-full bg-muted/60 p-1">
            <TabsTrigger value="trips" className="rounded-full gap-2 px-5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Plane className="h-4 w-4" />
              Mina resor
            </TabsTrigger>
            {isOrganizer && (
              <TabsTrigger value="group" className="rounded-full gap-2 px-5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Users className="h-4 w-4" />
                Min grupp
              </TabsTrigger>
            )}
            <TabsTrigger value="profile" className="rounded-full gap-2 px-5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <User className="h-4 w-4" />
              Min profil
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="trips">
          <TripsList />
        </TabsContent>

        {isOrganizer && (
          <TabsContent value="group">
            <GroupTripView />
          </TabsContent>
        )}

        <TabsContent value="profile">
          <TravelProfile />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Trips;
