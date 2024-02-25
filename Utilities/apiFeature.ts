import { Request } from "express";

import { Query } from "mongoose";
import { tourCheck } from "../Models/IToursSchema";

class APIFeatures {
  constructor(
    public query: Query<tourCheck[], tourCheck>,
    private queryString: Request,
  ) {}
  filter() {
    const queryObf = { ...this.queryString.query };
    const excludeFields = ["page", "sort", "limit", "fields"];
    //delete filed that we dont want
    excludeFields.forEach((val) => delete queryObf[val]);
    let queryStr = JSON.stringify(queryObf);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    if (this.queryString.query.sort) {
      const querySort = this.queryString.query.sort as string;
      const sortValue = querySort.split(",").join(" ");
      this.query = this.query.sort(sortValue);
    } else {
      this.query = this.query.sort("-createDate");
    }
    return this;
  }

  limitfiled() {
    if (this.queryString.query.fields) {
      const limitFiled = this.queryString.query.fields as string;

      const fieldValue = limitFiled.split(",").join(" ");

      this.query = this.query.select(fieldValue);
    } else {
      this.query = this.query.select("-__v");
    }
    return this;
  }

  pagination() {
    const pageNumber = Number(this.queryString.query.page) * 1 || 1;
    const limitSelect =
      Number(this.queryString.query.limit) * 1 || Number(process.env.LIMIT_DEFAULT);
    const skip = (pageNumber - 1) * limitSelect;
    this.query = this.query.skip(skip).limit(limitSelect);
    return this;
  }
}

export default APIFeatures;
