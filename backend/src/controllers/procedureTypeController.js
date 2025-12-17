const pool = require('../config/database');

// This controller is now effectively unused because procedure "type" was
// merged into the procedure itself (name only). We keep a no-op endpoint
// for backwards compatibility if the frontend still calls it, but it always
// returns an empty list.

const getProcedureTypes = async (_req, res) => {
  res.json({ types: [] });
};

module.exports = {
  getProcedureTypes,
};


