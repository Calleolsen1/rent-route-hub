import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Receipt, DollarSign, CheckCircle2, Clock, FileText } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import { useNavigate, useLocation } from "react-router-dom";
import AccountRestrictionBanner from "./AccountRestrictionBanner";
import { useDemoData } from "@/hooks/useDemoData";
import { useQuery } from "@tanstack/react-query";

const safeFormatDate = (dateValue: string | Date | null | undefined, formatStr: string = "d MMM yyyy"): string => {
  if (!dateValue) return "N/A";
  try {
    const date = typeof dateValue === "string" ? parseISO(dateValue) : dateValue;
    if (!isValid(date)) return "N/A";
    return format(date, formatStr, { locale: sv });
  } catch {
    return "N/A";
  }
};

interface BookingPayment {
  id: string;
  type?: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  created_at: string;
  booking_id: string;
  bookings: {
    id: string;
    checkin_date: string;
    checkout_date: string;
    nights: number;
    guests: number;
    listings: { title: string; city: string; country: string } | null;
  };
}

interface DebtPayment {
  id: string;
  type?: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  created_at: string;
  dispute_id: string;
  booking_id: string;
  bookings: { id: string; listings: { title: string; city: string; country: string } | null };
  disputes: { id: string; category: string; description: string };
}

interface TripInvoice {
  id: string;
  title: string;
  destination: string | null;
  price_total: number | null;
  price_currency: string | null;
  payment_status: string | null;
  invoice_sent_at: string | null;
  invoice_number: string | null;
  payment_due_date: string | null;
  payment_confirmed_at: string | null;
  start_date: string | null;
  end_date: string | null;
}

const GuestPayments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [bookingPayments, setBookingPayments] = useState<BookingPayment[]>([]);
  const [debtPayments, setDebtPayments] = useState<DebtPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const { isDemoMode, getTransactions } = useDemoData();

  // Fetch trips for this user
  const { data: trips = [] } = useQuery<TripInvoice[]>({
    queryKey: ["guest-trips-payments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("id, title, destination, price_total, price_currency, payment_status, invoice_sent_at, invoice_number, payment_due_date, payment_confirmed_at, start_date, end_date")
        .eq("guest_user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TripInvoice[];
    },
    enabled: !!user && !isDemoMode,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (user) {
      if (isDemoMode) {
        fetchDemoTransactions();
      } else {
        fetchAllTransactions();
      }
    }
  }, [user, isDemoMode]);

  const fetchDemoTransactions = async () => {
    try {
      const captureTransactions = getTransactions({ type: "capture", status: "succeeded" });
      const bookingPaymentsData: BookingPayment[] = [];
      const debtPaymentsData: DebtPayment[] = [];
      captureTransactions.forEach((transaction: any) => {
        if (!transaction.bookings?.listings) return;
        if (transaction.dispute_id) {
          debtPaymentsData.push(transaction as DebtPayment);
        } else {
          bookingPaymentsData.push(transaction as BookingPayment);
        }
      });
      setBookingPayments(bookingPaymentsData);
      setDebtPayments(debtPaymentsData);
    } catch (error) {
      console.error("Error fetching demo transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTransactions = async () => {
    try {
      const { data: captureData, error: captureError } = await supabase
        .from("transactions")
        .select(`
          id, amount, currency, status, provider, created_at, booking_id, dispute_id,
          bookings!inner (id, checkin_date, checkout_date, nights, guests, guest_user_id,
            listings (title, city, country)
          ),
          disputes!transactions_dispute_id_fkey (id, category, description)
        `)
        .eq("type", "capture")
        .eq("status", "succeeded")
        .eq("bookings.guest_user_id", user?.id)
        .order("created_at", { ascending: false });

      if (captureError) throw captureError;

      const bookingPaymentsData: BookingPayment[] = [];
      const debtPaymentsData: DebtPayment[] = [];
      (captureData || []).forEach((transaction) => {
        if (!transaction.bookings?.listings) return;
        if (transaction.dispute_id) {
          debtPaymentsData.push(transaction as DebtPayment);
        } else {
          bookingPaymentsData.push(transaction as BookingPayment);
        }
      });
      setBookingPayments(bookingPaymentsData);
      setDebtPayments(debtPaymentsData);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalBookingPayments = bookingPayments.reduce((acc, p) => acc + Number(p.amount), 0);
  const totalDebtPayments = debtPayments.reduce((acc, p) => acc + Number(p.amount), 0);
  const totalSpent = totalBookingPayments + totalDebtPayments;

  const paidTrips = trips.filter((t) => t.payment_status === "paid");
  const unpaidTrips = trips.filter((t) => t.invoice_sent_at && t.payment_status !== "paid");
  const outstandingAmount = unpaidTrips.reduce((acc, t) => acc + (t.price_total ?? 0), 0);

  const hasTripInvoices = trips.some((t) => t.invoice_sent_at);

  return (
    <div className="space-y-6">
      <AccountRestrictionBanner />

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Antal betalningar</p>
              <p className="text-2xl font-bold">{bookingPayments.length + debtPayments.length}</p>
            </div>
            <Receipt className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Totalt betalt</p>
              <p className="text-2xl font-bold">${totalSpent.toFixed(2)}</p>
            </div>
            <Receipt className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Betalda resor</p>
              <p className="text-2xl font-bold">{paidTrips.length}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Utestående belopp</p>
              <p className="text-2xl font-bold text-destructive">
                {outstandingAmount.toLocaleString("sv-SE")} SEK
              </p>
            </div>
            <Clock className="h-8 w-8 text-destructive" />
          </div>
        </Card>
      </div>

      <Tabs defaultValue={hasTripInvoices ? "trips" : "bookings"} className="w-full">
        <TabsList>
          <TabsTrigger value="trips">Mina resor ({trips.length})</TabsTrigger>
          <TabsTrigger value="bookings">Bokningsbetalningar ({bookingPayments.length})</TabsTrigger>
          <TabsTrigger value="debts">Skulder ({debtPayments.length})</TabsTrigger>
        </TabsList>

        {/* Trips / Invoices */}
        <TabsContent value="trips" className="space-y-4 mt-6">
          {trips.length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Inga resor ännu</h3>
                <p className="text-muted-foreground">Du har inga bokade resor via Kaisen.</p>
              </div>
            </Card>
          ) : (
            trips.map((trip) => {
              const isPaid = trip.payment_status === "paid";
              const isSent = !!trip.invoice_sent_at;
              return (
                <Card key={trip.id} className="p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${isPaid ? "bg-primary/10" : "bg-muted"}`}>
                        {isPaid
                          ? <CheckCircle2 className="h-6 w-6 text-primary" />
                          : <Clock className="h-6 w-6 text-muted-foreground" />
                        }
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold">{trip.title}</h3>
                          {!isSent ? (
                            <Badge variant="outline" className="text-xs">Ej fakturerad</Badge>
                          ) : isPaid ? (
                            <Badge variant="secondary" className="text-xs gap-1 bg-primary/10 text-primary border-0">
                              <CheckCircle2 className="h-3 w-3" /> Betald
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Clock className="h-3 w-3" /> Väntar betalning
                            </Badge>
                          )}
                        </div>
                        {trip.destination && (
                          <p className="text-sm text-muted-foreground mb-1">{trip.destination}</p>
                        )}
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          {trip.start_date && (
                            <span>
                              {safeFormatDate(trip.start_date)}
                              {trip.end_date && ` – ${safeFormatDate(trip.end_date)}`}
                            </span>
                          )}
                          {trip.invoice_number && (
                            <>
                              <span>•</span>
                              <span className="font-mono">Faktura: {trip.invoice_number}</span>
                            </>
                          )}
                          {trip.payment_due_date && !isPaid && (
                            <>
                              <span>•</span>
                              <span>Förfaller: {safeFormatDate(trip.payment_due_date)}</span>
                            </>
                          )}
                          {trip.payment_confirmed_at && isPaid && (
                            <>
                              <span>•</span>
                              <span>Betald: {safeFormatDate(trip.payment_confirmed_at)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {trip.price_total != null ? (
                        <p className={`font-semibold text-lg ${isPaid ? "" : "text-amber-700"}`}>
                          {trip.price_total.toLocaleString("sv-SE")} {trip.price_currency ?? "SEK"}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">–</p>
                      )}
                      {isSent && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Faktura skickad {safeFormatDate(trip.invoice_sent_at)}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Booking Payments */}
        <TabsContent value="bookings" className="space-y-4 mt-6">
          {bookingPayments.length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Inga bokningsbetalningar</h3>
                <p className="text-muted-foreground">Du har inte gjort några bokningsbetalningar ännu.</p>
              </div>
            </Card>
          ) : (
            bookingPayments.map((payment) => (
              <Card
                key={payment.id}
                className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/guest/bookings`, { state: { from: location.pathname } })}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Receipt className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{payment.bookings.listings?.title}</h3>
                        <Badge variant="outline">Bokningsbetalning</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {payment.bookings.listings?.city}, {payment.bookings.listings?.country}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span>Transaktion: {payment.id.substring(0, 8)}</span>
                        <span>•</span>
                        <span>
                          {safeFormatDate(payment.bookings.checkin_date, "d MMM")} –{" "}
                          {safeFormatDate(payment.bookings.checkout_date)}
                        </span>
                        <span>•</span>
                        <span>{payment.bookings.nights} nätter</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">${payment.amount.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">{safeFormatDate(payment.created_at)}</p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Debt Payments */}
        <TabsContent value="debts" className="space-y-4 mt-6">
          {debtPayments.length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Inga skulder</h3>
                <p className="text-muted-foreground">Du har inga utestående skulder.</p>
              </div>
            </Card>
          ) : (
            debtPayments.map((payment) => (
              <Card
                key={payment.id}
                className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/guest/bookings`, { state: { from: location.pathname } })}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      <Receipt className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{payment.bookings.listings?.title}</h3>
                        <Badge variant="outline">
                          Skuldbetalning
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {payment.bookings.listings?.city}, {payment.bookings.listings?.country}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span>Transaktion: {payment.id.substring(0, 8)}</span>
                        <span>•</span>
                        <span>Tvist: {payment.disputes.id.substring(0, 8)}</span>
                      </div>
                      {payment.disputes.description && (
                        <p className="text-sm text-muted-foreground mt-2 max-w-md">
                          Anledning: {payment.disputes.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">${payment.amount.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">{safeFormatDate(payment.created_at)}</p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GuestPayments;
