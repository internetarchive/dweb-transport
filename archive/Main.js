
// simple archive.org website demo  Node.js server

// It requires Docker, since it requires node v4+ and thus xenial or mac (to use ES6 natively below).
// It can be run on linux or mac.

// To setup, build, and run -- from this same subdir:
//   ./run.sh;

//
const hostname = '127.0.0.1';
const port = 3000; // use 80 if root/docker, 3000 if out of docker/nonroot

var express = require('express');
var app = express();

// handlebars for anything ending with .html
//var hbs = require('express-handlebars');
//app.engine('html', hbs({ extname: 'html' }));
//app.set('view engine', 'html');


// serve static content via express!
const DOCROOT=__dirname + '/../../';
app.use('/includes/', express.static(DOCROOT + 'includes'));
app.use('/images/',   express.static(DOCROOT + 'images'));
app.use('/jw/',       express.static(DOCROOT + 'jw'));

app.listen(port);
console.log(`Server running at http://${hostname}:${port}/`);

require('babel-core/register')({
  presets: ['es2015', 'react']  // so we can syntax parse Nav.js next!
});


var ReactDOMServer = require('react-dom/server');
var React = require('react');
var ReactDOM = require('react-dom');
var Nav = require('./Nav').default;
var Search = require('./Search').default;


app.get('/*', (req, res) => {
  //res.setHeader('Content-Type', 'text/html');
  res.statusCode = 200;

  //ARCHIVE-BROWSER Note in the browser version, this is moved to the .html file
  var htm = `
<script src="https://archive.org/includes/jquery-1.10.2.min.js" type="text/javascript"></script>
<script src="https://archive.org/includes/bootstrap.min.js" type="text/javascript"></script>
<link href="https://archive.org/includes/archive.min.css?v=503df4f" rel="stylesheet" type="text/css">
<script>var archive_setup=[]</script>
<script src="https://archive.org/includes/node_modules/react/dist/react.js?v=503df4f" type="text/javascript"></script>
<script src="https://archive.org/includes/node_modules/react-dom/dist/react-dom.js?v=503df4f" type="text/javascript"></script>
<script src="https://archive.org/includes/archive.min.js" type="text/javascript"></script>

<body class="navia ia-module tiles">
  <a href="#maincontent" class="hidden-for-screen-readers">Skip to main content</a>
`;
   htm += `
<script>
  $(function(){ $('.navbar [data-toggle="tooltip"]').tooltip({}); });
</script>
  `;


  if (req.url===''  ||  req.url==='/'  ||  req.url.startsWith('/index.php')){
    s = Search.home();
    s.fetch().then(() => s.render(res, htm));
  }


  var query = req.url.match(/^\/search.php\?query=(.*)/);
  if (query){
    s = new Search({query:query[1]});
    s.fetch().then(() => s.render(res, htm)); //TODO-DETAILS note doesnt send banner, check works when banner empty
  }


  var id = req.url.match(/^\/details\/(.*)/);
  if (id){
    var Details = require('./Details').default;
    //ARCHIVE-BROWSER Note the return value appears to be irrelevant the result is sent direct to "res"
    return new Details(res, htm, id[1]);
  }



  htm +=  ReactDOMServer.renderToStaticMarkup(new Nav('<div class="well">Node.js says Hai World</div>').render());
  res.end(htm);
});
