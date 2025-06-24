// lib/api.ts

const basicUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Custom fetcher function for API requests.
 * It automatically appends the base URL.
 * The Authorization header (if needed) should be provided by the caller in `options.headers`.
 *
 * @param endpoint The API endpoint (e.g., '/conversations/user/123')
 * @param options Fetch options (method, headers, body, etc.)
 */
export async function fetcher<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${basicUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  console.log(`[Fetcher] Making request to: ${url}`);

  // Créer un nouvel objet Headers pour garantir le bon typage et la fusion.
  // Les en-têtes sont fournis par l'appelant.
  const headers = new Headers(options?.headers);

  // S'assurer que Content-Type est défini si un corps est envoyé, sauf si déjà spécifié.
  if (!headers.has("Content-Type") && options?.body && typeof options.body === 'string') {
    try {
      JSON.parse(options.body); // Check if body is valid JSON
      headers.set("Content-Type", "application/json");
    } catch (e) {
      // If not JSON, leave Content-Type as is or let fetch determine it.
    }
  }


  const response = await fetch(url, {
    ...options,
    headers, // Utilise les en-têtes fournis par l'appelant (qui incluront l'Authorization)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "An unknown API error occurred." }));
    console.error(
      `[Fetcher Error] Request to ${url} failed with status ${response.status}:`,
      errorData
    );
    throw new Error(
      errorData.message ||
        `API request failed: ${response.status} ${response.statusText}`
    );
  }

  return response.json() as Promise<T>;
}