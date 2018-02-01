var joinClass = function(key){

  return new Promise(

    function(resolve, reject){

      // userid, key, sessionid

      $.post("https://appunti.emilianomaccaferri.com/api/classes/join", {

        sessionid: $.Storage.get("sessionid"),
        userid: $.Storage.get("id"),
        key: key

      })

      .done(function(data){

        return resolve(data)

      })

      .fail(function(err){

        return reject(err);

      })

    }

  )

}

var createClass = function(classname){

  return new Promise(

    function(resolve, reject){

      //userid, classname, session

      $.post("https://appunti.emilianomaccaferri.com/api/classes/add", {

        userid: $.Storage.get("id"),
        classname: classname,
        sessionid: $.Storage.get("sessionid")

      })

      .done(function(data){

        console.log(data)
        return resolve(data);

      })

      .fail(function(error){

        return reject(error);

      })

    }

  )

}

var getClasses = function(){

  return new Promise(

    function(resolve, reject){

      $.post("https://appunti.emilianomaccaferri.com/api/classes/getClasses",
      {

        sessionid: $.Storage.get("sessionid"),
        userid: $.Storage.get("id")

      })

      .done(function(data){

        var classes = data.classes;
        if(classes.length == 0)
          return $("#classes").append("<p class='warn'> Non sei iscritto ad alcuna classe </p>");

        for(classerina in data.classes){
          $("#classes").append("<div class='item'><h1>"+data.classes[classerina].classname+"</h1><ul><li> Membri: <b>"+data.classes[classerina].members+"</b></li><li> File totali: <b> "+data.classes[classerina].files+" </b> </li></ul>")
        }

      })

      .fail(function(err){

        return $("#classes").append("<p> Errore durante la ricezione della lista delle classi </p>")

      })

    }

  )

}

var download = function(filename){

  return new Promise(

    function(resolve, reject){

      $.post("https://appunti.emilianomaccaferri.com/api/download", {

        filename: filename,
        author: $.Storage.get("id"),
        sessionid: $.Storage.get("sessionid")

      })

      .done(function(data){

        console.log(data)
        console.log("streaming file . . .");
        //return resolve(true)

      })

      .fail(function(err){

        alert("Errore durante il download...");
        return resolve(err);

      })

    }

  )

}

var del = function(filename, object){

  return new Promise(

    function(resolve, reject){

      $.post("https://appunti.emilianomaccaferri.com/api/delete", {

        author: $.Storage.get("id"),
        sessionid: $.Storage.get("sessionid"),
        filename: filename

      })

      .done(function(data){

        object.parent().parent().remove();

      })

      .fail(function(err){

        alert("C'è stato un problema durante lo svolgimento della richiesta");

      })

    }

  )

}

var inPanel = function(){

  return new Promise(

    function(resolve, reject){

      $.post("https://appunti.emilianomaccaferri.com/api/viewall", {

        userid: $.Storage.get("id"),
        sessionid: $.Storage.get("sessionid"),
        max: 3

      })

      .done(function(data){

        if(data.length == 0)
          return $("#appendable").append("<p style='text-align: center;'> Sembrerebbe che tu non abbia ancora scritto documenti </p>")

        for(note in data){

          $("#appendable").append("<div class='item'><h1 style='font-weight: lighter;'>" + data[note].title + "<div> <a style='font-size: 0.45em !important; padding: 5px;' href='/edit/"+data[note].url+"/"+$.Storage.get("id")+"'><i class='fas fa-edit'></i></a> <a style='font-size: 0.45em !important; padding: 5px;' href='/view/"+data[note].url+"/'><i class='fas fa-eye'></i></a><span class='delete' url='"+data[note].url+"' style='color: white;'> <i class='fas fa-trash-alt' style='font-size: 0.45em; padding: 5px; vertical-align: middle;'></i></span><span class='dl' url='"+data[note].url+"'><i class='fas fa-download' style='font-size: 0.45em; padding: 5px; vertical-align: middle;'></i></span></div></h1></div>")

        }

      })

      .fail(function(err){

        $("#appendable").append("<p style='text-align: center;'> Errore nella ricezione dei tuoi documenti... </p>");

      })

    }

  )

}
// non ho voglia di modificare il CSS
var totalEditor = function(){

  return new Promise(

    function(resolve, reject){

      $.post("https://appunti.emilianomaccaferri.com/api/viewall", {

        userid: $.Storage.get("id"),
        sessionid: $.Storage.get("sessionid")

      })

      .done(function(data){

        for(note in data){

          $("#appendable").append(
            "<div class='other'><h1>" +
             data[note].title +
             "</h1><div class='flexbox'> <a href='/edit/" +
             data[note].url+"/"+$.Storage.get("id") +
             "'><i class='fas fa-edit'></i></a> <a href='/view/" +
             data[note].url +
             "/'><i class='fas fa-eye'></i></a><span class='dl'><i class='fas fa-download' url='"+data[note].url+"' style='font-size: 0.45em; padding: 5px; vertical-align: middle;'></i></span>"
             )

        }

      })

      .fail(function(err){

        $("#appendable").append("Errore nella ricezione dei tuoi appunti...");

      })

    }

  )

}

var total = function(){

  return new Promise(

    function(resolve, reject){

      $.post("https://appunti.emilianomaccaferri.com/api/viewall", {

        userid: $.Storage.get("id"),
        sessionid: $.Storage.get("sessionid")

      })

      .done(function(data){

        for(note in data){

          $(".container").append(
            "<div class='static'><h1 style='font-weight: lighter;'>" +
             data[note].title +
             "</h1><div class='inner'> <a href='/edit/" +
             data[note].url+"/"+$.Storage.get("id") +
             "'><i class='fas fa-edit'></i></a> <a href='/view/" +
             data[note].url +
             "/'><i class='fas fa-eye'></i></a>"
             +
              "<span class='delete' url='"+data[note].url+"' style='color: white;'> <i class='fas fa-trash-alt'></i></span>")

        }

      })

      .fail(function(err){

        $("#appendable").append("Errore nella ricezione dei tuoi appunti...");

      })

    }

  )

}
