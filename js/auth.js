var change = function(){

  return new Promise(

    function(resolve, reject){

      $(".loading").css({"opacity": "1"});
      $("#message").empty();

      var password = $("#psw").val().trim();
      var url = window.location.pathname;
      var pieces = url.split("/");
      console.log(pieces)

      $.post("https://appunti.emilianomaccaferri.com/api/changepassword",

      {

        email: pieces[2],
        code: pieces[3],
        password: password

      }

    ).done(function(data){

      $("#message").append("<p> Password aggiornata! Clicca <a href='/login'> qui </a> per loggarti </p>");
      $(".reg").animate({opacity: 1}, "fast");
      $(".reg").css({"z-index": "1000"});

    }).fail(function(data){

      $("#message").append("<p> Errore durante lo svolgimento della richiesta </p>");
      $(".reg").animate({opacity: 1}, "fast");
      $(".reg").css({"z-index": "1000"});

    })

    }

  )

}

var forgot = function(){

  return new Promise(

    function(resolve, reject){

      $(".loading").css({"opacity": "1"});
      $("#message").empty();

      var mail = $("#mail").val().trim();

      if(!mail)
        return alert("Controlla il form");

      $(".reg").animate({opacity: 0.8}, "fast");
      $(".reg").css({"z-index": "-1"});
      $(".loading").css({"opacity": "1"});
      $(".loading").css({"z-index": "100000"});

      $.post("https://appunti.emilianomaccaferri.com/api/forgot",

      {

        email: mail

      }

    ).done(function(data){

      console.log(data);

      $(".loading").css({"opacity": "0"});
      $(".loading").css({"z-index": "-1"});

      $("#message").append("<p> Controlla la tua casella postale! </p>");
      $(".reg").animate({opacity: 1}, "fast");
      $(".reg").css({"z-index": "1000"});

      return resolve(true);

    }).fail(function(data){

      var e = data.responseJSON;
      $(".loading").css({"opacity": "0"});
      $(".loading").css({"z-index": "-1"});

      console.log(e.error)
      if(e.error == "not_found"){

          $("#message").append("<p> L'email che hai inserito non esiste </p>");
          $(".reg").animate({opacity: 1}, "fast");
          $(".reg").css({"z-index": "1000"});

      }else {

        $("#message").append("<p> C'è stato un errore durante lo svolgimento della richiesta... </p>");
        $(".reg").animate({opacity: 1}, "fast");
        $(".reg").css({"z-index": "1000"});

      }

    })

    }

  )

}

var login = function(){

  return new Promise(

    function(resolve, reject){

      $(".loading").css({"opacity": "1"});
      $("#message").empty();

      var username = $("#user").val().trim(),
          password = $("#psw").val();

          if(!username || !password)
            return alert("Controlla il form");

      $(".reg").animate({opacity: 0.8}, "fast");
      $(".reg").css({"z-index": "-1"});
      $(".loading").css({"opacity": "1"});
      $(".loading").css({"z-index": "100000"});

      $.post("https://appunti.emilianomaccaferri.com/api/login",
            {

              username: username,
              password: password

          }).done(function(data){

            $(".loading").css({"opacity": "0"});
            $(".loading").css({"z-index": "-1"});
            console.log(data)

            $.Storage.set({

              "username": data.username,
              "email": data.mail,
              "id": data.id,
              "sessionid": data.sessionid

            });

            return resolve(true)

        }).fail(function(err){

          var e = err.responseJSON;
          $(".loading").css({"opacity": "0"});
          $(".loading").css({"z-index": "-1"});
          switch(e.error){

            case 'does_not_exist':
              $("#message").append("<p> L'username che hai inserito non esiste </p>");
              $(".reg").animate({opacity: 1}, "fast");
              $(".reg").css({"z-index": "1000"});
            break;

            case 'invalid_password':
              $("#message").css({"display": "block"});
              $("#message").append("<p> Password errata </p>");
              $(".reg").animate({opacity: 1}, "fast");
              $(".reg").css({"z-index": "1000"});
            break;

            default: break;

          }

        })

    }

  )

}

var register = function(){

  $("#message").empty();

  var username = $("#user").val().trim(),
      password = $("#psw").val(),
      email    = $("#email").val().trim();

      if(!username || !password || !email)
        return alert("Controlla il form");

  $(".loading").css({"opacity": "1"});
  $(".loading").css({"z-index": "100000"});
  $(".reg").animate({opacity: 0.8}, "fast");
  $(".reg").css({"z-index": "-1"});

  $.post("https://appunti.emilianomaccaferri.com/api/register",
        {

          username: username,
          password: password,
          email: email

      }).done(function(data){

        $("#message").append("<p> Registrazione completata! Controlla la tua casella di posta elettronica (controlla anche la cartella <b>spam</b>) </p>");
        $(".reg").animate({opacity: 1}, "fast");
        $(".reg").css({"z-index": "1000"});
        $(".loading").css({"opacity": "0"});
        $(".loading").css({"z-index": "-1"});

    }).fail(function(err){

      $(".loading").css({"opacity": "0"});
      $(".loading").css({"z-index": "-1"});
      var e = err.responseJSON;
      switch(e.error){

        case 'bad_email':
          $("#message").append("<p> L'email che hai inserito non è ben formattata, riprova </p>");
          $(".reg").animate({opacity: 1}, "fast");
          $(".reg").css({"z-index": "1000"});
        break;

        case 'bad_username':
          $("#message").append("<p> L'username che hai inserito non è ben formattato, riprova </p>");
          $(".reg").animate({opacity: 1}, "fast");
          $(".reg").css({"z-index": "1000"});
        break;

        case 'bad_password':
          $("#message").append("<p> La password non può contenere spazi </p>");
          $(".reg").animate({opacity: 1}, "fast");
          $(".reg").css({"z-index": "1000"});
        break;

        case 'already_exists':
          $("#message").css({"display": "block"})
          $("#message").append("<p> Username o mail già esistente </p>");
          $(".reg").animate({opacity: 1}, "fast");
          $(".reg").css({"z-index": "1000"});
        break;

        case 'password_too_short':
          $("#message").append("<p> La password che hai inserito è troppo corta </p>");
          $(".reg").animate({opacity: 1}, "fast");
          $(".reg").css({"z-index": "1000"});
        break;

        default: break;

      }

    })

}

var verify = function(sessionid){

  return new Promise(

    function(resolve, reject){

      $.get("https://appunti.emilianomaccaferri.com/api/session/" + sessionid)
        .done(function(data){

          return resolve(true);

        }).fail(function(data){

          return reject(false);

        })

    }

  )

}

$("form").submit(function() { return false; });
