const Promise = require("promise");
const bcrypt = require("bcrypt-nodejs");
const MySQL = require("../MySQL");
const random = require("randomstring");
const nodemailer = require("nodemailer");
const fs = require("fs")

var config  = fs.readFileSync('config.json', 'utf8');
config = JSON.parse(config);

var mysql = new MySQL();

module.exports.sendVerification = (code, from, mailTo, url, username) => {

  return new Promise(

    (resolve, reject) => {

        var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {

          user: config.email,
          pass: config.mail_password

        }

    });

      var options = {

        from: '"Registrazione Appunti" <' + from + '>',
        to: mailTo,
        subject: 'Registrazione account ✔',
        text: 'Benvenuto!\nClicca sul link seguente per registrarti! ' + url + '\nQuesto link si disattiverà in 2 ore',
        html: '<style>@import url("https://fonts.googleapis.com/css?family=Roboto:400,700"); * {font-family: "Roboto"} h1{font-weight: lighter; font-size: 2.5em;} p{font-weight: lighter; padding: 30px; background: #DADADA;}</style><h1 style="font-weight: lighter; font-size: 2.5em;">Benvenuto, '+username+'</h1><a href='+url+' style="text-decoration: none; color: white;"><div style=" width: 300px; font-size: 1.5em; font-weight: lighter; text-align: center; padding: 10px; border-radius: 5px; color: white; background: #27ae60;">Conferma il tuo account</div></a><br>Questo link di disattiverà in 2 ore.</p>'

      };

      transporter.sendMail(options, (err, info) => {

        if(err) return reject([{error: err}, 500]);

        console.log("Verification mail sent to %s", to);

      setTimeout(function(){
        mysql.query("DELETE FROM Verifications WHERE BINARY email = ? AND BINARY code = ?", [to, code]).then(row => {

            console.log("Verification %s has expired", code);

          });

          return resolve(true)

        }, 7200000);

      })

    }

  )

}

module.exports.checkUser = (username, mail) => {

  return new Promise(

    (resolve, reject) => {

      mysql.query("SELECT * FROM Users WHERE BINARY username = ? OR BINARY email = ?", [username, mail]).then(row => {

        console.log(row)

        if(row.length > 1) return reject([{error: '???'}, 500]); // impossible, but you never know...
        if(row.length == 1) return reject([{error: 'already_exists'}, 409]);

        return resolve(true);

      }).catch(err => {

        return reject(err);
      })

    }

  )

}

module.exports.genSession = (userid) => {

  return new Promise(

    (resolve, reject) => {

      var sessionid = random.generate(64); // sessionid that will be used to authenticate every request
      mysql.query("INSERT INTO Sessions (userid, sessionid) VALUES(?,?)", [userid, sessionid])
        .then(success => {

          return resolve(sessionid);

          setInterval(function(){

            mysql.query("DELETE FROM Sessions WHERE userid = ?", [userid]).then(success => {

              console.log("Session %s has been deleted", sessionid);

            }).catch(err => {

              return reject({error: 'fatal'})

            })

          }, 14400000)

        }).catch(err => {

          return reject(err);

        })

    }

  )

}

module.exports.hash = (password) => {

  return new Promise(

    (resolve, reject) => {

      bcrypt.hash(password, null, null, (err, hash) => {

        if(err) return reject(err);

        return resolve(hash);

      })

    }

  )

}

module.exports.verify = (hash, password) => {

  return new Promise(

    (resolve, reject) => {

      bcrypt.compare(password, hash, (err, success) => {

        if(err) return reject({error: 'fatal'});
        if(!success) return reject([{error: 'invalid_password'}, 404]);

        return resolve(success)

      })

    }

  )

}
