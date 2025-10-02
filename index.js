const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 9000;

// middleware
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7ks5x.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();

        const userCollection = client.db("zestora_restaurant_new").collection('users');
        const menuCollection = client.db("zestora_restaurant_new").collection('menus');
        const cartCollection = client.db("zestora_restaurant_new").collection('carts');
        const reviewCollection = client.db("zestora_restaurant_new").collection('reviews');
        const reservationCollection = client.db("zestora_restaurant_new").collection('reservations');


        // token recived 
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1h' });
            res.send({ token });
        })


        // middleWere verify token
        const verifyToken = (req, res, next) => {
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'unauthorized access' });
            }
            const token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.ACCESS_TOKEN, (error, decoded) => {
                if (error) {
                    return res.status(401).send({ message: 'unauthorized access' });
                }
                req.decoded = decoded;
                next();
            })
        }


        // user related apis ------------------------------
        app.post('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const existingUser = await userCollection.findOne(filter);
            if (existingUser) {
                return res.send({ message: 'user already exists', insertedId: null });
            }
            const result = await userCollection.insertOne(user);
            res.send(result);
        })

        app.get('/users', async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result);
        })

        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await userCollection.deleteOne(filter);
            res.send(result);
        })

        app.patch('/users/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })


        // menu related apis ----------------------------------
        app.get('/menu', async (req, res) => {
            const result = await menuCollection.find().toArray();
            res.send(result);
        })

        app.get('/menu/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await menuCollection.findOne(filter);
            res.send(result);
        })

        app.post('/menu', async (req, res) => {
            const menuInfo = req.body;
            const result = await menuCollection.insertOne(menuInfo);
            res.send(result);
        })

        app.delete('/menu/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await menuCollection.deleteOne(filter);
            res.send(result);
        })

        app.patch('/menu/:id', async (req, res) => {
            const id = req.params.id;
            const item = req.body;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    name: item.name,
                    category: item.category,
                    description: item.description,
                    image: item.image,
                    price: item.price,
                    rating: item.rating
                }
            }
            const result = await menuCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })


        // cart related apis ---------------------------------
        app.post('/cart', async (req, res) => {
            const item = req.body;
            const result = await cartCollection.insertOne(item);
            res.send(result);
        })

        app.get('/cart', async (req, res) => {
            const result = await cartCollection.find().toArray();
            res.send(result);
        })

        app.get('/cart/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const result = await cartCollection.find(query).toArray();
            res.send(result);
        })

        app.delete('/cart/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await cartCollection.deleteOne(query);
            res.send(result);
        })


        // review related apis ---------------------------------
        app.get('/review', async (req, res) => {
            const result = await reviewCollection.find().toArray();
            res.send(result);
        })


        // reservation related apis -----------------------------
        app.post('/reservation', async (req, res) => {
            const userInfo = req.body;
            const result = await reservationCollection.insertOne(userInfo);
            res.send(result);
        })

        app.delete('/reservation/:id', async (req, res) => {
            const reservId = req.params.id;
            const filter = { _id: new ObjectId(reservId) };
            const result = await reservationCollection.deleteOne(filter);
            res.send(result);
        })

        app.patch('/reservation/:id', async (req, res) => {
            const reservId = req.params.id;
            const filter = { _id: new ObjectId(reservId) };
            const updatedDoc = {
                $set: {
                    booking: 'confirm'
                }
            }
            const result = await reservationCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })

        app.get('/reservation', async (req, res) => {
            const result = await reservationCollection.find().toArray();
            res.send(result);
        })


        // for Pagination --------------------------------------
        app.get('/menuCount', async (req, res) => {
            const filter = req.query.filter;
            const search = req.query.search;

            let query = {
                name: { $regex: search, $options: 'i' }
            }
            if (filter) query.category = filter;
            const result = await menuCollection.countDocuments(query);
            res.send({ result });
        })

        app.get('/all-menu', async (req, res) => {
            const page = parseInt(req.query.page) - 1;
            const size = parseInt(req.query.size);
            const filter = req.query.filter;
            const sort = req.query.sort;
            const search = req.query.search;

            let option = {};
            if (sort) option = { sort: { price: sort === 'asc' ? 1 : -1 } };

            let query = {
                name: { $regex: search, $options: 'i' }
            }
            if (filter) query.category = filter;

            const result = await menuCollection.find(query, option).skip(page * size).limit(size).toArray();
            res.send(result);
        })

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally { }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('restaurant is open');
})

app.listen(port, () => {
    console.log(`Zestora runing on port ${port}`);
})