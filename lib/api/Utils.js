const Promise = require("promise");
const bcrypt = require("bcrypt-nodejs");
const MySQL = require("../MySQL");
const random = require("randomstring");
const nodemailer = require("nodemailer");
const fs = require("fs")

var config  = fs.readFileSync('config.json', 'utf8');
config = JSON.parse(config);

var mysql = new MySQL();

module.exports.isLogged = (sessionid) =>{

  return mysql.query("SELECT * FROM Sessions WHERE BINARY sessionid = ?", [sessionid]);

}

module.exports.sendVerification = (code, from, mailTo, username) => {

  return new Promise(

    (resolve, reject) => {

        var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {

          user: config.email,
          pass: config.mail_password

        }

    });

      var url = config.url + '/verify/' + mailTo + '/' + code;
      var options = {

        from: '"Registrazione Appunti" <' + from + '>',
        to: mailTo,
        subject: 'Registrazione account ✔',
        text: 'Benvenuto!\nClicca sul link seguente per registrarti! ' + url + '\nQuesto link si disattiverà in 2 ore',
        html: '<style>@import url("https://fonts.googleapis.com/css?family=Roboto:400,700"); * {font-family: "Roboto"} h1{font-weight: lighter; font-size: 2.5em;} p{font-weight: lighter; padding: 30px; background: #DADADA;}</style><h1 style="font-weight: lighter; font-size: 2.5em;">Benvenuto, '+username+'</h1><a href='+url+' style="text-decoration: none; color: white;"><div style=" width: 300px; font-size: 1.5em; font-weight: lighter; text-align: center; padding: 10px; border-radius: 5px; color: white; background: #27ae60;">Conferma il tuo account</div></a><br>Questo link si disattiverà in 2 ore.</p>'

      };

      transporter.sendMail(options, (err, info) => {

        if(err) return reject([{error: err}, 500]);

        console.log("Verification mail sent to %s", mailTo);


        mysql.query("INSERT INTO Verifications (mail, code) VALUES(?,?)", [mailTo, code]).then(success => {

          console.log(success)

        });

      setTimeout(function(){
        mysql.query("DELETE FROM Verifications WHERE BINARY mail = ? AND BINARY code = ?", [mailTo, code]).then(row => {

            console.log("Verification %s has expired", code);

          }).catch(err => {

            return reject([{error: 'fatal'}, 500]);

          })

        }, 7200000);

        return resolve(true)

      })

    }

  )

}

module.exports.checkVerification = (mail) => {

  return new Promise(

    (resolve, reject) => {

      // it checks if the email actually exists

      mysql.query("SELECT * FROM Users WHERE BINARY email = ?", [mail]).then(row => {

        if(row.length > 1) return reject([{error: '???'}, 500]);
        if(row.length == 0) return reject([{error: 'not_found'}, 404]);

        return mysql.query("SELECT * FROM Verifications WHERE BINARY mail = ?", [mail]);

      })

      .then(row => {

        var username = row[0].username;

        if(row.length > 1) return reject([{error: '???'}, 500]); // impossible, but who knows
        if(row.length == 1){

          mysql.query("DELETE FROM Verifications WHERE BINARY mail = ?", [mail]).then(success => {

            console.log("Deleted verification from %s, sending a new one...", email);

          }).catch(err => { return reject([{error: 'fatal'}, 500]); })

        }

        return resolve(username)

      }).catch(err => {

        return reject([{error: 'fatal'}, 500]);

      })

    }

  )

}

module.exports.checkUser = (username, mail) => {

  return new Promise(

    (resolve, reject) => {

      mysql.query("SELECT * FROM Users WHERE BINARY username = ? OR BINARY email = ?", [username, mail]).then(row => {

        if(row.length > 1) return reject([{error: '???'}, 500]); // impossible, but you never know...
        if(row.length == 1) return reject([{error: 'already_exists'}, 409]);

        return resolve(true);

      }).catch(err => {

        return reject([{error: 'fatal'}, 500]);

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

              return reject([{error: 'fatal'}, 500]);

            })

          }, 14400000)

        }).catch(err => {

          return reject([{error: 'fatal'}, 500]);

        })

    }

  )

}

module.exports.hash = (password) => {

  return new Promise(

    (resolve, reject) => {

      bcrypt.hash(password, null, null, (err, hash) => {

        if(err) return reject([{error: 'fatal'}, 500]);

        return resolve(hash);

      })

    }

  )

}

module.exports.verify = (hash, password) => {

  return new Promise(

    (resolve, reject) => {

      bcrypt.compare(password, hash, (err, success) => {

        if(err) return reject([{error: 'fatal'}, 500]);
        if(!success) return reject([{error: 'invalid_password'}, 404]);

        return resolve(success)

      })

    }

  )

}
