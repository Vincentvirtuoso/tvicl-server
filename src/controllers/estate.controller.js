import Estate from "#models/Estate";

export const updateEstateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { estateName, address, contactEmail, phone, description, logo } =
      req.body;

    // Find estate profile linked to user
    const estateProfile = await Estate.findOne({ user: userId });
    if (!estateProfile) {
      return res.status(404).json({ message: "Estate profile not found" });
    }

    // Update fields if provided
    if (estateName) estateProfile.estateName = estateName;
    if (address) estateProfile.address = address;
    if (contactEmail) estateProfile.contactEmail = contactEmail;
    if (phone) estateProfile.phone = phone;
    if (description) estateProfile.description = description;
    if (logo !== undefined) estateProfile.logo = logo;

    await estateProfile.save();

    res.json({
      message: "Estate profile updated successfully",
      estateProfile,
    });
  } catch (err) {
    console.error("Update estate profile error:", err);
    res
      .status(500)
      .json({ message: "Server error during estate profile update" });
  }
};

export const getEstateProfile = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    const estate = await Estate.findOne({ user: userId })
      .populate("propertiesManaged", "title price location status")
      .populate("user", "name email")
      .lean();

    if (!estate) {
      return res.status(404).json({ message: "Estate profile not found" });
    }

    res.status(200).json({
      success: true,
      message: "Estate profile fetched successfully",
      estate,
    });
  } catch (err) {
    console.error("Error fetching estate:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch estate profile",
      error: err.message,
    });
  }
};
