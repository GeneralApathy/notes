const Promise = require("promise");
const MySQL = require("../MySQL");
const bcrypt = require("bcrypt-nodejs");
const utils = require("./Utils");
const random = require("randomstring");
const fs = require("fs");

var mysql = new MySQL();
var config  = fs.readFileSync('config.json', 'utf8');
config = JSON.parse(config);



module.exports.verify = (email, code) => {

  return new Promise(

    (resolve, reject) => {

      console.log(email, code)

      if(!email || !code)
          return reject({error: 'missing_parameter'});

      mysql.query("SELECT * FROM Verifications WHERE BINARY mail = ? AND BINARY code = ?", [email, code])
        .then(row => {

          if(row.length == 0) return({error: 'no_verification'});
          return mysql.query("UPDATE Users SET verified = 1 WHERE email = ?", [email]);

        })

        .then(row => {

          return mysql.query("DELETE FROM Verifications WHERE BINARY code = ? AND mail = ?", [code, email]);

        })

        .then(row => {

          resolve({success: true});

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

      console.log("ok")
      if(!username || !password || !email)
        return reject([{error: 'missing_parameter'}, 403]);

      var regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      var reg = regex.test(email);
      var userRegex = /^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/;
      var usReg = userRegex.test(username)

      if(!reg)
          return reject([{error: 'bad_email'}, 400])

      if(!usReg || username.indexOf(' ') >= 1)
          return reject([{error: 'bad_username'}, 400])


      utils.checkUser(username, email)
      .then(success => {

        console.log("ok")
        return utils.hash(password);

      })

      .then(hash => {

      var userid = random.generate(64);
      console.log("ok")

      return mysql.query("INSERT INTO Users (username, password, userid, email) VALUES(?,?,?,?)",
               [username, hash, userid, email]);

    })

    .then(row => {

      var code = random.generate(32);
      var url = config.url + '/verify/' + email + '/' + code;

      utils.sendVerification(code, config.email, email, url, username).then(success => {})

      return mysql.query("INSERT INTO Verifications (mail, code) VALUES(?,?)", [email, code])

    }).then(success => {

      console.log(success)

      return resolve({success: true});

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
          return utils.verify(hash, password);

        }).then(success => {

          return utils.genSession(returned.id);

        })

        .then(stuff => {

          returned.sessionid = stuff;

          return resolve(returned);

        })

        .catch(err => {

          return reject(err);

        })

    }

  )

}
