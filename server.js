const express = require('express');
const bodyParser = require('body-parser');
const searchAlgorithm = require('./controllers/searchAlgorithm'); // Import the module
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.static('public'));

let responses = [];

app.get('/', (req, res) => {
    res.render('index', { responses });
});

// Handle post request from submit
app.post('/submit', (req, res) => {
    const start = req.body.start;
    const end = req.body.end;
    const weight = req.body.weight
    const discountsFromList = req.body.discountsFromList;

    console.log('Data from Form 1 received on the server:', start);
    console.log('Data from Form 2 received on the server:', end);
    console.log('Data from Form 2 received on the server:', discountsFromList);

    if (discountsFromList != null && discountsFromList.length > 0) {
        searchAlgorithm.calculateDiscount(discountsFromList)
    }else{
        searchAlgorithm.calculateDiscount([])
    }

    // Generate a search object
    const complexObject = searchAlgorithm.searchRoute(start, end, ((100.0 - weight) / 100), (weight / 100));
    responses.push('' + JSON.stringify(complexObject[0]));
    responses.push('' + JSON.stringify(complexObject[1]));

    res.json(responses);
});

// Handle post request from the delete buttons
app.post('/delete', (req, res) => {
    const index = req.body.index;
    if (index >= 0 && index < responses.length) {
        responses.splice(index, 1);
    }
    res.json(responses);
});

app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
});
