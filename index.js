const Router = require("./lib/Router");
const fs = require("fs");

var config  = fs.readFileSync('config.json', 'utf8');
var router = new Router(config);

router.init();
