const { MongoClient } = require("mongodb");
const Authen = require('./authenticator');
const uri = "mongodb+srv://Naruson:Prince12345@cluster0.wnruwml.mongodb.net/test";
const express = require('express');
const bankRouter = express.Router();
const { check, validationResult } = require('express-validator');
require('dotenv').config()
const crypto = require('crypto');
const client = new MongoClient(uri);
const dbCollection = client.db('cn_bank').collection('bank_accounts');
const ObjectId = require('mongodb').ObjectId;
const passport = require("passport");
const jwt = require("jwt-simple");
const ExtractJwt = require("passport-jwt").ExtractJwt;
const JwtStrategy = require("passport-jwt").Strategy;
const SECRET = "MY_SECRET_KEY";
const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromHeader("authorization"),
    secretOrKey: SECRET
};
const jwtAuth = new JwtStrategy(jwtOptions, (payload, done) => {
    try {
        MongoClient.connect(uri, function(err, client) {
            if (err) throw err;
            dbCollection.findOne({
                'id': payload.sub.id,
            }, function(err, result) {
                if (err) throw err;
                if (result === null) {
                    done(null, false);
                } else {
                    done(null, true);
                }
                client.close();
            });
        });
    } catch (error) {
        return res.json({
            status: false,
            data: "error",
            errorDetail: error.toString(),
        });
    }
});
passport.use(jwtAuth);
const requireJWTAuth = passport.authenticate("jwt", { session: false });
/*
http status 
code 420 balance < money transfer/withdraw cannot transfer/withdraw


*/

// create account
bankRouter.post('/', async(req, res) => {
    try {
        const bank = req.body;
        const password = bank.password;
        const hash = crypto.createHash('sha256');
        hash.update(password);
        const hashedPassword = hash.digest('hex');

        const client = new MongoClient(uri);
        await client.connect();
        await dbCollection.insertOne({
            id: await dbCollection.findOne().count() + 1,
            fullname: bank.fullname,
            account_number: bank.account_number,
            username: bank.username,
            password: hashedPassword,
            balance: bank.balance,
            update_at: new Date().toLocaleString('en-US', { timeZone: process.env.TIME_ZONE }),
            created_at: new Date().toLocaleString('en-US', { timeZone: process.env.TIME_ZONE }),

        });
        await client.close();
        res.status(201).send({
            "status": "ok",
            "message": "created successfully",
            "user": req.body.username
        });
    } catch (error) {
        res.status(400);
        return res.json({
            status: false,
            data: "error",
            errorDetail: error.toString(),
        });
    }
});

//get balance
bankRouter.get('/balance', requireJWTAuth, async(req, res) => {
    try {
        const token = req.headers.authorization;
        const payload = jwt.decode(token, SECRET);

        const client = new MongoClient(uri);
        await client.connect();
        let balance = await dbCollection.findOne({
            'account_number': payload.sub.account_number
        }, {
            projection: { balance: 1 }
        })

        await client.close();
        res.status(200).send({
            "status": "ok",
            "message": "show balance successfully",
            "balance": balance
        });
    } catch (error) {
        res.status(400);
        return res.json({
            status: false,
            data: "error",
            errorDetail: error.toString(),
        });
    }
});

//deposit 
bankRouter.post('/deposit', requireJWTAuth, [
    check('money').notEmpty(),
], async(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const token = req.headers.authorization;
        const payload = jwt.decode(token, SECRET);

        const client = new MongoClient(uri);
        await client.connect();

        const updateBalance = await dbCollection.updateOne({
            'account_number': payload.sub.account_number
        }, { $inc: { balance: +req.body.money } })

        await client.close();
        res.status(200).send({
            "status": "ok",
            "message": "show balance successfully",
            "balance": updateBalance
        });
    } catch (error) {
        res.status(400);
        return res.json({
            status: false,
            data: "error",
            errorDetail: error.toString(),
        });
    }
});



//withdraw
bankRouter.post('/withdraw', requireJWTAuth, [
    check('money').notEmpty(),
], async(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const token = req.headers.authorization;
        const payload = jwt.decode(token, SECRET);

        const client = new MongoClient(uri);
        await client.connect();

        const checkBalance = await dbCollection.findOne({ 'account_number': payload.sub.account_number }, {
            projection: { balance: 1 }
        })
        if (checkBalance.balance < req.body.money) {
            await client.close();
            res.status(420);
            throw new Error('Cannot withdraw balance is no enough.');
        }

        const updateBalance = await dbCollection.updateOne({
            'account_number': payload.sub.account_number
        }, { $inc: { "balance": -req.body.money } })

        await client.close();
        res.status(200).send({
            "status": "ok",
            "message": "show balance successfully",
            "balance": updateBalance
        });
    } catch (error) {
        return res.json({
            status: false,
            data: "error",
            errorDetail: error.toString(),
        });
    }
});

//transfer
bankRouter.post('/transfer', requireJWTAuth, [
    check('transfer_account').notEmpty().isLength({ min: 10 }).isLength({ max: 10 }),
    check('money').notEmpty(),
], async(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const token = req.headers.authorization;
        const payload = jwt.decode(token, SECRET);

        const client = new MongoClient(uri);
        await client.connect();

        //check cannot transfer to same account sender
        if (payload.sub.account_number === req.body.transfer_account) {
            await client.close();
            throw new Error('You cannot transfer to your account money by the same account.');
        }

        //check account exist
        const checkTransferAccount = await dbCollection.findOne({ 'account_number': req.body.transfer_account })
        if (!checkTransferAccount) {
            await client.close();
            throw new Error('This account number does exist.');
        }

        const checkBalance = await dbCollection.findOne({ 'account_number': payload.sub.account_number }, {
            projection: { balance: 1 }
        })

        if (checkBalance.balance < req.body.money) {
            await client.close();
            throw new Error('Cannot transfer balance is no enough.');
        }

        //update sender balance
        await dbCollection.updateOne({
            'account_number': payload.sub.account_number
        }, { $inc: { "balance": -req.body.money } })

        //update receiver balance
        await dbCollection.updateOne({
            'account_number': req.body.transfer_account
        }, { $inc: { "balance": +req.body.money } })

        //create transaction sender
        const senderBalance = await dbCollection.findOne({ 'account_number': payload.sub.account_number }, {
            projection: { balance: 1, fullname: 1 }
        })
        const receiverBalance = await dbCollection.findOne({ 'account_number': req.body.transfer_account }, {
            projection: { balance: 1, fullname: 1 }
        })

        await dbCollection.updateOne({ 'account_number': payload.sub.account_number }, {
            $push: {
                "transfer": {
                    "datetime": new Date().toLocaleString('en-US', { timeZone: process.env.TIME_ZONE }),
                    "remain": senderBalance.balance,
                    "action": 1,
                    'action_name': "Transfer",
                    "from_account": payload.sub.account_number,
                    "from_fullname": senderBalance.fullname,
                    'to_account': req.body.transfer_account,
                    'to_fullname': receiverBalance.fullname,
                    "amount": req.body.money
                },
                "transaction": {
                    "datetime": new Date().toLocaleString('en-US', { timeZone: process.env.TIME_ZONE }),
                    "remain": senderBalance.balance,
                    "action": 1,
                    'action_name': "Transfer",
                    "from_account": payload.sub.account_number,
                    "from_fullname": senderBalance.fullname,
                    'to_account': req.body.transfer_account,
                    'to_fullname': receiverBalance.fullname,
                    "amount": req.body.money
                }
            }
        })


        await dbCollection.updateOne({ 'account_number': req.body.transfer_account }, {
                $push: {
                    "receive": {
                        "datetime": new Date().toLocaleString('en-US', { timeZone: process.env.TIME_ZONE }),
                        "remain": receiverBalance.balance,
                        "action": 2,
                        'action_name': "Receive",
                        "from_account": payload.sub.account_number,
                        "from_fullname": senderBalance.fullname,
                        'to_account': req.body.transfer_account,
                        'to_fullname': receiverBalance.fullname,
                        "amount": req.body.money
                    },
                    "transaction": {
                        "datetime": new Date().toLocaleString('en-US', { timeZone: process.env.TIME_ZONE }),
                        "remain": receiverBalance.balance,
                        "action": 2,
                        'action_name': "Receive",
                        "from_account": payload.sub.account_number,
                        "from_fullname": senderBalance.fullname,
                        'to_account': req.body.transfer_account,
                        'to_fullname': receiverBalance.fullname,
                        "amount": req.body.money
                    }
                }
            })
            /* 
               action 1 = sender
               action 2 = receiver
             */

        await client.close();
        res.status(200).send({
            "status": "ok",
            "message": "transfer successfully",
        });
    } catch (error) {
        res.status(400);
        return res.json({
            status: false,
            data: "error",
            errorDetail: error.toString(),
        });
    }
});

//transaction transfer history
bankRouter.get('/transfer-history', requireJWTAuth, async(req, res) => {
    try {
        const token = req.headers.authorization;
        const payload = jwt.decode(token, SECRET);

        const client = new MongoClient(uri);
        await client.connect();
        const transaction_history = await dbCollection.find({
            "account_number": payload.sub.account_number,
        }, {
            projection: { transfer: 1 }
        }).toArray();
        await client.close();

        res.status(200).send({
            "status": "ok",
            "message": "transfer successfully",
            "transaction": transaction_history,
        });

    } catch (error) {
        res.status(400);
        return res.json({
            status: false,
            data: "error",
            errorDetail: error.toString(),
        });
    }
});

bankRouter.get('/receive-history', requireJWTAuth, async(req, res) => {
    try {
        const token = req.headers.authorization;
        const payload = jwt.decode(token, SECRET);

        const client = new MongoClient(uri);
        await client.connect();
        const transaction_history = await dbCollection.find({
            "account_number": payload.sub.account_number,
        }, {
            projection: { receive: 1 }
        }).toArray();
        await client.close();

        res.status(200).send({
            "status": "ok",
            "message": "transfer successfully",
            "transaction": transaction_history,
        });

    } catch (error) {
        res.status(400);
        return res.json({
            status: false,
            data: "error",
            errorDetail: error.toString(),
        });
    }
});


module.exports = bankRouter;