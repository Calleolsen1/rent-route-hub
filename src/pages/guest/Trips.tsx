import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TripsList from "@/components/guest/TripsList";
import TravelProfile from "@/components/guest/TravelProfile";
import { Plane, User } from "lucide-react";

const Trips = () => {
  return (
    <div className="container mx-auto px-4 pt-2 pb-8 lg:px-8">
      <Tabs defaultValue="trips" className="w-full">
        <TabsList className="mb-6 h-11 rounded-full bg-muted/60 p-1">
          <TabsTrigger value="trips" className="rounded-full gap-2 px-5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Plane className="h-4 w-4" />
            Mina resor
          </TabsTrigger>
          <TabsTrigger value="profile" className="rounded-full gap-2 px-5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <User className="h-4 w-4" />
            Min profil
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trips">
          <TripsList />
        </TabsContent>

        <TabsContent value="profile">
          <TravelProfile />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Trips;
