Correct Onboarding Workflow
Set static IP on their PC (they do this, or you do it for them)

Settings → Wi-Fi → Manual IPv4
Assign them a unique IP like 192.168.1.25
Add IP to whitelist (you do this on the main PC)

Edit whitelist.json or use the API
Run docker restart ocp_backend_api
Create user account (in Admin Dashboard)

Go to Admin Dashboard → Manage Users → Add New User
Enter their Name, Email, Password, Role
Click Save
Give them the credentials

Share their email and password
Tell them to access: http://192.168.1.15 (the main PC's IP)
They log in with the credentials you created
