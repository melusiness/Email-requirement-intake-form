const { app } = require("@azure/functions");
const { TableClient } = require("@azure/data-tables");

const connStr = process.env.AzureWebJobsStorage;

function getTableClient() {
  return TableClient.fromConnectionString(connStr, "EmailRequirements");
}

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(data, status) {
  return { status: status || 200, headers: { ...cors(), "Content-Type": "application/json" }, body: JSON.stringify(data) };
}

app.http("requirementsList", {
  methods: ["GET", "POST", "OPTIONS"],
  authLevel: "anonymous",
  route: "requirements",
  handler: async (request) => {
    if (request.method === "OPTIONS") return { status: 204, headers: cors() };

    const client = getTableClient();

    if (request.method === "GET") {
      const entities = [];
      for await (const entity of client.listEntities()) entities.push(entity);
      entities.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      return json(entities);
    }

    if (request.method === "POST") {
      const data = await request.json();
      const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
      const entity = {
        partitionKey: "default", rowKey: id,
        templateName: data.templateName || "", purpose: data.purpose || "",
        audience: data.audience || "", trigger: data.trigger || "",
        cta: data.cta || "", parameters: JSON.stringify(data.parameters || []),
        subject: data.subject || "", preheader: data.preheader || "",
        title: data.title || "", body: data.body || "",
        status: "open", submitter: data.submitter || "anonymous",
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      await client.createEntity(entity);
      return json({ id, ...entity }, 201);
    }
  },
});

app.http("requirementsItem", {
  methods: ["GET", "PUT", "DELETE", "OPTIONS"],
  authLevel: "anonymous",
  route: "requirements/{id}",
  handler: async (request) => {
    if (request.method === "OPTIONS") return { status: 204, headers: cors() };

    const id = request.params.id;
    const client = getTableClient();

    if (request.method === "GET") {
      try {
        const entity = await client.getEntity("default", id);
        return json(entity);
      } catch (e) { return { status: 404, headers: cors(), body: "Not found" }; }
    }

    if (request.method === "PUT") {
      try {
        const existing = await client.getEntity("default", id);
        const data = await request.json();
        const updated = {
          partitionKey: "default", rowKey: id,
          templateName: data.templateName ?? existing.templateName,
          purpose: data.purpose ?? existing.purpose,
          audience: data.audience ?? existing.audience,
          trigger: data.trigger ?? existing.trigger,
          cta: data.cta ?? existing.cta,
          parameters: data.parameters ? JSON.stringify(data.parameters) : existing.parameters,
          subject: data.subject ?? existing.subject,
          preheader: data.preheader ?? existing.preheader,
          title: data.title ?? existing.title,
          body: data.body ?? existing.body,
          status: data.status ?? existing.status,
          submitter: existing.submitter,
          createdAt: existing.createdAt,
          updatedAt: new Date().toISOString(),
        };
        await client.updateEntity(updated, "Replace");
        return json(updated);
      } catch (e) { return { status: 404, headers: cors(), body: "Not found" }; }
    }

    if (request.method === "DELETE") {
      try {
        await client.deleteEntity("default", id);
        return { status: 200, headers: cors(), body: "Deleted" };
      } catch (e) { return { status: 404, headers: cors(), body: "Not found" }; }
    }
  },
});
