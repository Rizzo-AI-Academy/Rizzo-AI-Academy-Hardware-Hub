// Il sito è riservato agli iscritti Academy: nessuna indicizzazione da motori di ricerca.
export default function robots() {
  return {
    rules: { userAgent: '*', disallow: '/' },
  };
}
