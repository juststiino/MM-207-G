export async function request(path, options = {}) {

    // Call the API, but fetches only
  const res = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  // Recives what the API returns, and checks if it's JSON or not. Then parses it accordingly
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
