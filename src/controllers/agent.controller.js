import Agent from "#models/Agent";

export const updateAgentProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      licenseNumber,
      agencyName,
      yearsOfExperience,
      specializations,
      phone,
      address,
      profilePhoto,
    } = req.body;

    // Find agent profile linked to user
    const agentProfile = await Agent.findOne({ user: userId });
    if (!agentProfile) {
      return res.status(404).json({ message: "Agent profile not found" });
    }

    // Update fields if provided
    if (licenseNumber) agentProfile.licenseNumber = licenseNumber;
    if (agencyName) agentProfile.agencyName = agencyName;
    if (yearsOfExperience !== undefined)
      agentProfile.yearsOfExperience = yearsOfExperience;
    if (specializations) agentProfile.specializations = specializations;
    if (phone) agentProfile.phone = phone;
    if (address) agentProfile.address = address;
    if (profilePhoto !== undefined) agentProfile.profilePhoto = profilePhoto;

    await agentProfile.save();

    res.json({
      message: "Agent profile updated successfully",
      agentProfile,
    });
  } catch (err) {
    console.error("Update agent profile error:", err);
    res
      .status(500)
      .json({ message: "Server error during agent profile update" });
  }
};

export const getAgent = async (req, res) => {
  try {
    const { id } = req.user._id;

    let agent = await Agent.findById(id)
      .populate("user", "name email")
      .populate("propertiesListed");

    if (!agent) {
      agent = await Agent.findOne({ user: id })
        .populate("user", "name email")
        .populate("propertiesListed");
    }

    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    res.status(200).json(agent);
  } catch (error) {
    console.error("Error fetching agent:", error);
    res.status(500).json({ message: "Server error" });
  }
};
