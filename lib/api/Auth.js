const Promise = require("promise");
const MySQL = require("../MySQL");
const utils = require("./Utils");
const random = require("randomstring");
const fs = require("fs");

var mysql = new MySQL();
var config  = fs.readFileSync('config.json', 'utf8');
config = JSON.parse(config);

module.exports.changeForgottenPassword = (email, id, password) => {

  return new Promise(

    (resolve, reject) => {

      mysql.query("SELECT * FROM Verifications WHERE BINARY mail = ? AND BINARY code = ?", [email, id]).then(row => {

        if(row.length == 0)
          return reject([{error: 'not_found'}, 404]);

        return utils.hash(password);

      })

      .then(hashed => {

        return mysql.query("UPDATE Users SET password = ? WHERE email = ?", [hashed, email])

      })

      .then(success => {

        return resolve({success: true});

      })

      .catch(err => {

        return reject(err)

      })

    }

  )

}

module.exports.forgotPassword = (email) => {

  return new Promise(

    (resolve, reject) => {

      var generated = "psw-" + random.generate(60);

      mysql.query("SELECT * FROM Users WHERE email = ?", [email]).then(row => {

        if(row.length == 0)
          return reject([{error: 'not_found'}, 404]);

      return mysql.query("INSERT INTO Verifications (code, mail) VALUES(?,?)", [generated, email]);

      })

      .then(success => {

        console.log(success)
        return utils.forgotEmail(email, generated);

      })

      .then(success => {

        return resolve({success: true});

      })

      .catch(err => {

        return reject(err);

      })

    }

  )

}

module.exports.resend = (oldEmail, newEmail) => {

  return new Promise(

    (resolve, reject) => {

      // This function's used to allow the user resend the confirmation email
      // in case the first one hasn't been received (or something else)

      // regenerating stuff for the verification

      var code = random.generate(32),
          from = config.email,
          mailTo = newEmail,
          user;

      // checking if the user has a pending verification

      utils.checkVerification(oldEmail).then(username => {

        user = username;

        return mysql.query("INSERT INTO Verifications (mail, code) VALUES(?,?)", [mailTo, code]);

      })

      .then(success => {

        return utils.sendVerification(code, from, mailTo, user)

      })

      .then(success => {

        return resolve({success: true});

      })

      .catch(err => {

        return reject(err);

      })

    }

  )

}

module.exports.verify = (email, code) => {

  return new Promise(

    (resolve, reject) => {

      console.log(email, code)

      if(!email || !code)
          return reject({error: 'missing_parameter'});

      mysql.query("SELECT * FROM Verifications WHERE mail = ? AND code = ?", [email, code])
        .then(row => {

          if(row.length == 0) return reject([{error: 'no_verification'}, 500]);

          return mysql.query("UPDATE Users SET verified = 1 WHERE email = ?", [email]);

        })

        .then(row => {

          return mysql.query("DELETE FROM Verifications WHERE BINARY code = ? AND BINARY mail = ?", [code, email]);

        })

        .then(row => {

          return resolve({success: true});

        })

        .catch(err => {

          return reject([{error: err}, 500]);

        })

    }

  )

}

module.exports.register = function(username, password, email){

  return new Promise(

    (resolve, reject) => {

      if(!username || !password || !email)
        return reject([{error: 'missing_parameter'}, 403]);

      // regex that matches an email
      var regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      var reg = regex.test(email);

      // regex that matches an username that can contain alphanumeric characters, _ and -
      var userRegex = /^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/;
      var usReg = userRegex.test(username)

      if(!reg)
          return reject([{error: 'bad_email'}, 400])

      if(!usReg || username.indexOf(' ') >= 1)
          return reject([{error: 'bad_username'}, 400])

      if(password.indexOf(' ') >= 1)
        return reject([{error: 'bad_password'}, 400])

      // everything is fine

      utils.checkUser(username, email)
      .then(success => {

        // user does not exists, so we can register it

        // 1st step: hasing the password

        return utils.hash(password);

      })

      .then(hash => {

      /*

        once we hashed the password, we proceed generating the user-id
        that we will be used to identify the person inside the system

      */

      var userid = random.generate(64);

      // registration, not verified yet

      return mysql.query("INSERT INTO Users (username, password, userid, email) VALUES(?,?,?,?)",
               [username, hash, userid, email]);

    })

    .then(row => {

      // creating a url with which the user will actually activate his account.
      var code = random.generate(32);

      // table used for verifications, users are inserted, then, once the url is visited, the profile is activated
      console.log(email, code)

      return utils.sendVerification(code, config.email, email, username);

    })

    .then(success => {

      return resolve({success: true})

    })

    .catch(err => {

    return reject(err);

  })

})

}

module.exports.login = (username, password) => {

  return new Promise(

    (resolve, reject) => {

      if(!username || !password)
        return reject({error: 'missing_parameter'});

        // object that will be returned from the API
        // it's a messy way to do it
        // will fix in the future

        var returned = {

          success: true,
          sessionid: '',
          username: username,
          id: '',
          mail: '',
          verified: ''

        }


      mysql.query("SELECT * FROM Users WHERE BINARY username = ?", [username])
        .then(row => {

          if(row.length == 0)
            return reject([{error: 'does_not_exist'}, 404]);

          var hash = row[0].password;
          returned.id = row[0].userid;
          returned.mail = row[0].email;
          returned.verified = row[0].verified;

          // utils.verify is the promisified version of bcrypt.verify.

          return utils.verify(hash, password);

        }).then(success => {

          return utils.genSession(returned.id);

        })

        .then(stuff => {

          returned.sessionid = stuff;

          setTimeout(() => {

            mysql.query("DELETE FROM Sessions WHERE sessionid = ?", [returned.sessionid]).then(succ => {

              console.log("Session %s has just expired!", returned.sessionid);

            }).catch(err => {

              throw err;

            })

          }, 18000000) // Session lasts 5hrs

          return resolve(returned); // finally returns the object with data in it

        })

        .catch(err => {

          return reject(err);

        })

    }

  )

}
