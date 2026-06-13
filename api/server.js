import http from "node:http";
import { URL } from "node:url";
import { getMatchById, listCompetitions, listMatches } from "./dataStore.js";
import { REGIONS } from "./regions.js";

const PORT = Number.parseInt(process.env.PORT ?? "3000", 10);

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, OPTIONS",
    "access-control-allow-headers": "content-type",
  });

  if (statusCode === 204) {
    response.end();
    return;
  }

  response.end(JSON.stringify(body, null, 2));
}

function notFound(response) {
  sendJson(response, 404, {
    error: {
      code: "not_found",
      message: "Endpoint not found.",
    },
  });
}

function paramsToObject(searchParams) {
  return Object.fromEntries(searchParams.entries());
}

const server = http.createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  if (request.method !== "GET") {
    sendJson(response, 405, {
      error: {
        code: "method_not_allowed",
        message: "Only GET requests are supported.",
      },
    });
    return;
  }

  const url = new URL(request.url, `http://${request.headers.host}`);
  const routePath = url.pathname.replace(/\/+$/, "") || "/";

  try {
    if (routePath === "/" || routePath === "/health") {
      sendJson(response, 200, {
        name: "RawanTV Football Data Hub API",
        status: "ok",
        endpoints: ["/api/matches", "/api/matches/:id", "/api/competitions", "/api/regions"],
      });
      return;
    }

    if (routePath === "/api/regions") {
      sendJson(response, 200, { data: Object.values(REGIONS) });
      return;
    }

    if (routePath === "/api/competitions") {
      sendJson(response, 200, await listCompetitions(paramsToObject(url.searchParams)));
      return;
    }

    if (routePath === "/api/matches") {
      sendJson(response, 200, await listMatches(paramsToObject(url.searchParams)));
      return;
    }

    const matchRoute = routePath.match(/^\/api\/matches\/([^/]+)$/);
    if (matchRoute) {
      const match = await getMatchById(decodeURIComponent(matchRoute[1]));
      if (!match) {
        notFound(response);
        return;
      }
      sendJson(response, 200, { data: match });
      return;
    }

    notFound(response);
  } catch (error) {
    console.error(error);
    sendJson(response, 500, {
      error: {
        code: "internal_server_error",
        message: "The API could not complete the request.",
      },
    });
  }
});

server.listen(PORT, () => {
  console.log(`RawanTV Football Data Hub API is running at http://localhost:${PORT}`);
});
