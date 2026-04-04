export function listResources() {
  return [
    {
      id: "workspace",
      name: "Workspace principal",
      status: "active",
    },
    {
      id: "agents",
      name: "Agentes configurados",
      status: "draft",
    },
  ];
}

export function createResource(input) {
  return {
    id: String(input?.id ?? "resource"),
    name: String(input?.name ?? "Novo recurso"),
    status: String(input?.status ?? "draft"),
  };
}
