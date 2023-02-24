const { MongoClient } = require("mongodb");
const uri = "mongodb+srv://Naruson:Prince12345@cluster0.wnruwml.mongodb.net/test";
const express = require('express');
const authenRouter = express.Router();
const crypto = require('crypto');
const bodyParser = require("body-parser");
const app = express();
const client = new MongoClient(uri);
const dbCollection = client.db('cn_bank').collection('bank_accounts');
const jwt = require("jwt-simple");
const passport = require("passport");
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
        res.status(400);
        return res.json({
            status: false,
            data: "error",
            errorDetail: error.toString(),
        });
    }
});
passport.use(jwtAuth);
const requireJWTAuth = passport.authenticate("jwt", { session: false });
authenRouter.get("/view", requireJWTAuth, (req, res) => {
    const token = req.headers.authorization;
    res.send(jwt.decode(token, SECRET));
});

const loginMiddleWare = (req, res, next) => {
    try {
        const bank = req.body;
        const password = bank.password;
        const hash = crypto.createHash('sha256');
        hash.update(password);
        const hashedPassword = hash.digest('hex');

        MongoClient.connect(uri, function(err, client) {
            if (err) throw err;
            dbCollection.findOne({
                'username': bank.username,
                'password': hashedPassword
            }, function(err, result) {
                if (err) throw err;
                if (result === null) {
                    res.status(400).send('Wrong username or password');
                } else {
                    next();
                }
                client.close();
            });
        });
    } catch (error) {
        res.status(400);
        return res.json({
            status: false,
            data: "error",
            errorDetail: error.toString(),
        });
    }
};

authenRouter.post("/login", loginMiddleWare, async(req, res) => {
    try {

        const password = req.body.password;
        const hash = crypto.createHash('sha256');
        hash.update(password);
        const hashedPassword = hash.digest('hex');

        const client = new MongoClient(uri);
        await client.connect();
        let balance = await dbCollection.findOne({
            'username': req.body.username,
            'password': hashedPassword
        }, {
            projection: { id: 1, account_number: 1 }
        })

        const payload = {
            sub: balance,
            iat: new Date().getTime()
        };
        res.send(jwt.encode(payload, SECRET));
    } catch (error) {
        res.status(400);
        return res.json({
            status: false,
            data: "error",
            errorDetail: error.toString(),
        });
    }
});


module.exports = authenRouter;