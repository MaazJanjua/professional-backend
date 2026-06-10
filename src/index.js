import './bootstrap/env.js' 

import config from './config/config.js'
import connectDB from './database/index.js'
import app from './app.js'

const serverStart = async () => {
    try {

        await connectDB()
   
        app.listen(config.PORT || 8000, () => {
            console.log(`Server is running on port ${config.PORT} 🚀`);

        })

        console.log("Server is ready 🚀");
    } catch (error) {
        console.log("Startup error:", error);
        process.exit(1);

    }
}
serverStart();