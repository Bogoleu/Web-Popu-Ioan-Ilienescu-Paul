const DumpsterModel = require("../../models/dumpsters.model");

const dumpsterTypes = [
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

const createDumpster = async (
  street,
  neighborhood,
  city,
  state,
  dumpsterType,
  status
) => {
  if (!dumpsterTypes.includes(dumpsterType)) {
    throw new Error(
      `Invalid dumpster type. choose from these: ${dumpsterTypes.join(", ")}`
    );
  }
  const dumpsterExists = await DumpsterModel.findOne({
    street,
    neighborhood: neighborhood.toLowerCase(),
    city: city.toLowerCase(),
    state: state.toUpperCase(),
    dumpsterType,
  });
  if (dumpsterExists !== null) {
    throw new Error(
      "A dumpster with the same location and type already exists."
    );
  }

  const dumpster = new DumpsterModel({
    street,
    neighborhood: neighborhood.toLowerCase(),
    city: city.toLowerCase(),
    state: state.toUpperCase(),
    dumpsterType,
    status,
    lastUpdated: Date.now(),
  });

  await dumpster.save();

  const dumpsterObj = dumpster.toObject();
  dumpsterObj.id = dumpsterObj._id;
  delete dumpsterObj._id;
  delete dumpsterObj.__v;
  return dumpsterObj;
};

const findDumpsterById = async (id) => {
  const dumpster = await DumpsterModel.findById(id);
  if (!dumpster) {
    throw new Error("Dumpster not found");
  }
  const dumpsterObj = dumpster.toObject();
  dumpsterObj.id = dumpsterObj._id;
  delete dumpsterObj._id;
  delete dumpsterObj.__v;
  return dumpsterObj;
};

const findDumpsterByAddress = async (
  street,
  neighborhood,
  city,
  dumpsterType
) => {
  const dumpsters = await DumpsterModel.find(
    {
      street,
      neighborhood: neighborhood.toLowerCase(),
      city: city.toLowerCase(),
      dumpsterType,
      status: "active",
    },
    { __v: 0 }
  );

  if (dumpsters === null || dumpsters.length === 0) {
    throw new Error(
      "A dumpster with the same location and type doesn't exist."
    );
  }

  return dumpsters;
};

const findDumpsterByNeighborhood = async (city, neighborhood) => {
  const dumpsters = await DumpsterModel.find(
    {
      neighborhood: neighborhood.toLowerCase(),
      city: city.toLowerCase(),
      status: "active",
    },
    { __v: 0 }
  );

  if (dumpsters === null || dumpsters.length === 0) {
    throw new Error(
      "A dumpster with the same location and type doesn't exist."
    );
  }

  return dumpsters;
};

const updateDumpsterStatus = async (id, newStatus) => {
  if (!["active", "maintenance", "out_of_service"].includes(newStatus)) {
    throw new Error(
      "Invalid status. Please use: active, maintenance, out_of_service"
    );
  }

  const dumpster = await DumpsterModel.findOne({ _id: id });
  if (dumpster === null) {
    throw new Error("A dumpster with the id doesn't exist.");
  }

  const dumpsterModifications = {};

  if (dumpster.status !== newStatus) {
    dumpsterModifications.status = newStatus;
  }

  if (Object.keys(dumpsterModifications).length === 0) {
    return null;
  }

  dumpsterModifications.updatedAt = Date.now();

  const dumpsterUpd = await DumpsterModel.updateOne(
    {
      _id: id,
    },
    {
      $set: dumpsterModifications,
    }
  );

  if (dumpsterUpd.modifiedCount > 0) {
    return dumpsterModifications;
  }

  return null;
};

const deleteDumpster = async (id) => {
  const dumpster = await DumpsterModel.deleteOne({ _id: id });
  return true;
}

module.exports = {
  createDumpster,
  findDumpsterById,
  findDumpsterByAddress,
  findDumpsterByNeighborhood,
  updateDumpsterStatus,
  deleteDumpster,
};
