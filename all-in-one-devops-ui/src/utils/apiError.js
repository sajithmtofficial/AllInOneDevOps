const fieldLabels = {
  name: "Name",
  description: "Description",
  language: "Language",
  github_url: "GitHub URL",
  branch: "Branch",
};

export function getApiErrorMessage(error) {
  if (!error) {
    return "Something went wrong. Please try again.";
  }

  const data = error.data;

  if (data && typeof data === "object" && !Array.isArray(data)) {
    const messages = Object.entries(data).flatMap(([field, value]) => {
      const values = Array.isArray(value) ? value : [value];
      const label = fieldLabels[field];

      return values
        .filter(Boolean)
        .map((message) => (label ? `${label}: ${message}` : String(message)));
    });

    if (messages.length > 0) {
      return messages.join(" ");
    }
  }

  return error.message || "Something went wrong. Please try again.";
}
