import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';

dotenv.config();

const app = express();  // Initialize `app` first

// Add CORS middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// (Optional) Function to verify Bearer token
function verifyBearerToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  if (token === process.env.AUTH_TOKEN) {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden: Invalid Token' });
  }
}

// Set up Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
  },
  pool: true, // Enable connection pooling
  maxConnections: 5, // Max simultaneous connections
  maxMessages: 10, // Max messages per connection
});

const getLocationFromLatLng = async (latitude, longitude, ip) => {
  if (!latitude || !longitude) {
    const ipurl = `https://api.ipgeolocation.io/ipgeo?apiKey=${process.env.IP_API_KEY}&ip=${ip}`;
    try {
      const response = await fetch(ipurl);
      const data = await response.json();
      console.log(data)
      if (data) {
        latitude = data.latitude;
        longitude = data.longitude;
      } else {
        console.error('No results found for IP location');
        return 'Unknown location';
      }
    } catch (error) {
      console.error('Error fetching location for IP:', error);
      return 'Unknown location';
    }
  }

  const geocodeUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
  try {
    const response = await fetch(geocodeUrl);
    const data = await response.json();
    //console.log(data);

    if (data && data.address) {
      const address = `${data.address[data.addresstype] || ''}, ${data.address.city || data.address.county || 'Unknown City'}, ${data.address.state || 'Unknown State'} ${data.address.postcode || ''}, ${data.address.country || 'Unknown Country'}`;
      return address;
    } else {
      console.error('No address found for coordinates');
      return 'Unknown location';
    }
  } catch (error) {
    console.error('Error fetching location from coordinates:', error);
    return 'Unknown location';
  }
};



app.post('/send-email', verifyBearerToken, async(req, res) => {
  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const { name, email, message, ip,useragent,Latitude,Longitude} = req.body;
  res.status(202).json({ message: 'Request received. Processing email...' });
  //console.log(req.body);
  //console.log(ip);
  //console.log(useragent);
  //console.log(clientIp);


  (async () => {
    try {
  const location =await getLocationFromLatLng(Latitude,Longitude,ip);
  //console.log(location);
  
  
  const mailToUser = {
    from: process.env.EMAIL_USERNAME,
    to: email,
    subject: `Hello ${name}, here is your message`,
    html: `
      <html>
        <head>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              margin: 0;
              padding: 0;
              background: linear-gradient(135deg, #ff6a00, #ee0979);
              color: #fff;
              height: 100%;
              text-align: center;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #fff;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
            }
            h1 {
              font-size: 2.5rem;
              color: #333;
              margin-top: 20px;
            }
            p {
              font-size: 1.1rem;
              line-height: 1.5;
              color: #333;
            }
            blockquote {
              font-style: italic;
              background: #f7f7f7;
              border-left: 5px solid #ff6a00;
              padding: 15px;
              margin: 20px 0;
              font-size: 1.2rem;
              color: #555;
            }
            .footer {
              font-size: 0.9rem;
              color: #aaa;
              background: linear-gradient(135deg, #ff6a00, #ee0979);
              margin-top: 30px;
              text-align: center;
            }
            .footer__social {
               margin-bottom: var(--mb-4);
                text-align: center;
            }
            .footer__icon {
              font-size: 1.5rem;
              margin: 0 var(--mb-2);
            }
            .cta-button {
              display: inline-block;
              background-color: #ff6a00;
              color: #FFFFFF;
              padding: 10px 25px;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
              margin-top: 30px;
              transition: background-color 0.3s ease;
            }
            .cta-button:hover {
              background-color: #ee0979;
            }
          </style>
        </head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
        <body>
          <div class="container">
            <h1>Thank you for reaching out, ${name}!</h1>
            <p>I received the following message from you:</p>
            <blockquote>${message}</blockquote>
            <p>We’ll be in touch soon.</p>
            <a href="https://sibikrish3000.github.io/" class="cta-button">Visit My Website</a>
            <div class="footer">
              <p>If you have any questions, feel free to reach out to me.</p>
                <div class="footer__social">
                  <a href="https://www.facebook.com/Sibikrish3000" class="footer__icon"><img src="https://img.icons8.com/?size=40&id=118497&format=png&color=000000" alt="Facebook" /></a>
                  <a href="https://www.instagram.com/wasperversa_302/" class="footer__icon"><img src="https://img.icons8.com/?size=40&id=32323&format=png&color=000000" alt="Instagram" /></a>
                  <a href="https://twitter.com/sibikrish3000" class="footer__icon"><img src="https://img.icons8.com/?size=38&id=phOKFKYpe00C&format=png&color=000000" alt="Twitter" /></a>
                </div>
              <p>&copy; Sibikrish. All rigths reserved ${new Date().getFullYear()}</p>
            <p style="color: rgb(79, 69, 69); font-size: 8pt;">
                This message was generated from:  
                <br><strong>IP Address:</strong> ${ip}  
                <br><strong>User Agent:</strong> ${useragent}  
                <br><strong>Location:</strong> ${location}
                <br><br>
                If this message was not sent by you via the portfolio website form, please reply to this email to notify us immediately.
              </p>
            </div>
            
          </div>
        </body>
      </html>
    `,
  };
  
  // transporter.sendMail(mailtouser, (error, info) => {
  //   if (error) {
  //     console.error(error);
  //     return res.status(500).json({ error: 'Failed to send email to user' });
  //   }
  //   res.status(200).json({ message: 'Email sent successfully to user' });
  // });


  const mailToMe = {
    from: process.env.EMAIL_USERNAME, // Send from your email (configured in .env)
    to: process.env.EMAIL_RECEIVE, // Replace with your email address
    subject: `New message from ${name}`,
    html: `
      <html>
        <head>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              margin: 0;
              padding: 0;
              background: #f3f4f6;
              color: #333;
              height: 100%;
              text-align: center;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background-color: #ffffff;
              padding: 30px;
              border-radius: 8px;
              box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
            }
            h1 {
              font-size: 2.5rem;
              color: #007bff;
              margin-top: 20px;
            }
            p {
              font-size: 1.1rem;
              line-height: 1.6;
              color: #333;
            }
            .message {
              font-style: italic;
              background: #f7f7f7;
              border-left: 5px solid #007bff;
              padding: 15px;
              margin: 20px 0;
              font-size: 1.2rem;
              color: #555;
            }
            .footer {
              font-size: 0.9rem;
              color: #FFFFFF;
              margin-top: 30px;
              text-align: center;
              background:linear-gradient(135deg, #0d1e76,#0d1730);

            }
            .cta-button {
              display: inline-block;
              background-color: #007bff;
              color: #FFFFFF;
              padding: 10px 25px;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
              margin-top: 30px;
              transition: background-color 0.3s ease;
            }
            .cta-button:hover {
              background-color: #0056b3;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>You have a new message from ${name}!</h1>
            <p>Here are the details of the message:</p>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <div class="message">
              <p><strong>Message:</strong></p>
              <blockquote>${message}</blockquote>
            </div>
            <a href="mailto:${email}" class="cta-button">Reply to Message</a>
            <div class="footer">
              <p style="color: #FFFFFF;">&copy; Sibikrish. All rigths reserved ${new Date().getFullYear()}</p>
              <p style="color: #786f78; font-size: 8pt;">
                User message was generated from:  
                <br><strong>IP Address:</strong> ${ip}  
                <br><strong>User Agent:</strong> ${useragent}  
                <br><strong>Location:</strong> ${location}
                <br><br>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
  // transporter.sendMail(mailtome, (error, info) => {
  //   if (error) {
  //     console.error(error);
  //     return res.status(500).json({ error: 'Failed to send email to dev' });
  //   }
  //   res.status(200).json({ message: 'Email sent successfully to dev' });
  // });

  await Promise.all([
    transporter.sendMail(mailToUser),
    transporter.sendMail(mailToMe),
]);} catch (error) {
  console.error('Error processing email:', error);
}

})();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
