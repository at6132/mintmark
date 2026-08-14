import Link from "next/link";
import { assets } from "@/lib/assets";

// mintmark house ad — Trump Accounts, explained. mintmark's own branding.
export function AdBanner() {
  return (
    <section className="mm-ad" aria-label="Mintmark advertisement">
      <div className="mm-ad__inner">
        <div className="mm-ad__copy">
          <span className="mm-ad__eyebrow">Trump Accounts, explained</span>
          <h2 className="mm-ad__headline">
            Does your child know what&rsquo;s in their <em>Trump Account?</em>
          </h2>
          <p className="mm-ad__body">
            Every American newborn now gets one. mintmark turns it — and the whole world of
            business, markets and money — into something a ten-year-old can actually understand.
          </p>
          <div className="mm-ad__actions">
            <Link className="mm-ad__cta" href="/catalog">
              Start on the shelf <span aria-hidden="true">→</span>
            </Link>
            <Link className="mm-ad__cta mm-ad__cta--ghost" href="/#newsroom">
              Read today&rsquo;s fin.
            </Link>
          </div>
        </div>
        <div className="mm-ad__brand">
          <img className="mm-ad__mark" src={assets.markApp} alt="" width={200} height={200} />
          <img className="mm-ad__wordmark" src={assets.logo} alt="Mintmark" width={620} height={140} />
          <span className="mm-ad__tag">Big Ideas for Small Readers</span>
        </div>
      </div>
    </section>
  );
}
