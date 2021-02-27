const express = require('express')
const app = express()

app.use(express.static(__dirname + '/public'))

app.get('/', function(req, res) {
    res.send('Hello World!');
});

app.listen(3000, () => {
    console.log('Serwer wystartował na porcie 3000');
})



