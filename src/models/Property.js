import mongoose from "mongoose";

const { Schema } = mongoose;

const propertySchema = new Schema(
  {
    // Unique identifiers
    propertyId: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true, index: true },

    // Basic Info
    title: { type: String, required: true, trim: true, maxlength: 250 },
    description: { type: String, required: true, maxlength: 5000 },

    // Address (Nigeria-friendly)
    address: {
      street: { type: String, trim: true },
      area: { type: String, required: true, trim: true }, // e.g. Ikeja, Lekki Phase 1
      city: { type: String, required: true, trim: true }, // e.g. Lagos
      state: { type: String, required: true, trim: true }, // Nigerian state
      lga: { type: String, trim: true }, // Local Government Area
      postalCode: { type: String, trim: true },
      country: { type: String, default: "Nigeria", trim: true },
      landmark: { type: String, trim: true },
    },

    // Geo location for map/search
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: "2dsphere",
      },
    },

    // Property classification (Nigeria-centric)
    propertyType: {
      type: String,
      required: true,
      enum: [
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
        "Serviced Apartment",
      ],
    },
    flatType: {
      type: String,
      enum: [
        "Studio",
        "1 Bedroom",
        "2 Bedroom",
        "3 Bedroom",
        "4 Bedroom",
        "5+ Bedroom",
      ],
      required: function () {
        return [
          "Flat/Apartment",
          "Serviced Apartment",
          "Block of Flats",
        ].includes(this.propertyType);
      },
    },

    // Rooms & layout
    bedrooms: { type: Number, min: 0, default: 0 },
    bathrooms: { type: Number, min: 0, default: 0 },
    kitchens: { type: Number, min: 0, default: 1 },
    balconies: { type: Number, min: 0, default: 0 },

    // Floor details (where applicable)
    floor: { type: Number },
    totalFloors: { type: Number },

    // Sizes
    floorSize: {
      value: { type: Number, min: 0 },
      unit: { type: String, enum: ["sqft", "sqm", "sqyd"], default: "sqft" },
    },
    carpetArea: {
      value: { type: Number, min: 0 },
      unit: { type: String, enum: ["sqft", "sqm", "sqyd"], default: "sqft" },
    },

    // Pricing & payment
    price: {
      amount: { type: Number, required: true, min: 0 },
      currency: { type: String, default: "NGN" },
      negotiable: { type: Boolean, default: false },
    },
    listingType: {
      type: String,
      required: true,
      enum: ["For Sale", "For Rent", "Short Let"],
    },
    transactionType: {
      type: String,
      enum: ["Off Plan", "Outright", "Installments", "Mortgage", "Rent to Own"],
      required: function () {
        return this.listingType === "For Sale";
      },
    },

    // Payment plan (detailed installments/milestones)
    paymentPlans: [
      {
        name: { type: String },
        type: {
          type: String,
          enum: ["Deposit", "Milestone", "Monthly", "Balloon"],
          default: "Milestone",
        },
        amount: { type: Number, min: 0 },
        currency: { type: String, default: "NGN" },
        dueInMonths: { type: Number },
      },
    ],

    // Rental-specific fields
    rentalDetails: {
      depositAmount: { type: Number, min: 0 },
      rentFrequency: {
        type: String,
        enum: ["Monthly", "Quarterly", "Yearly"],
        default: "Monthly",
      },
      leaseDurationMonths: { type: Number },
      lockInPeriodMonths: { type: Number },
      petsAllowed: { type: Boolean, default: false },
      preferredTenants: {
        type: String,
        enum: ["Anyone", "Family", "Bachelor", "Company"],
      },
      serviceCharge: {
        amount: { type: Number, min: 0 },
        frequency: { type: String, enum: ["Monthly", "Quarterly", "Yearly"] },
      },
      agencyFeePercent: { type: Number, min: 0, max: 100 },
      cautionFee: { type: Number, min: 0 },
    },

    // Furnishing & condition
    furnishingStatus: {
      type: String,
      enum: ["Unfurnished", "Semi-Furnished", "Fully Furnished"],
      required: true,
    },
    propertyCondition: {
      type: String,
      enum: ["New", "Excellent", "Good", "Needs Renovation"],
      required: true,
    },
    possessionStatus: {
      type: String,
      enum: ["Ready to Move", "Under Construction"],
      required: true,
    },
    availableFrom: { type: Date, required: true, default: Date.now },
    yearBuilt: { type: Number, min: 1900, max: new Date().getFullYear() + 5 },

    // Parking
    parking: {
      covered: { type: Number, default: 0 },
      open: { type: Number, default: 0 },
    },

    // Amenities (Nigeria-appropriate list)
    amenities: [
      {
        type: String,
        enum: [
          "Swimming Pool",
          "Gym",
          "Garden",
          "Kids Play Area",
          "Clubhouse",
          "Security",
          "CCTV",
          "Gated Community",
          "Lift",
          "Generator",
          "Inverter",
          "Borehole",
          "Piped Water",
          "Water Treatment",
          "Fire Safety",
          "Intercom",
          "Visitor Parking",
          "Street Lights",
          "Fence",
          "Gatehouse",
          "Commercial Mall Nearby",
          "School Nearby",
        ],
      },
    ],

    // Utilities
    utilities: {
      waterSupply: {
        type: String,
        enum: [
          "Borehole",
          "Water Corporation",
          "Bottled/Delivered",
          "Municipal",
          "Both",
        ],
        default: "Municipal",
      },
      powerBackup: {
        type: String,
        enum: ["Generator", "Inverter", "Full", "Partial", "None"],
        default: "None",
      },
      gas: { type: String, enum: ["Cylinder", "Piped Gas", "None"] },
    },

    // Orientation
    facing: {
      type: String,
      enum: [
        "North",
        "South",
        "East",
        "West",
        "North-East",
        "North-West",
        "South-East",
        "South-West",
      ],
    },

    // Media
    media: [
      {
        url: { type: String, required: true },
        type: {
          type: String,
          enum: ["image", "video", "document"],
          required: true,
        },
        category: {
          type: String,
          required: true,
        },
        subCategory: {
          type: String,
          enum: [
            "cover",
            "gallery",
            "floorPlan",
            "virtualTour",
            "video",
            "legal",
            "other",
          ],
          required: true,
        },
        caption: { type: String, trim: true },
        isPrimary: { type: Boolean, default: false },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    floorPlan: { url: { type: String } },

    // Nearby places
    nearbyPlaces: {
      schools: [{ name: String, distance: String }],
      hospitals: [{ name: String, distance: String }],
      transport: [{ name: String, distance: String, type: String }],
      shoppingCenters: [{ name: String, distance: String }],
      parks: [{ name: String, distance: String }],
    },

    // Owner & contact
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    contactPerson: [
      {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        email: { type: String, required: true },
        role: {
          type: String,
          enum: ["Owner", "Agent", "Builder", "Realtor"],
          required: true,
        },
      },
    ],

    // Verification & legal documents (Nigeria)
    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
    approvalStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    rejectionReason: { type: String },

    legalDocuments: {
      cOfO: {
        present: { type: Boolean, default: false },
        url: { type: String },
        verifiedAt: { type: Date },
      },
      governorsConsent: {
        present: { type: Boolean, default: false },
        url: { type: String },
        verifiedAt: { type: Date },
      },
      surveyPlan: {
        present: { type: Boolean, default: false },
        url: { type: String },
        verifiedAt: { type: Date },
      },
      deedOfAssignment: {
        present: { type: Boolean, default: false },
        url: { type: String },
        verifiedAt: { type: Date },
      },
      excision: {
        present: { type: Boolean, default: false },
        url: { type: String },
        verifiedAt: { type: Date },
      },
    },

    // Extras
    highlights: [String],
    additionalRooms: [
      {
        type: String,
        enum: [
          "Servant Room",
          "Study Room",
          "Pooja Room",
          "Store Room",
          "Home Theater",
          "Terrace",
        ],
      },
    ],

    // Analytics
    views: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    inquiries: { type: Number, default: 0 },

    // Soft delete
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },

    // Legal registry (simple reference)
    registryReference: { type: String },
  },
  {
    timestamps: true,
  }
);

// Indexes
propertySchema.index({ propertyId: 1 });
propertySchema.index({ "address.city": 1, "address.area": 1 });
propertySchema.index({ propertyType: 1, listingType: 1 });
propertySchema.index({ "price.amount": 1 });
propertySchema.index({ status: 1, approvalStatus: 1 });
propertySchema.index({ createdAt: -1 });

// Virtual fullAddress
propertySchema.virtual("fullAddress").get(function () {
  const addr = this.address || {};
  return [addr.street, addr.area, addr.city, addr.state, addr.postalCode]
    .filter(Boolean)
    .join(", ");
});

// Methods
propertySchema.methods.incrementViews = function () {
  this.views = (this.views || 0) + 1;
  return this.save();
};
propertySchema.methods.incrementInquiries = function () {
  this.inquiries = (this.inquiries || 0) + 1;
  return this.save();
};

// Helpers
function generateSlug(text) {
  return text
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036F]/g, "") // remove accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// Pre-save: auto-generate propertyId, slug, ensure primary image, set defaults
propertySchema.pre("save", function (next) {
  try {
    if (!this.propertyId) {
      this.propertyId = `NGPROP${Date.now()}${Math.floor(
        Math.random() * 1000
      )}`;
    }

    // Slug from title + area + city
    if (!this.slug && this.title) {
      const parts = [
        this.title,
        this.address && this.address.area,
        this.address && this.address.city,
      ]
        .filter(Boolean)
        .join(" ");
      this.slug =
        generateSlug(parts) + `-${Math.floor(Math.random() * 9000) + 1000}`;
    }

    // Ensure at least one primary image
    if (this.images && this.images.length > 0) {
      const hasPrimary = this.images.some((i) => i.isPrimary);
      if (!hasPrimary) this.images[0].isPrimary = true;
    }

    // Default country
    if (!this.address) this.address = { country: "Nigeria" };
    if (!this.address.country) this.address.country = "Nigeria";

    next();
  } catch (err) {
    next(err);
  }
});

// Soft delete helper
propertySchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Restore from soft delete
propertySchema.methods.restore = function () {
  this.isDeleted = false;
  this.deletedAt = null;
  return this.save();
};

propertySchema.post("save", async function (doc, next) {
  try {
    console.log(`[AUDIT] Property ${doc._id} saved or updated by ${doc.owner}`);
    // Example: send to external audit service, or auto-sync analytics
    // await AuditLog.create({ propertyId: doc._id, action: 'SAVE', user: doc.owner });
    next();
  } catch (err) {
    console.error("Post-save hook error:", err);
    next(err);
  }
});

propertySchema.add({
  lastModifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
  lastModifiedAt: { type: Date },
});

propertySchema.pre("save", function (next) {
  if (this.isModified()) {
    this.lastModifiedAt = new Date();
    if (this.owner) this.lastModifiedBy = this.owner;
  }
  next();
});

const Property = mongoose.model("Property", propertySchema);

export default Property;
