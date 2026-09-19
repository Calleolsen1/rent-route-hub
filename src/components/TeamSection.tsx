import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type TeamMember = {
  id: string;
  name: string;
  role_title: string | null;
  bio: string | null;
  photo_url: string | null;
};

/**
 * Team grid on the About page. Content is fully admin-editable via
 * /admin/team - the section hides itself when nothing is published.
 */
export default function TeamSection() {
  const [members, setMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await supabase
        .from("team_members")
        .select("id,name,role_title,bio,photo_url")
        .eq("is_published", true)
        .order("sort_order", { ascending: true });
      if (active) setMembers((data ?? []) as TeamMember[]);
    };
    load();

    const channel = supabase
      .channel("public-team-members")
      .on("postgres_changes", { event: "*", schema: "public", table: "team_members" }, load)
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  if (members.length === 0) return null;

  return (
    <section className="py-16 md:py-20 bg-background border-t border-border">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <p className="mb-4 font-sans text-xs uppercase tracking-[0.3em] text-primary">
            Människorna
          </p>
          <h2 className="font-display text-3xl text-foreground md:text-4xl">
            Möt <em className="font-light italic">teamet</em>
          </h2>
          <div className="mx-auto mt-6 h-px w-10 bg-primary" />
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m) => (
            <article key={m.id} className="group">
              <div className="mb-5 aspect-[4/5] overflow-hidden bg-muted">
                {m.photo_url ? (
                  <img
                    src={m.photo_url}
                    alt={`${m.name}${m.role_title ? `, ${m.role_title}` : ""}`}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-display text-4xl text-muted-foreground">
                    {m.name.charAt(0)}
                  </div>
                )}
              </div>
              <h3 className="font-display text-xl text-foreground">{m.name}</h3>
              {m.role_title && (
                <p className="mt-1 font-sans text-xs uppercase tracking-[0.2em] text-primary">
                  {m.role_title}
                </p>
              )}
              {m.bio && (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{m.bio}</p>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
