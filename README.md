<<<<<<< HEAD



### INSTRUCTIONS ON HOW TO RUN THE PROGRAM

> Open the XAMPP application
> click start beside APACHE and MYSQL
> then, click the admin button beside MYSQL

------

> click new terminal
> type cd hoj_proj_main-main
> copy and paste this : Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass ---- then click ENTER
> copy and paste this : npm install then click ENTER 
> copy and paste this : npm start

--------

> open new terminal by clicking the plus icon on the upper right corner of the terminal.
> then type node server.js then click ENTER

### FOR THE DATABSE

> to import a file, click on the database okok
> click on SQL tab above
> Type: DROP TABLE cases;
> click GO button below
> click the import tab above
> upload the mysql file then scroll down and click the import button


## before running the website run this on powershell 
sample directory

cd "c:\Users\HP User\Desktop\OJT PROJECT 2026(1)"; npm install

cd "c:\Users\HP User\Desktop\OJT PROJECT 2026(1)"; npm start

-----------------------------------------------------------




# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
=======
# docket
OJT
>>>>>>> a323a8a17b97e84ae4b65b1ee39dafefb9b675b5




## To clone (pull) the repository for the first time:

cd "c:\Users\HP User\Desktop"
git clone https://github.com/jamesa4a1/OJT-project-2026.git "OJT PROJECT 2026(1)"





## hosts

App HOst- http://localhost:3000 





## to start the Host in powershell terminal

cd "c:\Users\HP User\Desktop\OJT PROJECT 2026(1)"; npm start 
 
## to start also this for databse connection

node server.js




## To pause/stop the servers:

In each terminal window where a server is running:

Press Ctrl+C

This will stop:

The React dev server (if running npm start)
The backend server (if running node server.js)
You can close the terminal windows after that. XAMPP can be stopped from the XAMPP Control Panel by clicking "Stop" on Apache and MySQL.

   





## command to push in github 

git add .
git commit -m "message of whats been changes"
git push origin main




## For future updates To pull (get latest changes):
To pull (get latest changes):

git pull





## if error ((push declined due to email privacy restrictions))

git config user.email "jamesa4a1@users.noreply.github.com"

git commit --amend --reset-author --no-edit
git push origin main





## Safe way to stop:

Stop the Node.js backend server first (port 5000)

Go to the terminal running node server.js
Press Ctrl+C to stop it
Stop the React frontend (port 3000)

Go to the terminal running npm start
Press Ctrl+C to stop it
Close XAMPP Control Panel

Click "Stop" on Apache and MySQL
Or close the control panel directly
Your data in the MySQL database is safely saved on disk
When you're ready to resume:

Open XAMPP Control Panel
Click "Start" for MySQL (at minimum)
Start the Node server: node server.js
Start React: npm start

