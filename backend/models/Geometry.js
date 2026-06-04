const mongoose = require("mongoose");

const GeometrySchema = new mongoose.Schema({
   type: {
      type: String,
      required: true,
   },
   points: [
      {
         x: Number,
         y: Number,
         z: Number,
      },
   ],
   height: {
      type: Number,
      default: 0,
   },
});

module.exports = mongoose.model("Geometry", GeometrySchema);
