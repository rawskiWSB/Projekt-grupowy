const express = require('express');
const http = require('http');
const bcrypt = require('bcrypt');
const path = require("path");
const bodyParser = require('body-parser');
const users = require('./data').userDB;

const app = express();
const server = http.createServer(app);

app.use(bodyParser.urlencoded({extended: false}));
//app.use(express.static(path.join(__dirname,'./public')));
app.set('public', path.join(__dirname, 'public'));
app.set('view engine', 'ejs');

app.use("/static", express.static("public"));

// GET METHOD MAIN PAGE
app.get("/", (req, res) => {
    res.render("index.ejs");
});

app.get("/logowanie", (req, res) => {
    res.render("logowanie.ejs");
});

app.get("/rejestracja", (req, res) => {
    res.render("rejestracja.ejs");
});


app.post('/register', async (req, res) => {
    try{
        let foundUser = users.find((data) => req.body.email === data.email);
        if (!foundUser) {

            let hashPassword = await bcrypt.hash(req.body.password, 10);

            let newUser = {
                id: Date.now(),
                username: req.body.username,
                email: req.body.email,
                password: hashPassword,
            };
            users.push(newUser);
            console.log('User list', users);

            res.send("<div align ='center'><h2>Rejestracja powiodła się</h2></div><br><br><div align='center'><a href='./logowanie'>logowanie</a></div><br><br><div align='center'><a href='./rejestracja'>Rejestracja nowego użytkowanika</a></div>");
        } else {
            res.send("<div align ='center'><h2>Adres e-mail znajduje się już w bazie danych.<br/>Proszę podać inny adres</h2></div><br><br><div align='center'><a href='./rejestracja'>Ponowna rejestracja</a></div>");
        }
    } catch{
        res.send("500 - błąd po stronie serwera");
    }
});

app.post('/login', async (req, res) => {
    try{
        let foundUser = users.find((data) => req.body.email === data.email);
        if (foundUser) {

            let submittedPass = req.body.password;
            let storedPass = foundUser.password;

            const passwordMatch = await bcrypt.compare(submittedPass, storedPass);
            if (passwordMatch) {
                let usrname = foundUser.username;
                res.send(`<div align ='center'><h2>Logowanie powiodło się! </h2></div><br><br><br><div align ='center'><h3>Witaj ${usrname}</h3></div><br><br><div align='center'><a href='./logowanie.html'>Wyloguj</a></div>`);
            } else {
                res.send("<div align ='center'><h2>Błędny e-mail lub hasło.</h2></div><br><br><div align ='center'><a href='./logowanie'>Zaloguj ponownie</a></div>");
            }
        }
        else {

            let fakePass = `$2b$$10$ifgfgfgfgfgfgfggfgfgfggggfgfgfga`;
            await bcrypt.compare(req.body.password, fakePass);

            res.send("<div align ='center'><h2>Błędny e-mail lub hasło.</h2></div><br><br><div align ='center'><a href='./logowanie'>Zaloguj ponownie</a></div>");
        }
    } catch{
        res.send("500 - Wewnętrzny błąd serwera");
    }
});


app.listen(3000, () => {
    console.log('Serwer wystartował na porcie 3000');
})


