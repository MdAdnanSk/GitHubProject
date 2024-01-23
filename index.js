const express = require('express');
const bodyParser = require('body-parser');
const { Octokit, App } = require("octokit");
const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))

const octokit = new Octokit({
    auth:process.env.TOKEN
});

let username="";
let repoPerPage=0;

// Define a route to render the user info
app.get('/', (req, res) => {
    res.render('form');
});

app.post('/', (req, res)=>{
    try {
        username = req.body.username;
        repoPerPage = parseInt(req.body.repoperpage);
    
        res.redirect('/user?page='+encodeURIComponent('1'));

    } catch (error) {
        res.status(404).send('User not found');
    }
});

app.get('/user', async (req, res)=>{
    try {
        let page = req.query.page ? Number(req.query.page) : 1;

        const user = await octokit.request(`GET /users/${username}`, {
            username: username,
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
            }
        })


        const repo = await octokit.request(`GET /users/${username}/repos`, {
            username: username,
            per_page: repoPerPage,
            page:page,
            headers: {
              'X-GitHub-Api-Version': '2022-11-28'
            }
        })

        
        const numOfResults = Number(user.data.public_repos);
        const numberOfPages = Math.ceil(numOfResults/repoPerPage);

        if(page > numberOfPages){
            res.redirect('/user?page='+encodeURIComponent(numberOfPages));
        }
        else if(page < 1){
            res.redirect('/user?page='+encodeURIComponent('1'));
        }

        let iterator = ((page - 5) < 1) ? 1 : page - 5;
        let endingLink = ((iterator + 9) <= numberOfPages) ? (iterator + 9) : numberOfPages;

        if(endingLink < (page + 4)){
            iterator -= (page + 4) - numberOfPages;
        }

        res.render('user', { user: user.data, repo:repo.data, page, repoPerPage, iterator, endingLink, numberOfPages});
    } catch (error) {
        res.status(404).send('User not found');
    }
});

app.listen(process.env.PORT || port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
