import type { RequestHandler } from "express";

export let hasToBeAuthenticated: RequestHandler = function (req, res, next) {
    if (!req.session.user) {
        res.status(401)
        res.send({
            message: 'you must be authenticated'
        })
        return
    }
    next()
}