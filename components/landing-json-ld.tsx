import { APP_DESCRIPTION, APP_NAME } from "@/lib/branding";
import { getSiteUrl } from "@/lib/site-url";

/** JSON-LD para a home (WebSite + Organization). */
export function LandingJsonLd() {
  const url = getSiteUrl();
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: APP_NAME,
        url,
        description: APP_DESCRIPTION,
        publisher: { "@id": `${url}#organization` },
      },
      {
        "@type": "Organization",
        "@id": `${url}#organization`,
        name: APP_NAME,
        url,
        description: APP_DESCRIPTION,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
