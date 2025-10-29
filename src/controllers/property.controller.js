// controllers/propertyController.js
import Property from "../models/Property.js";
import { validateProperty } from "#utils/validateProperty";
import { handleError } from "#utils/handleError";

export const createProperty = async (req, res) => {
  try {
    // 1️⃣ Validate input
    const { error, value } = validateProperty(req.body);
    if (error) {
      return res.status(422).json({
        success: false,
        message: "Validation failed",
        details: error.details.map((d) => d.message),
      });
    }

    // 2️⃣ Create property instance
    const property = new Property({
      ...value,
      owner: value.owner || req.user?._id, // if using auth
    });

    // 3️⃣ Save to DB
    const savedProperty = await property.save();

    // 4️⃣ Respond success
    return res.status(201).json({
      success: true,
      message: "Property created successfully",
      data: savedProperty,
    });
  } catch (error) {
    return handleError(res, error, 500);
  }
};
