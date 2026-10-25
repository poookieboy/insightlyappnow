export function pageHead(title: string, description: string) {
  const appTitle = `${title} — Insightly`;
  return { meta: [
    { title: appTitle },
    { name: "description", content: description },
    { property: "og:title", content: appTitle },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] };
}