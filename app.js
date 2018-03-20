const http = require("http");
const express = require("express");
const app = express();
app.server = http.createServer(app);
const path = require("path");
const fs = require("fs");
const textract = require("textract");
const _ = require("lodash");

app.listen(3000);
console.log("app is listen on port:", 3000);

var candidate_gender_female = ['female', 'kumari'],
    candidate_gender_male = ['male', 'kumar'],
    key_skills = ['php', 'js', 'javascript', 'html', 'jquery'],
    qualification = ['b.tech', 'mca', 'bca'],
    traning = ['traning', 'internship']

app.post("/upload/:pathname", function(req, res) {
    let filename = path.basename(req.params.pathname);
    filename = path.resolve(`./uploads`, filename);
    let dst = fs.createWriteStream(filename);
    req.pipe(dst);
    dst.on('drain', function() {
        req.resume();
    });
    req.on('end', function() {
        textract.fromFileWithPath(filename, function(error, text) {
            let skills = _.filter(key_skills, (filtered_data) => {
                return text.match(new RegExp(filtered_data, 'gi'))
            })
            let male_gender = _.filter(candidate_gender_male, (filtered_data) => {
                return text.match(new RegExp(filtered_data, 'gi'))
            }).length

            let female_gender = _.filter(candidate_gender_female, (filtered_data) => {
                return text.match(new RegExp(filtered_data, 'gi'))
            }).length
            let qualifications = _.filter(qualification, (filtered_data) => {
                return text.match(new RegExp(filtered_data, 'gi'))
            })
            let gender = (male_gender > 0) ? 'male' : (female_gender > 0 ? 'female' : "")
            fs.unlink(filename, function() {
                let final_response = {
                    skills: skills,
                    gender: gender,
                    qualification: qualifications,
                    dob: text.match(/\d{2}([\/.-])\d{2}\1\d{4}/g)
                }
                res.json({ data: final_response });
            })
        })

    })
})
module.exports = app;