$(document).on('click', '.delete', function(){

  del($(this).attr("url"), $(this))

});

$(document).on('click', '.dl', function(){

  download($(this).attr("url"));

})

$(document).ready(function(){

  var togg = 0;
  var togg1 = 0;
  var togg2 = 0;

  $("#create").hide();
  $("#class_creation").hide();
  $("#class_join").hide();
  $(".class_created").hide();

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

  $("#join_class").submit(function(e){

    e.preventDefault();
    var key = $("#key_").val().trim();
    joinClass(key)
      .then(stuff => {

        console.log(stuff)
        $("#operation").html("Sei entrato nella classe <b>" + stuff.name + "</b>")
        $("#url").html("<a style='color: black' href='https://appunti.emilianomaccaferri.com/class/"+stuff.url+"'>Link alla classe (che se lo clicchi non funziona)</a>")
        $("#key").html("<b>Ok bene, ora devo fare il resto della roba</b>")
        $(".class_created").slideDown();

      })

      .catch(function(err){

        if(err.status == 404)
          alert("Codice invalido...")
        else
          alert("Ti sei già registrato a questa classe.")

      })

  })

  $("#sendClass").submit(function(e){

    e.preventDefault();
    var name = $("#classname").val().trim();
    createClass(name)
      .then(stuff => {

        $("#operation").html("Hai creato la classe <b>" + name + "</b>")
        $("#url").html("<a style='color: black' href='https://appunti.emilianomaccaferri.com/class/"+stuff.url+"'>Link alla classe</a>")
        $("#key").html("<b>Key della classe: "+stuff.key+"</b>")
        $(".class_created").slideDown();

      })

      .catch(err => {

        console.log(err)
        alert("Errore imprevisto...")

      })

  })

  $("#write").click(function(){
    if(!togg){
      $("#create").slideDown();
      togg = 1;
    }else{
      $("#create").slideUp();
      togg = 0;
    }
  })

  $("#class").click(function(){
    if(!togg){
      $("#class_creation").slideDown();
      togg1 = 1;
    }else{
      $("#class_creation").slideUp();
      togg1 = 0;
    }

  })

  $("#join").click(function(){
    if(!togg){
      $("#class_join").slideDown();
      togg2 = 1;
    }else{
      $("#class_join").slideUp();
      togg2 = 0;
    }

  })

})
