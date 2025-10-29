export const handleError = (res, error, statusCode = 400) => {
  console.error("❌ Error:", error);
  return res.status(statusCode).json({
    success: false,
    message: error.message || "Something went wrong",
  });
};
