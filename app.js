var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require("cors");

var app = express();
app.use(cors()); //permite todas las solicitudes de cualquier origen
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');


const sequelize = require("./database/connect");


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const routes = [
  { path: "/api", router: require("./routes/auth.routes") },
  { path: "/companies", router: require("./routes/companies.routes") },
  { path: "/users", router: require("./routes/users.routes") },
  { path: "/cities", router: require("./routes/cities.routes") },
  { path: "/bank_accounts", router: require("./routes/bank_accounts.routes") },
  { path: "/fields", router: require("./routes/fields.routes") },
  { path: "/schedules", router: require("./routes/schedules.routes") },
  { path: "/calendars", router: require("./routes/calendars.routes") },
  { path: "/cash_closings", router: require("./routes/cash_closings.routes") },
];

routes.forEach(route => {
  app.use(route.path, route.router);
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
