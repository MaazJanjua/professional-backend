import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import config from '../config/config.js';

cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY, 
    api_secret: config.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            throw new Error("localFilePath is required for uploading to Cloudinary");
        }
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        fs.unlinkSync(localFilePath); //remove the locally saved file as it has been uploaded successfully

        //if file hass been uploaded successfully
        console.log("File uploaded successfully to Cloudinary", response.url);
        // fs.unlinkSync(localFilePath) 
        // console.log(response);
        return response;

    } catch (error) {

        console.error("Error uploading file to Cloudinary:", error);

        //remove the locally saved file as the upload operation got failed
        // fs.unlinkSync(localFilePath);
        if (localFilePath && fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        throw error;
    } 

}

const deleteFromCloudinary = async (publicId) => {
    return await cloudinary.uploader.destroy(publicId)
}

export {
    uploadOnCloudinary,
    deleteFromCloudinary

}  