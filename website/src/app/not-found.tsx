import Link from "next/link";

export default function NotFound() {
  return (
    <section className="page-section cream">
      <div className="shell empty-state">
        <p className="eyebrow">PAGE MISSING</p>
        <h1>404</h1>
        <p className="lede" style={{ margin: "0 auto 20px" }}>
          That page isn’t on this edition of the paper.
        </p>
        <Link className="btn btn-primary" href="/">
          BACK TO THE FRONT PAGE
        </Link>
      </div>
    </section>
  );
}
