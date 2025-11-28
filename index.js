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
    const contacts = 'https://api.hubapi.com/crm/v3/objects/2-53653076?properties=name&properties=type&properties=age&properties=gender&associations=contacts';
    const headers = {
        Authorization: `Bearer ${process.env.PRIVATE_APP_ACCESS}`,
        'Content-Type': 'application/json'
    };

    try {
        const resp = await axios.get(contacts, { headers });
        const customObjects = resp.data.results;
        const enrichedData = await Promise.all(
            customObjects.map(async (ele) => {
                const contactData = [];

                if (ele?.associations?.contacts?.results) {
                    for (const item of ele.associations.contacts.results) {
                        try {
                            const response = await axios.get(
                                `https://api.hubapi.com/crm/v3/objects/contacts/${item.id}`,
                                { headers }
                            );
                            console.log('Contact Response:', response.data);
                            contactData.push(response.data);
                        } catch (error) {
                            console.error(`Error fetching contact ${item.id}:`, error.response?.data || error.message);
                            contactData.push({ id: item.id, error: 'Failed to fetch' });
                        }
                    }
                }

                return {
                    ...ele,
                    associatedContacts: contactData
                };
            })
        );

        console.log('Custom Objects:', enrichedData);
        res.render('homepage', { data: enrichedData });
        
    } catch (error) {
        console.error('Main API error:', error);
        res.status(500).send('Error fetching data');
    }
});

app.get('/update-cobj', (req, res) => {
    res.render('updates');
});

app.post('/update-cobj', async (req, res) => {
    const { fname, lname, email, name, age, gender, petType } = req.body;
    const type = petType;
    let contactId = '';
    //console.log(fname, lname, email)
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
            contactId = response.data.results[0].id;
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

            contactId = res.data.id;
            // console.log('New contact created with ID:', contactId);
        }
        let pets = await axios.post(
            'https://api.hubspot.com/crm/v3/objects/2-53653076',

            { properties: { name, age, gender, type } },
            {
                headers: {
                    Authorization: `Bearer ${process.env.PRIVATE_APP_ACCESS}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        // console.log('pets log', pets.data);
        await axios.put(
            `https://api.hubapi.com/crm/v4/objects/2-53653076/${pets.data.id}/associations/default/contacts/${contactId}`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${process.env.PRIVATE_APP_ACCESS}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        // console.log('New custom object created with ID:', pets.data.id);

        res.redirect('/');
    } catch (err) {
        console.error('HubSpot error:', err);
        res.status(500).send('Error creating new contact');
    }
});
// * Localhost
app.listen(3000, () => console.log('Listening on http://localhost:3000'));