const express = require('express');
const http = require('http');
const bcrypt = require('bcrypt');
const path = require("path");
const bodyParser = require('body-parser');
const users = require('./data').userDB;
const MongoClient = require('mongodb').MongoClient;
const config = require('config');
const dbConfig = config.get('feedmail.db');
const mongoose = require("mongoose");
const usersDb = require("./models/users");
const Parser = require('rss-parser')
const mjml2html = require('mjml')
const API_KEY = "c44288d84dcfff5f78eac9f5fd7cc410-a09d6718-d4f6cd3c";
const DOMAIN = "sandboxf5b5751ca4f646159f24b26731e02dab.mailgun.org";
const mailgun = require('mailgun-js')({apiKey: API_KEY, domain: DOMAIN});

const app = express();
const server = http.createServer(app);

app.use(bodyParser.urlencoded({extended: false}));
//app.use(express.static(path.join(__dirname,'./public')));
app.set('public', path.join(__dirname, 'public'));
app.set('view engine', 'ejs');

app.use("/static", express.static("public"));

//CONNECT TO DATABASE
mongoose.set("useFindAndModify", false);

mongoose.connect('mongodb+srv://yoda:yoda@cluster0.g2qbi.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', { useNewUrlParser: true }, () => {
    console.log("Polaczony z db!");
    app.listen(process.env.PORT || 3000, () => console.log("Dzialam na 3000!"));
});

// GET METHOD MAIN PAGE
app.get("/", (req, res) => {
    res.render("index.ejs");
});

//GET METHOD LOGIN PAGE
app.get("/logowanie", (req, res) => {
    res.render("logowanie.ejs");
});

//GET METHOD REGISTER PAGE
app.get("/rejestracja", (req, res) => {
    res.render("rejestracja.ejs");
});

//REJESTRACJA W MONGODB

app.post('/register', async (req, res) => {
    try{
        var em = req.body.email;

        var tet = await usersDb.findOne({email: em}, function (err, docs) {});

        if (!tet) {

            let hashPassword = await bcrypt.hash(req.body.password, 10);

            const emp = new usersDb(
                {
                    d: Date.now(),
                    username: req.body.username,
                    email: req.body.email,
                    password: hashPassword
                });
            await emp.save();

            res.send("<div align ='center'><h2>Rejestracja powiodła się</h2></div><br><br><div align='center'><a href='./logowanie'>logowanie</a></div><br><br><div align='center'><a href='./rejestracja'>Rejestracja nowego użytkowanika</a></div>");
        }else {
            res.send("<div align ='center'><h2>Adres e-mail znajduje się już w bazie danych.<br/>Proszę podać inny adres</h2></div><br><br><div align='center'><a href='./rejestracja'>Ponowna rejestracja</a></div>");
        }
        }catch{
         res.send("500 - błąd po stronie serwera");
     }
});

//LOGOWANIE Z MONGODB
app.post('/login', async (req, res) => {
    try{
        let em = req.body.email;

        let tet = await usersDb.findOne({email: em}, function (err, docs) {});

        if (tet) {

            let submittedPass = req.body.password;
            let storedPass = tet.password;

            const passwordMatch = await bcrypt.compare(submittedPass, storedPass);
            if (passwordMatch) {
                let usrname = tet.username;
                //res.send(`<div align ='center'><h2>Logowanie powiodło się! </h2></div><br><br><br><div align ='center'><h3>Witaj ${usrname}</h3></div><br><br><div align='center'><a href='./logowanie'>Wyloguj</a></div>`);
                res.render('user.ejs', {det: tet})
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

//ODNAJDYWANIE UZYTKOWNIKA PO MAILU I DODAWANIE ADRESU RSS BEZ SPRAWDZANIA POPRAWNOSCI
// app.post('/rss', async (req, res) => {
//     try{
//         const em = req.body.email;
//         usersDb.findOneAndUpdate({email: em}, { $push: {rss: req.body.rss}, err => {
//             if (err) return res.send(500, err);
//         });
//         let tet = await usersDb.findOne({email: em}, function (err, docs) {});
//         res.render('user.ejs', {det: tet})
//     } catch{
//         res.send("500 - Wewnętrzny błąd serwera");
//     }
// });

//ODNAJDYWANIE UZYTKOWNIKA PO MAILU I DODAWANIE DO BAZY WIADOMOSCI DO WYSLANIA

app.post('/rss', async (req, res) => {
    try{
        const em = req.body.email;
        usersDb.findOneAndUpdate({email: em}, {msg: req.body.msg}, err => {
            if (err) return res.send(500, err);
        });
        let tet = await usersDb.findOne({email: em}, function (err, docs) {});
        res.render('user.ejs', {det: tet})
    } catch{
        res.send("500 - Wewnętrzny błąd serwera");
    }
});


// WYSYLANIE MAILA

app.post("/send", async (req, res) => {
    try{
        const em = req.body.email;
        const adress = req.body.emailAdress;
        let tet = await usersDb.findOne({email: em}, function (err, docs) {
        });
        res.render('user.ejs', {det: tet})
        var data = req.body.date;
        let utc = new Date(data).toUTCString();

        sender(adress, tet.msg, utc)
    } catch{
        res.send("500 - Wewnętrzny błąd serwera");
    }
    });

//TWORZENIE MAILA
function sender(mailAdress, msg, time) {
    //mailAdress = 'spamowiskoxbox@gmail.com';
    let sub = "Test mail"
    let sendTime = '"o:deliverytime":' + "'" + time + "'"

    //testowy mail

//     const htmlOutput = mjml2html(`
//   <mjml>
//   <mj-body>
//     <mj-section>
//       <mj-column>
//         <mj-divider border-color="#F45E43"></mj-divider>
//
//         <mj-text font-size="20px" color="#F45E43" font-family="helvetica">${mailAdress}</mj-text>
//
//       </mj-column>
//     </mj-section>
//   </mj-body>
// </mjml>
// `)


    var data = {
        from: 'test@test.pl',
        to: mailAdress,
        subject: sub,
        text: msg, sendTime
        //html: htmlOutput.html
    };

    mailgun.messages().send(data, function (error, body) {
        console.log(body);
    });
}









