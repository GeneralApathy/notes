var User = function(username, email, userid, sessionid){

  // used for memorizing the scope of 'this'
  var self = this;

  self.username = username;
  self.email = email;
  self.sessionid = sessionid;
  self.id = userid;
  self.logged = false;

  var self = this;

  self.isLogged = function(){

    return self.logged;

  }

  self.createSession = function() {

    return new Promise(

      function(resolve, reject){

        $.Storage.set({

          "username": self.username,
          "email": self.email,
          "id": self.id,
          "sessionid": self.sessionid

        });
        return resolve(true)

      }

    )

  }

  self.getInfo = function(){

    return [self.username, self.email, self.id, self.sessionid];

  }

}
