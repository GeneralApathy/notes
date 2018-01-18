var editFile = function(userid, content, filename){

  return new Promise(

    function(resolve, reject){

      $.post("https://appunti.emilianomaccaferri.com/api/editPublicFile", {

        user: userid,
        stuff: content,
        filename: filename,
        sessionid: $.Storage.get("sessionid")

      }).done(function(data){

        console.log(data)
        $("#time").empty();
        $("#time").append("<p> ora </p>");

      })

    }

  )

}

var init = function(){

  return new Promise(

    function(resolve, reject){

      var toolbarOptions = [
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],

        [{ 'header': 1 }, { 'header': 2 }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'direction': 'rtl' }],

        [{ 'size': ['small', false, 'large', 'huge'] }],
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

        //[{ 'color': [] }, { 'background': [] }],
        //[{ 'font': [] }],
        //[{ 'align': [] }],
        [{align: ''}, {align: 'right'}, {align: 'center'}, {align: 'justify'}],
        ['image', 'video'],
        ['clean'],                                         // remove formatting button
        ['fullscreen']
        ['clean']
      ];


      var options = {
        modules: {
          toolbar: toolbarOptions
        },
        debug: 'info',
        placeholder: 'Scrivi qualcosa...',
        readOnly: false,
        theme: 'snow'
      };
      var editor = new Quill('#editor', options);

      return resolve(editor);

    }

  )

}
