// Clasificación taxonómica y metadatos por especie (Darwin Core).
// Usado como referencia visual (foto de especie) mientras no hay fotografías
// de campo reales conectadas vía MinIO.
export const TAXONOMY: Record<string, {
  commonName: string;
  kingdom: string; phylum: string; class_: string; order: string;
  family: string; genus: string; specificEpithet: string;
  scientificNameAuthorship: string; iucnStatus: string; iucnLabel: string;
  photoUrl: string; photoCredit: string;
}> = {
  "Sciurus granatensis": {
    commonName: "Ardilla cola roja",
    kingdom: "Animalia", phylum: "Chordata", class_: "Mammalia",
    order: "Rodentia", family: "Sciuridae", genus: "Sciurus", specificEpithet: "granatensis",
    scientificNameAuthorship: "Humboldt, 1811",
    iucnStatus: "LC", iucnLabel: "Preocupación menor",
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Sciurus_granatensis_-_Juvenil_%281%29.jpg/480px-Sciurus_granatensis_-_Juvenil_%281%29.jpg",
    photoCredit: "© Wikimedia Commons / CC BY-SA",
  },
  "Didelphis marsupialis": {
    commonName: "Zarigüeya",
    kingdom: "Animalia", phylum: "Chordata", class_: "Mammalia",
    order: "Didelphimorphia", family: "Didelphidae", genus: "Didelphis", specificEpithet: "marsupialis",
    scientificNameAuthorship: "Linnaeus, 1758",
    iucnStatus: "LC", iucnLabel: "Preocupación menor",
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Gambaa.jpg/480px-Gambaa.jpg",
    photoCredit: "© Wikimedia Commons / CC BY-SA",
  },
  "Coendou prehensilis": {
    commonName: "Puercoespín",
    kingdom: "Animalia", phylum: "Chordata", class_: "Mammalia",
    order: "Rodentia", family: "Erethizontidae", genus: "Coendou", specificEpithet: "prehensilis",
    scientificNameAuthorship: "(Linnaeus, 1758)",
    iucnStatus: "LC", iucnLabel: "Preocupación menor",
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Coendou_prehensilis_CritChrist.jpg/480px-Coendou_prehensilis_CritChrist.jpg",
    photoCredit: "© Wikimedia Commons / CC BY-SA",
  },
  "Mustela frenata": {
    commonName: "Comadreja",
    kingdom: "Animalia", phylum: "Chordata", class_: "Mammalia",
    order: "Carnivora", family: "Mustelidae", genus: "Mustela", specificEpithet: "frenata",
    scientificNameAuthorship: "Lichtenstein, 1831",
    iucnStatus: "LC", iucnLabel: "Preocupación menor",
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Mustela_frenata_longicauda.jpg/480px-Mustela_frenata_longicauda.jpg",
    photoCredit: "© Wikimedia Commons / CC BY-SA",
  },
  "Sturnira lilium": {
    commonName: "Murciélago frutero",
    kingdom: "Animalia", phylum: "Chordata", class_: "Mammalia",
    order: "Chiroptera", family: "Phyllostomidae", genus: "Sturnira", specificEpithet: "lilium",
    scientificNameAuthorship: "(É. Geoffroy, 1810)",
    iucnStatus: "LC", iucnLabel: "Preocupación menor",
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Sturnira_lilium_-_Belo_Horizonte_2.jpg/480px-Sturnira_lilium_-_Belo_Horizonte_2.jpg",
    photoCredit: "© Wikimedia Commons / CC BY-SA",
  },
};

export const IUCN_COLOR: Record<string, string> = {
  LC: "#52b788", NT: "#a3be8c", VU: "#e08a1e", EN: "#d08770", CR: "#e5554e", EW: "#9d4edd", EX: "#5f7669",
};
