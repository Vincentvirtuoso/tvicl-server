// utils/validateProperty.js
import Joi from "joi";

export const validateProperty = (data) => {
  const schema = Joi.object({
    // Basic info
    title: Joi.string().max(250).required(),
    description: Joi.string().max(5000).required(),
    propertyType: Joi.string()
      .valid(
        "Self Contained",
        "Mini Flat",
        "Flat/Apartment",
        "Bungalow",
        "Detached Duplex",
        "Semi-Detached Duplex",
        "Terraced Duplex",
        "Mansion",
        "Block of Flats",
        "Commercial",
        "Plot",
        "Office",
        "Warehouse",
        "Serviced Apartment"
      )
      .required(),
    flatType: Joi.string().valid(
      "Studio",
      "1 Bedroom",
      "2 Bedroom",
      "3 Bedroom",
      "4 Bedroom",
      "5+ Bedroom"
    ),
    listingType: Joi.string()
      .valid("For Sale", "For Rent", "Short Let")
      .required(),
    furnishingStatus: Joi.string()
      .valid("Unfurnished", "Semi-Furnished", "Fully Furnished")
      .required(),
    propertyCondition: Joi.string()
      .valid("New", "Excellent", "Good", "Needs Renovation")
      .required(),
    possessionStatus: Joi.string()
      .valid("Ready to Move", "Under Construction")
      .required(),
    availableFrom: Joi.date().required(),
    transactionType: Joi.string().valid(
      "Off Plan",
      "Outright",
      "Installments",
      "Mortgage",
      "Rent to Own"
    ),

    propertyId: Joi.string().required(),
    // Owner & contact
    owner: Joi.string().required(),
    contactPerson: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().required(),
          phone: Joi.string().required(),
          email: Joi.string().email().required(),
          role: Joi.string()
            .valid("Owner", "Agent", "Builder", "Realtor")
            .required(),
        })
      )
      .min(1)
      .required(),

    // Address & location
    address: Joi.object({
      street: Joi.string().allow(""),
      area: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      lga: Joi.string().allow(""),
      postalCode: Joi.string().allow(""),
      country: Joi.string().default("Nigeria"),
      landmark: Joi.string().allow(""),
    }).required(),
    location: Joi.object({
      type: Joi.string().valid("Point"),
      coordinates: Joi.array().items(Joi.number()).length(2),
    }).optional(),

    // Rooms & layout
    bedrooms: Joi.number().min(0).default(0),
    bathrooms: Joi.number().min(0).default(0),
    kitchens: Joi.number().min(0).default(1),
    balconies: Joi.number().min(0).default(0),
    floor: Joi.number().optional(),
    totalFloors: Joi.number().optional(),

    // Sizes
    floorSize: Joi.object({
      value: Joi.number().min(0),
      unit: Joi.string().valid("sqft", "sqm", "sqyd").default("sqft"),
    }).optional(),
    carpetArea: Joi.object({
      value: Joi.number().min(0),
      unit: Joi.string().valid("sqft", "sqm", "sqyd").default("sqft"),
    }).optional(),

    // Price
    price: Joi.object({
      amount: Joi.number().min(0).required(),
      currency: Joi.string().default("NGN"),
      negotiable: Joi.boolean().default(false),
    }).required(),

    // Payment plan
    paymentPlans: Joi.array()
      .items(
        Joi.object({
          name: Joi.string(),
          type: Joi.string()
            .valid("Deposit", "Milestone", "Monthly", "Balloon")
            .default("Milestone"),
          amount: Joi.number().min(0),
          currency: Joi.string().default("NGN"),
          dueInMonths: Joi.number(),
        })
      )
      .optional(),

    // Rental details
    rentalDetails: Joi.object({
      depositAmount: Joi.number().min(0).optional(),
      rentFrequency: Joi.string()
        .valid("Monthly", "Quarterly", "Yearly")
        .default("Monthly"),
      leaseDurationMonths: Joi.number().optional(),
      lockInPeriodMonths: Joi.number().optional(),
      petsAllowed: Joi.boolean().default(false),
      preferredTenants: Joi.string()
        .valid("Anyone", "Family", "Bachelor", "Company")
        .optional(),
      serviceCharge: Joi.object({
        amount: Joi.number().min(0).optional(),
        frequency: Joi.string()
          .valid("Monthly", "Quarterly", "Yearly")
          .optional(),
      }).optional(),
      agencyFeePercent: Joi.number().min(0).max(100).optional(),
      cautionFee: Joi.number().min(0).optional(),
    }).optional(),

    // Amenities & utilities
    amenities: Joi.array().items(Joi.string()).default([]),
    utilities: Joi.object({
      waterSupply: Joi.string()
        .valid(
          "Borehole",
          "Water Corporation",
          "Bottled/Delivered",
          "Municipal",
          "Both"
        )
        .default("Municipal"),
      powerBackup: Joi.string()
        .valid("Generator", "Inverter", "Full", "Partial", "None")
        .default("None"),
      gas: Joi.string().valid("Cylinder", "Piped Gas", "None").optional(),
    }).optional(),

    // Orientation & media
    facing: Joi.string()
      .valid(
        "North",
        "South",
        "East",
        "West",
        "North-East",
        "North-West",
        "South-East",
        "South-West"
      )
      .optional(),
    media: Joi.array()
      .items(
        Joi.object({
          url: Joi.string().uri().required(),
          type: Joi.string().valid("image", "video", "document").required(),
          category: Joi.string().required(),
          subCategory: Joi.string().valid(
            "cover",
            "gallery",
            "floorPlan",
            "virtualTour",
            "video",
            "legal",
            "other"
          ),
          // .required(),
          caption: Joi.string().allow(""),
          isPrimary: Joi.boolean().default(false),
          uploadedAt: Joi.date().optional(),
        })
      )
      .min(1)
      .required(),

    // Optional fields
    floorPlan: Joi.object({ url: Joi.string().uri() }).optional(),
    nearbyPlaces: Joi.object().optional(),
    highlights: Joi.array().items(Joi.string()).optional(),
    additionalRooms: Joi.array()
      .items(
        Joi.string().valid(
          "Servant Room",
          "Study Room",
          "Pooja Room",
          "Store Room",
          "Home Theater",
          "Terrace"
        )
      )
      .optional(),
    legalDocuments: Joi.object().optional(),
    yearBuilt: Joi.number()
      .min(1900)
      .max(new Date().getFullYear() + 5)
      .optional(),
  }).options({ abortEarly: false });

  return schema.validate(data);
};
