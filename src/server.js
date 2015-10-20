var compression = require('compression')
var express = require('express')
var app = express()

app.use(compression())
app.use(express.static('./assets'))
app.use(express.static('./node_modules/purecss/build'))
app.use(express.static('./node_modules/es5-shim'))
app.use(express.static('./node_modules/es6-shim'))
app.use(express.static('./node_modules/jquery/dist'))
app.use(express.static('./node_modules/cookies-js/dist'))
app.use(express.static('./node_modules/es6-promise/dist'))
app.use(express.static('./node_modules/fetch-jsonp/build'))
app.use(express.static('./node_modules/jquery.transit/'))

app.get('/*', function (req, res) {
    res.sendFile('./assets/index.html' , { root : '.'})
})

var PORT = process.env.OPENSHIFT_NODEJS_PORT || 3000
var IP_ADDRESS = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1'
app.listen(PORT, IP_ADDRESS, function () {
    console.log( "Listening on " + IP_ADDRESS + ", port " + PORT )
});

// TODO: add favicon