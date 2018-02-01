const MySQL = require("../MySQL");
const Promise = require("promise");
const random = require("randomstring");

var mysql = new MySQL();

var Classes = function(){

  this.count = 0;

  mysql.query("SELECT * FROM Classes")
    .then(rows => {

      this.count = rows.length;

    })

    .catch(err => {

      throw new Error("Error while initializing Classes: " + err);

    })

}

var isUserInClass = (userid, classurl) => {

  return new Promise(

    (resolve, reject) => {

      mysql.query("SELECT * FROM Classes_Users WHERE userid = ? AND classurl = ?", [userid, classurl])
        .then(success => {

          if(success.length == 0)
            return resolve(false);

          return resolve(true);

        })

    }

  )

}

Classes.prototype.addUserToClass = (userid, key) => {

  return new Promise(

    (resolve, reject) => {

      var classname,
          url;
      mysql.query("SELECT * FROM Classes WHERE class_key = ?", [key])
        .then(row => {

          if(row.length == 0) return reject([{success: false, error: 'no_classes_found'}, 404]);

          classname = row[0].classname;
          url = row[0].classurl;

          console.log(classname, url)
          return isUserInClass(userid, url)

        })

        .then(yes => {

          if(yes)
            return reject([{success: false, error: 'user_already_in'}, 409])

          console.log(classname, url)
          return mysql.query("INSERT INTO Classes_Users (userid, classurl, classname) VALUES(?,?,?)", [userid, url, classname]);

        })

        .then(success => {

          console.log("Ok")
          return resolve({

            success: true,
            name: classname,
            url: url

          })

        })

        .catch(err => {

          console.log(err)
          return reject([

            {
              success: false,
              error: 'fatal'
            },

            500

          ])

        })

    }

  )

}

var files = (classurl) => {

  return new Promise(

    (resolve, reject) => {

      mysql.query("SELECT * FROM Class WHERE classurl = ?", [classurl])
        .then(rows => {

          return resolve({
            success: true,
            count: rows.length

          })

        })

        .catch(err => {

          return reject({

            success: false,
            error: 'fatal'

          }, 500)

        })

    }

  )

}

var members = (classurl) => {

  return new Promise(

    (resolve, reject) => {

      mysql.query("SELECT * FROM Classes_Users WHERE classurl = ?", [classurl])
        .then(rows => {

          return resolve({
            success: true,
            count: rows.length
          })

        })

        .catch(err => {

          return reject({

            success: false,
            error: 'fatal'

          }, 500)

        })

    }

  )

}

Classes.prototype.get = (user) => {

  console.log(this)
  var memb = [];
  var fil = [];
  return new Promise(

    (resolve, reject) => {
      mysql.query("SELECT * FROM Classes_Users WHERE userid = ?", [user])
        .then(rows => {
          var classes = [];
          if(rows.length == 0){
            return resolve({
              success: true,
              classes: []
            })
          }
          for(row in rows){
            classes.push({
              url: rows[row].classurl,
              classname: rows[row].classname
            })
            memb.push(members(rows[row].classurl));
            fil.push(files(rows[row].classurl))
          }

          Promise.all(memb)
            .then(everything => {

              for(thing in everything)
                classes[thing].members = everything[thing].count;

              return Promise.all(fil)

            })
            .then(everything => {

              for(thing in everything)
                classes[thing].files = everything[thing].count;

              return resolve({
                success: true,
                classes: classes
              })

            })

        })

        .catch(err => {

          console.log(err)
          return reject({
            success: false,
            error: 'fatal'
          }, 500)

        })

    }

  )

}

Classes.prototype.number = () => {

  var self = this;
  return self.count;

}

Classes.prototype.addClass = (author, classname) => {

  return new Promise(

    (resolve, reject) => {

      var self = this;
      var classurl = random.generate(64);
      var classkey = random.generate(24);
      mysql.query("INSERT INTO Classes (classurl, classname, class_key) VALUES(?,?,?); INSERT INTO Admins (userid, classurl) VALUES(?,?); INSERT INTO Classes_Users (userid, classurl, classname) VALUES(?,?,?)",
        [classurl, classname, classkey, author, classurl, author, classurl, classname])
          .then(success => {

            self.count++;
            return resolve({

              success: true,
              key: classkey,
              name: classname,
              url: classurl

            })

        })
        .catch(err => {

          console.log(err)
          return reject([
            {
              success: false,
              error: 'fatal'
            }, 500
          ])

        })
    }

  )

}

module.exports = Classes;
