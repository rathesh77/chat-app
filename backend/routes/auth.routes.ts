import express from 'express'
import User from '../entities/User'
import bcrypt from 'bcrypt'

const router = express.Router()
import { hasToBeAuthenticated, mustNotBeAuthenticated } from '../middlewares'


router.get('/me', hasToBeAuthenticated, function (req, res) {

    res.json(req.session.user)
})

router.post('/register', mustNotBeAuthenticated, async function (req, res) {

    if (!req.body || !req.body.email || !req.body.password || !req.body.name) {
        res.status(403)
        res.send({
            message: 'You must provide a valid email, password and name'
        })
        return
    }
    const {email, password, name} = req.body
    let userExists = await User.findByEmail(email)

    if (userExists != null) {
        res.status(403)
        res.send({
            message: 'This email is already used'
        })
        return
    }
    if (!/^[a-z-A-Z0-9\._-]+@[a-z-A-Z0-9]+\.[a-z-A-Z0-9]{2,5}$/.test(email)) {
        res.status(403)
        res.send({
            message: 'Invalid email'
        })
        return
    }
    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password)) {
        res.status(403)
        res.send({
            message: 'Password must contain at least 8 characters including one letter and one number'
        })
        return
    }
    let user = await User.create({email,password,name})
    delete user.password
    req.session.user = user
    res.json(user)
})

router.post('/login', mustNotBeAuthenticated, async function (req, res) {
    if (!req.body || !req.body.email || !req.body.password) {
        res.status(403)
        res.send({
            message: 'You must provide an email and password'
        })
        return
    }
    const { email, password } = req.body
    let userExists = await User.findByEmail(email)

    if (userExists == null || !(await bcrypt.compare(password, userExists.password))) {
        res.status(403)
        res.send({
            message: 'Invalid credentials'
        })
        return
    }
    let user = userExists
    delete user.password
    req.session.user = user
    res.json(user)
})

router.get('/logout', hasToBeAuthenticated, function (req, res) {

    req.session.destroy(function(err){
        if(err){
           console.log(err);
        }else{
            res.json({ message: 'disconnected' })
        }
     });
})


export default router