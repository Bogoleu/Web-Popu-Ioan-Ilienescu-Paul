class Router {
  constructor() {
    this.routes = [];
  }

  register(method, path, handler, middlewares = []) {
    const segments = path.split("/").filter(Boolean);
    const keys = segments.map((s) => (s.startsWith(":") ? s.slice(1) : null));
    this.routes.push({ method, segments, keys, handler, middlewares });
  }

  match(method, pathname) {
    const parts = pathname.split("/").filter(Boolean);

    for (const route of this.routes) {
      if (route.method !== method || route.segments.length !== parts.length)
        continue;

      const params = {};
      let matched = true;

      for (let i = 0; i < parts.length; i++) {
        if (route.segments[i].startsWith(":")) {
          params[route.keys[i]] = decodeURIComponent(parts[i]);
        } else if (route.segments[i] !== parts[i]) {
          matched = false;
          break;
        }
      }

      if (matched) return { 
        handler: route.handler, 
        params, 
        middlewares: route.middlewares 
      };
    }

    return null;
  }
}

exports.Router = Router;