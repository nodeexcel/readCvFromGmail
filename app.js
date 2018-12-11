const http = require("http");
const express = require("express");
const app = express();
app.server = http.createServer(app);
const path = require("path");
const fs = require("fs");
const textract = require("textract");
const _ = require("lodash");

app.listen(4000);
console.log("app is listen on port:", 4000);

var candidate_gender_female = [' female', 'female'],
    candidate_gender_male = [' male'],
    key_skills = ['php', 'js', 'javascript', 'html', 'jquery'],
    qualification = ['b.tech', 'mca', 'bca'],
    traning = ['traning', 'internship']

function min_date(all_dates) {
    var min_dt = all_dates[0],
        min_dtObj = new Date(all_dates[0]);
    all_dates.forEach(function(dt, index) {
        if (new Date(dt) < min_dtObj) {
            min_dt = dt;
            min_dtObj = new Date(dt);
        }
    });
    return min_dt;
}

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
            var docString = `'${text.replace(/[^\w\s]/gi, '').toUpperCase()}'`;
            // var docString = `'${text.replace(/[^a-zA-Z ]/g, "").toUpperCase()}'`;
            var gender = docString.includes("FEMALE")? 'female' : (docString.includes("MALE")? 'male' : '')
            if (text) {
                console.log(text, "text")
                var skills = _.filter(key_skills, (filtered_data) => {
                    return text.match(new RegExp(filtered_data, 'gi'))
                })

                // var female_gender = _.filter(candidate_gender_female, (filtered_data) => {
                //     return text.match(new RegExp(filtered_data, 'gi'))
                // }).length
                // if (!female_gender) {
                //     var male_gender = _.filter(candidate_gender_male, (filtered_data) => {
                //         return text.match(new RegExp(filtered_data, 'gi'))
                //     }).length
                // }
                var qualifications = _.filter(qualification, (filtered_data) => {
                    return text.match(new RegExp(filtered_data, 'gi'))
                })
                var dob = text.match(/\d{2}([\/.-])\d{2}\1\d{4}/g);
                if (dob != null && dob.length > 1) {
                    dob = min_date(dob)
                    console.log(dob, "=================")
                }
                // var gender = (male_gender > 0) ? 'male' : (female_gender > 0 ? 'female' : "")
                fs.unlink(filename, function() {
                    var final_response = {
                        skills: skills,
                        gender: gender,
                        qualification: qualifications,
                        dob: (dob != null && dob.length == 1) ? dob : null
                    }
                    console.log(final_response, "response")
                    res.json({ data: final_response });
                })
            } else {
                console.log(error, "error")
                fs.unlink(filename, function() {
                    var final_response = {
                        skills: [],
                        gender: "",
                        qualification: [],
                        dob: null
                    }
                    res.json({ data: final_response });
                })
            }
        })

    })
})
module.exports = app;