import Property from "#models/Property";
import crypto from "crypto";

const safeJSONParse = (value, fallback = []) => {
  if (!value) return fallback;
  if (typeof value !== "string") return value; // already object/array
  try {
    return JSON.parse(value);
  } catch (err) {
    console.warn("Failed to parse JSON:", value);
    return fallback;
  }
};

const generateUniquePropertyId = async (length = 10) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id;
  let exists = true;

  while (exists) {
    id =
      "TVICL" +
      Array.from(
        { length },
        () => chars[crypto.randomInt(0, chars.length)]
      ).join("");
    exists = await Property.exists({ propertyId: id });
  }

  return id;
};

export { safeJSONParse, generateUniquePropertyId };
