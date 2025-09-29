const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 9000;

// middleware
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion } = require('mongodb');
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

        const menuCollection = client.db("zestora_restaurant_new").collection('menu');

        app.get('/menu', async (req, res) => {
            const result = await menuCollection.find().toArray();
            res.send(result);
        })

        // for Pagination 
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