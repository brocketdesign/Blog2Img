const express = require('express');
const router = express.Router();

// Import necessary modules/services
const articleService = require('./services/articleService');
const imageService = require('./services/imageService');
const localImageService = require('./services/localImageService');
const summaryService = require('./services/summaryService');
const catchphraseService = require('./services/catchphraseService');

// Route to get images with catchphrases and summaries
router.post('/generateImages', async (req, res) => {
    try {
        const articleUrl = req.body.url;

        // Extract and preprocess article content
        const articleContent = await articleService.extractContent(articleUrl);
        if (!articleContent) {
            return res.status(400).send('Failed to extract article content');
        }

        // Generate a summarized version of the article
        const summarizedArticle = await summaryService.generateSummary(articleContent);
        if (!summarizedArticle) {
            return res.status(400).send('Failed to generate article summary');
        }

        // Generate image prompts based on the summarized article
        /*
        const imagePrompts = await catchphraseService.generatePrompts(summarizedArticle);
        if (!imagePrompts || imagePrompts.length === 0) {
            return res.status(400).send('Failed to generate image prompts');
        }
        */

        // Generate images using the prompts
        const images = await localImageService.generateImages(summarizedArticle);
        if (!images || images.length === 0) {
            return res.status(400).send('Failed to generate images');
        }

        // Combine images with their catchphrases and summaries
        const responsePayload = images.map((image, index) => {
            return {
                image: image,
                //catchphrase: imagePrompts[index],
                summary: summarizedArticle
            };
        });

        // Send the combined response
        res.status(200).json(responsePayload);
    } catch (error) {
        console.error('Error generating images:', error);
        res.status(500).send('Error generating images');
    }
});


module.exports = router;