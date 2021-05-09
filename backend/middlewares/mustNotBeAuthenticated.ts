import type { RequestHandler } from "express";

export let mustNotBeAuthenticated: RequestHandler = function (req, res, next) {
    if (req.session.user) {
        res.status(401)
        res.send({
            message: 'you must not be authenticated'
        })
        return
    }
    next()
}