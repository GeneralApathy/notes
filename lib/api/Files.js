const Promise = require("promise");
const fs = require("fs");
const crypto = require("crypto");
const random = require("randomstring");
const MySQL = require("../MySQL");
const utils = require("./Utils")

var readline = require("readline");
var stream = require("stream");

var mysql = new MySQL();

var config  = fs.readFileSync('config.json', 'utf8');
config = JSON.parse(config);

module.exports.delete = (filename) => {

  return new Promise(

    (resolve, reject) => {

      fs.stat('./files/' + filename, (err, stats) => {

        if(err) return reject([{error: 'file_not_found'}, 404]);

        mysql.query("DELETE FROM Public WHERE url = ?", [filename])

          .then(row => {

            if(row.length == 0)
              return reject([{error: 'file_not_found'}, 404]);

            fs.unlink('./files/' + filename, (err) => {

              if(err) return reject([{error: 'fatal'}, 500])

              return resolve({success: true})

            })

          }).catch(err => {

            return reject([{error: 'fatal'}, 500]);

          })

      })

    }

  )

}

module.exports.all = (userid, max) => {

  var stufferoni = [];

  return new Promise(

    (resolve, reject) => {

      if(isNaN(max)){

        mysql.query("SELECT * FROM Public WHERE author = ?", [userid])
          .then(rows => {

            for(row in rows){

              stufferoni.push(rows[row]);

            }

            return resolve(stufferoni);

          })

          .catch(err => {

            return reject([{error: 'fatal'}, 500]);

          })

      }else{

        mysql.query("SELECT * FROM Public WHERE author = ? ORDER BY ID DESC LIMIT " + max, [userid, max]) // using a variable in such a way (since is pre-controlled before) is not unsafe
          .then(rows => {

            for(row in rows){

              stufferoni.push(rows[row]);

            }

            return resolve(stufferoni);

          })

          .catch(err => {

            console.log(err)
            return reject([{error: 'fatal'}, 500]);

          })

      }

    }

  )

}

module.exports.appendToFile = (file, content) => {

  return new Promise(

    (resolve, reject) => {

        var key = config.aes
        var inp = fs.createReadStream("./files/" + file + ".ciocci");
        fs.createReadStream("./files/" + file + ".ciocci").pipe(fs.createWriteStream("./files/backup" + file + ".backup"));
        var decrypt = crypto.createDecipher('aes-256-cbc', key);
        var decrypted = fs.createWriteStream('./files/temp/' + file + '.unencrypted');

        inp.pipe(decrypt).pipe(decrypted);

        decrypted.on('finish', () => {

          var buffer = Buffer.from(content, 'utf-8');
          //var read = fs.createReadStream(buffer);
          var toFile = fs.createWriteStream('./files/temp/' + file + '.unencrypted', {flags: 'w'});
          toFile.write(buffer)
          toFile.end()
          toFile.on('finish', () => {

            console.log("ciao")
            var key = config.aes,
                cipher = crypto.createCipher('aes-256-cbc', key),
                unen = fs.createReadStream('./files/temp/' + file + '.unencrypted'),
                out = fs.createWriteStream('./files/' + file + '.ciocci');

                unen.pipe(cipher).pipe(out);

                out.on('finish', () => {

                  fs.unlink('./files/temp/' + file, (err) => {

                    return resolve({success: true});

                  });

                })

          })

        })


    }

  )

}

module.exports.checkFile = (type, url) => {

  return new Promise(

    (resolve, reject) => {

      switch(type){

        case 'public':

          console.log(url)
          mysql.query("SELECT * FROM Public WHERE url = ?", [url]).then(row => {
            console.log(row.length)
            if(row.length == 0)
              return reject([{error: 'file_not_found'}, 404]);

            return resolve({

              success: true,
              author: row[0].author

            })

          })

        break;

        default:
          return reject([{error: 'invalid_file_type'}, 409]);

      }

    }

  )

}

module.exports.read = (url) => {

  return new Promise(

    (resolve, reject) => {

      var key = config.aes
      var inp = fs.createReadStream("./files/" + url + ".ciocci");

      var decrypt = crypto.createDecipher('aes-256-cbc', key);
      var decrypted = fs.createWriteStream('./files/temp/' + url + '.unencrypted');

      inp.pipe(decrypt).pipe(decrypted);

      decrypted.on('finish', () => {

        var input = fs.createReadStream('./files/temp/' + url + '.unencrypted');
        var outstream = new stream;
        var rl = readline.createInterface(input, outstream);

        var content = '';

        rl.on('line', (line) => {

          content += line;

        });

        rl.on('close', () => {

            fs.unlink('./files/temp/' + url + '.unencrypted', (err) => {})

          return resolve({

            success: true,
            content: content

          })

        })

      })

    }

  )

}

module.exports.createPublic = (title, author) => {

  return new Promise(

    (resolve, reject) => {

      var n = title + '-' + random.generate(16);
      var url = random.generate(64);
      utils.emptyFile(n)
        .then(success => {

          var key = config.aes,
              cipher = crypto.createCipher('aes-256-cbc', key),
              unen = fs.createReadStream('./files/upload/' + n),
              out = fs.createWriteStream('./files/' + url + '.ciocci');

              unen.pipe(cipher).pipe(out);

              out.on('finish', function(){

                fs.unlink('./files/upload/' + n, (err) => {

                  return mysql.query("INSERT INTO Public (author, url, title) VALUES(?,?,?)", [author, url, title]);

                });

              })

        })

        .then(succ => {

          return resolve({

            success: true,
            url: url

          })

        })

        .catch(err => {

          return reject([{error: err}, 500]);

        })

    }

  )

}
