const express = require('express');
const axios = require('axios');
const path = require('path');
require('dotenv').config()
const app = express();
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', async (req, res) => {
    const contacts = 'https://api.hubapi.com/crm/v3/objects/contact?properties=firstname&properties=lastname&properties=email'
    const headers = {
        Authorization: `Bearer ${process.env.PRIVATE_APP_ACCESS}`,
        'Content-Type': 'application/json'
    };

    try {
        const resp = await axios.get(contacts, { headers });
        const customObjects = resp.data.results;
        console.log('Custom Objects:', customObjects);
        res.render('homepage', { data: customObjects });
        
    } catch (error) {
        console.error('Main API error:', error);
        res.status(500).send('Error fetching data');
    }
});

// * Localhost
app.listen(3000, () => console.log('Listening on http://localhost:3000'));