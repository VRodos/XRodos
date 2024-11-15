XRodos

A plugin for WordPress to transform your website into an authoring tool for 3D digital worlds with XR capabilities

Features

- 3D Format support: GLB (To be expanded).
- Supports sound

Interface Pages


- Project Manager
- Asset List
- Asset Editor
- Scene 3D Editor


### Do you have a demo?

* https://vrodos.iti.gr

* (Use Chrome or Firefox)


### Installation instructions ###

**Prerequisites:**
* Apache 2,
* MySQL 5,
* WordPress 6,
* Php 7,
* Node.js 16


**Instructions for installation in WordPress**

- Download as zip
- Rename XRodos-master.zip to XRodos.zip
- Also rename the folder XRodos-master inside the zip file to XRodos.

- Install XRodos.zip from WordPress dashboard with "ADD from file" button in install new plugins.

- Load modules through NPM

  -- In root folder `XRodos` run `npm install`.

- Set permalinks to Day / Name (2nd option)
- Add to menu
  -- Assets List Page
  -- Project Manager page

  

### Servers install and run

Two types of servers are needed:

- Apache server
    - Server is used for the content of the scenes.
    - Server contains also mysql server which is needed for WordPress to work (and somewhere to save the data).
- Node.js server for Networked-Aframe. To start Node.js server
    1) Go to networked-aframe/server and type:
       > npm install --force

        - Force is needed because some packages are obsolete

    2) A WebRTC TURN server is used for the collaborative functionality of XROdos. Create a free account for OpenRelay, and save server keys in a json file. 
        - Go to: https://dashboard.metered.ca/signup?tool=turnserver
        - Create a free account.
        - On your dashboard create an App.
        - Add Credential, then on the created entry click on Instructions.
        - Create a `keys.json` file inside folder `networked-aframe/server` and add all objects from array into the json file like this:

       ```
        {
            "iceServers": [
            {
                "urls": "stun:stun.relay.metered.ca:80"
            },
            {
                "urls": "turn:a.relay.metered.ca:80",
                "username": "*********",
                "credential": "******"
            },
            {
                "urls": "turn:a.relay.metered.ca:80?transport=tcp",
                "username": "******",
                "credential": "******"
            },
            ...
            ]
        }
        ```

    3) Run server using a port number you want, or leave it blank for default port (5832):
       > node .\easyrtc-server.js port_number
        
       Examples:
       
       `node .\easyrtc-server.js`
       
        Runs in default port 5832.
    
       `node .\easyrtc-server.js 5840`
       
        Runs in port passed as argument 5840
    
    Now after building a scene in the 3D editor, the collaborative functionality between users is enabled. 
        

### Troubleshooting

* Wordpress API is not working :  Settings -> Permalinks -> Post name (as Structure)


* CORS
  You need wordpress at port 80 (apache2 standard) to allow to give content to aframe at node.js server at port 5832, or whichever port you have used when running easyRTC service.

####Add this to .htaccess

`<IfModule mod_headers.c>`

	Header set Access-Control-Allow-Origin "*"

`</IfModule>`

#### Big 3D models

  Add these to .htaccess to allow big files to be uploaded to wordpress

    - php_value upload_max_filesize 512M
    - php_value post_max_size 512M
    - php_value memory_limit 1024M
    - php_value max_execution_time 1800
    - php_value max_input_time 1800
    - php_value max_input_vars 4000
