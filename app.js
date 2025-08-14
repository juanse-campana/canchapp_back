var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require("cors");
const bodyParser = require('body-parser');
// 🔥 REMOVER MULTER GENÉRICO - ya está configurado en uploadConfig.js

var app = express();
app.use(cors()); //permite todas las solicitudes de cualquier origen

// 🔥 REMOVER CONFIGURACIÓN CONFLICTIVA DE MULTER
// const upload = multer({ 
//   dest: 'uploads/',
//   limits: {
//     fileSize: 10 * 1024 * 1024, // 10MB máximo
//   }
// });

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// 🔥 REMOVER MIDDLEWARE GENÉRICO DE MULTER
// app.use(upload.any());

// 🔥 MIDDLEWARE PARA JSON Y URL-ENCODED (ANTES DE RUTAS)
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

const sequelize = require("./database/connect");

// 🆕 CARGAR RELACIONES DE MODELOS (NUEVA LÍNEA)
require('./models/associations');

app.use(logger('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 🔥 SERVIR ARCHIVOS ESTÁTICOS DE UPLOADS (MUY IMPORTANTE)
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

var paymentsRouter = require("./routes/payments.routes");
app.use("/payments", paymentsRouter);

// 🔥 RUTAS DE CALENDAR CON MULTER CONFIGURADO
var calendarRoutes = require("./routes/calendar");
app.use("/calendars", calendarRoutes);

var statisticsRoutes = require("./routes/statistics");
app.use("/statistics", statisticsRoutes);
app.use("/cash-closings", statisticsRoutes); // Reutiliza statistics para cash-closings

// 🔥 RUTAS DE UPLOAD (MOVIDO DESPUÉS DE CALENDAR)
const uploadRoutes = require('./routes/uploadRoutes');
app.use('/api/upload', uploadRoutes); // 🔥 AGREGAR PREFIJO PARA EVITAR CONFLICTOS

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