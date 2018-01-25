const express = require("express");
const body = require("body-parser");
const auth = require("./api/Auth");
const utils = require("./api/Utils")
const files = require("./api/Files")
const fs = require("fs")

var app = express();

app.enable('trust proxy', true);
app.use(body.json({limit: '1000mb'}));
app.use(body.urlencoded({

  extended: true,
  limit: '1000mb'

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

  app.get('/all', (req, res) => {

    res.render('all', {

      title: 'Tutti i documenti'

    })

  })

  app.get('/view/:filename', (req, res) => {

    var file = req.params.filename;
    files.read(file)
      .then(success => {

        res.render('view', {

          title: 'Nuovo file',
          stuff: success.content

        })

      }).catch(err => {

        res.json(err[0])

      })

  })

  app.get('/edit/:filename/:author', (req, res) => {

    var file = req.params.filename;
    var author = req.params.author;
    var ftitle;
    console.log(author)

    utils.isOwner(author, file)
      .then(success => {

        return files.checkFile('public', file);

      })

      .then(success => {

        author = success.author;
        ftitle = success.title;
        return files.read(file);

      })

      .then(success => {

        console.log(success.content)

        return res.render('edit', {

          title: 'Modifica',
          stuff: success.content,
          author: author,
          ftitle: ftitle

        })

      }).catch(err => {

          res.json(err)

      })

  })

  app.get('/password/:email/:code', (req, res) => {

    var email = req.params.email,
        code = req.params.code;

    utils.checkURL(email, code).then(row => {

      if(row.length == 0)
        return res.redirect("/")

        res.render('password', {

          title: 'Reset della password'

        });

    }).catch(err => {

      res.end("Errore durante lo svolgimento della richiesta...")

    })

  })

  app.get('/forgot', (req, res) => {

    res.render('forgot', {

      title: 'Ho dimenticato la password'

    })

  })

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

  app.get('*', (req, res) => {

  res.render('404', {

    title: '404!'

  });

});

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

  api.post("/download", (req, res) => {

    var filename = req.body.filename,
        author = req.body.author,
        sessionid = req.body.sessionid;


    utils.isLogged(sessionid)
      .then(success => {

        console.log("logged")
        return utils.exists(author);

      })

      .then(success => {

        console.log("exists")
        return utils.isOwner(author, filename)

      })

      .then(success => {

        console.log("owner")
        return files.convert(filename, 'docx');

      })

      .then(path => {

        var rs = fs.createReadStream(path);
        console.log(rs)
        res.setHeader('Content-Disposition', 'attachment; filename=' + filename + '.docx');
        res.setHeader('Content-Transfer-Encoding', 'binary');
        res.setHeader('Content-Type', 'application/octet-stream');
        rs.pipe(res);

      })

      .catch(err => {

        res.status(err[1]);
        return reject(err[0]);

      })

  })

  api.post("/delete", (req, res) => {

    var filename = req.body.filename,
        author = req.body.author,
        sessionid = req.body.sessionid;

        if(!filename || !author || !sessionid){

            res.status(403)
            return res.json({error: 'missing_parameter'})

        }

    utils.isLogged(sessionid)
      .then(success => {

        console.log("logged")
        return utils.exists(author);

      })

      .then(success => {

        console.log("exists")
        return files.delete(filename);

      })

      .then(success => {

        console.log("ok")
        res.json(success)

      })

      .catch(err => {

        res.json(err);

      })

  })

  api.post("/viewall", (req, res) => {

    var user = req.body.userid,
        sessionid = req.body.sessionid,
        documents = req.body.max;

        if(!user || !sessionid){

            res.status(403)
            return res.json({error: 'missing_parameter'})

        }

    utils.exists(user)

      .then(success => {

        return utils.isLogged(sessionid);

      })

      .then(success => {

        return files.all(user, documents);

      })

      .then(files => {

        res.json(files)

      })

      .catch(err => {
        console.log(err)
        res.json(err);

      })

  })

  api.post("/getpublicfile", (req, res) => {

    var url = req.body.filename,
        userid = req.body.userid;

        if(!url || !userid){

            res.status(403)
            return res.json({error: 'missing_parameter'})

        }

    // sessionid not needed because
    utils.exists(userid).then(success => {

      return files.checkFile('public', url);

    })

      .then(success => {

        return files.read(url);

      })

      .then(success => {

        return res.json(success);

      })

      .catch(err => {

        res.status(err[1]);
        return res.json(err[0]);

      })

  })

  api.post("/editPublicFile", (req, res) => {

    var userid = req.body.user,
        content = req.body.stuff,
        name = req.body.filename,
        sessionid = req.body.sessionid;

        if(!userid || !content || !name || !sessionid){

            res.status(403)
            return res.json({error: 'missing_parameter'})

        }

        console.log(userid, content, name, sessionid)

    utils.exists(userid)
      .then(success => {

        console.log("logged?")
        return utils.isLogged(sessionid);

      })

      .then(success => {

        console.log("owner?")
        return utils.isOwner(userid, name);

      })

      .then(success => {

        console.log("exists?")
        return files.checkFile('public', name);

      })

      .then(success => {

        return files.appendToFile(name, content);

      })

      .then(success => {

        console.log("ok")
        return res.json(success);

      })

      .catch(err => {

        console.log(err)
        res.status(err[1]);
        return res.json(err[0]);

      })

  })

  api.post("/createFile", (req, res) => {

    var userid = req.body.user,
        title = req.body.title,
        sessionid = req.body.sessionid;

        if(!userid || !title || !sessionid){

            res.status(403)
            return res.json({error: 'missing_parameter'})

        }

    utils.exists(userid)
      .then(success => {

        return utils.isLogged(sessionid);

      })

      .then(row => {

        if(row.length == 0){

          res.status(403);
          return res.json({error: 'not_logged'});

        }

        return files.createPublic(title, userid);

      })

      .then(success => {

        console.log(success)
        res.json(success);

      })

      .catch(err => {

        console.log(err)
        res.status(err[1]);
        return res.json(err[0]);

      })


  })

  api.post("/changepassword", (req, res) => {

    var email = req.body.email,
        code = req.body.code,
        password = req.body.password;

        if(!email || !code || !password){

            res.status(403)
            return res.json({error: 'missing_parameter'})

        }

    auth.changeForgottenPassword(email, code, password)
      .then(success => {

        res.json(success)

      })

      .catch(err => {

        res.status(err[1]);
        res.json(err[0])

      })

  })

  api.post('/forgot', (req, res) => {

    var email = req.body.email;

    if(!email){

        res.status(403)
        return res.json({error: 'missing_parameter'})

    }

    auth.forgotPassword(email).then(success => {

      return res.json(success);

    }).catch(err => {

      res.status(err[1]);
      return res.json(err[0]);

    })

  })

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

        if(!oldEmail || !newEmail){

            res.status(403)
            return res.json({error: 'missing_parameter'})

        }

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

        if(!email || !code){

            res.status(403)
            return res.json({error: 'missing_parameter'})

        }

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

        if(!username || !password || !email){

            res.status(403)
            return res.json({error: 'missing_parameter'})

        }

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

        if(!username || !password){

            res.status(403)
            return res.json({error: 'missing_parameter'})

        }

    console.log(req.body)

    auth.login(username, password)
      .then(stuff => {

        res.json(stuff);

      }).catch(err => {

        res.status(err[1])
        res.json(err[0]);

      })

  })

  api.get('/', (req, res) => {

    /*res.json({

      version: '1.0',
      author: 'Emiliano Maccaferri',
      repo: 'https://github.com/GeneralApathy/notes'

    })*/

    res.json(api.stack)

  })

  app.use('/api', api);

}

module.exports = Router;
