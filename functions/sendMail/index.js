const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");

/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
exports.sendMail = async (req, res) => {
  if (process.env.HASURA_CLOUD_FUNCTION_SECRET == req.headers.secret) {
    const subject = req.body.event.data.new.subject;
    const text = req.body.event.data.new.content;
    const to = req.body.event.data.new.to;
    const replyTo = req.body.event.data.new.replyTo;
    const from = process.env.HASURA_MAIL_USER;
    const from_pw = process.env.HASURA_MAIL_PW;
    const cc = req.body.event.data.new.cc;
    const bcc = req.body.event.data.new.bcc;
    
    
    let transporter = nodemailer.createTransport({
      host: "sslout.df.eu",
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: from, 
        pass: from_pw, 
      },
    });
    
    let info = await transporter.sendMail({
      from: from, 
      to: to,
      cc: cc,
      bcc: "sent-mail@edu.opencampus.sh," + bcc,
      replyTo: replyTo,
      subject: subject, 
      text: text, 
      html: text,
      dsn: {
        id: to,
        return: 'headers',
        notify: ['failure', 'delay', 'success'],
        recipient: 'sent-mail@edu.opencampus.sh'
      },
    });

    console.log("Message sent: " + to + " id:" + info.messageId);
    
    
    return res.json({
      
      message: info.messageId
    });
  }
};
