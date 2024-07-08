Setup instructions
1. Clone the project
```
git clone https://github.com/Prajwal-2304/Classroom.git
```
2. Move into the directory
```
cd Classroom

3:If package.json doesnt exist enter the following code into the terminal
npm init

```
4. Install dependencies
```
npm install

5: Run the server

node app.js
```
6. if the server needs to be constantly restarted ie alternative to nodemon
```
node --watch app.js 
```

### Setting up the database 
1. Install postgress with default setup (remember the password used during setup)
```
https://www.postgresql.org/download/

2:Create a database using pgadmin (installed by default during installation of postgres)

3:Setting up dbConfig(in app.js)

const dbConfig = {
  user: "postgres",
  host: "localhost",
  database: "capitals", -change this to the database name set up by you
  password: "[{(4better)}]", - change this to tha password set up by you
  port: 5432,
};


4:Create a table named userlogin with the following code in the query tool

create table userlogin(
    uname varchar unique,
    upassword varchar,
    umode varchar,
    div varchar,
    subject varchar
    constraint sid unique (uname,div)  (add a comma here if an error occurs)
    constraint tid unique (div,subject)
);

5:Create the first admin using the following code in query tool 
insert into userlogin 
(uname,upassword,umode)values('adminaccountname','password','admin',')
(to find out the password follow the steps:
1:Enter an easy password in this step -> insert into userlogin 
(uname,upassword,umode)values('adminaccountname','password','admin',')

2:Then start the server and enter the login details 

3:Come back to VS code or check the console there itself to find the hashed password , copy the password 

4:Then execute the following command in the query tool :
delete from userlogin

5:Enter the following code into the query tool
insert into userlogin 
(uname,upassword,umode)values('adminaccountname','password','admin',') ->substituting the name of your choice to adminaccountname and the copied hash password with password 
)
a

6:Create a table named materials with the following code in query tool 
create table materials (
        d_id int unique,
        d_name varchar unique,
        doc bytea,
        div varchar,
        sec varchar
);

8:Pending jobs(please update as modified)

1-Addition of routes to the cie page (if needed)
2-CSS styling for all the pages as needed 
3-Route handling and creation of folders for students
