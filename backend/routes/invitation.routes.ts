import express from 'express'
import User from '../entities/User'

const router = express.Router()
import { hasToBeAuthenticated } from '../middlewares'
import { Channel } from '../entities/Channel'
import UserChannel from '../entities/UserChannel'
import { Invitation } from '../entities/Invitation'


router.post('/invitation', hasToBeAuthenticated, async function (req, res) {

    let { channelId, recipient } = req.body
    //  verifier que le channel existe

    let currentChannel = await Channel.findById(channelId);
    if (!currentChannel) {
        res.status(403)
        res.json({
            status: 403,
            message: 'Ce channel n\'existe pas'
        })
        return
    }
    recipient = await User.findByEmail(recipient)
    if (!recipient) {
        res.status(403)
        res.json({
            status: 403,
            message: 'Le destinataire n\'existe pas'
        })
        return
    }
    if ((await UserChannel.findByUserIdAndChannelId(recipient.id, channelId)) != null) {
        res.status(403)
        res.json({
            status: 403,
            message: 'Cet utilisateur fait deja parti du channel'
        })
        return
    }

    // inviter le destinataire
    //let await Invitation.create(recipient.id, currentChannel.id)
    res.json(await Invitation.create(recipient.id, currentChannel.id))
})


export default router