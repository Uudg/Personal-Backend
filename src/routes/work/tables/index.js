import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
const __dirname = import.meta.dirname;

const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}${month}${year}`;
};

const generateInvoiceHTML = (date, main, add) => {
    const templatePath = path.join(__dirname, '../../../html', 'invoice.html');
    let htmlContent = fs.readFileSync(templatePath, 'utf8');

    let hours = 0;
    let total = 0;
    main.forEach(item => hours += parseInt(item.hours));
    main.forEach(item => total += parseInt(item.hours) * 20);
    add.forEach(item => total += parseInt(item.price));

    const mainItems = `
        <tr class="item">
            <td>Working Hours</td>
            <td class="hours">${hours}</td>
            <td class="price">${parseInt(hours) * 20}</td>
        </tr>
    `;

    const addItems = add.map(item => `
        <tr class="item">
            <td>${item.title}</td>
            <td class="hours">-</td>
            <td class="price">${parseInt(item.price).toFixed(2)}</td>
        </tr>
    `).join('');

    const invoiceItems = mainItems + addItems;

    const invoiceNumber = formatDate(new Date());

    htmlContent = htmlContent.replace('{{invoiceNumber}}', invoiceNumber);
    htmlContent = htmlContent.replace('{{date}}', date);
    htmlContent = htmlContent.replace('{{invoiceItems}}', invoiceItems);
    htmlContent = htmlContent.replace('{{total}}', total.toFixed(2));

    return htmlContent;
};

const generatePDFInvoice = async (date, main, add) => {
    const htmlContent = generateInvoiceHTML(date, main, add);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4' });

    await browser.close();
    return pdfBuffer;
};

export default async (app, opts) => {

    app.get('/', async (req, res) => {
        const tables = await app.mongo.db.collection('tables')
            .find()
            .toArray();
        res.send(tables);
    });

    app.get('/:id', async (req, res) => {
        const { id } = req.params;
        const table = await app.mongo.db.collection('tables')
            .findOne({ _id: new app.mongo.ObjectId(id) });
        if (!table) {
            return res.status(404).send({ error: 'Table not found' });
        }

        const client = await app.mongo.db.collection('clients')
            .findOne({ _id: new app.mongo.ObjectId(table.client_id) });
        if (!client) {
            return res.status(404).send({ error: 'Client not found' });
        }

        res.send({ ...table, rate: client.rate });
    });

    app.post('/', async (req, res) => {
        const data = req.body;
        const table = await app.mongo.db.collection('tables')
            .insertOne({
                ...data,
                created_at: new Date(),
                main: [],
                additional: []
            });
        res.send(table);
    });

    app.delete('/:id', async (req, res) => {
        const { id } = req.params;
        
        const table = await app.mongo.db.collection('tables')
            .deleteOne({ _id: new app.mongo.ObjectId(id) });
        if (table.deletedCount === 0) {
            return res.status(404).send({ error: 'Table not found' });
        }
        res.send({ success: true });
    });

    app.put('/:id', async (req, res) => {
        const data = req.body;
        const { id } = req.params;
        const table = await app.mongo.db.collection('tables')
            .updateOne({ _id: new app.mongo.ObjectId(id) }, { $set: data });
        if (table.modifiedCount === 0) {
            return res.status(404).send({ error: 'Table not found' });
        }
        res.send({ success: true });
    });

    app.get('/:id/invoice', async (req, res) => {
        const { id } = req.params;

        const table = await app.mongo.db.collection('tables')
            .findOne({ _id: new app.mongo.ObjectId(id) });

        if (!table) {
            return res.status(404).send({ error: 'Table not found' });
        }

        const main = table.main;
        const add = table.additional;
        const invoiceNumber = id; // or fetch from table if available
        const date = new Date().toLocaleDateString(); // or fetch from table if available

        try {
            const pdfBuffer = await generatePDFInvoice(date, main, add);

            res.header('Content-Type', 'application/pdf');
            res.header('Content-Disposition', `attachment; filename=invoice-${id}.pdf`);
            res.header('Content-Length', pdfBuffer.length);

            res.send(pdfBuffer);
        } catch (error) {
            console.error('Error generating PDF:', error);
            res.status(500).send({ error: 'Failed to generate PDF' });
        }
    });

};