const express = require('express');
const fetch = require('node-fetch');
const redis = require('redis');

const REDIS_PORT = 6379;

const client = redis.createClient(REDIS_PORT);

const app = express();

function setResponse(username, repos) {
    return `${username}: ${repos}`;
}

async function getRepos(req, res) {
    try {
        console.log('fetching data');
        const { username } = req.params;
        const response = await fetch(`https://api.github.com/users/${username}`);
        const data = await response.json();

        const repos = data.public_repos;

        client.setex(username, 3600, repos);
        res.send(setResponse(username, repos));
    } catch (error) {
        console.log(error);

    }
}

//Cache middleware
function cache(req, res, next) {
    const { username } = req.params;
    client.get(username, (error, data) => {
        if (error) throw error;

        if (data !== null) {
            res.send(setResponse(username, data));
        } else {
            next();
        }
    });
}

app.get('/repos/:username', cache, getRepos);

app.listen(3000, () => {
    console.log('App listening on port 3000!');
});