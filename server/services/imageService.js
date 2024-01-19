// imageService.js
require('dotenv').config();
const { OpenAI } = require('openai');
const MongoClient = require('mongodb').MongoClient;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const mongoClient = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const imageService = {
    generateImages: async function(prompts) {
        try {
            return Promise.all(prompts.map(async (prompt) => {
                const image = await this.generateImageFromPrompt(prompt);
                // Optionally store the image in the database
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
            // Connect to MongoDB
            await mongoClient.connect();
            const db = mongoClient.db(process.env.MONGODB_DATABASE);
            const imagesCollection = db.collection('images');

            // Check if prompts for this summary already exist
            const existingImage = await imagesCollection.findOne({ prompt: prompt });
            if (existingImage) {
                return existingImage.imageUrl;
            }

            const response = await this.sendDallERequest(prompt);
            return this.parseDallEResponse(response);
        } catch (error) {
            console.error('Error in generateImageFromPrompt:', error);
            throw error;
        }
    },

    sendDallERequest: async function(prompt) {
        try {
            // Construct the DALL-E API request
            const response = await openai.images.generate({
                model: "dall-e-3", // Specify the model to use
                prompt: prompt,    // The prompt for image generation
                size: "1024x1024", // Desired image size
                quality: "standard", // Image quality
                n: 1               // Number of images to generate
            });

            // Return the entire response for further processing
            return response;
        } catch (error) {
            console.error('Error in sendDallERequest:', error);
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

    parseDallEResponse: function(response) {
        try {
            // Check if the response has the expected data structure
            if (response && response.data && response.data.length > 0) {
                // Extract the URL of the first image generated
                const imageUrl = response.data[0].url;

                // Return the image URL
                return imageUrl;
            } else {
                throw new Error('Invalid response structure from DALL-E API');
            }
        } catch (error) {
            console.error('Error in parseDallEResponse:', error);
            throw error;
        }
    }

};

module.exports = imageService;
