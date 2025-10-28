import cloudinary from "#config/cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";

export const createUpload = (fields, folder = "uploads") => {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      return {
        folder,
        resource_type: "auto", // automatically handle images, pdfs, etc.
        public_id: `${Date.now()}-${file.originalname.split(".")[0]}`,
      };
    },
  });

  const upload = multer({ storage });
  return upload.fields(fields);
};
