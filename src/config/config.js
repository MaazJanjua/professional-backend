// import dotenv from "dotenv"
// dotenv.config()

if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not defined in enviroment veriable/.env 😕😔")
}
if (!process.env.PORT) {
    throw new Error("PORT is not defined in enviroment veriable/.env 😕😔")
}

const config = { 
    MONGO_URI: process.env.MONGO_URI,
    PORT: process.env.PORT,
    
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
    ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
    REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY,

    
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET
}
export default config; 