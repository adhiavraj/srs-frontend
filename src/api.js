const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const generateSRS = async (data) => {
  const response = await fetch(`${API_BASE_URL}/api/generate-srs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error("Failed to generate SRS");

  // since backend returns pdf
  return await response.blob();
};