const mysql = require("mysql");
const fs = require("fs");
const Promise = require("promise")

var config  = fs.readFileSync('config.json', 'utf8');
config = JSON.parse(config);

var MySQL = function(){

  var self = this;
  this.err;
  this.connection = mysql.createConnection({

    host: 'localhost',
    user: config.username,
    password: config.password,
    database: config.database,
    multipleStatements: true

  });

  self.connection.query("TRUNCATE Sessions", function(err, r){});
  self.connection.query("TRUNCATE Verifications", function(err, r){});
  /*self.connection.query("TRUNCATE Users", function(err, r){
      //development only

  })*/

  setInterval(function(){

      // refresh connection, so we don't have to create a connection pool
      self.connection.query("SHOW DATABASES", function(err, r){});

  }, 5000);
}

/*

  Using this type of method declaration to recycle the object that is istantiated
  every time we use it

*/

MySQL.prototype.query = function(query, args){

  return new Promise(

    (resolve, reject) => {

      this.connection.query(query, args, (err, row) => {

        if(err)
          return reject(err);

        resolve(row);

      })

    }

  )

};

module.exports = MySQL;
