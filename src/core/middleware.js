async function runMiddlewares(req, res, middlewares) {
  for (const mw of middlewares) {
    await new Promise((resolve, reject) => {
      try {
        mw(req, res, (err) => {
          if (err) reject(err instanceof Error ? err : new Error(err));
          else resolve();
        });
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = {
  runMiddlewares,
};