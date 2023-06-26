const express = require("express");
const fileupload = require("express-fileupload");
const nodemailer = require('nodemailer');
const fs = require('fs');

const app = express();
app.use(express.static('public'));
app.use(express.json());
app.use(fileupload());
app.use(express.urlencoded({extended: true}));
app.set('view engine', 'ejs');

var headerLogoUrl = '';
var headerLogoHeight = 50;
var storeMainContent = '';
var storeCTAButton = '';
var storeFooterContent = '';
var storeBackgroundColor = '#f5f5dc';
var storeBodyColor = '#bdb76b';
var previewURL = '';

app.get("/", function(req, res) {
    res.sendFile(__dirname + "/welcome.html");
    let filePath = 'temp_user_data/headerLogo.png';
    fs.access(filePath, error => {
        if (!error) {
          fs.unlink(filePath,function(error){
           if(error) console.error('Error Occured:', error);
            console.log('File deleted!');
           });
          } else {
            console.error('Error Occured:', error);
          }
    });
    
    filePath = 'temp_user_data/testmail.html';
    fs.access(filePath, error => {
        if (!error) {
          fs.unlink(filePath,function(error){
           if(error) console.error('Error Occured:', error);
            console.log('File deleted!');
           });
          } else {
            console.error('Error Occured:', error);
          }
    });
});
app.get("/template", async function(req, res) { res.render('template', {headerLogoUrl: headerLogoUrl, headerLogoHeight: headerLogoHeight}); });
app.get('/public/assets/strong.png', function(req, res) {res.sendFile(__dirname + "/public/assets/strong.png");});
app.get('/public/styles/styles.css', function(req, res) {res.sendFile(__dirname + "/public/styles/styles.css");});
app.get('/temp_user_data/testmail.html', function(req, res) {res.sendFile(__dirname + "/temp_user_data/testmail.html");});

require("dotenv").config();
const cloudinary = require("cloudinary").v2;
console.log(cloudinary.config().cloud_name); // logging cloudinary configuration cloud name

async function uploadImage(imageUrl) {
    await cloudinary.uploader.upload(imageUrl, {resource_type: "image",})
    .then((result) => { console.log("success", JSON.stringify(result, null, 2)); headerLogoUrl = result.secure_url; })
    .catch((error) => { console.log("error", JSON.stringify(error, null, 2));});
}

app.post('/headerLogoUpload', async function (req, res) {
    const targetPath = 'temp_user_data/headerLogo.png';
    req.files.headerLogo.mv(targetPath, (error) => {
        if (error) {
            console.error(error);
            return res.status(500).send('Failed to move the file.');
        }
    });
    console.log(">> Header logo recieved by the server");
    await uploadImage(targetPath);
    console.log(req.files.headerLogo);
    headerLogoHeight = req.body.headerLogoHeight;
    res.render('template', {headerLogoUrl: headerLogoUrl, headerLogoHeight: headerLogoHeight})
});

app.post('/mainContentLoad', async function(req, res) {
    storeMainContent = req.body.content;
    console.log(">> Main content recieved by server");
    res.sendStatus(200);
});

app.post('/mainContentReset', async function(req, res) {
    storeMainContent = "";
    console.log('>> Main content reset successfully');
    res.sendStatus(200);
});

app.post('/CTALoad', async function(req, res) {
    const CTAContent = req.body.buttonContent;
    const CTAStyle = req.body.buttonStyle;
    const CTALink = req.body.buttonLink;
    storeCTAButton = "<button style='" + CTAStyle + "'><a href='" + CTALink + "' style='text-decoration: none; color: black; '>" + CTAContent + "</a></button>";
    console.log(">> CTA button content recieved by server");
    res.sendStatus(200);
});

app.post('/CTAReset', async function(req, res) {
    storeCTAButton = "";
    console.log('>> CTA Button reset successfully');
    res.sendStatus(200);
});

app.post('/footerContentLoad', async function(req, res) {
    storeFooterContent = req.body.footerContent;
    console.log('>> Footer content recieved by server');
    res.sendStatus(200);
});

app.post('/footerContentReset', async function(req, res) {
    storeFooterContent = "";
    console.log('>> Footer reset successfully');
    res.sendStatus(200);
});

app.post('/changeTheme', async function(req, res) {
    storeBackgroundColor = req.body.backgroundColor;
    storeBodyColor = req.body.bodyColor;
    console.log('>> Change Theme request recieved')
    res.sendStatus(200);
})

app.post('/sendTestMail', async function(req, res) {
    var headerLogoElement = '<div style="width: 25%; display: flex; flex-direction: column; align-items: center; margin-top: 2rem; margin-bottom: 0.5rem;"><img src="' + headerLogoUrl + '" alt="header logo" style="max-width: 100%;" height="' + headerLogoHeight + '"></div>'
    var mainContentElement = '<div style="width: 90%; margin-top: 1rem; margin-bottom: 1rem;">' + storeMainContent + '</div>';
    var CTAElement = '<div style="display: flex; flex-direction: column; align-items: center; max-width: 50%; margin-top: 0.5rem; margin-bottom: 1rem;">' + storeCTAButton + '</div>';
    var footerElement = '<div style="max-width: 40%; display: flex; flex-direction: column; align-items: center; margin-top: 1.5rem; margin-bottom: 1.5rem; font-size: smaller; ">' + storeFooterContent + '</div>';
    var mainElement = '<div style="width: 50%; display: flex; flex-direction: column; align-items: center; border-radius: 10px; background-color: ' + storeBodyColor + '">' + mainContentElement + CTAElement + '</div>';
    var fullMailElement = '<div style="width: 100%; display: flex; flex-direction: column; align-items: center; background-color: ' + storeBackgroundColor + '">' + headerLogoElement + mainElement + footerElement + '</div>';

    const targetPath = 'temp_user_data/testmail.html';
    fs.writeFile(targetPath, fullMailElement, function(err) {
        if (err) {
            return console.log(err);
        }
        console.log('mail content saved successfully');
    });

    console.log('>> Send Test Mail request recieved');
    let senderaddress = req.body.sender;
    let recieveraddress = req.body.reciever;
    
    try {
        const testAccount = await nodemailer.createTestAccount();

        const transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email', 
            port: 587,
            auth: { user: testAccount.user, pass: testAccount.pass }
        });

        const info = await transporter.sendMail({
            from: senderaddress,
            to: recieveraddress,
            subject: 'Hello from my project MAIL',
            text: 'This is a test mail.',
            html: fullMailElement
        });

        console.log('Email sent: ', info.messageId);
        console.log('Preview URL: ', nodemailer.getTestMessageUrl(info));
        previewURL = nodemailer.getTestMessageUrl(info);
        headerLogoUrl = "";
        headerLogoHeight = 50;
    } catch (error) { console.log("Error: ", error);}
});

app.get('/downloadHTML', function (req, res) {
    res.download('temp_user_data/testmail.html');
})

app.post('/viewPreview', async function(req, res) {
    res.json({ previewURL });
})



app.listen(process.env.PORT || 3000, function () {  console.log("Server up and running."); });