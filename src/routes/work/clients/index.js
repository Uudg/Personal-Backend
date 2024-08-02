export default async (app, opts) => {

    app.get('/', async (req, res) => {
        const clients = await app.mongo.db.collection('clients')
            .find({}, { projection: { title: 1, _id: 1 } })
            .toArray();
        res.send(clients);
    });

    app.get('/:id/tables', async (req, res) => {
        const { id } = req.params;
        const tables = await app.mongo.db.collection('tables')
            .find({ client_id: id })
            .toArray()
        res.send(tables.reverse());
    });

    app.post('/', async (req, res) => {
        const { data } = req.body;
        const result = await app.mongo.db.collection('clients').insertOne(data);
        res.send(result);
    });

    app.get('/:id', async (req, res) => {
        const { id } = req.params;
        const client = await app.mongo.db.collection('clients').findOne({ _id: new app.mongo.ObjectId(id) });
        res.send(client);
    });

    app.put('/:id', async (req, res) => {
        const { id } = req.params;
        const client = req.body;
        const result = await app.mongo.db.collection('clients').updateOne({ _id: new app.mongo.ObjectId(id) }, { $set: client });
        res.send(result);
    });

    app.delete('/:id', async (req, res) => {
        const { id } = req.params;
        const result = await app.mongo.db.collection('clients').deleteOne({ _id: new app.mongo.ObjectId(id) });
        res.send(result);
    });

};