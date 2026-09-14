require("dotenv").config();

const PORT = process.env.PORT;
const express=require('express');
const app=express();
const { connectDB } = require('./db');
const cors=require('cors');
const helmet = require('helmet');
const path=require('path');

require('./model');

const morgan = require("morgan");
const fs = require("fs");


const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" }
);

app.use(morgan("combined", { stream: accessLogStream }));

const userRoutes=require('./routes/userRoutes');
const expenseRoutes=require('./routes/expenseRoutes');
const purchaseRoutes = require("./routes/purchaseRoutes");
const { cashfreeWebhook } = require("./controller/purchaseController");
const premiumRoutes = require("./routes/premiumRoutes");
const passwordRoutes = require("./routes/password");
const reportsRoutes = require("./routes/reportsRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const errorHandler = require("./middleware/errorHandler");



//middlewares

// contentSecurityPolicy and crossOriginEmbedderPolicy are disabled: the
// frontend relies on inline onclick handlers (e.g. public/js/modules/
// expenses.js) and loads Cashfree's checkout SDK plus axios/jwt-decode/
// chart.js/jsPDF from jsdelivr and cdnjs. A default/strict CSP or COEP
// would block those and break login, expenses, and the premium checkout
// flow. The rest of Helmet's headers (X-Content-Type-Options, HSTS,
// X-Frame-Options, etc.) stay on. Tightening CSP to an explicit allowlist
// is left for later hardening, once it can be tested against the full
// Cashfree checkout flow without risking breaking payments.
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

// Scoped CORS: the frontend is served from this same Express app
// (express.static below) so it never actually needs cross-origin access,
// but FRONTEND_URL lets a separately-hosted/dev frontend be allowlisted
// explicitly instead of allowing any origin. JWT is sent via an
// Authorization header, not cookies, so credentials are left off.
const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:3000";

app.use(cors({
    origin: allowedOrigin
}));

// Cashfree signs the exact raw request body. This route must be
// registered before express.json() parses the body.
app.post(
    "/purchase/webhook/cashfree",
    express.raw({ type: "application/json", limit: "1mb" }),
    cashfreeWebhook
);

app.use(express.json());
app.use(express.static('public'));
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});
app.use(express.urlencoded({extended:true}));


//routes

app.use('/users',userRoutes);
app.use('/expense',expenseRoutes);
app.use('/purchase', purchaseRoutes);
app.use("/premium", premiumRoutes);
app.use("/password", passwordRoutes);
app.use("/expense", reportsRoutes);
app.use("/budget", budgetRoutes);
app.use("/payments", paymentRoutes);

// central error handler - must be registered after all routes
app.use(errorHandler);

// connect to MongoDB and start server

connectDB().then(() => {
    console.log("Database connected");

    app.listen(PORT, () => {
        console.log("Server is running.");
    });
})
.catch((err)=>{
    console.log(err);
});


