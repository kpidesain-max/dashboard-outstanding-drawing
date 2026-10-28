const H = { "Content-Type": "application/json" };

async function call(url, opt) {
  opt = opt || {};
  opt.credentials = "include";
  const r = await fetch(url, opt);
  let body = null;
  try { body = await r.json(); } catch (e) {}
  if (!r.ok) throw new Error((body && body.error) || "HTTP " + r.status);
  return body;
}

export const api = {
  state: () => call("/api/state"),
  addProject: (d) => call("/api/projects", { method: "POST", headers: H, body: JSON.stringify(d) }),
  updateProject: (id, d) => call("/api/projects/" + encodeURIComponent(id), { method: "PATCH", headers: H, body: JSON.stringify(d) }),
  deleteProject: (id) => call("/api/projects/" + encodeURIComponent(id), { method: "DELETE" }),
  sync: (data) => call("/api/sync", { method: "POST", headers: H, body: JSON.stringify(data) }),
  adminLogin: (password) => call("/api/admin.php?action=login", { method: "POST", body: new URLSearchParams({ password }), credentials: "include" }),
  adminLogout: () => call("/api/admin.php?action=logout", { credentials: "include" }),
  getAdminCheck: () => call("/api/admin.php?action=check", { credentials: "include" }),
  adminUpload: (file) => {
    const fd = new FormData();
    fd.append("file", file);
    return call("/api/admin.php?action=upload", { method: "POST", body: fd, credentials: "include" });
  },
};
