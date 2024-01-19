// articleService.js
require('dotenv').config();
const axios = require('axios'); // For HTTP requests
const cheerio = require('cheerio'); // For web scraping
const MongoClient = require('mongodb').MongoClient;
const mongoClient = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const articleService = {
    /**
     * Extracts the main content from a given article URL.
     * @param {string} url The URL of the article to process.
     * @returns {Promise<string>} A promise that resolves to the main content of the article.
     */
    extractContent: async function(url) {
        try {

            await mongoClient.connect();
            const db = mongoClient.db(process.env.MONGODB_DATABASE);
            const articleCollection = db.collection('articles');

            const existingArticle = await articleCollection.findOne({ url });
            if (existingArticle) {
                return existingArticle.mainContent;
            }

            const articleHtml = await this.fetchArticleHtml(url);
            const mainContent = this.parseMainContent(articleHtml);
            await this.storeArticleInDatabase(mainContent, url);
            return mainContent;
        } catch (error) {
            console.error('Error in extractContent:', error);
            throw error; // Re-throw the error for the caller to handle
        }
    },

    /**
     * Fetches the HTML content of an article from a URL.
     * @param {string} url The URL to fetch.
     * @returns {Promise<string>} A promise that resolves to the HTML content of the article.
     */
    fetchArticleHtml: async function(url) {
        try {
            // Sending a GET request to the URL
            const response = await axios.get(url);
    
            // Returning the HTML content of the page
            return response.data;
        } catch (error) {
            console.error(`Error fetching HTML from ${url}:`, error);
            throw error; // Propagate the error to be handled by the caller
        }
    },

    storeArticleInDatabase: async function(mainContent, url) {
        try {
            // Connect to MongoDB
            await mongoClient.connect();
            const db = mongoClient.db(process.env.MONGODB_DATABASE); // Replace with your database name
            const articleCollection = db.collection('articles'); // Replace with your collection name

            // Create an object to store in the database
            const articleRecord = {
                url,
                mainContent,
                createdAt: new Date() // Storing the creation date for reference
            };

            // Insert the record into the database
            await articleCollection.insertOne(articleRecord);
        } catch (error) {
            console.error('Error in storeImageInDatabase:', error);
            throw error;
        } finally {
            // Close the MongoDB connection
            await mongoClient.close();
        }
    },
    /**
     * Parses the main content from the HTML of an article.
     * @param {string} html The HTML content of the article.
     * @returns {string} The extracted main content of the article.
     */
    parseMainContent: function(html) {
        try {
            const $ = cheerio.load(html); // Load the HTML into cheerio
            let description = $('meta[name="description"]').attr('content');
            return description;
        } catch (error) {
            console.error('Error parsing main content:', error);
            throw error; // Propagate the error to be handled by the caller
        }
    }
};

module.exports = articleService;
