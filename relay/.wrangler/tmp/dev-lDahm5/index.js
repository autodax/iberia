var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.js
var CODE = /^[A-Z0-9]{4,8}$/;
var ALLOWED_ORIGINS = ["https://autodax.github.io"];
function originAllowed(req) {
  const o = req.headers.get("Origin");
  if (!o || o === "null") return true;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o)) return true;
  return ALLOWED_ORIGINS.includes(o);
}
__name(originAllowed, "originAllowed");
var src_default = {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.headers.get("Upgrade") !== "websocket") {
      return new Response("Iberia relay OK", { headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" } });
    }
    if (!originAllowed(req)) return new Response("Not allowed from this page", { status: 403 });
    const m = /^\/room\/([A-Za-z0-9]+)$/.exec(url.pathname);
    const code = m && m[1].toUpperCase();
    if (!code || !CODE.test(code)) return new Response("Bad room code", { status: 400 });
    return env.ROOMS.get(env.ROOMS.idFromName(code)).fetch(req);
  }
};
var Room = class {
  static {
    __name(this, "Room");
  }
  constructor(state) {
    this.state = state;
    this.state.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }
  async fetch(req) {
    const role = new URL(req.url).searchParams.get("role");
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    const host = this.state.getWebSockets("host")[0];
    if (role === "host") {
      if (host) return this.refuse(client, server, "taken");
      this.state.acceptWebSocket(server, ["host"]);
      server.send(JSON.stringify({ t: "ready" }));
      return new Response(null, { status: 101, webSocket: client });
    }
    if (role === "guest") {
      if (!host) return this.refuse(client, server, "notfound");
      const gid = crypto.randomUUID().slice(0, 8);
      this.state.acceptWebSocket(server, ["g:" + gid]);
      server.send(JSON.stringify({ t: "ready" }));
      host.send(JSON.stringify({ t: "open", g: gid }));
      return new Response(null, { status: 101, webSocket: client });
    }
    return new Response("Unknown role", { status: 400 });
  }
  refuse(client, server, code) {
    this.state.acceptWebSocket(server, ["refused"]);
    server.send(JSON.stringify({ t: "error", code }));
    server.close(1008, code);
    return new Response(null, { status: 101, webSocket: client });
  }
  async webSocketMessage(ws, msg) {
    if (typeof msg !== "string") return;
    const tags = this.state.getTags(ws);
    if (tags.includes("host")) {
      let m;
      try {
        m = JSON.parse(msg);
      } catch (e) {
        return;
      }
      if (!m || typeof m.g !== "string") return;
      for (const g of this.state.getWebSockets("g:" + m.g)) {
        if (m.t === "kick") {
          try {
            g.close(1e3, "kicked");
          } catch (e) {
          }
        } else if (typeof m.d === "string") {
          try {
            g.send(m.d);
          } catch (e) {
          }
        }
      }
      return;
    }
    const tag = tags.find((t) => t.startsWith("g:"));
    if (!tag) return;
    const host = this.state.getWebSockets("host")[0];
    if (host) {
      try {
        host.send(JSON.stringify({ g: tag.slice(2), d: msg }));
      } catch (e) {
      }
    }
  }
  async webSocketClose(ws, code) {
    this.gone(ws, code);
  }
  async webSocketError(ws) {
    this.gone(ws, 1011);
  }
  gone(ws, code) {
    const tags = this.state.getTags(ws);
    try {
      ws.close(code && code !== 1005 && code !== 1006 ? code : 1e3, "bye");
    } catch (e) {
    }
    if (tags.includes("host")) {
      for (const s of this.state.getWebSockets()) {
        if (s !== ws) {
          try {
            s.close(1012, "host left");
          } catch (e) {
          }
        }
      }
      return;
    }
    const tag = tags.find((t) => t.startsWith("g:"));
    const host = this.state.getWebSockets("host")[0];
    if (tag && host) {
      try {
        host.send(JSON.stringify({ t: "close", g: tag.slice(2) }));
      } catch (e) {
      }
    }
  }
};

// ../../../../../tmp/wr/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../../tmp/wr/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-Nu4AXo/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../../../../../tmp/wr/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-Nu4AXo/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  Room,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
