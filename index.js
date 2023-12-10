import express from 'express';
import queryString from 'query-string';
import {} from 'dotenv/config';

function generateRandomString(length) {
    let result = '';

    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let c = 0; c < length; c++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length))
    }

    return result;
}

const client_id = process.env.client_id;
const client_secret = process.env.client_secret;
const redirect_uri = 'http://localhost:3000/callback';

const app = express();
const port = 3000;

let accessToken = null;
let loginStateCache = null;

// homepage
app.get('/', (req, res) => {
    res.send('hello world');
})

// error page
app.get('/error', (req, res) => {
    res.send('error lol');
})

// visible success page
app.get('/success', (req, res) => {
    res.send('success');
})

// request auth
app.get('/login', function(req, res) {
    let state = generateRandomString(16);
    loginStateCache = state;
    let scope = 'user-read-currently-playing';
  
    res.redirect('https://accounts.spotify.com/authorize?' +
        queryString.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state
        }));
});

// trade auth for token
app.get('/callback', (req, res) => {
    let code = req.query.code || null;
    let state = req.query.state || null;

    if (state === null) {
        res.redirect('/error');
    }

    if (state !== loginStateCache) {
        res.redirect('/error');
        return;
    }

    fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64'))
        },
        body: new URLSearchParams({
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': redirect_uri
        })
    }).then(response => {
        return response.json();
    }).then(data => {
        accessToken = data['access_token'];
        res.redirect('/success');
    }).catch(err => {
        console.error(err);
    })
})

// print out the current song to the webpage every time it is requested using the token
app.get('/currentsong', (req, res) => {
    if (accessToken === null) {
        res.redirect('/error');
        return;
    }

    fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        }
        
    }).then(response => {
        return response.json();
    }).then(response => {
        res.send(response.item.name);
    })
})

// listener 
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})