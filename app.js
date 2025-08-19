

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require("cors");
const bodyParser = require('body-parser');

var app = express();
app.use(cors()); //permite todas las solicitudes de cualquier origen

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// 🔥 MIDDLEWARE PARA JSON Y URL-ENCODED (ANTES DE RUTAS)
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

const sequelize = require("./database/connect");

// 🆕 CARGAR RELACIONES DE MODELOS
require('./models/associations');

app.use(logger('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 🔥 SERVIR ARCHIVOS ESTÁTICOS DE UPLOADS
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ RUTAS EXISTENTES (sin cambios)
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

var calendarsRouter = require("./routes/calendars.routes");
app.use("/calendars",calendarsRouter);

var cashClosingsRouter = require("./routes/cash_closings.routes");
app.use("/cash_closings",cashClosingsRouter);

var uploadRouter = require("./routes/upload.routes");
app.use("/image",uploadRouter);

// 🆕 RUTAS ADICIONALES (si existen los archivos)
// Verificar si estos archivos existen antes de usarlos
try {
  var paymentsRouter = require("./routes/payments.routes");
  app.use("/payments", paymentsRouter);
} catch (error) {
  console.log('ℹ️ payments.routes no encontrado, omitiendo...');
}

try {
  var calendarRoutes = require("./routes/calendar");
  app.use("/calendars", calendarRoutes);
} catch (error) {
  console.log('ℹ️ calendar routes no encontrado, omitiendo...');
}

try {
  var statisticsRoutes = require("./routes/statistics");
  app.use("/statistics", statisticsRoutes);
  app.use("/cash-closings", statisticsRoutes); // Reutiliza statistics para cash-closings
} catch (error) {
  console.log('ℹ️ statistics routes no encontrado, omitiendo...');
}

try {
  const uploadRoutes = require('./routes/uploadRoutes');
  app.use('/api/upload', uploadRoutes);
} catch (error) {
  console.log('ℹ️ uploadRoutes no encontrado, omitiendo...');
}

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