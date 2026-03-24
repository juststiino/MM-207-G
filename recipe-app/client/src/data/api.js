export async function request(path, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  let res;

  try {
    res = await fetch(path, {
      ...options,
      headers,
    });
  } catch (error) {
    throw new Error("Request failed");
  }

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message =
      typeof data === "object" && data?.error
        ? data.error
        : "Request failed";
    throw new Error(message);
  }

  return data;
}