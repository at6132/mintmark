import { assets } from "@/lib/assets";

export const metadata = { title: "The Mint" };

// six metals — one per level. Empty squares for now.
const METALS = [
  { roman: "I", name: "Copper", from: "#e0954c", to: "#a85f28" },
  { roman: "II", name: "Nickel", from: "#d3d6dc", to: "#9aa0a8" },
  { roman: "III", name: "Brass", from: "#e6c877", to: "#b18f3e" },
  { roman: "IV", name: "Bronze", from: "#d18f49", to: "#875629" },
  { roman: "V", name: "Silver", from: "#eceef3", to: "#b3b7c0" },
  { roman: "VI", name: "Platinum", from: "#f2f4f7", to: "#c6cad1" },
];

export default function MintPage() {
  return (
    <section className="mm-mint">
      <span className="mm-mint__sheen" aria-hidden="true" />
      <span className="mm-mint__orb mm-mint__orb--a" aria-hidden="true" />
      <span className="mm-mint__orb mm-mint__orb--b" aria-hidden="true" />

      <div className="mm-mint__inner">
        <header className="mm-mint__head">
          <h1 className="mm-mint__title">The Mint</h1>
          <span className="mm-mint__subhead">The Curriculum</span>
          <img className="mm-mint__mark" src={assets.markApp} alt="Mintmark" width={200} height={200} />
        </header>

        <div className="mm-mint__navybox">
          <p>
            Six metals. Six levels. Thirty-six concepts — the curriculum behind every Mintmark company
            file, struck one mark at a time.
          </p>
        </div>

        <div className="mm-mint__table">
          {METALS.map((m) => (
            <div
              key={m.name}
              className="mm-mint__row"
              style={{ ["--from" as string]: m.from, ["--to" as string]: m.to }}
            >
              <span className="mm-mint__metal">
                <b>{m.roman}</b>
                <small>{m.name}</small>
              </span>
              <div className="mm-mint__cells">
                {Array.from({ length: 6 }).map((_, i) => (
                  <span key={i} className="mm-mint__cell" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
