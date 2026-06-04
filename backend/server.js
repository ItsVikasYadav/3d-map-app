const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
// const testRoute = require("./routes/test");
const geometryRoutes = require("./routes/geometry");

dotenv.config({ path: "./config.env" });

const app = express();
app.use(cors());
app.use(express.json());

app.use("/geometry", geometryRoutes);

mongoose
   .connect(process.env.MONGO_URI)
   .then(() => {
      console.log("Mongo Connected");
   })
   .catch((error) => {
      console.error(error);
   });

// app.use("/test", testRoute);

app.listen(3000, () => {
   console.log("Server Running");
});
