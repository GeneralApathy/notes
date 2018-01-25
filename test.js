const files = require("./lib/api/Files");

files.convert('174cS6WUlh9GHyvATg4aZbQenRaFgTKZjYnhdQO4b0xE9g4Agnt6gTjwc1UhltmK', 'docx')
  .then(success => {

    console.log(success)

  })

  .catch(err => {

    console.log(err);

  })
