//24 setup 41 view engine and session 57 get to home 64 get to login 70 get to userreg 
//83 post to login 134 get to logout 144 get to cd 168 get to cdms 222 get to cda
//233 get to cdm 279 delete 307 post to register 386 get to reset
//451 post to upload 488 get material id

//W


import express from "express";
import pg from "pg";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import session from "express-session";
import cookieParser from "cookie-parser";
import multer from "multer";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path'
import ExcelJS from 'exceljs'
import { render } from "ejs";
import nodemailer from 'nodemailer';
import env from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const dbConfig = {
  user: "postgres",
  host: "localhost",
  database: "capitals",
  password: "[{(4better)}]",
  port: 5432,
};

//configuring multer
const storage=multer.memoryStorage();
const upload =multer({storage});
env.config();

//configuring nodemailer
let transporter=nodemailer.createTransport({
  service:'gmail',
  auth:{
    user:process.env.SESSION_MAILID,
    pass:process.env.SESSION_PASS
  }
})




app.set('view engine','ejs')
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,'public')));
app.use(cookieParser());
app.use(
  session({
    secret:"strong-key",
    resave:false,
    saveUninitialized:true,
    cookie:{secure:false,
    maxAge:36000000
  //maxAge defines the duration of the session}
  }}
  )
)

////C:\Users\Asus\backend\Classroom\templates\Teacher template.xlsx
app.get("/download-template",(req,res)=>{
  const mode =req.query.param;
  let filename,filepath;
  if(mode=="student"){
   filepath='C:\\Users\\Asus\\backend\\Classroom\\templates\\Student template.xlsx';
  filename='Student template.xlsx';
  }else{
     filepath='\\Users\\Asus\\backend\\Classroom\\templates\\Teacher template.xlsx';
     filename='Teacher template.xlsx';
  }
  res.setHeader('Content-disposition', `attachment; filename=${filename}`);
  res.setHeader('Content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.download(filepath);

})

//get request to the homepage
app.get("/",(req,res)=>{
    res.render("home.ejs");
})


app.get("/views/attendance.ejs",(req,res)=>{
  res.render("attendance.ejs")
})


app.get("/views/cie.ejs",(req,res)=>{
  res.render("cie.ejs")
})
//get request to the login form
app.get("/login",(req,res)=>{
  res.render("login.ejs")
})


//get request to the user registration
app.get("/views/userreg.ejs",(req,res)=>{
  const usermode =req.session.mode;
  if(usermode=="admin"){
    res.render("userreg.ejs")
  }else{
    res.send("Not authenticated")
  }
})


//login page server code 
app.post("/login", async (req, res) => {
  const username = req.body["username"].trim();
  const password = req.body["password"].trim();
  
  const salt = await bcrypt.genSalt(5);
  const hash = await bcrypt.hash(password, salt);
  const db = new pg.Client(dbConfig);
  //console.log(hash);
 
  try {
      await db.connect();
      const result = await db.query("SELECT * FROM userlogin WHERE uname = $1", [username]);
      const storedHash = result.rows[0].upassword;
      const mode = result.rows[0].umode;
      const sec = result.rows[0].div;
      const sub=result.rows[0].subject;
      req.session.username=username;
      req.session.mode=mode;
      req.session.sub=sub;
      if(mode==="student"){
        req.session.sec=sec;
      }
      //passing the classes the teacher handles
      const classes =await db.query("Select div from userlogin WHERE uname=$1",[username]);
      
      if (await bcrypt.compare(password, storedHash)) {
        if(mode=='admin'){
          res.render("homepg.ejs");
        }else{
        
        res.render("cd.ejs",{pageTitle:username,mode:req.session.mode,classList:classes.rows})
        } 
      } else {
          res.send("Username or password doesn't match");
          return; // Exit the function early if password doesn't match
      }
  } catch (err) {
      console.error("Error carrying out the query", err);
      res.status(500).send("Internal Server Error");
      return; // Exit the function early in case of an error
  } finally {
      db.end((endErr) => {
          if (endErr) {
              console.error("Connection couldn't be terminated");
          } else {
              console.log("Connection closed successfully");
          }
          
      });
  }
});

app.get("/logout.ejs",(req,res)=>{
  req.session.destroy();
  res.redirect("/login")
})





//handles get requests to cd
app.get("/views/cd.ejs",(req,res)=>{ 
  const div=req.query.div;
 
  req.session.sec=div;
  //const username=req.session.username;
  console.log(div)
  res.render("cd.ejs",{pageTitle:'admin',mode:req.session.mode,classList:[]})
})

//verification for usermode
app.get("/views/cdc",(req,res)=>{
  const usermode=req.session.mode;
  if(usermode==='teacher'){
    res.redirect("cdm.ejs")
  }else{
    res.redirect("cdms.ejs")
  }
})


//rendering material for cd students
app.get("/views/cdms.ejs", async (req, res) => {
  const db = new pg.Client(dbConfig);
  const usersec = req.session.sec;
  const userSub = req.query.subject; // Retrieve subject from query parameter
   console.log("User Division:", usersec);
   console.log("User Subject:", userSub);
  let noMaterials = false;

  try {
    await db.connect();
    console.log("Connected to the database");

    // Retrieve materials
    const materialsResult = await db.query("SELECT d_id, d_name, sec, announcement FROM materials WHERE (div, subject)=($1, $2)", [usersec, userSub]);
    const materials = materialsResult.rows;

    // Group materials by announcement
    const announcementsMap = new Map();
    materials.forEach(material => {
        const announcementKey = material.announcement;
        if (!announcementsMap.has(announcementKey)) {
            announcementsMap.set(announcementKey, []);
        }
        announcementsMap.get(announcementKey).push(material);
    });

    const announcements = Array.from(announcementsMap, ([announcement, materials]) => ({ announcement, materials }));

    res.render("cdms.ejs", { announcements });
} catch (error) {
    console.error("Error:", error);
    res.status(500).send("Server error");
} finally {
    // Close the database connection
    db.end();
}

});


app.get("/views/class.ejs",(req,res)=>{
  const div=req.query.div;
  req.session.sec=div;
  res.render("class.ejs",{section:div})
})


//get request to attendance page
app.get("/views/cda.ejs",(req,res)=>{
  const usermode=req.session.mode;
  if(usermode==='admin'||usermode==='teacher'){
    res.render("cda.ejs")
  }else{
    res.send("Unauthorized access")
  }
})


app.get("/views/cdm.ejs", async (req, res) => {
  const db = new pg.Client(dbConfig);
  const usersec = req.session.sec;
  const sub = req.session.sub;
  console.log(req.session.mode)
  if(req.session.mode!=="teacher"){
    res.redirect("/login");
    return;
  }

  try {
      await db.connect();
      console.log("Connected to the database");

      // Retrieve materials with announcements
      const materialsResult = await db.query("SELECT d_id, d_name, sec, announcement FROM materials WHERE (div, subject)=($1, $2)", [usersec, sub]);
      const materials = materialsResult.rows;

      // Group materials by announcement
      const announcementsMap = new Map();
      materials.forEach(material => {
          const announcementKey = material.announcement;
          if (!announcementsMap.has(announcementKey)) {
              announcementsMap.set(announcementKey, []);
          }
          announcementsMap.get(announcementKey).push(material);
      });

      const announcements = Array.from(announcementsMap, ([announcement, materials]) => ({ announcement, materials }));

      res.render("cdm.ejs", { announcements });
  } catch (error) {
      console.error("Error:", error);
      res.status(500).send("Server error");
  } finally {
      // Close the database connection
      db.end();
  }
});










//deleting code 
app.delete('/delete_material/:materialId',async (req,res)=>{
  const m_id=parseInt(req.params.materialId);
  const db=new pg.Client(dbConfig);
  try{
      await db.connect();
      const success= await db.query("DELETE  FROM materials WHERE d_id =$1",[m_id]);
      if(success.rowCount>0){
        res.json({ success: true, message: 'Material deleted successfully' });
  } else{
    res.status(404).json({ success: false, message: 'Material not found' });
  }
  }catch(error){
    console.error('Error executing DELETE query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }finally{
    db.end((endErr) => {
      if (endErr) {
        console.error("Connection couldn't terminate", endErr);
      } else {
        console.log("Connection terminated successfully");
      }
    });
  }
  
})

app.delete('/delete_section/:announcement', async (req, res) => {
  const announcement = decodeURIComponent(req.params.announcement);
  const ann=announcement.replace(/\s+/g,"").toLowerCase();
  const db=new pg.Client(dbConfig)
  console.log(announcement)
  try {
      await db.connect();
      await db.query('DELETE FROM materials WHERE delannounce = $1', [ann]);
      console.log("Deletion successfull")
      res.json({ message: 'Section and associated materials deleted successfully' });
  } catch (error) {
      console.error('Error deleting section and materials:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
  finally{
    db.end((endErr) => {
      if (endErr) {
        console.error("Connection couldn't terminate", endErr);
      } else {
        console.log("Connection terminated successfully");
      }
    });
  }
});



const pool = new pg.Pool(dbConfig);

app.post("/register", upload.single('excelFile'), async (req, res) => {
  const client = await pool.connect();

  try {
    const fileBuffer = req.file.buffer;

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);
    const worksheet = workbook.getWorksheet(1);

    await client.query('BEGIN');

    const promises = [];

    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);

      const username = String(row.getCell(1).value).trim();
      const password = String(row.getCell(2).value).trim();
      const type = String(row.getCell(3).value).trim();
      const sec = String(row.getCell(4).value).trim();
      const sub = String(row.getCell(5).value).trim();
      

      const passwordString = String(password);

      try {
        const saltRounds = 5;
        const salt = await bcrypt.genSalt(saltRounds);
        const hash = await bcrypt.hash(passwordString, salt);

        let queryText, queryParams;

        if (type === "teacher") {
          queryText = `
            INSERT INTO userlogin (uname, upassword, umode, div, subject)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (div, subject) DO NOTHING`;
          queryParams = [username, hash, type, sec, sub];
        } else {
          queryText = `
            INSERT INTO userlogin (uname, upassword, umode, div)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (uname,div) DO NOTHING`;
          queryParams = [username, hash, type, sec];
        }

        const queryPromise = client.query(queryText, queryParams)
          .then(result => {
            // Check if the row was actually inserted
            if (result.rowCount === 1) {
              console.log(`User ${username} inserted successfully`);
            } else {
              console.log(`User ${username} already exists or conflict occurred`);
              // Handle conflict response
              res.status(409).json({ error: `User ${username} already exists or conflict occurred` });
            }
          });
        promises.push(queryPromise);
      } catch (hashError) {
        console.error('Error hashing password for user', username, hashError);
      }
    }

    await Promise.all(promises);
    await client.query('COMMIT');
    console.log("Data inserted successfully");
    res.render("homepg.ejs");
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Error processing Excel file", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  } finally {
    client.release();
    console.log("Connection released");
  }
});

app.get("/views/reset.ejs", (req, res) => {
  const errorMessage = req.query.error ? 'An error occurred during password reset.' : '';
  const successMessage = req.query.success ? 'Password reset successfully.' : '';

  res.render("reset.ejs", { errorMessage, successMessage });
});


app.post('/reset-password', async (req, res) => {
  const username = req.body.username.trim();
  const oldPassword = req.body.oldPassword.trim();
  const newPassword = req.body.newPassword.trim();
  const confirmPassword = req.body.confirmPassword.trim();

  // Validate new password and confirmation
  if (newPassword !== confirmPassword) {
    return res.redirect('/views/reset.ejs?error=Passwords do not match');
  }

  const db = new pg.Client(dbConfig);

  try {
    await db.connect();

    // Retrieve the old password from the database
    const result = await db.query("SELECT upassword FROM userlogin WHERE uname = $1", [username]);

    if (result.rows.length === 0) {
      return res.redirect('/views/reset.ejs?error=User not found');
    }

    const oldHash = result.rows[0].upassword;

    // Compare the old password with the provided old password
    const isOldPasswordValid = await bcrypt.compare(oldPassword, oldHash);

    if (!isOldPasswordValid) {
      return res.redirect('/views/reset.ejs?error=Incorrect old password');
    }

    // Update password in the database based on the username
    const newSalt = await bcrypt.genSalt(5);
    const newHash = await bcrypt.hash(newPassword, newSalt);

    await db.query("UPDATE userlogin SET upassword = $1 WHERE uname = $2", [newHash, username]);

    res.redirect('/views/reset.ejs?success=Password reset successfully');
  } catch (err) {
    console.error('Error carrying out the query', err);
    res.redirect('/views/reset.ejs?error=Internal Server Error');
  } finally {
    db.end((endErr) => {
      if (endErr) {
        console.error('Connection couldn\'t be terminated');
      } else {
        console.log('Connection closed successfully');
      }
    });
  }
});



app.post('/upload_material', upload.array('materialUpload[]', 10), async (req, res) => {
  const usermode = req.session.mode;
  const usersec = req.session.sec;
  const sub = req.session.sub;

  if (usermode !== 'teacher') {
      return res.send("Unauthorized action");
  }

  const announcement = req.body.announcement;
  const fileSec = req.body.sec;
  const ann=announcement.replace(/\s+/g,"").toLowerCase();   
  const db = new pg.Client(dbConfig);

  try {
      await db.connect();

      if (announcement && req.files.length === 0) {
         
          await db.query('INSERT INTO materials (div,subject,announcement,delannounce) VALUES ($1,$2,$3,$4)', [usersec,sub,announcement,ann]);
      } else if (req.files.length > 0) {
          for (const file of req.files) {
              const fileName = file.originalname;
              const fileData = file.buffer;

              await db.query('INSERT INTO materials (d_name, doc, div, subject, sec,announcement,delannounce) VALUES ($1, $2, $3, $4, $5,$6,$7)', [fileName, fileData, usersec, sub, fileSec,announcement,ann]);
          }
      }
      let mail={}
      const username=req.session.username;
      if(usersec==="CY"){
      mail={
        from:process.env.SESSION_MAILID,
        to:[],
        subject:`You have a new announcement in ${sub} from ${username} `,
        text:`${announcement}`

      }
    }
    else{
      mail={
      from:process.env.SESSION_MAILID,
      to:[],
      subject:`You have a new announcement in ${sub} from ${username} `,
      text:`${announcement}`
      }
    }
      transporter.sendMail(mail,(error,info)=>{
        if(error){
          return console.log(error);
        }
      })

      res.redirect(`/views/cdm.ejs?div=${encodeURIComponent(usersec)}`);
  } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  } finally {
      db.end((endErr) => {
          if (endErr) {
              console.error("Connection couldn't terminate", endErr);
          } else {
              console.log("Connection terminated successfully");
          }
      });
  }
});


    




  app.get('/material/:id', async (req, res) => {
    const materialId = req.params.id;
    const db = new pg.Client(dbConfig);

    try {
        await db.connect();
        const result = await db.query('SELECT d_name, doc FROM materials WHERE d_id = $1', [materialId]);
        const material = result.rows[0];
        if (!material) {
            res.status(404).send('Material not found');
            return;
        }
        if (material.doc !== undefined && material.doc !== null) {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `inline; filename="${material.d_name}"`);
          res.send(material.doc);
      } else {
          res.status(204).end(); // No Content
      }
      
    } catch (error) {
        console.error('Error retrieving material:', error);
        res.status(500).send('Internal Server Error');
    } finally {
        db.end();
    }
});

  


    app.listen(3000, () => {
      console.log("Server open..");
    });
