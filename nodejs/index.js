const bankRouter = require('./app/cn_bank/bank.js');
const authenRouter = require('./app/cn_bank/authenticator.js');
const express = require('express')
const cors = require('cors')
const app = express()
const port = 3000
const bodyParser = require('body-parser');
const jwt = require("jwt-simple");
app.use(bodyParser.json());
app.use(cors())

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.use('/api/bank', bankRouter);
app.use('/api/auth', authenRouter);


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})