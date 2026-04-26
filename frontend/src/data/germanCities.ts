// Top ~120 German cities + special "Remote" / "Deutschland" pseudo-locations.
// Used by CityAutocomplete to validate and suggest user input.
export const GERMAN_CITIES: string[] = [
  'Remote', 'Deutschland',
  'Berlin', 'Hamburg', 'München', 'Köln', 'Frankfurt am Main', 'Stuttgart',
  'Düsseldorf', 'Leipzig', 'Dortmund', 'Essen', 'Bremen', 'Dresden', 'Hannover',
  'Nürnberg', 'Duisburg', 'Bochum', 'Wuppertal', 'Bielefeld', 'Bonn', 'Münster',
  'Karlsruhe', 'Mannheim', 'Augsburg', 'Wiesbaden', 'Mönchengladbach', 'Gelsenkirchen',
  'Braunschweig', 'Chemnitz', 'Aachen', 'Kiel', 'Halle (Saale)', 'Magdeburg',
  'Freiburg im Breisgau', 'Krefeld', 'Lübeck', 'Mainz', 'Erfurt', 'Oberhausen',
  'Rostock', 'Kassel', 'Hagen', 'Potsdam', 'Saarbrücken', 'Hamm', 'Mülheim an der Ruhr',
  'Ludwigshafen am Rhein', 'Leverkusen', 'Oldenburg', 'Osnabrück', 'Solingen',
  'Heidelberg', 'Herne', 'Neuss', 'Darmstadt', 'Paderborn', 'Regensburg', 'Ingolstadt',
  'Würzburg', 'Fürth', 'Wolfsburg', 'Offenbach am Main', 'Ulm', 'Heilbronn', 'Pforzheim',
  'Göttingen', 'Bottrop', 'Trier', 'Recklinghausen', 'Reutlingen', 'Bremerhaven',
  'Koblenz', 'Bergisch Gladbach', 'Jena', 'Remscheid', 'Erlangen', 'Moers', 'Siegen',
  'Hildesheim', 'Salzgitter', 'Cottbus', 'Kaiserslautern', 'Gütersloh', 'Iserlohn',
  'Hanau', 'Witten', 'Esslingen am Neckar', 'Ludwigsburg', 'Schwerin', 'Düren', 'Ratingen',
  'Tübingen', 'Flensburg', 'Lüneburg', 'Villingen-Schwenningen', 'Konstanz',
  'Marl', 'Worms', 'Wilhelmshaven', 'Velbert', 'Minden', 'Rheine', 'Neumünster',
  'Lünen', 'Dessau-Roßlau', 'Viersen', 'Bayreuth', 'Norderstedt', 'Castrop-Rauxel',
  'Gladbeck', 'Aschaffenburg', 'Bocholt', 'Detmold', 'Lippstadt', 'Brandenburg an der Havel',
  'Dorsten', 'Bamberg', 'Lüdenscheid', 'Celle', 'Kempten (Allgäu)', 'Neuwied', 'Plauen',
  'Aalen', 'Fulda', 'Sindelfingen', 'Rosenheim', 'Marburg', 'Stralsund',
]

const NORMALIZED = GERMAN_CITIES.map(c => c.toLowerCase())

export function isValidGermanCity(input: string): boolean {
  if (!input) return false
  return NORMALIZED.includes(input.trim().toLowerCase())
}

export function suggestCities(query: string, limit = 8): string[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  // Prefix matches first, then substring matches
  const prefix: string[] = []
  const contains: string[] = []
  for (const city of GERMAN_CITIES) {
    const lc = city.toLowerCase()
    if (lc.startsWith(q)) prefix.push(city)
    else if (lc.includes(q)) contains.push(city)
    if (prefix.length >= limit) break
  }
  return [...prefix, ...contains].slice(0, limit)
}
