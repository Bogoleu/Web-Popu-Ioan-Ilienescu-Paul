const mongoose = require("mongoose");
const Dumpster = require("../src/models/dumpsters.model");
const parseConfig = require('../src/utils/config');

const DUMPSTER_TYPES = [
  "household",
  "paper",
  "plastic",
  "glass",
  "metal",
  "electronics",
  "batteries",
  "organic",
  "textiles",
  "construction",
];

const neighborhoodsData = [
  {
    state: "iasi",
    city: "iasi",
    status: "active",
    neighborhood: "tatarasi",
    addresses: [
      { street: "Dorobanti" },
      { street: "Trompeta" },
      { street: "Fulger" },
      { street: "Verdes" },
      { street: "Ion Creanga" },
      { street: "Deliu" },
      { street: "Ciric" },
      { street: "Stejar" },
      { street: "Fantanilor" },
      { street: "Trecatoarea Fantanilor" },
      { street: "Trecatoarea Ciobanului" },
      { street: "Holboca" },
      { street: "Motilor" },
      { street: "Marginei" },
      { street: "Mistretului" },
      { street: "Ceahlau" },
      { street: "Nisipari" },
      { street: "Vulturilor" },
      { street: "Porumbului" },
      { street: "Lt.Ghe.Caranda" },
      { street: "Obreja" },
      { street: "Zborului" },
      { street: "Capitan Protopopescu" },
      { street: "Aeroportului" },
      { street: "Stejar" },
      { street: "Ion Creanga" },
    ],
  },
  {
    state: "iasi",
    city: "iasi",
    status: "active",
    neighborhood: "copou",
    addresses: [
      { street: "Aleea M.Sadoveanu" },
      { street: "Ursulea" },
      { street: "Viticultori" },
      { street: "Baltagului" },
      { street: "Flammarion" },
      { street: "G.Cosbuc" },
      { street: "Frederich" },
      { street: "Fagului" },
      { street: "Podgoriilor" },
      { street: "Prof.A.Ciolan" },
      { street: "O.Pancu" },
      { street: "O.Raianu" },
      { street: "Dealul Zorilor" },
      { street: "Ioan Slavici" },
      { street: "G.Calinescu" },
      { street: "T.Vianu" },
      { street: "Dr.Vicol" },
      { street: "Th.Vascauteanu" },
      { street: "Turcu" },
      { street: "Pojarniciei" },
      { street: "Toma Cozma" },
    ],
  },
  {
    state: "iasi",
    city: "iasi",
    status: "active",
    neighborhood: "pacurari",
    addresses: [
      { street: "Anastasie Fatu" },
      { street: "Florilor" },
      { street: "Florilor" },
      { street: "Cimitirul Evreiesc" },
      { street: "Elizabeta Rizea" },
      { street: "Iancu Flondor" },
      { street: "Ion Nistor" },
      { street: "Eudoxiu Hurmuzaki" },
      { street: "Nicolae Oblu" },
      { street: "Popauti" },
      { street: "Cazarmilor" },
      { street: "Semanatorului" },
      { street: "Ion Roata" },
      { street: "Ogorului" },
      { street: "Sos. Munteni" },
      { street: "Busuioc" },
      { street: "Rovine" },
      { street: "Casin" },
      { street: "Calugareni" },
      { street: "Calafat" },
      { street: "Namoloasa" },
      { street: "Bucovinei" },
      { street: "Fnd. Bucovinei" },
      { street: "Podul Inalt" },
      { street: "Olteniei" },
    ],
  },
  {
    state: "iasi",
    city: "iasi",
    status: "active",
    neighborhood: "Alexandru cel bun",
    addresses: [
      { street: "Str.Urcusului" },
      { street: "Fagetului" },
      { street: "Roadelor" },
      { street: "Szabo" },
      { street: "Galbeni" },
      { street: "Frunzei" },
      { street: "Alunis" },
      { street: "Bradetului" },
      { street: "Caramidari" },
      { street: "Fagilor" },
      { street: "Fluturilor" },
      { street: "Galata" },
      { street: "Hatman Sendrea" },
      { street: "V.Ureche" },
      { street: "Salciilor" },
      { street: "Salciilor" },
      { street: "Arh.Ioan Berindei" },
      { street: "Ioan Berindei" },
      { street: "Cicoarei" },
      { street: "la Cicoarei" },
      { street: "Cicoarei" },
      { street: "Poienilor" },
      { street: "la Poienilor" },
      { street: "Poienilor" },
      { street: "Dallas" },
    ],
  },
];

function getRandomTypes() {
  const shuffled = [...DUMPSTER_TYPES].sort(() => 0.5 - Math.random());
  const count = Math.floor(Math.random() * 3) + 3;
  return shuffled.slice(0, count);
}

async function populateDumpsters() {
  const dumpsters = [];

  for (const n of neighborhoodsData) {
    for (const addr of n.addresses) {
      const types = getRandomTypes();
      types.forEach((type) => {
        dumpsters.push({
          state: n.state,
          city: n.city,
          status: n.status,
          neighborhood: n.neighborhood,
          street: addr.street,
          dumpsterType: type,
        });
      });
    }
  }

  try {
    await Dumpster.insertMany(dumpsters);
    console.log(`Inserted ${dumpsters.length} dumpsters.`);
  } catch (err) {
    console.error("Error inserting dumpsters:", err);
  } finally {
    mongoose.connection.close();
  }
}

async function main() {
  const config = await parseConfig("./config/dev.json");

  await mongoose.connect(config.database.uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  populateDumpsters();
}

main();
