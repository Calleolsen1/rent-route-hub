import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import FormSelect from "@/components/listing/FormSelect";

const LANGUAGE_OPTIONS = [
  { value: "sv", label: "Svenska" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
];

const CURRENCY_OPTIONS = [
  { value: "sek", label: "SEK (kr)" },
  { value: "usd", label: "USD ($)" },
  { value: "eur", label: "EUR (€)" },
  { value: "gbp", label: "GBP (£)" },
  { value: "nok", label: "NOK (kr)" },
  { value: "dkk", label: "DKK (kr)" },
];

const TIMEZONE_OPTIONS = [
  { value: "cet", label: "Central European Time (CET)" },
  { value: "utc", label: "UTC" },
  { value: "est", label: "Eastern Time (ET)" },
  { value: "pst", label: "Pacific Time (PT)" },
];

const Settings = () => {
  const [language, setLanguage] = useState("sv");
  const [currency, setCurrency] = useState("sek");
  const [timezone, setTimezone] = useState("cet");

  return (
    <div className="container mx-auto px-4 py-8 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Aviseringar</CardTitle>
            <CardDescription>Hantera hur du tar emot aviseringar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">E-postaviseringar</Label>
                <p className="text-sm text-muted-foreground">
                  Få bokningsuppdateringar via e-post
                </p>
              </div>
              <Switch id="email-notifications" defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sms-notifications">SMS-aviseringar</Label>
                <p className="text-sm text-muted-foreground">
                  Få textmeddelanden för viktiga uppdateringar
                </p>
              </div>
              <Switch id="sms-notifications" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="marketing">Marknadsföringsutskick</Label>
                <p className="text-sm text-muted-foreground">
                  Ta emot erbjudanden och kampanjer
                </p>
              </div>
              <Switch id="marketing" defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integritet</CardTitle>
            <CardDescription>Kontrollera dina integritetsinställningar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="profile-visibility">Profilsynlighet</Label>
                <p className="text-sm text-muted-foreground">
                  Visa din profil för värdar
                </p>
              </div>
              <Switch id="profile-visibility" defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="review-visibility">Recensionssynlighet</Label>
                <p className="text-sm text-muted-foreground">
                  Tillåt värdar att se dina recensioner
                </p>
              </div>
              <Switch id="review-visibility" defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inställningar</CardTitle>
            <CardDescription>Anpassa din upplevelse</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormSelect
              label="Språk"
              value={language}
              onChange={setLanguage}
              options={LANGUAGE_OPTIONS}
            />
            <FormSelect
              label="Valuta"
              value={currency}
              onChange={setCurrency}
              options={CURRENCY_OPTIONS}
            />
            <FormSelect
              label="Tidszon"
              value={timezone}
              onChange={setTimezone}
              options={TIMEZONE_OPTIONS}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kontoåtgärder</CardTitle>
            <CardDescription>Hantera ditt konto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full">
              Ladda ner mina uppgifter
            </Button>
            <Button variant="outline" className="w-full">
              Inaktivera konto
            </Button>
            <Button variant="destructive" className="w-full">
              Radera konto
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
