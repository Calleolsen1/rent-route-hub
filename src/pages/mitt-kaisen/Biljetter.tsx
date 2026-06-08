import { Ticket } from "lucide-react";

export default function MittKaisenBiljetter() {
  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto">
      <h1
        className="text-4xl md:text-5xl font-light mb-2"
        style={{ color: "hsl(210 30% 92%)", fontFamily: "'Cormorant Garamond', serif" }}
      >
        Mina biljetter
      </h1>
      <p className="text-sm mb-10" style={{ color: "hsl(210 20% 70%)" }}>
        Här samlas dina match- och racebiljetter.
      </p>

      <div
        className="rounded-xl p-10 text-center"
        style={{ backgroundColor: "hsl(222 40% 18%)" }}
      >
        <Ticket
          className="h-12 w-12 mx-auto mb-4"
          style={{ color: "hsl(201 100% 55%)" }}
        />
        <p className="text-lg font-light" style={{ color: "hsl(210 30% 92%)" }}>
          Du har inga biljetter ännu.
        </p>
        <p className="text-sm mt-2" style={{ color: "hsl(210 20% 70%)" }}>
          När du köpt en biljett dyker den upp här.
        </p>
      </div>
    </div>
  );
}
