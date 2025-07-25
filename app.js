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

var authRoutes = require("./routes/auth.routes");
app.use("/api",authRoutes);

var companiesRouter = require("./routes/companies.routes");
app.use("/companies",companiesRouter);

var usersRouter = require("./routes/users.routes");
app.use("/users",usersRouter);

var citiesRouter = require("./routes/cities.routes");
app.use("/cities",citiesRouter);

var bankAccountsRouter = require("./routes/bank_accounts.routes");
app.use("/bank_accounts",bankAccountsRouter);

var fieldsRouter = require("./routes/fields.routes");
app.use("/fields",fieldsRouter);

var schedulesRouter = require("./routes/schedules.routes");
app.use("/schedules",schedulesRouter);


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
