// Shared 500 response for backend functions.
// The exception (message and stack) stays in the server logs. The caller receives a generic message
// and a reference that locates the log entry.
export function internalError(functionName, error) {
  const reference = crypto.randomUUID();
  console.error(`[${functionName}] reference=${reference}`, error?.stack || error);
  return Response.json({ error: 'Internal error', reference }, { status: 500 });
}