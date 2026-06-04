const express = require("express");
const router = express.Router();
const Geometry = require("../models/Geometry");

router.post("/", async (req, res) => {
   try {
      const geometry = new Geometry(req.body);

      await geometry.save();

      res.json(geometry);
   } catch (error) {
      res.status(500).json(error);
   }
});

router.get("/", async (req, res) => {
   try {
      const geometries = await Geometry.find();

      res.json(geometries);
   } catch (error) {
      res.status(500).json(error);
   }
});

router.get("/:id", async (req, res) => {
   try {
      const geometries = await Geometry.findById(req.params.id);

      res.json(geometries);
   } catch (error) {
      res.status(500).json(error);
   }
});

router.delete("/:id", async (req, res) => {
   try {
      await Geometry.findByIdAndDelete(req.params.id);

      res.json({
         success: true,
      });
   } catch (error) {
      res.status(500).json(error);
   }
});

router.put("/:id", async (req, res) => {
   try {
      const geometry = await Geometry.findByIdAndUpdate(req.params.id, req.body, {
         new: true,
      });

      res.json(geometry);
   } catch (error) {
      res.status(500).json(error);
   }
});

module.exports = router;
