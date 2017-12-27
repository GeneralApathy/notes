verify($.Storage.get("sessionid")).then(function(success){

  console.log("session is still ok")

}).catch(function(err){

  $.Storage.remove("username");
  $.Storage.remove("sessionid");
  $.Storage.remove("id");
  $.Storage.remove("email");
  console.log("not logged");
  window.location = "/";

})
