import Link from "next/link";
import { homeContent } from "@/data/home";
import { stripHtml } from "@/lib/format";

export function HomeNewsroom() {
  const ed = homeContent.editorial;
  const marketNews = ed.blocks.filter((b) => b.type === "market_news");
  const lead = ed.blocks.find((b) => b.type === "lead_story");
  const featured = ed.blocks.filter((b) => b.type === "featured_story");
  const question = ed.blocks.find((b) => b.type === "question");
  const quads = ed.blocks.filter((b) => b.type === "quick_take");
  const reports = ed.blocks.filter((b) => b.type === "stock_report");

  const tickerItems = [...marketNews, ...marketNews];

  return (
    <section className="newsroom">
      <div className="shell">
        <div className="newsroom__head">
          <div>
            <div className="newsroom__edition">
              {ed.edition_label} · {ed.edition_note}
            </div>
            <p className="eyebrow" style={{ marginTop: 12 }}>
              {ed.eyebrow}
            </p>
            <h2>{ed.heading}</h2>
          </div>
          <p className="newsroom__note">{ed.header_note}</p>
        </div>

        <div className="ticker" aria-label="Latest market news">
          <div className="ticker__label">
            <span className="ticker__dot" aria-hidden />
            {ed.ticker_label}
          </div>
          <div className="ticker__viewport">
            <div className="ticker__track" style={{ animationDuration: `${ed.ticker_speed || 45}s` }}>
              {tickerItems.map((item, idx) => (
                <span key={`${item.id}-${idx}`} className="ticker__item">
                  <b>{item.ticker}</b>
                  {item.heading}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="newsroom__grid">
          {lead ? (
            <article className="lead-story">
              <div className="lead-story__art">
                <span className="lead-story__chip">
                  {lead.ticker} · {lead.domain || lead.company}
                </span>
              </div>
              <div className="lead-story__body">
                <div className="lead-story__meta">
                  <span>{lead.article_number}</span>
                  <span>{lead.story_type}</span>
                  <span>{lead.company}</span>
                </div>
                <h3>{lead.heading}</h3>
                <p>{stripHtml(lead.description || "")}</p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
                  <Link className="btn btn-mint" href={lead.link || "/digests/nvidia"}>
                    {lead.link_label}
                  </Link>
                </div>
              </div>
            </article>
          ) : null}

          <div className="side-stories">
            {featured.map((story) => (
              <Link
                key={story.id}
                href={story.link || story.company_module_link || "/companies"}
                className="side-story"
                style={{ ["--accent" as string]: story.accent_color || "var(--mint)" }}
              >
                <div className="side-story__thumb" aria-hidden />
                <div>
                  <div className="side-story__num">
                    {story.number} · {story.ticker}
                  </div>
                  <h4>{story.heading}</h4>
                  {story.show_excerpt ? <p>{story.summary}</p> : null}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {question ? (
          <div className="question-banner">
            <div>
              <span>{question.label}</span>
              <h3>{question.heading}</h3>
              <p style={{ margin: "12px 0 0", color: "#c9d0dc" }}>{question.description}</p>
            </div>
            <Link className="btn btn-secondary" href={question.link || "/bookshelf"} style={{ color: "#fff", borderColor: "#fff" }}>
              {question.link_label}
            </Link>
          </div>
        ) : null}

        <div className="quick-takes">
          <div className="section-label">
            <h3>{ed.quick_heading}</h3>
            <span>{ed.quick_note}</span>
          </div>
          <div className="quick-grid">
            {quads.map((q) => (
              <Link
                key={q.id}
                href={q.link || "/companies"}
                className="quick-card"
                style={{ ["--accent" as string]: q.accent_color || "var(--mint)" }}
              >
                <div className="quick-card__top">
                  <span>
                    {q.number} · {q.ticker}
                  </span>
                  <span className={q.direction === "up" ? "change-up" : "change-down"}>
                    {q.direction === "up" ? "▲" : "▼"} {q.change}
                  </span>
                </div>
                <div style={{ fontFamily: "var(--font-ui)", fontSize: 10, fontWeight: 800, letterSpacing: "0.1em" }}>
                  {q.mark} · {q.company}
                </div>
                <h4>{q.heading}</h4>
                <p>{q.summary}</p>
                <div className="sparkline" aria-hidden />
              </Link>
            ))}
          </div>
        </div>

        <div className="reports">
          <div className="section-label">
            <h3>{ed.reports_heading}</h3>
            <span>{ed.reports_note}</span>
          </div>
          <div className="reports-grid">
            {reports.map((r) => (
              <article key={r.id} className="report-card">
                <div className="report-card__head">
                  <span>
                    {r.ticker} · {r.company}
                  </span>
                  <span className={r.direction === "up" ? "change-up" : "change-down"}>{r.change}</span>
                </div>
                <h4>{r.heading}</h4>
                <p>{r.summary}</p>
                <Link href={r.link || "/bookshelf"} className="btn btn-secondary">
                  {r.link_label}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
