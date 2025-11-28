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

app.get('/update-cobj', (req, res) => {
    res.render('updates');
});

app.post('/update-cobj', async (req, res) => {
    const { fname, lname, email } = req.body;
    console.log(fname, lname, email)
    try {
        const response = await axios.post(
            "https://api.hubapi.com/crm/v3/objects/contacts/search",

            { "filterGroups": [{ "filters": [{ "operator": "EQ", "propertyName": "email", "value": email }] }] },
            {
                headers: {
                    Authorization: `Bearer ${process.env.PRIVATE_APP_ACCESS}`,
                    'Content-Type': 'application/json'
                }
            },

        );
        if (response.data.results.length > 0) {
            console.log('user exist')
        } else {
            let res = await axios.post(
                'https://api.hubspot.com/crm/v3/objects/contacts',
                { properties: { firstname: fname, lastname: lname, email } },
                {
                    headers: {
                        Authorization: `Bearer ${process.env.PRIVATE_APP_ACCESS}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

        }
        res.redirect('/');
    } catch (err) {
        console.error('HubSpot error:', err);
        res.status(500).send('Error creating new contact');
    }
});
// * Localhost
app.listen(3000, () => console.log('Listening on http://localhost:3000'));