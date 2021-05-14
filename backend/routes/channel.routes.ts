import express from 'express'

const router = express.Router()
import { hasToBeAuthenticated, mustNotBeAuthenticated } from '../middlewares'
import { Channel } from '../entities/Channel'
import UserChannel from '../entities/UserChannel'


router.post('/channel', hasToBeAuthenticated, async function (req, res) {

    let channelToCreate = await Channel.create(req.body.name, req.session.user?.id)
    await UserChannel.create(channelToCreate.id, req.session.user?.id)
    res.json(channelToCreate)
})

router.post('/channel/delete', hasToBeAuthenticated, async function (req, res) {
    if (!req.body.name) {
        res.status(401)
        res.send({
            message: 'no channel provided'
        })
        return
    }
    let channelToDelete = await Channel.findByNameAndAuthor(req.body.name, req.session.user?.id)
    if (!channelToDelete) {
        res.status(401)
        res.send({
            message: 'you must provide a valid channel'
        })
        return
    }
    await Channel.deleteById(channelToDelete.id)
    res.send('channel deleted')
})

export default router