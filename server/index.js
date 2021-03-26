const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
const admin = require('firebase-admin');
require('dotenv').config()
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pp1ry.mongodb.net/burj-al-arab?retryWrites=true&w=majority`;
const port = 4000;

const app = express();
app.use(cors());
app.use(bodyParser.json());

const serviceAccount = require("./configs/burj-al-arab-23b41-firebase-adminsdk-k00uy-2818635b8f.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

app.get('/', (req, res) => {
  res.send('Hello World!')
})


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const bookings = client.db("burj-al-arab").collection("bookings");
  
    app.post('/addBooking', (req, res) => {
        const newBooking = req.body;
        bookings.insertOne(newBooking)
        .then(result => {
            res.send(result.insertedCount > 0);
        })
        console.log(newBooking);
    });

    app.get('/bookings', (req, res) => {
        const bearer = req.headers.authorization;
        if(bearer && bearer.startsWith('Bearer ')){
          const idToken = bearer.split(' ')[1];
          admin.auth().verifyIdToken(idToken)
          .then((decodedToken) => {
            // const uid = decodedToken.uid;
            const tokenEmail = decodedToken.email;
            const queryEmail = req.query.email;

            if(tokenEmail == queryEmail){
              bookings.find({email: queryEmail})
              .toArray((err, documents) =>{
                  res.status(200).send(documents);
              })
            }
            else{
              res.status(401).send('Unauthorized Access!')
            }
            console.log(tokenEmail);
          })
          .catch((error) => {
            res.status(401).send('Unauthorized Access!')
          });
        }
        else{
          res.status(401).send('Unauthorized Access!')
        }        
    });

});


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})