export default async (app, opts) => {

    const fetchContents = async (type) => {
        const about = app.mongo.db.collection('about');
        const data = await about.find({ type }).toArray();
        
        return data.map(el => el.content);
    };

    app.get('/info', async (req, res) => {
        const contents = await fetchContents('info');
        res.send(contents);
    });

    app.get('/socials', async (req, res) => {
        const contents = await fetchContents('social');
        res.send(contents);
    });

};