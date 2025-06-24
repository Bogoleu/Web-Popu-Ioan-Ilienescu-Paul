const sendJson = require("../../core/sendJson");
const {
  checkAuth,
  checkRole,
  DEFAULT_ROLES,
} = require("../../utils/checkAuth");
const {
  createDumpster,
  findDumpsterById,
  findDumpsterByAddress,
  findDumpsterByNeighborhood,
  updateDumpsterStatus,
  deleteDumpster,
} = require("./dumpster.service");

const createNewDumpster = async (req, res) => {
  const { street, neighborhood, city, state, dumpsterType, status } = req.body;

  try {
    const user = await checkAuth(req.config, req.headers);
    const isRoleValid = checkRole(user, DEFAULT_ROLES.ADMINISTRATOR);
    if (isRoleValid !== null) {
      sendJson(res, isRoleValid.status, isRoleValid.error);
      return;
    }

    if (
      !street ||
      !neighborhood ||
      !city ||
      !state ||
      !dumpsterType ||
      !status
    ) {
      sendJson(res, 400, {
        message:
          "All the fields are required: street, neighborhood, city, state, dumpsterType, status",
      });
      return;
    }

    const dumpster = await createDumpster(
      street,
      neighborhood,
      city,
      state,
      dumpsterType,
      status
    );
    if (!dumpster) {
      sendJson(res, 401, { message: "Failed to create dumpster..." });
      return;
    }
    sendJson(res, 200, { message: "Dumpster create successfully", dumpster });
  } catch (error) {
    sendJson(res, 500, {
      message: "Internal server error",
      error: error.message,
    });
    return;
  }
};

const getDumpsterById = async (req, res) => {
  const dumpsterId = req.params.id;

  try {
    await checkAuth(req.config, req.headers);

    const dumpster = await findDumpsterById(dumpsterId);
    if (!dumpster) {
      sendJson(res, 404, { message: "Dumpster not found" });
      return;
    }
    sendJson(res, 200, {
      message: "Dumpster retrieved successfully",
      dumpster,
    });
  } catch (error) {
    sendJson(res, 500, {
      message: "Internal server error",
      error: error.message,

    });
    return;
  }
};

const getDumpsterByAddress = async (req, res) => {
  const { street, neighborhood, city, dumpsterType } = req.body;
  try {
    await checkAuth(req.config, req.headers);

    const dumpsters = await findDumpsterByAddress(
      street,
      neighborhood,
      city,
      dumpsterType
    );
    if (!dumpsters) {
      sendJson(res, 404, { message: "Dumpster not found" });
      return;
    }
    sendJson(res, 200, {
      message: "Dumpster retrieved successfully",
      dumpsters,
    });
  } catch (error) {
    sendJson(res, 500, {
      message: "Internal server error",
      error: error.message,
    });
    return;
  }
};

const getDumpsterByNeighborhood = async (req, res) => {
  const { city, neighborhood } = req.params;
  try {
    await checkAuth(req.config, req.headers);
    const dumpsters = await findDumpsterByNeighborhood(city, neighborhood);
    if (!dumpsters) {
      sendJson(res, 404, { message: "Dumpster not found" });
      return;
    }
    sendJson(res, 200, {
      message: "Dumpster retrieved successfully",
      dumpsters,
    });
  } catch (error) {
    sendJson(res, 500, {
      message: "Internal server error",
      error: error.message,
    });
    return;
  }
};

const updateDumpster = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const user = await checkAuth(req.config, req.headers);
    const isRoleValid = checkRole(user, DEFAULT_ROLES.ADMINISTRATOR);
    if (isRoleValid !== null) {
      sendJson(res, isRoleValid.status, isRoleValid.error);
      return;
    }
    const dumpsters = await updateDumpsterStatus(id, status);
    if (!dumpsters) {
      sendJson(res, 404, { message: "Dumpster not found" });
      return;
    }
    sendJson(res, 200, {
      message: "Dumpster updated successfully",
      dumpsters,
    });
  } catch (error) {
    sendJson(res, 500, {
      message: "Internal server error",
      error: error.message,
    });
    return;
  }
};

const removeDumpster = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await checkAuth(req.config, req.headers);
    const isRoleValid = checkRole(user, DEFAULT_ROLES.ADMINISTRATOR);
    if (isRoleValid !== null) {
      sendJson(res, isRoleValid.status, isRoleValid.error);
      return;
    }
    await deleteDumpster(id);
    sendJson(res, 200, {
      message: "Dumpster successfully removed",
    });
  } catch (error) {
    sendJson(res, 500, {
      message: "Internal server error",
      error: error.message,
    });
    return;
  }
}

module.exports = {
  createNewDumpster,
  getDumpsterById,
  getDumpsterByAddress,
  getDumpsterByNeighborhood,
  updateDumpster,
  removeDumpster,
};
