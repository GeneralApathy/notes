const express = require("express");
const body = require("body-parser");
const auth = require("./api/Auth");
const utils = require("./api/Utils")

var app = express();

app.enable('trust proxy', true);
app.use(body.json());
app.use(body.urlencoded({

  extended: true

}));
app.set('views', __dirname + '/../views');
app.set('view engine', 'twig');

var Router = function(config){

  config = JSON.parse(config)

  this.port = config.port;

  var self = this;
  app.listen(this.port);

  console.log("listening on *:%s", this.port)

}

Router.prototype.init = function(){

  this.api();

  app.get('/me', (req, res) => {

    res.render('me', {

      title: 'Profilo'

    })

  })

  app.get('/verify/:email/:code', (req, res) => {

    var code = req.params.code,
        mail = req.params.email;

    auth.verify(mail, code).then(success => {

      res.redirect('/login?verified=true');

    }).catch(err => {

      res.end("Utente non registrato")

    })

  })

  app.get('/login', (req, res) => {

    var verified = req.query.verified;

    res.render('login', {

      title: 'Login',
      verified: verified

    })

  })

  app.get('/register', (req, res) => {

    res.render('register', {

      title: 'Registrati'

    })

  })

  app.get('/js/:name', (req, res) => {

    return res.sendFile('js/' + req.params.name, {root: './'});

  })

  app.get('/', (req, res) => {

    res.render('index', {

      title: 'Home'

    })

  })

};

Router.prototype.api = function(){

  var api = new express.Router();

  app.use(function(req, res, next){

    console.log(req.headers['user-agent'])

    if(!req.headers['user-agent']){

      res.status(403);
      return res.json({error: 'no_user_agent'});

    }

    next();

  });

  api.get('/session/:sessionid', (req, res) => {

    var sessionid = req.params.sessionid;
    utils.isLogged(sessionid)
      .then(row => {

        console.log(row)
        if(!row.length){

          res.status(403);
          return res.json({error: 'not_logged'});

        }

        return res.json({success: true})

      }).catch(err => {

        console.log(err)
        res.status(403);
        return res.json({error: 'fatal'});

      })

  })

  api.post('/resend', (req, res) => {

    var oldEmail = req.body.oldEmail,
        newEmail = req.body.newEmail;

    auth.resend(oldEmail, newEmail).then(success => {

      res.json(success);

    }).catch(err => {

      res.status(err[1]);
      res.json(err[0]);

    })

  })

  api.get('/verify/:email/:code', (req, res) => {

    var code = req.params.code,
        mail = req.params.email;

    auth.verify(mail, code).then(success => {

      res.json(success);

    }).catch(err => {

      res.status(err[1]);
      res.json(err[0]);

    })

  })

  api.post('/register', (req, res) => {

    var username = req.body.username,
        password = req.body.password,
        email = req.body.email;

    if(password.length < 6){
      res.status(400)
      return res.json({error: "password_too_short"});
    }

    auth.register(username, password, email).then(success => {

      res.json(success);

    }).catch(err => {

      res.status(err[1])
      res.json(err[0]);

    })

  })

  api.post('/login', (req, res) => {

    var username = req.body.username,
        password = req.body.password;

    console.log(username, password)

    auth.login(username, password)
      .then(stuff => {

        res.json(stuff);

      }).catch(err => {

        res.status(err[1])
        res.json(err[0]);

      })

  })

  api.get('/', (req, res) => {

    res.json({

      version: '1.0',
      author: 'Emiliano Maccaferri',
      repo: 'https://github.com/GeneralApathy/notes'

    })

  })

  app.use('/api', api);

}

module.exports = Router;
