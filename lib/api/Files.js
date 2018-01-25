const Promise = require("promise");
const fs = require("fs");
const crypto = require("crypto");
const random = require("randomstring");
const MySQL = require("../MySQL");
const utils = require("./Utils")
const pandoc = require("node-pandoc");
const path = require("path");

var readline = require("readline");
var stream = require("stream");

var mysql = new MySQL();

var config  = fs.readFileSync('config.json', 'utf8');
config = JSON.parse(config);

module.exports.convert = (filename, to) => {

  return new Promise(

    (resolve, reject) => {

      fs.stat('./files/' + filename + '.ciocci', (err) => {

        if(err)
          return reject([{error: 'file_not_found'}, 404]);

        var types = ['pdf', 'docx'];

        if(!types.includes(to))
          return reject([{error: 'unsupported_type'}, 409])

        exports.read(filename).then(success => {

          var content = success.content;
          var args = '-f html -t docx -o ./files/'+filename+'.docx';

          pandoc(content, args, (err, result) => {

            if(err)
                return reject([{error: 'fatal'}, 500]);

            var filepath = path.join(__dirname, '/../../files/'+filename+'.docx');
            return resolve(filepath);

          })

        }).catch(err => {

          return reject(err);

        })

      })

    }

  )

}

module.exports.delete = (filename) => {

  return new Promise(

    (resolve, reject) => {

      fs.stat('./files/' + filename + ".ciocci", (err, stats) => {

        console.log(filename)

        if(err) return reject([{error: 'file_not_found'}, 404]);

        mysql.query("DELETE FROM Public WHERE url = ?", [filename])

          .then(row => {

            console.log(rows)

            if(row.length == 0)
              return reject([{error: 'file_not_found'}, 404]);

            fs.unlink('./files/' + filename + ".ciocci", (err) => {

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

        mysql.query("SELECT * FROM Public WHERE author = ? ORDER BY ID DESC", [userid])
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

        var timeout = 15;
        fs.stat('./files/temp/' + file + '.deciocciato', (err, stats) => {

          if(stats){

            timeout++; // safe to write, so if the file exists we add +1 minute so it doesn't get deleted in the meanwhile
            var existing = fs.createWriteStream('./files/temp/' + file + '.deciocciato', {flags: 'w'});
            var buf = Buffer.from(content, 'utf-8');
            existing.write(buf);
            existing.end();

            existing.on('finish', () => {
              timeout--;

                return resolve({

                  success: true

                })

            })

          }

          var key = config.aes
          var inp = fs.createReadStream("./files/" + file + ".ciocci");
          fs.createReadStream("./files/" + file + ".ciocci")
            .pipe(fs.createWriteStream("./files/backup/" + file + ".backup")); // creating a backup copy, just for safetey, if anything happens during the decryption process
          var decrypt = crypto.createDecipher('aes-256-cbc', key);
          var decrypted = fs.createWriteStream('./files/temp/' + file + '.deciocciato');

          inp.pipe(decrypt).pipe(decrypted);

          decrypted.on('finish', () => {

            var buffer = Buffer.from(content, 'utf-8');
            //var read = fs.createReadStream(buffer);
            var toFile = fs.createWriteStream('./files/temp/' + file + '.deciocciato', {flags: 'w'});
            toFile.write(buffer)
            toFile.end()
            toFile.on('finish', () => {

              var key = config.aes,
                  cipher = crypto.createCipher('aes-256-cbc', key),
                  unen = fs.createReadStream('./files/temp/' + file + '.deciocciato'),
                  out = fs.createWriteStream('./files/' + file + '.ciocci');

                  unen.pipe(cipher).pipe(out);

                  out.on('finish', () => {

                    setTimeout(() => {

                      var readable = fs.createReadStream('./files/temp/' + file + '.deciocciato');
                      var out = new stream;
                      var rl = readline.createInterface(readable, out)

                      var content = '';

                      rl.on('line', (line) => {

                        content += line;

                      });

                      rl.on('close', () => {

                        var key = config.aes,
                            cipher = crypto.createCipher('aes-256-cbc', key),
                            unen = fs.createReadStream('./files/temp/' + file + '.deciocciato'),
                            out = fs.createWriteStream('./files/' + file + '.ciocci');

                        unen.pipe(cipher).pipe(out);

                        out.on('finish', () => {

                          console.log("Cache expired for %s", file);
                          fs.unlink('./files/temp/' + file + '.deciocciato', (err) => {

                            if(err) throw err;

                          })

                        })

                      })

                    }, timeout * 60000) // 15 minutes caching (and more)

                    //fs.unlink('./files/temp/' + file, (err) => {

                      return resolve({
                        success: true
                      });

                    //});

                  })

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
              author: row[0].author,
              title: row[0].title

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

      fs.stat("./files/" + url + ".ciocci", (err, stats) => {

        if(err)
          return reject([{error: 'file_not_found'}, 404])

        fs.stat("./files/temp/" + url + ".deciocciato", (err, stats) => {

          if(stats){
            console.log(stats)
            var readable = fs.createReadStream('./files/temp/' + url + '.deciocciato');
            var out = new stream;
            var rl = readline.createInterface(readable, out)

            var content = '';

            rl.on('line', (line) => {

              content += line;

            });

            rl.on('close', () => {

              return resolve({

                success: true,
                content: content

              })

            })

            console.log("Sto leggendo da cache")
            return;
          }
          console.log("ok, non è deciocciato")
          var key = config.aes;
          var inp = fs.createReadStream("./files/" + url + ".ciocci");
          var decrypt = crypto.createDecipher('aes-256-cbc', key);
          var decrypted = fs.createWriteStream('./files/temp/' + url + '.deciocciato');

          inp.pipe(decrypt).pipe(decrypted);

          inp.on('error', (error) => {

            console.log(error)
            return reject([{error: 'fatal'}, 500])

          })

          decrypt.on('error', (err) => {

            console.log(err)
            return reject([{error: 'fatal'}, 500])

          })

          decrypted.on('finish', () => {

            console.log("ciao")
            var input = fs.createReadStream('./files/temp/' + url + '.deciocciato');
            console.log("ciao")
            var outstream = new stream;
            var rl = readline.createInterface(input, outstream);

            var content = '';

            rl.on('line', (line) => {

              content += line;

            });

            rl.on('close', () => {

              console.log("Url letto: %s", url)

              setTimeout(() => {

                fs.unlink('./files/temp/' + url + '.deciocciato', (err) => {

                  console.log("Cache exipred for %s", url)

                })

              }, 15 * 60000)

                //fs.unlink('./files/temp/' + url + '.deciocciato', (err) => {

                    return resolve({

                      success: true,
                      content: content

                    //})

               })

            })

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
