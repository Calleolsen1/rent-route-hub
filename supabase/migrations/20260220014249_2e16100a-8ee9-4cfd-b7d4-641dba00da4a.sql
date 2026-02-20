
-- Create trip_groups table
CREATE TABLE public.trip_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  organizer_user_id uuid,
  created_by_admin_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create trip_members table
CREATE TABLE public.trip_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.trip_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  trip_id uuid REFERENCES public.trips(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'invited',
  invoice_sent_at timestamp with time zone,
  invoice_amount numeric,
  invoice_currency text NOT NULL DEFAULT 'SEK',
  invoice_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add group_id column to trips table
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.trip_groups(id) ON DELETE SET NULL;

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for trip_groups
CREATE TRIGGER update_trip_groups_updated_at
  BEFORE UPDATE ON public.trip_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.trip_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;

-- RLS for trip_groups
CREATE POLICY "Admins can manage trip_groups"
  ON public.trip_groups
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Organizers can view their own groups"
  ON public.trip_groups
  FOR SELECT
  USING (auth.uid() = organizer_user_id);

CREATE POLICY "Members can view groups they belong to"
  ON public.trip_groups
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_members tm
      WHERE tm.group_id = trip_groups.id
        AND tm.user_id = auth.uid()
    )
  );

-- RLS for trip_members
CREATE POLICY "Admins can manage trip_members"
  ON public.trip_members
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Organizers can view members of their groups"
  ON public.trip_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_groups tg
      WHERE tg.id = trip_members.group_id
        AND tg.organizer_user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can update invoice status for their group members"
  ON public.trip_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_groups tg
      WHERE tg.id = trip_members.group_id
        AND tg.organizer_user_id = auth.uid()
    )
  );

CREATE POLICY "Members can view their own membership"
  ON public.trip_members
  FOR SELECT
  USING (auth.uid() = user_id);
