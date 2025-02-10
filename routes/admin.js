const express = require('express');
const commentsControllers = require('../controller/admin')
const commentsFilter = require('../controller/admin-filter')
const isAuth = require('../middlware/is-auth')
const route = express.Router();
const {body} = require('express-validator')


route.get('/all-comment' ,isAuth,commentsFilter.filter   ,commentsControllers.getComments)
route.get('/user-comment/:id' ,isAuth,commentsFilter.filter   , commentsControllers.getUserComments)
route.post('/add-coment' ,isAuth, body('title').trim().isLength({max:255 , min:5})  , commentsControllers.createComment)
route.put('/edit-comment/:id' ,isAuth, body('title').trim().isLength({max:255 , min:5})  , commentsControllers.editComment)
route.delete('/delete-comment/:id',isAuth, commentsControllers.deleteComment)
// route.get('/comment/:id',isAuth, commentsControllers.commentsDetail)
// route.put('/complete',isAuth,commentsControllers.completeComment)

module.exports = route