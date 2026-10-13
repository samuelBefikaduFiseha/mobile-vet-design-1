// Background photography used on the public site and sign-in page.
// CC BY-SA photos require attribution — these are listed on /credits and linked from the footer.

export const sitePhotos = {
  heroCattle: {
    src: "/images/hero-cattle.jpg",
    alt: "An Afar herder bringing cattle into an almost dry riverbed in search of water",
    title: "Cattle herd in riverbed, Afar, Ethiopia",
    author: "Sonjamariavienna",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    source: "https://commons.wikimedia.org/wiki/File:Cattle_herd_in_riverbed_Afar_Ethiopia.jpg",
  },
  herders: {
    src: "/images/herders.jpg",
    alt: "Young herders driving a large flock of goats along a red-earth road in South Omo",
    title: "Goat Herders, Banna Tribe, Ethiopia",
    author: "Rod Waddington",
    license: "CC BY-SA 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
    source: "https://commons.wikimedia.org/wiki/File:Goat_Herders,_Banna_Tribe,_Ethiopia_(21294871186).jpg",
  },
  caravan: {
    src: "/images/caravan.jpg",
    alt: "A camel caravan crossing the stony Danakil desert in the Afar region",
    title: "Salt caravan, Afar region, Ethiopia",
    author: "Ji-Elle",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    source: "https://commons.wikimedia.org/wiki/File:Ethiopie-R%C3%A9gion_Afar-Caravane_de_sel_(11).jpg",
  },
  vetClinic: {
    src: "/images/vet-clinic.jpg",
    alt: "A boy bringing his bull to a veterinary clinic in Hirna, Ethiopia",
    title: "Veterinary civic action program, Hirna, Ethiopia",
    author: "Tech. Sgt. Donald Allen, U.S. Air Force",
    license: "Public domain",
    licenseUrl: null,
    source: "https://commons.wikimedia.org/wiki/File:Ethiopia,_US_partner_for_Veterinarian_Project_121027-F-BU402-206.jpg",
  },
  camels: {
    src: "/images/camels.jpg",
    alt: "A herder leading a line of loaded camels along a dirt road in Ethiopia",
    title: "Camels carrying supplies in Ethiopia",
    author: "President's Malaria Initiative",
    license: "Public domain",
    licenseUrl: null,
    source: "https://commons.wikimedia.org/wiki/File:Using_camels_to_distribute_long_lasting_insecticide-treated_nets_(LLINs)_in_Ethiopia_(41559656730).jpg",
  },
} as const;

export type SitePhoto = (typeof sitePhotos)[keyof typeof sitePhotos];
