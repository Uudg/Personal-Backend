export default async (app, opts) => {
 
    app.get('/', (_, res) => {
        res.send({ message: 'Hello World' })
    })
    
}