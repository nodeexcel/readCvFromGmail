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

var candidate_gender_female = [' female'],
    candidate_gender_male = [' male'],
    key_skills = ['php', 'js', 'javascript', 'html', 'jquery'],
    qualification = ['b.tech', 'mca', 'bca'],
    traning = ['traning', 'internship']

app.post("/upload/:pathname", function(req, res) {
    var filename = path.basename(req.params.pathname);
    filename = path.resolve(`./uploads`, filename);
    var dst = fs.createWriteStream(filename);
    req.pipe(dst);
    dst.on('drain', function() {
        req.resume();
    });
    req.on('end', function() {
        textract.fromFileWithPath(filename, function(error, text) {
            if (text) {
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
                        skills: skills,
                        gender: gender,
                        qualification: qualifications,
                        dob: text.match(/\d{2}([\/.-])\d{2}\1\d{4}/g)
                    }
                    res.json({ data: final_response });
                })
            } else {
                fs.unlink(filename, function() {
                    var final_response = {
                        skills: [],
                        gender: "",
                        qualification: [],
                        dob: []
                    }
                    res.json({ data: final_response });
                })
            }
        })

    })
})
module.exports = app;