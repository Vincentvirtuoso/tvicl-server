import Property from "../models/Property.js";
import { validateProperty } from "#utils/validateProperty";
import { handleError } from "#utils/handleError";
import Interaction from "#models/Interaction";

// CREATE Property
export const createProperty = async (req, res) => {
  try {
    const { error, value } = validateProperty(req.body);
    if (error)
      return res.status(422).json({
        success: false,
        message: "Validation failed",
        details: error.details.map((d) => d.message),
      });

    const property = new Property({
      ...value,
      owner: value.owner || req.user?._id,
    });

    const savedProperty = await property.save();

    res.status(201).json({
      success: true,
      message: "Property created successfully",
      data: savedProperty,
    });
  } catch (error) {
    handleError(res, error, 500);
  }
};

export const getProperties = async (req, res) => {
  try {
    const {
      city,
      state,
      listingType,
      propertyType,
      minPrice,
      maxPrice,
      bedrooms,
      verified,
      q,
      page = 1,
      limit = 10,
    } = req.query;

    const filters = { isDeleted: false };

    if (city) filters["address.city"] = new RegExp(city, "i");
    if (state) filters["address.state"] = new RegExp(state, "i");
    if (listingType) filters.listingType = listingType;
    if (propertyType) filters.propertyType = propertyType;
    if (bedrooms) filters.bedrooms = { $gte: Number(bedrooms) };
    if (verified) filters.isVerified = verified === "true";
    if (minPrice || maxPrice)
      filters["price.amount"] = {
        ...(minPrice ? { $gte: Number(minPrice) } : {}),
        ...(maxPrice ? { $lte: Number(maxPrice) } : {}),
      };
    if (q)
      filters.$or = [
        { title: new RegExp(q, "i") },
        { description: new RegExp(q, "i") },
        { "address.area": new RegExp(q, "i") },
        { "address.city": new RegExp(q, "i") },
      ];

    const skip = (page - 1) * limit;

    const [properties, total] = await Promise.all([
      Property.find(filters)
        .populate("owner", "fullName email phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Property.countDocuments(filters),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: properties,
    });
  } catch (error) {
    handleError(res, error, 500);
  }
};

// GET SINGLE Property by slug or ID
export const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await Property.findOne({
      $or: [{ _id: id }, { slug: id }],
      isDeleted: false,
    }).populate("owner", "fullName email phone");

    if (!property)
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });

    await property.incrementViews();

    res.status(200).json({ success: true, data: property });
  } catch (error) {
    handleError(res, error, 500);
  }
};

// UPDATE Property
export const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const property = await Property.findById(id);
    if (!property || property.isDeleted)
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });

    Object.assign(property, updates);
    await property.save();

    res.status(200).json({
      success: true,
      message: "Property updated successfully",
      data: property,
    });
  } catch (error) {
    handleError(res, error, 500);
  }
};

// SOFT DELETE Property
export const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await Property.findById(id);
    if (!property)
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });

    await property.softDelete();

    res.status(200).json({
      success: true,
      message: "Property deleted successfully",
    });
  } catch (error) {
    handleError(res, error, 500);
  }
};

// RESTORE Property
export const restoreProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await Property.findById(id);

    if (!property)
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });

    await property.restore();

    res.status(200).json({
      success: true,
      message: "Property restored successfully",
      data: property,
    });
  } catch (error) {
    handleError(res, error, 500);
  }
};

// VERIFY Property
export const verifyProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, reason } = req.body;

    const property = await Property.findById(id);
    if (!property)
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });

    if (approved) {
      property.isVerified = true;
      property.approvalStatus = "Approved";
      property.verifiedAt = new Date();
    } else {
      property.isVerified = false;
      property.approvalStatus = "Rejected";
      property.rejectionReason = reason || "No reason provided";
    }

    await property.save();

    res.status(200).json({
      success: true,
      message: approved
        ? "Property verified successfully"
        : "Property rejected successfully",
      data: property,
    });
  } catch (error) {
    handleError(res, error, 500);
  }
};

// =======================
// 📊 ANALYTICS CONTROLLERS
// =======================

// 1️⃣ Get top viewed properties
export const getTopViewedProperties = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const properties = await Property.find({ isDeleted: false })
      .sort({ views: -1 })
      .limit(Number(limit))
      .select("title slug views price listingType propertyType address images");

    res.status(200).json({
      success: true,
      message: "Top viewed properties fetched successfully",
      data: properties,
    });
  } catch (error) {
    handleError(res, error, 500);
  }
};

// 2️⃣ Get analytics summary
export const getPropertyStats = async (req, res) => {
  try {
    const total = await Property.countDocuments({ isDeleted: false });
    const [forSale, forRent, shortLet, verified] = await Promise.all([
      Property.countDocuments({ listingType: "For Sale", isDeleted: false }),
      Property.countDocuments({ listingType: "For Rent", isDeleted: false }),
      Property.countDocuments({ listingType: "Short Let", isDeleted: false }),
      Property.countDocuments({ isVerified: true, isDeleted: false }),
    ]);

    res.status(200).json({
      success: true,
      message: "Property stats summary",
      data: {
        total,
        verified,
        byListingType: { forSale, forRent, shortLet },
      },
    });
  } catch (error) {
    handleError(res, error, 500);
  }
};

// 3️⃣ Average prices by propertyType
export const getAveragePriceByType = async (req, res) => {
  try {
    const result = await Property.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: "$propertyType",
          avgPrice: { $avg: "$price.amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { avgPrice: -1 } },
    ]);

    res.status(200).json({
      success: true,
      message: "Average prices by property type",
      data: result.map((r) => ({
        propertyType: r._id,
        averagePrice: Math.round(r.avgPrice),
        count: r.count,
      })),
    });
  } catch (error) {
    handleError(res, error, 500);
  }
};

// 4️⃣ Listings by state
export const getListingsByState = async (req, res) => {
  try {
    const result = await Property.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: "$address.state",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      success: true,
      message: "Listings by state fetched successfully",
      data: result.map((r) => ({
        state: r._id || "Unknown",
        count: r.count,
      })),
    });
  } catch (error) {
    handleError(res, error, 500);
  }
};

// 5️⃣ Recently added or trending
export const getRecentProperties = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const properties = await Property.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .select(
        "title slug price listingType propertyType address images createdAt"
      );

    res.status(200).json({
      success: true,
      message: "Recent properties fetched successfully",
      data: properties,
    });
  } catch (error) {
    handleError(res, error, 500);
  }
};

export const getTrendingProperties = async (req, res) => {
  try {
    const trending = await Property.aggregate([
      {
        $project: {
          title: 1,
          price: 1,
          location: 1,
          propertyType: 1,
          score: {
            $add: [
              { $multiply: ["$views", 0.5] },
              { $multiply: ["$saves", 1] },
              { $multiply: ["$shares", 1.5] },
            ],
          },
        },
      },
      { $sort: { score: -1 } },
      { $limit: 10 },
    ]);

    res.json({ success: true, data: trending });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🤝 Recommended For You
export const getRecommendedProperties = async (req, res) => {
  try {
    const { userId } = req.params;

    const recentViews = await Interaction.find({ userId, action: "view" })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    const propertyIds = recentViews.map((v) => v.propertyId);
    const properties = await Property.find({ _id: { $in: propertyIds } });
    const tags = properties.flatMap((p) => p.tags || []);

    const recommendations = await Property.find({
      tags: { $in: tags },
      _id: { $nin: propertyIds },
    })
      .limit(10)
      .lean();

    res.json({ success: true, data: recommendations });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔎 Top Searches
export const getTopSearches = async (req, res) => {
  try {
    const top = await Interaction.aggregate([
      { $match: { action: "search" } },
      { $group: { _id: "$searchQuery", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);
    res.json(top);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🏡 Related Properties
export const getRelatedProperties = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const property = await Property.findById(propertyId);

    if (!property)
      return res.status(404).json({ message: "Property not found" });

    const related = await Property.find({
      location: property.location,
      propertyType: property.propertyType,
      price: { $gte: property.price * 0.9, $lte: property.price * 1.1 },
      _id: { $ne: property._id },
    }).limit(6);

    res.json({ success: true, data: related });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const interact = async (req, res) => {
  const { userId, propertyId, action, searchQuery } = req.body;

  try {
    const newInteraction = new Interaction({
      userId,
      propertyId,
      action,
      searchQuery,
    });
    await newInteraction.save();

    if (["view", "save", "share"].includes(action) && propertyId) {
      const field = `${action}s`;
      await Property.findByIdAndUpdate(propertyId, { $inc: { [field]: 1 } });
    }

    res.json({ message: "Interaction logged" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
