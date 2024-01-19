// localImageService.js
require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const { StableDiffusionApi } = require("a1111-webui-api");
const fs = require('fs');

const mongoClient = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Create an instance of the StableDiffusionApi
const sd_api = new StableDiffusionApi({
    host: process.env.SD_HOST,
    port: process.env.SD_PORT, 
    protocol: "http",
    defaultSampler: "DPM++ 2M Karras",
    defaultStepCount: 50,
    safety_checker: true,
    enhance_prompt: true,
});

const imageService = {
    generateImages: async function(prompts) {
        try {
            return Promise.all(prompts.map(async (prompt) => {
                const image = await this.generateImageFromPrompt(prompt);
                await this.storeImageInDatabase(image, prompt);
                return image;
            }));
        } catch (error) {
            console.error('Error in generateImages:', error);
            throw error;
        }
    },

    generateImageFromPrompt: async function(prompt) {
        try {
            await mongoClient.connect();
            const db = mongoClient.db(process.env.MONGODB_DATABASE);
            const imagesCollection = db.collection('images');

            const existingImage = await imagesCollection.findOne({ prompt: prompt });
            if (existingImage) {
                //return existingImage.image;
            }

            const response = await this.sendStableDiffusionRequest(prompt);
            return this.parseStableDiffusionResponse(response);
        } catch (error) {
            console.error('Error in generateImageFromPrompt:', error);
            throw error;
        }
    },

    sendStableDiffusionRequest: async function(prompt) {
        const default_prompt = ',monochrome, manga'
        const default_negative_prompt = 'worst quality, low quality, medium quality, deleted, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, jpeg artifacts, signature, watermark, username, blurry'

        try {
            const payload = {
                prompt: prompt+default_prompt,
                negative_prompt: default_negative_prompt,
                width: 512, // Define width as needed
                height: 512 // Define height as needed
            };
            console.log({payload})
            const result = await sd_api.txt2img(payload);
            return result;
        } catch (error) {
            console.error('Error in sendStableDiffusionRequest:', error);
            throw error;
        }
    },

    storeImageInDatabase: async function(image, prompt) {
        try {
            // Connect to MongoDB
            await mongoClient.connect();
            const db = mongoClient.db(process.env.MONGODB_DATABASE); // Replace with your database name
            const imagesCollection = db.collection('images'); // Replace with your collection name

            // Create an object to store in the database
            const imageRecord = {
                prompt: prompt,
                image: image,
                createdAt: new Date() // Storing the creation date for reference
            };

            // Insert the record into the database
            await imagesCollection.insertOne(imageRecord);
        } catch (error) {
            console.error('Error in storeImageInDatabase:', error);
            throw error;
        } finally {
            // Close the MongoDB connection
            await mongoClient.close();
        }
    },

    parseStableDiffusionResponse: async function(response) {
        try {
            if (response && response.image) {
                const base64Image = await convertImageToBase64(response.image);
                return base64Image;
            } else {
                throw new Error('Invalid response structure from Stable Diffusion');
            }
        } catch (error) {
            console.error('Error in parseStableDiffusionResponse:', error);
            throw error;
        }
    }
};

async function convertImageToBase64(imageSharp) {
    try {
        const buffer = await imageSharp.toBuffer();
        return `data:image/png;base64,${buffer.toString('base64')}`;
    } catch (error) {
        console.error('Error converting image to base64:', error);
        throw error;
    }
}


module.exports = imageService;
