const express = require("express");
const mongoose = require("mongoose");
const User = mongoose.model("User");
const Company = mongoose.model("Company");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const SALTROUNDS = 10;

const MY_SECRET_KEY = process.env.SECRET_KEY;

router.post("/signup", async (req, res) => {
  const created_at = new Date().getTime();
  const { first_name, last_name, email, password, job_title, phone } = req.body;
  const avatar = "Default image uri";

  //Hashing the password
  bcrypt.hash(password, SALTROUNDS, async (err, hashedPass) => {
    if (err) {
      console.log("There was an error with hashing the pass : \n");
      console.log(err);
    }

    try {
      //Building the new user
      const user = new User({
        first_name: first_name,
        last_name: last_name,
        email: email,
        password: hashedPass,
        job_title: job_title,
        phone: phone,
        avatar: avatar,
        created_at: created_at,
      });

      //Building the company managed by this user
      const company = new Company({
        name: `${first_name} ${last_name}'s Company`,
        avatar:
          "https://i2.wp.com/www.iedunote.com/img/23559/what-is-a-company-scaled.jpg?fit=2560%2C1696&quality=100&ssl=1",
        city: "",
        address: "",
        state: "",
        zip: "",
        company_phone: "",
        company_email: "",
        website: "",
        primary_contact_name: `${first_name} ${last_name}`,
        primary_contact_phone: phone,
        primary_contact_job_title: job_title,
        primary_contact_id: user._id,
        created_at: created_at,
      });

      // insert for the new company the id of the user-manager
      company.managers.push(mongoose.Types.ObjectId(user._id));

      // insert for the new user the id of the managed company
      user.companies.push(mongoose.Types.ObjectId(company._id));

      await company.save();
      await user.save();

      const token = jwt.sign({ userId: user._id }, MY_SECRET_KEY);
      res.send({ token, user });
    } catch (err) {
      return res.status(422).send(err.message);
    }
  });
});

router.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(422).send({ error: "Must provide email and password" });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).send({ error: "Invalid email" });
  }

  //check if the password is correct
  if (user && bcrypt.compareSync(password, user.password)) {
    const token = jwt.sign({ userId: user._id }, MY_SECRET_KEY);
    res.status(200).send({ user: user, token: token });
  } else {
    res.status(401).send("Invalid password or email");
  }
});

module.exports = router;
