// utils/validateProperty.js
import Joi from "joi";

export const validateProperty = (data) => {
  const schema = Joi.object({
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
    owner: Joi.string().required(), // user id (ObjectId)
    contactPerson: Joi.object({
      name: Joi.string().required(),
      phone: Joi.string().required(),
      email: Joi.string().email().required(),
      role: Joi.string()
        .valid("Owner", "Agent", "Builder", "Realtor")
        .required(),
    }).required(),
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
    price: Joi.object({
      amount: Joi.number().min(0).required(),
      currency: Joi.string().default("NGN"),
      negotiable: Joi.boolean().default(false),
    }).required(),
    images: Joi.array()
      .items(
        Joi.object({
          url: Joi.string().uri().required(),
          caption: Joi.string().allow(""),
          isPrimary: Joi.boolean(),
        })
      )
      .min(1)
      .required(),
    amenities: Joi.array().items(Joi.string()).default([]),
    rentalDetails: Joi.object().optional(),
    paymentPlans: Joi.array().optional(),
    nearbyPlaces: Joi.object().optional(),
  });

  return schema.validate(data, { abortEarly: false });
};
