import app from "./app";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({ path: "./config.env" });

const DB = process.env.DATABASE?.replace("<PASSWORD>", process.env.DATABASE_PASSWORD as string);
mongoose.connect(DB as string);

app.listen(process.env.PORT || 8000, () => {
  console.log("welcome dick head");
});
