const http = require("http");
const express = require("express");
const app = express();
app.server = http.createServer(app);
const path = require("path");
const fs = require("fs");
const textract = require("textract");
const _ = require("lodash");
app.listen(3000);
var candidate_gender_female = ['female', 'kumari'],
    candidate_gender_male = ['male', 'kumar'],
    key_skills = ['php', 'js', 'javascript', 'html', 'jquery'],
    qualification = ['b.tech', 'mca', 'bca'],
    traning = ['traning', 'internship']

app.post("/upload/:pathname", function(req, res) {
    console.log(req.params.pathname)
    var filename = path.basename(req.params.pathname);
    filename = path.resolve(`./uploads`, filename);
    console.log(filename)
    var dst = fs.createWriteStream(filename);
    req.pipe(dst);
    dst.on('drain', function() {
        console.log('drain', new Date());
        req.resume();
    });
    req.on('end', function() {
        textract.fromFileWithPath(filename, function(error, text) {
            var mobile_number = text.split(' ' || '+91').map(Number).filter(Boolean);
            var skills = _.filter(key_skills, (filtered_data) => {
                return text.match(new RegExp(filtered_data, 'gi'))
            })
            var male_gender = _.filter(candidate_gender_male, (filtered_data) => {
                return text.match(new RegExp(filtered_data, 'gi'))
            }).length

            var female_gender = _.filter(candidate_gender_female, (filtered_data) => {
                return text.match(new RegExp(filtered_data, 'gi'))
            }).length
            var qualifications = _.filter(qualification, (filtered_data) => {
                return text.match(new RegExp(filtered_data, 'gi'))
            })
            var gender = (male_gender > 0) ? 'male' : (female_gender > 0 ? 'female' : "")
            fs.unlink(filename, function() {
                var final_response = {
                    mobile_number: mobile_number,
                    skills: skills,
                    gender: gender,
                    qualification: qualifications,
                    dob: text.match(/\d{2}([\/.-])\d{2}\1\d{4}/g)
                }
                console.log(final_response)
                res.json({ data: final_response });
            })
        })

    })
})
module.exports = app;