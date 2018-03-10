const http = require("http");
const express = require("express");
const Imap = require("imap");
const app = express();
app.server = http.createServer(app);
const path = require("path");
const fs = require("fs");
const base64 = require("base64-stream");
const textract = require("textract");
const _ = require("lodash");
app.listen(8055);
let candidate_gender_female = ['female', 'kumari'],
    candidate_gender_male = ['male', 'kumar'],
    key_skills = ['php', 'js', 'javascript', 'html', 'jquery'],
    qualification = ['b.tech', 'mca', 'bca'],
    traning = ['traning', 'internship']
let findAttachmentParts = (struct, attachments) => {
    attachments = attachments || [];
    var len = struct.length;
    for (var i = 0; i < len; ++i) {
        if (Array.isArray(struct[i])) {
            findAttachmentParts(struct[i], attachments);
        } else if (struct[i].disposition && ["INLINE", "ATTACHMENT"].indexOf(struct[i].disposition.type) > 0) {
            attachments.push(struct[i]);
        }
    }
    return attachments;
}

let filesave = (stream, filepath, filename, encoding) => {
    return new Promise((resolve, reject) => {
        var writeStream = fs.createWriteStream(filepath);
        writeStream.on("finish", function() {
            fs.readFile(filename, {
                encoding: encoding
            }, function() {
                resolve(fs);
            });
        });
        if (encoding === "BASE64") {
            stream.pipe(base64.decode()).pipe(writeStream);
        } else {
            stream.pipe(writeStream);
        }
    })
}

let getAttachment = (imap, uid, status) => {
    return new Promise((resolve, reject) => {

        attach = [];

        function openInbox(cb) {
            imap.openBox("INBOX", true, cb);
        }
        imap.once("ready", function() {
            openInbox(function() {
                let a_attachments = '';
                let a_attrs = ''
                var f = imap.fetch(uid, {
                    bodies: ["HEADER.FIELDS (FROM TO SUBJECT BCC CC DATE)", "TEXT"],
                    struct: true
                });
                f.on("message", function(msg, seqno) {
                    var prefix = "(#" + seqno + ") ";
                    msg.once("attributes", function(attrs) {
                        const attachments = findAttachmentParts(attrs.struct);
                        a_attachments = attachments;
                        a_attrs = attrs;
                    });
                    msg.once("end", function() {
                        console.log("Finished");
                    });
                });
                f.once("error", (err) => {
                    reject("Fetch error: " + err);
                });

                function saveData(imap, attachments, attrs) {
                    var uid = attrs.uid;
                    var flag = attrs.flags;
                    var length = attachments.length
                    if (attachments[0] == null) {
                        resolve(attach)
                    } else {
                        var attachment = attachments.splice(0, 1);
                        var f = imap.fetch(attrs.uid, {
                            bodies: [attachment[0].partID],
                            struct: true
                        });
                        f.on('message', (msg, seq) => {
                            msg.on("body", function(stream) {
                                var filename = attachment[0].disposition.params.filename;
                                var encoding = attachment[0].encoding;
                                var myDir = __dirname + "/uploads";
                                if (!fs.existsSync(myDir)) {
                                    fs.mkdirSync(myDir);
                                }
                                filepath = path.join(__dirname, "/uploads/", filename);
                                filesave(stream, filepath, filename, encoding)
                                    .then((data) => {
                                        if (path.extname(filepath) == ".docx") {
                                            fs.rename(filepath, replaceExt(filepath, '.doc'), function(err) {
                                                if (err) {
                                                    console.log('ERROR: ' + err);
                                                    reject(err);
                                                }
                                                filepath = replaceExt(filepath, '.doc');
                                                filename = replaceExt(filename, '.doc');
                                                console.log('upload data to deive');
                                                if (status) {
                                                    resolve(filepath)
                                                }
                                            })
                                        } else {
                                            if (status) {
                                                resolve(filepath)
                                            }

                                        }
                                    }).catch((err) => { reject(err) })
                            })
                        })
                    }
                }
                f.once("end", () => {
                    saveData(imap, a_attachments, a_attrs)
                });
            });
        });
        imap.once("error", (err) => {
            console.log('imap connection error', err);
            reject(err);
        });
        imap.once("end", () => {
            console.log("Connection ended");
        });
        imap.connect();

    })
}

let readCV = (filepath) => {
    return new Promise((resolve, reject) => {
        textract.fromFileWithPath(filepath, function(error, text) {
            console.log(error, text)
            let mobile_number = text.split(' ' || '+91').map(Number).filter(Boolean);
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
            fs.unlink(filepath, function() {
                console.log("success");
                let final_response = {
                    mobile_number: mobile_number,
                    skills: skills,
                    gender: gender,
                    qualification: qualifications,
                    dob: text.match(/\d{2}([\/.-])\d{2}\1\d{4}/g)
                }
                resolve(final_response)
            })
        })
    });
}

app.get("/echo/data", function(req, res) {
    res.json({ data: "hello" })
    var imap = new Imap({
        user: "testhr69@gmail.com",
        password: 'testhr69',
        host: "imap.gmail.com",
        port: 993,
        tls: "TLS",
    });
    getAttachment(imap, 3227, true).then((response) => {
        readCV(response).then((data) => {
            console.log(data)
        })
    })
})
module.exports = app;