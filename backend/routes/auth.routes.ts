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
            message: 'you must provide valid email, password and name'
        })
        return
    }
    let userExists = await User.findByEmail(req.body.email)

    if (userExists != null) {
        res.status(403)
        res.send({
            message: 'this email is already used'
        })
        return
    }
    let user = await User.create(req.body)
    delete user.password
    req.session.user = user
    res.json(user)
})

router.post('/login', mustNotBeAuthenticated, async function (req, res) {
    if (!req.body || !req.body.email || !req.body.password) {
        res.status(403)
        res.send({
            message: 'you must provide valid email and password'
        })
        return
    }
    const { email, password } = req.body
    let userExists = await User.findByEmail(email)

    if (userExists == null || !(await bcrypt.compare(password, userExists.password))) {
        res.status(403)
        res.send({
            message: 'invalid credentials'
        })
        return
    }
    let user = userExists
    delete user.password
    req.session.user = user
    res.json(user)
})

router.get('/logout', hasToBeAuthenticated, function (req, res) {
    req.session.destroy(() => { })
    res.json({ message: 'disconnected' })
})


export default router