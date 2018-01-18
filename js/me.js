var del = function(filename, object){

  return new Promise(

    function(resolve, reject){

      $.post("https://appunti.emilianomaccaferri.com/api/delete", {

        author: $.Storage.get("id"),
        sessionid: $.Storage.get("sessionid"),
        filename: filename

      })

      .done(function(data){

        $(object).remove();

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

        for(note in data){

          $("#appendable").append("<div class='item'><h1 style='font-weight: lighter;'>" + data[note].title + "<div> <a style='font-size: 0.45em !important; padding: 5px;' href='/edit/"+data[note].url+"/"+$.Storage.get("id")+"'><i class='fas fa-edit'></i></a> <a style='font-size: 0.45em !important; padding: 5px;' href='/view/"+data[note].url+"/'><i class='fas fa-eye'></i></a></div></h1></div>")

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
             "/'><i class='fas fa-eye'></i></a><a class='fag' href='/edit/" +
             data[note].url+"/"+$.Storage.get("id") +
             "'><i class='fas fa-trash-alt'></i></a></div></div>")

        }

      })

      .fail(function(err){

        $("#appendable").append("Errore nella ricezione dei tuoi appunti...");

      })

    }

  )

}

$(document).ready(function(){

  var togg = 0;

  $("#create").hide();

  /*
  <div class="item">
    <h1> Titolo </h1>
    <ul>
      <li> Dimensione: <b>1MB</b></li>
      <li> Data di upload: <b> Oggi </b> </li>
      <p> Questa è un'anteprima del file, bla bla bla bla bla bla, ciao sono un file.docx </p>
  </div>
  */

  $(".fag").on(function(){

    console.log($(this).attr("url"))

  })

  $("#createFile").submit(function(ev){

    ev.preventDefault();
    $(".loading").css({"opacity": "1"});
    var filename = $("#filename").val().trim();

    $(".send").animate({opacity: 0.8}, "fast");
    $(".send").css({"pointer-events": "none"});
    $(".loading").css({"opacity": "1"});
    $(".loading").css({"z-index": "100000"});

    $.post("https://appunti.emilianomaccaferri.com/api/createFile", {

      filename: filename,
      user: $.Storage.get("id"),
      title: filename,
      sessionid: $.Storage.get("sessionid")

    }).done(function(data){

      var url = data.url;
      window.location = "/edit/" + url + "/" + $.Storage.get("id");

    }).fail(function(err){

      alert("Errore durante lo svolgimento della tua richiesta")
      $(".send").animate({opacity: 1}, "fast");
      $(".send").css({"pointer-events": "all"});
      $(".loading").css({"opacity": "0"});
      $(".loading").css({"z-index": "-1"});

    })

  })

  $("#username").append($.Storage.get("username"))

  $("#write").click(function(){
    if(!togg){
      $("#create").slideDown();
      togg = 1;
    }else{
      $("#create").slideUp();
      togg = 0;me
    }
  })

})
