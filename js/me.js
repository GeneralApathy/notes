$(document).on('click', '.delete', function(){

  del($(this).attr("url"), $(this))

});

$(document).on('click', '.dl', function(){

  download($(this).attr("url"));

})

$(document).ready(function(){

  var togg = 0;

  $("#create").hide();

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
